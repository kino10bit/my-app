# Android 適応計画設計書

## 概要
AppcadiaアプリケーションのAndroid対応設計。Material Design準拠のUI/UX、Android固有機能の活用、パフォーマンス最適化を通じて、Androidユーザーにネイティブな体験を提供する計画書。

## Android適応戦略

### 1. 開発方針
- **React Native First**: iOS版のコードベースを最大活用
- **Material Design 3**: Android 12+ のデザイン言語準拠
- **段階的展開**: 主要機能から順次対応
- **パフォーマンス重視**: Android端末の多様性を考慮した最適化

### 2. 適応優先度
```typescript
// 適応計画の優先度定義
export const ANDROID_ADAPTATION_PRIORITY = {
  Phase1_Core: {
    priority: 'Critical',
    timeline: '3-4ヶ月',
    features: [
      'core_goal_management',     // 基本目標管理
      'trainer_selection',        // トレーナー選択
      'basic_notifications',      // 基本通知
      'material_design_ui',       // Material Design UI
      'android_navigation'        // Android標準ナビゲーション
    ]
  },
  
  Phase2_Enhanced: {
    priority: 'High',
    timeline: '2-3ヶ月',
    features: [
      'widgets',                  // ホームスクリーンウィジェット
      'shortcuts',                // アプリショートカット
      'advanced_notifications',   // 高度な通知機能
      'android_share',            // Android共有機能
      'adaptive_icons'            // アダプティブアイコン
    ]
  },
  
  Phase3_Platform: {
    priority: 'Medium',
    timeline: '2-3ヶ月',
    features: [
      'tasker_integration',       // Tasker統合
      'android_auto',             // Android Auto対応
      'work_profile',             // 仕事用プロファイル
      'android_12_features',      // Android 12+固有機能
      'foldable_support'          // 折りたたみ端末対応
    ]
  }
} as const;
```

## UI/UX 適応設計

### 1. Material Design 3 実装
```typescript
// theme/MaterialTheme.ts
export const MaterialTheme = {
  // Material Design 3 カラースキーム
  colors: {
    // Primary色系統
    primary: '#6750A4',           // ブランドカラー
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    
    // Secondary色系統
    secondary: '#625B71',
    onSecondary: '#FFFFFF', 
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    
    // Tertiary色系統
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    
    // Error色系統
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    
    // Surface色系統
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    
    // Outline
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    
    // Dynamic Colors (Android 12+)
    dynamicPrimary: '@android:color/system_accent1_600',
    dynamicOnPrimary: '@android:color/system_accent1_0',
    
    // Dark Theme
    dark: {
      primary: '#D0BCFF',
      onPrimary: '#381E72',
      primaryContainer: '#4F378B',
      onPrimaryContainer: '#EADDFF',
      
      surface: '#1C1B1F',
      onSurface: '#E6E1E5',
      surfaceVariant: '#49454F',
      onSurfaceVariant: '#CAC4D0'
    }
  },
  
  // Typography Scale
  typography: {
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400',
      letterSpacing: -0.25
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400',
      letterSpacing: 0
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400',
      letterSpacing: 0
    },
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400',
      letterSpacing: 0
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400',
      letterSpacing: 0
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400',
      letterSpacing: 0
    },
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '400',
      letterSpacing: 0
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0.15
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0.5
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0.25
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.4
    },
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5
    }
  },
  
  // Elevation (影とレイヤー)
  elevation: {
    level0: 0,    // 表面
    level1: 1,    // カード
    level2: 3,    // ボタン
    level3: 6,    // FAB
    level4: 8,    // ナビゲーション
    level5: 12    // モーダル
  },
  
  // Shape (角丸)
  shapes: {
    none: 0,
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 28,
    full: 9999
  }
};
```

