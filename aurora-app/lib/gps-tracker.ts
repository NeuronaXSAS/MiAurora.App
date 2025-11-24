/**
 * GPS Tracking Engine for Aurora Routes
 * Handles real-time location tracking with offline support
 */

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
  elevation?: number;
}

export interface TrackingStats {
  distance: number; // meters
  duration: number; // seconds
  pace: number; // min/km
  elevationGain: number; // meters
}

export interface TrackingState {
  isTracking: boolean;
  isPaused: boolean;
  coordinates: Coordinate[];
  stats: TrackingStats;
  startTime: number | null;
  pausedTime: number;
}

const SAMPLE_DISTANCE = 10; // meters
const SAMPLE_TIME = 5000; // 5 seconds
const DB_NAME = 'aurora-routes';
const DB_VERSION = 1;
const STORE_NAME = 'offline-routes';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total distance from coordinates array
 */
function calculateTotalDistance(coordinates: Coordinate[]): number {
  if (coordinates.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += calculateDistance(
      coordinates[i - 1].lat,
      coordinates[i - 1].lng,
      coordinates[i].lat,
      coordinates[i].lng
    );
  }
  return total;
}

/**
 * Calculate elevation gain
 */
function calculateElevationGain(coordinates: Coordinate[]): number {
  if (coordinates.length < 2) return 0;

  let gain = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const prev = coordinates[i - 1].elevation || 0;
    const curr = coordinates[i].elevation || 0;
    if (curr > prev) {
      gain += curr - prev;
    }
  }
  return gain;
}

/**
 * Open IndexedDB for offline storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Save route to IndexedDB for offline support
 */
