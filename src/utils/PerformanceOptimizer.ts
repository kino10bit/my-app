import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounce hook for search and input optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for scroll and touch events
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized component factory
export function createMemoizedComponent<T extends React.ComponentType<any>>(
  Component: T,
  arePropsEqual?: (prevProps: any, nextProps: any) => boolean
): React.MemoExoticComponent<T> {
  return React.memo(Component, arePropsEqual);
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static startMeasure(name: string): void {
    this.measurements.set(name, Date.now());
  }

  static endMeasure(name: string): number {
    const start = this.measurements.get(name);
    if (start) {
      const duration = Date.now() - start;
      this.measurements.delete(name);
      console.log(`Performance [${name}]: ${duration}ms`);
      return duration;
    }
    return 0;
  }

  static measureAsync<T>(
    name: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startMeasure(name);
      try {
        const result = await asyncOperation();
        this.endMeasure(name);
        resolve(result);
      } catch (error) {
        this.endMeasure(name);
        reject(error);
      }
    });
  }
}

// Image optimization utilities
export class ImageOptimizer {
  static getOptimizedImageUri(
    originalUri: string,
    width: number,
    height: number,
    quality: number = 80
  ): string {
    // For web images, you might want to use a service like Cloudinary
    if (originalUri.startsWith('http')) {
      return originalUri; // Return as-is for now, but could add query params for optimization
    }
    
    return originalUri;
  }

  static preloadImage(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const Image = require('react-native').Image;
      Image.prefetch(uri)
        .then(() => resolve())
        .catch(reject);
    });
  }
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean expired entries
    this.cleanExpiredCache();
  }

  static getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  private static cleanExpiredCache(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    });
  }
}

// Bundle size optimization utilities
export const LazyComponents = {
  // Lazy load heavy components
  GoalCreationScreen: React.lazy(() => import('../screens/GoalCreationScreen')),
  DashboardScreen: React.lazy(() => import('../screens/DashboardScreen')),
};

// React performance hooks
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
}

export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}