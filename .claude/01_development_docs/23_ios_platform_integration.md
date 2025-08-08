# iOS プラットフォーム統合設計書

## 概要
AppcadiaアプリケーションのiOS固有機能統合設計。iOS Human Interface Guidelines準拠の下、プッシュ通知、Siri Shortcuts、ウィジェット、App Clips等のプラットフォーム機能を活用したネイティブ体験を提供する。

## iOS固有機能統合

### 1. プッシュ通知 (APNs)
```typescript
// services/ios/PushNotificationService.ts
import * as Notifications from 'expo-notifications';

export class iOSPushNotificationService {
  
  // 通知設定初期化
  static async initialize(): Promise<void> {
    // 通知の表示方法設定
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
      })
    });
    
    // 権限リクエスト
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false, // 重要なアラートは無効
        allowProvisional: true,     // 仮承認を有効
        allowAnnouncements: false,
      }
    });
    
    if (status !== 'granted') {
      throw new Error('Push notification permission not granted');
    }
  }
  
  // 目標リマインダー通知
  static async scheduleGoalReminder(goal: Goal, reminderTime: Date): Promise<string> {
    const trigger = {
      dateComponents: {
        hour: reminderTime.getHours(),
        minute: reminderTime.getMinutes()
      },
      repeats: true // 毎日繰り返し
    };
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '目標達成の時間です！',
        body: `「${goal.title}」を実行しましょう`,
        categoryIdentifier: 'GOAL_REMINDER',
        data: {
          goalId: goal.id,
          type: 'goal_reminder'
        },
        sound: 'default',
        badge: 1
      },
      trigger
    });
    
    return notificationId;
  }
  
  // 祝福通知（目標達成時）
  static async sendCelebrationNotification(goal: Goal, streak: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 目標達成おめでとう！',
        body: `「${goal.title}」${streak}日連続達成！`,
        categoryIdentifier: 'CELEBRATION',
        data: {
          goalId: goal.id,
          streak,
          type: 'celebration'
        },
        sound: 'default',
        badge: 0, // バッジクリア
        
        // iOS 15+ リッチ通知
        attachments: [{
          identifier: 'celebration',
          url: 'celebration-image.png',
          options: {
            typeHint: 'public.png',
            thumbnailHidden: false
          }
        }]
      },
      trigger: null // 即座に送信
    });
  }
  
  // インタラクティブ通知アクション設定
  static setupNotificationCategories(): void {
    Notifications.setNotificationCategoryAsync('GOAL_REMINDER', [
      {
        identifier: 'COMPLETE_ACTION',
        buttonTitle: '完了',
        options: {
          opensApp: false,
          isAuthenticationRequired: false,
          isDestructive: false
        }
      },
      {
        identifier: 'POSTPONE_ACTION', 
        buttonTitle: '後で',
        options: {
          opensApp: false,
          isAuthenticationRequired: false,
          isDestructive: false
        }
      },
      {
        identifier: 'OPEN_APP_ACTION',
        buttonTitle: 'アプリを開く',
        options: {
          opensApp: true,
          isAuthenticationRequired: false,
          isDestructive: false
        }
      }
    ]);
  }
  
  // 通知応答処理
  static handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { actionIdentifier, notification } = response;
    const { goalId } = notification.request.content.data;
    
    switch (actionIdentifier) {
      case 'COMPLETE_ACTION':
        this.handleQuickGoalCompletion(goalId);
        break;
      case 'POSTPONE_ACTION':
        this.schedulePostponedReminder(goalId);
        break;
      case 'OPEN_APP_ACTION':
        // アプリが開かれる（自動処理）
        break;
    }
  }
  
  private static async handleQuickGoalCompletion(goalId: string): Promise<void> {
    try {
      const goalService = new GoalService();
      await goalService.addStampToGoal(goalId);
      
      // 完了通知を送信
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ 目標完了',
          body: 'スタンプを追加しました！',
          sound: 'default',
          badge: 0
        },
        trigger: null
      });
    } catch (error) {
      console.error('Quick goal completion failed:', error);
    }
  }
}
```