### 2. Material Components実装
```typescript
// components/android/MaterialComponents.tsx
import { MaterialTheme } from '../../theme/MaterialTheme';

// Material Design 3 対応ボタン
export const MaterialButton: React.FC<MaterialButtonProps> = ({
  variant = 'filled',
  children,
  onPress,
  disabled = false,
  icon,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      height: 40,
      borderRadius: MaterialTheme.shapes.full,
      paddingHorizontal: 24,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row' as const
    };
    
    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: MaterialTheme.colors.primary,
          elevation: MaterialTheme.elevation.level0
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: MaterialTheme.colors.outline
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingHorizontal: 12
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: MaterialTheme.colors.surface,
          elevation: MaterialTheme.elevation.level1
        };
      case 'tonal':
        return {
          ...baseStyle,
          backgroundColor: MaterialTheme.colors.secondaryContainer
        };
      default:
        return baseStyle;
    }
  };
  
  const getTextColor = () => {
    switch (variant) {
      case 'filled':
        return MaterialTheme.colors.onPrimary;
      case 'outlined':
      case 'text':
        return MaterialTheme.colors.primary;
      case 'elevated':
        return MaterialTheme.colors.primary;
      case 'tonal':
        return MaterialTheme.colors.onSecondaryContainer;
      default:
        return MaterialTheme.colors.onSurface;
    }
  };
  
  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled}
      style={[getButtonStyle(), disabled && { opacity: 0.38 }]}
      rippleColor={MaterialTheme.colors.primary + '20'}
      {...props}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && (
          <Icon 
            name={icon} 
            size={18} 
            color={getTextColor()} 
            style={{ marginRight: 8 }} 
          />
        )}
        <Text 
          style={[
            MaterialTheme.typography.labelLarge,
            { color: getTextColor() }
          ]}
        >
          {children}
        </Text>
      </View>
    </TouchableRipple>
  );
};

// Material Design 3 対応カード
export const MaterialCard: React.FC<MaterialCardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: MaterialTheme.shapes.medium,
      padding: 16,
      margin: 8
    };
    
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: MaterialTheme.colors.surface,
          elevation: MaterialTheme.elevation.level1
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: MaterialTheme.colors.surfaceVariant
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: MaterialTheme.colors.surface,
          borderWidth: 1,
          borderColor: MaterialTheme.colors.outlineVariant
        };
      default:
        return baseStyle;
    }
  };
  
  if (onPress) {
    return (
      <TouchableRipple
        onPress={onPress}
        style={getCardStyle()}
        rippleColor={MaterialTheme.colors.primary + '10'}
        {...props}
      >
        {children}
      </TouchableRipple>
    );
  }
  
  return (
    <View style={getCardStyle()} {...props}>
      {children}
    </View>
  );
};
```

## Android固有機能統合

