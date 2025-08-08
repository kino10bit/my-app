import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Progress,
  Badge,
  useColorModeValue,
  Skeleton,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGoals } from '../hooks/useGoals';
import { useTrainer } from '../hooks/useTrainer';
import { Goal } from '../types';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    goals,
    isLoading: goalsLoading,
    error: goalsError,
    getTodaysGoals,
    getCompletedTodayGoals,
    getStatistics,
    addStamp,
    loadGoals,
  } = useGoals();

  const {
    selectedTrainer,
    isLoading: trainerLoading,
    playCelebrationVoice,
    getEncouragementMessage,
    getCatchphrase,
  } = useTrainer();

  // 色テーマ
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  // 統計データ
  const statistics = getStatistics();
  const todaysGoals = getTodaysGoals();
  const completedGoals = getCompletedTodayGoals();

  // プルツーリフレッシュ
  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  // スタンプ追加処理
  const handleAddStamp = async (goal: Goal) => {
    try {
      // ハプティックフィードバック
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await addStamp(goal.id);
      
      if (result.success) {
        // 祝福ボイスを再生
        await playCelebrationVoice();
        
        // 祝福メッセージを表示
        Alert.alert(
          '🎉 やりました！',
          `「${goal.title}」を達成しました！\n${getEncouragementMessage()}`,
          [{ text: 'ありがとう！', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('エラー', 'スタンプの追加に失敗しました');
    }
  };

  // ローディング表示
  if (goalsLoading || trainerLoading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <VStack space={4} p={4}>
          <Skeleton h="20" rounded="md" />
          <Skeleton h="32" rounded="md" />
          <Skeleton h="40" rounded="md" />
        </VStack>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <VStack space={4} p={4}>
        {/* ヘッダー・挨拶セクション */}
        <Card bg={cardBgColor} p={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <VStack flex={1}>
              <Text fontSize="lg" color={textColor} fontWeight="bold">
                おはようございます！
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                {selectedTrainer ? getCatchphrase() : '今日も一緒にがんばりましょう！'}
              </Text>
            </VStack>
            {selectedTrainer && (
              <Box bg="blue.100" rounded="full" p={2}>
                <Text fontSize="2xl">👨‍🏫</Text>
              </Box>
            )}
          </HStack>
        </Card>

        {/* 今日の進捗サマリー */}
        <Card bg={cardBgColor} p={4}>
          <VStack space={3}>
            <Text fontSize="md" fontWeight="bold" color={textColor}>
              今日の進捗
            </Text>
            
            <HStack justifyContent="space-around">
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {completedGoals.length}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>完了</Text>
              </VStack>
              
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {todaysGoals.length}
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>残り</Text>
              </VStack>
              
              <VStack alignItems="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {Math.round(statistics.completionRate)}%
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>達成率</Text>
              </VStack>
            </HStack>

            {statistics.totalActiveGoals > 0 && (
              <Progress
                value={statistics.completionRate}
                colorScheme="blue"
                size="sm"
                rounded="full"
              />
            )}
          </VStack>
        </Card>

        {/* 今日のアクション */}
        <VStack space={3}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="md" fontWeight="bold" color={textColor}>
              今日のアクション
            </Text>
            {todaysGoals.length === 0 && completedGoals.length > 0 && (
              <Badge colorScheme="green" variant="solid">
                全て完了！
              </Badge>
            )}
          </HStack>

          {todaysGoals.length === 0 && completedGoals.length === 0 ? (
            <Card bg={cardBgColor} p={4}>
              <VStack alignItems="center" space={2}>
                <Text fontSize="lg">📝</Text>
                <Text color={mutedTextColor} textAlign="center">
                  目標を作成して、今日から始めましょう！
                </Text>
                <Button 
                  size="sm" 
                  variant="outline"
                  onPress={() => {/* Navigation to goal creation will be implemented */}}
                >
                  目標を作成
                </Button>
              </VStack>
            </Card>
          ) : (
            <VStack space={2}>
              {/* 未完了の目標 */}
              {todaysGoals.map((goal) => (
                <Card key={goal.id} bg={cardBgColor} p={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1} mr={2}>
                      <Text fontSize="md" fontWeight="medium" color={textColor}>
                        {goal.title}
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {goal.category}
                      </Text>
                      {goal.currentStreak > 0 && (
                        <HStack alignItems="center" mt={1}>
                          <MaterialIcons name="local-fire-department" size={14} color="orange" />
                          <Text fontSize="xs" color="orange.500" ml={1}>
                            {goal.currentStreak}日連続
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                    
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onPress={() => handleAddStamp(goal)}
                      leftIcon={<MaterialIcons name="check" size={16} color="white" />}
                    >
                      完了
                    </Button>
                  </HStack>
                </Card>
              ))}

              {/* 完了済みの目標 */}
              {completedGoals.map((goal) => (
                <Card key={goal.id} bg="green.50" p={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <VStack flex={1}>
                      <HStack alignItems="center">
                        <MaterialIcons name="check-circle" size={20} color="green" />
                        <Text fontSize="md" fontWeight="medium" color="green.700" ml={2}>
                          {goal.title}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="green.600" ml={6}>
                        {goal.category} - 完了済み
                      </Text>
                    </VStack>
                    
                    <Badge colorScheme="green" variant="solid">
                      ✓
                    </Badge>
                  </HStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>

        {/* 統計セクション */}
        {statistics.totalActiveGoals > 0 && (
          <Card bg={cardBgColor} p={4}>
            <VStack space={3}>
              <Text fontSize="md" fontWeight="bold" color={textColor}>
                あなたの記録
              </Text>
              
              <HStack justifyContent="space-around">
                <VStack alignItems="center">
                  <Text fontSize="lg" fontWeight="bold" color="purple.500">
                    {statistics.totalStamps}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor}>総スタンプ</Text>
                </VStack>
                
                <VStack alignItems="center">
                  <Text fontSize="lg" fontWeight="bold" color="orange.500">
                    {statistics.averageStreak}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor}>平均連続</Text>
                </VStack>
                
                <VStack alignItems="center">
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    {statistics.totalActiveGoals}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor}>アクティブ目標</Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>
        )}

        {/* エラー表示 */}
        {goalsError && (
          <Card bg="red.50" p={4}>
            <HStack alignItems="center">
              <MaterialIcons name="error" size={20} color="red" />
              <Text color="red.600" ml={2} flex={1}>
                {goalsError}
              </Text>
            </HStack>
          </Card>
        )}
      </VStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});