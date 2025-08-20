# アクセシビリティ設計書

## 概要
Appcadiaアプリケーションにおけるアクセシビリティ対応設計。iOS Human Interface Guidelinesに準拠し、すべてのユーザーが快適に利用できるアプリを目指す。

## アクセシビリティ原則

### 1. 知覚可能（Perceivable）
- **視覚情報の代替**: 音声読み上げ、点字ディスプレイ対応
- **音声情報の代替**: 視覚的フィードバック、バイブレーション
- **色彩情報の補完**: 形状、テキストによる情報伝達

### 2. 操作可能（Operable）
- **多様な入力方法**: タッチ、音声、スイッチコントロール
- **時間制限の配慮**: 自動実行の無効化、延長機能
- **発作の防止**: 点滅、急激な変化の制限

### 3. 理解可能（Understandable）
- **シンプルな言語**: 専門用語の回避、平易な表現
- **一貫した操作**: 予測可能なナビゲーション
- **エラー防止**: 入力支援、確認ダイアログ

### 4. 堅牢（Robust）
- **支援技術対応**: VoiceOver、スイッチコントロール
- **プラットフォーム標準**: iOS標準UIコンポーネント活用

## VoiceOver対応

### 1. アクセシビリティラベル設計

#### ダッシュボード画面
```typescript
// 進捗表示
progressLabel: "今日の目標達成率 70パーセント。10個中7個完了。"

// タスクリスト
taskItem: {
  completed: "英単語学習 20分。完了済み。",
  incomplete: "朝のランニング 30分。未完了。実行するにはダブルタップ。"
}

// トレーナーメッセージ
trainerMessage: "トレーナーのさくらからのメッセージ。今日も頑張ってるね！あと少し！"
```

#### 目標作成画面
```typescript
// 入力フィールド
goalNameField: {
  label: "目標名",
  hint: "例：毎日の英語学習",
  value: "現在の入力値"
}

// 難易度選択
difficultySelect: {
  easy: "難易度：簡単。選択するにはダブルタップ。",
  normal: "難易度：普通。選択済み。",
  hard: "難易度：難しい。選択するにはダブルタップ。"
}
```

### 2. ナビゲーション順序
```typescript
// 論理的な読み上げ順序を定義
accessibilityOrder: [
  'header_title',
  'navigation_back',
  'main_content',
  'primary_actions',
  'secondary_actions',
  'tab_navigation'
]

// グループ化による効率的ナビゲーション
accessibilityGroup: {
  header: ['title', 'back_button', 'menu_button'],
  content: ['progress_bar', 'task_list', 'trainer_message'],
  footer: ['add_goal', 'statistics', 'settings']
}
```

### 3. アクション設計
```typescript
// カスタムアクション定義
customActions: {
  completeTask: {
    name: "タスク完了",
    hint: "タスクを完了としてマークします"
  },
  playVoice: {
    name: "ボイス再生", 
    hint: "トレーナーの励ましボイスを再生します"
  },
  editGoal: {
    name: "目標編集",
    hint: "目標の内容を変更します"
  }
}
```

## 動的文字サイズ対応

### 1. Dynamic Type実装
```typescript
// iOS Dynamic Type対応
textStyles: {
  // 標準サイズ
  body: {
    fontSize: scale(16),
    lineHeight: scale(24)
  },
  // 大きな文字
  largeTitle: {
    fontSize: scale(34),
    lineHeight: scale(42)
  }
}

// スケール関数
function scale(size: number): number {
  const fontScale = PixelRatio.getFontScale();
  return size * fontScale;
}
```

### 2. レイアウト適応
```typescript
// 文字サイズに応じたレイアウト調整
adaptiveLayout: {
  // 通常サイズ
  normal: {
    buttonHeight: 44,
    spacing: 16,
    iconSize: 24
  },
  // 大文字サイズ
  large: {
    buttonHeight: 56,
    spacing: 20,
    iconSize: 32
  },
  // 最大サイズ
  extraLarge: {
    buttonHeight: 68,
    spacing: 24,
    iconSize: 40
  }
}
```

## 色彩・コントラスト設計

### 1. コントラスト比遵守
```typescript
// WCAG AA準拠のコントラスト比
contrastRatios: {
  // 通常テキスト: 4.5:1以上
  normalText: {
    light: { text: '#1A1A1A', background: '#FFFFFF' }, // 16.75:1
    dark: { text: '#FFFFFF', background: '#000000' }   // 21:1
  },
  // 大きなテキスト: 3:1以上  
  largeText: {
    light: { text: '#4A5568', background: '#FFFFFF' }, // 7.22:1
    dark: { text: '#E2E8F0', background: '#1A202C' }   // 11.58:1
  }
}
```

