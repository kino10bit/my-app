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
`src/utils/AssetManager.ts` の `initialize()` メソッド内：

```typescript
// 画像キャッシュに追加
this.imageCache = {
  // 既存のファイル...
  '新トレーナー名': require('../../assets/images/trainers/新トレーナー名.png'),
};

// 音声キャッシュに追加
this.audioCache = {
  // 既存のファイル...
  '新トレーナー名': require('../../assets/audio/trainers/新トレーナー名.mp3'),
};
```

### Step 4: 動作確認
1. アプリを再起動
2. トレーナー選択画面で新しいトレーナーの画像が表示されることを確認
3. 「声を聞く」ボタンで音声が再生されることを確認

## 🔧 ヘルパー関数の使用

### AssetHelper を使用した追加（推奨）
```typescript
import { addTrainerAssetsByFilename } from '../utils/AssetHelper';

// 複数のトレーナーを一度に追加
addTrainerAssetsByFilename(['trainer1', 'trainer2', 'trainer3']);

// 個別にカスタマイズして追加
import { addNewTrainerAssets } from '../utils/AssetHelper';
addNewTrainerAssets({
  'customTrainer': {
    image: '../../assets/images/trainers/customTrainer.png',
    audio: '../../assets/audio/trainers/customTrainer.mp3'
  }
});
```

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
3. **キャッシュ**: ファイル追加後はアプリ再起動が必要
4. **バックアップ**: 元ファイルのバックアップを推奨

この手順に従うことで、新しいトレーナーを簡単に追加できます。