### 2. Siri Shortcuts 統合
```typescript
// services/ios/SiriShortcutsService.ts
import * as IntentKit from 'expo-intent-kit'; // 仮想ライブラリ

export class SiriShortcutsService {
  
  // Siri Shortcuts初期化
  static async setupShortcuts(): Promise<void> {
    // 目標完了ショートカット
    await this.createGoalCompletionShortcut();
    
    // 今日の進捗確認ショートカット
    await this.createProgressCheckShortcut();
    
    // モチベーション音声再生ショートカット
    await this.createMotivationVoiceShortcut();
  }
  
  private static async createGoalCompletionShortcut(): Promise<void> {
    const shortcut = {
      identifier: 'complete-goal',
      title: '目標を完了する',
      invocationPhrase: 'アプカディアで目標完了',
      shortcutDescription: '今日の目標にスタンプを追加します',
      parameterSummary: '${goal}を完了',
      
      // インテント定義
      intent: {
        intentName: 'CompleteGoalIntent',
        parameters: [
          {
            name: 'goal',
            type: 'Goal',
            displayName: '目標'
          }
        ]
      }
    };
    
    await IntentKit.donateShortcut(shortcut);
  }
  
  private static async createProgressCheckShortcut(): Promise<void> {
    const shortcut = {
      identifier: 'check-progress',
      title: '今日の進捗を確認',
      invocationPhrase: 'アプカディアで進捗確認',
      shortcutDescription: '今日の目標達成状況を音声で報告します',
      
      intent: {
        intentName: 'CheckProgressIntent',
        parameters: []
      }
    };
    
    await IntentKit.donateShortcut(shortcut);
  }
  
  // インテント処理
  static async handleIntent(intentName: string, parameters: any): Promise<IntentResponse> {
    switch (intentName) {
      case 'CompleteGoalIntent':
        return await this.handleGoalCompletion(parameters);
      case 'CheckProgressIntent':
        return await this.handleProgressCheck();
      default:
        throw new Error(`Unknown intent: ${intentName}`);
    }
  }
  
  private static async handleGoalCompletion(params: any): Promise<IntentResponse> {
    try {
      const goalService = new GoalService();
      const goals = await goalService.getActiveGoals();
      
      if (params.goal) {
        // 特定の目標を完了
        const goal = goals.find(g => g.title.includes(params.goal));
        if (goal) {
          await goalService.addStampToGoal(goal.id);
          return {
            success: true,
            userActivity: {
              activityType: 'goal.completed',
              title: `${goal.title}を完了`,
              isEligibleForSearch: true,
              isEligibleForHandoff: false
            },
            response: `${goal.title}を完了しました！`
          };
        }
      } else {
        // 未完了の目標から選択肢を提示
        const incompleteGoals = goals.filter(g => !g.isCompletedToday);
        return {
          success: false,
          needsValue: 'goal',
          options: incompleteGoals.map(g => ({
            identifier: g.id,
            displayString: g.title
          })),
          response: '完了する目標を選択してください'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: '目標の完了に失敗しました'
      };
    }
  }
  
  private static async handleProgressCheck(): Promise<IntentResponse> {
    try {
      const goalService = new GoalService();
      const goals = await goalService.getActiveGoals();
      const completedToday = goals.filter(g => g.isCompletedToday);
      const completionRate = (completedToday.length / goals.length) * 100;
      
      let response: string;
      if (completionRate === 100) {
        response = `素晴らしい！今日の目標を全て達成しました。${goals.length}個すべて完了です。`;
      } else if (completionRate >= 75) {
        response = `順調です！${goals.length}個中${completedToday.length}個完了。達成率${Math.round(completionRate)}%です。`;
      } else {
        const remaining = goals.length - completedToday.length;
        response = `まだ頑張りましょう！残り${remaining}個の目標があります。`;
      }
      
      return {
        success: true,
        userActivity: {
          activityType: 'progress.checked',
          title: '進捗確認',
          isEligibleForSearch: false,
          isEligibleForHandoff: false
        },
        response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: '進捗の確認に失敗しました'
      };
    }
  }
}
```

