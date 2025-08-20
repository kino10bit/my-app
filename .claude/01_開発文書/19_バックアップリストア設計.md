# バックアップ・復元設計書

## 概要
Appcadiaアプリケーションにおけるユーザーデータのバックアップ・復元機能設計。データ保護、端末間移行、災害復旧を目的とした包括的なデータ管理システムを定義する。

## バックアップ戦略

### 1. バックアップの種類

#### 自動バックアップ
- **頻度**: 毎日午前2時（ローカル時間）
- **対象**: 全ユーザーデータ
- **保存先**: 端末内ローカルストレージ
- **保存期間**: 直近30日分

#### 手動バックアップ
- **実行タイミング**: ユーザーの明示的操作
- **対象**: 選択可能（全データ or 指定期間）
- **保存先**: 端末内 + エクスポート可能
- **形式**: JSON、暗号化オプション

#### 増分バックアップ
- **頻度**: データ変更検知時
- **対象**: 変更された レコードのみ
- **保存先**: 端末内専用領域
- **最適化**: 重複データの除外

### 2. バックアップデータ構造
```typescript
// types/backup.ts
export interface BackupData {
  metadata: BackupMetadata;
  data: BackupContent;
  checksum: string;
}

export interface BackupMetadata {
  version: string;           // アプリバージョン
  schemaVersion: number;     // DBスキーマバージョン
  createdAt: Date;          // 作成日時
  type: 'full' | 'incremental' | 'manual';
  deviceId: string;         // 端末識別子
  userId?: string;          // ユーザーID（将来拡張用）
  fileSize: number;         // ファイルサイズ（bytes）
  recordCount: number;      // レコード総数
  isEncrypted: boolean;     // 暗号化フラグ
}

export interface BackupContent {
  goals: Goal[];
  trainers: Trainer[];
  achievements?: Achievement[];
  preferences: UserPreferences;
  statistics: UserStatistics;
}
```

## バックアップ実装

### 1. バックアップ管理クラス
```typescript
// services/BackupService.ts
export class BackupService {
  private backupDir: string;
  private encryptionKey: string | null = null;
  
  constructor() {
    this.backupDir = `${RNFS.DocumentDirectoryPath}/backups`;
    this.ensureBackupDirectory();
  }
  
  // 完全バックアップ作成
  async createFullBackup(encrypt: boolean = false): Promise<BackupResult> {
    try {
      const data = await this.gatherAllData();
      const metadata = await this.createMetadata('full', data);
      
      const backup: BackupData = {
        metadata,
        data,
        checksum: this.calculateChecksum(data)
      };
      
      const content = encrypt ? 
        await this.encryptBackup(backup) : 
        JSON.stringify(backup);
      
      const filePath = await this.writeBackupFile(metadata, content);
      
      // 古いバックアップの清理
      await this.cleanupOldBackups();
      
      return { success: true, filePath, metadata };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // 増分バックアップ作成
  async createIncrementalBackup(lastBackupDate: Date): Promise<BackupResult> {
    try {
      const changedData = await this.gatherChangedData(lastBackupDate);
      
      if (this.isEmpty(changedData)) {
        return { success: true, skipped: true, reason: 'No changes detected' };
      }
      
      const metadata = await this.createMetadata('incremental', changedData);
      const backup: BackupData = {
        metadata,
        data: changedData,
        checksum: this.calculateChecksum(changedData)
      };
      
      const filePath = await this.writeBackupFile(metadata, JSON.stringify(backup));
      
      return { success: true, filePath, metadata };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  private async gatherAllData(): Promise<BackupContent> {
    const [goals, trainers, preferences] = await Promise.all([
      database.get<Goal>('goals').query().fetch(),
      database.get<Trainer>('trainers').query().fetch(),
      this.loadUserPreferences()
    ]);
    
    const statistics = await this.calculateStatistics();
    
    return {
      goals: goals.map(g => g._raw),
      trainers: trainers.map(t => t._raw),
      preferences,
      statistics
    };
  }
  
  private async gatherChangedData(since: Date): Promise<BackupContent> {
    const sinceTimestamp = since.getTime();
    
    const [changedGoals, changedTrainers] = await Promise.all([
      database.get<Goal>('goals')
        .query(Q.where('updated_at', Q.gt(sinceTimestamp)))
        .fetch(),
      database.get<Trainer>('trainers')
        .query(Q.where('updated_at', Q.gt(sinceTimestamp)))
        .fetch()
    ]);
    
    return {
      goals: changedGoals.map(g => g._raw),
      trainers: changedTrainers.map(t => t._raw),
      preferences: await this.loadUserPreferences(),
      statistics: await this.calculateStatistics()
    };
  }
}
```

