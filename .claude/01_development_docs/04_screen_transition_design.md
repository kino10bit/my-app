# Appcadia 画面遷移設計

## 画面一覧

### 1. **オンボーディング系**
- **SplashScreen** - アプリ起動画面
- **OnboardingWelcome** - ようこそ画面
- **OnboardingFeatures** - 機能紹介画面（3-4画面）
- **TrainerSelection** - トレーナー選択画面
- **InitialGoalSetup** - 初回目標設定画面

### 2. **メイン機能系**
- **HomeTabView** - タブベースのメイン画面
  - **DashboardView** - ダッシュボード（ホーム）
  - **GoalListView** - 目標一覧
  - **ProgressView** - 進捗確認
  - **TrainerView** - トレーナー画面
  - **SettingsView** - 設定画面

### 3. **目標関連**
- **GoalCreation** - 目標作成画面
- **GoalDetail** - 目標詳細画面
- **GoalEdit** - 目標編集画面
- **DailyActionSetup** - 日次行動設定画面

### 4. **スタンプ・進捗系**
- **StampAction** - スタンプ押印画面
- **ProgressDetail** - 詳細進捗画面
- **StampHistory** - スタンプ履歴画面
- **StreakCelebration** - 連続達成祝福画面

### 5. **トレーナー・報酬系**
- **TrainerProfile** - トレーナープロフィール
- **RewardGallery** - 報酬ギャラリー
- **RewardUnlock** - 報酬解放画面
- **TrainerVoicePlayer** - ボイス再生画面

### 6. **設定・その他**
- **NotificationSettings** - 通知設定
- **AppSettings** - アプリ設定
- **AboutApp** - アプリについて
- **ShareSuccess** - 成功シェア画面

## 画面遷移図

### メイン遷移フロー
```
起動
 ↓
[SplashScreen]
 ↓
初回起動？
 ├─ YES → [OnboardingWelcome] → [OnboardingFeatures] → [TrainerSelection] → [InitialGoalSetup]
 └─ NO  → [HomeTabView]
                 ↓
          [DashboardView] ←→ [GoalListView] ←→ [ProgressView] ←→ [TrainerView] ←→ [SettingsView]
                 ↓              ↓                ↓                ↓               ↓
            各種機能画面     目標関連画面      進捗詳細画面     トレーナー機能   設定関連画面
```

### 詳細遷移関係
```
[DashboardView]
 ├─ → [StampAction] → [StreakCelebration] → [RewardUnlock]
 ├─ → [GoalDetail] → [GoalEdit]
 ├─ → [ProgressDetail] → [StampHistory]
 └─ → [ShareSuccess]

[GoalListView]
 ├─ → [GoalCreation] → [DailyActionSetup]
 ├─ → [GoalDetail] → [GoalEdit]
 └─ → [GoalDetail] → [StampAction]

[TrainerView]
 ├─ → [TrainerProfile]
 ├─ → [RewardGallery] → [TrainerVoicePlayer]
 └─ → [TrainerSelection]

[SettingsView]
 ├─ → [NotificationSettings]
 ├─ → [AppSettings]
 └─ → [AboutApp]
```

## ナビゲーション設計

### 1. **タブナビゲーション（メイン）**
```swift
TabView {
    DashboardView()
        .tabItem {
            Image(systemName: "house.fill")
            Text("ホーム")
        }
    
    GoalListView()
        .tabItem {
            Image(systemName: "target")
            Text("目標")
        }
    
    ProgressView()
        .tabItem {
            Image(systemName: "chart.bar.fill")
            Text("進捗")
        }
    
    TrainerView()
        .tabItem {
            Image(systemName: "person.fill")
            Text("トレーナー")
        }
    
    SettingsView()
        .tabItem {
            Image(systemName: "gear")
            Text("設定")
        }
}
```

### 2. **画面プレゼンテーション方式**

#### **NavigationStack（iOS 16+）**
- 階層的なナビゲーション
- 戻るボタンによる直感的な操作

```swift
NavigationStack {
    GoalListView()
        .navigationDestination(for: Goal.self) { goal in
            GoalDetailView(goal: goal)
        }
}
```

#### **Sheet（モーダル）**
- 新規作成・編集系画面
- 設定・詳細情報画面

```swift
.sheet(isPresented: $showingGoalCreation) {
    GoalCreationView()
}
```

