# 監視・ログ設計書

## 概要
Appcadiaアプリケーションの監視・ログシステム設計。クラッシュレポート、パフォーマンス監視、利用統計、ユーザー行動分析を通じて、アプリの品質向上とユーザーエクスペリエンス改善を実現する。

## 監視戦略

### 1. 監視の4つの柱
- **可用性監視**: アプリクラッシュ、フリーズ、起動失敗の検知
- **パフォーマンス監視**: 起動時間、画面遷移、メモリ使用量
- **ユーザー体験監視**: 操作完了率、離脱ポイント、エラー発生率
- **ビジネス指標監視**: DAU、継続率、目標達成率、機能利用率

### 2. 監視ツール構成
```typescript
// 監視ツール設定
export const MONITORING_TOOLS = {
  crashReporting: {
    tool: 'Expo Crashlytics / Sentry',
    purpose: 'クラッシュレポートとエラー追跡',
    retention: '90日',
    alerting: true
  },
  
  analytics: {
    tool: 'Expo Analytics / Firebase Analytics',
    purpose: 'ユーザー行動分析と利用統計',
    retention: '14ヶ月',
    realtime: true
  },
  
  performance: {
    tool: 'React Native Performance / Flipper',
    purpose: 'パフォーマンス監視とプロファイリング',
    retention: '30日',
    sampling: '10%'
  },
  
  customMetrics: {
    tool: 'Custom Logger + Remote Config',
    purpose: 'アプリ固有メトリクスの収集',
    retention: '30日',
    privacy: 'anonymized'
  }
} as const;
```

## クラッシュレポーティング

### 1. Sentry設定
```typescript
// services/CrashReporting.ts
import * as Sentry from '@sentry/react-native';

export class CrashReportingService {
  static initialize(): void {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: process.env.EXPO_PUBLIC_APP_ENV,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      
      // パフォーマンス監視
      enableTracing: true,
      tracesSampleRate: 0.1, // 10%のトランザクションを監視
      
      // プライバシー設定
      beforeSend: (event) => {
        // 個人情報の除去
        return this.sanitizeEvent(event);
      },
      
      // タグ設定
      tags: {
        app_version: Constants.manifest?.version,
        platform: Platform.OS,
        device_model: DeviceInfo.getModel()
      }
    });
  }
  
  // カスタムエラーレポート
  static reportError(error: Error, context: ErrorContext): void {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', context.type);
      scope.setLevel(context.severity);
      scope.setContext('user_action', {
        screen: context.screen,
        action: context.action,
        timestamp: new Date().toISOString()
      });
      
      // ユーザーデータを除外
      scope.setUser({
        id: this.getAnonymousUserId(),
        device_id: DeviceInfo.getUniqueId()
      });
      
      Sentry.captureException(error);
    });
  }
  
  // カスタムメトリクス送信
  static recordMetric(metricName: string, value: number, tags?: Record<string, string>): void {
    Sentry.addBreadcrumb({
      message: `Metric: ${metricName}`,
      level: 'info',
      data: { value, ...tags },
      timestamp: Date.now() / 1000
    });
  }
  
  private static sanitizeEvent(event: Sentry.Event): Sentry.Event | null {
    // 個人情報を含む可能性のあるデータを除去
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    
    // エラーメッセージから個人データを除去
    if (event.message) {
      event.message = event.message.replace(/email|名前|電話/g, '[REDACTED]');
    }
    
    return event;
  }
}
```

### 2. エラーハンドリング統一
```typescript
// utils/ErrorHandler.ts
export class ErrorHandler {
  static async handleError(error: Error, context: ErrorContext): Promise<void> {
    // 1. ログ出力
    console.error(`[${context.type}] ${error.message}`, error.stack);
    
    // 2. クラッシュレポート送信
    CrashReportingService.reportError(error, context);
    
    // 3. ユーザーへのフィードバック
    await this.showUserFriendlyError(error, context);
    
    // 4. 自動復旧試行
    if (context.recoverable) {
      await this.attemptRecovery(context);
    }
  }
  
  private static async showUserFriendlyError(error: Error, context: ErrorContext): Promise<void> {
    const userMessage = this.getUserFriendlyMessage(error, context);
    
    Alert.alert(
      'エラーが発生しました',
      userMessage,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '再試行', onPress: () => context.retry?.() },
        { text: 'フィードバック送信', onPress: () => this.showFeedbackForm(error) }
      ]
    );
  }
  
  // エラー種別に応じたユーザーフレンドリーメッセージ
  private static getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const errorMessages = {
      network: 'ネットワークの接続を確認してください',
      database: 'データの読み込みに失敗しました。アプリを再起動してみてください',
      storage: 'ストレージ容量が不足している可能性があります',
      permission: '必要な権限が許可されていません。設定を確認してください',
      validation: '入力内容に問題があります。確認してください',
      unknown: '予期しないエラーが発生しました'
    };
    
    return errorMessages[context.type] || errorMessages.unknown;
  }
}
```

