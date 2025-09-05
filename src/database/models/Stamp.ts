import { Model } from '@nozbe/watermelondb';
import { 
  text, 
  field,
  date, 
  readonly,
  relation 
} from '@nozbe/watermelondb/decorators';

export class StampModel extends Model {
  static table = 'stamps';
  static associations = {
    goals: { type: 'belongs_to', key: 'goal_id' },
  } as const;

  @text('goal_id') goalId!: string;
  @date('date') date!: Date;
  @date('stamped_at') stampedAt!: Date;
  @text('note') note?: string;
  @text('stamp_type') stampType!: string;
  @text('mood') mood?: string;
  @field('difficulty') difficulty!: number;

  @relation('goals', 'goal_id') goal: any;
}