### 1. ホームスクリーンウィジェット
```typescript
// android/widgets/GoalWidget.tsx
export class AndroidGoalWidget {
  
  // ウィジェット設定
  static configuration = {
    name: 'AppcadiaGoalWidget',
    description: '今日の目標進捗を表示',
    previewImage: 'widget_preview.png',
    supportedSizes: ['small', 'medium', 'large'],
    resizeMode: 'horizontal|vertical',
    updatePeriod: 30 * 60 * 1000, // 30分間隔
    configure: 'ConfigActivity'
  };
  
  // ウィジェット更新
  static async updateWidget(context: WidgetContext): Promise<RemoteViews> {
    const goals = await this.getWidgetData();
    const completedCount = goals.filter(g => g.isCompletedToday).length;
    const totalCount = goals.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    const views = new RemoteViews(context.packageName, R.layout.widget_goal);
    
    // プログレステキスト設定
    views.setTextViewText(
      R.id.progress_text, 
      `${completedCount}/${totalCount} 完了`
    );
    
    // プログレスバー設定
    views.setProgressBar(R.id.progress_bar, 100, Math.round(progress), false);
    
    // 目標リスト設定
    views.removeAllViews(R.id.goal_list);
    
    for (let i = 0; i < Math.min(goals.length, 3); i++) {
      const goal = goals[i];
      const goalView = new RemoteViews(context.packageName, R.layout.widget_goal_item);
      
      goalView.setTextViewText(R.id.goal_title, goal.title);
      goalView.setImageViewResource(
        R.id.goal_status,
        goal.isCompletedToday ? R.drawable.ic_check_circle : R.drawable.ic_circle
      );
      
      // タップ時のインテント設定
      const intent = new Intent(context, GoalCompletionService.class);
      intent.putExtra('goalId', goal.id);
      const pendingIntent = PendingIntent.getService(
        context,
        goal.id.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT
      );
      goalView.setOnClickPendingIntent(R.id.goal_item, pendingIntent);
      
      views.addView(R.id.goal_list, goalView);
    }
    
    // アプリ起動インテント
    const appIntent = new Intent(context, MainActivity.class);
    const appPendingIntent = PendingIntent.getActivity(
      context,
      0,
      appIntent,
      PendingIntent.FLAG_UPDATE_CURRENT
    );
    views.setOnClickPendingIntent(R.id.widget_container, appPendingIntent);
    
    return views;
  }
  
  // ウィジェット設定画面
  static createConfigActivity(): AndroidConfigActivity {
    return {
      layout: R.layout.widget_config,
      
      onCreate() {
        // 設定オプションの初期化
        this.initializeOptions([
          {
            key: 'show_completed',
            title: '完了済み目標も表示',
            type: 'boolean',
            default: false
          },
          {
            key: 'max_goals',
            title: '最大表示数',
            type: 'number',
            default: 3,
            min: 1,
            max: 5
          },
          {
            key: 'update_frequency',
            title: '更新頻度',
            type: 'select',
            options: [
              { value: 15, label: '15分' },
              { value: 30, label: '30分' },
              { value: 60, label: '1時間' }
            ],
            default: 30
          }
        ]);
      },
      
      onSave(config: WidgetConfig) {
        // 設定保存
        const prefs = this.getSharedPreferences('widget_config', Context.MODE_PRIVATE);
        const editor = prefs.edit();
        
        Object.entries(config).forEach(([key, value]) => {
          editor.putString(key, JSON.stringify(value));
        });
        
        editor.apply();
        
        // ウィジェット更新
        this.updateWidget();
        this.setResult(Activity.RESULT_OK);
        this.finish();
      }
    };
  }
}
```

