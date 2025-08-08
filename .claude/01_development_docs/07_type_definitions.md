# Appcadia 型定義

## 基本型定義

### 1. **Core Entities（核心エンティティ）**

#### **Goal（目標）**
```swift
struct Goal: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var category: String
    var targetDescription: String
    var isActive: Bool
    var createdAt: Date
    var targetEndDate: Date?
    var motivation: String
    var difficulty: GoalDifficulty
    
    // 進捗関連
    var totalStamps: Int
    var currentStreak: Int
    var bestStreak: Int
    var lastStampDate: Date?
    
    // 関連データ
    var dailyActions: [DailyAction]
    var stamps: [Stamp]
    
    // 計算プロパティ
    var progressPercentage: Double {
        guard let endDate = targetEndDate else { return 0.0 }
        let totalDays = Calendar.current.dateComponents([.day], from: createdAt, to: endDate).day ?? 1
        return Double(totalStamps) / Double(totalDays) * 100.0
    }
    
    var isCompletedToday: Bool {
        guard let lastStamp = lastStampDate else { return false }
        return Calendar.current.isDateInToday(lastStamp)
    }
}

enum GoalDifficulty: Int, CaseIterable, Codable {
    case veryEasy = 1
    case easy = 2
    case normal = 3
    case hard = 4
    case veryHard = 5
    
    var displayName: String {
        switch self {
        case .veryEasy: return "とても簡単"
        case .easy: return "簡単"
        case .normal: return "普通"
        case .hard: return "難しい"
        case .veryHard: return "とても難しい"
        }
    }
    
    var color: Color {
        switch self {
        case .veryEasy: return .green
        case .easy: return .mint
        case .normal: return .blue
        case .hard: return .orange
        case .veryHard: return .red
        }
    }
}
```

#### **DailyAction（日次行動）**
```swift
struct DailyAction: Identifiable, Codable, Hashable {
    let id: UUID
    let goalId: UUID
    var title: String
    var description: String
    var isRequired: Bool
    var estimatedMinutes: Int
    var reminderTime: ReminderTime?
    var sortOrder: Int
    var createdAt: Date
    
    var isCompletedToday: Bool {
        // 今日完了しているかの判定ロジック
        false // placeholder
    }
}

struct ReminderTime: Codable, Hashable {
    let hour: Int
    let minute: Int
    var isEnabled: Bool
    
    var displayString: String {
        String(format: "%02d:%02d", hour, minute)
    }
    
    var dateComponents: DateComponents {
        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        return components
    }
}
```

#### **Stamp（スタンプ）**
```swift
struct Stamp: Identifiable, Codable, Hashable {
    let id: UUID
    let goalId: UUID
    let date: Date
    let stampedAt: Date
    var note: String?
    let stampType: StampType
    var mood: Mood?
    var difficulty: GoalDifficulty
    
    var dayOfWeek: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "E"
        return formatter.string(from: date)
    }
}

enum StampType: String, CaseIterable, Codable {
    case regular = "regular"
    case bonus = "bonus"
    case streak = "streak"
    case milestone = "milestone"
    
    var displayName: String {
        switch self {
        case .regular: return "通常"
        case .bonus: return "ボーナス"
        case .streak: return "連続"
        case .milestone: return "記念"
        }
    }
    
    var imageName: String {
        switch self {
        case .regular: return "star.fill"
        case .bonus: return "star.circle.fill"
        case .streak: return "flame.fill"
        case .milestone: return "crown.fill"
        }
    }
}

enum Mood: String, CaseIterable, Codable {
    case excellent = "excellent"
    case good = "good"
    case okay = "okay"
    case difficult = "difficult"
    case veryDifficult = "veryDifficult"
    
    var displayName: String {
        switch self {
        case .excellent: return "とても良い"
        case .good: return "良い"
        case .okay: return "普通"
        case .difficult: return "大変"
        case .veryDifficult: return "とても大変"
        }
    }
    
    var emoji: String {
        switch self {
        case .excellent: return "😊"
        case .good: return "🙂"
        case .okay: return "😐"
        case .difficult: return "😣"
        case .veryDifficult: return "😫"
        }
    }
}
```

### 2. **Trainer System Types（トレーナーシステム型）**

