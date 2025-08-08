# デプロイメント戦略設計書

## 概要
AppcadiaアプリケーションのApp Store配布戦略、TestFlight運用、継続的デプロイメント（CD）の設計。安全で効率的なリリースプロセスを通じて、ユーザーに高品質なアプリを継続的に提供する。

## デプロイメント戦略

### 1. リリース戦略
- **段階的リリース**: TestFlight → App Store段階的配布 → 全ユーザー配布
- **フィーチャーフラグ**: 新機能の段階的有効化
- **ロールバック計画**: 問題発生時の迅速な対応
- **品質ゲート**: 各段階での品質チェック

### 2. 環境構成
```typescript
// 環境定義
export const ENVIRONMENTS = {
  development: {
    name: 'Development',
    bundleId: 'com.appcadia.app.dev',
    apiEndpoint: 'http://localhost:3000',
    crashlytics: false,
    debugMode: true
  },
  staging: {
    name: 'Staging', 
    bundleId: 'com.appcadia.app.staging',
    apiEndpoint: 'https://staging-api.appcadia.com',
    crashlytics: true,
    debugMode: true
  },
  production: {
    name: 'Production',
    bundleId: 'com.appcadia.app',
    apiEndpoint: 'https://api.appcadia.com',
    crashlytics: true,
    debugMode: false
  }
} as const;
```

## App Store配布戦略

### 1. App Store Connect設定
```yaml
# app.json (Expo設定)
{
  "expo": {
    "name": "Appcadia",
    "slug": "appcadia",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.appcadia.app",
      "buildNumber": "1",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSUserTrackingUsageDescription": "アプリの改善と個人に最適化された体験の提供のため"
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "13.0"
          }
        }
      ]
    ]
  }
}
```

### 2. App Store審査対応
```typescript
// App Store審査チェックリスト
export const APP_STORE_CHECKLIST = {
  metadata: {
    appName: 'Appcadia - 目標達成アプリ',
    subtitle: 'パーソナルトレーナーと一緒に習慣化',
    keywords: '目標,習慣,トレーナー,モチベーション,継続',
    description: `毎日の小さな行動を継続して大きな目標を達成。
パーソナルトレーナーがあなたの頑張りを応援し、
スタンプシステムで成長を実感できます。`,
    privacyPolicy: 'https://appcadia.com/privacy',
    supportUrl: 'https://appcadia.com/support'
  },
  
  compliance: {
    dataCollection: false,        // ユーザーデータ収集なし
    thirdPartySDK: ['expo-av'],  // 使用する第三者SDK
    encryption: false,           // 暗号化機能なし（標準以外）
    contentRating: '4+',         // 年齢制限
    inAppPurchase: false         // アプリ内購入なし
  },
  
  screenshots: {
    iPhone65: [
      'screenshot_dashboard_6.5.png',
      'screenshot_goals_6.5.png', 
      'screenshot_trainer_6.5.png',
      'screenshot_stats_6.5.png'
    ],
    iPhone55: [
      'screenshot_dashboard_5.5.png',
      'screenshot_goals_5.5.png',
      'screenshot_trainer_5.5.png', 
      'screenshot_stats_5.5.png'
    ]
  }
};
```

## TestFlight運用

### 1. テスト配布戦略
```typescript
// TestFlight配布管理
export class TestFlightManager {
  private readonly MAX_TESTERS = 100;
  private readonly GROUPS = {
    internal: 'Internal Team',      // 開発チーム (25名)
    beta: 'Beta Testers',          // ベータテスター (75名)
    stakeholders: 'Stakeholders'    // ステークホルダー (10名)
  };
  
  async createTestRelease(version: string, buildNumber: string): Promise<void> {
    // 1. EAS Buildでビルド作成
    await this.triggerEASBuild(version, buildNumber);
    
    // 2. TestFlightアップロード（自動）
    // GitHub Actionsで実行
    
    // 3. テスターグループへの配布
    await this.distributeToGroups([
      this.GROUPS.internal,
      this.GROUPS.beta
    ]);
    
    // 4. リリースノート設定
    await this.setReleaseNotes(version, this.generateReleaseNotes());
  }
  
  private generateReleaseNotes(): string {
    return `