#### **FullScreenCover**
- オンボーディング
- 重要な祝福画面

```swift
.fullScreenCover(isPresented: $showingOnboarding) {
    OnboardingFlow()
}
```

### 3. **具体的な画面遷移パターン**

#### **ダッシュボードからのアクション**
```swift
struct DashboardView: View {
    @State private var showingStampAction = false
    @State private var selectedGoal: Goal?
    
    var body: some View {
        VStack {
            // 今日のアクション一覧
            ForEach(todaysActions) { action in
                ActionCardView(action: action) {
                    selectedGoal = action.goal
                    showingStampAction = true
                }
            }
        }
        .sheet(isPresented: $showingStampAction) {
            if let goal = selectedGoal {
                StampActionView(goal: goal)
            }
        }
    }
}
```

#### **目標作成フロー**
```swift
struct GoalCreationFlow: View {
    @State private var currentStep = 1
    @State private var goalData = GoalCreationData()
    
    var body: some View {
        NavigationStack {
            switch currentStep {
            case 1:
                GoalBasicInfoView(data: $goalData)
            case 2:
                DailyActionSetupView(data: $goalData)
            case 3:
                GoalConfirmationView(data: $goalData)
            default:
                EmptyView()
            }
        }
    }
}
```

### 4. **ナビゲーション状態管理**

#### **NavigationStateManager**
```swift
@MainActor
class NavigationStateManager: ObservableObject {
    @Published var selectedTab: TabType = .dashboard
    @Published var navigationPath = NavigationPath()
    @Published var presentedSheet: SheetType?
    @Published var presentedFullScreen: FullScreenType?
    
    enum TabType: CaseIterable {
        case dashboard, goals, progress, trainer, settings
    }
    
    enum SheetType {
        case goalCreation, goalEdit(Goal), stampAction(Goal)
        case rewardUnlock(Reward), settings
    }
    
    func navigate(to destination: AnyHashable) {
        navigationPath.append(destination)
    }
    
    func presentSheet(_ sheet: SheetType) {
        presentedSheet = sheet
    }
    
    func dismissSheet() {
        presentedSheet = nil
    }
}
```

### 5. **アクセシビリティ考慮**

#### **VoiceOver対応**
```swift
Button("スタンプを押す") {
    stampAction()
}
.accessibilityLabel("今日の目標を達成してスタンプを獲得")
.accessibilityHint("タップすると達成記録が保存されます")
```

#### **Dynamic Type対応**
```swift
Text("目標タイトル")
    .font(.headline)
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
```

### 6. **画面間データ受け渡し**

#### **Environment Objects**
```swift
@main
struct AppcadiaApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(GoalManager())
                .environmentObject(StampManager())
                .environmentObject(TrainerManager())
                .environmentObject(NavigationStateManager())
        }
    }
}
```

#### **データ引継パターン**
```swift
// 目標詳細への遷移
NavigationLink(destination: GoalDetailView(goal: goal)) {
    GoalRowView(goal: goal)
}

// シートでのデータ編集
.sheet(item: $selectedGoal) { goal in
    GoalEditView(goal: goal) { updatedGoal in
        goalManager.updateGoal(updatedGoal)
    }
}
```

### 7. **画面キャッシュ・パフォーマンス**

#### **遅延読み込み**
```swift
TabView {
    DashboardView()
        .tag(TabType.dashboard)
    
    LazyView {
        GoalListView()
    }
    .tag(TabType.goals)
}

struct LazyView<Content: View>: View {
    let build: () -> Content
    
    init(_ build: @autoclosure @escaping () -> Content) {
        self.build = build
    }
    
    var body: Content {
        build()
    }
}
```

## 特殊な画面遷移

### 1. **スタンプ獲得フロー**
```
[任意の画面] → [StampAction] → [StreakCelebration]? → [RewardUnlock]? → [元の画面]
```

### 2. **オンボーディングフロー**
```
[SplashScreen] → [OnboardingWelcome] → [Features1] → [Features2] → [Features3] → [TrainerSelection] → [InitialGoalSetup] → [HomeTabView]
```

### 3. **エラー・警告ダイアログ**
```swift
.alert("エラー", isPresented: $showingError) {
    Button("OK") { }
} message: {
    Text(errorMessage)
}
```

この設計により、直感的で使いやすいナビゲーション体験を提供し、ユーザーが迷うことなくアプリを利用できます。