## アプリケーション分析

### 1. イベント追跡
```typescript
// services/AnalyticsService.ts
export class AnalyticsService {
  private static initialized = false;
  
  static initialize(): void {
    if (this.initialized) return;
    
    // Firebase Analytics初期化（またはExpo Analytics）
    Analytics.logEvent('app_open', {
      app_version: Constants.manifest?.version,
      platform: Platform.OS
    });
    
    this.initialized = true;
  }
  
  // ユーザー行動イベント
  static trackUserAction(action: UserAction): void {
    Analytics.logEvent('user_action', {
      action_type: action.type,
      screen_name: action.screen,
      element_id: action.elementId,
      timestamp: Date.now(),
      session_id: this.getSessionId()
    });
    
    // カスタムメトリクス記録
    this.recordCustomMetric(`action_${action.type}`, 1, {
      screen: action.screen
    });
  }
  
  // 目標達成イベント
  static trackGoalEvent(event: GoalEvent): void {
    Analytics.logEvent('goal_event', {
      event_type: event.type, // created, completed, deleted, updated
      goal_id: this.hashGoalId(event.goalId), // 匿名化
      goal_category: event.category,
      difficulty: event.difficulty,
      streak_count: event.streakCount || 0,
      total_stamps: event.totalStamps || 0
    });
    
    // 特別なイベントの追加記録
    if (event.type === 'completed') {
      this.trackMilestone('goal_completion', {
        category: event.category,
        streak: event.streakCount
      });
    }
  }
  
  // トレーナー利用イベント
  static trackTrainerEvent(event: TrainerEvent): void {
    Analytics.logEvent('trainer_interaction', {
      interaction_type: event.type, // selected, voice_played, message_shown
      trainer_id: event.trainerId,
      trainer_type: event.trainerType,
      context: event.context // goal_creation, daily_check, achievement
    });
  }
  
  // アプリパフォーマンスイベント
  static trackPerformance(metric: PerformanceMetric): void {
    Analytics.logEvent('performance_metric', {
      metric_name: metric.name,
      value: metric.value,
      unit: metric.unit,
      screen: metric.screen,
      timestamp: Date.now()
    });
    
    // パフォーマンス問題の検知
    if (this.isPerformanceIssue(metric)) {
      CrashReportingService.reportError(
        new Error(`Performance issue: ${metric.name}`),
        {
          type: 'performance',
          severity: 'warning',
          screen: metric.screen,
          recoverable: false
        }
      );
    }
  }
  
  // セッション分析
  static startSession(): void {
    const sessionId = this.generateSessionId();
    this.setSessionId(sessionId);
    
    Analytics.logEvent('session_start', {
      session_id: sessionId,
      app_version: Constants.manifest?.version,
      device_info: {
        model: DeviceInfo.getModel(),
        os_version: DeviceInfo.getSystemVersion(),
        app_memory: DeviceInfo.getTotalMemory()
      }
    });
  }
  
  static endSession(duration: number): void {
    Analytics.logEvent('session_end', {
      session_id: this.getSessionId(),
      duration_seconds: Math.floor(duration / 1000),
      screens_viewed: this.getScreensViewed(),
      actions_performed: this.getActionsCount()
    });
  }
}
```