### 2. 自動バックアップスケジューラ
```typescript
// services/BackupScheduler.ts
export class BackupScheduler {
  private backgroundTaskId: number | null = null;
  
  // 自動バックアップスケジュール開始
  startSchedule(): void {
    // 毎日午前2時に実行
    const rule = new schedule.RecurrenceRule();
    rule.hour = 2;
    rule.minute = 0;
    
    schedule.scheduleJob('daily-backup', rule, async () => {
      await this.performScheduledBackup();
    });
  }
  
  // バックグラウンドタスクとして実行
  private async performScheduledBackup(): Promise<void> {
    this.backgroundTaskId = BackgroundTask.start({
      taskName: 'backup',
      taskKey: 'daily-backup'
    });
    
    try {
      const backupService = new BackupService();
      const result = await backupService.createFullBackup();
      
      if (result.success) {
        await this.notifyBackupSuccess(result.metadata!);
      } else {
        await this.notifyBackupFailure(result.error!);
      }
      
    } finally {
      if (this.backgroundTaskId !== null) {
        BackgroundTask.finish(this.backgroundTaskId);
        this.backgroundTaskId = null;
      }
    }
  }
  
  private async notifyBackupSuccess(metadata: BackupMetadata): Promise<void> {
    // ローカル通知でバックアップ完了を通知
    await LocalNotification.show({
      title: 'バックアップ完了',
      body: `データを安全に保存しました（${metadata.recordCount}件）`,
      badge: 1
    });
  }
}
```

## 復元機能

