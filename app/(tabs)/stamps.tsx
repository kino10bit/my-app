import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useStamps } from '@/src/hooks/useStamps';
import { getDatabase } from '@/src/database/database';
import { StampModel } from '@/src/database/models';
import { StampCardCollection } from '@/src/components/StampCardCollection';

interface StampStats {
  totalStamps: number;
  currentStreak: number;
  thisWeekStamps: number;
  thisMonthStamps: number;
}

export default function StampsScreen() {
  const { colors } = useTheme();
  const { getTotalStamps, getCurrentStreak, getStampsThisWeek, getStampsThisMonth } = useStamps();
  const [stats, setStats] = useState<StampStats>({
    totalStamps: 0,
    currentStreak: 0,
    thisWeekStamps: 0,
    thisMonthStamps: 0,
  });
  const [stamps, setStamps] = useState<StampModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStampData();
  }, []);

  // 画面フォーカス時にデータを再読み込み（ダッシュボードからの遷移時に最新データを表示）
  useFocusEffect(
    React.useCallback(() => {
      loadStampData();
    }, [])
  );

  const loadStampData = async () => {
    try {
      const [totalStamps, currentStreak, thisWeekStamps, thisMonthStamps] = await Promise.all([
        getTotalStamps(),
        getCurrentStreak(),
        getStampsThisWeek(),
        getStampsThisMonth(),
      ]);

      setStats({
        totalStamps,
        currentStreak,
        thisWeekStamps,
        thisMonthStamps,
      });

      // 最近のスタンプを取得
      const database = getDatabase();
      if (!database) {
        console.warn('Database not available');
        return;
      }
      
      const recentStamps = await database.get<StampModel>('stamps')
        .query()
        .fetch();
      
      setStamps(recentStamps.sort((a, b) => b.date.getTime() - a.date.getTime()));
    } catch (error) {
      console.error('Failed to load stamp data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  };

  const renderStampItem = ({ item }: { item: StampModel }) => (
    <View style={[styles.stampCard, { backgroundColor: colors.card }]}>
      <View style={styles.stampHeader}>
        <Text style={[styles.stampIcon]}>🌟</Text>
        <View style={styles.stampInfo}>
          <Text style={[styles.stampDate, { color: colors.text }]}>
            {formatDate(item.date)}
          </Text>
          <Text style={[styles.stampType, { color: colors.primary }]}>
            {item.stampType || 'スタンプ'}
          </Text>
        </View>
      </View>
      {item.note && (
        <Text style={[styles.stampNote, { color: colors.text }]}>
          {item.note}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>獲得スタンプ</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            今まで獲得したスタンプを確認できます
          </Text>
        </View>

        {/* スタンプカードコレクション */}
        <StampCardCollection 
          stamps={stamps.map(stamp => ({
            date: stamp.date,
            stampType: stamp.stampType,
            mood: stamp.mood || undefined
          }))} 
          slotsPerCard={12}
        />

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.totalStamps}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>総スタンプ数</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.currentStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>現在のストリーク</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.thisWeekStamps}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>今週のスタンプ</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.thisMonthStamps}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>今月のスタンプ</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyDescription, { color: colors.text }]}>
              読み込み中...
            </Text>
          </View>
        ) : stamps.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, { color: colors.text }]}>🏆</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>スタンプがありません</Text>
            <Text style={[styles.emptyDescription, { color: colors.text }]}>
              目標を完了してスタンプを獲得しましょう！
            </Text>
          </View>
        ) : (
          <View style={styles.stampsListContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              最近のスタンプ
            </Text>
            <FlatList
              data={stamps}
              renderItem={renderStampItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 32,
  },
  stampsListContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stampCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stampIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  stampInfo: {
    flex: 1,
  },
  stampDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  stampType: {
    fontSize: 14,
    fontWeight: '500',
  },
  stampNote: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.8,
    fontStyle: 'italic',
  },
});