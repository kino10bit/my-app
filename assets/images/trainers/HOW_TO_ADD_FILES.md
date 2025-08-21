# 新しいトレーナーファイル追加方法

## 🚀 クイックスタート

### 1. ファイル配置
新しいトレーナーのファイルを配置：
```
assets/images/trainers/新トレーナー名.png
assets/audio/trainers/新トレーナー名.mp3
```

### 2. コード更新
`src/utils/AssetManager.ts` の初期化部分に追加：

```typescript
// imageCache に追加
'新トレーナー名': require('../../assets/images/trainers/新トレーナー名.png'),

// audioCache に追加  
'新トレーナー名': require('../../assets/audio/trainers/新トレーナー名.mp3'),
```

## 📋 詳細手順

### Step 1: ファイル準備
**画像ファイル**:
- サイズ: 400x400px
- フォーマット: PNG（透明背景推奨）
- 命名: `{トレーナーID}.png`

**音声ファイル**:
- フォーマット: MP3
- 長さ: 5-10秒程度
- 命名: `{トレーナーID}.mp3`

### Step 2: ファイル配置
```bash
# 画像ファイル配置
cp 新トレーナー名.png assets/images/trainers/

# 音声ファイル配置
cp 新トレーナー名.mp3 assets/audio/trainers/
```

### Step 3: AssetManager.ts 更新
`src/utils/AssetManager.ts` の定数定義部分を更新：

```typescript
// TRAINER_IMAGES に追加
const TRAINER_IMAGES = {
  // 既存のファイル...
  'akari': require('../../assets/images/trainers/akari.png'),
  // 新しいトレーナーを追加
  '新トレーナー名': require('../../assets/images/trainers/新トレーナー名.png'),
} as const;

// TRAINER_AUDIO に追加
const TRAINER_AUDIO = {
  // 既存のファイル...
  'akari': require('../../assets/audio/trainers/akari.mp3'),
  // 新しいトレーナーを追加
  '新トレーナー名': require('../../assets/audio/trainers/新トレーナー名.mp3'),
} as const;
```

### Step 4: 動作確認
1. アプリを再起動
2. トレーナー選択画面で新しいトレーナーの画像が表示されることを確認
3. 「声を聞く」ボタンで音声が再生されることを確認

## 🔧 ヘルパー関数の使用

### AssetHelper で追加情報を確認
```typescript
import { addTrainerAssetsByFilename } from '../utils/AssetHelper';

// 追加するトレーナーの情報を表示
addTrainerAssetsByFilename(['trainer1', 'trainer2', 'trainer3']);
```

**注意**: React Nativeの制約により、アセットは静的にのみ追加可能です。
ヘルパー関数は追加手順の確認のみで、実際の追加は手動で行ってください。

## 🐛 トラブルシューティング

### 画像が表示されない場合
1. ファイルパスの確認
2. ファイル名の大文字小文字チェック
3. PNG形式であることを確認
4. アプリの再起動

### 音声が再生されない場合
1. MP3形式であることを確認
2. ファイルサイズの確認（大きすぎないか）
3. ファイルの破損チェック
4. デバイスの音量設定確認

### デバッグ方法
開発中にコンソールでアセット状況を確認：
```typescript
import { logAssetStatus, checkTrainerAssets } from '../utils/AssetHelper';

// 全体の状況確認
logAssetStatus();

// 特定のトレーナーの確認
const status = checkTrainerAssets('新トレーナー名');
console.log(status);
```

## 📝 注意事項

1. **ファイル名の統一**: 画像と音声は同じトレーナーIDを使用
2. **文字コード**: ファイル名は英数字推奨（日本語不可）
3. **静的追加**: React Nativeの制約により、require()は静的にのみ使用可能
4. **アプリ再起動**: ファイル追加後はアプリ再起動が必要
5. **バックアップ**: 元ファイルのバックアップを推奨

この手順に従うことで、新しいトレーナーを追加できます。

## 🔄 現在実装されているトレーナー

- akari (あかり先生)
- isuzu (いすず先生)
- kana (かな先生)
- mika (みか先生)
- rin (りん先生)

互換性のための旧名称マッピング:
- shinji → isuzu
- takumi → kana
- miyuki → mika
- daiki → rin