### 2. アプリショートカット
```typescript
// services/android/ShortcutsService.ts
export class AndroidShortcutsService {
  
  // 動的ショートカット作成
  static async createDynamicShortcuts(): Promise<void> {
    const shortcutManager = this.getShortcutManager();
    
    const shortcuts: ShortcutInfo[] = [
      // クイック目標追加
      {
        id: 'add_goal',
        shortLabel: '目標追加',
        longLabel: '新しい目標を追加',
        icon: Icon.createWithResource(context, R.drawable.ic_add_goal),
        intent: new Intent(Intent.ACTION_VIEW)
          .setClass(context, MainActivity.class)
          .putExtra('action', 'add_goal')
          .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK),
        rank: 0
      },
      
      // 今日の進捗確認
      {
        id: 'check_progress',
        shortLabel: '進捗確認',
        longLabel: '今日の進捗を確認',
        icon: Icon.createWithResource(context, R.drawable.ic_progress),
        intent: new Intent(Intent.ACTION_VIEW)
          .setClass(context, MainActivity.class)
          .putExtra('action', 'check_progress')
          .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK),
        rank: 1
      },
      
      // 最も使用頻度の高い目標
      ...(await this.getFrequentGoalShortcuts())
    ];
    
    shortcutManager.setDynamicShortcuts(shortcuts);
  }
  
  // 使用頻度の高い目標からショートカット作成
  private static async getFrequentGoalShortcuts(): Promise<ShortcutInfo[]> {
    const goals = await database.get<Goal>('goals')
      .query(Q.sortBy('last_accessed_at', Q.desc))
      .fetch();
    
    return goals.slice(0, 2).map((goal, index) => ({
      id: `goal_${goal.id}`,
      shortLabel: goal.title.substring(0, 12),
      longLabel: `${goal.title}を実行`,
      icon: Icon.createWithBitmap(this.generateGoalIcon(goal)),
      intent: new Intent(Intent.ACTION_VIEW)
        .setClass(context, MainActivity.class)
        .putExtra('action', 'complete_goal')
        .putExtra('goalId', goal.id)
        .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK),
      rank: index + 2
    }));
  }
  
  // ショートカットからの起動処理
  static handleShortcutIntent(intent: Intent): void {
    const action = intent.getStringExtra('action');
    
    switch (action) {
      case 'add_goal':
        NavigationService.navigate('GoalCreation');
        break;
      case 'check_progress':
        NavigationService.navigate('Progress');
        break;
      case 'complete_goal':
        const goalId = intent.getStringExtra('goalId');
        this.handleQuickGoalCompletion(goalId);
        break;
    }
  }
  
  private static async handleQuickGoalCompletion(goalId: string): Promise<void> {
    try {
      const goalService = new GoalService();
      await goalService.addStampToGoal(goalId);
      
      // 成功通知
      ToastAndroid.show('目標を完了しました！', ToastAndroid.SHORT);
      
      // ショートカット使用統計更新
      this.reportShortcutUsed(`goal_${goalId}`);
      
    } catch (error) {
      ToastAndroid.show('目標の完了に失敗しました', ToastAndroid.SHORT);
    }
  }
}
```

