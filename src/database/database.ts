import { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';
import { dbSchema } from './schema';
import { GoalModel, TrainerModel } from './models';

// プラットフォーム別アダプター設定関数
function createDatabaseAdapter() {
  if (Platform.OS === 'web') {
    // Web版用のLokiJSアダプター
    const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
    return new LokiJSAdapter({
      schema: dbSchema,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
    });
  } else {
    // ネイティブ版用のSQLiteアダプター
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
    return new SQLiteAdapter({
      schema: dbSchema,
      jsi: Platform.OS === 'ios',
    });
  }
}

const adapter = createDatabaseAdapter();

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
        trainer.is_selected = trainerData.name === 'エナ'; // デフォルト選択
        trainer.avatar_image_name = trainerData.avatarImageName;
        trainer.voice_prefix = trainerData.voicePrefix;
        trainer.description = trainerData.description;
        trainer.personality = JSON.stringify(trainerData.personality);
        trainer.created_at = new Date();
      });
    }

    // アプリ設定の初期化
    await database.collections.get('app_settings').create((settings: any) => {
      settings.is_first_launch = true;
      settings.voice_volume = 0.8;
      settings.notification_enabled = true;
      settings.preferred_notification_time = new Date().setHours(9, 0, 0, 0);
      settings.theme_mode = 'auto';
      settings.language = 'ja';
      settings.haptic_feedback_enabled = true;
      settings.animations_enabled = true;
      settings.total_app_usage_days = 0;
      settings.created_at = new Date();
      settings.updated_at = new Date();
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