async function saveOfflineRoute(routeId: string, coordinates: Coordinate[]): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.put({
      routeId,
      coordinates,
      timestamp: Date.now(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

/**
 * Get offline routes from IndexedDB
 */
async function getOfflineRoutes(): Promise<any[]> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete offline route from IndexedDB
 */
async function deleteOfflineRoute(id: number): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  db.close();
}

/**
 * GPS Tracker Class with State Persistence
 */
export class GPSTracker {
  private watchId: number | null = null;
  private state: TrackingState = {
    isTracking: false,
    isPaused: false,
    coordinates: [],
    stats: {
      distance: 0,
      duration: 0,
      pace: 0,
      elevationGain: 0,
    },
    startTime: null,
    pausedTime: 0,
  };
  private lastSampleTime: number = 0;
  private lastSamplePosition: Coordinate | null = null;
  private onUpdate: ((state: TrackingState) => void) | null = null;
  private onError: ((error: GeolocationPositionError) => void) | null = null;
  private stateKey: string = 'aurora-gps-tracker-state';

  constructor() {
    // Restore state from localStorage on initialization
    this.restoreState();
  }

  /**
   * Start tracking
   */
  start(
    onUpdate: (state: TrackingState) => void,
    onError?: (error: GeolocationPositionError) => void
  ): void {
    if (this.state.isTracking) return;

    this.onUpdate = onUpdate;
    this.onError = onError || null;
    this.state.isTracking = true;
    this.state.isPaused = false;
    this.state.startTime = Date.now();
    this.lastSampleTime = Date.now();

    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePosition(position),
        (error) => this.handleError(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      this.handleError({
        code: 0,
        message: 'Geolocation not supported',
      } as GeolocationPositionError);
    }
  }

  /**
   * Pause tracking
   */
  pause(): void {
    if (!this.state.isTracking || this.state.isPaused) return;
    this.state.isPaused = true;
    this.notifyUpdate();
  }

  /**
   * Resume tracking
   */
  resume(): void {
    if (!this.state.isTracking || !this.state.isPaused) return;
    this.state.isPaused = false;
    this.state.pausedTime += Date.now() - (this.lastSampleTime || Date.now());
    this.lastSampleTime = Date.now();
    this.notifyUpdate();
  }

  /**
   * Stop tracking
   */
  stop(): TrackingState {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.state.isTracking = false;
    this.state.isPaused = false;

    // Calculate final stats
    if (this.state.startTime) {
      this.state.stats.duration = Math.floor(
        (Date.now() - this.state.startTime - this.state.pausedTime) / 1000
      );
    }

    return { ...this.state };
  }

  /**
   * Get current state
   */
  getState(): TrackingState {
    return { ...this.state };
  }

  /**
   * Handle position update
   */
  private handlePosition(position: GeolocationPosition): void {
    if (!this.state.isTracking || this.state.isPaused) return;

    const coord: Coordinate = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: position.timestamp,
      elevation: position.coords.altitude || undefined,
    };

    // Sample based on distance or time
    const shouldSample = this.shouldSample(coord);

    if (shouldSample) {
      this.state.coordinates.push(coord);
      this.lastSamplePosition = coord;
      this.lastSampleTime = Date.now();

      // Update stats
      this.updateStats();
      this.notifyUpdate();

      // Save to offline storage periodically (every 10 points)
      if (this.state.coordinates.length % 10 === 0) {
        this.saveToOfflineStorage();
      }
    }
  }

  /**
   * Determine if we should sample this position
   */
  private shouldSample(coord: Coordinate): boolean {
    // Always sample first point
    if (!this.lastSamplePosition) return true;

    // Sample based on time (every 5 seconds)
    const timeSinceLastSample = Date.now() - this.lastSampleTime;
    if (timeSinceLastSample >= SAMPLE_TIME) return true;

    // Sample based on distance (every 10 meters)
    const distance = calculateDistance(
      this.lastSamplePosition.lat,
      this.lastSamplePosition.lng,
      coord.lat,
      coord.lng
    );
    if (distance >= SAMPLE_DISTANCE) return true;

    return false;
  }

  /**
   * Update tracking statistics
   */
  private updateStats(): void {
    this.state.stats.distance = calculateTotalDistance(this.state.coordinates);
    this.state.stats.elevationGain = calculateElevationGain(this.state.coordinates);

    if (this.state.startTime) {
      this.state.stats.duration = Math.floor(
        (Date.now() - this.state.startTime - this.state.pausedTime) / 1000
      );
    }

    // Calculate pace (min/km)
    if (this.state.stats.distance > 0 && this.state.stats.duration > 0) {
      this.state.stats.pace =
        (this.state.stats.duration / 60) / (this.state.stats.distance / 1000);
    }
  }

  /**
   * Handle geolocation error
   */
  private handleError(error: GeolocationPositionError): void {
    console.error('GPS Error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Notify update callback
   */
  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate({ ...this.state });
    }
  }

  /**
   * Save to offline storage
   */
  private async saveToOfflineStorage(): Promise<void> {
    try {
      await saveOfflineRoute('current', this.state.coordinates);
      // Also save to localStorage for quick recovery
      this.persistState();
    } catch (error) {
      console.error('Failed to save offline route:', error);
    }
  }

  /**
   * Persist state to localStorage
   */
  private persistState(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.stateKey, JSON.stringify({
          coordinates: this.state.coordinates,
          stats: this.state.stats,
          startTime: this.state.startTime,
          pausedTime: this.state.pausedTime,
          isTracking: this.state.isTracking,
          isPaused: this.state.isPaused,
        }));
      }
    } catch (error) {
      console.error('Failed to persist state:', error);
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
          // Only restore if tracking was active
          if (parsed.isTracking) {
            this.state = {
              ...this.state,
              coordinates: parsed.coordinates || [],
              stats: parsed.stats || this.state.stats,
              startTime: parsed.startTime,
              pausedTime: parsed.pausedTime,
            };
            console.log('Restored GPS state from localStorage:', this.state.coordinates.length, 'points');
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore state:', error);
    }
  }

  /**
   * Clear persisted state
   */
  clearPersistedState(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.stateKey);
      }
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  }
}

/**
 * Sync offline routes when connection is restored
 */
export async function syncOfflineRoutes(
  uploadFn: (routeId: string, coordinates: Coordinate[]) => Promise<void>
): Promise<void> {
  try {
    const offlineRoutes = await getOfflineRoutes();

    for (const route of offlineRoutes) {
      try {
        await uploadFn(route.routeId, route.coordinates);
        await deleteOfflineRoute(route.id);
      } catch (error) {
        console.error('Failed to sync route:', route.id, error);
      }
    }
  } catch (error) {
    console.error('Failed to sync offline routes:', error);
  }
}

/**
 * Format duration as HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance in km or m
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format pace as min/km
 */
export function formatPace(pace: number): string {
  if (!isFinite(pace) || pace === 0) return '--:--';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
