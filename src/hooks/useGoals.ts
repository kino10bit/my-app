import { useState, useEffect, useCallback } from 'react';
import { GoalService } from '../services/GoalService';
import { Goal, GoalDifficulty, Result } from '../types';

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const goalService = new GoalService();

  // 目標一覧の取得
  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await goalService.getActiveGoals();
      
      if (result.success) {
        setGoals(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 新しい目標の作成
  const createGoal = useCallback(async (
    title: string,
    category: string,
    targetDescription: string,
    motivation: string,
    difficulty: GoalDifficulty,
    targetEndDate?: Date
  ): Promise<Result<Goal>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await goalService.createGoal(
        title,
        category,
        targetDescription,
        motivation,
        difficulty,
        targetEndDate
      );

      if (result.success) {
        // 目標一覧を更新
        await loadGoals();
      } else {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorResult: Result<Goal> = {
        success: false,
        error: new Error('予期しないエラーが発生しました')
      };
      setError('予期しないエラーが発生しました');
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [loadGoals]);

  // 目標の更新
  const updateGoal = useCallback(async (
    goalId: string, 
    updates: Partial<Goal>
  ): Promise<Result<Goal>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await goalService.updateGoal(goalId, updates);

      if (result.success) {
        // ローカル状態を更新
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === goalId ? { ...goal, ...updates } : goal
          )
        );
      } else {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorResult: Result<Goal> = {
        success: false,
        error: new Error('予期しないエラーが発生しました')
      };
      setError('予期しないエラーが発生しました');
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 目標の削除
  const deleteGoal = useCallback(async (goalId: string): Promise<Result<void>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await goalService.deleteGoal(goalId);

      if (result.success) {
        // ローカル状態から削除
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
      } else {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorResult: Result<void> = {
        success: false,
        error: new Error('予期しないエラーが発生しました')
      };
      setError('予期しないエラーが発生しました');
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // スタンプの追加
  const addStamp = useCallback(async (goalId: string): Promise<Result<Goal>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await goalService.addStampToGoal(goalId);

      if (result.success) {
        // ローカル状態を更新
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === goalId ? result.data : goal
          )
        );
      } else {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorResult: Result<Goal> = {
        success: false,
        error: new Error('予期しないエラーが発生しました')
      };
      setError('予期しないエラーが発生しました');
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 特定の目標を取得
  const getGoalById = useCallback((goalId: string): Goal | undefined => {
    return goals.find(goal => goal.id === goalId);
  }, [goals]);

  // 今日完了すべき目標を取得
  const getTodaysGoals = useCallback((): Goal[] => {
    return goals.filter(goal => goal.isActive && !goal.isCompletedToday);
  }, [goals]);

  // 今日完了済みの目標を取得
  const getCompletedTodayGoals = useCallback((): Goal[] => {
    return goals.filter(goal => goal.isActive && goal.isCompletedToday);
  }, [goals]);

  // 統計情報を取得
  const getStatistics = useCallback(() => {
    const activeGoals = goals.filter(goal => goal.isActive);
    const completedToday = activeGoals.filter(goal => goal.isCompletedToday);
    const totalStamps = activeGoals.reduce((sum, goal) => sum + goal.totalStamps, 0);
    const averageStreak = activeGoals.length > 0 
      ? activeGoals.reduce((sum, goal) => sum + goal.currentStreak, 0) / activeGoals.length 
      : 0;

    return {
      totalActiveGoals: activeGoals.length,
      completedToday: completedToday.length,
      completionRate: activeGoals.length > 0 ? (completedToday.length / activeGoals.length) * 100 : 0,
      totalStamps,
      averageStreak: Math.round(averageStreak * 10) / 10
    };
  }, [goals]);

  // 初期読み込み
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return {
    goals,
    isLoading,
    error,
    loadGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    addStamp,
    getGoalById,
    getTodaysGoals,
    getCompletedTodayGoals,
    getStatistics,
    clearError: () => setError(null)
  };
}