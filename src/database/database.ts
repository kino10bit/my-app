import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';
import { dbSchema } from './schema';
import { GoalModel, TrainerModel } from './models';

// SQLiteアダプターの設定
const adapter = new SQLiteAdapter({
  schema: dbSchema,
  jsi: Platform.OS === 'ios',
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  }
});

// データベースインスタンスの作成
export const database = new Database({
  adapter,
  modelClasses: [
    GoalModel,
    TrainerModel,
    // 他のモデルクラスもここに追加
  ],
});

// データベース初期化関数
export async function initializeDatabase(): Promise<void> {
  try {
    // データベースの準備完了を待つ
    await database.adapter.unsafeResetDatabase();
    
    // 初期データの投入
    await seedInitialData();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// 初期データの投入
async function seedInitialData(): Promise<void> {
  await database.write(async () => {
    // デフォルトトレーナーの作成
    const defaultTrainers = [
      {
        name: 'エナ',
        type: 'energetic',
        avatarImageName: 'trainer_ena.png',
        voicePrefix: 'ena',
        description: '元気いっぱいでサポートします！',
        personality: {
          catchphrase: '今日も一緒に頑張ろう！',
          encouragementStyle: 'エネルギッシュで前向き',
          celebrationStyle: '大げさに喜ぶ',
          supportiveWords: ['やったね！', 'すごいじゃない！', '頑張って！', 'きっとできる！']
        }
      },
      {
        name: 'カルム',
        type: 'calm',
        avatarImageName: 'trainer_calm.png',
        voicePrefix: 'calm',
        description: '落ち着いてサポートします',
        personality: {
          catchphrase: '一歩ずつ、着実に進みましょう',
          encouragementStyle: '穏やかで安心感のある',
          celebrationStyle: '静かに喜びを表現',
          supportiveWords: ['素晴らしいですね', 'よく頑張りました', '順調ですね', 'その調子です']
        }
      }
    ];

    for (const trainerData of defaultTrainers) {
      await database.collections.get('trainers').create((trainer: any) => {
        trainer.name = trainerData.name;
        trainer.type = trainerData.type;
        trainer.isSelected = trainerData.name === 'エナ'; // デフォルト選択
        trainer.avatarImageName = trainerData.avatarImageName;
        trainer.voicePrefix = trainerData.voicePrefix;
        trainer.description = trainerData.description;
        trainer.personalityJson = JSON.stringify(trainerData.personality);
        trainer.createdAt = new Date();
      });
    }

    // アプリ設定の初期化
    await database.collections.get('app_settings').create((settings: any) => {
      settings.isFirstLaunch = true;
      settings.voiceVolume = 0.8;
      settings.notificationEnabled = true;
      settings.preferredNotificationTime = new Date().setHours(9, 0, 0, 0);
      settings.themeMode = 'auto';
      settings.language = 'ja';
      settings.hapticFeedbackEnabled = true;
      settings.animationsEnabled = true;
      settings.totalAppUsageDays = 0;
      settings.createdAt = new Date();
      settings.updatedAt = new Date();
    });
  });
}

// データベースリセット（開発用）
export async function resetDatabase(): Promise<void> {
  await database.adapter.unsafeResetDatabase();
  await seedInitialData();
  console.log('Database reset completed');
}

export default database;