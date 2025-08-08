export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDescription: string;
  isActive: boolean;
  createdAt: Date;
  targetEndDate?: Date;
  motivation: string;
  difficulty: GoalDifficulty;
  
  // 進捗関連
  totalStamps: number;
  currentStreak: number;
  bestStreak: number;
  lastStampDate?: Date;
  
  // 関連データ
  dailyActions: DailyAction[];
  stamps: Stamp[];
  
  // 計算プロパティ
  progressPercentage: number;
  isCompletedToday: boolean;
}

export enum GoalDifficulty {
  VeryEasy = 1,
  Easy = 2,
  Normal = 3,
  Hard = 4,
  VeryHard = 5
}

export interface DailyAction {
  id: string;
  goalId: string;
  title: string;
  description: string;
  isRequired: boolean;
  estimatedMinutes: number;
  reminderTime?: ReminderTime;
  sortOrder: number;
  createdAt: Date;
  isCompletedToday: boolean;
}

export interface ReminderTime {
  hour: number;
  minute: number;
  isEnabled: boolean;
  displayString: string;
}

export interface Stamp {
  id: string;
  goalId: string;
  date: Date;
  stampedAt: Date;
  note?: string;
  stampType: StampType;
  mood?: Mood;
  difficulty: GoalDifficulty;
  dayOfWeek: string;
}

export enum StampType {
  Regular = "regular",
  Bonus = "bonus",
  Streak = "streak",
  Milestone = "milestone"
}

export enum Mood {
  Excellent = "excellent",
  Good = "good",
  Okay = "okay",
  Difficult = "difficult",
  VeryDifficult = "veryDifficult"
}