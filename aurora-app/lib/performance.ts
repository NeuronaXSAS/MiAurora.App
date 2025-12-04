/**
 * Aurora App - Performance Utilities
 * 
 * Optimizations for fast loading times on all devices,
 * especially resource-constrained mobile phones.
 */

// ============================================
// IMAGE OPTIMIZATION
// ============================================

/**
 * Get optimized image URL based on device capabilities
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
  } = {}
): string {
  const { width = 400, quality = 75, format = 'auto' } = options;
  
  // If it's a Cloudinary URL, add transformations
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const transforms = `w_${width},q_${quality},f_${format}`;
      return `${parts[0]}/upload/${transforms}/${parts[1]}`;
    }
  }
  
  return url;
}

/**
 * Get responsive image srcset for different screen sizes
 */
export function getResponsiveSrcSet(url: string): string {
  const sizes = [320, 640, 768, 1024, 1280];
  return sizes
    .map(size => `${getOptimizedImageUrl(url, { width: size })} ${size}w`)
    .join(', ');
}

// ============================================
// LAZY LOADING
// ============================================

/**
 * Check if element is in viewport
 */
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Create intersection observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };
  
  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
}

// ============================================
// DEVICE DETECTION
// ============================================

/**
 * Detect if device is low-end based on various signals
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check device memory (if available)
  const nav = navigator as any;
  if (nav.deviceMemory && nav.deviceMemory < 4) {
    return true;
  }
  
  // Check hardware concurrency (CPU cores)
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) {
    return true;
  }
  
  // Check connection type
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (connection) {
    const slowConnections = ['slow-2g', '2g', '3g'];
    if (slowConnections.includes(connection.effectiveType)) {
      return true;
    }
    if (connection.saveData) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get recommended quality settings based on device
 */
export function getQualitySettings(): {
  imageQuality: number;
  videoQuality: 'low' | 'medium' | 'high';
  enableAnimations: boolean;
  prefetchCount: number;
} {
  const lowEnd = isLowEndDevice();
  
  if (lowEnd) {
    return {
      imageQuality: 60,
      videoQuality: 'low',
      enableAnimations: false,
      prefetchCount: 2,
    };
  }
  
  return {
    imageQuality: 80,
    videoQuality: 'high',
    enableAnimations: true,
    prefetchCount: 5,
  };
}

// ============================================
// CACHING
// ============================================

/**
 * Simple in-memory cache with TTL
 */
class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  
  set(key: string, value: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const queryCache = new MemoryCache<any>();

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

/**
 * Debounce function for search inputs, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for scroll handlers, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// BUNDLE SIZE HELPERS
// ============================================

/**
 * Dynamic import with loading state
 */
export async function dynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Dynamic import failed:', error);
    if (fallback) return fallback;
    throw error;
  }
}

// ============================================
// PRELOADING
// ============================================

/**
 * Preload critical resources
 */
export function preloadResource(url: string, as: 'image' | 'script' | 'style' | 'font'): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * Prefetch next page resources
 */
export function prefetchPage(url: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string): () => void {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    if (duration > 100) {
      console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
    }
  };
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)}`);
  }
  
  // In production, send to analytics
  // This would integrate with PostHog or similar
}

// ============================================
// REDUCED MOTION
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs;
}
