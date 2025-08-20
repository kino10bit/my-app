# Appcadia データベース設計

## データモデル概要

AppcadiaはCore Dataを使用した完全オフラインアプリケーションです。以下のエンティティで構成されます。

### エンティティ関係図

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Trainer   │      │    Goal     │      │   Stamp     │
│             │      │             │◆────○│             │
│ - id        │      │ - id        │      │ - id        │
│ - name      │      │ - title     │      │ - goalId    │
│ - type      │      │ - category  │      │ - date      │
│ - isSelected│      │ - isActive  │      │ - note      │
│ - avatarImg │      │ - createdAt │      │ - stampType │
└─────────────┘      │ - targetEnd │      └─────────────┘
                     └─────────────┘
                             │
                             ○
                             │
                     ┌─────────────┐      ┌─────────────┐
                     │ DailyAction │      │   Reward    │
                     │             │      │             │
                     │ - id        │      │ - id        │
                     │ - goalId    │      │ - trainerId │
                     │ - title     │      │ - type      │
                     │ - description│      │ - threshold │
                     │ - isRequired│      │ - isUnlocked│
                     └─────────────┘      │ - content   │
                                         └─────────────┘
```

## Core Data エンティティ設計

### 1. **Trainer（トレーナー）**
```swift
@Entity
class Trainer: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var name: String
    @NSManaged var type: String          // "energetic", "calm", "strict"
    @NSManaged var isSelected: Bool
    @NSManaged var avatarImageName: String
    @NSManaged var voicePrefix: String   // 音声ファイルのプレフィックス
    @NSManaged var description: String
    @NSManaged var personality: String   // 性格設定
    @NSManaged var createdAt: Date
    
    // リレーション
    @NSManaged var rewards: NSSet?
}
```

### 2. **Goal（目標）**
```swift
@Entity
class Goal: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var title: String
    @NSManaged var category: String      // 自由入力カテゴリ
    @NSManaged var targetDescription: String
    @NSManaged var isActive: Bool
    @NSManaged var createdAt: Date
    @NSManaged var targetEndDate: Date?  // 任意の終了日
    @NSManaged var motivation: String    // 目標設定時の動機
    @NSManaged var difficulty: Int16     // 1-5の難易度
    
    // 進捗関連
    @NSManaged var totalStamps: Int32
    @NSManaged var currentStreak: Int32  // 連続達成日数
    @NSManaged var bestStreak: Int32     // 最高連続記録
    @NSManaged var lastStampDate: Date?
    
    // リレーション
    @NSManaged var dailyActions: NSSet?
    @NSManaged var stamps: NSSet?
}
```

### 3. **DailyAction（日次行動）**
```swift
@Entity
class DailyAction: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var goalId: UUID
    @NSManaged var title: String
    @NSManaged var description: String
    @NSManaged var isRequired: Bool      // 必須行動かどうか
    @NSManaged var estimatedMinutes: Int16
    @NSManaged var reminderHour: Int16   // リマインダー時刻
    @NSManaged var reminderMinute: Int16
    @NSManaged var isReminderEnabled: Bool
    @NSManaged var sortOrder: Int16
    @NSManaged var createdAt: Date
    
    // リレーション
    @NSManaged var goal: Goal?
}
```

### 4. **Stamp（スタンプ）**
```swift
@Entity
class Stamp: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var goalId: UUID
    @NSManaged var date: Date           // スタンプ獲得日（日付のみ）
    @NSManaged var stampedAt: Date      // スタンプした時刻
    @NSManaged var note: String?        // メモ（任意）
    @NSManaged var stampType: String    // "regular", "bonus", "streak"
    @NSManaged var mood: String?        // 気分記録（任意）
    @NSManaged var difficulty: Int16    // その日感じた難易度
    
    // リレーション
    @NSManaged var goal: Goal?
}
```

### 5. **Reward（報酬）**
```swift
@Entity
class Reward: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var trainerId: UUID
    @NSManaged var type: String         // "voice", "illustration", "badge"
    @NSManaged var name: String
    @NSManaged var description: String
    @NSManaged var threshold: Int32     // 解放に必要なスタンプ数
    @NSManaged var isUnlocked: Bool
    @NSManaged var unlockedAt: Date?
    @NSManaged var contentFileName: String // ファイル名
    @NSManaged var rarity: String       // "common", "rare", "legendary"
    @NSManaged var category: String     // "encouragement", "celebration", "milestone"
    
    // リレーション
    @NSManaged var trainer: Trainer?
}
```

### 6. **AppSettings（アプリ設定）**
```swift
@Entity
class AppSettings: NSManagedObject {
    @NSManaged var id: UUID
    @NSManaged var selectedTrainerId: UUID?
    @NSManaged var isFirstLaunch: Bool
    @NSManaged var voiceVolume: Float
    @NSManaged var notificationEnabled: Bool
    @NSManaged var preferredNotificationTime: Date
    @NSManaged var themeMode: String    // "light", "dark", "auto"
    @NSManaged var language: String     // "ja", "en"
    @NSManaged var lastBackupDate: Date?
    @NSManaged var totalAppUsageDays: Int32
    @NSManaged var createdAt: Date
    @NSManaged var updatedAt: Date
}
```

## Core Dataモデル設定

### 1. **リレーションシップ**
```swift
// Goal ←→ Stamp (一対多)
Goal.stamps ←→ Stamp.goal

