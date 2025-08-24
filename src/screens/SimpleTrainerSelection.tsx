import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAppContext } from '../context/AppContext';
import { ErrorHandler } from '../utils/ErrorHandler';
import { Validation } from '../utils/Validation';
import { LoadingManager, LoadingKeys } from '../utils/LoadingManager';
import { AssetManager } from '../utils/AssetManager';
import { logAssetStatus, checkTrainerAssets, resetDatabaseWithNewTrainers } from '../utils/AssetHelper';


export default function SimpleTrainerSelection() {
  const { selectedTrainer, trainers, audioService, isLoading, selectTrainer, refreshData } = useAppContext();
  const [localSelectedTrainer, setLocalSelectedTrainer] = useState(selectedTrainer);
  const assetManager = AssetManager.getInstance();

  useEffect(() => {
    setLocalSelectedTrainer(selectedTrainer);
    // AssetManagerの初期化
    assetManager.initialize();
    
    // デバッグ: アセット状況とトレーナー情報をログ出力
    if (__DEV__) {
      logAssetStatus();
      
      // トレーナー情報の詳細デバッグ
      console.log('=== トレーナーデータ詳細 ===');
      trainers.forEach((trainer, index) => {
        console.log(`${index + 1}. ${trainer.name}:`);
        console.log(`  - ID: ${trainer.id}`);
        console.log(`  - voicePrefix: ${trainer.voicePrefix}`);
        console.log(`  - avatarImageName: ${trainer.avatarImageName}`);
        console.log(`  - type: ${trainer.type}`);
      });
      
      // データベースリセットオプション（デバッグ用）
      // 既存の古いデータをクリアして新しいトレーナーデータで再作成
      const resetData = async () => {
        await resetDatabaseWithNewTrainers();
        // データベースリセット後にデータを再読み込み
        setTimeout(async () => {
          await refreshData();
          console.log('データ再読み込み完了');
        }, 1000);
      };
      resetData();
    }
  }, [selectedTrainer, assetManager]);

  const getTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'energetic': return 'エネルギッシュ';
      case 'calm': return '穏やか';
      case 'strict': return '厳格';
      case 'gentle': return '優しい';
      case 'motivational': return 'やる気満々';
      default: return type;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'energetic': return '#FF6B6B';
      case 'calm': return '#4ECDC4';
      case 'strict': return '#FF9F43';
      case 'gentle': return '#F7B731';
      case 'motivational': return '#5F27CD';
      default: return '#007AFF';
    }
  };

  const getTrainerImage = (trainer: any) => {
    // voicePrefixまたはavatarImageNameを使用してファイルを取得
    const imageKey = trainer.voicePrefix || trainer.avatarImageName || trainer.id;
    console.log(`画像取得試行: ${trainer.name} -> imageKey: ${imageKey}`);
    return assetManager.getTrainerImage(imageKey);
  };

  const getTrainerAudio = (trainer: any) => {
    // voicePrefixを使用して音声ファイルを取得
    const audioKey = trainer.voicePrefix || trainer.id;
    console.log(`音声取得試行: ${trainer.name} -> audioKey: ${audioKey}`);
    return assetManager.getTrainerAudio(audioKey);
  };

  const handleSelectTrainer = async (trainer: any) => {
    setLocalSelectedTrainer(trainer);
  };

  const handleConfirmSelection = async () => {
    // Validation
    const validationResult = Validation.validateTrainerSelection(localSelectedTrainer);
    if (!validationResult.isValid) {
      Validation.showValidationErrors(validationResult.errors);
      return;
    }

    const loadingManager = LoadingManager.getInstance();
    
    const result = await loadingManager.withLoading(
      LoadingKeys.TRAINER_SELECT,
      async () => {
        await selectTrainer(localSelectedTrainer);
        return true;
      },
      {
        successMessage: `🎉 トレーナーを選択しました！\n${localSelectedTrainer.name}があなたの専属トレーナーになりました！\n\n「${localSelectedTrainer.personality.catchphrase}」\n\n一緒に目標達成を目指しましょう！`,
        errorHandler: (error) => {
          const appError = ErrorHandler.handleError(error, 'trainer_selection');
          ErrorHandler.showUserError(appError, 'トレーナー選択エラー');
        }
      }
    );

    if (result) {
      // Success handled by LoadingManager
    }
  };

  const playVoiceSample = async (trainer: any) => {
    const loadingManager = LoadingManager.getInstance();
    
    await loadingManager.withLoading(
      LoadingKeys.AUDIO_PLAY,
      async () => {
        try {
          const audioSource = getTrainerAudio(trainer);
          if (!audioSource) {
            // 音声ファイルがない場合は、トレーナーからのメッセージをテキストで表示
            const welcomeMessage = `${trainer.name}：「${trainer.personality?.catchphrase || 'よろしくお願いします！'}」`;
            ErrorHandler.showUserError({
              message: welcomeMessage,
              code: 'AUDIO_NOT_AVAILABLE',
              severity: 'info'
            }, '🔊 音声メッセージ');
            return false;
          }
          
          const { sound } = await Audio.Sound.createAsync(audioSource);
          await sound.playAsync();
          
          // 音声再生完了後にサウンドを解放
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
          
          return true;
        } catch (error) {
          console.error('音声再生エラー:', error);
          // フォールバック: テキストメッセージ表示
          const welcomeMessage = `${trainer.name}：「${trainer.personality?.catchphrase || 'よろしくお願いします！'}」`;
          ErrorHandler.showUserError({
            message: welcomeMessage,
            code: 'AUDIO_PLAYBACK_FAILED',
            severity: 'info'
          }, '🔊 音声メッセージ');
          return false;
        }
      },
      {
        errorHandler: (error) => {
          const appError = ErrorHandler.handleError(error, 'audio_playback');
          ErrorHandler.showUserError(appError, '音声再生エラー');
        }
      }
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>トレーナー情報を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>トレーナー選択</Text>
        <Text style={styles.subtitle}>あなた専属のトレーナーを選んでください</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {trainers.map((trainer) => {
          const color = getTypeColor(trainer.type);
          const trainerImage = getTrainerImage(trainer);
          return (
            <TouchableOpacity
              key={trainer.id}
              style={[
                styles.trainerCard,
                selectedTrainer?.id === trainer.id && styles.selectedCard,
                { 
                  borderColor: color,
                  backgroundColor: selectedTrainer?.id === trainer.id 
                    ? color + '08' 
                    : 'white'
                }
              ]}
              onPress={() => handleSelectTrainer(trainer)}
            >
              {/* トレーナー情報 */}
              <View style={styles.trainerHeader}>
                <View style={[styles.avatarContainer, { borderColor: color, backgroundColor: color + '20' }]}>
                  {trainerImage ? (
                    <Image
                      source={trainerImage}
                      style={styles.trainerImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.warn(`画像の読み込みに失敗しました: ${trainer.id}`, error);
                      }}
                      onLoad={() => {
                        console.log(`画像読み込み成功: ${trainer.id}`);
                      }}
                    />
                  ) : (
                    <View style={styles.trainerImagePlaceholder}>
                      <Text style={styles.trainerImageText}>{trainer.name.charAt(0)}</Text>
                      <Text style={styles.trainerTypeEmoji}>
                        {trainer.type === 'energetic' ? '✨' :
                         trainer.type === 'calm' ? '🌿' :
                         trainer.type === 'strict' ? '💪' :
                         trainer.type === 'gentle' ? '🌸' :
                         trainer.type === 'motivational' ? '🔥' : '👤'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: color }]}>
                    <Text style={styles.typeText}>{getTypeDisplayName(trainer.type)}</Text>
                  </View>
                </View>

                {localSelectedTrainer?.id === trainer.id && (
                  <View style={styles.selectedIcon}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                )}
              </View>

              {/* キャッチフレーズ */}
              <View style={[styles.catchphraseContainer, { borderLeftColor: color }]}>
                <Text style={styles.catchphrase}>&ldquo;{trainer.personality.catchphrase}&rdquo;</Text>
              </View>

              {/* 説明 */}
              <Text style={styles.description}>{trainer.description}</Text>

              {/* アクションボタン */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.voiceButton, { backgroundColor: color }]}
                  onPress={() => playVoiceSample(trainer)}
                >
                  <Text style={styles.voiceButtonText}>🔊 声を聞く</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    localSelectedTrainer?.id === trainer.id 
                      ? { backgroundColor: color }
                      : { borderColor: color, borderWidth: 2 }
                  ]}
                  onPress={() => handleSelectTrainer(trainer)}
                >
                  <Text style={[
                    styles.selectButtonText,
                    localSelectedTrainer?.id === trainer.id 
                      ? { color: 'white' }
                      : { color: color }
                  ]}>
                    {localSelectedTrainer?.id === trainer.id ? '選択中' : '選択'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* 選択済みトレーナーの詳細 */}
        {localSelectedTrainer && (
          <View style={[styles.selectionSummary, { borderColor: getTypeColor(localSelectedTrainer.type) }]}>
            <Text style={styles.summaryTitle}>選択中のトレーナー</Text>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryName}>{localSelectedTrainer.name}</Text>
              <Text style={styles.summaryType}>
                {getTypeDisplayName(localSelectedTrainer.type)}タイプ
              </Text>
              <Text style={styles.summaryWords}>
                応援メッセージ例: {localSelectedTrainer.personality?.supportiveWords?.slice(0, 3)?.join('、') || 'データなし'}など
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 確定ボタン */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            localSelectedTrainer && { backgroundColor: getTypeColor(localSelectedTrainer.type) }
          ]}
          onPress={handleConfirmSelection}
          disabled={!localSelectedTrainer}
        >
          <Text style={[
            styles.confirmButtonText,
            !localSelectedTrainer && { color: '#999' }
          ]}>
            このトレーナーに決定
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  trainerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedCard: {
    borderWidth: 3,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  trainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#ddd',
    overflow: 'hidden',
    position: 'relative',
  },
  trainerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
  },
  trainerImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 47,
  },
  trainerImageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  trainerTypeEmoji: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  avatarEmoji: {
    fontSize: 12,
    textAlign: 'center',
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  catchphraseContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  catchphrase: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voiceButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectionSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  summaryWords: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 34,
  },
  confirmButton: {
    backgroundColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});