### 3. 高度な通知機能
```typescript
// services/android/AdvancedNotificationService.ts
export class AndroidAdvancedNotificationService {
  
  // 通知チャンネル作成（Android 8.0+）
  static createNotificationChannels(): void {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      const notificationManager = NotificationManagerCompat.from(context);
      
      // 目標リマインダーチャンネル
      const goalReminderChannel = new NotificationChannel(
        'GOAL_REMINDERS',
        '目標リマインダー',
        NotificationManager.IMPORTANCE_DEFAULT
      );
      goalReminderChannel.description = '目標実行のリマインダー通知';
      goalReminderChannel.enableLights(true);
      goalReminderChannel.lightColor = Color.BLUE;
      goalReminderChannel.enableVibration(true);
      goalReminderChannel.vibrationPattern = [100, 200, 300, 400];
      
      // 祝福通知チャンネル
      const celebrationChannel = new NotificationChannel(
        'CELEBRATIONS',
        '祝福通知',
        NotificationManager.IMPORTANCE_HIGH
      );
      celebrationChannel.description = '目標達成時の祝福通知';
      celebrationChannel.enableLights(true);
      celebrationChannel.lightColor = Color.GREEN;
      celebrationChannel.setSound(
        Uri.parse(`android.resource://${context.packageName}/${R.raw.celebration_sound}`),
        new AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
      );
      
      notificationManager.createNotificationChannels([
        goalReminderChannel,
        celebrationChannel
      ]);
    }
  }
  
  // 展開可能な通知（Big View）
  static async createExpandableProgressNotification(): Promise<void> {
    const goals = await database.get<Goal>('goals').query().fetch();
    const completedToday = goals.filter(g => g.isCompletedToday).length;
    const total = goals.length;
    
    // 展開表示用のリモートビュー
    const expandedView = new RemoteViews(context.packageName, R.layout.notification_progress_expanded);
    expandedView.setTextViewText(R.id.progress_title, '今日の進捗');
    expandedView.setTextViewText(R.id.progress_summary, `${completedToday}/${total} 完了`);
    expandedView.setProgressBar(R.id.progress_bar, total, completedToday, false);
    
    // 目標リスト表示
    expandedView.removeAllViews(R.id.goal_list);
    goals.slice(0, 5).forEach((goal, index) => {
      const goalView = new RemoteViews(context.packageName, R.layout.notification_goal_item);
      goalView.setTextViewText(R.id.goal_name, goal.title);
      goalView.setImageViewResource(
        R.id.goal_status,
        goal.isCompletedToday ? R.drawable.ic_check : R.drawable.ic_circle_outline
      );
      
      expandedView.addView(R.id.goal_list, goalView);
    });
    
    const notification = new NotificationCompat.Builder(context, 'GOAL_REMINDERS')
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle('今日の目標進捗')
      .setContentText(`${completedToday}/${total} 完了`)
      .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
      .setCustomBigContentView(expandedView)
      .setOngoing(true) // 削除できない通知
      .setColor(ContextCompat.getColor(context, R.color.primary))
      .build();
    
    NotificationManagerCompat.from(context).notify(PROGRESS_NOTIFICATION_ID, notification);
  }
  
  // インタラクティブ通知（Android 4.1+）
  static async createInteractiveGoalNotification(goal: Goal): Promise<void> {
    // 完了アクション
    const completeIntent = new Intent(context, GoalCompletionReceiver.class);
    completeIntent.putExtra('goalId', goal.id);
    const completePendingIntent = PendingIntent.getBroadcast(
      context,
      goal.id.hashCode(),
      completeIntent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
    
    // 後でアクション
    const snoozeIntent = new Intent(context, GoalSnoozeReceiver.class);
    snoozeIntent.putExtra('goalId', goal.id);
    const snoozePendingIntent = PendingIntent.getBroadcast(
      context,
      goal.id.hashCode() + 1,
      snoozeIntent,
      PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
    );
    
    const notification = new NotificationCompat.Builder(context, 'GOAL_REMINDERS')
      .setSmallIcon(R.drawable.ic_goal)
      .setContentTitle('目標実行の時間です')
      .setContentText(goal.title)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .addAction(R.drawable.ic_check, '完了', completePendingIntent)
      .addAction(R.drawable.ic_snooze, '後で', snoozePendingIntent)
      .setAutoCancel(true)
      .build();
    
    NotificationManagerCompat.from(context).notify(goal.id.hashCode(), notification);
  }
  
  // 通知のカスタマイズ設定
  static getNotificationCustomization(): NotificationCustomization {
    return {
      // LED色設定
      ledColor: {
        goal_reminder: Color.BLUE,
        celebration: Color.GREEN,
        warning: Color.RED
      },
      
      // バイブレーションパターン
      vibrationPatterns: {
        gentle: [100, 100],
        standard: [100, 200, 300, 200],
        celebration: [100, 50, 100, 50, 200, 50, 200]
      },
      
      // 通知音
      soundUris: {
        goal_reminder: `android.resource://${context.packageName}/${R.raw.gentle_chime}`,
        celebration: `android.resource://${context.packageName}/${R.raw.celebration_sound}`,
        achievement: `android.resource://${context.packageName}/${R.raw.achievement_sound}`
      }
    };
  }
}
```

## 端末多様性対応

### 1. 画面サイズ対応
```typescript
// utils/android/ScreenAdaptation.ts
export class AndroidScreenAdaptation {
  
  // Android端末分類
  static getDeviceCategory(): AndroidDeviceCategory {
    const { width, height } = Dimensions.get('window');
    const density = PixelRatio.get();
    const screenSize = (width * density) * (height * density);
    
    // 画面サイズによる分類
    if (screenSize >= 1920 * 1200) return 'tablet_large';    // 10インチ以上
    if (screenSize >= 1280 * 800) return 'tablet_small';     // 7-10インチ
    if (screenSize >= 720 * 1280) return 'phone_large';      // 5.5インチ以上
    if (screenSize >= 480 * 800) return 'phone_medium';      // 4.5-5.5インチ
    return 'phone_small';                                     // 4.5インチ未満
  }
  
