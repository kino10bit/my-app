// ネイティブ専用のデータベースアダプター設定
import { DatabaseAdapter } from '@nozbe/watermelondb';

export function createNativeAdapter(schema: any): DatabaseAdapter {
  // SQLiteアダプターを使用（JSIを無効化してより安全に）
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  
  return new SQLiteAdapter({
    schema,
    jsi: false, // JSIを無効化してクラッシュを回避
  });
}