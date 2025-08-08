// Web専用のデータベースアダプター設定
import { DatabaseAdapter } from '@nozbe/watermelondb';

export function createWebAdapter(schema: any): DatabaseAdapter {
  // LokiJSアダプターのみを使用
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  
  return new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
  });
}