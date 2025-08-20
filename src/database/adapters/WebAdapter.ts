// Web専用のデータベースアダプター設定
import { DatabaseAdapter } from '@nozbe/watermelondb';

export function createWebAdapter(schema: any): DatabaseAdapter {
  console.log('Creating Web adapter for web environment');
  
  try {
    // LokiJSアダプターを最小設定で使用
    const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
    
    return new LokiJSAdapter({
      schema,
      useWebWorker: false,
      useIncrementalIndexedDB: false,
    });
  } catch (error) {
    console.error('Failed to create LokiJS adapter:', error);
    throw new Error(`Cannot create database adapter: ${error.message}`);
  }
}