# プライバシー・データ保護設計書

## 概要
Appcadiaアプリケーションの包括的プライバシー・データ保護戦略。GDPR、個人情報保護法等の法規制遵守、ユーザーデータの透明性確保、セキュアなデータ処理により、ユーザーの信頼を獲得・維持する。

## データプライバシー戦略

### 1. データ分類・取扱方針
```typescript
// データ分類とプライバシーレベル定義
export const DATA_PRIVACY_CLASSIFICATION = {
  // 高機密データ（特別な保護が必要）
  highly_sensitive: {
    description: '法的保護が必要な極めて機密なデータ',
    retention_period: '2年', 
    encryption: 'AES-256',
    access_control: 'multi_factor_auth',
    examples: [
      'payment_information',        // 決済情報
      'government_id',             // 政府発行ID
      'medical_records',           // 医療記録（健康データ含む）
      'biometric_data'             // 生体認証データ
    ],
    legal_basis: 'explicit_consent',
    deletion_policy: 'immediate_on_request'
  },
  
  // 個人識別データ（PII）
  personally_identifiable: {
    description: '個人を特定可能な情報',
    retention_period: '3年',
    encryption: 'AES-256',
    access_control: 'role_based',
    examples: [
      'email_address',             // メールアドレス
      'phone_number',              // 電話番号
      'full_name',                 // 氏名
      'postal_address',            // 住所
      'device_identifiers'         // デバイス識別子
    ],
    legal_basis: 'contract_performance',
    deletion_policy: 'scheduled_purge'
  },
  
  // 行動・利用データ
  behavioral: {
    description: 'アプリ利用・行動に関するデータ',
    retention_period: '1年',
    encryption: 'AES-128',
    access_control: 'standard',
    examples: [
      'goal_completion_history',   // 目標達成履歴
      'app_usage_patterns',        // アプリ利用パターン
      'feature_interactions',      // 機能利用状況
      'session_analytics'          // セッション分析データ
    ],
    legal_basis: 'legitimate_interest',
    deletion_policy: 'automatic_aging'
  },
  
  // 技術データ
  technical: {
    description: '技術的な動作・システム データ',
    retention_period: '6ヶ月',
    encryption: 'in_transit_only',
    access_control: 'internal_only',
    examples: [
      'crash_reports',             // クラッシュレポート
      'performance_metrics',       // パフォーマンス指標
      'error_logs',               // エラーログ
      'system_diagnostics'        // システム診断データ
    ],
    legal_basis: 'legitimate_interest',
    deletion_policy: 'automatic_purge'
  }
} as const;
```

