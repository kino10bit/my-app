/**
 * アセット管理ユーティリティ
 * 画像・音声ファイルの静的読み込みとキャッシュ管理
 */

export interface AssetPaths {
  images: { [key: string]: any };
  audio: { [key: string]: any };
}

// 静的なアセット定義
const TRAINER_IMAGES = {
  'akari': require('../../assets/images/trainers/akari.png'),
  'isuzu': require('../../assets/images/trainers/isuzu.png'),
  'kana': require('../../assets/images/trainers/kana.png'),
  'mika': require('../../assets/images/trainers/mika.png'),
  'rin': require('../../assets/images/trainers/rin.png'),
  // 互換性のための古い名称マッピング
  'shinji': require('../../assets/images/trainers/isuzu.png'),
  'takumi': require('../../assets/images/trainers/kana.png'),
  'miyuki': require('../../assets/images/trainers/mika.png'),
  'daiki': require('../../assets/images/trainers/rin.png'),
} as const;

const TRAINER_AUDIO = {
  'akari': require('../../assets/audio/trainers/akari.mp3'),
  'isuzu': require('../../assets/audio/trainers/isuzu.mp3'),
  'kana': require('../../assets/audio/trainers/kana.mp3'),
  'mika': require('../../assets/audio/trainers/mika.mp3'),
  'rin': require('../../assets/audio/trainers/rin.mp3'),
  // 互換性のための古い名称マッピング
  'shinji': require('../../assets/audio/trainers/isuzu.mp3'),
  'takumi': require('../../assets/audio/trainers/kana.mp3'),
  'miyuki': require('../../assets/audio/trainers/mika.mp3'),
  'daiki': require('../../assets/audio/trainers/rin.mp3'),
} as const;

export class AssetManager {
  private static instance: AssetManager;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * アセットの初期化
   * 静的に定義されたアセットをチェック
   */
  public initialize(): void {
    if (this.initialized) return;

    try {
      this.initialized = true;
      console.log('AssetManager initialized successfully');
      console.log('Available images:', Object.keys(TRAINER_IMAGES));
      console.log('Available audio:', Object.keys(TRAINER_AUDIO));
    } catch (error) {
      console.error('AssetManager initialization failed:', error);
    }
  }

  /**
   * トレーナー画像の取得
   * @param trainerId トレーナーID
   * @returns 画像リソースまたはnull
   */
  public getTrainerImage(trainerId: string): any {
    if (!this.initialized) {
      this.initialize();
    }

    const image = TRAINER_IMAGES[trainerId as keyof typeof TRAINER_IMAGES];
    if (!image) {
      console.warn(`画像ファイルが見つかりません: ${trainerId}`);
      console.log('利用可能な画像:', Object.keys(TRAINER_IMAGES));
      return null;
    }

    return image;
  }

  /**
   * トレーナー音声の取得
   * @param trainerId トレーナーID
   * @returns 音声リソースまたはnull
   */
  public getTrainerAudio(trainerId: string): any {
    if (!this.initialized) {
      this.initialize();
    }

    const audio = TRAINER_AUDIO[trainerId as keyof typeof TRAINER_AUDIO];
    if (!audio) {
      console.warn(`音声ファイルが見つかりません: ${trainerId}`);
      console.log('利用可能な音声:', Object.keys(TRAINER_AUDIO));
      return null;
    }

    return audio;
  }

  /**
   * 新しいアセットの追加（注意：React Nativeでは静的にのみ可能）
   * 新しいファイルを追加するには、TRAINER_IMAGESとTRAINER_AUDIOの定義を更新してください
   */
  public addTrainerAsset(trainerId: string, imagePath?: string, audioPath?: string): void {
    console.warn('動的なアセット追加はサポートされていません。');
    console.log('新しいアセットを追加するには、AssetManager.tsのTRAINER_IMAGESとTRAINER_AUDIOを更新してください。');
    console.log(`追加しようとしたトレーナー: ${trainerId}`);
    if (imagePath) console.log(`画像パス: ${imagePath}`);
    if (audioPath) console.log(`音声パス: ${audioPath}`);
  }

  /**
   * 利用可能なアセット一覧の取得
   */
  public getAvailableAssets(): AssetPaths {
    if (!this.initialized) {
      this.initialize();
    }

    return {
      images: { ...TRAINER_IMAGES },
      audio: { ...TRAINER_AUDIO }
    };
  }

  /**
   * アセットの存在チェック
   */
  public hasTrainerImage(trainerId: string): boolean {
    return this.getTrainerImage(trainerId) !== null;
  }

  public hasTrainerAudio(trainerId: string): boolean {
    return this.getTrainerAudio(trainerId) !== null;
  }

  /**
   * 初期化状態のリセット
   */
  public clearCache(): void {
    this.initialized = false;
    console.log('AssetManager reset');
  }
}