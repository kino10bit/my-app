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
  // 実際のファイル名
  'akari': require('../../assets/images/trainers/akari.png'),
  'isuzu': require('../../assets/images/trainers/isuzu.png'),
  'kana': require('../../assets/images/trainers/kana.png'),
  'mika': require('../../assets/images/trainers/mika.png'),
  'rin': require('../../assets/images/trainers/rin.png'),
  
  // データベースのvoicePrefixに対応したマッピング
  'ena': require('../../assets/images/trainers/akari.png'),     // エナ → akari
  'calm': require('../../assets/images/trainers/isuzu.png'),    // カルム → isuzu
  
  // trainer_*.png 形式のavatarImageNameに対応
  'trainer_ena.png': require('../../assets/images/trainers/akari.png'),
  'trainer_calm.png': require('../../assets/images/trainers/isuzu.png'),
  
  // 互換性のための旧名称マッピング
  'shinji': require('../../assets/images/trainers/isuzu.png'),
  'takumi': require('../../assets/images/trainers/kana.png'),
  'miyuki': require('../../assets/images/trainers/mika.png'),
  'daiki': require('../../assets/images/trainers/rin.png'),
} as const;

// 基本音声ファイル（既存）
const TRAINER_AUDIO = {
  // 実際のファイル名
  'akari': require('../../assets/audio/trainers/akari.mp3'),
  'isuzu': require('../../assets/audio/trainers/isuzu.mp3'),
  'kana': require('../../assets/audio/trainers/kana.mp3'),
  'mika': require('../../assets/audio/trainers/mika.mp3'),
  'rin': require('../../assets/audio/trainers/rin.mp3'),
  
  // データベースのvoicePrefixに対応したマッピング
  'ena': require('../../assets/audio/trainers/akari.mp3'),      // エナ → akari
  'calm': require('../../assets/audio/trainers/isuzu.mp3'),     // カルム → isuzu
  
  // 互換性のための旧名称マッピング
  'shinji': require('../../assets/audio/trainers/isuzu.mp3'),
  'takumi': require('../../assets/audio/trainers/kana.mp3'),
  'miyuki': require('../../assets/audio/trainers/mika.mp3'),
  'daiki': require('../../assets/audio/trainers/rin.mp3'),
} as const;

