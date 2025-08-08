import { LoadingManager, LoadingKeys } from '../LoadingManager';

describe('LoadingManager', () => {
  let loadingManager: LoadingManager;

  beforeEach(() => {
    // Reset singleton instance
    (LoadingManager as any).instance = null;
    loadingManager = LoadingManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LoadingManager.getInstance();
      const instance2 = LoadingManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(LoadingManager);
    });
  });

  describe('setLoading', () => {
    it('should set loading state and notify subscribers', () => {
      const mockSubscriber = jest.fn();
      loadingManager.subscribe(mockSubscriber);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, true);

      expect(mockSubscriber).toHaveBeenCalledWith({
        [LoadingKeys.GOAL_CREATE]: true
      });
    });

    it('should handle multiple loading states', () => {
      const mockSubscriber = jest.fn();
      loadingManager.subscribe(mockSubscriber);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, true);
      loadingManager.setLoading(LoadingKeys.TRAINER_SELECT, true);

      expect(mockSubscriber).toHaveBeenLastCalledWith({
        [LoadingKeys.GOAL_CREATE]: true,
        [LoadingKeys.TRAINER_SELECT]: true
      });
    });

    it('should remove loading state when set to false', () => {
      const mockSubscriber = jest.fn();
      loadingManager.subscribe(mockSubscriber);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, true);
      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, false);

      expect(mockSubscriber).toHaveBeenLastCalledWith({
        [LoadingKeys.GOAL_CREATE]: false
      });
    });
  });

  describe('isLoading', () => {
    it('should return correct loading state', () => {
      expect(loadingManager.isLoading(LoadingKeys.GOAL_CREATE)).toBe(false);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, true);
      expect(loadingManager.isLoading(LoadingKeys.GOAL_CREATE)).toBe(true);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, false);
      expect(loadingManager.isLoading(LoadingKeys.GOAL_CREATE)).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should allow multiple subscribers', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      loadingManager.subscribe(subscriber1);
      loadingManager.subscribe(subscriber2);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, true);

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const subscriber = jest.fn();
      const unsubscribe = loadingManager.subscribe(subscriber);

      loadingManager.setLoading(LoadingKeys.GOAL_CREATE, true);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      loadingManager.setLoading(LoadingKeys.TRAINER_SELECT, true);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('withLoading', () => {
    it('should handle successful operation', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const mockSubscriber = jest.fn();
      loadingManager.subscribe(mockSubscriber);

      const result = await loadingManager.withLoading(
        LoadingKeys.GOAL_CREATE,
        mockOperation
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalled();
      
      // Check that loading was set to true then false
      expect(mockSubscriber).toHaveBeenCalledWith({
        [LoadingKeys.GOAL_CREATE]: true
      });
      expect(mockSubscriber).toHaveBeenLastCalledWith({
        [LoadingKeys.GOAL_CREATE]: false
      });
    });

    it('should handle operation error', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      const mockErrorHandler = jest.fn();
      const mockSubscriber = jest.fn();
      loadingManager.subscribe(mockSubscriber);

      const result = await loadingManager.withLoading(
        LoadingKeys.GOAL_CREATE,
        mockOperation,
        { errorHandler: mockErrorHandler }
      );

      expect(result).toBe(null);
      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
      expect(mockSubscriber).toHaveBeenLastCalledWith({
        [LoadingKeys.GOAL_CREATE]: false
      });
    });

    it('should show success message when provided', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const AlertSpy = jest.spyOn(require('react-native').Alert, 'alert');

      await loadingManager.withLoading(
        LoadingKeys.GOAL_CREATE,
        mockOperation,
        { successMessage: 'Operation completed!' }
      );

      expect(AlertSpy).toHaveBeenCalledWith(
        '成功',
        'Operation completed!',
        [{ text: 'OK' }]
      );
    });

    it('should use default error handler when none provided', async () => {
      const mockError = new Error('Operation failed');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await loadingManager.withLoading(
        LoadingKeys.GOAL_CREATE,
        mockOperation
      );

      expect(result).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error in ${LoadingKeys.GOAL_CREATE}:`,
        mockError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('LoadingKeys', () => {
    it('should have all required loading keys', () => {
      expect(LoadingKeys.GOAL_CREATE).toBe('goal_create');
      expect(LoadingKeys.TRAINER_SELECT).toBe('trainer_select');
      expect(LoadingKeys.AUDIO_PLAY).toBe('audio_play');
      expect(LoadingKeys.DATA_REFRESH).toBe('data_refresh');
    });
  });
});