### 2. 色以外の情報伝達
```typescript
// 状態表現の多重化
statusIndicators: {
  completed: {
    color: '#10B981',      // 緑色
    symbol: '✓',           // チェックマーク
    text: '完了',          // テキスト表示
    pattern: 'solid'       // パターン
  },
  incomplete: {
    color: '#6B7280',      // グレー
    symbol: '○',           // 円マーク
    text: '未完了',        // テキスト表示  
    pattern: 'dashed'      // パターン
  },
  error: {
    color: '#EF4444',      // 赤色
    symbol: '⚠',          // 警告マーク
    text: 'エラー',        // テキスト表示
    pattern: 'striped'     // パターン
  }
}
```

## モーションと時間制御

### 1. Reduce Motion対応
```typescript
// アニメーション設定
animations: {
  // 通常モード
  normal: {
    duration: 300,
    easing: 'ease-in-out',
    enabled: true
  },
  // 視差効果軽減モード
  reduced: {
    duration: 0,
    easing: 'linear', 
    enabled: false
  }
}

// システム設定の検知
const isReduceMotionEnabled = AccessibilityInfo.isReduceMotionEnabled();
```

### 2. 自動実行の制御
```typescript
// 時間制限のあるコンテンツ
timedContent: {
  // デフォルト：自動実行なし
  autoPlay: false,
  
  // ユーザー制御可能
  pauseButton: true,
  replayButton: true,
  
  // 時間延長機能
  extendTime: (additionalSeconds: number) => void
}
```

## 入力支援機能

### 1. スイッチコントロール対応
```typescript
// フォーカス可能要素の設定
focusableElements: {
  // 順序付きナビゲーション
  tabIndex: number,
  
  // グループ化
  accessibilityGroup: boolean,
  
  // スキップ可能
  accessibilityElementsHidden: boolean
}
```

### 2. 音声入力対応
```typescript
// 音声入力の有効化
speechInput: {
  goalName: {
    enabled: true,
    language: 'ja-JP',
    timeout: 10000
  },
  motivation: {
    enabled: true,
    language: 'ja-JP', 
    timeout: 15000
  }
}
```

## エラー処理とフィードバック

### 1. アクセシブルなエラー表示
```typescript
// エラーメッセージ設計
errorMessages: {
  // 明確で具体的な説明
  validation: "目標名は3文字以上で入力してください。現在2文字です。",
  
  // 解決方法の提示
  network: "インターネット接続を確認してください。設定アプリから Wi-Fi を確認できます。",
  
  // VoiceOver対応
  announcement: true,
  politeness: 'assertive'
}
```

### 2. 成功フィードバック
```typescript
// 成功通知設計
successFeedback: {
  // 複数の感覚への訴求
  visual: '✓ 目標を作成しました',
  audio: 'チャイム音再生',
  haptic: 'ソフトな振動',
  
  // VoiceOverアナウンス
  voiceOver: "新しい目標「毎日の英語学習」を作成しました。"
}
```

## テスト指標

### 1. VoiceOver ナビゲーション
- [ ] 全画面要素の読み上げ可能
- [ ] 論理的な読み上げ順序
- [ ] カスタムアクションの実行可能
- [ ] 適切な要素グループ化

### 2. Dynamic Type
- [ ] 最小〜最大サイズでの表示確認
- [ ] レイアウト崩れなし
- [ ] 全テキストの可読性維持

### 3. コントラスト
- [ ] WCAG AA基準クリア
- [ ] 色盲シミュレーション確認
- [ ] ダークモード対応

### 4. モーション設定
- [ ] Reduce Motion設定の反映
- [ ] 代替的な状態表現
- [ ] ユーザー制御可能な自動実行

## 実装チェックリスト

### Phase 1 (基本対応)
- [ ] VoiceOverラベル設定
- [ ] Dynamic Type対応
- [ ] 基本コントラスト調整
- [ ] キーボードナビゲーション

### Phase 2 (詳細対応)  
- [ ] カスタムアクション実装
- [ ] スイッチコントロール対応
- [ ] 音声入力機能
- [ ] Reduce Motion対応

### Phase 3 (検証・改善)
- [ ] 実際のユーザーテスト実施
- [ ] 支援技術での動作確認
- [ ] 継続的な改善プロセス構築

## 参考資料

### 1. ガイドライン
- iOS Human Interface Guidelines - Accessibility
- Web Content Accessibility Guidelines (WCAG) 2.1
- React Native Accessibility Documentation

### 2. テストツール
- iOS Simulator の Accessibility Inspector
- VoiceOver (iOS標準)
- Colour Contrast Analyser