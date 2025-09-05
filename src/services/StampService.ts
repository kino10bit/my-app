import { getDatabase } from '../database/database';
import { StampModel, GoalModel } from '../database/models';

export class StampService {
  async createStamp(goalId: string, options?: {
    stampType?: string;
    mood?: string;
    difficulty?: number;
    note?: string;
  }): Promise<StampModel | null> {
    try {
      const database = getDatabase();
      if (!database) {
        throw new Error('Database not available');
      }

      let createdStamp: StampModel | null = null;

      await database.write(async () => {
        // スタンプを作成
        createdStamp = await database.get<StampModel>('stamps').create((stamp: any) => {
          stamp.goalId = goalId;
          stamp.date = new Date();
          stamp.stampedAt = new Date();
          stamp.stampType = options?.stampType || 'daily';
          stamp.mood = options?.mood || 'happy';
          stamp.difficulty = options?.difficulty || 3;
          stamp.note = options?.note || '';
        });

        // 関連する目標のスタンプ統計を更新
        const goal = await database.get<GoalModel>('goals').find(goalId);
        await goal.addStamp();
      });

      return createdStamp;
    } catch (error) {
      console.error('Failed to create stamp:', error);
      throw error;
    }
  }

  async getStampsByGoal(goalId: string): Promise<StampModel[]> {
    try {
      const database = getDatabase();
      if (!database) {
        return [];
      }

      const stamps = await database.get<StampModel>('stamps')
        .query()
        .fetch();

      return stamps.filter(stamp => stamp.goalId === goalId)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Failed to get stamps by goal:', error);
      return [];
    }
  }

  async getTodaysStamps(): Promise<StampModel[]> {
    try {
      const database = getDatabase();
      if (!database) {
        return [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stamps = await database.get<StampModel>('stamps')
        .query()
        .fetch();

      return stamps.filter(stamp => {
        const stampDate = new Date(stamp.date);
        return stampDate >= today && stampDate < tomorrow;
      });
    } catch (error) {
      console.error('Failed to get today\'s stamps:', error);
      return [];
    }
  }

  async getStampCount(): Promise<number> {
    try {
      const database = getDatabase();
      if (!database) {
        return 0;
      }

      const stamps = await database.get<StampModel>('stamps')
        .query()
        .fetch();

      return stamps.length;
    } catch (error) {
      console.error('Failed to get stamp count:', error);
      return 0;
    }
  }

  // スタンプの気分を分析
  getMoodDistribution(stamps: StampModel[]): { [mood: string]: number } {
    const distribution: { [mood: string]: number } = {};
    
    stamps.forEach(stamp => {
      if (stamp.mood) {
        distribution[stamp.mood] = (distribution[stamp.mood] || 0) + 1;
      }
    });

    return distribution;
  }

  // 今日既にスタンプがあるかチェック
  async hasStampToday(goalId: string): Promise<boolean> {
    try {
      const todaysStamps = await this.getTodaysStamps();
      return todaysStamps.some(stamp => stamp.goalId === goalId);
    } catch (error) {
      console.error('Failed to check today\'s stamp:', error);
      return false;
    }
  }
}