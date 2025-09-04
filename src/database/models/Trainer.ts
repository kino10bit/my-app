import { Model } from '@nozbe/watermelondb';
import { 
  text, 
  field,
  date, 
  children,
  readonly 
} from '@nozbe/watermelondb/decorators';
import { TrainerType, TrainerPersonality } from '../../types/Trainer';

export class TrainerModel extends Model {
  static table = 'trainers';
  static associations = {
    rewards: { type: 'has_many', foreignKey: 'trainer_id' },
  } as const;

  @text('name') name!: string;
  @text('type') type!: TrainerType;
  @field('is_selected') isSelected!: boolean;
  @text('avatar_image_name') avatarImageName!: string;
  @text('voice_prefix') voicePrefix!: string;
  @text('description') description!: string;
  @text('personality') personalityJson!: string;
  @readonly @date('created_at') createdAt!: Date;
  
  // 関連データ
  @children('rewards') rewards: any;

  // 計算プロパティ
  get personality(): TrainerPersonality {
    try {
      return JSON.parse(this.personalityJson || '{}');
    } catch (error) {
      console.warn('Failed to parse trainer personality JSON:', error);
      return {
        catchphrase: '',
        supportiveWords: []
      } as TrainerPersonality;
    }
  }

  set personality(value: TrainerPersonality) {
    this.personalityJson = JSON.stringify(value);
  }

  get displayName(): string {
    return this.name;
  }

  get typeDisplayName(): string {
    switch (this.type) {
      case TrainerType.Energetic:
        return 'エネルギッシュ';
      case TrainerType.Calm:
        return '穏やか';
      case TrainerType.Strict:
        return '厳格';
      case TrainerType.Gentle:
        return '優しい';
      case TrainerType.Motivational:
        return 'やる気満々';
      default:
        return this.type;
    }
  }

  get typeDescription(): string {
    switch (this.type) {
      case TrainerType.Energetic:
        return '元気いっぱいであなたを応援します！';
      case TrainerType.Calm:
        return '落ち着いて着実にサポートします';
      case TrainerType.Strict:
        return '時には厳しく、でも愛情を持って';
      case TrainerType.Gentle:
        return 'いつも優しく寄り添います';
      case TrainerType.Motivational:
        return 'あなたのやる気を最大限に引き出します';
      default:
        return this.description;
    }
  }

  // アクションメソッド
  async select(): Promise<void> {
    const allTrainers = await this.collections.get('trainers').query().fetch();
    
    // 他のトレーナーの選択を解除
    const updatePromises = allTrainers.map(async (trainer: any) => {
      if (trainer.id !== this.id && trainer.isSelected) {
        await trainer.update((t: any) => {
          t.isSelected = false;
        });
      }
    });
    
    await Promise.all(updatePromises);
    
    // このトレーナーを選択
    if (!this.isSelected) {
      await this.update(trainer => {
        trainer.isSelected = true;
      });
    }
  }

  async getAvailableVoiceMessages(): Promise<any[]> {
    // 実装: このトレーナーが利用可能なボイスメッセージを返す
    // voice_messagesテーブルから取得する処理を実装
    return [];
  }

  getVoiceFileName(messageType: string): string {
    return `${this.voicePrefix}_${messageType}.mp3`;
  }
}