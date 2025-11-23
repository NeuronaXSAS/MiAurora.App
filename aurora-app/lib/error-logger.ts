/**
 * Error logging and monitoring utilities
 */

export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  level: "error" | "warn" | "info";
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory

  /**
   * Log an error
   */
  error(error: Error | string, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message: typeof error === "string" ? error : error.message,
      stack: typeof error === "string" ? undefined : error.stack,
      timestamp: Date.now(),
      level: "error",
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    this.addLog(errorLog);
    console.error("[Error]", errorLog);

    // Send to external service (e.g., Sentry, LogRocket)
    this.sendToExternalService(errorLog);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message,
      timestamp: Date.now(),
      level: "warn",
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    this.addLog(errorLog);
    console.warn("[Warning]", errorLog);
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message,
      timestamp: Date.now(),
      level: "info",
      context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    this.addLog(errorLog);
    console.info("[Info]", errorLog);
  }

  /**
   * Add log to memory
   */
  private addLog(log: ErrorLog) {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  /**
   * Send error to external monitoring service
   */
  private sendToExternalService(log: ErrorLog) {
    // TODO: Integrate with Sentry, LogRocket, or similar service
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(new Error(log.message), {
    //     extra: log.context,
    //   });
    // }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: "error" | "warn" | "info"): ErrorLog[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs() {
    if (typeof window === "undefined") return;

    const blob = new Blob([this.export()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Global error handler
 */
export function setupGlobalErrorHandler() {
  if (typeof window === "undefined") return;

  // Catch unhandled errors
  window.addEventListener("error", (event) => {
    errorLogger.error(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    errorLogger.error(
      event.reason instanceof Error ? event.reason : String(event.reason),
      {
        type: "unhandledRejection",
      }
    );
  });

  // Catch console errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    errorLogger.error(args.join(" "), { source: "console" });
    originalConsoleError.apply(console, args);
  };
}

/**
 * Track user engagement metrics
 */
export class EngagementTracker {
  private sessionStart: number;
  private pageViews: number = 0;
  private interactions: number = 0;
  private timeOnPage: Map<string, number> = new Map();

  constructor() {
    this.sessionStart = Date.now();
    this.trackPageView();
    this.setupInteractionTracking();
  }

  /**
   * Track page view
   */
  trackPageView() {
    this.pageViews++;
    const currentPage = typeof window !== "undefined" ? window.location.pathname : "";
    this.timeOnPage.set(currentPage, Date.now());
  }

  /**
   * Track user interaction
   */
  trackInteraction(type: string, details?: Record<string, any>) {
    this.interactions++;
    console.log("[Engagement]", type, details);
  }

  /**
   * Setup interaction tracking
   */
  private setupInteractionTracking() {
    if (typeof window === "undefined") return;

    // Track clicks
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      this.trackInteraction("click", {
        element: target.tagName,
        id: target.id,
        class: target.className,
      });
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener("scroll", () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll > 25 && maxScroll < 30) {
          this.trackInteraction("scroll", { depth: "25%" });
        } else if (maxScroll > 50 && maxScroll < 55) {
          this.trackInteraction("scroll", { depth: "50%" });
        } else if (maxScroll > 75 && maxScroll < 80) {
          this.trackInteraction("scroll", { depth: "75%" });
        } else if (maxScroll > 95) {
          this.trackInteraction("scroll", { depth: "100%" });
        }
      }
    });
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  /**
   * Get engagement metrics
   */
  getMetrics() {
    return {
      sessionDuration: this.getSessionDuration(),
      pageViews: this.pageViews,
      interactions: this.interactions,
      timeOnPage: Object.fromEntries(this.timeOnPage),
    };
  }
}

// Create global engagement tracker
export const engagementTracker = typeof window !== "undefined" ? new EngagementTracker() : null;