### 3. ウィジェット統合
```typescript
// widgets/TodayGoalsWidget.tsx
import { WidgetKit } from 'expo-widget-kit'; // 仮想ライブラリ

export const TodayGoalsWidget = {
  kind: 'TodayGoalsWidget',
  displayName: '今日の目標',
  description: '今日の目標達成状況を表示します',
  supportedFamilies: ['systemSmall', 'systemMedium'],
  
  // ウィジェット設定可能性
  configuration: {
    intentType: 'ConfigurationIntent',
    parameters: [
      {
        name: 'showCompletedGoals',
        displayName: '完了済み目標も表示',
        type: 'boolean',
        default: false
      },
      {
        name: 'maxGoalsCount',
        displayName: '最大表示数',
        type: 'integer',
        default: 3,
        min: 1,
        max: 5
      }
    ]
  },
  
  // データ取得
  async getTimeline(context: WidgetContext): Promise<WidgetTimeline> {
    const goalService = new GoalService();
    const goals = await goalService.getActiveGoals();
    const config = context.configuration;
    
    let displayGoals = goals;
    if (!config.showCompletedGoals) {
      displayGoals = goals.filter(g => !g.isCompletedToday);
    }
    
    // 最大表示数でフィルタ
    displayGoals = displayGoals.slice(0, config.maxGoalsCount);
    
    const entries: WidgetEntry[] = [];
    
    // 現在のエントリ
    entries.push({
      date: new Date(),
      configuration: config,
      data: {
        goals: displayGoals,
        completionRate: (goals.filter(g => g.isCompletedToday).length / goals.length) * 100,
        totalStamps: goals.reduce((sum, g) => sum + g.totalStamps, 0)
      }
    });
    
    // 1時間後の更新エントリ
    const nextUpdate = new Date(Date.now() + 60 * 60 * 1000);
    entries.push({
      date: nextUpdate,
      configuration: config,
      data: null // データ再取得が必要
    });
    
    return {
      entries,
      policy: 'after(nextUpdate)'
    };
  },
  
  // ウィジェットUI
  view: (entry: WidgetEntry) => {
    const { goals, completionRate } = entry.data;
    
    return (
      <WidgetView>
        {/* ヘッダー */}
        <WidgetHeader>
          <Text style={styles.title}>今日の目標</Text>
          <Text style={styles.progress}>{Math.round(completionRate)}%</Text>
        </WidgetHeader>
        
        {/* 進捗バー */}
        <ProgressBar progress={completionRate} />
        
        {/* 目標リスト */}
        <GoalList>
          {goals.map(goal => (
            <GoalItem key={goal.id}>
              <Icon name={goal.isCompletedToday ? 'checkmark.circle.fill' : 'circle'} />
              <Text style={goal.isCompletedToday ? styles.completed : styles.pending}>
                {goal.title}
              </Text>
            </GoalItem>
          ))}
        </GoalList>
        
        {/* フッター */}
        <WidgetFooter>
          <Text style={styles.footer}>タップしてアプリを開く</Text>
        </WidgetFooter>
      </WidgetView>
    );
  }
};

// ウィジェット登録
WidgetKit.register([TodayGoalsWidget]);
```

