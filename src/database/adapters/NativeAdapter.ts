// ネイティブ専用のデータベースアダプター設定
import { DatabaseAdapter } from '@nozbe/watermelondb';
import { Platform } from 'react-native';

export function createNativeAdapter(schema: any): DatabaseAdapter {
  // SQLiteアダプターのみを使用
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  
  return new SQLiteAdapter({
    schema,
    jsi: Platform.OS === 'ios',
  });
}