### 2. ユーザー行動フロー分析
```typescript
// services/UserFlowAnalytics.ts
export class UserFlowAnalytics {
  private flowStack: UserFlowEvent[] = [];
  private readonly MAX_FLOW_LENGTH = 20;
  
  // 画面遷移追跡
  trackScreenTransition(from: string, to: string, method: 'navigation' | 'back' | 'deep_link'): void {
    const event: UserFlowEvent = {
      type: 'screen_transition',
      timestamp: Date.now(),
      data: { from, to, method }
    };
    
    this.addToFlow(event);
    
    AnalyticsService.trackUserAction({
      type: 'screen_view',
      screen: to,
      elementId: method,
      metadata: { previous_screen: from }
    });
  }
  
  // 機能利用フロー追跡
  trackFeatureFlow(feature: string, step: string, completed: boolean): void {
    const event: UserFlowEvent = {
      type: 'feature_step',
      timestamp: Date.now(),
      data: { feature, step, completed }
    };
    
    this.addToFlow(event);
    
    if (completed) {
      this.analyzeFlowCompletion(feature);
    }
  }
  
  // 離脱ポイント分析
  trackDropOff(screen: string, action: string, reason?: string): void {
    const event: UserFlowEvent = {
      type: 'drop_off',
      timestamp: Date.now(),
      data: { screen, action, reason }
    };
    
    this.addToFlow(event);
    
    // 離脱パターン分析
    const recentFlow = this.getRecentFlow(5);
    AnalyticsService.trackUserAction({
      type: 'user_drop_off',
      screen,
      elementId: action,
      metadata: {
        reason,
        flow_sequence: recentFlow.map(e => e.data).join(' -> ')
      }
    });
  }
  
  private analyzeFlowCompletion(feature: string): void {
    const featureFlow = this.flowStack
      .filter(event => event.data.feature === feature)
      .slice(-10); // 最新10ステップ
    
    const completionTime = featureFlow[featureFlow.length - 1].timestamp - featureFlow[0].timestamp;
    const stepCount = featureFlow.length;
    
    AnalyticsService.trackUserAction({
      type: 'feature_completed',
      screen: 'flow_analysis',
      elementId: feature,
      metadata: {
        completion_time_ms: completionTime,
        step_count: stepCount,
        flow_efficiency: this.calculateFlowEfficiency(featureFlow)
      }
    });
  }
}
```

## パフォーマンス監視

### 1. パフォーマンスメトリクス収集
```typescript
// services/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly METRIC_RETENTION = 100; // メトリック保持数
  
  // アプリ起動時間測定
  measureAppStartup(): void {
    const startTime = Date.now();
    
    const measureInitialization = () => {
      const initTime = Date.now() - startTime;
      this.recordMetric('app_startup_time', initTime, 'ms');
      
      if (initTime > 3000) { // 3秒以上は警告
        this.reportPerformanceIssue('slow_startup', initTime);
      }
    };
    
    // アプリ初期化完了時に測定
    setTimeout(measureInitialization, 0);
  }
  
  // 画面レンダリング時間測定
  measureScreenRender(screenName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      this.recordMetric(`screen_render_${screenName}`, renderTime, 'ms');
      
      AnalyticsService.trackPerformance({
        name: 'screen_render',
        value: renderTime,
        unit: 'ms',
        screen: screenName
      });
    };
  }
  
  // メモリ使用量監視
  async monitorMemoryUsage(): Promise<void> {
    try {
      const memoryInfo = await DeviceInfo.getUsedMemory();
      this.recordMetric('memory_usage', memoryInfo, 'bytes');
      
      // メモリ使用量が多い場合は警告
      const memoryMB = memoryInfo / (1024 * 1024);
      if (memoryMB > 200) { // 200MB以上
        this.reportPerformanceIssue('high_memory_usage', memoryMB);
      }
    } catch (error) {
      console.warn('Memory monitoring failed:', error);
    }
  }
  
  // バッテリー使用量監視（iOS）
  monitorBatteryUsage(): void {
    if (Platform.OS === 'ios') {
      DeviceInfo.getBatteryLevel().then(batteryLevel => {
        this.recordMetric('battery_level', batteryLevel * 100, 'percentage');
      });
    }
  }
  
  // データベース操作パフォーマンス
  measureDatabaseOperation<T>(operation: () => Promise<T>, operationType: string): Promise<T> {
    const startTime = performance.now();
    
    return operation().then(
      result => {
        const duration = performance.now() - startTime;
        this.recordMetric(`db_operation_${operationType}`, duration, 'ms');
        
        if (duration > 1000) { // 1秒以上は警告
          this.reportPerformanceIssue('slow_database_operation', duration, {
            operation: operationType
          });
        }
        
        return result;
      },
      error => {
        const duration = performance.now() - startTime;
        this.recordMetric(`db_operation_${operationType}_error`, duration, 'ms');
        throw error;
      }
    );
  }
  
  private recordMetric(name: string, value: number, unit: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricList = this.metrics.get(name)!;
    metricList.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      screen: this.getCurrentScreen()
    });
    
    // 古いメトリクスを削除
    if (metricList.length > this.METRIC_RETENTION) {
      metricList.shift();
    }
  }
  
  private reportPerformanceIssue(type: string, value: number, metadata?: Record<string, any>): void {
    CrashReportingService.reportError(
      new Error(`Performance issue: ${type} (${value})`),
      {
        type: 'performance',
        severity: 'warning',
        screen: this.getCurrentScreen(),
        recoverable: true,
        metadata: { performance_type: type, value, ...metadata }
      }
    );
  }
  
  // パフォーマンス統計取得
  getPerformanceStats(metricName: string): PerformanceStats {
    const metrics = this.metrics.get(metricName) || [];
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const values = metrics.map(m => m.value);
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99)
    };
  }
}
```