### 2. 同意管理システム
```typescript
// services/ConsentManagementService.ts
export class ConsentManagementService {
  private static consentRecords = new Map<string, ConsentRecord>();
  
  // 同意の取得・記録
  static async requestConsent(
    userId: string,
    purposes: ConsentPurpose[],
    context: ConsentContext
  ): Promise<ConsentResult> {
    
    const consentUI = await this.displayConsentInterface(purposes, context);
    const userChoices = await consentUI.getUserChoices();
    
    const consentRecord: ConsentRecord = {
      userId,
      timestamp: new Date(),
      purposes: userChoices.acceptedPurposes,
      rejectedPurposes: userChoices.rejectedPurposes,
      context,
      ipAddress: await this.getUserIPAddress(),
      userAgent: await DeviceInfo.getUserAgent(),
      version: '1.0',
      withdrawnAt: null
    };
    
    // 同意記録の保存（改ざん防止）
    const signedRecord = await this.signConsentRecord(consentRecord);
    await this.storeConsentRecord(userId, signedRecord);
    
    // データ処理権限の更新
    await this.updateProcessingPermissions(userId, consentRecord);
    
    return {
      success: true,
      consentId: signedRecord.id,
      grantedPurposes: consentRecord.purposes,
      expiresAt: this.calculateExpirationDate(consentRecord)
    };
  }
  
  private async displayConsentInterface(
    purposes: ConsentPurpose[],
    context: ConsentContext
  ): Promise<ConsentInterface> {
    
    return new Promise((resolve) => {
      const consentModal = new ConsentModal({
        title: 'データ利用に関する同意',
        purposes: purposes.map(purpose => ({
          id: purpose.id,
          title: this.getLocalizedPurposeTitle(purpose.id),
          description: this.getLocalizedPurposeDescription(purpose.id),
          required: purpose.required,
          dataTypes: purpose.dataTypes,
          retentionPeriod: purpose.retentionPeriod,
          thirdPartySharing: purpose.thirdPartySharing || false
        })),
        
        onChoice: (choices: ConsentChoices) => {
          resolve({
            getUserChoices: () => Promise.resolve(choices)
          });
        },
        
        // 詳細情報表示
        onDetailRequest: (purposeId: string) => {
          this.showDetailedPurposeInfo(purposeId);
        }
      });
      
      consentModal.show();
    });
  }
  
  // 同意状況の確認
  static async checkConsent(
    userId: string,
    purpose: ConsentPurpose
  ): Promise<ConsentStatus> {
    
    const record = await this.getLatestConsentRecord(userId);
    
    if (!record) {
      return {
        status: 'not_requested',
        canProcess: false,
        reason: 'No consent record found'
      };
    }
    
    // 期限切れチェック
    if (record.expiresAt && new Date() > record.expiresAt) {
      return {
        status: 'expired',
        canProcess: false,
        reason: 'Consent has expired',
        expiresAt: record.expiresAt
      };
    }
    
    // 撤回チェック
    if (record.withdrawnAt) {
      return {
        status: 'withdrawn',
        canProcess: false,
        reason: 'Consent has been withdrawn',
        withdrawnAt: record.withdrawnAt
      };
    }
    
    // 目的別チェック
    const hasConsent = record.purposes.some(p => p.id === purpose.id);
    
    return {
      status: hasConsent ? 'granted' : 'denied',
      canProcess: hasConsent,
      grantedAt: record.timestamp,
      expiresAt: record.expiresAt
    };
  }
  
  // 同意の撤回
  static async withdrawConsent(
    userId: string,
    purposeIds?: string[]
  ): Promise<WithdrawalResult> {
    
    const record = await this.getLatestConsentRecord(userId);
    if (!record) {
      throw new Error('No consent record found to withdraw');
    }
    
    const withdrawalRecord: WithdrawalRecord = {
      originalConsentId: record.id,
      userId,
      withdrawnPurposes: purposeIds || record.purposes.map(p => p.id),
      withdrawnAt: new Date(),
      reason: 'user_request',
      ipAddress: await this.getUserIPAddress(),
      userAgent: await DeviceInfo.getUserAgent()
    };
    
    // 撤回記録の保存
    await this.storeWithdrawalRecord(withdrawalRecord);
    
    // データ処理停止
    await this.stopDataProcessing(userId, withdrawalRecord.withdrawnPurposes);
    
    // データ削除（必要に応じて）
    if (withdrawalRecord.withdrawnPurposes.length === record.purposes.length) {
      await this.scheduleDataDeletion(userId);
    }
    
    return {
      success: true,
      withdrawalId: withdrawalRecord.id,
      affectedPurposes: withdrawalRecord.withdrawnPurposes,
      deletionScheduled: withdrawalRecord.withdrawnPurposes.length === record.purposes.length
    };
  }
  
  // データ処理の停止
  private static async stopDataProcessing(
    userId: string,
    purposeIds: string[]
  ): Promise<void> {
    
    for (const purposeId of purposeIds) {
      switch (purposeId) {
        case 'analytics':
          await this.stopAnalyticsCollection(userId);
          break;
        case 'personalization':
          await this.clearPersonalizationData(userId);
          break;
        case 'marketing':
          await this.removeFromMarketingLists(userId);
          break;
        case 'third_party_sharing':
          await this.revokeThirdPartyAccess(userId);
          break;
      }
    }
    
    console.log(`🛑 Stopped data processing for user ${userId}, purposes: ${purposeIds.join(', ')}`);
  }
}
```