#### **Trainer（トレーナー）**
```swift
struct Trainer: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    let type: TrainerType
    var isSelected: Bool
    let avatarImageName: String
    let voicePrefix: String
    var description: String
    let personality: TrainerPersonality
    let createdAt: Date
    
    // 関連データ
    var rewards: [Reward]
    
    var availableVoiceMessages: [VoiceMessage] {
        // このトレーナーが利用可能なボイスメッセージ一覧
        []
    }
}

enum TrainerType: String, CaseIterable, Codable {
    case energetic = "energetic"
    case calm = "calm"
    case strict = "strict"
    case gentle = "gentle"
    case motivational = "motivational"
    
    var displayName: String {
        switch self {
        case .energetic: return "エネルギッシュ"
        case .calm: return "穏やか"
        case .strict: return "厳格"
        case .gentle: return "優しい"
        case .motivational: return "やる気満々"
        }
    }
    
    var description: String {
        switch self {
        case .energetic: return "元気いっぱいであなたを応援します！"
        case .calm: return "落ち着いて着実にサポートします"
        case .strict: return "時には厳しく、でも愛情を持って"
        case .gentle: return "いつも優しく寄り添います"
        case .motivational: return "あなたのやる気を最大限に引き出します"
        }
    }
}

struct TrainerPersonality: Codable, Hashable {
    let catchphrase: String          // 決め台詞
    let encouragementStyle: String   // 励ましスタイル
    let celebrationStyle: String     // 祝福スタイル
    let supportiveWords: [String]    // よく使う応援言葉
}
```

#### **Reward（報酬）**
```swift
struct Reward: Identifiable, Codable, Hashable {
    let id: UUID
    let trainerId: UUID
    let type: RewardType
    var name: String
    var description: String
    let threshold: Int
    var isUnlocked: Bool
    var unlockedAt: Date?
    let contentFileName: String
    let rarity: RewardRarity
    let category: RewardCategory
    
    var isEligibleForUnlock: Bool {
        // 解放条件を満たしているかの判定
        false // placeholder
    }
}

enum RewardType: String, CaseIterable, Codable {
    case voice = "voice"
    case illustration = "illustration"
    case badge = "badge"
    case animation = "animation"
    
    var displayName: String {
        switch self {
        case .voice: return "ボイス"
        case .illustration: return "イラスト"
        case .badge: return "バッジ"
        case .animation: return "アニメーション"
        }
    }
}

enum RewardRarity: String, CaseIterable, Codable {
    case common = "common"
    case rare = "rare"
    case epic = "epic"
    case legendary = "legendary"
    
    var displayName: String {
        switch self {
        case .common: return "コモン"
        case .rare: return "レア"
        case .epic: return "エピック"
        case .legendary: return "レジェンダリー"
        }
    }
    
    var color: Color {
        switch self {
        case .common: return .gray
        case .rare: return .blue
        case .epic: return .purple
        case .legendary: return .orange
        }
    }
}

enum RewardCategory: String, CaseIterable, Codable {
    case encouragement = "encouragement"
    case celebration = "celebration"
    case milestone = "milestone"
    case seasonal = "seasonal"
    
    var displayName: String {
        switch self {
        case .encouragement: return "励まし"
        case .celebration: return "お祝い"
        case .milestone: return "節目"
        case .seasonal: return "季節"
        }
    }
}
```

### 3. **Audio & Voice Types（音声関連型）**

#### **VoiceMessage（ボイスメッセージ）**
```swift
struct VoiceMessage: Identifiable, Codable, Hashable {
    let id: UUID
    let trainerId: UUID
    let fileName: String
    let messageType: VoiceMessageType
    let text: String
    let duration: TimeInterval
    var isUnlocked: Bool
    let unlockThreshold: Int
    
    var fileURL: URL? {
        Bundle.main.url(forResource: fileName, withExtension: "mp3")
    }
}

enum VoiceMessageType: String, CaseIterable, Codable {
    case welcome = "welcome"
    case encouragement = "encouragement"
    case celebration = "celebration"
    case milestone = "milestone"
    case dailyMotivation = "dailyMotivation"
    case goodMorning = "goodMorning"
    case goodNight = "goodNight"
    case streakAchievement = "streakAchievement"
    case comeBack = "comeBack"
    
    var displayName: String {
        switch self {
        case .welcome: return "歓迎"
        case .encouragement: return "励まし"
        case .celebration: return "祝福"
        case .milestone: return "節目"
        case .dailyMotivation: return "日々の励まし"
        case .goodMorning: return "おはよう"
        case .goodNight: return "おやすみ"
        case .streakAchievement: return "連続達成"
        case .comeBack: return "復帰歓迎"
        }
    }
}
```