## カスタムログシステム

### 1. ログ管理
```typescript
// services/LoggingService.ts
export class LoggingService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
  
  static debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }
  
  static info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }
  
  static warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }
  
  static error(message: string, error?: Error, metadata?: any): void {
    this.log('error', message, { ...metadata, error: error?.stack });
  }
  
  private static log(level: LogLevel, message: string, metadata?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        screen: this.getCurrentScreen(),
        sessionId: AnalyticsService.getSessionId(),
        userId: this.getAnonymousUserId()
      }
    };
    
    // コンソール出力
    console[level](message, metadata);
    
    // ログバッファに追加
    this.logs.push(entry);
    
    // バッファサイズ制限
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
    
    // 重要なログは即座に送信
    if (level === 'error' || level === 'warn') {
      this.flushLogs();
    }
  }
  
  // ログ送信
  private static async flushLogs(): Promise<void> {
    if (this.logs.length === 0) return;
    
    try {
      const logsToSend = [...this.logs];
      this.logs = [];
      
      // リモートログサービスに送信（実装に応じて変更）
      await this.sendLogsToRemote(logsToSend);
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // ログ送信失敗時は元に戻す
      this.logs.unshift(...this.logs);
    }
  }
  
  // ログフィルタリングとエクスポート
  static exportLogs(filters: LogFilters): LogEntry[] {
    return this.logs.filter(log => {
      if (filters.level && log.level !== filters.level) return false;
      if (filters.startTime && new Date(log.timestamp) < filters.startTime) return false;
      if (filters.endTime && new Date(log.timestamp) > filters.endTime) return false;
      if (filters.screen && log.metadata?.screen !== filters.screen) return false;
      return true;
    });
  }
}
```

### 2. デバッグ用ログビューア
```typescript
// components/DebugLogViewer.tsx (開発ビルドのみ)
export const DebugLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilters>({});
  const [isVisible, setIsVisible] = useState(false);
  
  const loadLogs = () => {
    const filteredLogs = LoggingService.exportLogs(filters);
    setLogs(filteredLogs);
  };
  
  const exportLogs = async () => {
    const logsData = JSON.stringify(logs, null, 2);
    await Share.share({
      message: logsData,
      title: 'Appcadia Debug Logs'
    });
  };
  
  if (!__DEV__) return null; // 開発ビルドでのみ表示
  
  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Debug Logs</Text>
        
        <View style={styles.filters}>
          <Picker
            selectedValue={filters.level}
            onValueChange={(level) => setFilters({ ...filters, level })}
          >
            <Picker.Item label="All Levels" value="" />
            <Picker.Item label="Debug" value="debug" />
            <Picker.Item label="Info" value="info" />
            <Picker.Item label="Warn" value="warn" />
            <Picker.Item label="Error" value="error" />
          </Picker>
        </View>
        
        <FlatList
          data={logs}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.logEntry, styles[item.level]]}>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.level}>[{item.level.toUpperCase()}]</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          )}
        />
        
        <View style={styles.actions}>
          <Button title="更新" onPress={loadLogs} />
          <Button title="エクスポート" onPress={exportLogs} />
          <Button title="閉じる" onPress={() => setIsVisible(false)} />
        </View>
      </View>
    </Modal>
  );
};
```

## 実装チェックリスト

### Phase 1 (基本監視)
- [ ] Sentry/Crashlytics設定
- [ ] 基本アナリティクス実装
- [ ] エラーハンドリング統一
- [ ] 基本パフォーマンス測定

### Phase 2 (詳細分析)
- [ ] ユーザーフロー分析
- [ ] カスタムメトリクス実装
- [ ] パフォーマンス監視強化
- [ ] ログ管理システム

### Phase 3 (運用最適化)
- [ ] リアルタイム監視ダッシュボード
- [ ] 自動アラート設定
- [ ] A/Bテスト基盤
- [ ] ユーザビリティ分析

## プライバシーと法的遵守

### 1. データ収集ポリシー
- **最小限の原則**: 必要最小限のデータのみ収集
- **匿名化**: 個人識別情報の完全除去
- **透明性**: ユーザーへの明確な説明
- **ユーザー制御**: オプトアウト機能の提供

### 2. GDPR/個人情報保護法対応
- データ収集時の明示的同意取得
- データ削除権の実装
- データポータビリティの確保
- 定期的なデータ監査の実施