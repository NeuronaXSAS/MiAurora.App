"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Lock, 
  Globe, 
  UserX,
  MapPin,
  Clock,
  TrendingUp,
  Award,
  Play,
  Share2
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { formatDistance, formatDuration, formatPace } from "@/lib/gps-tracker";
import { formatDistanceToNow } from "date-fns";

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = params.routeId as Id<"routes">;
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

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

  const deleteRoute = useMutation(api.routes.deleteRoute);
  const updatePrivacy = useMutation(api.routes.updateRoutePrivacy);
  const shareToFeed = useMutation(api.routes.shareRouteToFeed);

  const handleDelete = async () => {
    if (!userId) return;
    
    try {
      await deleteRoute({ routeId, userId });
      router.push("/routes");
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route");
    }
  };

  const handlePrivacyChange = async (sharingLevel: "private" | "anonymous" | "public") => {
    if (!userId) return;
    
    try {
      await updatePrivacy({ routeId, userId, sharingLevel });
    } catch (error) {
      console.error("Error updating privacy:", error);
      alert("Failed to update privacy settings");
    }
  };

  const handleShareToFeed = async () => {
    if (!userId) return;
    
    try {
      await shareToFeed({ routeId, userId });
      alert("Route shared to feed successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to share route");
    }
  };

  const exportToGPX = () => {
    if (!route) return;

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Aurora App">
  <metadata>
    <name>${route.title}</name>
    <desc>${route.journalEntry || ""}</desc>
  </metadata>
  <trk>
    <name>${route.title}</name>
    <type>${route.routeType}</type>
    <trkseg>
${route.coordinates.map((coord: any) => `      <trkpt lat="${coord.lat}" lon="${coord.lng}">
        ${coord.elevation ? `<ele>${coord.elevation}</ele>` : ""}
        <time>${new Date(coord.timestamp).toISOString()}</time>
      </trkpt>`).join("\n")}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${route.title.replace(/\s+/g, "_")}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading route...</p>
        </div>
      </div>
    );
  }

  const pace = route.duration > 0 ? route.distance / (route.duration / 60) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 lg:top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/routes")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Routes
            </Button>
            <div className="flex gap-2">
              {!route?.isPrivate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareToFeed}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share to Feed
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToGPX}
              >
                <Download className="w-4 h-4 mr-2" />
                Export GPX
              </Button>
              {userId === route?.creatorId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title and Tags */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{route.title}</h1>
            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Distance</p>
                </div>
                <p className="text-2xl font-bold">{formatDistance(route.distance)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Duration</p>
                </div>
                <p className="text-2xl font-bold">{formatDuration(route.duration)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Play className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Pace</p>
                </div>
                <p className="text-2xl font-bold">{formatPace(pace)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Credits</p>
                </div>
                <p className="text-2xl font-bold">{route.creditsEarned}</p>
              </CardContent>
            </Card>
          </div>

          {/* Rating */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Your Rating</h3>
              <div className="flex items-center gap-2">
                <div className="text-3xl">{"⭐".repeat(route.rating)}</div>
                <span className="text-gray-600">({route.rating}/5)</span>
              </div>
            </CardContent>
          </Card>

          {/* Journal Entry */}
          {route.journalEntry && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Journal Entry</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{route.journalEntry}</p>
              </CardContent>
            </Card>
          )}

          {/* Voice Note */}
          {route.voiceNoteStorageId && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Voice Note</h3>
                <audio controls className="w-full">
                  <source src={`/api/files/${route.voiceNoteStorageId}`} type="audio/webm" />
                  Your browser does not support audio playback.
                </audio>
              </CardContent>
            </Card>
          )}

          {/* Locations */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Route Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Start</p>
                    <p className="font-medium">{route.startLocation.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">End</p>
                    <p className="font-medium">{route.endLocation.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="font-medium">
                      {formatDistanceToNow(route._creationTime, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Privacy Settings</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handlePrivacyChange("private")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    route.sharingLevel === "private"
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
                  onClick={() => handlePrivacyChange("anonymous")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    route.sharingLevel === "anonymous"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UserX className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div>
                      <p className="font-semibold">Anonymous</p>
                      <p className="text-sm text-gray-600">Share without your name (coordinates fuzzed)</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePrivacyChange("public")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    route.sharingLevel === "public"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 mt-0.5 text-gray-600" />
                    <div>
                      <p className="font-semibold">Public</p>
                      <p className="text-sm text-gray-600">Share with your name</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Delete Route?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this route? All GPS data, ratings, and reviews will be permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
