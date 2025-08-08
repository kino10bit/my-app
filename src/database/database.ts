import { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';
import { dbSchema } from './schema';
import { GoalModel, TrainerModel } from './models';

// プラットフォーム別アダプター設定関数
async function createDatabaseAdapter() {
  console.log(`Initializing database adapter for platform: ${Platform.OS}`);
  
  if (Platform.OS === 'web') {
    // Web版用のアダプター - SQLite関連を一切読み込まない
    const { createWebAdapter } = await import('./adapters/WebAdapter');
    return createWebAdapter(dbSchema);
  } else {
    // ネイティブ版用のアダプター
    const { createNativeAdapter } = await import('./adapters/NativeAdapter');
    return createNativeAdapter(dbSchema);
  }
}

// 非同期でアダプターを作成
let adapter: any = null;
let database: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (database) {
    return database;
  }
  
  try {
    adapter = await createDatabaseAdapter();
    console.log('Database adapter initialized successfully');
    
    // データベースインスタンスの作成
    database = new Database({
      adapter,
      modelClasses: [
        GoalModel,
        TrainerModel,
        // 他のモデルクラスもここに追加
      ],
    });

    // 初期データの投入
    await seedInitialData(database);
    console.log('Database initialized successfully');
    
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// データベースインスタンスを取得する関数
export function getDatabase(): Database {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return database;
}

// 初期データの投入
async function seedInitialData(db: Database): Promise<void> {
  await db.write(async () => {
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
      await db.collections.get('trainers').create((trainer: any) => {
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
    await db.collections.get('app_settings').create((settings: any) => {
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
  const db = getDatabase();
  await db.adapter.unsafeResetDatabase();
  await seedInitialData(db);
  console.log('Database reset completed');
}