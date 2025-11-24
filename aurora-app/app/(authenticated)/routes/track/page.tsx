"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900">
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
        {currentPosition && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
          <Map
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            initialViewState={{
              longitude: currentPosition.lng,
              latitude: currentPosition.lat,
              zoom: 16,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl"
          >
            {/* Current position marker */}
            <Marker longitude={currentPosition.lng} latitude={currentPosition.lat}>
              <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full border-3 border-white shadow-2xl shadow-purple-500/50 animate-pulse" />
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
                    "line-color": "#a855f7",
                    "line-width": 5,
                    "line-opacity": 0.8,
                  }}
                />
                <Layer
                  id="route-glow"
                  type="line"
                  paint={{
                    "line-color": "#ec4899",
                    "line-width": 8,
                    "line-opacity": 0.3,
                    "line-blur": 4,
                  }}
                />
              </Source>
            )}
          </Map>
        )}

        {!currentPosition && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">Acquiring GPS signal...</p>
            <p className="text-gray-400 text-sm mt-2">Make sure location is enabled</p>
          </div>
        )}

        {/* Stats Overlay - Strava Style */}
        {trackingState && !showTypeSelector && (
          <div className="absolute top-4 left-4 right-4 backdrop-blur-xl bg-slate-900/90 border border-aurora-blue/30 rounded-2xl shadow-2xl p-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Distance</p>
                <p className="text-4xl font-black text-aurora-blue drop-shadow-lg">{formatDistance(trackingState.stats.distance)}</p>
                <p className="text-xs text-gray-500 mt-1">kilometers</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Duration</p>
                <p className="text-4xl font-black text-aurora-blue drop-shadow-lg">{formatDuration(trackingState.stats.duration)}</p>
                <p className="text-xs text-gray-500 mt-1">time</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Pace</p>
                <p className="text-4xl font-black text-aurora-blue drop-shadow-lg">{formatPace(trackingState.stats.pace)}</p>
                <p className="text-xs text-gray-500 mt-1">min/km</p>
              </div>
            </div>
            
            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Points</p>
                <p className="text-xl font-bold text-white">{trackingState.coordinates.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Speed</p>
                <p className="text-xl font-bold text-white">
                  {trackingState.stats.pace > 0 ? (60 / trackingState.stats.pace).toFixed(1) : '0.0'} km/h
                </p>
              </div>
            </div>
            
            {trackingState.isPaused && (
              <div className="mt-4 text-center">
                <Badge className="bg-yellow-600 text-white text-sm px-4 py-1">⏸️ Paused</Badge>
              </div>
            )}
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
      <div className="backdrop-blur-xl bg-white/5 border-t border-white/10 p-4">
        {showTypeSelector ? (
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="font-semibold text-center text-white">Select Activity Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["walking", "running", "cycling", "commuting"] as const).map((type) => (
                <Button
                  key={type}
                  variant={routeType === type ? "default" : "outline"}
                  onClick={() => setRouteType(type)}
                  className={`capitalize ${routeType === type ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                >
                  {type}
                </Button>
              ))}
            </div>
            <Button 
              onClick={handleStart} 
              className="w-full min-h-[56px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50" 
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
                className="flex-1 min-h-[56px] bg-white/10 border-white/20 text-white hover:bg-white/20"
                aria-label="Pause route tracking"
              >
                <Pause className="w-5 h-5 mr-2" aria-hidden="true" />
                Pause
              </Button>
            ) : (
              <Button 
                onClick={handleResume} 
                size="lg" 
                className="flex-1 min-h-[56px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
              className="flex-1 min-h-[56px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              aria-label="Stop route tracking"
            >
              <Square className="w-5 h-5 mr-2" aria-hidden="true" />
              Stop & Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
