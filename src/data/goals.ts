import { GoalData } from '../types/Goal';

export const sampleGoals: GoalData[] = [
  {
    id: 'goal-1',
    title: '毎日運動する',
    description: '健康のために毎日30分の運動を心がけます',
    category: '健康・フィットネス',
    isActive: true,
    difficulty: 3,
    motivation: '健康を維持し、体力を向上させたい',
    targetDescription: '毎日30分以上の有酸素運動を行う',
    totalStamps: 0,
    currentStreak: 0,
    bestStreak: 0
  },
  {
    id: 'goal-2', 
    title: '英語学習を続ける',
    description: 'TOEIC向上のために毎日英語を勉強します',
    category: '学習・スキル',
    isActive: true,
    difficulty: 4,
    motivation: 'キャリアアップのために英語力を向上させたい',
    targetDescription: '毎日30分以上の英語学習を行う',
    totalStamps: 0,
    currentStreak: 0,
    bestStreak: 0
  },
  {
    id: 'goal-3',
    title: '早起きを習慣化する',
    description: '毎朝7時に起きて充実した一日をスタートします',
    category: '生活習慣',
    isActive: true,
    difficulty: 5,
    motivation: '時間を有効活用し、充実した毎日を送りたい',
    targetDescription: '毎日午前7時までに起床する',
    totalStamps: 0,
    currentStreak: 0,
    bestStreak: 0
  }
];

export interface GoalData {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  difficulty: number;
  motivation: string;
  targetDescription: string;
  totalStamps: number;
  currentStreak: number;
  bestStreak: number;
  targetEndDate?: string;
  lastStampDate?: string;
}