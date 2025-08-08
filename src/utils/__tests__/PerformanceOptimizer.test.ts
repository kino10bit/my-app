import { 
  useDebounce, 
  PerformanceMonitor, 
  MemoryOptimizer,
  createMemoizedComponent 
} from '../PerformanceOptimizer';
import React from 'react';

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing measurements
    (PerformanceMonitor as any).measurements = new Map();
    // Clear memory cache
    MemoryOptimizer.clearCache();
  });

  describe('useDebounce', () => {
    it('should exist as a function', () => {
      expect(typeof useDebounce).toBe('function');
    });
  });

  describe('PerformanceMonitor', () => {
    it('should measure sync operations', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      PerformanceMonitor.startMeasure('test-operation');
      const duration = PerformanceMonitor.endMeasure('test-operation');

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance [test-operation]:')
      );

      consoleLogSpy.mockRestore();
    });

    it('should measure async operations', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockAsyncOperation = jest.fn().mockResolvedValue('result');

      const result = await PerformanceMonitor.measureAsync(
        'async-test',
        mockAsyncOperation
      );

      expect(result).toBe('result');
      expect(mockAsyncOperation).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance [async-test]:')
      );

      consoleLogSpy.mockRestore();
    });

    it('should handle async operation errors', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockError = new Error('Async operation failed');
      const mockAsyncOperation = jest.fn().mockRejectedValue(mockError);

      await expect(
        PerformanceMonitor.measureAsync('async-error-test', mockAsyncOperation)
      ).rejects.toThrow('Async operation failed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance [async-error-test]:')
      );

      consoleLogSpy.mockRestore();
    });

    it('should return 0 for non-existent measurements', () => {
      const duration = PerformanceMonitor.endMeasure('non-existent');
      expect(duration).toBe(0);
    });
  });

  describe('MemoryOptimizer', () => {
    it('should cache and retrieve data', () => {
      const testData = { key: 'value', number: 42 };
      
      MemoryOptimizer.setCache('test-key', testData);
      const retrieved = MemoryOptimizer.getCache('test-key');

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent cache', () => {
      const result = MemoryOptimizer.getCache('non-existent');
      expect(result).toBeNull();
    });

    it('should handle cache expiry', () => {
      jest.useFakeTimers();
      const testData = { expired: true };

      MemoryOptimizer.setCache('expiry-test', testData);
      
      // Advance time beyond TTL (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);

      const result = MemoryOptimizer.getCache('expiry-test');
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should clear all cache', () => {
      MemoryOptimizer.setCache('key1', 'value1');
      MemoryOptimizer.setCache('key2', 'value2');

      MemoryOptimizer.clearCache();

      expect(MemoryOptimizer.getCache('key1')).toBeNull();
      expect(MemoryOptimizer.getCache('key2')).toBeNull();
    });

    it('should clean expired entries automatically', () => {
      jest.useFakeTimers();

      // Add multiple entries
      MemoryOptimizer.setCache('key1', 'value1');
      
      // Advance time partially
      jest.advanceTimersByTime(3 * 60 * 1000);
      MemoryOptimizer.setCache('key2', 'value2');
      
      // Advance time to expire first entry
      jest.advanceTimersByTime(3 * 60 * 1000);
      
      // Adding new entry should trigger cleanup
      MemoryOptimizer.setCache('key3', 'value3');

      expect(MemoryOptimizer.getCache('key1')).toBeNull(); // Expired
      expect(MemoryOptimizer.getCache('key2')).toBeTruthy(); // Not expired
      expect(MemoryOptimizer.getCache('key3')).toBeTruthy(); // Fresh

      jest.useRealTimers();
    });
  });

  describe('createMemoizedComponent', () => {
    it('should create memoized component', () => {
      const TestComponent: React.FC<{ value: string }> = ({ value }) => {
        return React.createElement('text', null, value);
      };

      const MemoizedComponent = createMemoizedComponent(TestComponent);
      expect(MemoizedComponent).toBeTruthy();
      expect(typeof MemoizedComponent).toBe('object'); // React.memo returns object
    });

    it('should create memoized component with custom comparison', () => {
      const TestComponent: React.FC<{ value: string }> = ({ value }) => {
        return React.createElement('text', null, value);
      };

      const customCompare = (prevProps: any, nextProps: any) => {
        return prevProps.value === nextProps.value;
      };

      const MemoizedComponent = createMemoizedComponent(TestComponent, customCompare);
      expect(MemoizedComponent).toBeTruthy();
    });
  });
});