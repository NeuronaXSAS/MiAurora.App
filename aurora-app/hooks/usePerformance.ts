/**
 * Aurora App - Performance Hook
 * 
 * React hook for performance optimizations on resource-constrained devices.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  isLowEndDevice,
  getQualitySettings,
  prefersReducedMotion,
  getAnimationDuration,
} from '@/lib/performance';

interface PerformanceSettings {
  isLowEnd: boolean;
  imageQuality: number;
  videoQuality: 'low' | 'medium' | 'high';
  enableAnimations: boolean;
  prefetchCount: number;
  reducedMotion: boolean;
}

/**
 * Hook to get device-appropriate performance settings
 */
export function usePerformance(): PerformanceSettings {
  const [settings, setSettings] = useState<PerformanceSettings>({
    isLowEnd: false,
    imageQuality: 80,
    videoQuality: 'high',
    enableAnimations: true,
    prefetchCount: 5,
    reducedMotion: false,
  });

  useEffect(() => {
    const isLowEnd = isLowEndDevice();
    const qualitySettings = getQualitySettings();
    const reducedMotion = prefersReducedMotion();

    setSettings({
      isLowEnd,
      ...qualitySettings,
      enableAnimations: qualitySettings.enableAnimations && !reducedMotion,
      reducedMotion,
    });

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: e.matches,
        enableAnimations: prev.enableAnimations && !e.matches,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return settings;
}

/**
 * Hook for animation duration based on device capabilities
 */
export function useAnimationDuration(defaultMs: number): number {
  const { enableAnimations, reducedMotion } = usePerformance();
  
  return useMemo(() => {
    if (reducedMotion || !enableAnimations) return 0;
    return defaultMs;
  }, [defaultMs, enableAnimations, reducedMotion]);
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastRun, setLastRun] = useState(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun >= delay) {
        setLastRun(now);
        return callback(...args);
      }
    }) as T,
    [callback, delay, lastRun]
  );
}

/**
 * Hook for network status
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType: string | null;
} {
  const [status, setStatus] = useState({
    isOnline: true,
    isSlowConnection: false,
    effectiveType: null as string | null,
  });

  useEffect(() => {
    const updateStatus = () => {
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      const slowConnections = ['slow-2g', '2g', '3g'];
      const isSlowConnection = connection 
        ? slowConnections.includes(connection.effectiveType) || connection.saveData
        : false;

      setStatus({
        isOnline: navigator.onLine,
        isSlowConnection,
        effectiveType: connection?.effectiveType || null,
      });
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}

/**
 * Hook for viewport size with debouncing
 */
export function useViewport(): {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 667,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    ...viewport,
    isMobile: viewport.width < 640,
    isTablet: viewport.width >= 640 && viewport.width < 1024,
    isDesktop: viewport.width >= 1024,
  };
}
