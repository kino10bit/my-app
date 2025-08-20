# 📚 Appcadia - ドキュメントメニュー

習慣形成アプリ「Appcadia」の包括的なプロジェクトドキュメント一覧です。

## 🚀 クイックスタート

- [**README.md**](./README.md) - アプリの基本セットアップ・起動方法
- [**プロジェクト概要**](.claude/00_project/01_appcadia_concept_requirements.md) - アプリのコンセプトと要件定義

---

## 📋 プロジェクト概要

| ドキュメント | 説明 |
|-------------|------|
| [コンセプト・要件定義](.claude/00_project/01_appcadia_concept_requirements.md) | アプリの基本コンセプト、ターゲットユーザー、機能要件 |
| [Inception Deck](.claude/00_project/02_inception_deck.md) | プロジェクトの目的、スコープ、関係者の合意事項 |

---

## 🏗 技術設計・アーキテクチャ

### コアアーキテクチャ
| ドキュメント | 説明 |
|-------------|------|
| [アーキテクチャ設計](.claude/01_development_docs/01_architecture_design.md) | システム全体のアーキテクチャ、技術スタック |
| [データベース設計](.claude/01_development_docs/02_database_design.md) | WatermelonDB スキーマ、データモデル設計 |
| [API設計](.claude/01_development_docs/03_api_design.md) | REST API仕様、エンドポイント設計 |
| [型定義](.claude/01_development_docs/07_type_definitions.md) | TypeScript型定義、インターフェース仕様 |

### UI/UX設計
| ドキュメント | 説明 |
|-------------|------|
| [画面遷移設計](.claude/01_development_docs/04_screen_transition_design.md) | アプリの画面フロー、ナビゲーション設計 |
| [フロントエンド設計](.claude/01_development_docs/10_frontend_design.md) | React Native コンポーネント設計 |
| [UI/UX仕様](.claude/01_development_docs/16_ui_ux_specification.md) | ユーザーインターフェース詳細仕様 |
| [アクセシビリティ設計](.claude/01_development_docs/17_accessibility_design.md) | アクセシビリティ対応、ユニバーサルデザイン |

---

## 📱 画面仕様書

| ドキュメント | 説明 |
|-------------|------|
| [ダッシュボード画面](.claude/04_screen_specs/01_dashboard_screen.md) | メイン画面の詳細仕様、レイアウト、コンポーネント設計 |

---

## 🎨 デザインシステム

| ドキュメント | 説明 |
|-------------|------|
| [基本デザイン](.claude/02_design_system/00_basic_design.md) | カラーパレット、タイポグラフィ、基本スタイル |
| [デザイン原則](.claude/02_design_system/01_design_principles.md) | デザインコンセプト、ブランドガイドライン |
| [コンポーネント設計](.claude/02_design_system/02_component_design.md) | 再利用可能UIコンポーネント仕様 |
| [アニメーションシステム](.claude/02_design_system/03_animation_system.md) | アニメーション設計、トランジション |
| [レイアウトシステム](.claude/02_design_system/04_layout_system.md) | グリッドシステム、レスポンシブ設計 |

---

## 🔧 開発・テスト

### 開発環境
| ドキュメント | 説明 |
|-------------|------|
| [開発セットアップ](.claude/01_development_docs/08_development_setup.md) | 開発環境構築、必要ツール、設定手順 |
| [テスト戦略](.claude/01_development_docs/09_test_strategy.md) | ユニットテスト、統合テスト戦略 |
| [E2Eテスト設計](.claude/01_development_docs/12_e2e_test_design.md) | エンドツーエンドテスト設計・実装 |

### CI/CD・デプロイ
| ドキュメント | 説明 |
|-------------|------|
| [CI/CD設計](.claude/01_development_docs/11_cicd_design.md) | GitHub Actions、自動化パイプライン |
| [デプロイメント戦略](.claude/01_development_docs/20_deployment_strategy.md) | App Store、Google Play配布戦略 |

---

## 🛡 セキュリティ・コンプライアンス

