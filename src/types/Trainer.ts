export interface Trainer {
  id: string;
  name: string;
  type: TrainerType;
  isSelected: boolean;
  avatarImageName: string;
  voicePrefix: string;
  description: string;
  personality: TrainerPersonality;
  createdAt: Date;
  
  // 関連データ
  rewards: Reward[];
  availableVoiceMessages: VoiceMessage[];
}

export enum TrainerType {
  Energetic = "energetic",
  Calm = "calm",
  Strict = "strict",
  Gentle = "gentle",
  Motivational = "motivational"
}

export interface TrainerPersonality {
  catchphrase: string;          // 決め台詞
  encouragementStyle: string;   // 励ましスタイル
  celebrationStyle: string;     // 祝福スタイル
  supportiveWords: string[];    // よく使う応援言葉
}

export interface Reward {
  id: string;
  trainerId: string;
  type: RewardType;
  name: string;
  description: string;
  threshold: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  contentFileName: string;
  rarity: RewardRarity;
  category: RewardCategory;
  isEligibleForUnlock: boolean;
}

export enum RewardType {
  Voice = "voice",
  Illustration = "illustration",
  Badge = "badge",
  Animation = "animation"
}

export enum RewardRarity {
  Common = "common",
  Rare = "rare",
  Epic = "epic",
  Legendary = "legendary"
}

export enum RewardCategory {
  Encouragement = "encouragement",
  Celebration = "celebration",
  Milestone = "milestone",
  Seasonal = "seasonal"
}

export interface VoiceMessage {
  id: string;
  trainerId: string;
  fileName: string;
  messageType: VoiceMessageType;
  text: string;
  duration: number;
  isUnlocked: boolean;
  unlockThreshold: number;
  fileURL?: string;
}

export enum VoiceMessageType {
  Welcome = "welcome",
  Encouragement = "encouragement",
  Celebration = "celebration",
  Milestone = "milestone",
  DailyMotivation = "dailyMotivation",
  GoodMorning = "goodMorning",
  GoodNight = "goodNight",
  StreakAchievement = "streakAchievement",
  ComeBack = "comeBack"
}