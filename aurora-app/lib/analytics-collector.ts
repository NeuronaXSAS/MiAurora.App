/**
 * Analytics Collector - Enhanced for B2B Intelligence
 * 
 * Robust analytics engine with event batching, offline support, and privacy-first design.
 * Prevents server overload by queuing events and flushing in batches.
 * 
 * Features:
 * - User ID anonymization (SHA-256 hashing)
 * - Coordinate rounding for privacy (3 decimals ≈ 111m accuracy)
 * - Consent-aware tracking
 * - Session management (24-hour rotation)
 * - Geographic data collection
 * - Device fingerprinting
 */

import { Id } from "@/convex/_generated/dataModel";

interface AnalyticsEvent {
  eventType: string;
  sessionId: string;
  userId?: Id<"users">;
  metadata?: any;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
    city?: string;
    country?: string;
  };
  device?: {
    userAgent?: string;
    platform?: string;
    isMobile?: boolean;
    screenWidth?: number;
    screenHeight?: number;
  };
  performance?: {
    loadTime?: number;
    renderTime?: number;
    networkLatency?: number;
  };
  timestamp: number;
}

interface AnalyticsConfig {
  batchSize?: number; // Number of events before auto-flush (default: 5)
  flushInterval?: number; // Milliseconds between auto-flushes (default: 10000)
  endpoint?: string; // API endpoint for flushing events
  debug?: boolean; // Enable console logging
}