| ドキュメント | 説明 |
|-------------|------|
| [セキュリティ設計](.claude/01_development_docs/13_security_design.md) | セキュリティ要件、脅威対策 |
| [エラーハンドリング設計](.claude/01_development_docs/06_error_handling_design.md) | エラー処理、例外ハンドリング戦略 |
| [プライバシーポリシー設計](.claude/01_development_docs/29_privacy_policy_design.md) | データプライバシー、GDPR対応 |
| [コンプライアンス・セキュリティ](.claude/01_development_docs/30_compliance_security_design.md) | 法的要件、規制対応 |

---

## ⚡ パフォーマンス・最適化

| ドキュメント | 説明 |
|-------------|------|
| [パフォーマンス最適化](.claude/01_development_docs/14_performance_optimization.md) | アプリパフォーマンス改善戦略 |
| [パフォーマンス監視](.claude/01_development_docs/15_performance_monitoring.md) | 監視システム、メトリクス設計 |
| [パフォーマンス最適化設計](.claude/01_development_docs/27_performance_optimization_design.md) | 詳細な最適化手法 |

---

## 📱 プラットフォーム対応

| ドキュメント | 説明 |
|-------------|------|
| [iOS プラットフォーム統合](.claude/01_development_docs/23_ios_platform_integration.md) | iOS固有機能、ネイティブ統合 |
| [Android 適応計画](.claude/01_development_docs/24_android_adaptation_plan.md) | Android固有対応、最適化 |
| [多言語化戦略](.claude/01_development_docs/26_localization_strategy.md) | 国際化対応、ローカライゼーション |

---

## 💾 データ・運用管理

### データ管理
| ドキュメント | 説明 |
|-------------|------|
| [データ移行戦略](.claude/01_development_docs/18_data_migration_strategy.md) | データベースマイグレーション計画 |
| [データ同期設計](.claude/01_development_docs/28_data_synchronization_design.md) | クラウド同期、オフライン対応 |
| [バックアップ・リストア設計](.claude/01_development_docs/19_backup_restore_design.md) | データバックアップ戦略 |

### 運用・保守
| ドキュメント | 説明 |
|-------------|------|
| [監視・ログ設計](.claude/01_development_docs/21_monitoring_logging_design.md) | 運用監視、ログ管理システム |
| [保守計画](.claude/01_development_docs/22_maintenance_plan.md) | 長期保守、アップデート戦略 |
| [アセット管理設計](.claude/01_development_docs/25_asset_management_design.md) | 画像、音声などのアセット管理 |

---

## 🔗 SEO・マーケティング

| ドキュメント | 説明 |
|-------------|------|
| [SEO要件](.claude/01_development_docs/05_seo_requirements.md) | 検索エンジン最適化、メタデータ設計 |

---

## 📚 ライブラリ・技術文書

| ドキュメント | 説明 |
|-------------|------|
| [shadcn/ui ドキュメント](.claude/03_library_docs/01_shadcn_doc.md) | UIコンポーネントライブラリ使用法 |
| [Supabase 認証 + Vitest](.claude/03_library_docs/02_supabase_auth_vitest.md) | 認証システム実装・テスト |
| [Supabase ストレージ + Vitest](.claude/03_library_docs/03_supabase_storage_vitest.md) | ファイルストレージ実装・テスト |
| [Next.js App Router パターン](.claude/03_library_docs/04_nextjs_app_router_patterns.md) | Next.js ルーティングパターン |

---

## 🎯 リソース・アセット

| リソース | 説明 |
|---------|------|
| [トレーナー画像仕様](./assets/images/trainers/README.md) | キャラクター画像の仕様・要件 |

---

## 🔄 最終更新

このドキュメントは随時更新されます。新しい機能や変更があった場合は、該当するセクションを確認してください。

**プロジェクトの開発状況や疑問点がある場合は、まず関連するドキュメントを参照してから質問してください。**

---

*📝 Created: 2025-08-14 | 🔄 Last Updated: 2025-08-20*