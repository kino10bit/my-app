import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { StampCard } from './StampCard';

interface StampData {
  date: Date;
  stampType: string;
  mood?: string;
}

interface StampCardCollectionProps {
  stamps: StampData[];
  slotsPerCard?: number;
}

export const StampCardCollection: React.FC<StampCardCollectionProps> = ({ 
  stamps, 
  slotsPerCard = 12 
}) => {
  const { colors } = useTheme();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // スタンプをカード毎に分割
  const cardData = useMemo(() => {
    const cards = [];
    const totalCards = Math.max(1, Math.ceil(stamps.length / slotsPerCard) + 1); // +1 for current card
    
    for (let i = 0; i < totalCards; i++) {
      const startIndex = i * slotsPerCard;
      const endIndex = startIndex + slotsPerCard;
      const cardStamps = stamps.slice(startIndex, endIndex);
      
      cards.push({
        cardNumber: i + 1,
        stamps: cardStamps,
        isCompleted: cardStamps.length >= slotsPerCard,
        isCurrent: i === Math.floor(stamps.length / slotsPerCard)
      });
    }
    
    return cards;
  }, [stamps, slotsPerCard]);

  const currentCard = cardData[currentCardIndex];
  const completedCards = cardData.filter(card => card.isCompleted).length;

  const handleCardNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else if (direction === 'next' && currentCardIndex < cardData.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* カード情報ヘッダー */}
      <View style={[styles.cardHeader, { backgroundColor: colors.card }]}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            スタンプカード #{currentCard.cardNumber}
          </Text>
          <Text style={[styles.cardStatus, { color: colors.text }]}>
            {currentCard.isCompleted ? '✅ 完了' : 
             currentCard.isCurrent ? '🔄 進行中' : '📝 準備中'}
          </Text>
        </View>
        
        <View style={styles.cardCounter}>
          <Text style={[styles.counterText, { color: colors.primary }]}>
            {currentCardIndex + 1}/{cardData.length}
          </Text>
        </View>
      </View>

      {/* 完了カード統計 */}
      {completedCards > 0 && (
        <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsText, { color: colors.primary }]}>
            🏆 完了済みカード: {completedCards}枚
          </Text>
          <Text style={[styles.statsText, { color: colors.text }]}>
            総獲得スタンプ: {stamps.length}個
          </Text>
        </View>
      )}

      {/* カードナビゲーション */}
      <View style={styles.cardNavigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            { 
              backgroundColor: currentCardIndex > 0 ? colors.primary : colors.border,
              opacity: currentCardIndex > 0 ? 1 : 0.5 
            }
          ]}
          onPress={() => handleCardNavigation('prev')}
          disabled={currentCardIndex === 0}
        >
          <Text style={[styles.navButtonText, { color: colors.background }]}>
            ←
          </Text>
        </TouchableOpacity>

        <View style={styles.cardIndicators}>
          {cardData.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentCardIndex 
                    ? colors.primary 
                    : colors.border
                }
              ]}
              onPress={() => setCurrentCardIndex(index)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.navButton,
            { 
              backgroundColor: currentCardIndex < cardData.length - 1 ? colors.primary : colors.border,
              opacity: currentCardIndex < cardData.length - 1 ? 1 : 0.5 
            }
          ]}
          onPress={() => handleCardNavigation('next')}
          disabled={currentCardIndex === cardData.length - 1}
        >
          <Text style={[styles.navButtonText, { color: colors.background }]}>
            →
          </Text>
        </TouchableOpacity>
      </View>

      {/* 現在のスタンプカード */}
      <StampCard
        stamps={currentCard.stamps}
        totalSlots={slotsPerCard}
      />

      {/* カード完了時の特別メッセージ */}
      {currentCard.isCompleted && (
        <View style={[styles.completionBanner, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.completionTitle, { color: colors.primary }]}>
            🎉 カード#{currentCard.cardNumber}完了おめでとう！
          </Text>
          <Text style={[styles.completionText, { color: colors.text }]}>
            素晴らしい継続力です。次のカードでも頑張りましょう！
          </Text>
          {currentCard.cardNumber === cardData.length && (
            <Text style={[styles.newCardText, { color: colors.primary }]}>
              新しいカードが用意されました ➡️
            </Text>
          )}
        </View>
      )}

      {/* 進行中カードのエンコレッジメント */}
      {currentCard.isCurrent && !currentCard.isCompleted && (
        <View style={[styles.encouragementBanner, { backgroundColor: colors.card }]}>
          <Text style={[styles.encouragementText, { color: colors.text }]}>
            💪 あと{slotsPerCard - currentCard.stamps.length}個でカード完了！
          </Text>
          <Text style={[styles.encouragementSubText, { color: colors.text }]}>
            継続は力なり。今日も頑張りましょう！
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardCounter: {
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completionBanner: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  newCardText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  encouragementBanner: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  encouragementSubText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});