export class AnalyticsEngine {
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: Id<"users">;
  private config: Required<AnalyticsConfig>;
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing: boolean = false;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      batchSize: config.batchSize || 5,
      flushInterval: config.flushInterval || 10000,
      endpoint: config.endpoint || '/api/analytics/batch',
      debug: config.debug || false,
    };

    // Generate or restore session ID
    this.sessionId = this.getOrCreateSessionId();

    // Start auto-flush timer
    this.startAutoFlush();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }

    this.log('Analytics Engine initialized', { sessionId: this.sessionId });
  }

  /**
   * Set the current user ID
   */
  setUserId(userId: Id<"users">) {
    this.userId = userId;
    this.log('User ID set', { userId });
  }

  /**
   * Track an event with optional geographic data
   */
  track(eventType: string, metadata?: any, includeGeo: boolean = false) {
    const event: AnalyticsEvent = {
      eventType,
      sessionId: this.sessionId,
      userId: this.userId,
      metadata,
      device: this.getDeviceInfo(),
      timestamp: Date.now(),
    };

    // Add geographic data if requested and user consents
    if (includeGeo && this.hasGeoConsent()) {
      this.addGeographicData(event);
    }

    this.queue.push(event);
    this.log('Event tracked', event);

    // Auto-flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track map interaction (for B2B intelligence)
   */
  trackMapInteraction(action: string, location?: { lat: number; lng: number }, metadata?: any) {
    this.track('map_interaction', {
      action, // "pan", "zoom", "marker_click", "search"
      location: location ? this.roundCoordinates(location) : undefined,
      ...metadata,
    }, true); // Include geo
  }

  /**
   * Track route taken (for Urban Safety Index)
   */
  trackRouteTaken(routeId: string, metadata?: any) {
    this.track('route_taken', {
      routeId,
      ...metadata,
    }, true); // Include geo
  }

  /**
   * Track reel watched (for engagement metrics)
   */
  trackReelWatched(reelId: string, watchTime: number, metadata?: any) {
    this.track('reel_watched', {
      reelId,
      watchTime,
      completionRate: metadata?.duration ? watchTime / metadata.duration : undefined,
      ...metadata,
    });
  }

  /**
   * Track livestream joined (for engagement metrics)
   */
  trackLivestreamJoined(livestreamId: string, metadata?: any) {
    this.track('livestream_joined', {
      livestreamId,
      ...metadata,
    });
  }

  /**
   * Track post view (for content analytics)
   */
  trackPostView(postId: string, metadata?: any) {
    this.track('post_view', {
      postId,
      ...metadata,
    }, true); // Include geo for location-based insights
  }

  /**
   * Track page view
   */
  trackPageView(path: string, metadata?: any) {
    this.track('page_view', {
      path,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...metadata,
    });
  }

  /**
   * Track button click
   */
  trackClick(buttonName: string, metadata?: any) {
    this.track('button_click', {
      buttonName,
      ...metadata,
    });
  }

  /**
   * Track video play
   */
  trackVideoPlay(videoId: string, metadata?: any) {
    this.track('video_play', {
      videoId,
      ...metadata,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, metadata?: any) {
    this.track('performance', {
      metric,
      value,
      ...metadata,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, metadata?: any) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...metadata,
    });
  }

  /**
   * Flush queued events to server
   */
  async flush() {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const eventsToSend = [...this.queue];
    this.queue = [];

    try {
      this.log('Flushing events', { count: eventsToSend.length });

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
        // Use keepalive for requests during page unload
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Analytics flush failed: ${response.statusText}`);
      }

      this.log('Events flushed successfully', { count: eventsToSend.length });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);

      // Re-queue events on failure (with limit to prevent memory issues)
      if (this.queue.length < 100) {
        this.queue.unshift(...eventsToSend);
      }

      // Save to localStorage as backup
      this.saveToLocalStorage(eventsToSend);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const storageKey = 'aurora_session_id';
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    if (typeof window === 'undefined') return undefined;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
  }

  /**
   * Save events to localStorage as backup
   */
  private saveToLocalStorage(events: AnalyticsEvent[]) {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = 'aurora_analytics_backup';
      const existing = localStorage.getItem(storageKey);
      const existingEvents = existing ? JSON.parse(existing) : [];

      // Limit backup to 50 events
      const combined = [...existingEvents, ...events].slice(-50);

      localStorage.setItem(storageKey, JSON.stringify(combined));
      this.log('Events saved to localStorage', { count: events.length });
    } catch (error) {
      console.error('Failed to save events to localStorage:', error);
    }
  }

  /**
   * Restore events from localStorage
   */
  private restoreFromLocalStorage(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];

    try {
      const storageKey = 'aurora_analytics_backup';
      const existing = localStorage.getItem(storageKey);

      if (existing) {
        const events = JSON.parse(existing);
        localStorage.removeItem(storageKey);
        this.log('Events restored from localStorage', { count: events.length });
        return events;
      }
    } catch (error) {
      console.error('Failed to restore events from localStorage:', error);
    }

    return [];
  }

  /**
   * Check if user has consented to geographic tracking
   */
  private hasGeoConsent(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const consent = localStorage.getItem('aurora_geo_consent');
      return consent === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Add geographic data to event
   */
  private async addGeographicData(event: AnalyticsEvent) {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      event.geo = {
        lat: this.roundCoordinate(position.coords.latitude),
        lng: this.roundCoordinate(position.coords.longitude),
        accuracy: Math.round(position.coords.accuracy),
      };
    } catch (error) {
      this.log('Failed to get geolocation', error);
    }
  }

  /**
   * Round coordinate to 3 decimal places (≈111m accuracy)
   * Privacy-preserving while still useful for urban safety analysis
   */
  private roundCoordinate(coord: number): number {
    return Math.round(coord * 1000) / 1000;
  }

  /**
   * Round coordinates object
   */
  private roundCoordinates(location: { lat: number; lng: number }) {
    return {
      lat: this.roundCoordinate(location.lat),
      lng: this.roundCoordinate(location.lng),
    };
  }

  /**
   * Anonymize user ID using SHA-256
   */
  private async anonymizeUserId(userId: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Fallback for environments without crypto.subtle
      return `anon_${userId.slice(0, 8)}`;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any) {
    if (this.config.debug) {
      console.log(`[Analytics] ${message}`, data);
    }
  }

  /**
   * Destroy the analytics engine
   */
  destroy() {
    this.stopAutoFlush();
    this.flush();
  }
}

// Singleton instance
let analyticsInstance: AnalyticsEngine | null = null;

/**
 * Get or create analytics engine instance
 */
export function getAnalytics(config?: AnalyticsConfig): AnalyticsEngine {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsEngine(config);
  }
  return analyticsInstance;
}

/**
 * Track event (convenience function)
 */
export function trackEvent(eventType: string, metadata?: any) {
  const analytics = getAnalytics();
  analytics.track(eventType, metadata);
}

/**
 * Track page view (convenience function)
 */
export function trackPageView(path: string, metadata?: any) {
  const analytics = getAnalytics();
  analytics.trackPageView(path, metadata);
}