### 4. App Clips 対応
```typescript
// app-clip/AppClipHandler.ts
export class AppClipHandler {
  
  // App Clip初期化
  static async initializeAppClip(): Promise<void> {
    // App Clipの制限事項チェック
    if (await this.isAppClip()) {
      // 機能制限モードで初期化
      await this.initializeLimitedMode();
    } else {
      // フル機能で初期化
      await this.initializeFullMode();
    }
  }
  
  private static async isAppClip(): Promise<boolean> {
    // App Clipかどうかを判定
    return Bundle.main.appStoreReceiptURL?.lastPathComponent === 'sandboxReceipt';
  }
  
  private static async initializeLimitedMode(): Promise<void> {
    console.log('Initializing App Clip mode');
    
    // App Clip用の軽量初期化
    const essentialServices = [
      'goal-creation',      // 目標作成のみ
      'trainer-selection',  // トレーナー選択
      'basic-analytics'     // 基本分析
    ];
    
    await this.initializeServices(essentialServices);
    
    // データ制限の設定
    this.setDataLimits({
      maxGoals: 3,        // 最大3個の目標
      maxTrainers: 2,     // 最大2人のトレーナー
      storageLimit: 5 * 1024 * 1024 // 5MB制限
    });
  }
  
  // App Clipから本アプリへの誘導
  static async promoteToFullApp(): Promise<void> {
    const storeKit = require('expo-store-kit'); // 仮想ライブラリ
    
    try {
      // App Store製品ページを表示
      await storeKit.presentAppStoreProductPage({
        productID: 'com.appcadia.app',
        affiliateToken: null,
        campaignToken: 'app-clip-promotion'
      });
      
      // プロモーション分析
      AnalyticsService.trackUserAction({
        type: 'app_clip_promotion_shown',
        screen: 'app_clip',
        elementId: 'promote_full_app'
      });
    } catch (error) {
      console.error('Failed to promote to full app:', error);
    }
  }
  
  // App Clipでのデータ移行
  static async prepareDataForTransfer(): Promise<AppClipTransferData> {
    const goals = await database.get<Goal>('goals').query().fetch();
    const selectedTrainer = await new TrainerService().getSelectedTrainer();
    
    return {
      goals: goals.map(g => ({
        title: g.title,
        category: g.category,
        targetDescription: g.targetDescription,
        difficulty: g.difficulty,
        motivation: g.motivation
      })),
      selectedTrainerId: selectedTrainer?.data?.id,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}
```

### 5. Handoff 連携
```typescript
// services/ios/HandoffService.ts
export class HandoffService {
  
  // Handoff アクティビティ開始
  static startUserActivity(activityType: string, userInfo: any, title?: string): void {
    const activity = {
      activityType,
      userInfo,
      title: title || 'Appcadia',
      isEligibleForHandoff: true,
      isEligibleForSearch: true,
      keywords: ['目標', '習慣', 'アプカディア'],
      requiredUserInfoKeys: Object.keys(userInfo),
      webpageURL: this.getWebURL(activityType, userInfo)
    };
    
    // NSUserActivity作成・開始
    NSUserActivity.current = activity;
    NSUserActivity.current.becomeCurrent();
  }
  
  // 目標編集のHandoff
  static startGoalEditingActivity(goal: Goal): void {
    this.startUserActivity(
      'com.appcadia.goal.editing',
      {
        goalId: goal.id,
        goalTitle: goal.title,
        category: goal.category
      },
      `「${goal.title}」を編集中`
    );
  }
  
  // 進捗確認のHandoff
  static startProgressViewActivity(): void {
    this.startUserActivity(
      'com.appcadia.progress.viewing',
      {
        date: new Date().toISOString(),
        screen: 'progress'
      },
      '進捗を確認中'
    );
  }
  
  // Handoffアクティビティ受信処理
  static handleContinueUserActivity(userActivity: NSUserActivity): boolean {
    const { activityType, userInfo } = userActivity;
    
    switch (activityType) {
      case 'com.appcadia.goal.editing':
        return this.continueGoalEditing(userInfo);
      case 'com.appcadia.progress.viewing':
        return this.continueProgressViewing(userInfo);
      default:
        return false;
    }
  }
  
  private static continueGoalEditing(userInfo: any): boolean {
    try {
      const { goalId } = userInfo;
      
      // 目標編集画面に遷移
      NavigationService.navigate('GoalEdit', { goalId });
      
      return true;
    } catch (error) {
      console.error('Failed to continue goal editing:', error);
      return false;
    }
  }
  
  private static getWebURL(activityType: string, userInfo: any): string {
    // Web版でのディープリンク用URL生成
    const baseURL = 'https://appcadia.com';
    
    switch (activityType) {
      case 'com.appcadia.goal.editing':
        return `${baseURL}/goals/${userInfo.goalId}/edit`;
      case 'com.appcadia.progress.viewing':
        return `${baseURL}/progress`;
      default:
        return baseURL;
    }
  }
}
```