### 1. 復元サービス
```typescript
// services/RestoreService.ts
export class RestoreService {
  
  // バックアップファイルから復元
  async restoreFromBackup(filePath: string, password?: string): Promise<RestoreResult> {
    try {
      // 1. バックアップファイル読み込み
      const content = await RNFS.readFile(filePath, 'utf8');
      let backup: BackupData;
      
      try {
        backup = JSON.parse(content);
      } catch {
        // 暗号化されている可能性
        if (!password) {
          return { success: false, error: 'Password required for encrypted backup' };
        }
        backup = await this.decryptBackup(content, password);
      }
      
      // 2. バックアップ検証
      const validation = await this.validateBackup(backup);
      if (!validation.isValid) {
        return { success: false, error: `Invalid backup: ${validation.error}` };
      }
      
      // 3. データベースバックアップ作成（復元前）
      const preRestoreBackup = await new BackupService().createFullBackup();
      
      // 4. 復元実行
      await this.performRestore(backup);
      
      // 5. 復元後検証
      const verification = await this.verifyRestore(backup);
      if (!verification.isValid) {
        // 復元失敗時は元のデータに戻す
        await this.rollbackRestore(preRestoreBackup.filePath!);
        return { success: false, error: 'Restore verification failed' };
      }
      
      return { 
        success: true, 
        restoredCount: backup.metadata.recordCount,
        backupDate: backup.metadata.createdAt
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // 段階的復元（安全な復元）
  async performRestore(backup: BackupData): Promise<void> {
    await database.write(async () => {
      // 1. 現在のデータをクリア
      await this.clearCurrentData();
      
      // 2. トレーナーデータ復元（依存関係の関係で先に実行）
      await this.restoreTrainers(backup.data.trainers);
      
      // 3. 目標データ復元
      await this.restoreGoals(backup.data.goals);
      
      // 4. 設定・統計情報復元
      await this.restorePreferences(backup.data.preferences);
      await this.restoreStatistics(backup.data.statistics);
    });
  }
  
  private async restoreGoals(goals: any[]): Promise<void> {
    for (const goalData of goals) {
      await database.get<Goal>('goals').create(goal => {
        Object.assign(goal, goalData);
        goal.id = goalData.id; // IDを保持
      });
    }
  }
  
  private async restoreTrainers(trainers: any[]): Promise<void> {
    for (const trainerData of trainers) {
      await database.get<Trainer>('trainers').create(trainer => {
        Object.assign(trainer, trainerData);
        trainer.id = trainerData.id;
      });
    }
  }
  
  // バックアップ検証
  private async validateBackup(backup: BackupData): Promise<ValidationResult> {
    // 1. チェックサム検証
    const calculatedChecksum = this.calculateChecksum(backup.data);
    if (calculatedChecksum !== backup.checksum) {
      return { isValid: false, error: 'Checksum mismatch - backup may be corrupted' };
    }
    
    // 2. スキーマバージョン互換性確認
    const currentSchema = await this.getCurrentSchemaVersion();
    if (backup.metadata.schemaVersion > currentSchema) {
      return { 
        isValid: false, 
        error: `Backup requires newer app version (schema v${backup.metadata.schemaVersion})` 
      };
    }
    
    // 3. データ構造検証
    const structureValidation = this.validateDataStructure(backup.data);
    if (!structureValidation.isValid) {
      return structureValidation;
    }
    
    return { isValid: true };
  }
}
```

