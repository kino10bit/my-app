// Conditional imports to avoid loading WatermelonDB on web during bundle time
let Database: any;
let dbSchema: any;
let GoalModel: any;
let TrainerModel: any;

import { Platform } from 'react-native';

// ユーザーエージェントベースのプラットフォーム検出
function getActualPlatform(): string {
  if (Platform.OS === 'web') {
    // Web環境でのユーザーエージェント確認
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent;
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        return 'ios-web';
      } else if (/Android/.test(userAgent)) {
        return 'android-web';
      }
    }
    return 'web';
  }
  return Platform.OS;
}

// Lazy load WatermelonDB components only when needed
async function loadWatermelonDB() {
  if (!Database) {
    const WatermelonModule = await import('@nozbe/watermelondb');
    Database = WatermelonModule.Database;
    
    const schemaModule = await import('./schema');
    dbSchema = schemaModule.dbSchema;
    
    const modelsModule = await import('./models');
    GoalModel = modelsModule.GoalModel;
    TrainerModel = modelsModule.TrainerModel;
  }
}

// プラットフォーム別アダプター設定関数
async function createDatabaseAdapter() {
  const actualPlatform = getActualPlatform();
  console.log(`Initializing database adapter for platform: ${actualPlatform}`);
  
  // 常にWebアダプターを使用（JSIの問題を回避）
  const { createWebAdapter } = await import('./adapters/WebAdapter');
  return createWebAdapter(dbSchema);
}

// 非同期でアダプターを作成
let adapter: any = null;
let database: any = null;

export async function initializeDatabase(): Promise<any> {
  if (database) {
    return database;
  }
  
  const actualPlatform = getActualPlatform();
  console.log(`Initializing database for platform: ${actualPlatform}`);
  
  try {
    // Load WatermelonDB components lazily
    await loadWatermelonDB();
    console.log('WatermelonDB modules loaded successfully');
    
    adapter = await createDatabaseAdapter();
    console.log('Database adapter created successfully');
    
    // データベースインスタンスの作成
    database = new Database({
      adapter,
      modelClasses: [
        GoalModel,
        TrainerModel,
        // 他のモデルクラスもここに追加
      ],
    });
    console.log('Database instance created successfully');

    // データベースの初期化を確認
    if (!database.collections) {
      throw new Error('Database collections not properly initialized');
    }

    console.log('Database collections confirmed, proceeding with initial data seeding');

    // 初期データの投入（モバイルWeb環境では軽量化）
    if (actualPlatform.includes('web')) {
      await seedInitialDataWeb(database);
    } else {
      await seedInitialData(database);
    }
    console.log('Database initialization completed successfully');
    
    return database;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Error details:', error.stack || error.message);
    
    // データベース初期化失敗時は null を返す
    console.log('Database initialization failed, using fallback mode');
    database = null;
    return null;
  }
}

// データベースインスタンスを取得する関数
export function getDatabase(): any {
  if (!database) {
    console.warn('Database not yet initialized, returning null');
    return null; // 初期化中またはフォールバック
  }
  return database;
}

// データベースが使用可能かチェック
export function isDatabaseAvailable(): boolean {
  return database !== null && database !== undefined;
}

// Web環境用の軽量初期データ投入
async function seedInitialDataWeb(db: any): Promise<void> {
  try {
    if (!db || !db.collections) {
      console.warn('Database or collections not available, skipping initial data seeding');
      return;
    }

    await db.write(async () => {
      console.log('Seeding initial data for web environment...');
      
      // トレーナーコレクションの確認
      const trainersCollection = db.collections.get('trainers');
      if (!trainersCollection) {
        console.warn('Trainers collection not found, skipping seeding');
        return;
      }

      // 既存データの確認
      const existingTrainers = await trainersCollection.query().fetch();
      if (existingTrainers.length > 0) {
        console.log('Trainers already exist, skipping seeding');
        return;
      }

      // 実際に利用可能なアセットファイルに対応したトレーナーデータ
      const trainerData = {
        name: 'あかり',
        type: 'energetic',
        avatarImageName: 'akari.png',
        voicePrefix: 'akari',
        description: '元気いっぱいでサポートします！',
      };

      await trainersCollection.create((trainer: any) => {
        trainer.name = trainerData.name;
        trainer.type = trainerData.type;
        trainer.is_selected = true;
        trainer.avatar_image_name = trainerData.avatarImageName;
        trainer.voice_prefix = trainerData.voicePrefix;
        trainer.description = trainerData.description;
        trainer.personality = JSON.stringify({
          catchphrase: '今日も一緒に頑張ろう！',
          supportiveWords: ['やったね！', 'すごいじゃない！']
        });
        trainer.created_at = new Date();
      });
      
      console.log('Web initial data seeded successfully');
    });
  } catch (error) {
    console.warn('Failed to seed initial data for web:', error);
    // Web環境では初期データなしでも続行
  }
}

