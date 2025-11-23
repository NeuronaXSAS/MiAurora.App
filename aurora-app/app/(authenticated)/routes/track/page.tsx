"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, AlertCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { GPSTracker, TrackingState, formatDistance, formatDuration, formatPace } from "@/lib/gps-tracker";
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export default function TrackRoutePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [routeId, setRouteId] = useState<Id<"routes"> | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routeType, setRouteType] = useState<"walking" | "running" | "cycling" | "commuting">("walking");
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [announcement, setAnnouncement] = useState<string>("");
  
  const trackerRef = useRef<GPSTracker | null>(null);
  const router = useRouter();

  const startRoute = useMutation(api.routes.startRoute);
  const saveCoordinates = useMutation(api.routes.saveCoordinates);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  const handleStart = async () => {
    if (!userId) return;

    try {
      // Create route in database
      const result = await startRoute({ userId, routeType });
      setRouteId(result.routeId);
      setShowTypeSelector(false);

      // Start GPS tracking
      const tracker = new GPSTracker();
      trackerRef.current = tracker;

      tracker.start(
        (state) => {
          setTrackingState(state);
          
          // Save coordinates periodically
          if (state.coordinates.length % 10 === 0 && result.routeId) {
            saveCoordinates({
              routeId: result.routeId,
              coordinates: state.coordinates.slice(-10),
            }).catch(console.error);
          }
        },
        (error) => {
          setError(error.message);
        }
      );
    } catch (err) {
      setError("Failed to start tracking");
      console.error(err);
    }
  };

  const handlePause = () => {
    trackerRef.current?.pause();
    setAnnouncement("Route tracking paused");
  };

  const handleResume = () => {
    trackerRef.current?.resume();
    setAnnouncement("Route tracking resumed");
  };

  const handleStop = () => {
    if (!trackerRef.current || !routeId) return;

    const finalState = trackerRef.current.stop();
    setAnnouncement("Route tracking stopped");
    
    // Navigate to completion dialog with route data
    router.push(`/routes/complete/${routeId}`);
  };

  // Get current position for map center
  const currentPosition = trackingState?.coordinates[trackingState.coordinates.length - 1];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        {currentPosition && (
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            initialViewState={{
              longitude: currentPosition.lng,
              latitude: currentPosition.lat,
              zoom: 15,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            {/* Current position marker */}
            <Marker longitude={currentPosition.lng} latitude={currentPosition.lat}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
            </Marker>

            {/* Route path */}
            {trackingState && trackingState.coordinates.length > 1 && (
              <Source
                type="geojson"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: trackingState.coordinates.map(c => [c.lng, c.lat]),
                  },
                }}
              >
                <Layer
                  id="route"
                  type="line"
                  paint={{
                    "line-color": "#8b5cf6",
                    "line-width": 4,
                  }}
                />
              </Source>
            )}
          </Map>
        )}

        {!currentPosition && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <p className="text-white">Waiting for GPS signal...</p>
          </div>
        )}

        {/* Stats Overlay */}
        {trackingState && !showTypeSelector && (
          <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="text-lg font-bold">{formatDistance(trackingState.stats.distance)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-lg font-bold">{formatDuration(trackingState.stats.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pace</p>
                <p className="text-lg font-bold">{formatPace(trackingState.stats.pace)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500 text-white rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        {showTypeSelector ? (
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="font-semibold text-center">Select Activity Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["walking", "running", "cycling", "commuting"] as const).map((type) => (
                <Button
                  key={type}
                  variant={routeType === type ? "default" : "outline"}
                  onClick={() => setRouteType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
            <Button 
              onClick={handleStart} 
              className="w-full min-h-[56px]" 
              size="lg"
              aria-label="Start tracking route"
            >
              <Play className="w-5 h-5 mr-2" aria-hidden="true" />
              Start Tracking
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto flex gap-3">
            {!trackingState?.isPaused ? (
              <Button 
                onClick={handlePause} 
                variant="outline" 
                size="lg" 
                className="flex-1 min-h-[56px]"
                aria-label="Pause route tracking"
              >
                <Pause className="w-5 h-5 mr-2" aria-hidden="true" />
                Pause
              </Button>
            ) : (
              <Button 
                onClick={handleResume} 
                size="lg" 
                className="flex-1 min-h-[56px]"
                aria-label="Resume route tracking"
              >
                <Play className="w-5 h-5 mr-2" aria-hidden="true" />
                Resume
              </Button>
            )}
            <Button 
              onClick={handleStop} 
              variant="destructive" 
              size="lg" 
              className="flex-1 min-h-[56px]"
              aria-label="Stop route tracking"
            >
              <Square className="w-5 h-5 mr-2" aria-hidden="true" />
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
