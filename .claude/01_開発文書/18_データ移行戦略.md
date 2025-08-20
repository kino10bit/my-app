# データ移行戦略設計書

## 概要
Appcadiaアプリケーションにおけるデータベース移行戦略とバージョン管理。WatermelonDBを基盤とし、アプリアップデート時のデータ整合性とユーザーエクスペリエンスを保証する。

## 移行戦略の原則

### 1. データ保護原則
- **データ損失防止**: 移行失敗時の完全ロールバック
- **互換性維持**: 旧バージョンとの下位互換性
- **段階的移行**: 大規模変更の分割実行
- **検証機能**: 移行後のデータ整合性確認

### 2. パフォーマンス原則
- **最小ダウンタイム**: アプリ起動時間への影響最小化
- **バックグラウンド実行**: 重い処理の非同期実行
- **プログレス表示**: ユーザーへの進捗フィードバック
- **メモリ効率**: 大容量データの分割処理

## データベースバージョン管理

### 1. スキーマバージョン定義
```typescript
// database/migrations/schema_versions.ts
export const SCHEMA_VERSIONS = {
  V1_0_0: 1,   // 初期リリース
  V1_1_0: 2,   // Trainerテーブル追加
  V1_2_0: 3,   // Goal.difficulty追加
  V1_3_0: 4,   // Achievement機能追加
  V2_0_0: 5    // メジャーアップデート
} as const;

export type SchemaVersion = typeof SCHEMA_VERSIONS[keyof typeof SCHEMA_VERSIONS];
```

### 2. 移行ファイル構造
```
src/database/migrations/
├── index.ts                 // 移行管理メイン
├── migration_001_to_002.ts  // V1.0→V1.1移行
├── migration_002_to_003.ts  // V1.1→V1.2移行
├── migration_003_to_004.ts  // V1.2→V1.3移行
├── migration_004_to_005.ts  // V1.3→V2.0移行
└── utils/
    ├── backup.ts            // バックアップユーティリティ
    ├── validation.ts        // データ検証ツール
    └── rollback.ts          // ロールバック機能
```

## 移行実装パターン

### 1. 基本移行クラス
```typescript
// database/migrations/base_migration.ts
export abstract class BaseMigration {
  abstract readonly fromVersion: SchemaVersion;
  abstract readonly toVersion: SchemaVersion;
  abstract readonly description: string;
  
  // 前進移行
  abstract async up(database: Database): Promise<void>;
  
  // 後退移行（ロールバック）
  abstract async down(database: Database): Promise<void>;
  
  // 移行前検証
  async validate(database: Database): Promise<boolean> {
    return true;
  }
  
  // 移行後検証
  async verify(database: Database): Promise<boolean> {
    return true;
  }
}
```

### 2. 具体的移行例
```typescript
// database/migrations/migration_001_to_002.ts
export class Migration001To002 extends BaseMigration {
  readonly fromVersion = SCHEMA_VERSIONS.V1_0_0;
  readonly toVersion = SCHEMA_VERSIONS.V1_1_0;
  readonly description = 'Trainerテーブルとリレーションを追加';
  
  async up(database: Database): Promise<void> {
    await database.write(async () => {
      // 1. Trainerテーブル作成
      await database.unsafeResetDatabase();
      
      // 2. 既存Goalデータの退避
      const existingGoals = await database.get<Goal>('goals').query().fetch();
      
      // 3. 新スキーマでテーブル再作成
      await this.createTrainerTable(database);
      
      // 4. デフォルトトレーナー作成
      const defaultTrainer = await this.createDefaultTrainer(database);
      
      // 5. Goal データ復元（trainer_id付与）
      await this.restoreGoalsWithTrainer(database, existingGoals, defaultTrainer.id);
    });
  }
  
  async down(database: Database): Promise<void> {
    // ロールバック: Trainerテーブル削除、Goalから trainer_id削除
    await database.write(async () => {
      await database.get<Goal>('goals')
        .query()
        .destroyAllPermanently();
        
      await database.get<Trainer>('trainers')
        .query()
        .destroyAllPermanently();
    });
  }
  
  private async createDefaultTrainer(database: Database): Promise<Trainer> {
    return await database.get<Trainer>('trainers').create(trainer => {
      trainer.name = 'さくら';
      trainer.type = 'gentle';
      trainer.isSelected = true;
      // 他のデフォルト値設定
    });
  }
}
```

