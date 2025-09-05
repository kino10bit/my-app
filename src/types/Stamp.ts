export interface StampData {
  goalId: string;
  date: string;
  stampedAt: string;
  stampType: string;
  mood?: string;
  difficulty: number;
  note?: string;
}

export type StampType = 
  | 'daily'
  | 'study' 
  | 'exercise'
  | 'morning'
  | 'reading'
  | 'meditation'
  | 'diet'
  | 'work'
  | 'hobby';

export type MoodType = 
  | 'excited'
  | 'happy'
  | 'motivated'
  | 'focused'
  | 'refreshed'
  | 'neutral'
  | 'tired'
  | 'sleepy'
  | 'stressed';

export interface StampStats {
  totalStamps: number;
  currentStreak: number;
  thisWeekStamps: number;
  thisMonthStamps: number;
  bestStreak: number;
}