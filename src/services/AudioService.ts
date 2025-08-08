import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export class AudioService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private isInitialized: boolean = false;

  async initialize(): Promise<boolean> {
    try {
      // オーディオモードの設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  async playTrainerVoice(fileName: string, message?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          // 初期化失敗時はテキストアラートで代用
          Alert.alert(
            'トレーナーより',
            message || `音声: ${fileName}`,
            [{ text: 'OK' }]
          );
          return true;
        }
      }

      // 実際の音声ファイルがない場合はテキストメッセージで代用
      Alert.alert(
        'トレーナーより',
        message || 'トレーナーからの応援メッセージです！',
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('Failed to play trainer voice:', error);
      Alert.alert('音声エラー', '音声の再生に失敗しました');
      return false;
    }
  }

  async preloadAudioAssets(fileNames: string[]): Promise<boolean> {
    console.log('Audio assets to preload:', fileNames);
    return true; // 簡略化: 実際のプリロードは今後実装
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
      for (const [fileName, sound] of this.sounds.entries()) {
        await sound.stopAsync();
        await sound.unloadAsync();
        this.sounds.delete(fileName);
      }
    } catch (error) {
      console.warn('Error stopping sounds:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.stopAllSounds();
    this.isInitialized = false;
  }

  // 簡略化されたユーティリティメソッド
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

  // 静的なトレーナーボイスファイル一覧
  static getDefaultVoiceFiles(): string[] {
    return [
      'ena_welcome', 'ena_motivation', 'ena_celebration', 'ena_encouragement',
      'calm_welcome', 'calm_motivation', 'calm_celebration', 'calm_encouragement'
    ];
  }
}