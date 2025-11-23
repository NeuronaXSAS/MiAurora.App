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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Complete Your Route</h1>
          <p className="text-gray-600 mb-6">
            Add details and share with the community
          </p>

          {/* Route Summary */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="text-xl font-bold">{formatDistance(route.distance)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-xl font-bold">{formatDuration(route.duration)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-xl font-bold capitalize">{route.routeType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Route Title (Optional)
              </label>
              <Input
                placeholder="e.g., Morning run through Central Park"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tags * (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Overall Experience *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        value <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
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
              <label className="text-sm font-medium mb-2 block">
                Journal Entry (Optional)
              </label>
              <Textarea
                placeholder="Share your thoughts, feelings, or observations about this route..."
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {journalEntry.length}/2000 characters
                {journalEntry.length > 200 && " • +5 bonus credits for detailed entry!"}
              </p>
            </div>

            {/* Voice Note */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Voice Note (Optional)
              </label>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                onRecordingDelete={handleVoiceDelete}
                maxDuration={180}
              />
              <p className="text-xs text-gray-500 mt-1">
                Record up to 3 minutes to share your experience
              </p>
            </div>

            {/* Sharing Options */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Sharing Preferences
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSharingLevel("private")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    sharingLevel === "private"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div>
                      <p className="font-semibold">Private</p>
                      <p className="text-sm text-gray-600">Only you can see this route</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingLevel("anonymous")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    sharingLevel === "anonymous"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UserX className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div>
                      <p className="font-semibold">Anonymous • +15 credits</p>
                      <p className="text-sm text-gray-600">Share without your name</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSharingLevel("public")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    sharingLevel === "public"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div>
                      <p className="font-semibold">Public • +15 credits</p>
                      <p className="text-sm text-gray-600">Share with your name</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Credit Info */}
            {sharingLevel !== "private" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-purple-900">
                      Earn {journalEntry.length > 200 ? "20" : "15"} credits for sharing!
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      + 5 more credits each time someone completes your route
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/routes")}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || uploadingVoice}
                className="flex-1"
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
