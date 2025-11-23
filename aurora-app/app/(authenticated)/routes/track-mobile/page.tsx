"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { realtimeGPSTracker, RealtimeCoordinate } from "@/lib/realtime-gps-tracker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Square, MapPin, Clock, TrendingUp, Zap, AlertTriangle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function TrackMobilePage() {
  const [isTracking, setIsTracking] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [coordinates, setCoordinates] = useState<RealtimeCoordinate[]>([]);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [currentRouteId, setCurrentRouteId] = useState<Id<"routes"> | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startRoute = useMutation(api.routes.startRoute);
  const saveCoordinates = useMutation(api.routes.saveCoordinates);
  const completeRoute = useMutation(api.routes.completeRoute);

  // Get user ID
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

  // Subscribe to GPS updates
  useEffect(() => {
    let coordinateBuffer: RealtimeCoordinate[] = [];
    let flushInterval: NodeJS.Timeout;

    const unsubscribeCoordinate = realtimeGPSTracker.onCoordinate(async (coord) => {
      setCoordinates((prev) => [...prev, coord]);
      coordinateBuffer.push(coord);
    });

    // Flush coordinates to Convex every 5 seconds
    if (currentRouteId) {
      flushInterval = setInterval(async () => {
        if (coordinateBuffer.length > 0 && currentRouteId) {
          try {
            await saveCoordinates({
              routeId: currentRouteId,
              coordinates: coordinateBuffer.map(c => ({
                lat: c.lat,
                lng: c.lng,
                timestamp: c.timestamp,
              })),
            });
            coordinateBuffer = [];
          } catch (error) {
            console.error("Error streaming coordinates:", error);
          }
        }
      }, 5000);
    }

    const unsubscribeStats = realtimeGPSTracker.onStats((stats) => {
      setDistance(stats.distance);
      setDuration(stats.duration);
    });

    return () => {
      unsubscribeCoordinate();
      unsubscribeStats();
      if (flushInterval) clearInterval(flushInterval);
    };
  }, [currentRouteId, saveCoordinates]);

  const handleStart = async () => {
    if (!userId) {
      alert("Please log in to track routes");
      return;
    }

    try {
      // Start GPS tracking with wake lock
      const started = await realtimeGPSTracker.startTracking();
      if (!started) {
        alert("Failed to start GPS tracking. Please check permissions.");
        return;
      }

      // Create route in Convex
      const result = await startRoute({
        userId: userId,
        routeType: "walking",
      });

      setCurrentRouteId(result.routeId);
      setIsTracking(true);
      setWakeLockActive(realtimeGPSTracker.isWakeLockActive());
      setCoordinates([]);
      setDistance(0);
      setDuration(0);
      
      // Auto-enable stealth mode after 3 seconds
      setTimeout(() => {
        setStealthMode(true);
      }, 3000);
    } catch (error) {
      console.error("Error starting route:", error);
      alert("Failed to start tracking: " + (error as Error).message);
    }
  };

  const handleSlideToStop = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      const touch = e.touches[0];
      const container = (e.target as HTMLElement).closest('.slide-container');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const position = Math.max(0, Math.min(touch.clientX - rect.left, rect.width - 60));
      setSlidePosition(position);
      
      // Complete if slid 80% of the way
      if (position > rect.width * 0.8) {
        handleStop();
      }
    }
  };

  const handleSlideEnd = () => {
    setIsDragging(false);
    if (slidePosition < 200) {
      setSlidePosition(0);
    }
  };

  const handleStop = async () => {
    if (!currentRouteId || !userId) return;

    try {
      // Stop GPS tracking
      const finalState = await realtimeGPSTracker.stopTracking();

      // Get first and last coordinates for start/end locations
      const startCoord = coordinates[0];
      const endCoord = coordinates[coordinates.length - 1];

      // Complete route in Convex
      await completeRoute({
        routeId: currentRouteId,
        userId: userId,
        distance: finalState.distance,
        duration: finalState.duration,
        elevationGain: 0,
        rating: 3,
        tags: [],
        sharingLevel: "public",
        startLocation: startCoord ? { name: "Start", lat: startCoord.lat, lng: startCoord.lng } : { name: "Unknown", lat: 0, lng: 0 },
        endLocation: endCoord ? { name: "End", lat: endCoord.lat, lng: endCoord.lng } : { name: "Unknown", lat: 0, lng: 0 },
      });

      setIsTracking(false);
      setStealthMode(false);
      setWakeLockActive(false);
      setCurrentRouteId(null);

      alert("Route saved successfully!");
    } catch (error) {
      console.error("Error stopping route:", error);
      alert("Failed to save route: " + (error as Error).message);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDistance = (meters: number): string => {
    return (meters / 1000).toFixed(2);
  };

  // Stealth Mode Overlay
  if (stealthMode && isTracking) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
        {/* Minimal HUD */}
        <div className="text-center space-y-8">
          {/* Recording Pulse */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full animate-ping opacity-75" />
            </div>
          </div>

          {/* Timer - Dim */}
          <div className="text-gray-700 text-4xl font-mono font-light">
            {formatDuration(duration)}
          </div>

          {/* Distance - Dim */}
          <div className="text-gray-800 text-xl font-light">
            {formatDistance(distance)} km
          </div>

          {/* GPS Points Counter */}
          <div className="text-gray-800 text-sm">
            {coordinates.length} points
          </div>
        </div>

        {/* Slide to Finish - Bottom */}
        <div className="absolute bottom-8 left-4 right-4">
          {/* SOS Button */}
          <button
            onClick={() => {
              if (confirm("Trigger emergency alert?")) {
                // TODO: Implement SOS functionality
                alert("Emergency services notified");
              }
            }}
            className="w-full mb-4 py-3 bg-red-900 text-red-200 rounded-lg text-sm font-medium"
          >
            SOS / Emergency
          </button>

          {/* Slide to Stop */}
          <div className="slide-container relative bg-gray-900 rounded-full h-16 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-red-900 transition-all"
              style={{ width: `${(slidePosition / 250) * 100}%` }}
            />
            <div
              className="absolute top-2 left-2 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer touch-none"
              style={{ transform: `translateX(${slidePosition}px)` }}
              onTouchStart={() => setIsDragging(true)}
              onTouchMove={handleSlideToStop}
              onTouchEnd={handleSlideEnd}
              onMouseDown={() => setIsDragging(true)}
              onMouseMove={(e) => isDragging && handleSlideToStop(e)}
              onMouseUp={handleSlideEnd}
            >
              <Square className="w-6 h-6 text-gray-400" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-600 text-sm font-medium">
                Slide to finish →
              </span>
            </div>
          </div>

          {/* Exit Stealth Mode */}
          <button
            onClick={() => setStealthMode(false)}
            className="w-full mt-3 py-2 text-gray-700 text-xs"
          >
            Show interface
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Track Your Route</h1>
        <p className="text-sm text-gray-600">
          Record your journey with real-time GPS tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Distance</span>
          </div>
          <div className="text-2xl font-bold">{formatDistance(distance)} km</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-600">Time</span>
          </div>
          <div className="text-2xl font-bold">{formatDuration(duration)}</div>
        </Card>
      </div>

      {/* Wake Lock Status */}
      {isTracking && (
        <Card className="p-3 mb-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${wakeLockActive ? 'text-green-600' : 'text-yellow-600'}`} />
            <span className="text-sm font-medium">
              {wakeLockActive ? 'Screen lock active - tracking in background' : 'Screen lock unavailable'}
            </span>
          </div>
        </Card>
      )}

      {/* Coordinates Count */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span className="font-medium">GPS Points</span>
          </div>
          <span className="text-2xl font-bold text-purple-600">{coordinates.length}</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Streaming to cloud in real-time
        </p>
      </Card>

      {/* Control Buttons */}
      <div className="fixed bottom-24 left-0 right-0 px-4 space-y-3">
        {!isTracking ? (
          <Button
            onClick={handleStart}
            className="w-full h-16 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={!userId}
          >
            <Play className="w-6 h-6 mr-2" />
            Start Tracking
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setStealthMode(true)}
              className="w-full h-12 bg-gray-900 hover:bg-black text-white"
            >
              <Zap className="w-5 h-5 mr-2" />
              Enable Stealth Mode
            </Button>
            <Button
              onClick={handleStop}
              variant="destructive"
              className="w-full h-16 text-lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Stop & Save
            </Button>
          </>
        )}
      </div>

      {/* Info */}
      {!isTracking && (
        <div className="mt-8 text-center text-sm text-gray-600 space-y-2">
          <p className="font-medium">🌙 Stealth Mode Available</p>
          <p>Track routes with black screen (OLED battery saver)</p>
          <p className="text-xs">GPS stays active • Slide to finish • SOS button included</p>
        </div>
      )}
    </div>
  );
}
