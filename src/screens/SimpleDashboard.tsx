import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { GoalModel } from '../database/models';
import { MemoryOptimizer, PerformanceMonitor, useMemoizedValue, useStableCallback } from '../utils/PerformanceOptimizer';

export default function SimpleDashboard() {
  const { goals, selectedTrainer, audioService, isLoading, refreshData } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [todayStamps, setTodayStamps] = useState<Set<string>>(new Set());
  const [statistics, setStatistics] = useState({
    totalStamps: 0,
    currentStreak: 0,
    bestStreak: 0,
    activeGoals: 0
  });

  const memoizedStatistics = useMemoizedValue(() => statistics, [statistics]);

  const loadDashboardData = useStableCallback(async () => {
    const cacheKey = 'dashboard_data';
    const cached = MemoryOptimizer.getCache(cacheKey);
    if (cached) {
      setStatistics(cached.statistics);
      setTodayStamps(cached.todayStamps);
      return;
    }

    try {
      await PerformanceMonitor.measureAsync('loadDashboardData', async () => {
        await Promise.all([
          loadStatistics(),
          loadTodayStamps()
        ]);

        MemoryOptimizer.setCache(cacheKey, {
          statistics,
          todayStamps
        });
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, goals, selectedTrainer]);

  const loadStatistics = useStableCallback(async () => {
    const cacheKey = `statistics_${goals.length}`;
    const cached = MemoryOptimizer.getCache(cacheKey);
    if (cached) {
      setStatistics(cached);
      return;
    }

    const stats = goals.reduce((acc, goal) => ({
      totalStamps: acc.totalStamps + goal.totalStamps,
      currentStreak: Math.max(acc.currentStreak, goal.currentStreak),
      bestStreak: Math.max(acc.bestStreak, goal.bestStreak),
      activeGoals: acc.activeGoals + (goal.isActive ? 1 : 0)
    }), { totalStamps: 0, currentStreak: 0, bestStreak: 0, activeGoals: 0 });
    
    MemoryOptimizer.setCache(cacheKey, stats);
    setStatistics(stats);
  });

  const loadTodayStamps = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // TODO: Implement stamp collection when available
    const stamps = new Set<string>();
    setTodayStamps(stamps);
  };

  const onRefresh = useStableCallback(async () => {
    setRefreshing(true);
    
    MemoryOptimizer.clearCache();
    
    await PerformanceMonitor.measureAsync('refreshDashboard', async () => {
      await refreshData();
      await loadDashboardData();
    });
    
    setRefreshing(false);
  });

  const getTrainerTypeColor = useMemoizedValue(
    () => (type: string): string => {
      switch (type) {
        case 'energetic': return '#FF6B6B';
        case 'calm': return '#4ECDC4';
        case 'strict': return '#FF9F43';
        case 'gentle': return '#F7B731';
        case 'motivational': return '#5F27CD';
        default: return '#007AFF';
      }
    },
    []
  );

  const getTrainerTypeEmoji = useMemoizedValue(
    () => (type: string): string => {
      switch (type) {
        case 'energetic': return '👩‍🏫✨';
        case 'calm': return '🧘‍♂️🌿';
        case 'strict': return '👨‍💼💪';
        case 'gentle': return '👩‍🍳🌸';
        case 'motivational': return '🏃‍♂️🔥';
        default: return '👤';
      }
    },
    []
  );

  const handleCompleteGoal = async (goal: GoalModel) => {
    const isAlreadyCompleted = todayStamps.has(goal.id);
    
    try {
      if (!isAlreadyCompleted) {
        // スタンプを追加（今後実装予定）
        await goal.addStamp();
        setTodayStamps(prev => new Set(prev).add(goal.id));
        
        // トレーナーからの音声メッセージを取得
        const messageType = goal.isCompletedToday ? 'celebration' : 'encouragement';
        const trainerMessage = selectedTrainer 
          ? audioService.getTrainerVoiceMessage(selectedTrainer.type, messageType)
          : 'おめでとうございます！';
        
        // 音声再生
        if (selectedTrainer) {
          const fileName = `${selectedTrainer.voicePrefix}_${messageType}`;
          audioService.playTrainerVoice(fileName, `${selectedTrainer.name}：「${trainerMessage}」`);
        }
        
        Alert.alert(
          '🎉 スタンプゲット！',
          `${selectedTrainer?.name || 'トレーナー'}：「${trainerMessage}」\n\n${goal.title}を完了しました！`,
          [{ text: 'ありがとう！' }]
        );
        
        // 統計を更新
        await loadStatistics();
        await refreshData();
      } else {
        // 取り消し機能
        setTodayStamps(prev => {
          const newSet = new Set(prev);
          newSet.delete(goal.id);
          return newSet;
        });
        
        Alert.alert('取り消し', 'スタンプを取り消しました');
      }
    } catch (error) {
      console.error('Failed to handle goal completion:', error);
      Alert.alert('エラー', 'スタンプの処理に失敗しました');
    }
  };

  const { completedCount, totalCount, completionRate } = useMemoizedValue(() => {
    const completed = goals.filter(goal => todayStamps.has(goal.id)).length;
    const total = goals.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      completedCount: completed,
      totalCount: total,
      completionRate: rate
    };
  }, [goals, todayStamps]);

  const greeting = React.useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'おはようございます！';
    if (currentHour < 18) return 'こんにちは！';
    return 'こんばんは！';
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Appcadia</Text>
            <Text style={styles.subtitle}>{greeting}</Text>
          </View>
          {selectedTrainer && (
            <View style={styles.trainerInfo}>
              <View style={[
                styles.trainerAvatar, 
                { 
                  borderColor: getTrainerTypeColor(selectedTrainer.type), 
                  backgroundColor: getTrainerTypeColor(selectedTrainer.type) + '20' 
                }
              ]}>
                <Text style={styles.trainerEmoji}>{getTrainerTypeEmoji(selectedTrainer.type)}</Text>
              </View>
              <Text style={styles.trainerName}>{selectedTrainer.name}</Text>
            </View>
          )}
        </View>
        <Text style={styles.trainerMessage}>
          {selectedTrainer?.personality.catchphrase || '今日も一緒にがんばりましょう！'}
        </Text>
      </View>

      {/* 今日の進捗 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>今日の進捗</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>完了</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalCount - completedCount}</Text>
            <Text style={styles.statLabel}>残り</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completionRate}%</Text>
            <Text style={styles.statLabel}>達成率</Text>
          </View>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${completionRate}%` }]} 
          />
        </View>
      </View>

      {/* 今日のアクション */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>今日のアクション</Text>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>まだ目標がありません</Text>
            <Text style={styles.emptyStateSubtext}>「探索」タブから新しい目標を作成しましょう！</Text>
          </View>
        ) : (
          goals.map(goal => {
            const isCompleted = todayStamps.has(goal.id);
            return (
              <View key={goal.id} style={styles.goalItem}>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalTitle, isCompleted && styles.completedGoal]}>
                    {goal.title}
                  </Text>
                  <Text style={styles.goalCategory}>{goal.category}</Text>
                  <View style={styles.goalStats}>
                    <Text style={styles.goalStatsText}>
                      🎯 {goal.totalStamps}回 | 🔥 {goal.currentStreak}日連続
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.button, isCompleted && styles.completedButton]}
                  onPress={() => handleCompleteGoal(goal)}
                >
                  <Text style={[styles.buttonText, isCompleted && styles.completedButtonText]}>
                    {isCompleted ? '完了済み' : '完了'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* 統計 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>あなたの記録</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{memoizedStatistics.totalStamps}</Text>
            <Text style={styles.statLabel}>総スタンプ</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{memoizedStatistics.bestStreak}</Text>
            <Text style={styles.statLabel}>最高連続</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{memoizedStatistics.activeGoals}</Text>
            <Text style={styles.statLabel}>アクティブ目標</Text>
          </View>
        </View>
        
        {/* 追加統計 */}
        <View style={styles.additionalStats}>
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>現在の連続記録</Text>
            <Text style={styles.statRowValue}>🔥 {memoizedStatistics.currentStreak}日</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>今日の達成率</Text>
            <Text style={styles.statRowValue}>{completionRate}%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trainerInfo: {
    alignItems: 'center',
  },
  trainerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainerEmoji: {
    fontSize: 28,
    textAlign: 'center',
  },
  trainerName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  trainerMessage: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  completedGoal: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  goalCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  completedButtonText: {
    color: 'white',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalStats: {
    marginTop: 4,
  },
  goalStatsText: {
    fontSize: 12,
    color: '#666',
  },
  additionalStats: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 16,
    paddingTop: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statRowLabel: {
    fontSize: 14,
    color: '#666',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});