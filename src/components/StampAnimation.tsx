import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Easing
} from 'react-native';
import { useTheme } from '@react-navigation/native';

interface StampAnimationProps {
  onComplete?: () => void;
  goalTitle: string;
  mood?: string;
}

export const StampAnimation: React.FC<StampAnimationProps> = ({ 
  onComplete, 
  goalTitle,
  mood = 'happy'
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      'excited': '😆',
      'happy': '😊',
      'motivated': '💪',
      'focused': '🎯',
      'refreshed': '✨',
      'neutral': '😐',
      'tired': '😴',
      'sleepy': '😪',
      'stressed': '😰'
    };
    return moodMap[mood] || '😊';
  };

  const getMoodColor = (mood: string) => {
    const colorMap: { [key: string]: string } = {
      'excited': '#FF6B6B',
      'happy': '#4ECDC4',
      'motivated': '#45B7D1',
      'focused': '#96CEB4',
      'refreshed': '#FECA57',
      'neutral': '#A0A0A0',
      'tired': '#6C5CE7',
      'sleepy': '#FD79A8',
      'stressed': '#E17055'
    };
    return colorMap[mood] || '#4ECDC4';
  };

  useEffect(() => {
    const animationSequence = Animated.sequence([
      // フェードイン
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // スタンプが押される動画（スケール）
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // 少し縮む
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      // 最終サイズにバウンス
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      // バウンス効果
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
    ]);

    animationSequence.start(() => {
      // アニメーション完了後、少し待ってからコールバック実行
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 800);
    });
  }, [scaleAnim, rotateAnim, fadeAnim, bounceAnim, onComplete]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      
      {/* 背景エフェクト */}
      <View style={styles.effectContainer}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { 
                    translateX: Math.cos(index * 60 * Math.PI / 180) * 80 
                  },
                  { 
                    translateY: Math.sin(index * 60 * Math.PI / 180) * 80 
                  },
                ],
              }
            ]}
          >
            <Text style={styles.sparkleText}>✨</Text>
          </Animated.View>
        ))}
      </View>

      {/* メインスタンプ */}
      <Animated.View
        style={[
          styles.stampContainer,
          {
            backgroundColor: getMoodColor(mood),
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
              { translateY: bounceTranslate },
            ],
          },
        ]}
      >
        <View style={styles.stampContent}>
          <Text style={styles.stampDate}>
            {new Date().getDate()}
          </Text>
          <Text style={styles.stampEmoji}>
            {getMoodEmoji(mood)}
          </Text>
        </View>
        
        {/* スタンプ周りのリング */}
        <View style={[styles.stampRing, { borderColor: getMoodColor(mood) }]} />
      </Animated.View>

      {/* 完了メッセージ */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: bounceTranslate }],
          }
        ]}
      >
        <Text style={[styles.messageTitle, { color: colors.text }]}>
          🎉 スタンプゲット！
        </Text>
        <Text style={[styles.messageSubtitle, { color: colors.text }]}>
          {goalTitle}
        </Text>
        <Text style={[styles.messageDescription, { color: colors.text }]}>
          素晴らしい継続力です！
        </Text>
      </Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  effectContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 20,
    textAlign: 'center',
  },
  stampContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    marginBottom: 40,
  },
  stampContent: {
    alignItems: 'center',
  },
  stampDate: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  stampEmoji: {
    fontSize: 20,
    marginTop: 4,
  },
  stampRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  messageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  messageDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});