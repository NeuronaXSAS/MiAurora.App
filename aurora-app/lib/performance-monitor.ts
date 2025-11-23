/**
 * Performance monitoring utilities for Aurora App
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(name: string) {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing an operation and record the metric
   */
  end(name: string, metadata?: Record<string, any>) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    this.timers.delete(name);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Measure an async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Export metrics for analysis
   */
  export(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === "undefined") return;

  // Largest Contentful Paint (LCP)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        console.log("LCP:", lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          console.log("FID:", entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        });
        console.log("CLS:", clsScore);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.warn("Performance Observer not fully supported:", error);
    }
  }
}

/**
 * Measure page load time
 */
export function measurePageLoad() {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (perfData) {
      console.log("Page Load Metrics:", {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        request: perfData.responseStart - perfData.requestStart,
        response: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        load: perfData.loadEventEnd - perfData.loadEventStart,
        total: perfData.loadEventEnd - perfData.fetchStart,
      });
    }
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images
 */
export function lazyLoadImage(img: HTMLImageElement) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          if (image.dataset.src) {
            image.src = image.dataset.src;
            image.removeAttribute("data-src");
          }
          observer.unobserve(image);
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: "image" | "script" | "style" | "font") {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = url;
  link.as = type;

  if (type === "font") {
    link.crossOrigin = "anonymous";
  }

  document.head.appendChild(link);
}

/**
 * Cache data in memory with expiration
 */
class MemoryCache<T> {
  private cache: Map<string, { data: T; expiry: number }> = new Map();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const memoryCache = new MemoryCache();