### 4. **Progress & Analytics Types（進捗・分析型）**

#### **ProgressData（進捗データ）**
```swift
struct ProgressData: Codable, Hashable {
    let goalId: UUID
    let period: ProgressPeriod
    let totalStamps: Int
    let achievementRate: Double
    let streakCount: Int
    let averageMood: Mood?
    let totalDays: Int
    let activeDays: Int
    
    var consistency: Double {
        guard totalDays > 0 else { return 0.0 }
        return Double(activeDays) / Double(totalDays)
    }
}

enum ProgressPeriod: String, CaseIterable, Codable {
    case week = "week"
    case month = "month"
    case quarter = "quarter"
    case year = "year"
    case all = "all"
    
    var displayName: String {
        switch self {
        case .week: return "今週"
        case .month: return "今月"
        case .quarter: return "四半期"
        case .year: return "今年"
        case .all: return "全期間"
        }
    }
    
    var dateRange: DateInterval {
        let calendar = Calendar.current
        let now = Date()
        
        switch self {
        case .week:
            let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now
            return DateInterval(start: startOfWeek, end: now)
        case .month:
            let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
            return DateInterval(start: startOfMonth, end: now)
        case .quarter:
            let quarter = calendar.component(.quarter, from: now)
            let startOfQuarter = calendar.date(from: DateComponents(year: calendar.component(.year, from: now), quarter: quarter)) ?? now
            return DateInterval(start: startOfQuarter, end: now)
        case .year:
            let startOfYear = calendar.dateInterval(of: .year, for: now)?.start ?? now
            return DateInterval(start: startOfYear, end: now)
        case .all:
            return DateInterval(start: Date.distantPast, end: now)
        }
    }
}

struct StreakInfo: Codable, Hashable {
    let current: Int
    let best: Int
    let lastStampDate: Date?
    
    var isActive: Bool {
        guard let lastDate = lastStampDate else { return false }
        return Calendar.current.isDateInToday(lastDate) || Calendar.current.isDateInYesterday(lastDate)
    }
    
    var daysToMilestone: Int {
        let milestones = [7, 14, 21, 30, 60, 90, 180, 365]
        return milestones.first(where: { $0 > current }) ?? (current + 1)
    }
}
```

### 5. **UI State Types（UI状態型）**

#### **ViewState（ビュー状態）**
```swift
enum ViewState<T> {
    case idle
    case loading
    case loaded(T)
    case error(Error)
    
    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }
    
    var data: T? {
        if case .loaded(let data) = self { return data }
        return nil
    }
    
    var error: Error? {
        if case .error(let error) = self { return error }
        return nil
    }
}

struct LoadingState: Hashable {
    var isLoading: Bool = false
    var message: String = ""
    
    mutating func startLoading(message: String = "読み込み中...") {
        isLoading = true
        self.message = message
    }
    
    mutating func stopLoading() {
        isLoading = false
        message = ""
    }
}
```

#### **NavigationState（ナビゲーション状態）**
```swift
struct NavigationState {
    var selectedTab: TabType = .dashboard
    var navigationPath = NavigationPath()
    var presentedSheet: SheetType?
    var presentedFullScreen: FullScreenType?
    var showingAlert: AlertType?
}

enum TabType: String, CaseIterable {
    case dashboard = "dashboard"
    case goals = "goals"
    case progress = "progress"
    case trainer = "trainer"
    case settings = "settings"
    
    var displayName: String {
        switch self {
        case .dashboard: return "ホーム"
        case .goals: return "目標"
        case .progress: return "進捗"
        case .trainer: return "トレーナー"
        case .settings: return "設定"
        }
    }
    
    var systemImageName: String {
        switch self {
        case .dashboard: return "house.fill"
        case .goals: return "target"
        case .progress: return "chart.bar.fill"
        case .trainer: return "person.fill"
        case .settings: return "gear"
        }
    }
}

enum SheetType: Identifiable {
    case goalCreation
    case goalEdit(Goal)
    case stampAction(Goal)
    case rewardUnlock(Reward)
    case trainerSelection
    case settings
    case shareSuccess(Goal)
    
    var id: String {
        switch self {
        case .goalCreation: return "goalCreation"
        case .goalEdit(let goal): return "goalEdit_\(goal.id)"
        case .stampAction(let goal): return "stampAction_\(goal.id)"
        case .rewardUnlock(let reward): return "rewardUnlock_\(reward.id)"
        case .trainerSelection: return "trainerSelection"
        case .settings: return "settings"
        case .shareSuccess(let goal): return "shareSuccess_\(goal.id)"
        }
    }
}
```