### 2. エクスポート・インポート機能
```typescript
// services/ExportImportService.ts
export class ExportImportService {
  
  // データをファイルにエクスポート
  async exportToFile(format: 'json' | 'csv', options?: ExportOptions): Promise<string> {
    const data = await new BackupService().gatherAllData();
    
    switch (format) {
      case 'json':
        return await this.exportToJSON(data, options);
      case 'csv':
        return await this.exportToCSV(data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  private async exportToJSON(data: BackupContent, options?: ExportOptions): Promise<string> {
    const exportData = {
      exportDate: new Date().toISOString(),
      appVersion: DeviceInfo.getVersion(),
      data: options?.includeMetadata ? data : this.sanitizeForExport(data)
    };
    
    const fileName = `appcadia_export_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
    await RNFS.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
    
    return filePath;
  }
  
  private async exportToCSV(data: BackupContent, options?: ExportOptions): Promise<string> {
    const csvData = [
      // ヘッダー
      ['目標名', 'カテゴリ', '作成日', '完了スタンプ数', 'ストリーク', 'ステータス'].join(','),
      
      // データ行
      ...data.goals.map(goal => [
        goal.title,
        goal.category,
        new Date(goal.createdAt).toLocaleDateString('ja-JP'),
        goal.totalStamps.toString(),
        goal.currentStreak.toString(),
        goal.isActive ? '有効' : '無効'
      ].join(','))
    ].join('\n');
    
    const fileName = `appcadia_goals_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
    await RNFS.writeFile(filePath, csvData, 'utf8');
    
    return filePath;
  }
  
  // ファイルからデータをインポート
  async importFromFile(filePath: string): Promise<ImportResult> {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      const importData = JSON.parse(content);
      
      // データ検証
      if (!this.isValidImportData(importData)) {
        return { success: false, error: 'Invalid import data format' };
      }
      
      // インポート実行
      await this.performImport(importData.data);
      
      return { success: true, importedCount: this.countImportedRecords(importData.data) };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## 暗号化とセキュリティ

### 1. データ暗号化
```typescript
// utils/BackupEncryption.ts
export class BackupEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  
  // バックアップデータの暗号化
  static async encrypt(data: BackupData, password: string): Promise<string> {
    const key = await this.deriveKey(password);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key, { iv });
    
    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // IV + AuthTag + 暗号化データを結合
    return Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
  }
  
  // バックアップデータの復号化
  static async decrypt(encryptedData: string, password: string): Promise<BackupData> {
    const key = await this.deriveKey(password);
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const iv = buffer.slice(0, this.IV_LENGTH);
    const authTag = buffer.slice(this.IV_LENGTH, this.IV_LENGTH + 16);
    const encrypted = buffer.slice(this.IV_LENGTH + 16);
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key, { iv });
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  // パスワードからキー導出
  private static async deriveKey(password: string): Promise<Buffer> {
    const salt = Buffer.from('appcadia-backup-salt', 'utf8'); // 本番では動的salt使用
    return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha256');
  }
}
```

## ユーザーインターフェース

### 1. バックアップ設定画面
```typescript
// components/BackupSettings.tsx
export const BackupSettings: React.FC = () => {
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [lastBackupDate, setLastBackupDate] = useState<Date | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      const backupService = new BackupService();
      const result = await backupService.createFullBackup();
      
      if (result.success) {
        Alert.alert(
          'バックアップ完了',
          `データを正常にバックアップしました\n作成日時: ${result.metadata?.createdAt.toLocaleString('ja-JP')}`
        );
        setLastBackupDate(result.metadata?.createdAt || new Date());
      } else {
        Alert.alert('エラー', `バックアップに失敗しました: ${result.error}`);
      }
      
    } finally {
      setIsCreatingBackup(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      const exportService = new ExportImportService();
      const filePath = await exportService.exportToFile('json');
      
      // ファイル共有
      await Share.share({
        url: `file://${filePath}`,
        title: 'Appcadiaデータエクスポート'
      });
      
    } catch (error) {
      Alert.alert('エラー', `エクスポートに失敗しました: ${error.message}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <Section title="自動バックアップ">
        <Switch
          value={autoBackupEnabled}
          onValueChange={setAutoBackupEnabled}
        />
        <Text>毎日自動でデータをバックアップします</Text>
      </Section>
      
      <Section title="手動バックアップ">
        <Button
          title={isCreatingBackup ? "作成中..." : "今すぐバックアップ"}
          onPress={handleCreateBackup}
          disabled={isCreatingBackup}
        />
        {lastBackupDate && (
          <Text>最終バックアップ: {lastBackupDate.toLocaleString('ja-JP')}</Text>
        )}
      </Section>
      
      <Section title="データエクスポート">
        <Button
          title="データをエクスポート"
          onPress={handleExportData}
        />
        <Text>他のアプリやデバイスで使用可能な形式でエクスポートします</Text>
      </Section>
    </View>
  );
};
```

## 実装チェックリスト

### Phase 1 (基本機能)
- [ ] BackupService基本実装
- [ ] RestoreService基本実装
- [ ] ファイルI/O機能
- [ ] 基本的なUI実装

### Phase 2 (自動化・暗号化)
- [ ] 自動バックアップスケジューラ
- [ ] データ暗号化機能
- [ ] エクスポート/インポート機能
- [ ] エラーハンドリング強化

### Phase 3 (最適化・運用)
- [ ] 増分バックアップ実装
- [ ] パフォーマンス最適化
- [ ] ユーザビリティ向上
- [ ] 監視・ログ機能

## 運用考慮事項

### 1. ストレージ管理
- バックアップファイルサイズの監視
- 自動清理機能による容量最適化
- ユーザーへの容量警告表示

### 2. パフォーマンス
- 大容量データの分割処理
- バックグラウンド処理による UI ブロック防止
- 進捗表示による UX 向上

### 3. セキュリティ
- 暗号化の強度確保
- キー管理の安全性
- 一時ファイルの適切な削除