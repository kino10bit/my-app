# UI/UX 仕様設計書

## 概要
Appcadiaアプリケーションのユーザーインターフェース・ユーザーエクスペリエンス設計仕様書。iOSネイティブアプリとしての品質とReact Nativeの効率性を両立させた設計を定義する。

## デザイン原則

### 1. ユーザビリティ原則
- **直感性**: 初回使用でも迷わない操作性
- **一貫性**: 全画面で統一されたデザインパターン
- **フィードバック**: ユーザー操作に対する明確な反応
- **効率性**: 最少タップ数での目標達成

### 2. モチベーション設計
- **視覚的報酬**: スタンプ、アニメーション、色彩による達成感
- **パーソナライゼーション**: トレーナー選択による個別体験
- **進捗可視化**: グラフ、数値、ゲージによる成長実感

## 画面レイアウト仕様

### 1. ダッシュボード画面
```
┌─────────────────────────────┐
│ [設定]           [プロフィール] │
├─────────────────────────────┤
│    今日の目標達成状況 (70%)     │
│  ●●●●●○○○○○              │
│                           │
│ 【今日のタスク】               │
│ □ 朝のランニング 30分          │
│ ☑ 英単語学習 20分              │
│ □ 読書 1時間                  │
│                           │
│ 【トレーナーからのメッセージ】      │
│ [アバター] "今日も頑張ってる      │
│           ね！あと少し！"      │
│                           │
│ [目標追加] [統計表示]           │
└─────────────────────────────┘
```

#### レイアウト詳細
- **ヘッダー高さ**: 60pt
- **進捗バー高さ**: 80pt
- **タスクリスト**: 動的高さ（最大画面の50%）
- **トレーナーメッセージ**: 120pt固定
- **フッターボタン**: 60pt

### 2. 目標作成画面
```
┌─────────────────────────────┐
│ [戻る]      新しい目標       [保存] │
├─────────────────────────────┤
│                           │
│ 目標名                      │
│ [________________________] │
│                           │
│ カテゴリ選択                 │
│ [健康] [学習] [仕事] [趣味]    │
│                           │
│ 毎日の行動                  │
│ [________________________] │
│                           │
│ 難易度                      │
│ ○簡単 ●普通 ○難しい         │
│                           │
│ 期間（任意）                 │
│ [開始日] ～ [終了日]          │
│                           │
│ モチベーション               │
│ [________________________] │
│ [________________________] │
└─────────────────────────────┘
```

### 3. トレーナー選択画面
```
┌─────────────────────────────┐
│ [戻る]    トレーナー選択      [決定] │
├─────────────────────────────┤
│                           │
│  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │[IMG]│  │[IMG]│  │[IMG]│   │
│  │さくら│  │あきら│  │みどり│  │
│  │優しい│  │厳格 │  │元気 │   │
│  └─────┘  └─────┘  └─────┘   │
│     ●      ○      ○      │
│                           │
│  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │[IMG]│  │[IMG]│  │[IMG]│   │
│  │たけし│  │ゆうか│  │ひろき│  │
│  │熱血 │  │穏やか│  │論理的│  │
│  └─────┘  └─────┘  └─────┘   │
│     ○      ○      ○      │
│                           │
│ 【プレビュー】                │
│ "一緒に頑張りましょう！"        │
│ [サンプルボイス再生]           │
└─────────────────────────────┘
```

## コンポーネント仕様

### 1. 基本コンポーネント

#### ボタン
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'text'
  size: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
}

// サイズ仕様
small: { height: 32pt, padding: '8px 16px' }
medium: { height: 44pt, padding: '12px 24px' }
large: { height: 56pt, padding: '16px 32px' }
```

#### インプットフィールド
```typescript
interface InputProps {
  placeholder: string
  value: string
  error?: string
  multiline?: boolean
  maxLength?: number
}

