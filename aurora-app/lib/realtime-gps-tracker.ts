/**
 * Real-time GPS Tracker with Wake Lock and Convex Streaming
 * Optimized for mobile web competition
 */

import { requestWakeLock, releaseWakeLock, isWakeLockActive } from "./wake-lock";

export interface RealtimeCoordinate {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
}

export interface RealtimeTrackingState {
  isTracking: boolean;
  coordinates: RealtimeCoordinate[];
  distance: number; // meters
  duration: number; // seconds
  startTime: number | null;
}

type CoordinateCallback = (coordinate: RealtimeCoordinate) => void;
type StatsCallback = (stats: { distance: number; duration: number }) => void;

class RealtimeGPSTracker {
  private watchId: number | null = null;
  private state: RealtimeTrackingState = {
    isTracking: false,
    coordinates: [],
    distance: 0,
    duration: 0,
    startTime: null,
  };
  private coordinateCallbacks: CoordinateCallback[] = [];
  private statsCallbacks: StatsCallback[] = [];
  private statsInterval: NodeJS.Timeout | null = null;
  private stateKey: string = 'aurora-realtime-gps-state';
  private persistInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Restore state on initialization
    this.restoreState();
  }

  /**
   * Start real-time GPS tracking with wake lock
   */
  async startTracking(): Promise<boolean> {
    if (this.state.isTracking) {
      console.warn("Tracking already active");
      return false;
    }

    // Request wake lock to keep screen active
    const wakeLockAcquired = await requestWakeLock();
    if (!wakeLockAcquired) {
      console.warn("Wake lock not acquired, tracking may be interrupted");
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return false;
    }

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    this.state.isTracking = true;
    this.state.startTime = Date.now();
    this.state.coordinates = [];
    this.state.distance = 0;
    this.state.duration = 0;

    // Start stats update interval
    this.statsInterval = setInterval(() => {
      if (this.state.startTime) {
        this.state.duration = Math.floor((Date.now() - this.state.startTime) / 1000);
        this.notifyStatsCallbacks();
      }
    }, 1000);

    // Start state persistence interval (every 5 seconds)
    this.persistInterval = setInterval(() => {
      this.persistState();
    }, 5000);

    console.log("Real-time GPS tracking started");
    return true;
  }

  /**
   * Stop tracking and release wake lock
   */
  async stopTracking(): Promise<RealtimeTrackingState> {
    if (!this.state.isTracking) {
      console.warn("Tracking not active");
      return this.state;
    }

    // Stop watching position
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Clear stats interval
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Clear persist interval
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
      this.persistInterval = null;
    }

    // Release wake lock
    await releaseWakeLock();

    this.state.isTracking = false;
    
    // Clear persisted state
    this.clearPersistedState();
    
    console.log("Real-time GPS tracking stopped");

    return { ...this.state };
  }

  /**
   * Handle new position from GPS
   */
  private handlePosition(position: GeolocationPosition): void {
    const coordinate: RealtimeCoordinate = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy,
    };

    // Calculate distance if we have previous coordinates
    if (this.state.coordinates.length > 0) {
      const lastCoord = this.state.coordinates[this.state.coordinates.length - 1];
      const distance = this.calculateDistance(
        lastCoord.lat,
        lastCoord.lng,
        coordinate.lat,
        coordinate.lng
      );
      this.state.distance += distance;
    }

    // Add coordinate to state
    this.state.coordinates.push(coordinate);

    // Notify callbacks (for Convex streaming)
    this.notifyCoordinateCallbacks(coordinate);
  }

  /**
   * Handle GPS errors
   */
  private handleError(error: GeolocationPositionError): void {
    console.error("GPS error:", error.message);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error("User denied geolocation permission");
        break;
      case error.POSITION_UNAVAILABLE:
        console.error("Location information unavailable");
        break;
      case error.TIMEOUT:
        console.error("Location request timed out");
        break;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Subscribe to coordinate updates (for Convex streaming)
   */
  onCoordinate(callback: CoordinateCallback): () => void {
    this.coordinateCallbacks.push(callback);
    return () => {
      this.coordinateCallbacks = this.coordinateCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to stats updates
   */
  onStats(callback: StatsCallback): () => void {
    this.statsCallbacks.push(callback);
    return () => {
      this.statsCallbacks = this.statsCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify coordinate callbacks
   */
  private notifyCoordinateCallbacks(coordinate: RealtimeCoordinate): void {
    this.coordinateCallbacks.forEach((callback) => {
      try {
        callback(coordinate);
      } catch (error) {
        console.error("Error in coordinate callback:", error);
      }
    });
  }

  /**
   * Notify stats callbacks
   */
  private notifyStatsCallbacks(): void {
    const stats = {
      distance: this.state.distance,
      duration: this.state.duration,
    };
    this.statsCallbacks.forEach((callback) => {
      try {
        callback(stats);
      } catch (error) {
        console.error("Error in stats callback:", error);
      }
    });
  }

  /**
   * Get current tracking state
   */
  getState(): RealtimeTrackingState {
    return { ...this.state };
  }

  /**
   * Check if wake lock is active
   */
  isWakeLockActive(): boolean {
    return isWakeLockActive();
  }

  /**
   * Persist state to localStorage
   */
  private persistState(): void {
    try {
      if (typeof window !== 'undefined' && this.state.isTracking) {
        localStorage.setItem(this.stateKey, JSON.stringify({
          coordinates: this.state.coordinates,
          distance: this.state.distance,
          duration: this.state.duration,
          startTime: this.state.startTime,
          isTracking: this.state.isTracking,
        }));
      }
    } catch (error) {
      console.error('Failed to persist realtime state:', error);
    }
  }

  /**
   * Restore state from localStorage
   */
  private restoreState(): void {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(this.stateKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.isTracking && parsed.startTime) {
            // Calculate elapsed time since last save
            const elapsed = Date.now() - parsed.startTime;
            this.state = {
              coordinates: parsed.coordinates || [],
              distance: parsed.distance || 0,
              duration: Math.floor(elapsed / 1000),
              startTime: parsed.startTime,
              isTracking: false, // Don't auto-resume, let user restart
            };
            console.log('Restored realtime GPS state:', this.state.coordinates.length, 'points,', this.state.distance.toFixed(2), 'm');
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore realtime state:', error);
    }
  }

  /**
   * Clear persisted state
   */
  private clearPersistedState(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.stateKey);
      }
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  }
}

// Export singleton instance
export const realtimeGPSTracker = new RealtimeGPSTracker();
