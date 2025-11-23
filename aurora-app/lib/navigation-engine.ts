/**
 * Navigation Engine for Aurora Routes
 * Provides turn-by-turn navigation with safety features
 */

export interface NavigationStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number]; // [lng, lat]
  };
}

export interface NavigationState {
  isNavigating: boolean;
  currentStepIndex: number;
  steps: NavigationStep[];
  remainingDistance: number;
  remainingDuration: number;
  currentLocation: { lat: number; lng: number } | null;
  isOffRoute: boolean;
  routeCoordinates: Array<{ lat: number; lng: number }>;
}

export class NavigationEngine {
  private state: NavigationState;
  private onStateChange: (state: NavigationState) => void;
  private onError: (error: Error) => void;
  private watchId: number | null = null;
  private mapboxToken: string;

  constructor(
    mapboxToken: string,
    onStateChange: (state: NavigationState) => void,
    onError: (error: Error) => void
  ) {
    this.mapboxToken = mapboxToken;
    this.onStateChange = onStateChange;
    this.onError = onError;
    this.state = {
      isNavigating: false,
      currentStepIndex: 0,
      steps: [],
      remainingDistance: 0,
      remainingDuration: 0,
      currentLocation: null,
      isOffRoute: false,
      routeCoordinates: [],
    };
  }

  /**
   * Start navigation for a saved route
   */
  async startNavigation(routeCoordinates: Array<{ lat: number; lng: number }>) {
    try {
      // Get current location
      const position = await this.getCurrentPosition();
      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Get directions from current location to route start
      const directions = await this.getDirections(
        currentLocation,
        routeCoordinates[0],
        routeCoordinates[routeCoordinates.length - 1]
      );

      this.state = {
        isNavigating: true,
        currentStepIndex: 0,
        steps: directions.steps,
        remainingDistance: directions.distance,
        remainingDuration: directions.duration,
        currentLocation,
        isOffRoute: false,
        routeCoordinates: directions.coordinates,
      };

      // Start tracking position
      this.startPositionTracking();
      this.onStateChange(this.state);
    } catch (error) {
      this.onError(error as Error);
    }
  }

  /**
   * Get directions using Mapbox Directions API
   */
  private async getDirections(
    start: { lat: number; lng: number },
    waypoint: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ) {
    const coordinates = `${start.lng},${start.lat};${waypoint.lng},${waypoint.lat};${end.lng},${end.lat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?steps=true&geometries=geojson&access_token=${this.mapboxToken}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to get directions");
    }

    const data = await response.json();
    const route = data.routes[0];

    return {
      distance: route.distance,
      duration: route.duration,
      steps: route.legs.flatMap((leg: any) =>
        leg.steps.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          maneuver: {
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            location: step.maneuver.location,
          },
        }))
      ),
      coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
      })),
    };
  }

  /**
   * Start tracking user position
   */
  private startPositionTracking() {
    if (!navigator.geolocation) {
      this.onError(new Error("Geolocation not supported"));
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        this.updateNavigation(currentLocation);
      },
      (error) => {
        this.onError(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }

  /**
   * Update navigation based on current position
   */
  private updateNavigation(currentLocation: { lat: number; lng: number }) {
    this.state.currentLocation = currentLocation;

    // Check if we've reached the current step
    const currentStep = this.state.steps[this.state.currentStepIndex];
    if (currentStep) {
      const distanceToManeuver = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        currentStep.maneuver.location[1],
        currentStep.maneuver.location[0]
      );

      // If within 20 meters of maneuver, move to next step
      if (distanceToManeuver < 20 && this.state.currentStepIndex < this.state.steps.length - 1) {
        this.state.currentStepIndex++;
      }
    }

    // Check if off route
    const distanceToRoute = this.getDistanceToRoute(currentLocation);
    this.state.isOffRoute = distanceToRoute > 50; // 50 meters threshold

    // Calculate remaining distance and duration
    this.updateRemainingStats();

    this.onStateChange(this.state);
  }

  /**
   * Calculate distance to nearest point on route
   */
  private getDistanceToRoute(location: { lat: number; lng: number }): number {
    let minDistance = Infinity;

    for (const coord of this.state.routeCoordinates) {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        coord.lat,
        coord.lng
      );
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  /**
   * Update remaining distance and duration
   */
  private updateRemainingStats() {
    let remainingDistance = 0;
    let remainingDuration = 0;

    for (let i = this.state.currentStepIndex; i < this.state.steps.length; i++) {
      remainingDistance += this.state.steps[i].distance;
      remainingDuration += this.state.steps[i].duration;
    }

    this.state.remainingDistance = remainingDistance;
    this.state.remainingDuration = remainingDuration;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
   * Get current position
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }

  /**
   * Stop navigation
   */
  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.state.isNavigating = false;
    this.onStateChange(this.state);
  }

  /**
   * Get current state
   */
  getState(): NavigationState {
    return this.state;
  }

  /**
   * Recalculate route from current position
   */
  async recalculateRoute() {
    if (!this.state.currentLocation) return;

    try {
      const targetIndex = Math.min(
        this.state.currentStepIndex + 5,
        this.state.routeCoordinates.length - 1
      );
      const target = this.state.routeCoordinates[targetIndex];
      const end = this.state.routeCoordinates[this.state.routeCoordinates.length - 1];

      const directions = await this.getDirections(this.state.currentLocation, target, end);

      this.state.steps = directions.steps;
      this.state.currentStepIndex = 0;
      this.state.routeCoordinates = directions.coordinates;
      this.state.isOffRoute = false;

      this.onStateChange(this.state);
    } catch (error) {
      this.onError(error as Error);
    }
  }
}
