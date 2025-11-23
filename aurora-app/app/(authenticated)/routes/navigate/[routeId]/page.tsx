"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Navigation,
  AlertTriangle,
  Phone,
  MapPin,
  TrendingUp
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { NavigationEngine, NavigationState } from "@/lib/navigation-engine";
import { formatDistance, formatDuration } from "@/lib/gps-tracker";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export default function NavigateRoutePage() {
  const params = useParams();
  const routeId = params.routeId as Id<"routes">;
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const engineRef = useRef<NavigationEngine | null>(null);
  const router = useRouter();

  const route = useQuery(
    api.routes.getRoute,
    routeId ? { routeId } : "skip"
  );

  useEffect(() => {
    if (!route || engineRef.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError("Mapbox token not configured");
      return;
    }

    // Initialize navigation engine
    const engine = new NavigationEngine(
      mapboxToken,
      (state) => setNavState(state),
      (err) => setError(err.message)
    );

    engineRef.current = engine;

    // Start navigation
    engine.startNavigation(route.coordinates);

    return () => {
      engine.stop();
    };
  }, [route]);

  const handleStop = () => {
    engineRef.current?.stop();
    router.push("/routes");
  };

  const handleRecalculate = () => {
    engineRef.current?.recalculateRoute();
  };

  const handleEmergency = () => {
    setShowSafetyDialog(true);
  };

  const findNearestSafeSpace = () => {
    // In a real implementation, this would query nearby safe spaces
    // For now, we'll show emergency contacts
    alert("Finding nearest safe spaces...");
  };

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading route...</p>
        </div>
      </div>
    );
  }

  const currentStep = navState?.steps[navState.currentStepIndex];
  const nextStep = navState?.steps[navState.currentStepIndex + 1];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {currentStep?.instruction}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {navState?.currentLocation && (
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            initialViewState={{
              longitude: navState.currentLocation.lng,
              latitude: navState.currentLocation.lat,
              zoom: 16,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            {/* Current position */}
            <Marker 
              longitude={navState.currentLocation.lng} 
              latitude={navState.currentLocation.lat}
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
            </Marker>

            {/* Route path */}
            {navState.routeCoordinates.length > 0 && (
              <Source
                type="geojson"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: navState.routeCoordinates.map(c => [c.lng, c.lat]),
                  },
                }}
              >
                <Layer
                  id="route"
                  type="line"
                  paint={{
                    "line-color": navState.isOffRoute ? "#ef4444" : "#8b5cf6",
                    "line-width": 6,
                  }}
                />
              </Source>
            )}

            {/* Next maneuver marker */}
            {currentStep && (
              <Marker 
                longitude={currentStep.maneuver.location[0]} 
                latitude={currentStep.maneuver.location[1]}
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
              </Marker>
            )}
          </Map>
        )}

        {/* Off-route warning */}
        {navState?.isOffRoute && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div className="flex-1">
                <p className="font-semibold">You're off route</p>
                <p className="text-sm">Tap to recalculate</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                className="bg-white text-red-600"
              >
                Recalculate
              </Button>
            </div>
          </div>
        )}

        {/* Current instruction */}
        {currentStep && !navState?.isOffRoute && (
          <div className="absolute top-4 left-4 right-4 bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">
                  In {formatDistance(currentStep.distance)}
                </p>
                <p className="text-lg font-semibold">{currentStep.instruction}</p>
                {nextStep && (
                  <p className="text-sm text-gray-600 mt-1">
                    Then {nextStep.instruction.toLowerCase()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {navState && (
          <div className="absolute bottom-24 left-4 right-4 bg-white rounded-lg p-3 shadow-lg">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="text-lg font-bold">{formatDistance(navState.remainingDistance)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ETA</p>
                <p className="text-lg font-bold">{formatDuration(navState.remainingDuration)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency button */}
        <button
          onClick={handleEmergency}
          className="absolute bottom-24 right-4 w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="I feel unsafe - Get help"
        >
          <AlertTriangle className="w-8 h-8" />
        </button>

        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="max-w-md mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={handleStop}
            className="flex-1 min-h-[56px]"
            aria-label="Stop navigation"
          >
            <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
            Stop
          </Button>
        </div>
      </div>

      {/* Safety Dialog */}
      {showSafetyDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
                <p className="text-gray-600">
                  We're here to help you stay safe
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  onClick={() => window.location.href = "tel:911"}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Emergency (911)
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={findNearestSafeSpace}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Find Nearest Safe Space
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    handleRecalculate();
                    setShowSafetyDialog(false);
                  }}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Find Alternative Route
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowSafetyDialog(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
