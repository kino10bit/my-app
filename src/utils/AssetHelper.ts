/**
 * アセット管理ヘルパー関数
 * 新しいファイルを簡単に追加するためのユーティリティ
 */

import { AssetManager } from './AssetManager';
import { getDatabase, initializeDatabase } from '../database/database';

/**
 * 新しいトレーナーアセットを追加するためのヘルパー関数
 * 
 * 注意：React Nativeでは動的なアセット追加はサポートされていません。
 * 新しいアセットを追加するには、AssetManager.tsのTRAINER_IMAGESと
 * TRAINER_AUDIOの定義を直接更新してください。
 */

export interface TrainerAssetConfig {
  [trainerId: string]: {
    image?: string;
    audio?: string;
  };
}

export function addNewTrainerAssets(config: TrainerAssetConfig): void {
  console.warn('動的なアセット追加はサポートされていません。');
  console.log('新しいアセットを追加する手順:');
  console.log('1. assets/images/trainers/とassets/audio/trainers/にファイルを配置');
  console.log('2. AssetManager.tsのTRAINER_IMAGESとTRAINER_AUDIOに追加');
  console.log('3. アプリを再起動');
  
  Object.entries(config).forEach(([trainerId, assets]) => {
    console.log(`追加予定: ${trainerId}`);
    if (assets.image) console.log(`  画像: ${assets.image}`);
    if (assets.audio) console.log(`  棳声: ${assets.audio}`);
  });
}

/**
 * ファイル名から自動的にパスを生成して追加情報を表示
 * 
 * 使用例:
 * addTrainerAssetsByFilename(['newTrainer1', 'newTrainer2']);
 */
export function addTrainerAssetsByFilename(trainerIds: string[]): void {
  const config: TrainerAssetConfig = {};
  
  trainerIds.forEach(trainerId => {
    config[trainerId] = {
      image: `../../assets/images/trainers/${trainerId}.png`,
      audio: `../../assets/audio/trainers/${trainerId}.mp3`
    };
  });
  
  console.log('追加するトレーナーの情報:');
  addNewTrainerAssets(config);
}

/**
 * 現在利用可能なアセットの状況をログ出力
 */
export function logAssetStatus(): void {
  const assetManager = AssetManager.getInstance();
  const assets = assetManager.getAvailableAssets();
  
  console.log('=== アセット状況 ===');
  console.log('利用可能な画像:', Object.keys(assets.images));
  console.log('利用可能な音声:', Object.keys(assets.audio));
  
  // どのトレーナーが画像・音声両方を持っているかチェック
  const allTrainerIds = new Set([
    ...Object.keys(assets.images),
    ...Object.keys(assets.audio)
  ]);
  
  console.log('\n=== トレーナー別アセット状況 ===');
  allTrainerIds.forEach(trainerId => {
    const hasImage = assetManager.hasTrainerImage(trainerId);
    const hasAudio = assetManager.hasTrainerAudio(trainerId);
    const status = hasImage && hasAudio ? '✅' : hasImage ? '🖼️' : hasAudio ? '🔊' : '❌';
    console.log(`${status} ${trainerId}: 画像=${hasImage ? 'あり' : 'なし'}, 音声=${hasAudio ? 'あり' : 'なし'}`);
  });
}

/**
 * 特定のトレーナーのアセット状況をチェック
 */
export function checkTrainerAssets(trainerId: string): {
  hasImage: boolean;
  hasAudio: boolean;
  status: 'complete' | 'partial' | 'missing';
} {
  const assetManager = AssetManager.getInstance();
  const hasImage = assetManager.hasTrainerImage(trainerId);
  const hasAudio = assetManager.hasTrainerAudio(trainerId);
  
  let status: 'complete' | 'partial' | 'missing';
  if (hasImage && hasAudio) {
    status = 'complete';
  } else if (hasImage || hasAudio) {
    status = 'partial';
  } else {
    status = 'missing';
  }
  
  return { hasImage, hasAudio, status };
}

/**
 * 既存のトレーナーデータをクリアして新しいデータで再作成
 */
export async function resetDatabaseWithNewTrainers(): Promise<void> {
  try {
    console.log('データベースのトレーナーデータをクリア中...');
    
    const db = getDatabase();
    if (!db) {
      console.warn('データベースが初期化されていません');
      return;
    }
    
    await db.write(async () => {
      // 既存のトレーナーデータを全て削除
      const trainersCollection = db.collections.get('trainers');
      const existingTrainers = await trainersCollection.query().fetch();
      
      console.log(`${existingTrainers.length}件の既存トレーナーデータを削除中...`);
      
      for (const trainer of existingTrainers) {
        await trainer.markAsDeleted();
      }
      
      // 新しいトレーナーデータを作成
      const newTrainers = [
        {
          name: 'あかり',
          type: 'energetic',
          avatarImageName: 'akari.png',
          voicePrefix: 'akari',
          description: '元気いっぱいでサポートします！',
          personality: {
            catchphrase: '今日も一緒に頑張ろう！',
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
            supportiveWords: ['素晴らしいですね', 'よく頑張りました', '順調ですね']
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
            supportiveWords: ['よくやった', 'まだまだ', '次も頑張りなさい']
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
            supportiveWords: ['すばらしいです', 'よく頑張っていますね', '大丈夫ですよ']
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
            supportiveWords: ['最高だ！', 'やる気満々だね！', '燃えてきた！']
          }
        }
      ];
      
      console.log(`${newTrainers.length}件の新しいトレーナーデータを作成中...`);
      
      for (const trainerData of newTrainers) {
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
      
      console.log('新しいトレーナーデータの作成完了！');
    });
    
    console.log('データベースリセット完了！アプリを再起動してください。');
  } catch (error) {
    console.error('データベースリセットエラー:', error);
  }
}