// デザイン仕様
border: 1px solid #E0E0E0
borderRadius: 8pt
padding: 12pt 16pt
fontSize: 16pt
focusBorder: #007AFF
```

### 2. 専用コンポーネント

#### スタンプ表示
```typescript
interface StampGridProps {
  stamps: number
  total: number
  size?: 'small' | 'medium' | 'large'
}

// 表示ルール
- 獲得済み: 塗りつぶし円●
- 未獲得: 白抜き円○  
- 1行に10個まで表示
- 11個目以降は改行
```

#### 進捗バー
```typescript
interface ProgressBarProps {
  progress: number // 0-100
  color?: string
  showLabel?: boolean
  animated?: boolean
}

// アニメーション
- 0.3秒のイージングアニメーション
- 達成時は0.5秒のパルスエフェクト
```

## インタラクション仕様

### 1. タップフィードバック
- **通常タップ**: 0.1秒のスケールダウン（0.95倍）
- **長押し**: 0.2秒後にコンテキストメニュー表示
- **ダブルタップ**: スタンプ追加（目標項目のみ）

### 2. アニメーション
- **画面遷移**: 0.3秒のスライドトランジション
- **要素登場**: 0.2秒のフェードイン + 上からスライド
- **成功エフェクト**: 0.5秒のバウンス + パーティクル

### 3. 状態フィードバック
```typescript
// ローディング状態
loadingSpinner: {
  size: 24pt,
  color: '#007AFF',
  animation: 'spin 1s linear infinite'
}

// エラー状態
errorState: {
  textColor: '#FF3B30',
  backgroundColor: '#FFF5F5',
  border: '1px solid #FEB2B2'
}

// 成功状態  
successState: {
  textColor: '#34D399',
  backgroundColor: '#F0FDF4',
  border: '1px solid #86EFAC'
}
```

## レスポンシブ対応

### 1. 画面サイズ対応
```typescript
// iPhone SE (375pt幅)
compact: {
  fontSize: 14pt,
  padding: 8pt,
  buttonHeight: 40pt
}

// iPhone 13 Pro (390pt幅) 
regular: {
  fontSize: 16pt,
  padding: 12pt,
  buttonHeight: 44pt
}

// iPhone 13 Pro Max (428pt幅)
large: {
  fontSize: 18pt,
  padding: 16pt,
  buttonHeight: 48pt
}
```

### 2. セーフエリア対応
```typescript
// 全画面でセーフエリアを考慮
safeAreaInsets: {
  top: 'env(safe-area-inset-top)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)', 
  right: 'env(safe-area-inset-right)'
}
```

## ダークモード対応

### 1. カラーパレット
```typescript
colors: {
  // ライトモード
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    primary: '#007AFF',
    text: '#1A1A1A',
    textSecondary: '#6B7280'
  },
  // ダークモード
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    primary: '#0A84FF', 
    text: '#FFFFFF',
    textSecondary: '#8E8E93'
  }
}
```

### 2. 動的切り替え
```typescript
// システム設定に追従
useColorScheme(): 'light' | 'dark'

// 手動切り替え機能
toggleColorScheme(): void
```

## ユーザビリティテスト指標

### 1. 操作効率性
- 新規目標作成: 2分以内
- スタンプ追加: 3タップ以内
- トレーナー変更: 5タップ以内

### 2. エラー率
- 誤操作発生率: 5%以下
- フォーム入力エラー: 10%以下
- 目標設定完了率: 85%以上

### 3. ユーザー満足度
- 直感性スコア: 4.0/5.0以上
- デザイン満足度: 4.2/5.0以上
- 継続利用意向: 80%以上

## 実装優先度

### Phase 1 (MVP)
- [x] 基本コンポーネント
- [x] ダッシュボード画面
- [x] 目標作成画面
- [x] トレーナー選択画面

### Phase 2 (機能拡張)
- [ ] アニメーション実装
- [ ] ダークモード対応
- [ ] レスポンシブ最適化

### Phase 3 (品質向上)
- [ ] ユーザビリティテスト実施
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ強化