📋 このバージョンの新機能・改善点:
• 新しいトレーナーキャラクター追加
• スタンプシステムの改善
• パフォーマンス向上とバグ修正

🧪 テスト重点項目:
• 目標作成・編集機能
• トレーナー音声再生
• データバックアップ機能
• 各画面のUI/UX

❓ フィードバック方法:
アプリ内の「フィードバック送信」または
TestFlightアプリのフィードバック機能をご利用ください。

いつもテストにご協力いただき、ありがとうございます！
    `.trim();
  }
}
```

### 2. テスターフィードバック収集
```typescript
// フィードバック収集システム
export class FeedbackCollector {
  async submitFeedback(feedback: TestFeedback): Promise<void> {
    const feedbackData = {
      version: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      deviceInfo: await DeviceInfo.getDeviceName(),
      osVersion: DeviceInfo.getSystemVersion(),
      timestamp: new Date().toISOString(),
      feedback: feedback.message,
      rating: feedback.rating,
      category: feedback.category, // bug, suggestion, praise
      screenshots: feedback.screenshots || []
    };
    
    // GitHub Issues APIに送信
    await this.createGitHubIssue(feedbackData);
  }
  
  private async createGitHubIssue(feedback: any): Promise<void> {
    const issueBody = `
## フィードバック詳細
**カテゴリ**: ${feedback.category}
**評価**: ${'⭐'.repeat(feedback.rating)}/5
**バージョン**: ${feedback.version} (${feedback.buildNumber})
**端末情報**: ${feedback.deviceInfo} (iOS ${feedback.osVersion})

## 内容
${feedback.feedback}

## 環境情報
- 報告日時: ${feedback.timestamp}
- テスター種別: TestFlight
    `;
    
    // GitHub API呼び出し（実装時に認証情報設定）
    // await octokit.rest.issues.create({...});
  }
}
```

## 継続的デプロイメント

### 1. GitHub Actions ワークフロー
```yaml
# .github/workflows/cd-pipeline.yml
name: CD Pipeline

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for iOS
        run: |
          if [[ "${{ github.event.inputs.environment }}" == "production" ]]; then
            eas build --platform ios --profile production --non-interactive --no-wait
          else
            eas build --platform ios --profile staging --non-interactive --no-wait
          fi
      
      - name: Submit to TestFlight
        if: github.event.inputs.environment != 'production'
        run: eas submit --platform ios --latest --non-interactive

  create-release-notes:
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate Release Notes
        run: |
          echo "# Release Notes for ${{ github.ref_name }}" > release-notes.md
          echo "" >> release-notes.md
          git log --pretty=format:"- %s (%an)" $(git describe --tags --abbrev=0 HEAD^)..HEAD >> release-notes.md
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref_name }}
          release_name: Appcadia ${{ github.ref_name }}
          body_path: release-notes.md
          draft: false
          prerelease: false
```

### 2. EAS Build プロファイル
```json
// eas.json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "staging": {
      "distribution": "internal",
      "channel": "staging",
      "ios": {
        "buildConfiguration": "Release",
        "resourceClass": "m-medium"
      },
      "env": {
        "APP_ENV": "staging"
      }
    },
    "production": {
      "channel": "production", 
      "ios": {
        "buildConfiguration": "Release",
        "resourceClass": "m-medium"
      },
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEFGHIJ"
      }
    }
  }
}
```

## リリース管理

### 1. バージョン管理戦略
```typescript
// バージョン管理ルール
export const VERSION_STRATEGY = {
  // セマンティックバージョニング
  major: 'Breaking changes or major new features',
  minor: 'New features, backwards compatible',
  patch: 'Bug fixes and minor improvements',
  
  // iOS Build Number
  buildNumber: 'Auto-increment for each build',
  
  // リリースサイクル
  schedule: {
    major: 'Yearly (v2.0.0, v3.0.0)',
    minor: 'Monthly (v1.1.0, v1.2.0)', 
    patch: 'As needed (v1.1.1, v1.1.2)'
  }
};

// バージョン自動更新
export class VersionManager {
  static async bumpVersion(type: 'major' | 'minor' | 'patch'): Promise<string> {
    const currentVersion = await this.getCurrentVersion();
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    let newVersion: string;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
    
    await this.updatePackageJson(newVersion);
    await this.updateAppConfig(newVersion);
    
    return newVersion;
  }
}
```