// 初期データの投入
async function seedInitialData(db: any): Promise<void> {
  try {
    if (!db || !db.collections) {
      console.warn('Database or collections not available, skipping initial data seeding');
      return;
    }

    await db.write(async () => {
      // トレーナーコレクションの確認
      const trainersCollection = db.collections.get('trainers');
      if (!trainersCollection) {
        console.warn('Trainers collection not found, skipping trainer seeding');
        return;
      }

      // 既存データの確認
      const existingTrainers = await trainersCollection.query().fetch();
      if (existingTrainers.length > 0) {
        console.log('Trainers already exist, skipping trainer seeding');
      } else {
        // 実際に利用可能なアセットファイルに対応したトレーナーデータ
        const defaultTrainers = [
          {
            name: 'あかり',
            type: 'energetic',
            avatarImageName: 'akari.png',
            voicePrefix: 'akari',
            description: '元気いっぱいでサポートします！',
            personality: {
              catchphrase: '今日も一緒に頑張ろう！',
              encouragementStyle: 'エネルギッシュで前向き',
              celebrationStyle: '大げさに喜ぶ',
              supportiveWords: ['やったね！', 'すごいじゃない！', '頑張って！', 'きっとできる！']
            }
          },
          {
            name: 'いすず',
            type: 'calm',
            avatarImageName: 'isuzu.png',
            voicePrefix: 'isuzu',
            description: '落ち着いてサポートします',
            personality: {
              catchphrase: '一歩ずつ、着実に進みましょう',
              encouragementStyle: '穏やかで安心感のある',
              celebrationStyle: '静かに喜びを表現',
              supportiveWords: ['素晴らしいですね', 'よく頑張りました', '順調ですね', 'その調子です']
            }
          },
          {
            name: 'かな',
            type: 'strict',
            avatarImageName: 'kana.png',
            voicePrefix: 'kana',
            description: '厳しくも愛情を持ってサポートします',
            personality: {
              catchphrase: '目標達成に向けて、しっかりとやりましょう',
              encouragementStyle: '厳しくも心のこもった',
              celebrationStyle: '適度な称賛と次の目標提示',
              supportiveWords: ['よくやった', 'まだまだ', '次も頑張りなさい', 'その意気です']
            }
          },
          {
            name: 'みか',
            type: 'gentle',
            avatarImageName: 'mika.png',
            voicePrefix: 'mika',
            description: 'いつも優しく寄り添います',
            personality: {
              catchphrase: 'あなたのペースで大丈夫ですよ',
              encouragementStyle: '優しく包み込むような',
              celebrationStyle: '温かい喜びを表現',
              supportiveWords: ['すばらしいです', 'よく頑張っていますね', '大丈夫ですよ', 'いつも応援しています']
            }
          },
          {
            name: 'りん',
            type: 'motivational',
            avatarImageName: 'rin.png',
            voicePrefix: 'rin',
            description: 'あなたのやる気を最大限に引き出します',
            personality: {
              catchphrase: '今日も最高の一日にしよう！',
              encouragementStyle: '情熱的でエネルギッシュ',
              celebrationStyle: '熱狂して喜びを表現',
              supportiveWords: ['最高だ！', 'やる気満々だね！', '燃えてきた！', 'みんなで頑張ろう！']
            }
          }
        ];

        for (const trainerData of defaultTrainers) {
          await trainersCollection.create((trainer: any) => {
            trainer.name = trainerData.name;
            trainer.type = trainerData.type;
            trainer.is_selected = trainerData.name === 'あかり'; // デフォルト選択
            trainer.avatar_image_name = trainerData.avatarImageName;
            trainer.voice_prefix = trainerData.voicePrefix;
            trainer.description = trainerData.description;
            trainer.personality = JSON.stringify(trainerData.personality);
            trainer.created_at = new Date();
          });
        }
      }

      // アプリ設定の初期化
      const settingsCollection = db.collections.get('app_settings');
      if (settingsCollection) {
        const existingSettings = await settingsCollection.query().fetch();
        if (existingSettings.length === 0) {
          await settingsCollection.create((settings: any) => {
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
        }
      }
    });
  } catch (error) {
    console.error('Error in seedInitialData:', error);
    throw error;
  }
}

// データベースリセット（開発用）
export async function resetDatabase(): Promise<void> {
  const db = getDatabase();
  await db.adapter.unsafeResetDatabase();
  await seedInitialData(db);
  console.log('Database reset completed');
}