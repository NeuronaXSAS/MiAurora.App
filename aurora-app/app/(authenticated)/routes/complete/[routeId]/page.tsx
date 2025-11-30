"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Lock, Globe, UserX, Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { formatDistance, formatDuration } from "@/lib/gps-tracker";
import { VoiceRecorder } from "@/components/voice-recorder";
import { useMutation as useConvexMutation } from "convex/react";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const AVAILABLE_TAGS = [
  "safe",
  "inspiring",
  "challenging",
  "healing",
  "accessible",
  "beautiful",
  "quiet",
  "scenic",
  "well-lit",
  "busy",
];

export default function CompleteRoutePage() {
  const params = useParams();
  const routeId = params.routeId as Id<"routes">;
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [journalEntry, setJournalEntry] = useState("");
  const [sharingLevel, setSharingLevel] = useState<"private" | "anonymous" | "public">("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<Blob | null>(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);

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

  const route = useQuery(
    api.routes.getRoute,
    routeId ? { routeId } : "skip"
  );

  const completeRoute = useMutation(api.routes.completeRoute);
  const generateUploadUrl = useConvexMutation(api.files.generateUploadUrl);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleVoiceRecording = (blob: Blob) => {
    setVoiceNoteBlob(blob);
  };

  const handleVoiceDelete = () => {
    setVoiceNoteBlob(null);
  };

  const handleSubmit = async () => {
    if (!userId || !route) return;

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (selectedTags.length === 0) {
      setError("Please select at least one tag");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload voice note if present
      let voiceNoteStorageId: Id<"_storage"> | undefined;
      if (voiceNoteBlob) {
        setUploadingVoice(true);
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": voiceNoteBlob.type },
          body: voiceNoteBlob,
        });
        const { storageId } = await result.json();
        voiceNoteStorageId = storageId;
        setUploadingVoice(false);
      }

      // Geocode start and end locations
      if (!route.coordinates || route.coordinates.length === 0) {
        setError("Route has no GPS data. Please track a route first.");
        return;
      }

      const startCoord = route.coordinates[0];
      const endCoord = route.coordinates[route.coordinates.length - 1];

      if (!startCoord || !endCoord) {
        setError("Invalid route coordinates");
        return;
      }

      const startLocationName = await reverseGeocode(startCoord.lat, startCoord.lng);
      const endLocationName = await reverseGeocode(endCoord.lat, endCoord.lng);

      await completeRoute({
        routeId,
        userId,
        title: title || `${route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)} Route`,
        distance: route.distance,
        duration: route.duration,
        elevationGain: route.elevationGain,
        startLocation: {
          lat: startCoord.lat,
          lng: startCoord.lng,
          name: startLocationName,
        },
        endLocation: {
          lat: endCoord.lat,
          lng: endCoord.lng,
          name: endLocationName,
        },
        tags: selectedTags,
        rating,
        journalEntry: journalEntry || undefined,
        voiceNoteStorageId,
        sharingLevel,
      });

      router.push("/routes");
    } catch (err: any) {
      setError(err.message || "Failed to save route");
    } finally {
      setLoading(false);
      setUploadingVoice(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
      );
      const data = await response.json();
      return data.features?.[0]?.place_name || "Unknown location";
    } catch {
      return "Unknown location";
    }
  };

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading route...</p>
      </div>
    );
  }

  // Calculate stats from coordinates if route has them
  const calculatedDistance = route.coordinates?.length > 1 
    ? route.coordinates.reduce((total: number, coord: any, i: number, arr: any[]) => {
        if (i === 0) return 0;
        const prev = arr[i - 1];
        const R = 6371e3;
        const φ1 = (prev.lat * Math.PI) / 180;
        const φ2 = (coord.lat * Math.PI) / 180;
        const Δφ = ((coord.lat - prev.lat) * Math.PI) / 180;
        const Δλ = ((coord.lng - prev.lng) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return total + R * c;
      }, 0)
    : route.distance;

  const calculatedDuration = route.coordinates?.length > 1
    ? Math.floor((route.coordinates[route.coordinates.length - 1]?.timestamp - route.coordinates[0]?.timestamp) / 1000)
    : route.duration;

  const displayDistance = calculatedDistance > 0 ? calculatedDistance : route.distance;
  const displayDuration = calculatedDuration > 0 ? calculatedDuration : route.duration;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--foreground)]">Complete Your Route</h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Add details and share with the community
          </p>

          {/* Route Summary with Map Preview */}
          <Card className="mb-6 bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-6">
              {/* Mini Map Preview */}
              {route.coordinates && route.coordinates.length > 1 && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4 border border-[var(--border)]">
                  <Map
                    mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                    initialViewState={{
                      longitude: route.coordinates[Math.floor(route.coordinates.length / 2)]?.lng || 0,
                      latitude: route.coordinates[Math.floor(route.coordinates.length / 2)]?.lat || 0,
                      zoom: 13,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl"
                    interactive={false}
                  >
                    <Source
                      type="geojson"
                      data={{
                        type: "Feature",
                        properties: {},
                        geometry: {
                          type: "LineString",
                          coordinates: route.coordinates.map((c: any) => [c.lng, c.lat]),
                        },
                      }}
                    >
                      <Layer
                        id="route-preview"
                        type="line"
                        paint={{
                          "line-color": "#f29de5",
                          "line-width": 4,
                          "line-opacity": 0.9,
                        }}
                      />
                    </Source>
                  </Map>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[var(--color-aurora-purple)]/10 rounded-xl p-3">
                  <p className="text-sm text-[var(--muted-foreground)]">Distance</p>
                  <p className="text-xl font-bold text-[var(--color-aurora-purple)]">{formatDistance(displayDistance)}</p>
                </div>
                <div className="bg-[var(--color-aurora-mint)]/10 rounded-xl p-3">
                  <p className="text-sm text-[var(--muted-foreground)]">Duration</p>
                  <p className="text-xl font-bold text-[var(--color-aurora-purple)]">{formatDuration(displayDuration)}</p>
                </div>
                <div className="bg-[var(--color-aurora-pink)]/10 rounded-xl p-3">
                  <p className="text-sm text-[var(--muted-foreground)]">Type</p>
                  <p className="text-xl font-bold capitalize text-[var(--color-aurora-purple)]">{route.routeType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">
                Route Title (Optional)
              </label>
              <Input
                placeholder="e.g., Morning run through Central Park"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="border-[var(--border)] bg-[var(--background)]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">
                Tags * (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                      selectedTags.includes(tag)
                        ? "bg-[var(--color-aurora-purple)] text-white"
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-lavender)]/50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">
                Overall Experience *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="focus:outline-none min-w-[44px] min-h-[44px]"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        value <= rating
                          ? "fill-[var(--color-aurora-yellow)] text-[var(--color-aurora-yellow)]"
                          : "text-[var(--muted-foreground)] hover:text-[var(--color-aurora-yellow)]/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {rating === 0 && "Rate your experience"}
                {rating === 1 && "Very Poor"}
                {rating === 2 && "Poor"}
                {rating === 3 && "Okay"}
                {rating === 4 && "Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>

            {/* Journal Entry */}
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">
                Journal Entry (Optional)
              </label>
              <Textarea
                placeholder="Share your thoughts, feelings, or observations about this route..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                rows={5}
                maxLength={2000}
                className="border-[var(--border)] bg-[var(--background)]"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {journalEntry.length}/2000 characters
                {journalEntry.length > 200 && <span className="text-[var(--color-aurora-yellow)]"> • +5 bonus credits for detailed entry!</span>}
              </p>
            </div>

            {/* Voice Note */}
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">
                Voice Note (Optional)
              </label>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                onRecordingDelete={handleVoiceDelete}
                maxDuration={180}
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Record up to 3 minutes to share your experience
              </p>
            </div>

            {/* Sharing Options */}
            <div>
              <label className="text-sm font-medium mb-3 block text-[var(--foreground)]">
                Sharing Preferences
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSharingLevel("private")}
                  className={`w-full p-4 rounded-xl border-2 transition-colors text-left min-h-[72px] ${
                    sharingLevel === "private"
                      ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                      : "border-[var(--border)] hover:border-[var(--color-aurora-lavender)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Lock className={`w-5 h-5 mt-0.5 ${sharingLevel === "private" ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]"}`} />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Private</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Only you can see this route</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingLevel("anonymous")}
                  className={`w-full p-4 rounded-xl border-2 transition-colors text-left min-h-[72px] ${
                    sharingLevel === "anonymous"
                      ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                      : "border-[var(--border)] hover:border-[var(--color-aurora-lavender)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UserX className={`w-5 h-5 mt-0.5 ${sharingLevel === "anonymous" ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]"}`} />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Anonymous • <span className="text-[var(--color-aurora-yellow)]">+15 credits</span></p>
                      <p className="text-sm text-[var(--muted-foreground)]">Share without your name</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingLevel("public")}
                  className={`w-full p-4 rounded-xl border-2 transition-colors text-left min-h-[72px] ${
                    sharingLevel === "public"
                      ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                      : "border-[var(--border)] hover:border-[var(--color-aurora-lavender)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Globe className={`w-5 h-5 mt-0.5 ${sharingLevel === "public" ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]"}`} />
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Public • <span className="text-[var(--color-aurora-yellow)]">+15 credits</span></p>
                      <p className="text-sm text-[var(--muted-foreground)]">Share with your name</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Credit Info */}
            {sharingLevel !== "private" && (
              <div className="bg-[var(--color-aurora-yellow)]/10 border border-[var(--color-aurora-yellow)]/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-[var(--foreground)]">
                      Earn <span className="text-[var(--color-aurora-yellow)] font-bold">{journalEntry.length > 200 ? "20" : "15"}</span> credits for sharing!
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      + 5 more credits each time someone completes your route
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-[var(--color-aurora-salmon)] bg-[var(--color-aurora-salmon)]/10 p-3 rounded-xl border border-[var(--color-aurora-salmon)]/30">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pb-safe">
              <Button
                variant="outline"
                onClick={() => router.push("/routes")}
                disabled={loading}
                className="flex-1 min-h-[48px] border-[var(--border)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || uploadingVoice}
                className="flex-1 min-h-[48px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white"
              >
                {uploadingVoice ? "Uploading voice..." : loading ? "Saving..." : "Save Route"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
