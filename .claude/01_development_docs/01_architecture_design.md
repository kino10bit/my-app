# Appcadia アーキテクチャ設計（React Native版）

## 開発環境制約への対応

### Windows環境での開発要件
- **開発環境**: Windows + VSCode
- **ターゲット**: iOS（およびAndroid対応も視野）
- **解決策**: React Nativeによるクロスプラットフォーム開発

## システム全体構成

### アプリケーション構成
```
┌─────────────────────────────────────┐
│          Appcadia (React Native)    │
├─────────────────────────────────────┤
│           Presentation Layer        │
│  ┌─────────────┐ ┌─────────────────┐│
│  │React Native │ │    Hooks/       ││
│  │ Components  │ │   Context API   ││
│  └─────────────┘ └─────────────────┘│
├─────────────────────────────────────┤
│            Business Layer           │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Services  │ │   Managers      ││
│  │   (Custom)  │ │ (Audio/Push)    ││
│  └─────────────┘ └─────────────────┘│
├─────────────────────────────────────┤
│             Data Layer              │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   SQLite    │ │  Local Assets   ││
│  │ (Watermelon │ │  (Audio/Image)  ││
│  │    DB)      │ │                 ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
```

### 外部システム連携
- **完全オフライン設計** - ネット接続不要
- **SNSシェア機能** - React Native Share経由
- **プッシュ通知** - @react-native-push-notification
- **音声再生** - react-native-sound

## 技術スタック

### 開発環境・フレームワーク
| 技術 | バージョン | 選定理由 |
|------|------------|----------|
| **React Native** | 0.72+ | Windows環境対応、クロスプラットフォーム |
| **TypeScript** | 5.0+ | 型安全性、開発効率向上 |
| **Node.js** | 18+ | 開発環境、パッケージ管理 |
| **VSCode** | - | Windows環境での開発エディタ |
| **Metro** | - | React Nativeバンドラー |

### 状態管理・UI
| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **React Hooks** | 状態管理 | 軽量、React標準 |
| **Context API** | グローバル状態 | 追加ライブラリ不要 |
| **React Navigation** | 画面遷移 | React Native標準 |
| **NativeBase** | UIコンポーネント | iOS風デザイン対応 |

### データ管理
| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **WatermelonDB** | メインDB | オフライン、高性能、リアクティブ |
| **AsyncStorage** | 設定保存 | 軽量設定データ保存 |
| **React Native Keychain** | 機密データ | セキュアストレージ |
| **MMKV** | 高速KVS | 高性能なローカルストレージ |

### ネイティブ機能・メディア
| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **react-native-sound** | 音声再生 | トレーナーボイス再生 |
| **@react-native-push** | プッシュ通知 | 励まし・リマインダー |
| **react-native-share** | SNSシェア | 成果共有機能 |
| **react-native-haptic** | 触覚フィードバック | UX向上 |

## アーキテクチャパターン

### React Native + Clean Architecture

```
┌─────────────────────────────────────┐
│            React Component           │
│  - TSX/JSX Views                    │
│  - Native Components                │
│  - User Interactions                │
└─────────────┬───────────────────────┘
              │ Hooks/Props
┌─────────────▼───────────────────────┐
│          Custom Hooks               │
│  - useState/useEffect               │
│  - Context API                      │
│  - State Management                 │
└─────────────┬───────────────────────┘
              │ Service calls
┌─────────────▼───────────────────────┐
│            Services                 │
│  - Business Logic                   │
│  - Data Processing                  │
│  - Validation                       │
└─────────────┬───────────────────────┘
              │ Repository Interface
┌─────────────▼───────────────────────┐
│           Repository                │
│  - Data Access Layer                │
│  - WatermelonDB Operations          │
│  - Cache Management                 │
└─────────────────────────────────────┘
```

### 主要コンポーネント設計