  // レスポンシブレイアウト設定
  static getLayoutConfiguration(category: AndroidDeviceCategory): AndroidLayoutConfig {
    const configs = {
      phone_small: {
        columns: 1,
        padding: 12,
        fontSize: 14,
        buttonHeight: 42,
        cardMargin: 8,
        listItemHeight: 56
      },
      phone_medium: {
        columns: 1,
        padding: 16,
        fontSize: 16,
        buttonHeight: 48,
        cardMargin: 12,
        listItemHeight: 64
      },
      phone_large: {
        columns: 1,
        padding: 20,
        fontSize: 17,
        buttonHeight: 52,
        cardMargin: 16,
        listItemHeight: 72
      },
      tablet_small: {
        columns: 2,
        padding: 24,
        fontSize: 18,
        buttonHeight: 56,
        cardMargin: 20,
        listItemHeight: 80
      },
      tablet_large: {
        columns: 3,
        padding: 32,
        fontSize: 20,
        buttonHeight: 60,
        cardMargin: 24,
        listItemHeight: 88
      }
    };
    
    return configs[category];
  }
  
  // 折りたたみ端末対応
  static handleFoldableDevice(): FoldableDeviceInfo {
    const screenInfo = this.getScreenInfo();
    
    return {
      isFoldable: this.detectFoldableDevice(),
      isUnfolded: screenInfo.width > screenInfo.height * 1.5,
      hingePosition: this.detectHingePosition(),
      adaptiveLayout: this.getFoldableLayoutConfig(screenInfo)
    };
  }
  
  private static detectFoldableDevice(): boolean {
    // 折りたたみ端末の検出ロジック
    const model = DeviceInfo.getModel().toLowerCase();
    const foldableKeywords = ['fold', 'flip', 'duo', 'wing'];
    
    return foldableKeywords.some(keyword => model.includes(keyword));
  }
  
  // 異なるAndroidバージョン対応
  static getVersionSpecificFeatures(): AndroidVersionFeatures {
    const apiLevel = DeviceInfo.getApiLevel();
    
    return {
      // Android 12+ (API 31+)
      materialYou: apiLevel >= 31,
      dynamicColors: apiLevel >= 31,
      splashScreenAPI: apiLevel >= 31,
      
      // Android 11 (API 30)
      bubbleNotifications: apiLevel >= 30,
      conversationNotifications: apiLevel >= 30,
      
      // Android 10 (API 29)
      darkThemeSupport: apiLevel >= 29,
      gestureNavigation: apiLevel >= 29,
      
      // Android 8.0+ (API 26+)
      notificationChannels: apiLevel >= 26,
      adaptiveIcons: apiLevel >= 26,
      
      // Android 6.0+ (API 23+)
      runtimePermissions: apiLevel >= 23,
      fingerprint: apiLevel >= 23
    };
  }
}
```

### 2. パフォーマンス最適化
```typescript
// utils/android/PerformanceOptimization.ts
export class AndroidPerformanceOptimization {
  
  // メモリ最適化
  static optimizeMemoryUsage(): void {
    // 画像キャッシュ最適化
    this.optimizeImageCache();
    
    // バックグラウンド処理制限
    this.limitBackgroundProcessing();
    
    // 不要なリスナー削除
    this.cleanupEventListeners();
  }
  
  private static optimizeImageCache(): void {
    const cacheConfig = {
      // 低スペック端末向け設定
      lowEnd: {
        memoryCache: 32 * 1024 * 1024,  // 32MB
        diskCache: 100 * 1024 * 1024,   // 100MB
        maxImageSize: 1024              // 1024px
      },
      
      // 高スペック端末向け設定
      highEnd: {
        memoryCache: 128 * 1024 * 1024, // 128MB
        diskCache: 500 * 1024 * 1024,   // 500MB
        maxImageSize: 2048              // 2048px
      }
    };
    
    const devicePerformance = this.assessDevicePerformance();
    const config = devicePerformance === 'high' ? cacheConfig.highEnd : cacheConfig.lowEnd;
    
    // React Native Image cache設定
    FastImage.setCacheLimit({
      memory: config.memoryCache,
      disk: config.diskCache
    });
  }
  