### 2. ロールバック戦略
```typescript
// ロールバック管理
export class RollbackManager {
  // 緊急時のアプリ無効化
  async emergencyDisable(reason: string): Promise<void> {
    // Remote Configでアプリ無効化フラグを設定
    await this.setRemoteConfig('app_disabled', true);
    await this.setRemoteConfig('disable_reason', reason);
    
    // プッシュ通知でユーザーに通知
    await this.sendEmergencyNotification(
      'メンテナンスのお知らせ',
      'アプリの一時的なメンテナンスを実施しています。ご迷惑をおかけして申し訳ございません。'
    );
  }
  
  // 段階的ロールバック
  async rollbackToVersion(targetVersion: string, percentage: number = 100): Promise<void> {
    // 指定バージョンへの強制アップデート促進
    await this.setRemoteConfig('force_update_version', targetVersion);
    await this.setRemoteConfig('force_update_percentage', percentage);
    
    // アップデートが必要なユーザーに通知
    await this.notifyUpdateRequired(targetVersion);
  }
}
```

## モニタリングと品質管理

### 1. デプロイメント品質ゲート
```typescript
// 品質ゲート定義
export const QUALITY_GATES = {
  preRelease: {
    testCoverage: 80,           // テストカバレッジ80%以上
    lintErrors: 0,              // Lint エラー 0件
    typeErrors: 0,              // TypeScript エラー 0件
    bundleSize: 50 * 1024 * 1024, // バンドルサイズ50MB以下
  },
  
  postRelease: {
    crashFreeRate: 99.5,        // クラッシュフリー率99.5%以上
    appStoreRating: 4.0,        // App Storeレーティング4.0以上
    loadTime: 3000,             // 起動時間3秒以下
    memoryUsage: 100 * 1024 * 1024, // メモリ使用量100MB以下
  }
};

// 品質チェック実行
export class QualityGateChecker {
  async checkPreReleaseGates(): Promise<QualityCheckResult> {
    const results = await Promise.all([
      this.checkTestCoverage(),
      this.checkLintErrors(),
      this.checkTypeErrors(),
      this.checkBundleSize()
    ]);
    
    const allPassed = results.every(result => result.passed);
    
    return {
      passed: allPassed,
      results,
      canDeploy: allPassed
    };
  }
}
```

## 実装チェックリスト

### Phase 1 (基本デプロイメント)
- [ ] GitHub Actions基本ワークフロー
- [ ] EAS Build設定
- [ ] TestFlight自動アップロード
- [ ] App Store Connect基本設定

### Phase 2 (運用改善)
- [ ] 段階的リリース機能
- [ ] フィードバック収集システム
- [ ] 品質ゲート実装
- [ ] ロールバック機能

### Phase 3 (高度な運用)
- [ ] A/Bテスト基盤
- [ ] リアルタイム監視
- [ ] 自動化された品質チェック
- [ ] パフォーマンス分析

## 運用手順書

### 1. 通常リリース手順
1. **開発完了**: 機能実装とテスト完了
2. **品質チェック**: 自動テストと手動テスト実行
3. **バージョンアップ**: セマンティックバージョニングに従い更新
4. **TestFlight配布**: ベータテスターへ配布
5. **フィードバック収集**: 1週間のテスト期間
6. **App Store申請**: レビュー用バイナリ提出
7. **段階的リリース**: 10% → 50% → 100% 配布

### 2. 緊急リリース手順
1. **問題確認**: 重大バグまたはセキュリティ問題の確認
2. **ホットフィックス作成**: 最小限の修正で対応
3. **緊急テスト**: 必要最小限のテスト実行
4. **ExpediteReview申請**: App Store緊急審査申請
5. **緊急リリース**: 承認後即座にリリース
6. **事後分析**: 問題の根本原因分析と改善計画