// 新しい音声ファイル構造（メッセージタイプ別）
const TRAINER_VOICE_MESSAGES = {
  // 完了時の労いメッセージ
  'akari_completion_01': require('../../assets/audio/trainers/akari_completion_01.mp3'),
  'isuzu_completion_01': require('../../assets/audio/trainers/isuzu_completion_01.mp3'),
  'kana_completion_01': require('../../assets/audio/trainers/kana_completion_01.mp3'),
  'mika_completion_01': require('../../assets/audio/trainers/mika_completion_01.mp3'),
  'rin_completion_01': require('../../assets/audio/trainers/rin_completion_01.mp3'),

  // バリエーション追加用（将来的に）
  'akari_completion_02': require('../../assets/audio/trainers/akari_completion_02.mp3'),
  'isuzu_completion_02': require('../../assets/audio/trainers/isuzu_completion_02.mp3'),
  
  // 励ましメッセージ
  'akari_encouragement_01': require('../../assets/audio/trainers/akari_encouragement_01.mp3'),
  'isuzu_encouragement_01': require('../../assets/audio/trainers/isuzu_encouragement_01.mp3'),
  'kana_encouragement_01': require('../../assets/audio/trainers/kana_encouragement_01.mp3'),
  'mika_encouragement_01': require('../../assets/audio/trainers/mika_encouragement_01.mp3'),
  'rin_encouragement_01': require('../../assets/audio/trainers/rin_encouragement_01.mp3'),

  // 歓迎メッセージ
  'akari_welcome_01': require('../../assets/audio/trainers/akari_welcome_01.mp3'),
  'isuzu_welcome_01': require('../../assets/audio/trainers/isuzu_welcome_01.mp3'),
  'kana_welcome_01': require('../../assets/audio/trainers/kana_welcome_01.mp3'),
  'mika_welcome_01': require('../../assets/audio/trainers/mika_welcome_01.mp3'),
  'rin_welcome_01': require('../../assets/audio/trainers/rin_welcome_01.mp3'),

  // 旧データとの互換性マッピング
  'ena_completion_01': require('../../assets/audio/trainers/akari_completion_01.mp3'),
  'calm_completion_01': require('../../assets/audio/trainers/isuzu_completion_01.mp3'),
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
   * @param trainerId トレーナーIDまたはvoicePrefixまたはavatarImageName
   * @returns 画像リソースまたはnull
   */
  public getTrainerImage(trainerId: string): any {
    if (!this.initialized) {
      this.initialize();
    }

    console.log(`AssetManager.getTrainerImage() called with: "${trainerId}"`);
    
    const image = TRAINER_IMAGES[trainerId as keyof typeof TRAINER_IMAGES];
    if (!image) {
      console.warn(`画像ファイルが見つかりません: ${trainerId}`);
      console.log('利用可能な画像キー:', Object.keys(TRAINER_IMAGES));
      return null;
    }
    
    console.log(`画像取得成功: ${trainerId}`);
    return image;
  }

  /**
   * トレーナー音声の取得（基本版）
   * @param trainerId トレーナーIDまたはvoicePrefix
   * @returns 音声リソースまたはnull
   */
  public getTrainerAudio(trainerId: string): any {
    if (!this.initialized) {
      this.initialize();
    }

    // 画像ファイル名が渡された場合は適切な音声IDに変換
    let actualTrainerId = trainerId;
    if (trainerId.includes('.png')) {
      if (trainerId.includes('ena')) {
        actualTrainerId = 'ena';
      } else if (trainerId.includes('calm')) {
        actualTrainerId = 'calm';
      } else {
        actualTrainerId = trainerId.replace(/^trainer_|\.png$/g, '');
      }
    }

    console.log(`AssetManager.getTrainerAudio() called with original: "${trainerId}", converted: "${actualTrainerId}"`);
    
    const audio = TRAINER_AUDIO[actualTrainerId as keyof typeof TRAINER_AUDIO];
    if (!audio) {
      console.warn(`音声ファイルが見つかりません: ${actualTrainerId}`);
      console.log('利用可能な音声キー:', Object.keys(TRAINER_AUDIO));
      return null;
    }
    
    console.log(`音声取得成功: ${actualTrainerId}`);
    return audio;
  }

  /**
   * トレーナーボイスメッセージの取得（新形式）
   * @param trainerId トレーナーID
   * @param messageType メッセージタイプ（completion, encouragement, welcome）
   * @param variation バリエーション番号（デフォルト: 1）
   * @returns 音声リソースまたはnull
   */
  public getTrainerVoiceMessage(trainerId: string, messageType: string, variation: number = 1): any {
    if (!this.initialized) {
      this.initialize();
    }

    // 画像ファイル名が渡された場合は適切な音声IDに変換
    let actualTrainerId = trainerId;
    if (trainerId.includes('.png')) {
      if (trainerId.includes('ena')) {
        actualTrainerId = 'ena';
      } else if (trainerId.includes('calm')) {
        actualTrainerId = 'calm';
      } else {
        actualTrainerId = trainerId.replace(/^trainer_|\.png$/g, '');
      }
    }

    const variationStr = variation.toString().padStart(2, '0');
    const voiceKey = `${actualTrainerId}_${messageType}_${variationStr}`;
    
    console.log(`AssetManager.getTrainerVoiceMessage() called with original: "${trainerId}", converted: "${actualTrainerId}", voiceKey: "${voiceKey}"`);
    
    const audio = TRAINER_VOICE_MESSAGES[voiceKey as keyof typeof TRAINER_VOICE_MESSAGES];
    if (!audio) {
      console.warn(`音声メッセージが見つかりません: ${voiceKey}`);
      console.log('利用可能なメッセージキー:', Object.keys(TRAINER_VOICE_MESSAGES));
      
      // フォールバック: 基本音声を返す
      return this.getTrainerAudio(actualTrainerId);
    }
    
    console.log(`音声メッセージ取得成功: ${voiceKey}`);
    return audio;
  }

  /**
   * 利用可能なメッセージバリエーションを取得
   * @param trainerId トレーナーID
   * @param messageType メッセージタイプ
   * @returns 利用可能なバリエーション数
   */
  public getAvailableVariations(trainerId: string, messageType: string): number {
    const messageKeys = Object.keys(TRAINER_VOICE_MESSAGES);
    const pattern = `${trainerId}_${messageType}_`;
    const variations = messageKeys
      .filter(key => key.startsWith(pattern))
      .map(key => {
        const match = key.match(/_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    return variations.length > 0 ? Math.max(...variations) : 0;
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
  public getAvailableAssets(): AssetPaths & { voiceMessages: typeof TRAINER_VOICE_MESSAGES } {
    if (!this.initialized) {
      this.initialize();
    }

    return {
      images: { ...TRAINER_IMAGES },
      audio: { ...TRAINER_AUDIO },
      voiceMessages: { ...TRAINER_VOICE_MESSAGES }
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