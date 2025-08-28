import { Model } from '@nozbe/watermelondb';
import { 
  text, 
  field,
  date, 
  children,
  readonly 
} from '@nozbe/watermelondb/decorators';
import { GoalDifficulty } from '../../types';

export class GoalModel extends Model {
  static table = 'goals';
  static associations = {
    daily_actions: { type: 'has_many', foreignKey: 'goal_id' },
    stamps: { type: 'has_many', foreignKey: 'goal_id' },
  } as const;

  @text('title') title!: string;
  @text('category') category!: string;
  @text('target_description') targetDescription!: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @date('target_end_date') targetEndDate?: Date;
  @text('motivation') motivation!: string;
  @field('difficulty') difficulty!: GoalDifficulty;
  
  // 進捗関連
  @field('total_stamps') totalStamps!: number;
  @field('current_streak') currentStreak!: number;
  @field('best_streak') bestStreak!: number;
  @date('last_stamp_date') lastStampDate?: Date;
  
  // 関連データ
  @children('daily_actions') dailyActions: any;
  @children('stamps') stamps: any;

  // 計算プロパティ
  get progressPercentage(): number {
    if (!this.targetEndDate) return 0;
    
    const totalDays = Math.ceil(
      (this.targetEndDate.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return totalDays > 0 ? (this.totalStamps / totalDays) * 100 : 0;
  }

  get isCompletedToday(): boolean {
    if (!this.lastStampDate) return false;
    
    const today = new Date();
    return (
      this.lastStampDate.getDate() === today.getDate() &&
      this.lastStampDate.getMonth() === today.getMonth() &&
      this.lastStampDate.getFullYear() === today.getFullYear()
    );
  }

  // アクションメソッド（Writer内で呼び出される前提）
  async addStamp(): Promise<void> {
    const currentLastStampDate = this.lastStampDate;
    
    await this.update(goal => {
      goal.totalStamps += 1;
      goal.lastStampDate = new Date();
      
      // ストリーク計算
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (currentLastStampDate && this.isConsecutiveDay(currentLastStampDate, yesterday)) {
        goal.currentStreak += 1;
        if (goal.currentStreak > goal.bestStreak) {
          goal.bestStreak = goal.currentStreak;
        }
      } else {
        goal.currentStreak = 1;
      }
    });
  }

  private isConsecutiveDay(date1: Date, date2: Date): boolean {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }
}