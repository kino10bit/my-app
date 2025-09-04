import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { AssetManager } from '../utils/AssetManager';

export class AudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private isInitialized: boolean = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing AudioService...');
      
      // オーディオモードの設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      this.isInitialized = true;
      console.log('AudioService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      console.error('Error details:', error);
      return false;
    }
  }

  async playTrainerVoice(fileName: string, message?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('Audio initialization failed for:', fileName);
          return false;
        }
      }

      console.log(`Attempting to play trainer voice: ${fileName}`);
      if (message) {
        console.log(`Message: ${message}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to play trainer voice:', error);
      return false;
    }
  }

  async preloadAudioAssets(fileNames: string[]): Promise<boolean> {
    try {
      console.log('Preloading audio assets:', fileNames);
      
      // TODO: 実際のプリロード実装
      // for (const fileName of fileNames) {
      //   const sound = new Audio.Sound();
      //   await sound.loadAsync(getAudioSource(fileName));
      //   this.sounds.set(fileName, sound);
      // }
      
      return true;
    } catch (error) {
      console.error('Failed to preload audio assets:', error);
      return false;
    }
  }

  async setVolumeLevel(level: number): Promise<boolean> {
    try {
      const normalizedLevel = Math.max(0, Math.min(1, level));
      console.log('Setting volume level:', normalizedLevel);
      return true;
    } catch (error) {
      console.error('Failed to set volume:', error);
      return false;
    }
  }

  async stopAllSounds(): Promise<void> {
    try {
      console.log('Stopping all sounds...');
      for (const [fileName, sound] of this.sounds.entries()) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (soundError) {
          console.warn(`Error stopping sound ${fileName}:`, soundError);
        }
        this.sounds.delete(fileName);
      }
      console.log('All sounds stopped');
    } catch (error) {
      console.warn('Error stopping sounds:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.stopAllSounds();
    this.isInitialized = false;
  }

  // AssetManagerと連携した音声再生
  async playTrainerCompletionVoice(trainerId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const assetManager = AssetManager.getInstance();
      console.log(`Playing completion voice for trainer: ${trainerId}`);
      
      // 完了メッセージの音声を取得して再生
      const audioAsset = assetManager.getTrainerVoiceMessage(trainerId, 'completion', 1);
      
      if (audioAsset) {
        console.log(`Playing completion message for ${trainerId}`);
        return await this.playAudioAsset(audioAsset, `${trainerId}の完了メッセージ`);
      }
      
      // フォールバック: 基本音声を再生
      console.log('Falling back to basic trainer audio');
      const basicAudio = assetManager.getTrainerAudio(trainerId);
      if (basicAudio) {
        return await this.playAudioAsset(basicAudio, `${trainerId}の基本ボイス`);
      }
      
      console.warn(`No audio found for trainer: ${trainerId}`);
      return false;
    } catch (error) {
      console.error('Failed to play trainer completion voice:', error);
      return false;
    }
  }

  // 簡単なテスト音再生
  async playSimpleTestSound(): Promise<boolean> {
    try {
      console.log('Playing simple test sound...');
      
      // 実際のアセットファイルでテスト
      const assetManager = AssetManager.getInstance();
      const testAudio = assetManager.getTrainerAudio('akari'); // akari.mp3でテスト
      
      if (testAudio) {
        console.log('Testing with akari.mp3...');
        const { sound } = await Audio.Sound.createAsync(testAudio, {
          shouldPlay: true,
          volume: 1.0
        });
        
        sound.setOnPlaybackStatusUpdate((status) => {
          console.log('Playback status:', status);
          if (status.isLoaded && status.didJustFinish) {
            console.log('Audio playback finished');
            sound.unloadAsync();
            Alert.alert('音声テスト', '音声ファイルの再生が完了しました。音が聞こえた場合は成功です。', [{ text: 'OK' }]);
          } else if (status.isLoaded && status.error) {
            console.error('Playback error:', status.error);
            Alert.alert('音声エラー', `音声再生エラー: ${status.error}`, [{ text: 'OK' }]);
          }
        });
        
        console.log('Audio playback started');
        return true;
      } else {
        console.error('Test audio asset not found');
        Alert.alert('音声テスト', 'テスト用音声ファイルが見つかりません。', [{ text: 'OK' }]);
        return false;
      }
    } catch (error) {
      console.error('Failed to play simple test sound:', error);
      Alert.alert('音声エラー', `テスト音声の再生に失敗: ${error}`, [{ text: 'OK' }]);
      return false;
    }
  }

  // アセットから直接音声を再生するメソッド
  async playAudioAsset(audioAsset: any, description?: string): Promise<boolean> {
    try {
      console.log(`=== playAudioAsset called ===`);
      console.log(`Description: ${description || 'Unknown'}`);
      console.log(`AudioService initialized: ${this.isInitialized}`);
      console.log(`Audio asset type: ${typeof audioAsset}`);
      console.log(`Audio asset:`, audioAsset);
      
      if (!this.isInitialized) {
        console.log('Initializing AudioService...');
        await this.initialize();
      }
      
      if (!audioAsset) {
        console.warn('Audio asset is null or undefined');
        return false;
      }
      
      console.log('Creating sound object...');
      // 音声オブジェクトを作成して再生
      const { sound } = await Audio.Sound.createAsync(audioAsset, {
        shouldPlay: true,
        volume: 1.0
      });
      
      console.log('Sound object created successfully');
      
      // 音声オブジェクトをマップに保存（管理用）
      const soundId = `asset_${Date.now()}`;
      this.sounds.set(soundId, sound);
      
      // 再生終了後にリソースを解放
      sound.setOnPlaybackStatusUpdate((status) => {
        console.log('Playback status update:', status);
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          this.sounds.delete(soundId);
          console.log('Audio playback finished and cleaned up');
        } else if (status.isLoaded && status.error) {
          console.error('Audio playback error:', status.error);
          sound.unloadAsync();
          this.sounds.delete(soundId);
        }
      });
      
      console.log('Audio playback started successfully');
      return true;
    } catch (error) {
      console.error('Failed to play audio asset:', error);
      console.error('Error details:', error);
      return false;
    }
  }

  // 簡略化されたユーティリティメソッド（テキストメッセージ用）
  getTrainerVoiceMessage(trainerType: string, messageType: string): string {
    const messages: Record<string, Record<string, string[]>> = {
      energetic: {
        welcome: ['今日も元気に頑張ろう！', 'やる気満々だね！', '一緒に頑張ろう！'],
        celebration: ['やったね！すごいじゃない！', 'その調子その調子！', '素晴らしい！'],
        encouragement: ['頑張って！', 'きっとできる！', '応援してるよ！'],
        motivation: ['今日も最高の一日にしよう！', '目標に向かって突き進もう！']
      },
      calm: {
        welcome: ['今日も一歩ずつ進みましょう', 'ゆっくりでも大丈夫', '着実に進んでいますね'],
        celebration: ['よく頑張りました', '素晴らしいですね', '順調に進んでいます'],
        encouragement: ['その調子です', '焦らずに進みましょう', 'あなたのペースで'],
        motivation: ['一歩ずつ、着実に', '継続は力なりです', '今日も穏やかに']
      }
    };

    const typeMessages = messages[trainerType] || messages.energetic;
    const msgArray = typeMessages[messageType] || typeMessages.welcome;
    return msgArray[Math.floor(Math.random() * msgArray.length)];
  }

  // 新しい音声メッセージシステム用のファイル一覧
  static getCompletionVoiceFiles(): string[] {
    return [
      'akari_completion_01', 'isuzu_completion_01', 'kana_completion_01', 
      'mika_completion_01', 'rin_completion_01',
      'akari_completion_02', 'isuzu_completion_02',
      'ena_completion_01', 'calm_completion_01'
    ];
  }

  // 静的なトレーナーボイスファイル一覧（旧形式との互換性維持）
  static getDefaultVoiceFiles(): string[] {
    return [
      'ena_welcome', 'ena_motivation', 'ena_celebration', 'ena_encouragement',
      'calm_welcome', 'calm_motivation', 'calm_celebration', 'calm_encouragement'
    ];
  }
}