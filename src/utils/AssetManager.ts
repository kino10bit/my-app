/**
 * アセット管理ユーティリティ
 * 画像・音声ファイルの動的読み込みとキャッシュ管理
 */

export interface AssetPaths {
  images: { [key: string]: any };
  audio: { [key: string]: any };
}

export class AssetManager {
  private static instance: AssetManager;
  private imageCache: { [key: string]: any } = {};
  private audioCache: { [key: string]: any } = {};
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
   * 利用可能な全ての画像・音声ファイルを検出してキャッシュに登録
   */
  public initialize(): void {
    if (this.initialized) return;

    try {
      // 現在利用可能な画像ファイル
      this.imageCache = {
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
      };

      // 現在利用可能な音声ファイル
      this.audioCache = {
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
      };

      this.initialized = true;
      console.log('AssetManager initialized successfully');
      console.log('Available images:', Object.keys(this.imageCache));
      console.log('Available audio:', Object.keys(this.audioCache));
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

    const image = this.imageCache[trainerId];
    if (!image) {
      console.warn(`画像ファイルが見つかりません: ${trainerId}`);
      console.log('利用可能な画像:', Object.keys(this.imageCache));
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

    const audio = this.audioCache[trainerId];
    if (!audio) {
      console.warn(`音声ファイルが見つかりません: ${trainerId}`);
      console.log('利用可能な音声:', Object.keys(this.audioCache));
      return null;
    }

    return audio;
  }

  /**
   * 新しいアセットの動的追加
   * 将来的にファイルを追加する際に使用
   */
  public addTrainerAsset(trainerId: string, imagePath?: string, audioPath?: string): void {
    try {
      if (imagePath) {
        this.imageCache[trainerId] = require(imagePath);
        console.log(`画像追加成功: ${trainerId} -> ${imagePath}`);
      }
      
      if (audioPath) {
        this.audioCache[trainerId] = require(audioPath);
        console.log(`音声追加成功: ${trainerId} -> ${audioPath}`);
      }
    } catch (error) {
      console.error(`アセット追加失敗: ${trainerId}`, error);
    }
  }

  /**
   * 利用可能なアセット一覧の取得
   */
  public getAvailableAssets(): AssetPaths {
    if (!this.initialized) {
      this.initialize();
    }

    return {
      images: { ...this.imageCache },
      audio: { ...this.audioCache }
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
   * キャッシュのクリア
   */
  public clearCache(): void {
    this.imageCache = {};
    this.audioCache = {};
    this.initialized = false;
    console.log('AssetManager cache cleared');
  }
}