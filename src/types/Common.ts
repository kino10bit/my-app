// 共通型定義

export interface ProgressData {
  goalId: string;
  period: ProgressPeriod;
  totalStamps: number;
  achievementRate: number;
  streakCount: number;
  averageMood?: string;
  totalDays: number;
  activeDays: number;
  consistency: number;
}

export enum ProgressPeriod {
  Week = "week",
  Month = "month",
  Quarter = "quarter",
  Year = "year",
  All = "all"
}

export interface StreakInfo {
  current: number;
  best: number;
  lastStampDate?: Date;
  isActive: boolean;
  daysToMilestone: number;
}

// UI状態型
export enum ViewState {
  Idle = "idle",
  Loading = "loading",
  Loaded = "loaded",
  Error = "error"
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

// ナビゲーション型
export enum TabType {
  Dashboard = "dashboard",
  Goals = "goals",
  Progress = "progress",
  Trainer = "trainer",
  Settings = "settings"
}

export interface NavigationState {
  selectedTab: TabType;
  presentedSheet?: SheetType;
  presentedFullScreen?: FullScreenType;
  showingAlert?: AlertType;
}

export enum SheetType {
  GoalCreation = "goalCreation",
  GoalEdit = "goalEdit",
  StampAction = "stampAction",
  RewardUnlock = "rewardUnlock",
  TrainerSelection = "trainerSelection",
  Settings = "settings",
  ShareSuccess = "shareSuccess"
}

export enum FullScreenType {
  Onboarding = "onboarding",
  StreakCelebration = "streakCelebration"
}

export enum AlertType {
  Error = "error",
  Confirmation = "confirmation",
  Info = "info"
}

// エラー型
export class AppError extends Error {
  public readonly type: AppErrorType;
  public readonly recoverySuggestion?: string;

  constructor(type: AppErrorType, message: string, recoverySuggestion?: string) {
    super(message);
    this.type = type;
    this.recoverySuggestion = recoverySuggestion;
    this.name = 'AppError';
  }
}

export enum AppErrorType {
  Database = "database",
  AudioPlayback = "audioPlayback",
  Validation = "validation",
  Network = "network",
  Unknown = "unknown"
}

// アプリ設定型
export interface AppSettings {
  selectedTrainerId?: string;
  isFirstLaunch: boolean;
  voiceVolume: number;
  notificationEnabled: boolean;
  preferredNotificationTime: Date;
  themeMode: ThemeMode;
  language: Language;
  hapticFeedbackEnabled: boolean;
  animationsEnabled: boolean;
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
  Auto = "auto"
}

export enum Language {
  Japanese = "ja",
  English = "en"
}

// Result型
export type Result<T, E = AppError> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// 型ガード
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

// 汎用ユーティリティ型
export type ID = string;
export type Timestamp = Date;
export type CompletionHandler<T> = (result: Result<T>) => void;
export type AsyncHandler<T> = () => Promise<T>;