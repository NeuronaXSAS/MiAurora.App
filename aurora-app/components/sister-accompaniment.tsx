"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateAvatarUrl } from "@/hooks/use-avatar";
import {
  MapPin,
  Navigation,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Square,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface SisterAccompanimentProps {
  userId: Id<"users">;
}

export function SisterAccompaniment({ userId }: SisterAccompanimentProps) {
  const [destination, setDestination] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Queries
  const activeSession = useQuery(api.locationSharing.getActiveSession, {
    userId,
  });
  const watchingSessions =
    useQuery(api.locationSharing.getWatchingSessions, { userId }) ?? [];
  const myGuardians = useQuery(api.guardians.getMyGuardians, { userId }) ?? [];

  // Mutations
  const startShare = useMutation(api.locationSharing.startLocationShare);
  const updateLocation = useMutation(api.locationSharing.updateLocation);
  const endShare = useMutation(api.locationSharing.endLocationShare);

  // Location tracking
  const startTracking = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    try {
      // Start the session
      const result = await startShare({
        userId,
        destination: destination || undefined,
      });

      setIsTracking(true);

      // Start watching position
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          if (result.sessionId) {
            await updateLocation({
              sessionId: result.sessionId,
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );

      setWatchId(id);
    } catch (error) {
      console.error("Error starting location share:", error);
      alert(
        "Failed to start location sharing. Make sure you have Aurora Guardians.",
      );
    }
  }, [userId, destination, startShare, updateLocation]);

  const stopTracking = useCallback(
    async (status: "arrived" | "cancelled" = "arrived") => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }

      if (activeSession) {
        await endShare({
          sessionId: activeSession._id,
          status,
        });
      }

      setIsTracking(false);
      setDestination("");
    },
    [watchId, activeSession, endShare],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Sync tracking state with active session
  useEffect(() => {
    if (activeSession && !isTracking) {
      setIsTracking(true);
    } else if (!activeSession && isTracking && watchId === null) {
      setIsTracking(false);
    }
  }, [activeSession, isTracking, watchId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Sister Accompaniment
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Share your journey with Aurora Guardians
          </p>
        </div>
      </div>

      {/* Active Sharing Session */}
      {activeSession ? (
        <Card className="border-[var(--color-aurora-mint)] bg-[var(--color-aurora-mint)]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <div className="w-3 h-3 bg-[var(--color-aurora-mint)] rounded-full animate-pulse" />
              Sharing Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Started{" "}
                  {formatDistanceToNow(activeSession.startedAt, {
                    addSuffix: true,
                  })}
                </p>
                {activeSession.destination && (
                  <p className="font-medium text-[var(--foreground)]">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {activeSession.destination}
                  </p>
                )}
              </div>
              <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
                {activeSession.sharedWith.length} guardians watching
              </Badge>
            </div>

            {activeSession.lastLocation && (
              <div className="space-y-2">
                {/* Live Location Map */}
                <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden border-2 border-[var(--color-aurora-mint)]">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${activeSession.lastLocation.lat},${activeSession.lastLocation.lng}&zoom=16`}
                  />
                  {/* Live indicator */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] px-2 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    En Vivo
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--card)] rounded-lg">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    📍 {activeSession.lastLocation.lat.toFixed(4)},{" "}
                    {activeSession.lastLocation.lng.toFixed(4)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${activeSession.lastLocation?.lat},${activeSession.lastLocation?.lng}`,
                        "_blank",
                      )
                    }
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Abrir en Maps
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => stopTracking("arrived")}
                className="flex-1 min-h-[44px] bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/80 text-[var(--color-aurora-violet)]"
              >
                <CheckCircle className="w-4 h-4 mr-2" />I Arrived Safely
              </Button>
              <Button
                variant="outline"
                onClick={() => stopTracking("cancelled")}
                className="min-h-[44px]"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Start Sharing */
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Navigation className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              Start Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myGuardians.length === 0 ? (
              <div className="text-center py-4">
                <Users className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                <p className="text-[var(--muted-foreground)]">
                  Add Aurora Guardians first to share your location
                </p>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Where are you going? (optional)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="min-h-[44px]"
                />

                <div className="p-3 bg-[var(--accent)] rounded-lg">
                  <p className="text-sm text-[var(--muted-foreground)] mb-2">
                    Will notify {myGuardians.length} guardian
                    {myGuardians.length !== 1 ? "s" : ""}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {myGuardians.slice(0, 5).map((g) => (
                      <Badge
                        key={g?.user._id}
                        variant="outline"
                        className="text-xs"
                      >
                        {g?.user.name}
                      </Badge>
                    ))}
                    {myGuardians.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{myGuardians.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={startTracking}
                  className="w-full min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-pink)]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Sharing Location
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Watching Others */}
      {watchingSessions.length > 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Eye className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Sisters You're Watching ({watchingSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {watchingSessions.map((session) => (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="p-4 rounded-xl border border-[var(--color-aurora-mint)]/50 bg-[var(--color-aurora-mint)]/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold">
                          {session.user?.avatarConfig ? (
                            <img
                              src={generateAvatarUrl(
                                session.user.avatarConfig as any,
                              )}
                              alt={session.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            session.user?.name.charAt(0)
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-aurora-mint)] rounded-full border-2 border-[var(--card)] flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">
                          {session.user?.name}
                        </p>
                        {session.destination && (
                          <p className="text-sm text-[var(--muted-foreground)]">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {session.destination}
                          </p>
                        )}
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Started{" "}
                          {formatDistanceToNow(session.startedAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
                      Live
                    </Badge>
                  </div>

                  {session.lastLocation && (
                    <div className="mt-3 space-y-2">
                      {/* Live Map for watched session */}
                      <div className="relative h-40 sm:h-48 rounded-lg overflow-hidden border-2 border-[var(--color-aurora-mint)]">
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${session.lastLocation.lat},${session.lastLocation.lng}&zoom=16`}
                        />
                        {/* Live indicator */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] px-2 py-1 rounded-full text-xs font-medium">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          En Vivo
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          📍 {session.lastLocation.lat.toFixed(4)},{" "}
                          {session.lastLocation.lng.toFixed(4)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${session.lastLocation?.lat},${session.lastLocation?.lng}`,
                              "_blank",
                            )
                          }
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-[var(--color-aurora-lavender)]/20 border-[var(--color-aurora-lavender)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Navigation className="w-5 h-5 text-[var(--color-aurora-purple)] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[var(--foreground)] mb-1">
                Sister Accompaniment
              </p>
              <p className="text-[var(--muted-foreground)]">
                Share your real-time location with your Aurora Guardians when
                traveling alone. They'll be notified when you start, and when
                you arrive safely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