### 3. データ最小化・仮名化
```typescript
// services/DataMinimizationService.ts
export class DataMinimizationService {
  
  // データ最小化原則の適用
  static async minimizeDataCollection(
    requestedData: DataCollectionRequest,
    purpose: ProcessingPurpose
  ): Promise<MinimizedDataCollection> {
    
    // 目的に必要最小限のデータのみ特定
    const necessaryFields = this.getNecessaryFieldsForPurpose(purpose);
    const minimizedData = this.filterUnnecessaryFields(requestedData.data, necessaryFields);
    
    // データ品質の確認
    const qualityCheck = await this.assessDataQuality(minimizedData);
    if (!qualityCheck.sufficient) {
      console.warn('⚠️ Minimized data may not be sufficient for purpose:', purpose.id);
    }
    
    return {
      originalFieldCount: Object.keys(requestedData.data).length,
      minimizedFieldCount: Object.keys(minimizedData).length,
      data: minimizedData,
      purpose,
      minimizationRatio: Object.keys(minimizedData).length / Object.keys(requestedData.data).length
    };
  }
  
  // データ仮名化
  static async pseudonymizeData(
    data: PersonalData,
    context: PseudonymizationContext
  ): Promise<PseudonymizedData> {
    
    const pseudonymizedData = { ...data };
    const pseudonymMap = new Map<string, string>();
    
    // 直接識別子の仮名化
    for (const field of context.directIdentifiers) {
      if (pseudonymizedData[field]) {
        const pseudonym = await this.generatePseudonym(
          pseudonymizedData[field],
          context.purpose,
          field
        );
        pseudonymMap.set(field, pseudonym);
        pseudonymizedData[field] = pseudonym;
      }
    }
    
    // 準識別子の処理（k-匿名性の確保）
    const kAnonymityResult = await this.applyKAnonymity(
      pseudonymizedData,
      context.quasiIdentifiers,
      context.kValue || 5
    );
    
    // L-多様性の確保（必要に応じて）
    let lDiversityResult = pseudonymizedData;
    if (context.sensitiveAttributes) {
      lDiversityResult = await this.applyLDiversity(
        kAnonymityResult,
        context.sensitiveAttributes,
        context.lValue || 2
      );
    }
    
    return {
      data: lDiversityResult,
      pseudonymMap,
      kAnonymityLevel: context.kValue || 5,
      lDiversityLevel: context.lValue || 2,
      pseudonymizationId: this.generatePseudonymizationId(),
      createdAt: new Date()
    };
  }
  
  // k-匿名性の適用
  private static async applyKAnonymity(
    data: any,
    quasiIdentifiers: string[],
    k: number
  ): Promise<any> {
    
    const anonymizedData = { ...data };
    
    for (const field of quasiIdentifiers) {
      if (anonymizedData[field]) {
        anonymizedData[field] = this.generalizeValue(anonymizedData[field], field, k);
      }
    }
    
    return anonymizedData;
  }
  
  // 値の一般化（年齢を年代に、郵便番号を地域に等）
  private static generalizeValue(value: any, fieldType: string, k: number): any {
    switch (fieldType) {
      case 'age':
        const age = parseInt(value);
        return `${Math.floor(age / 10) * 10}代`;
        
      case 'postal_code':
        return value.toString().substring(0, 3) + '****';
        
      case 'birth_year':
        const year = parseInt(value);
        const decade = Math.floor(year / 10) * 10;
        return `${decade}年代`;
        
      case 'location':
        // 座標の精度を下げる
        if (value.latitude && value.longitude) {
          return {
            latitude: Math.round(value.latitude * 100) / 100,
            longitude: Math.round(value.longitude * 100) / 100
          };
        }
        break;
        
      default:
        return value;
    }
  }
  
  // データ品質評価
  private static async assessDataQuality(data: any): Promise<QualityAssessment> {
    const assessment: QualityAssessment = {
      sufficient: true,
      issues: [],
      score: 100
    };
    
    // 必須フィールドの存在確認
    const requiredFields = ['userId', 'timestamp'];
    const missingRequired = requiredFields.filter(field => !data[field]);
    
    if (missingRequired.length > 0) {
      assessment.sufficient = false;
      assessment.issues.push({
        type: 'missing_required_fields',
        fields: missingRequired,
        impact: 'high'
      });
      assessment.score -= 30;
    }
    
    // データの完整性チェック
    const emptyFields = Object.entries(data)
      .filter(([key, value]) => value === null || value === undefined || value === '')
      .map(([key]) => key);
    
    if (emptyFields.length > Object.keys(data).length * 0.5) {
      assessment.issues.push({
        type: 'too_many_empty_fields',
        fields: emptyFields,
        impact: 'medium'
      });
      assessment.score -= 20;
    }
    
    return assessment;
  }
  
  // 定期的なデータ最小化レビュー
  static async performDataMinimizationReview(): Promise<MinimizationReviewReport> {
    console.log('🔍 Starting data minimization review...');
    
    const report: MinimizationReviewReport = {
      reviewDate: new Date(),
      tablesReviewed: [],
      recommendationsCount: 0,
      potentialSavings: { storage: 0, processing: 0 }
    };
    
    // 各テーブルのデータ利用状況を分析
    const tables = ['users', 'goals', 'goal_stamps', 'user_preferences'];
    
    for (const tableName of tables) {
      const tableAnalysis = await this.analyzeTableDataUsage(tableName);
      report.tablesReviewed.push(tableAnalysis);
      
      // 未使用フィールドの特定
      if (tableAnalysis.unusedFields.length > 0) {
        report.recommendationsCount++;
        console.log(`📊 Found ${tableAnalysis.unusedFields.length} unused fields in ${tableName}`);
      }
    }
    
    console.log(`✅ Data minimization review completed: ${report.recommendationsCount} recommendations`);
    return report;
  }
}
```

