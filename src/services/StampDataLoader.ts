import { getDatabase } from '../database/database';
import { StampModel, GoalModel } from '../database/models';
import { sampleStamps } from '../data/stamps';
import { sampleGoals } from '../data/goals';
import { StampData } from '../types/Stamp';

export class StampDataLoader {
  private database: any = null;
  
  constructor() {
    this.database = getDatabase();
  }

  async loadSampleData(force: boolean = false): Promise<void> {
    try {
      // データベースを再取得（初期化完了後に呼び出されるため）
      this.database = getDatabase();
      
      // データベースの有効性をチェック
      if (!this.database || !this.database.collections) {
        console.warn('Database not available, skipping sample data loading');
        return;
      }

      // 既存のスタンプデータをチェック
      const existingStamps = await this.database.get<StampModel>('stamps').query().fetch();
      const existingGoals = await this.database.get<GoalModel>('goals').query().fetch();
      
      if (existingStamps.length > 0 && !force) {
        console.log('Sample stamp data already exists. Skipping initialization.');
        return;
      }

      console.log('Loading sample data...');

      await this.database.write(async () => {
        // 強制モードの場合は既存データを削除
        if (force) {
          if (existingStamps.length > 0) {
            await Promise.all(existingStamps.map(stamp => stamp.markAsDeleted()));
          }
          if (existingGoals.length > 0) {
            await Promise.all(existingGoals.map(goal => goal.markAsDeleted()));
          }
        }

        // サンプルゴールデータを作成
        await Promise.all(
          sampleGoals.map(async (goalData) => {
            await this.database.get<GoalModel>('goals').create((goal: any) => {
              // readonlyでないプロパティのみ設定
              goal._raw.id = goalData.id;
              goal.title = goalData.title;
              goal.category = goalData.category;
              goal.targetDescription = goalData.description;
              goal.isActive = goalData.isActive;
              goal.difficulty = goalData.difficulty;
              goal.motivation = goalData.motivation;
              goal.totalStamps = goalData.totalStamps;
              goal.currentStreak = goalData.currentStreak;
              goal.bestStreak = goalData.bestStreak;
              // createdAtは@readonlyなので設定しない（自動で設定される）
            });
          })
        );

        // サンプルスタンプデータを作成
        await Promise.all(
          sampleStamps.map(async (stampData: StampData) => {
            await this.database.get<StampModel>('stamps').create((stamp: any) => {
              stamp.goalId = stampData.goalId;
              stamp.date = new Date(stampData.date);
              stamp.stampedAt = new Date(stampData.stampedAt);
              stamp.stampType = stampData.stampType;
              stamp.mood = stampData.mood || '';
              stamp.difficulty = stampData.difficulty;
              stamp.note = stampData.note || '';
            });
          })
        );
      });

      console.log(`Successfully loaded ${sampleGoals.length} goals and ${sampleStamps.length} stamps`);
    } catch (error) {
      console.error('Failed to load sample data:', error);
      throw new Error('Sample data loading failed');
    }
  }

  async clearAllStamps(): Promise<void> {
    try {
      const allStamps = await this.database.get<StampModel>('stamps').query().fetch();
      
      if (allStamps.length === 0) {
        console.log('No stamps to clear');
        return;
      }

      await this.database.write(async () => {
        await Promise.all(allStamps.map(stamp => stamp.markAsDeleted()));
      });

      console.log(`Cleared ${allStamps.length} stamps`);
    } catch (error) {
      console.error('Failed to clear stamps:', error);
      throw new Error('Stamp clearing failed');
    }
  }

  async reloadSampleData(): Promise<void> {
    console.log('Reloading sample stamp data...');
    await this.clearAllStamps();
    await this.loadSampleData();
    console.log('Sample stamp data reloaded successfully');
  }

  async getStampCount(): Promise<number> {
    const stamps = await this.database.get<StampModel>('stamps').query().fetch();
    return stamps.length;
  }

  // 開発用: データベースの状態を確認
  async debugStampData(): Promise<void> {
    const stamps = await this.database.get<StampModel>('stamps').query().fetch();
    console.log(`Total stamps in database: ${stamps.length}`);
    
    if (stamps.length > 0) {
      console.log('Sample stamps:', stamps.slice(0, 3).map(s => ({
        id: s.id,
        goalId: s.goalId,
        date: s.date,
        stampType: s.stampType,
        note: s.note
      })));
    }
  }
}