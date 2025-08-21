/**
 * アセット管理ヘルパー関数
 * 新しいファイルを簡単に追加するためのユーティリティ
 */

import { AssetManager } from './AssetManager';

/**
 * 新しいトレーナーアセットを追加するためのヘルパー関数
 * 
 * 使用例:
 * import { addNewTrainerAssets } from '../utils/AssetHelper';
 * 
 * // 新しいトレーナーを追加する場合
 * addNewTrainerAssets({
 *   'newTrainer': {
 *     image: '../../assets/images/trainers/newTrainer.png',
 *     audio: '../../assets/audio/trainers/newTrainer.mp3'
 *   }
 * });
 */

export interface TrainerAssetConfig {
  [trainerId: string]: {
    image?: string;
    audio?: string;
  };
}

export function addNewTrainerAssets(config: TrainerAssetConfig): void {
  const assetManager = AssetManager.getInstance();
  
  Object.entries(config).forEach(([trainerId, assets]) => {
    try {
      assetManager.addTrainerAsset(trainerId, assets.image, assets.audio);
      console.log(`✅ トレーナーアセット追加成功: ${trainerId}`);
    } catch (error) {
      console.error(`❌ トレーナーアセット追加失敗: ${trainerId}`, error);
    }
  });
}

/**
 * ファイル名から自動的にパスを生成してアセットを追加
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