### 6. Core Spotlight 検索統合
```typescript
// services/ios/SpotlightService.ts
export class SpotlightService {
  
  // 検索インデックスの更新
  static async updateSearchIndex(): Promise<void> {
    const goals = await database.get<Goal>('goals').query().fetch();
    const searchItems: SearchableItem[] = [];
    
    // 目標を検索可能アイテムとして追加
    for (const goal of goals) {
      const item: SearchableItem = {
        uniqueIdentifier: `goal-${goal.id}`,
        domainIdentifier: 'goals',
        attributeSet: {
          title: goal.title,
          contentDescription: `${goal.category}の目標: ${goal.targetDescription}`,
          keywords: [goal.category, '目標', goal.title],
          thumbnailData: await this.generateGoalThumbnail(goal),
          contentURL: `appcadia://goal/${goal.id}`,
          
          // 追加メタデータ
          contentCreationDate: new Date(goal.createdAt),
          contentModificationDate: new Date(goal.updatedAt),
          rating: goal.currentStreak,
          completionDate: goal.isCompletedToday ? new Date() : null
        }
      };
      
      searchItems.push(item);
    }
    
    // トレーナーも検索対象に追加
    const trainers = await database.get<Trainer>('trainers').query().fetch();
    for (const trainer of trainers) {
      const item: SearchableItem = {
        uniqueIdentifier: `trainer-${trainer.id}`,
        domainIdentifier: 'trainers',
        attributeSet: {
          title: `${trainer.name}トレーナー`,
          contentDescription: `${trainer.personality.description}`,
          keywords: ['トレーナー', trainer.name, trainer.type],
          thumbnailData: trainer.avatarUrl,
          contentURL: `appcadia://trainer/${trainer.id}`
        }
      };
      
      searchItems.push(item);
    }
    
    // Spotlightインデックス更新
    await CoreSpotlight.deleteAllSearchableItems();
    await CoreSpotlight.indexSearchableItems(searchItems);
  }
  
  // 検索結果タップ処理
  static handleSearchItemSelection(userActivity: NSUserActivity): boolean {
    const identifier = userActivity.userInfo?.CSSearchableItemActivityIdentifier;
    if (!identifier) return false;
    
    const [type, id] = identifier.split('-');
    
    switch (type) {
      case 'goal':
        NavigationService.navigate('GoalDetail', { goalId: id });
        return true;
      case 'trainer':
        NavigationService.navigate('TrainerDetail', { trainerId: id });
        return true;
      default:
        return false;
    }
  }
  
  private static async generateGoalThumbnail(goal: Goal): Promise<Buffer> {
    // 目標のサムネイル画像を動的生成
    const canvas = this.createCanvas(300, 200);
    const ctx = canvas.getContext('2d');
    
    // 背景色（カテゴリ別）
    const colors = {
      健康: '#4CAF50',
      学習: '#2196F3', 
      仕事: '#FF9800',
      趣味: '#9C27B0'
    };
    
    ctx.fillStyle = colors[goal.category] || '#757575';
    ctx.fillRect(0, 0, 300, 200);
    
    // タイトル描画
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(goal.title, 150, 100);
    
    // 進捗表示
    ctx.font = '18px system-ui';
    ctx.fillText(`${goal.currentStreak}日連続`, 150, 140);
    
    return canvas.toBuffer('image/png');
  }
}
```

## デバイス固有最適化

### 1. iPad対応
```typescript
// utils/ios/DeviceOptimization.ts
export class iOSDeviceOptimization {
  
