import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface StampCardProps {
  stamps: Array<{
    date: Date;
    stampType: string;
    mood?: string;
  }>;
  totalSlots?: number;
}

export const StampCard: React.FC<StampCardProps> = ({ stamps, totalSlots = 12 }) => {
  const { colors } = useTheme();

  const getStampColor = (index: number) => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    return colors[index % colors.length];
  };

  const formatStampDate = (date: Date) => {
    return date.getDate().toString();
  };

  const getMoodEmoji = (mood?: string) => {
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
    return mood ? moodMap[mood] || '⭐' : '⭐';
  };

  const renderStampSlot = (index: number) => {
    const stamp = stamps[index];
    const isObtained = !!stamp;
    const slotNumber = index + 1;

    return (
      <View key={index} style={[styles.stampSlot, { borderColor: colors.border }]}>
        {isObtained ? (
          <View style={[styles.stampCircle, { backgroundColor: getStampColor(index) }]}>
            <Text style={styles.stampDate}>{formatStampDate(stamp.date)}</Text>
            <Text style={styles.stampEmoji}>{getMoodEmoji(stamp.mood)}</Text>
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={[styles.slotNumber, { color: colors.text + '40' }]}>
              {slotNumber}
            </Text>
          </View>
        )}
        
        {/* 特別なスロット表示 */}
        {slotNumber === 10 && !isObtained && (
          <Text style={[styles.bonusLabel, { color: colors.primary }]}>10%OFF</Text>
        )}
        {slotNumber === 12 && !isObtained && (
          <Text style={[styles.bonusLabel, { color: colors.primary }]}>特別ボーナス</Text>
        )}
      </View>
    );
  };

  const completedStamps = stamps.length;
  const progressPercentage = (completedStamps / totalSlots) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>スタンプカード</Text>
        <Text style={[styles.progress, { color: colors.primary }]}>
          {completedStamps}/{totalSlots} ({Math.round(progressPercentage)}%)
        </Text>
      </View>

      {/* プログレスバー */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progressPercentage}%`,
            },
          ]}
        />
      </View>

      {/* スタンプグリッド */}
      <View style={styles.stampGrid}>
        {Array.from({ length: totalSlots }, (_, index) => renderStampSlot(index))}
      </View>

      {/* フッター */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text }]}>
          継続してスタンプを集めよう！
        </Text>
        {completedStamps >= 10 && (
          <Text style={[styles.rewardText, { color: colors.primary }]}>
            🎉 ボーナス獲得まであと{totalSlots - completedStamps}個！
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progress: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  stampSlot: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stampCircle: {
    width: '90%',
    height: '90%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stampDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  stampEmoji: {
    fontSize: 12,
    marginTop: 2,
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bonusLabel: {
    position: 'absolute',
    bottom: -6,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '120%',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
});