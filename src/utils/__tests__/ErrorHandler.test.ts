import { ErrorHandler, AppError, ErrorType } from '../ErrorHandler';
import { Alert } from 'react-native';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = ErrorHandler.createAppError(
        ErrorType.VALIDATION,
        'Test error message',
        'test_context'
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error message');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.details).toBe('test_context');
    });

    it('should create an AppError without optional parameters', () => {
      const error = ErrorHandler.createAppError(ErrorType.NETWORK, 'Simple error');

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Simple error');
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.details).toBeUndefined();
    });
  });

  describe('createValidationError', () => {
    it('should create a validation error', () => {
      const error = ErrorHandler.createValidationError('Validation failed');

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('createNetworkError', () => {
    it('should create a network error', () => {
      const error = ErrorHandler.createNetworkError('Network failed');

      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.message).toBe('Network failed');
    });
  });

  describe('createDatabaseError', () => {
    it('should create a database error', () => {
      const error = ErrorHandler.createDatabaseError('Database failed');

      expect(error.type).toBe(ErrorType.DATABASE);
      expect(error.message).toBe('Database failed');
    });
  });

  describe('handleError', () => {
    it('should handle AppError', () => {
      const appError = new AppError(ErrorType.VALIDATION, 'Test error');
      const result = ErrorHandler.handleError(appError, 'test_context');

      expect(result).toBe(appError);
      expect(result.details).toBe('test_context');
    });

    it('should convert regular Error to AppError', () => {
      const regularError = new Error('Regular error');
      const result = ErrorHandler.handleError(regularError, 'test_context');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Regular error');
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.details).toBe('test_context');
    });

    it('should handle string errors', () => {
      const result = ErrorHandler.handleError('String error', 'test_context');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('String error');
      expect(result.type).toBe(ErrorType.UNKNOWN);
      expect(result.details).toBe('test_context');
    });
  });

  describe('showUserError', () => {
    it('should show alert for validation error', () => {
      const error = new AppError(ErrorType.VALIDATION, 'Validation error');
      ErrorHandler.showUserError(error, 'Test Title');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Test Title',
        'Validation error',
        [{ text: 'OK' }]
      );
    });

    it('should show friendly message for network error', () => {
      const error = new AppError(ErrorType.NETWORK, 'Network timeout');
      ErrorHandler.showUserError(error);

      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        'ネットワーク接続に問題があります。しばらく待ってから再試行してください。',
        [{ text: 'OK' }]
      );
    });

    it('should show friendly message for database error', () => {
      const error = new AppError(ErrorType.DATABASE, 'DB connection failed');
      ErrorHandler.showUserError(error);

      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        'データの保存中にエラーが発生しました。アプリを再起動してください。',
        [{ text: 'OK' }]
      );
    });

    it('should show generic message for unknown error', () => {
      const error = new AppError(ErrorType.UNKNOWN, 'Unknown error');
      ErrorHandler.showUserError(error);

      expect(Alert.alert).toHaveBeenCalledWith(
        'エラー',
        '予期しないエラーが発生しました。',
        [{ text: 'OK' }]
      );
    });
  });

});