## バックアップ戦略

### 1. 移行前バックアップ
```typescript
// database/migrations/utils/backup.ts
export class MigrationBackup {
  private backupDir: string;
  
  constructor() {
    this.backupDir = `${RNFS.DocumentDirectoryPath}/migrations/backups`;
  }
  
  async createBackup(version: SchemaVersion): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_v${version}_${timestamp}.json`;
    const backupPath = `${this.backupDir}/${backupFileName}`;
    
    // 全テーブルデータをエクスポート
    const backup = {
      version,
      timestamp,
      data: {
        goals: await this.exportTable('goals'),
        trainers: await this.exportTable('trainers'),
        achievements: await this.exportTable('achievements')
      }
    };
    
    await RNFS.writeFile(backupPath, JSON.stringify(backup), 'utf8');
    
    // 古いバックアップの清理（10個まで保持）
    await this.cleanupOldBackups();
    
    return backupPath;
  }
  
  async restoreBackup(backupPath: string): Promise<void> {
    const backupData = JSON.parse(await RNFS.readFile(backupPath, 'utf8'));
    
    await database.write(async () => {
      // 現在のデータを削除
      await this.clearAllTables();
      
      // バックアップデータを復元
      for (const [tableName, records] of Object.entries(backupData.data)) {
        await this.importTable(tableName, records as any[]);
      }
    });
  }
}
```

### 2. インクリメンタルバックアップ
```typescript
export class IncrementalBackup {
  // 変更差分のみバックアップ
  async createIncrementalBackup(lastBackupTime: Date): Promise<void> {
    const changes = await this.getChangedRecords(lastBackupTime);
    
    const incrementalBackup = {
      type: 'incremental',
      baseTime: lastBackupTime,
      currentTime: new Date(),
      changes
    };
    
    await this.saveBackup(incrementalBackup);
  }
  
  private async getChangedRecords(since: Date): Promise<Record<string, any[]>> {
    return {
      goals: await database.get<Goal>('goals')
        .query(Q.where('updated_at', Q.gt(since.getTime())))
        .fetch(),
      trainers: await database.get<Trainer>('trainers')
        .query(Q.where('updated_at', Q.gt(since.getTime())))
        .fetch()
    };
  }
}
```

## エラー処理とロールバック

### 1. 移行エラーハンドリング
```typescript
// database/migrations/migration_manager.ts
export class MigrationManager {
  async runMigration(migration: BaseMigration): Promise<MigrationResult> {
    const backupPath = await this.backup.createBackup(migration.fromVersion);
    
    try {
      // 1. 移行前検証
      const isValid = await migration.validate(database);
      if (!isValid) {
        throw new Error(`Migration validation failed: ${migration.description}`);
      }
      
      // 2. 移行実行
      await migration.up(database);
      
      // 3. 移行後検証
      const isVerified = await migration.verify(database);
      if (!isVerified) {
        throw new Error(`Migration verification failed: ${migration.description}`);
      }
      
      // 4. バージョン更新
      await this.updateSchemaVersion(migration.toVersion);
      
      return { success: true, backupPath };
      
    } catch (error) {
      // エラー時ロールバック
      await this.rollbackMigration(migration, backupPath, error);
      return { success: false, error: error.message, backupPath };
    }
  }
  
  private async rollbackMigration(
    migration: BaseMigration,
    backupPath: string,
    error: Error
  ): Promise<void> {
    try {
      // 1. 移行の逆実行を試行
      await migration.down(database);
    } catch (rollbackError) {
      // 2. 逆実行失敗時はバックアップから復元
      await this.backup.restoreBackup(backupPath);
    }
    
    // 3. エラーレポート送信
    await this.reportMigrationError(migration, error);
  }
}
```

### 2. 段階的ロールバック
```typescript
export class StageableRollback {
  private rollbackStages: RollbackStage[] = [];
  
