import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const dbSchema = appSchema({
  version: 1,
  tables: [
    // Trainer テーブル
    tableSchema({
      name: 'trainers',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'is_selected', type: 'boolean' },
        { name: 'avatar_image_name', type: 'string' },
        { name: 'voice_prefix', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'personality', type: 'string' }, // JSON string
        { name: 'created_at', type: 'number' },
      ]
    }),

    // Goal テーブル
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'target_description', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'target_end_date', type: 'number', isOptional: true },
        { name: 'motivation', type: 'string' },
        { name: 'difficulty', type: 'number' },
        { name: 'total_stamps', type: 'number' },
        { name: 'current_streak', type: 'number' },
        { name: 'best_streak', type: 'number' },
        { name: 'last_stamp_date', type: 'number', isOptional: true },
      ]
    }),

    // DailyAction テーブル
    tableSchema({
      name: 'daily_actions',
      columns: [
        { name: 'goal_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'is_required', type: 'boolean' },
        { name: 'estimated_minutes', type: 'number' },
        { name: 'reminder_hour', type: 'number', isOptional: true },
        { name: 'reminder_minute', type: 'number', isOptional: true },
        { name: 'is_reminder_enabled', type: 'boolean' },
        { name: 'sort_order', type: 'number' },
        { name: 'created_at', type: 'number' },
      ]
    }),

    // Stamp テーブル
    tableSchema({
      name: 'stamps',
      columns: [
        { name: 'goal_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'stamped_at', type: 'number' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'stamp_type', type: 'string' },
        { name: 'mood', type: 'string', isOptional: true },
        { name: 'difficulty', type: 'number' },
      ]
    }),

    // Reward テーブル
    tableSchema({
      name: 'rewards',
      columns: [
        { name: 'trainer_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'threshold', type: 'number' },
        { name: 'is_unlocked', type: 'boolean' },
        { name: 'unlocked_at', type: 'number', isOptional: true },
        { name: 'content_file_name', type: 'string' },
        { name: 'rarity', type: 'string' },
        { name: 'category', type: 'string' },
      ]
    }),

    // AppSettings テーブル
    tableSchema({
      name: 'app_settings',
      columns: [
        { name: 'selected_trainer_id', type: 'string', isOptional: true },
        { name: 'is_first_launch', type: 'boolean' },
        { name: 'voice_volume', type: 'number' },
        { name: 'notification_enabled', type: 'boolean' },
        { name: 'preferred_notification_time', type: 'number' },
        { name: 'theme_mode', type: 'string' },
        { name: 'language', type: 'string' },
        { name: 'haptic_feedback_enabled', type: 'boolean' },
        { name: 'animations_enabled', type: 'boolean' },
        { name: 'total_app_usage_days', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
});