### 4. データポータビリティ・削除権
```typescript
// services/DataPortabilityService.ts
export class DataPortabilityService {
  
  // ユーザーデータエクスポート
  static async exportUserData(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<DataExportResult> {
    
    console.log(`📤 Starting data export for user ${userId} in ${format} format`);
    
    const exportId = this.generateExportId();
    const exportPath = `${FileSystem.documentDirectory}exports/${exportId}`;
    
    try {
      // ユーザーの全データを収集
      const userData = await this.collectAllUserData(userId);
      
      // データの構造化・整理
      const structuredData = await this.structureDataForExport(userData);
      
      // 形式に応じた変換
      let exportData: string;
      let fileName: string;
      let mimeType: string;
      
      switch (format) {
        case 'json':
          exportData = JSON.stringify(structuredData, null, 2);
          fileName = `appcadia_data_${userId}_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          exportData = await this.convertToCSV(structuredData);
          fileName = `appcadia_data_${userId}_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'xml':
          exportData = await this.convertToXML(structuredData);
          fileName = `appcadia_data_${userId}_${Date.now()}.xml`;
          mimeType = 'application/xml';
          break;
      }
      
      // ファイル生成
      const filePath = `${exportPath}/${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, exportData);
      
      // メタデータファイル生成
      const metadata = {
        exportId,
        userId,
        format,
        generatedAt: new Date().toISOString(),
        dataVersion: '1.0',
        recordCounts: this.calculateRecordCounts(structuredData),
        checksums: {
          md5: await this.calculateMD5(exportData),
          sha256: await this.calculateSHA256(exportData)
        }
      };
      
      await FileSystem.writeAsStringAsync(
        `${exportPath}/metadata.json`,
        JSON.stringify(metadata, null, 2)
      );
      
      // ZIPアーカイブ作成
      const archivePath = await this.createZipArchive(exportPath, fileName.replace(/\.[^.]+$/, '.zip'));
      
      return {
        success: true,
        exportId,
        filePath: archivePath,
        fileSize: (await FileSystem.getInfoAsync(archivePath)).size,
        recordCount: metadata.recordCounts.total,
        format,
        generatedAt: metadata.generatedAt
      };
      
    } catch (error) {
      console.error(`❌ Data export failed for user ${userId}:`, error);
      
      return {
        success: false,
        exportId,
        error: error.message,
        generatedAt: new Date().toISOString()
      };
    }
  }
  
  // 全ユーザーデータの収集
  private static async collectAllUserData(userId: string): Promise<CompleteUserData> {
    const userData: CompleteUserData = {
      profile: {},
      goals: [],
      stamps: [],
      preferences: {},
      analytics: [],
      trainers: []
    };
    
    try {
      // プロフィールデータ
      const user = await database.get<User>('users').find(userId);
      userData.profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // 機密データは除外
        subscriptionStatus: user.subscriptionStatus
      };
      
      // 目標データ
      const goals = await database.get<Goal>('goals')
        .query(Q.where('user_id', userId))
        .fetch();
      
      userData.goals = goals.map(goal => ({
        id: goal.id,
        title: goal.title,
        category: goal.category,
        targetDescription: goal.targetDescription,
        difficulty: goal.difficulty,
        currentStreak: goal.currentStreak,
        totalStamps: goal.totalStamps,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }));
      
      // スタンプデータ
      const stamps = await database.get<GoalStamp>('goal_stamps')
        .query(
          Q.on('goals', Q.where('user_id', userId))
        )
        .fetch();
      
      userData.stamps = stamps.map(stamp => ({
        id: stamp.id,
        goalId: stamp.goalId,
        stampedAt: stamp.stampedAt,
        note: stamp.note
      }));
      
      // 設定データ
      const preferences = await database.get<UserPreference>('user_preferences')
        .query(Q.where('user_id', userId))
        .fetch();
      
      userData.preferences = preferences.reduce((acc, pref) => {
        acc[pref.key] = pref.value;
        return acc;
      }, {});
      
      // 利用統計データ（匿名化済み）
      const analytics = await database.get<AnalyticsEvent>('analytics_events')
        .query(
          Q.where('user_id', userId),
          Q.sortBy('timestamp', Q.desc),
          Q.take(1000) // 最新1000件まで
        )
        .fetch();
      
      userData.analytics = analytics.map(event => ({
        type: event.type,
        screen: event.screen,
        timestamp: event.timestamp,
        // IPアドレス等の個人識別情報は除外
        metadata: this.sanitizeAnalyticsMetadata(event.metadata)
      }));
      
    } catch (error) {
      console.error('Failed to collect user data:', error);
      throw new Error(`Data collection failed: ${error.message}`);
    }
    
    return userData;
  }
  
  // データ削除（忘れられる権利）
  static async deleteUserData(
    userId: string,
    options: DataDeletionOptions = {}
  ): Promise<DataDeletionResult> {
    
    console.log(`🗑️ Starting data deletion for user ${userId}`);
    
    const deletionId = this.generateDeletionId();
    const deletionReport: DataDeletionResult = {
      deletionId,
      userId,
      startedAt: new Date(),
      tablesProcessed: [],
      recordsDeleted: 0,
      success: false
    };
    
    try {
      // 削除前のデータバックアップ（法的要件に応じて）
      if (options.createBackup) {
        const backupResult = await this.createDeletionBackup(userId);
        deletionReport.backupId = backupResult.backupId;
      }
      
      // 段階的削除の実行
      const deletionSteps = [
        { table: 'analytics_events', cascade: false },
        { table: 'goal_stamps', cascade: false },
        { table: 'goals', cascade: true },
        { table: 'user_preferences', cascade: false },
        { table: 'user_sessions', cascade: false },
        { table: 'users', cascade: true } // 最後に削除
      ];
      
      for (const step of deletionSteps) {
        const deleted = await this.deleteFromTable(userId, step.table, step.cascade);
        deletionReport.tablesProcessed.push({
          tableName: step.table,
          recordsDeleted: deleted,
          deletedAt: new Date()
        });
        deletionReport.recordsDeleted += deleted;
      }
      
      // 関連ファイルの削除
      await this.deleteUserFiles(userId);
      
      // キャッシュ・一時データの削除
      await this.clearUserCaches(userId);
      
      // 第三者サービスからのデータ削除要求
      if (options.deleteFromThirdParties) {
        await this.requestThirdPartyDeletion(userId);
      }
      
      deletionReport.success = true;
      deletionReport.completedAt = new Date();
      
      // 削除ログの記録（監査用）
      await this.logDataDeletion(deletionReport);
      
      console.log(`✅ Data deletion completed for user ${userId}: ${deletionReport.recordsDeleted} records deleted`);
      
    } catch (error) {
      console.error(`❌ Data deletion failed for user ${userId}:`, error);
      deletionReport.success = false;
      deletionReport.error = error.message;
      deletionReport.completedAt = new Date();
    }
    
    return deletionReport;
  }
  
  private static async deleteFromTable(
    userId: string,
    tableName: string,
    cascade: boolean
  ): Promise<number> {
    
    let deletedCount = 0;
    
    try {
      const records = await database.get(tableName)
        .query(Q.where('user_id', userId))
        .fetch();
      
      if (records.length === 0) {
        return 0;
      }
      
      await database.write(async () => {
        for (const record of records) {
          if (cascade) {
            // カスケード削除：関連データも削除
            await this.deleteCascadeRelations(record);
          }
          
          await record.destroyPermanently();
          deletedCount++;
        }
      });
      
      console.log(`🗑️ Deleted ${deletedCount} records from ${tableName}`);
      
    } catch (error) {
      console.error(`Failed to delete from ${tableName}:`, error);
      throw error;
    }
    
    return deletedCount;
  }
  
  // 削除監査ログ
  private static async logDataDeletion(deletionReport: DataDeletionResult): Promise<void> {
    const auditLog: DataDeletionAuditLog = {
      deletionId: deletionReport.deletionId,
      userId: deletionReport.userId,
      requestedAt: deletionReport.startedAt,
      completedAt: deletionReport.completedAt || new Date(),
      success: deletionReport.success,
      recordsDeleted: deletionReport.recordsDeleted,
      tablesAffected: deletionReport.tablesProcessed.map(t => t.tableName),
      legalBasis: 'gdpr_article_17', // 忘れられる権利
      retentionPeriod: '7年', // 監査ログの保管期間
      authorizedBy: 'system_automated'
    };
    
    // 監査ログは別システムに保存（改ざん防止）
    await this.storeAuditLog(auditLog);
  }
}
```

## 実装チェックリスト

### Phase 1 (基本プライバシー対応)
- [ ] データ分類・取扱方針策定
- [ ] 同意管理システム実装
- [ ] データ最小化原則適用
- [ ] プライバシーポリシー・規約整備

### Phase 2 (高度なプライバシー機能)
- [ ] データ仮名化・匿名化システム実装
- [ ] データポータビリティ機能実装
- [ ] 削除権・忘れられる権利対応実装
- [ ] プライバシー影響評価実施

### Phase 3 (プライバシーバイデザイン)
- [ ] プライバシー設定ダッシュボード実装
- [ ] 透明性レポート自動生成実装
- [ ] プライバシー監査システム実装
- [ ] 継続的コンプライアンス監視実装

## 法規制遵守指標

### 重要指標 (KPI)
- **同意取得率**: 95%以上
- **データ削除要求対応時間**: 30日以内
- **プライバシー違反件数**: 0件
- **データ処理透明性スコア**: 90%以上
- **ユーザープライバシー満足度**: 85%以上

### 継続監視項目
- GDPR準拠レベル
- 個人情報保護法遵守状況
- データ処理目的と実際の利用の整合性
- 第三者データ共有の適切性
- データ保管期間の遵守状況