#### 1. **Goal Management Module**
```typescript
// ドメイン層 - Repository Interface
interface GoalRepository {
  saveGoal(goal: Goal): Promise<void>;
  fetchGoals(): Promise<Goal[]>;
  updateGoal(goal: Goal): Promise<void>;
  deleteGoal(goalId: string): Promise<void>;
}

// アプリケーション層 - Service
class GoalService {
  constructor(private repository: GoalRepository) {}
  
  async createDailyActionGoal(title: string, category: string): Promise<Goal> {
    // ビジネスロジック
  }
  
  async markGoalAsCompleted(goalId: string): Promise<void> {
    // 達成処理
  }
  
  async getGoalProgress(goalId: string): Promise<Progress> {
    // 進捗取得
  }
}

// プレゼンテーション層 - Custom Hook
function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const goalService = new GoalService(new WatermelonGoalRepository());
      const fetchedGoals = await goalService.getActiveGoals();
      setGoals(fetchedGoals);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { goals, isLoading, loadGoals };
}
```

#### 2. **Stamp System Module**
```typescript
// スタンプ管理サービス
class StampService {
  constructor(private repository: StampRepository) {}
  
  async addStamp(goalId: string, date: Date): Promise<void> {
    // スタンプ追加ロジック
  }
  
  async getStampCount(goalId: string): Promise<number> {
    return this.repository.getStampCount(goalId);
  }
  
  async getStampHistory(goalId: string): Promise<Stamp[]> {
    return this.repository.getStampHistory(goalId);
  }
  
  checkRewardEligibility(stampCount: number): RewardType | null {
    // 報酬資格チェック
  }
}

// Custom Hook
function useStamps(goalId: string) {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [stampCount, setStampCount] = useState(0);
  
  const addStamp = useCallback(async () => {
    const stampService = new StampService(new WatermelonStampRepository());
    await stampService.addStamp(goalId, new Date());
    // 状態更新
  }, [goalId]);
  
  return { stamps, stampCount, addStamp };
}
```

#### 3. **Trainer System Module**
```typescript
// トレーナー管理サービス
class TrainerService {
  constructor(
    private repository: TrainerRepository,
    private audioService: AudioService
  ) {}
  
  async getSelectedTrainer(): Promise<Trainer> {
    return this.repository.getSelectedTrainer();
  }
  
  async playEncouragementVoice(achievement: Achievement): Promise<void> {
    const trainer = await this.getSelectedTrainer();
    const voiceFile = this.getVoiceFileForAchievement(trainer, achievement);
    await this.audioService.playSound(voiceFile);
  }
  
  async unlockTrainerReward(rewardId: string): Promise<void> {
    await this.repository.unlockReward(rewardId);
  }
}

// Custom Hook
function useTrainer() {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [unlockedRewards, setUnlockedRewards] = useState<Reward[]>([]);
  
  const playVoice = useCallback(async (achievement: Achievement) => {
    const trainerService = new TrainerService(
      new WatermelonTrainerRepository(),
      new AudioService()
    );
    await trainerService.playEncouragementVoice(achievement);
  }, []);
  
  return { selectedTrainer, unlockedRewards, playVoice };
}
```

#### 4. **Audio System Module**
```typescript
import Sound from 'react-native-sound';

// 音声再生サービス
class AudioService {
  private sounds: Map<string, Sound> = new Map();
  
  async playTrainerVoice(audioFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(audioFile, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          reject(error);
          return;
        }
        
        sound.play((success) => {
          if (success) {
            resolve();
          } else {
            reject(new Error('Audio playback failed'));
          }
          sound.release();
        });
      });
    });
  }
  
  async preloadAudioAssets(audioFiles: string[]): Promise<void> {
    const loadPromises = audioFiles.map(file => this.preloadSound(file));
    await Promise.all(loadPromises);
  }
  
  setVolumeLevel(level: number): void {
    // グローバル音量設定
  }
  
  private async preloadSound(file: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          reject(error);
        } else {
          this.sounds.set(file, sound);
          resolve();
        }
      });
    });
  }
}
```

## フォルダ構成