  // デバイス性能評価
  private static assessDevicePerformance(): 'low' | 'medium' | 'high' {
    const totalMemory = DeviceInfo.getTotalMemorySync();
    const processorCount = DeviceInfo.getProcessorCountSync();
    
    // メモリとCPUコア数でざっくり評価
    if (totalMemory >= 6 * 1024 * 1024 * 1024 && processorCount >= 6) {
      return 'high';   // 6GB+ RAM, 6+ cores
    } else if (totalMemory >= 3 * 1024 * 1024 * 1024 && processorCount >= 4) {
      return 'medium'; // 3GB+ RAM, 4+ cores
    } else {
      return 'low';    // それ以下
    }
  }
  
  // バッテリー最適化
  static optimizeBatteryUsage(): void {
    // バックグラウンド処理の最適化
    this.scheduleBackgroundTasks();
    
    // 位置情報サービスの最適化
    this.optimizeLocationServices();
    
    // ネットワークリクエストの最適化
    this.optimizeNetworkRequests();
  }
  
  // Android 6.0+ Doze mode対応
  static handleDozeMode(): void {
    // Doze mode除外申請（必要最小限のみ）
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      const powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager;
      
      if (!powerManager.isIgnoringBatteryOptimizations(context.packageName)) {
        // 重要な通知がある場合のみ除外申請
        this.requestBatteryOptimizationExemption();
      }
    }
  }
}
```

## 実装計画とタイムライン

### Phase 1: コア機能移植 (3-4ヶ月)
```typescript
const PHASE_1_TASKS = [
  // 月1: 基盤構築
  {
    month: 1,
    tasks: [
      'React Native Android設定最適化',
      'Material Design 3 テーマシステム実装',
      'Android用コンポーネントライブラリ作成',
      'ナビゲーション構造のAndroid最適化'
    ]
  },
  
  // 月2: コア機能実装
  {
    month: 2,
    tasks: [
      '目標管理機能のAndroid最適化',
      'トレーナーシステムのAndroid対応',
      'データベース層のAndroid最適化',
      'Android固有UIパターンの実装'
    ]
  },
  
  // 月3: 統合・テスト
  {
    month: 3,
    tasks: [
      'Android固有機能統合（通知、ショートカット）',
      'パフォーマンス最適化',
      '端末互換性テスト',
      'ベータ版リリース準備'
    ]
  }
];
```

## 実装チェックリスト

### Phase 1 (基本移植)
- [ ] Material Design 3 テーマ実装
- [ ] Androidナビゲーション最適化
- [ ] 基本通知機能実装
- [ ] 端末サイズ対応実装

### Phase 2 (機能拡張)
- [ ] ホームスクリーンウィジェット
- [ ] アプリショートカット実装
- [ ] 高度な通知機能
- [ ] Android共有機能統合

### Phase 3 (最適化)
- [ ] 折りたたみ端末対応
- [ ] Android 12+機能対応
- [ ] パフォーマンス最適化完了
- [ ] Google Play Store公開準備

## Google Play Store対応

### 1. ストア最適化
- **App Bundle**: Android App Bundle形式での配布
- **Dynamic Delivery**: 必要な機能のみの動的配信
- **Play Console**: 段階的ロールアウト設定
- **Play Integrity**: アプリ整合性検証実装

### 2. 審査対応
- **Target SDK**: 最新Android APIレベル対応
- **Permissions**: 必要最小限の権限要求
- **Privacy Policy**: Google Play要件準拠
- **Content Rating**: 適切な年齢制限設定