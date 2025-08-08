import { useState, useEffect, useCallback } from 'react';
import { TrainerService } from '../services/TrainerService';
import { Trainer, Result } from '../types';

export function useTrainer() {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const trainerService = new TrainerService();

  // 選択中のトレーナーを取得
  const loadSelectedTrainer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trainerService.getSelectedTrainer();
      
      if (result.success) {
        setSelectedTrainer(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 全トレーナーを取得
  const loadAllTrainers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trainerService.getAllTrainers();
      
      if (result.success) {
        setAllTrainers(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // トレーナーを選択
  const selectTrainer = useCallback(async (trainerId: string): Promise<Result<Trainer>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await trainerService.selectTrainer(trainerId);

      if (result.success) {
        setSelectedTrainer(result.data);
        // 全トレーナーリストも更新
        setAllTrainers(prevTrainers => 
          prevTrainers.map(trainer => ({
            ...trainer,
            isSelected: trainer.id === trainerId
          }))
        );
      } else {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorResult: Result<Trainer> = {
        success: false,
        error: new Error('予期しないエラーが発生しました')
      };
      setError('予期しないエラーが発生しました');
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 励ましボイスを再生
  const playEncouragementVoice = useCallback(async (achievementType: string = 'encouragement'): Promise<Result<void>> => {
    try {
      const result = await trainerService.playEncouragementVoice(achievementType);
      
      if (!result.success) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorResult: Result<void> = {
        success: false,
        error: new Error('音声再生に失敗しました')
      };
      setError('音声再生に失敗しました');
      return errorResult;
    }
  }, []);

  // 祝福ボイスを再生
  const playCelebrationVoice = useCallback(async (): Promise<Result<void>> => {
    return playEncouragementVoice('celebration');
  }, [playEncouragementVoice]);

  // モチベーションボイスを再生
  const playMotivationVoice = useCallback(async (): Promise<Result<void>> => {
    return playEncouragementVoice('motivation');
  }, [playEncouragementVoice]);

  // ウェルカムボイスを再生
  const playWelcomeVoice = useCallback(async (): Promise<Result<void>> => {
    return playEncouragementVoice('welcome');
  }, [playEncouragementVoice]);

  // トレーナーの表示名を取得
  const getTrainerDisplayName = useCallback((trainer?: Trainer): string => {
    if (!trainer && !selectedTrainer) return '未選択';
    const target = trainer || selectedTrainer;
    return target?.name || '未選択';
  }, [selectedTrainer]);

  // トレーナータイプの表示名を取得
  const getTrainerTypeDisplayName = useCallback((trainer?: Trainer): string => {
    const target = trainer || selectedTrainer;
    if (!target) return '';
    
    switch (target.type) {
      case 'energetic':
        return 'エネルギッシュ';
      case 'calm':
        return '穏やか';
      case 'strict':
        return '厳格';
      case 'gentle':
        return '優しい';
      case 'motivational':
        return 'やる気満々';
      default:
        return target.type;
    }
  }, [selectedTrainer]);

  // トレーナーの性格に基づく励ましメッセージを取得
  const getEncouragementMessage = useCallback((): string => {
    if (!selectedTrainer) return 'がんばって！';
    
    const { supportiveWords } = selectedTrainer.personality;
    const randomIndex = Math.floor(Math.random() * supportiveWords.length);
    return supportiveWords[randomIndex] || 'がんばって！';
  }, [selectedTrainer]);

  // トレーナーのキャッチフレーズを取得
  const getCatchphrase = useCallback((): string => {
    if (!selectedTrainer) return '一緒にがんばりましょう！';
    return selectedTrainer.personality.catchphrase;
  }, [selectedTrainer]);

  // 初期読み込み
  useEffect(() => {
    loadSelectedTrainer();
    loadAllTrainers();
  }, [loadSelectedTrainer, loadAllTrainers]);

  return {
    selectedTrainer,
    allTrainers,
    isLoading,
    error,
    loadSelectedTrainer,
    loadAllTrainers,
    selectTrainer,
    playEncouragementVoice,
    playCelebrationVoice,
    playMotivationVoice,
    playWelcomeVoice,
    getTrainerDisplayName,
    getTrainerTypeDisplayName,
    getEncouragementMessage,
    getCatchphrase,
    clearError: () => setError(null)
  };
}