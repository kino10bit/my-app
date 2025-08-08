import { Alert } from 'react-native';

interface LoadingState {
  [key: string]: boolean;
}

export class LoadingManager {
  private static instance: LoadingManager;
  private loadingStates: LoadingState = {};
  private callbacks: Set<(states: LoadingState) => void> = new Set();

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  setLoading(key: string, isLoading: boolean): void {
    this.loadingStates[key] = isLoading;
    this.notifyCallbacks();
  }

  isLoading(key: string): boolean {
    return this.loadingStates[key] || false;
  }

  isAnyLoading(): boolean {
    return Object.values(this.loadingStates).some(loading => loading);
  }

  getLoadingStates(): LoadingState {
    return { ...this.loadingStates };
  }

  subscribe(callback: (states: LoadingState) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      callback(this.getLoadingStates());
    });
  }

  // Helper method for async operations with loading state
  async withLoading<T>(
    key: string,
    operation: () => Promise<T>,
    options?: {
      errorHandler?: (error: unknown) => void;
      successMessage?: string;
      errorTitle?: string;
    }
  ): Promise<T | null> {
    this.setLoading(key, true);
    
    try {
      const result = await operation();
      
      if (options?.successMessage) {
        Alert.alert('成功', options.successMessage, [{ text: 'OK' }]);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in ${key}:`, error);
      
      if (options?.errorHandler) {
        options.errorHandler(error);
      } else {
        Alert.alert(
          options?.errorTitle || 'エラー',
          '操作に失敗しました。しばらく経ってから再試行してください。'
        );
      }
      
      return null;
    } finally {
      this.setLoading(key, false);
    }
  }
}

// Common loading keys
export const LoadingKeys = {
  DASHBOARD_LOAD: 'dashboard_load',
  GOAL_CREATE: 'goal_create',
  GOAL_UPDATE: 'goal_update',
  TRAINER_SELECT: 'trainer_select',
  AUDIO_PLAY: 'audio_play',
  DATA_REFRESH: 'data_refresh'
} as const;