  async addRollbackStage(stage: RollbackStage): Promise<void> {
    this.rollbackStages.push(stage);
  }
  
  async executeRollback(): Promise<void> {
    // 逆順で実行
    for (const stage of this.rollbackStages.reverse()) {
      try {
        await stage.execute();
      } catch (error) {
        console.error(`Rollback stage failed: ${stage.description}`, error);
        // 継続実行（可能な限り元の状態に戻す）
      }
    }
    
    this.rollbackStages = [];
  }
}
```

## データ整合性検証

### 1. 検証ルール定義
```typescript
// database/migrations/utils/validation.ts
export class DataValidator {
  async validateGoalIntegrity(): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // 1. 必須フィールド検証
    const goalsWithoutTitle = await database.get<Goal>('goals')
      .query(Q.where('title', ''))
      .fetchCount();
    
    if (goalsWithoutTitle > 0) {
      issues.push({
        severity: 'error',
        table: 'goals',
        field: 'title',
        message: `${goalsWithoutTitle} goals have empty title`
      });
    }
    
    // 2. 外部キー整合性検証
    const orphanGoals = await this.findOrphanGoals();
    if (orphanGoals.length > 0) {
      issues.push({
        severity: 'error',
        table: 'goals',
        field: 'trainer_id',
        message: `${orphanGoals.length} goals reference non-existent trainers`
      });
    }
    
    return { isValid: issues.length === 0, issues };
  }
  
  private async findOrphanGoals(): Promise<Goal[]> {
    const allGoals = await database.get<Goal>('goals').query().fetch();
    const trainerIds = new Set(
      (await database.get<Trainer>('trainers').query().fetch()).map(t => t.id)
    );
    
    return allGoals.filter(goal => 
      goal.trainerId && !trainerIds.has(goal.trainerId)
    );
  }
}
```

## パフォーマンス最適化

### 1. 大容量データ移行
```typescript
export class BulkMigration {
  private readonly BATCH_SIZE = 1000;
  
  async migrateLargeTable(
    tableName: string,
    transformer: (record: any) => any
  ): Promise<void> {
    const totalCount = await database.get(tableName).query().fetchCount();
    let processed = 0;
    
    while (processed < totalCount) {
      const batch = await database.get(tableName)
        .query(Q.skip(processed), Q.take(this.BATCH_SIZE))
        .fetch();
      
      await database.write(async () => {
        for (const record of batch) {
          const transformed = transformer(record);
          await record.update(() => {
            Object.assign(record, transformed);
          });
        }
      });
      
      processed += batch.length;
      
      // プログレス通知
      await this.notifyProgress(processed, totalCount);
    }
  }
  
  private async notifyProgress(processed: number, total: number): Promise<void> {
    const progress = Math.floor((processed / total) * 100);
    // ユーザーへの進捗表示更新
    EventEmitter.emit('migration_progress', { progress, processed, total });
  }
}
```

## 実装チェックリスト

### Phase 1 (基本機能)
- [ ] BaseMigrationクラス実装
- [ ] スキーマバージョン管理
- [ ] 基本バックアップ機能
- [ ] シンプルな移行例実装

### Phase 2 (堅牢性向上)
- [ ] エラーハンドリング強化
- [ ] ロールバック機能実装
- [ ] データ整合性検証
- [ ] インクリメンタルバックアップ

### Phase 3 (最適化)
- [ ] パフォーマンス最適化
- [ ] 大容量データ対応
- [ ] 進捗表示実装
- [ ] 自動テスト整備

## 運用手順

### 1. 新規移行の追加
1. 新しい移行クラスを作成
2. up/down メソッド実装
3. テスト環境での検証
4. コードレビュー実施
5. 本番環境リリース

### 2. 緊急ロールバック
1. 問題の発生確認
2. 影響範囲の特定
3. ロールバック実行
4. データ整合性確認
5. 事後分析とレポート