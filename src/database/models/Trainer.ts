import { Model } from '@nozbe/watermelondb';
import { 
  text, 
  boolean, 
  date, 
  children,
  readonly 
} from '@nozbe/watermelondb/decorators';
import { TrainerType, TrainerPersonality } from '../../types';

export class TrainerModel extends Model {
  static table = 'trainers';
  static associations = {
    rewards: { type: 'has_many', foreignKey: 'trainer_id' },
  } as const;

  @text('name') name = '';
  @text('type') type: TrainerType = TrainerType.Gentle;
  @boolean('is_selected') isSelected = false;
  @text('avatar_image_name') avatarImageName = '';
  @text('voice_prefix') voicePrefix = '';
  @text('description') description = '';
  @text('personality') personalityJson = '{}';
  @readonly @date('created_at') createdAt = new Date();
  
  // 関連データ
  @children('rewards') rewards: any;

  // 計算プロパティ
  get personality(): TrainerPersonality {
    return JSON.parse(this.personalityJson);
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
    await this.batch(
      // 他のトレーナーの選択を解除
      ...this.collections.get('trainers').query().map((trainer: any) =>
        trainer.prepareUpdate((t: any) => {
          t.isSelected = false;
        })
      ),
      // このトレーナーを選択
      this.prepareUpdate(trainer => {
        trainer.isSelected = true;
      })
    );
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