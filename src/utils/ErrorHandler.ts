import { Alert } from 'react-native';

export enum ErrorType {
  NETWORK = 'network',
  DATABASE = 'database',
  AUDIO = 'audio',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export class AppError extends Error {
  type: ErrorType;
  details?: string;
  code?: string;

  constructor(type: ErrorType, message: string, details?: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.code = code;
  }
}

export interface ErrorContext {
  operation: string;
  timestamp: Date;
}

export class ErrorHandler {
  static handleError(error: unknown, context?: string): AppError {
    const appError = this.parseError(error, context);
    this.logError(appError, context);
    return appError;
  }

  static showUserError(error: AppError, title?: string): void {
    const errorTitle = title || this.getErrorTitle(error.type);
    const errorMessage = this.getUserFriendlyMessage(error);

    Alert.alert(
      errorTitle,
      errorMessage,
      [
        { text: 'OK', style: 'default' },
        ...(this.shouldShowRetry(error.type) ? [{ text: '再試行', style: 'cancel' as const }] : [])
      ]
    );
  }

  private static parseError(error: unknown, context?: string): AppError {
    if (error instanceof Error) {
      // Database errors
      if (error.message.includes('database') || error.message.includes('sqlite')) {
        return new AppError(ErrorType.DATABASE, error.message, context);
      }

      // Network errors
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return new AppError(ErrorType.NETWORK, error.message, context);
      }

      // Audio errors
      if (error.message.includes('audio') || context?.includes('audio')) {
        return new AppError(ErrorType.AUDIO, error.message, context);
      }

      // Validation errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        return new AppError(ErrorType.VALIDATION, error.message, context);
      }

      return new AppError(ErrorType.UNKNOWN, error.message, context);
    }

    return new AppError(ErrorType.UNKNOWN, String(error), context);
  }

  private static logError(error: AppError, context?: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = [
      `[${timestamp}] Error:`,
      `Type: ${error.type}`,
      `Message: ${error.message}`,
      error.details && `Details: ${error.details}`,
      context && `Context: ${context}`,
      error.code && `Code: ${error.code}`
    ].filter(Boolean).join('\n');

    console.error(logMessage);

    // In production, you might want to send this to a logging service
    // LoggingService.logError(error, context);
  }

  private static getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'ネットワークエラー';
      case ErrorType.DATABASE:
        return 'データエラー';
      case ErrorType.AUDIO:
        return '音声エラー';
      case ErrorType.VALIDATION:
        return '入力エラー';
      default:
        return 'エラーが発生しました';
    }
  }

  private static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'インターネット接続を確認してください。';
      case ErrorType.DATABASE:
        return 'データの保存・読み込みに失敗しました。アプリを再起動してください。';
      case ErrorType.AUDIO:
        return '音声の再生に失敗しました。デバイスの音量設定を確認してください。';
      case ErrorType.VALIDATION:
        return error.message || '入力内容に問題があります。';
      default:
        return '予期しないエラーが発生しました。しばらく経ってから再試行してください。';
    }
  }

  private static shouldShowRetry(type: ErrorType): boolean {
    return [ErrorType.NETWORK, ErrorType.AUDIO].includes(type);
  }

  // Specific error creators
  static createDatabaseError(message: string, details?: string): AppError {
    return new AppError(ErrorType.DATABASE, message, details);
  }

  static createAppError(type: ErrorType, message: string, details?: string): AppError {
    return new AppError(type, message, details);
  }

  static createValidationError(message: string): AppError {
    return new AppError(ErrorType.VALIDATION, message);
  }

  static createNetworkError(message: string): AppError {
    return new AppError(ErrorType.NETWORK, message);
  }

  static createAudioError(message: string): AppError {
    return new AppError(ErrorType.AUDIO, message);
  }
}