  // デバイス種別判定
  static getDeviceType(): iOSDeviceType {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    
    if (DeviceInfo.isTablet()) {
      return aspectRatio > 1.5 ? 'iPad_Pro' : 'iPad';
    } else {
      if (height >= 926) return 'iPhone_Pro_Max';
      if (height >= 844) return 'iPhone_Pro';
      if (height >= 812) return 'iPhone_Standard';
      return 'iPhone_Compact';
    }
  }
  
  // レスポンシブレイアウト設定
  static getLayoutConfig(deviceType: iOSDeviceType): LayoutConfig {
    const configs = {
      iPhone_Compact: {
        columns: 1,
        padding: 16,
        fontSize: 14,
        buttonHeight: 44,
        cardSpacing: 8
      },
      iPhone_Standard: {
        columns: 1,
        padding: 20,
        fontSize: 16,
        buttonHeight: 48,
        cardSpacing: 12
      },
      iPhone_Pro: {
        columns: 1,
        padding: 24,
        fontSize: 17,
        buttonHeight: 50,
        cardSpacing: 16
      },
      iPhone_Pro_Max: {
        columns: 1,
        padding: 24,
        fontSize: 18,
        buttonHeight: 52,
        cardSpacing: 16
      },
      iPad: {
        columns: 2,
        padding: 32,
        fontSize: 18,
        buttonHeight: 56,
        cardSpacing: 20
      },
      iPad_Pro: {
        columns: 3,
        padding: 40,
        fontSize: 20,
        buttonHeight: 60,
        cardSpacing: 24
      }
    };
    
    return configs[deviceType];
  }
  
  // セーフエリア最適化
  static getSafeAreaAdjustment(): SafeAreaAdjustment {
    const insets = useSafeAreaInsets();
    
    return {
      paddingTop: insets.top,
      paddingBottom: insets.bottom + (DeviceInfo.hasNotch() ? 0 : 8),
      paddingLeft: insets.left,
      paddingRight: insets.right,
      
      // Dynamic Island対応
      statusBarHeight: this.getStatusBarHeight(),
      hasNotch: DeviceInfo.hasNotch(),
      hasDynamicIsland: this.hasDynamicIsland()
    };
  }
  
  private static hasDynamicIsland(): boolean {
    const deviceModel = DeviceInfo.getModel();
    return deviceModel.includes('iPhone15') || deviceModel.includes('iPhone14 Pro');
  }
}
```

## 実装チェックリスト

### Phase 1 (基本統合)
- [ ] プッシュ通知基本実装
- [ ] Siri Shortcuts設定
- [ ] 基本ウィジェット実装
- [ ] デバイス最適化実装

### Phase 2 (高度な統合)
- [ ] インタラクティブ通知
- [ ] App Clips対応
- [ ] Handoff機能実装
- [ ] Spotlight検索統合

### Phase 3 (最適化)
- [ ] iPad Pro対応最適化
- [ ] Dynamic Island対応
- [ ] iOS最新機能対応
- [ ] パフォーマンス最適化

## iOS Human Interface Guidelines 準拠

### 1. 設計原則
- **Clarity**: 明確で理解しやすい情報設計
- **Deference**: コンテンツを最優先した控えめなUI
- **Depth**: 階層と奥行きを活用したナビゲーション

### 2. プラットフォーム一貫性
- iOS標準のナビゲーションパターン使用
- システムフォント・色・アイコンの活用
- 標準UIコンポーネントの優先使用
- アクセシビリティ機能への完全対応