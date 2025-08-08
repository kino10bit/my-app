import { getDatabase } from '../database/database';
import { TrainerModel } from '../database/models';
import { Trainer, Result, AppError, AppErrorType } from '../types';
import { AudioService } from './AudioService';

export class TrainerService {
  private audioService: AudioService;

  constructor() {
    this.audioService = new AudioService();
  }

  async getSelectedTrainer(): Promise<Result<Trainer>> {
    try {
      const database = getDatabase();
      const trainerModels = await database.collections
        .get<TrainerModel>('trainers')
        .query()
        .fetch();

      const selectedModel = trainerModels.find(model => model.isSelected);
      
      if (!selectedModel) {
        // デフォルトトレーナーを選択
        const firstTrainer = trainerModels[0];
        if (firstTrainer) {
          await firstTrainer.select();
          const trainer = this.modelToTrainer(firstTrainer);
          return {
            success: true,
            data: trainer
          };
        } else {
          return {
            success: false,
            error: new AppError(
              AppErrorType.Database, 
              'トレーナーが見つかりませんでした'
            )
          };
        }
      }

      const trainer = this.modelToTrainer(selectedModel);
      
      return {
        success: true,
        data: trainer
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          'トレーナーの取得に失敗しました'
        )
      };
    }
  }

  async getAllTrainers(): Promise<Result<Trainer[]>> {
    try {
      const database = getDatabase();
      const trainerModels = await database.collections
        .get<TrainerModel>('trainers')
        .query()
        .fetch();

      const trainers = trainerModels.map(model => this.modelToTrainer(model));
      
      return {
        success: true,
        data: trainers
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          'トレーナー一覧の取得に失敗しました'
        )
      };
    }
  }

  async selectTrainer(trainerId: string): Promise<Result<Trainer>> {
    try {
      const database = getDatabase();
      const trainerModel = await database.collections
        .get<TrainerModel>('trainers')
        .find(trainerId);

      await trainerModel.select();
      
      const trainer = this.modelToTrainer(trainerModel);
      
      return {
        success: true,
        data: trainer
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          'トレーナーの選択に失敗しました'
        )
      };
    }
  }

  async playEncouragementVoice(achievementType: string): Promise<Result<void>> {
    try {
      const selectedTrainerResult = await this.getSelectedTrainer();
      
      if (!selectedTrainerResult.success) {
        return selectedTrainerResult;
      }

      const trainer = selectedTrainerResult.data;
      const voiceFileName = `${trainer.voicePrefix}_${achievementType}`;
      
      const playResult = await this.audioService.playTrainerVoice(voiceFileName);
      
      if (!playResult.success) {
        return playResult;
      }

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.AudioPlayback, 
          'ボイス再生に失敗しました',
          '音量設定を確認してください'
        )
      };
    }
  }

  async playCelebrationVoice(): Promise<Result<void>> {
    return this.playEncouragementVoice('celebration');
  }

  async playMotivationVoice(): Promise<Result<void>> {
    return this.playEncouragementVoice('motivation');
  }

  async playWelcomeVoice(): Promise<Result<void>> {
    return this.playEncouragementVoice('welcome');
  }

  async getTrainerRewards(trainerId: string): Promise<Result<any[]>> {
    try {
      // TODO: Rewardモデルの実装後にここを更新
      const rewards: any[] = [];
      
      return {
        success: true,
        data: rewards
      };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          AppErrorType.Database, 
          'トレーナー報酬の取得に失敗しました'
        )
      };
    }
  }

  // プライベートメソッド: モデルから型へ変換
  private modelToTrainer(model: TrainerModel): Trainer {
    return {
      id: model.id,
      name: model.name,
      type: model.type,
      isSelected: model.isSelected,
      avatarImageName: model.avatarImageName,
      voicePrefix: model.voicePrefix,
      description: model.description,
      personality: model.personality,
      createdAt: model.createdAt,
      rewards: [], // TODO: 関連データを取得
      availableVoiceMessages: [] // TODO: 関連データを取得
    };
  }
}