### 6. **Error Types（エラー型）**

#### **AppError（アプリケーションエラー）**
```swift
enum AppError: LocalizedError, Identifiable {
    case coreDataError(String)
    case audioPlaybackError(String)
    case validationError(String)
    case networkError(String)
    case unknownError(String)
    
    var id: String {
        switch self {
        case .coreDataError(let message): return "coreData_\(message)"
        case .audioPlaybackError(let message): return "audio_\(message)"
        case .validationError(let message): return "validation_\(message)"
        case .networkError(let message): return "network_\(message)"
        case .unknownError(let message): return "unknown_\(message)"
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .coreDataError(let message):
            return "データ保存エラー: \(message)"
        case .audioPlaybackError(let message):
            return "音声再生エラー: \(message)"
        case .validationError(let message):
            return "入力エラー: \(message)"
        case .networkError(let message):
            return "ネットワークエラー: \(message)"
        case .unknownError(let message):
            return "予期しないエラー: \(message)"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .coreDataError:
            return "アプリを再起動してお試しください"
        case .audioPlaybackError:
            return "音量設定を確認してください"
        case .validationError:
            return "入力内容を確認してください"
        case .networkError:
            return "インターネット接続を確認してください"
        case .unknownError:
            return "問題が続く場合はサポートにご連絡ください"
        }
    }
}
```

### 7. **Settings Types（設定型）**

#### **AppSettings（アプリ設定）**
```swift
struct AppSettings: Codable {
    var selectedTrainerId: UUID?
    var isFirstLaunch: Bool = true
    var voiceVolume: Float = 0.8
    var notificationEnabled: Bool = true
    var preferredNotificationTime: Date = Calendar.current.date(from: DateComponents(hour: 9, minute: 0)) ?? Date()
    var themeMode: ThemeMode = .auto
    var language: Language = .japanese
    var hapticFeedbackEnabled: Bool = true
    var animationsEnabled: Bool = true
    
    enum ThemeMode: String, CaseIterable, Codable {
        case light = "light"
        case dark = "dark"
        case auto = "auto"
        
        var displayName: String {
            switch self {
            case .light: return "ライト"
            case .dark: return "ダーク"
            case .auto: return "自動"
            }
        }
    }
    
    enum Language: String, CaseIterable, Codable {
        case japanese = "ja"
        case english = "en"
        
        var displayName: String {
            switch self {
            case .japanese: return "日本語"
            case .english: return "English"
            }
        }
    }
}
```

## 型安全性の確保

### 1. **Protocol Extensions**
```swift
protocol Identifiable {
    var id: UUID { get }
}

protocol Timestampable {
    var createdAt: Date { get }
    var updatedAt: Date { get set }
}

extension Goal: Timestampable {
    var updatedAt: Date {
        get { lastStampDate ?? createdAt }
        set { /* Core Dataで自動更新 */ }
    }
}
```

### 2. **Result Types**
```swift
typealias GoalResult = Result<Goal, AppError>
typealias GoalsResult = Result<[Goal], AppError>
typealias VoidResult = Result<Void, AppError>

extension Result {
    var isSuccess: Bool {
        if case .success = self { return true }
        return false
    }
    
    var isFailure: Bool {
        return !isSuccess
    }
}
```

### 3. **Type Aliases**
```swift
typealias GoalID = UUID
typealias TrainerID = UUID
typealias StampID = UUID
typealias RewardID = UUID

typealias CompletionHandler<T> = (Result<T, AppError>) -> Void
typealias AsyncHandler<T> = () async throws -> T
```

この型定義により、コンパイル時の型安全性を確保し、ランタイムエラーを最小限に抑える堅牢なアプリケーションを構築できます。