// Goal ←→ DailyAction (一対多)  
Goal.dailyActions ←→ DailyAction.goal

// Trainer ←→ Reward (一対多)
Trainer.rewards ←→ Reward.trainer
```

### 2. **インデックス設計**
```swift
// 高頻度アクセスのためのインデックス
Goal:
  - id (Primary, Unique)
  - isActive
  - createdAt
  - lastStampDate

Stamp:
  - id (Primary, Unique)
  - goalId + date (Composite, Unique)
  - date
  - goalId

Trainer:
  - id (Primary, Unique)
  - isSelected

Reward:
  - id (Primary, Unique)  
  - trainerId + threshold (Composite)
  - isUnlocked
```

### 3. **Core Data設定**
```swift
// Persistent Container設定
lazy var persistentContainer: NSPersistentContainer = {
    let container = NSPersistentContainer(name: "Appcadia")
    
    // 暗号化設定
    let description = container.persistentStoreDescriptions.first
    description?.setOption(FileProtectionType.complete as NSObject, 
                          forKey: NSPersistentStoreFileProtectionKey)
    
    // バックグラウンド保存設定
    container.persistentStoreDescriptions.first?.setOption(true as NSNumber,
                          forKey: NSPersistentHistoryTrackingKey)
    
    container.loadPersistentStores { _, error in
        if let error = error {
            fatalError("Core Data error: \(error)")
        }
    }
    
    container.viewContext.automaticallyMergesChangesFromParent = true
    return container
}()
```

## データ操作パターン

### 1. **Repository層実装例**
```swift
protocol GoalRepository {
    func createGoal(_ goal: Goal) async throws
    func fetchActiveGoals() async throws -> [Goal]
    func updateGoal(_ goal: Goal) async throws
    func deleteGoal(id: UUID) async throws
}

class CoreDataGoalRepository: GoalRepository {
    private let context: NSManagedObjectContext
    
    func createGoal(_ goal: Goal) async throws {
        await context.perform {
            // Core Data操作
            context.insert(goal)
            try context.save()
        }
    }
    
    func fetchActiveGoals() async throws -> [Goal] {
        let request: NSFetchRequest<Goal> = Goal.fetchRequest()
        request.predicate = NSPredicate(format: "isActive == true")
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
        
        return try await context.perform {
            try context.fetch(request)
        }
    }
}
```

### 2. **パフォーマンス最適化**
```swift
// バッチ操作
func batchUpdateStampCounts() async throws {
    let batchRequest = NSBatchUpdateRequest(entityName: "Goal")
    batchRequest.predicate = NSPredicate(format: "isActive == true")
    batchRequest.propertiesToUpdate = ["totalStamps": 0]
    
    try await context.perform {
        try context.execute(batchRequest)
    }
}

// 予期読み込み
func fetchGoalsWithRelations() async throws -> [Goal] {
    let request: NSFetchRequest<Goal> = Goal.fetchRequest()
    request.relationshipKeyPathsForPrefetching = ["stamps", "dailyActions"]
    
    return try await context.perform {
        try context.fetch(request)
    }
}
```

## データ移行戦略

### バージョン管理
```swift
// Core Data Model versions
// Version 1.0: 初期リリース
// Version 1.1: Reward entity追加
// Version 1.2: AppSettings entity追加

// 軽量マイグレーション設定
description?.shouldMigrateStoreAutomatically = true
description?.shouldInferMappingModelAutomatically = true
```