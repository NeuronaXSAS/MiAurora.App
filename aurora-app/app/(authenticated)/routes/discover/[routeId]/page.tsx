"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  MapPin,
  Clock,
  TrendingUp,
  Star,
  Users,
  Play,
  Bookmark,
  MessageSquare,
  Navigation,
  Trash2
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { formatDistance, formatDuration, formatPace } from "@/lib/gps-tracker";
import { formatDistanceToNow } from "date-fns";

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

export default function CommunityRouteDetailPage() {
  const params = useParams();
  const routeId = params.routeId as Id<"routes">;
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const completeRoute = useMutation(api.routes.completeCommunityRoute);
  const deleteRoute = useMutation(api.routes.deleteRoute);

  const handleDelete = async () => {
    if (!userId) return;

    if (!confirm("Are you sure you want to delete this route? All GPS data, ratings, and reviews will be permanently removed.")) {
      return;
    }

    try {
      await deleteRoute({ routeId, userId });
      router.push("/routes");
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route: " + (error as Error).message);
    }
  };

  const toggleTag = (tag: string) => {
    setUserTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitCompletion = async () => {
    if (!userId || userRating === 0) {
      alert("Please provide a rating");
      return;
    }

    setSubmitting(true);
    try {
      await completeRoute({
        routeId,
        userId,
        userRating,
        userTags,
        feedback: feedback || undefined,
      });
      setShowCompletionDialog(false);
      alert("Thank you for completing this route! The creator has been awarded 5 credits.");
    } catch (error: any) {
      alert(error.message || "Failed to submit completion");
    } finally {
      setSubmitting(false);
    }
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
  const avgRating = route.verificationCount > 0 ? route.totalRating / route.verificationCount : route.rating;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 lg:top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/routes/discover")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discovery
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/routes/navigate/${routeId}`)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCompletionDialog(true)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start This Route
                </Button>
                {userId === route?.creatorId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title and Creator */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{route.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Created by {route.creator.name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(route._creationTime, { addSuffix: true })}</span>
            </div>
          </div>

          {/* Tags */}
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

          {/* Map Preview Placeholder */}
          <Card>
            <CardContent className="p-0">
              <div className="w-full h-96 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-600">Route map preview</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <Star className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}/5</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <p className="text-2xl font-bold">{route.completionCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Journal Entry */}
          {route.journalEntry && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Creator's Notes
                </h3>
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
                  <Play className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Pace</p>
                    <p className="font-medium">{formatPace(pace)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Feedback Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Community Feedback</h3>
              <p className="text-gray-600 text-sm">
                {route.verificationCount} {route.verificationCount === 1 ? "person has" : "people have"} completed this route
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Dialog */}
      {showCompletionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Complete This Route</h3>
              <p className="text-gray-600 mb-6">
                Share your experience to help other women and earn credits!
              </p>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Your Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setUserRating(value)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            value <= userRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tags (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          userTags.includes(tag)
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Feedback (Optional)
                  </label>
                  <Textarea
                    placeholder="Share your thoughts about this route..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {feedback.length}/500 characters
                  </p>
                </div>

                {/* Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-900">
                    The route creator will earn 5 credits when you complete their route!
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompletionDialog(false)}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitCompletion}
                    disabled={submitting || userRating === 0}
                    className="flex-1"
                  >
                    {submitting ? "Submitting..." : "Submit Completion"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