```
appcadia/
├── src/
│   ├── components/           # React Nativeコンポーネント
│   │   ├── common/
│   │   ├── onboarding/
│   │   ├── goal/
│   │   ├── progress/
│   │   ├── trainer/
│   │   └── settings/
│   ├── screens/              # 画面コンポーネント
│   │   ├── OnboardingScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── GoalListScreen.tsx
│   │   └── ...
│   ├── hooks/                # カスタムHooks
│   │   ├── useGoals.ts
│   │   ├── useStamps.ts
│   │   └── useTrainer.ts
│   ├── services/             # ビジネスロジック
│   │   ├── GoalService.ts
│   │   ├── StampService.ts
│   │   ├── TrainerService.ts
│   │   └── AudioService.ts
│   ├── repositories/         # データアクセス層
│   │   ├── GoalRepository.ts
│   │   ├── StampRepository.ts
│   │   └── TrainerRepository.ts
│   ├── database/             # WatermelonDB設定
│   │   ├── models/
│   │   ├── schema.ts
│   │   └── database.ts
│   ├── types/                # TypeScript型定義
│   │   ├── Goal.ts
│   │   ├── Stamp.ts
│   │   └── Trainer.ts
│   ├── navigation/           # React Navigation
│   │   ├── AppNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── contexts/             # Context API
│   │   ├── GoalContext.tsx
│   │   └── TrainerContext.tsx
│   └── utils/                # ユーティリティ
│       ├── dateHelpers.ts
│       └── constants.ts
├── assets/                   # 静的リソース
│   ├── images/
│   ├── audio/
│   └── fonts/
├── android/                  # Androidプロジェクト
├── ios/                      # iOSプロジェクト
├── package.json
├── tsconfig.json
├── metro.config.js
└── babel.config.js
```

## 非機能要件への対応

### パフォーマンス最適化
- **遅延読み込み**: React.lazyでコンポーネント遅延読み込み
- **メモリ管理**: useCallback/useMemoで再レンダリング最適化
- **WatermelonDB最適化**: バッチ操作、インデックス最適化
- **バンドルサイズ**: Metro bundlerでコード分割

### セキュリティ
- **データ暗号化**: React Native Keychainで機密データ保護
- **コード難読化**: Hermesエンジンでバイトコード化
- **ローカルストレージ**: MMKVで高速・セキュアなデータ保存

### 拡張性
- **TypeScript**: コンパイル時型チェックでバグ防止
- **カスタムHooks**: ロジックの再利用性向上
- **Service層分離**: ビジネスロジックの独立性確保
- **Context API**: 状態管理のグローバル化

### Windows開発環境対応
- **React Native CLI**: npx react-nativeでプロジェクト作成
- **Android Studio**: Androidエミュレータでテスト
- **iOSシミュレータ**: Mac環境またはExpo Goでテスト
- **Flipper**: デバッグツールで開発効率向上

## Windows環境での開発セットアップ

### 必要なツール
```bash
# Node.js (18+)
winget install OpenJS.NodeJS

# React Native CLI
npm install -g react-native-cli

# Android Studio
winget install Google.AndroidStudio

# VSCode拡張
# - React Native Tools
# - TypeScript and JavaScript Language Features
# - ES7+ React/Redux/React-Native snippets
```

### プロジェクト初期化
```bash
# プロジェクト作成
npx react-native init Appcadia --template react-native-template-typescript

# 必要なライブラリインストール
npm install @nozbe/watermelondb
npm install react-native-sound
npm install @react-native-async-storage/async-storage
npm install react-native-keychain
npm install react-native-mmkv
npm install @react-navigation/native
npm install @react-navigation/stack
npm install @react-navigation/bottom-tabs
npm install react-native-push-notification
npm install react-native-share
npm install native-base react-native-svg

# Androidビルド
npx react-native run-android
```

### iOSビルドの制約
- **Mac環境が必要**: iOSビルドにXcodeが必須
- **代替手段**:
  - Expo Goアプリでテスト
  - GitHub ActionsでCI/CDビルド
  - クラウドMacサービス利用

このReact Native設計により、Windows環境での開発を可能にし、iOS/Android両対応のクロスプラットフォームアプリを構築できます。