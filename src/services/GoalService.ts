import { database } from '../database/database';
import { GoalModel } from '../database/models';
import { Goal, GoalDifficulty, Result, AppError, AppErrorType } from '../types';

export class GoalService {
  
  async createGoal(
    title: string, 
    category: string, 
    targetDescription: string,
    motivation: string,
    difficulty: GoalDifficulty,
    targetEndDate?: Date
  ): Promise<Result<Goal>> {
    try {
      if (!title.trim()) {
        return {
          success: false,
          error: new AppError(AppErrorType.Validation, '目標タイトルは必須です')
        };
      }

      if (!category.trim()) {
        return {
          success: false,
          error: new AppError(AppErrorType.Validation, 'カテゴリは必須です')
        };
      }

      const goalModel = await database.write(async () => {
        return await database.collections.get<GoalModel>('goals').create(goal => {
          goal.title = title.trim();
          goal.category = category.trim();
          goal.targetDescription = targetDescription.trim();
          goal.motivation = motivation.trim();
          goal.difficulty = difficulty;
          goal.isActive = true;
          goal.totalStamps = 0;
          goal.currentStreak = 0;
          goal.bestStreak = 0;
          goal.targetEndDate = targetEndDate;
          goal.createdAt = new Date();
        });
      });

      const goal = this.modelToGoal(goalModel);
      
      return {
        success: true,
        data: goal
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          '目標の作成に失敗しました',
          'アプリを再起動してお試しください'
        )
      };
    }
  }

  async getActiveGoals(): Promise<Result<Goal[]>> {
    try {
      const goalModels = await database.collections
        .get<GoalModel>('goals')
        .query()
        .fetch();

      const goals = goalModels
        .filter(model => model.isActive)
        .map(model => this.modelToGoal(model));

      return {
        success: true,
        data: goals
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          '目標の取得に失敗しました'
        )
      };
    }
  }

  async getGoalById(goalId: string): Promise<Result<Goal>> {
    try {
      const goalModel = await database.collections
        .get<GoalModel>('goals')
        .find(goalId);

      const goal = this.modelToGoal(goalModel);
      
      return {
        success: true,
        data: goal
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          '目標が見つかりませんでした'
        )
      };
    }
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Result<Goal>> {
    try {
      const goalModel = await database.collections
        .get<GoalModel>('goals')
        .find(goalId);

      const updatedModel = await database.write(async () => {
        return await goalModel.update(goal => {
          if (updates.title !== undefined) goal.title = updates.title;
          if (updates.category !== undefined) goal.category = updates.category;
          if (updates.targetDescription !== undefined) goal.targetDescription = updates.targetDescription;
          if (updates.motivation !== undefined) goal.motivation = updates.motivation;
          if (updates.difficulty !== undefined) goal.difficulty = updates.difficulty;
          if (updates.targetEndDate !== undefined) goal.targetEndDate = updates.targetEndDate;
          if (updates.isActive !== undefined) goal.isActive = updates.isActive;
        });
      });

      const goal = this.modelToGoal(updatedModel);
      
      return {
        success: true,
        data: goal
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          '目標の更新に失敗しました'
        )
      };
    }
  }

  async deleteGoal(goalId: string): Promise<Result<void>> {
    try {
      await database.write(async () => {
        const goalModel = await database.collections
          .get<GoalModel>('goals')
          .find(goalId);
        
        await goalModel.destroyPermanently();
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          '目標の削除に失敗しました'
        )
      };
    }
  }

  async addStampToGoal(goalId: string): Promise<Result<Goal>> {
    try {
      const goalModel = await database.collections
        .get<GoalModel>('goals')
        .find(goalId);

      await goalModel.addStamp();

      // スタンプモデルも作成
      await database.write(async () => {
        await database.collections.get('stamps').create((stamp: any) => {
          stamp.goalId = goalId;
          stamp.date = new Date();
          stamp.stampedAt = new Date();
          stamp.stampType = 'regular';
          stamp.difficulty = goalModel.difficulty;
        });
      });

      const updatedGoal = this.modelToGoal(goalModel);
      
      return {
        success: true,
        data: updatedGoal
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          'スタンプの追加に失敗しました'
        )
      };
    }
  }

  // プライベートメソッド: モデルから型へ変換
  private modelToGoal(model: GoalModel): Goal {
    return {
      id: model.id,
      title: model.title,
      category: model.category,
      targetDescription: model.targetDescription,
      isActive: model.isActive,
      createdAt: model.createdAt,
      targetEndDate: model.targetEndDate,
      motivation: model.motivation,
      difficulty: model.difficulty,
      totalStamps: model.totalStamps,
      currentStreak: model.currentStreak,
      bestStreak: model.bestStreak,
      lastStampDate: model.lastStampDate,
      dailyActions: [], // TODO: 関連データを取得
      stamps: [], // TODO: 関連データを取得
      progressPercentage: model.progressPercentage,
      isCompletedToday: model.isCompletedToday
    };
  }
}