"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Play, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Id } from "@/convex/_generated/dataModel";

// Dynamically import LivePlayer with no SSR to avoid Agora SDK issues
const LivePlayer = dynamic(
  () => import("@/components/live/live-player").then(mod => ({ default: mod.LivePlayer })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }
);

export default function LivePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedLivestream, setSelectedLivestream] = useState<Id<"livestreams"> | null>(null);
  const router = useRouter();

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/");
      }
    };
    getUserId();
  }, [router]);

  const livestreams = useQuery(api.livestreams.getLivestreams, { limit: 20 });

  // If viewing a livestream
  if (selectedLivestream && userId) {
    return (
      <LivePlayer
        livestreamId={selectedLivestream}
        userId={userId}
        onClose={() => setSelectedLivestream(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6 text-purple-600" />
                Aurora Live
              </h1>
              <p className="text-sm text-gray-600">
                Real-time safety streams from the community
              </p>
            </div>
            <Link href="/live/broadcast">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Video className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {livestreams === undefined && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {livestreams && livestreams.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Live Streams</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No one is streaming right now. Be the first to share your experience with the community!
            </p>
            <Link href="/live/broadcast">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Video className="w-5 h-5 mr-2" />
                Start Your First Stream
              </Button>
            </Link>
          </div>
        )}

        {/* Livestreams Grid */}
        {livestreams && livestreams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {livestreams.map((livestream) => (
              <button
                key={livestream._id}
                onClick={() => setSelectedLivestream(livestream._id)}
                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-xl transition-shadow text-left"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-pink-900">
                  {/* Live Indicator */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-white font-bold text-xs">LIVE</span>
                    </div>
                  </div>

                  {/* Viewer Count */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3 text-white" />
                      <span className="text-white font-medium text-xs">
                        {livestream.viewerCount}
                      </span>
                    </div>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-purple-600 ml-1" />
                    </div>
                  </div>

                  {/* Emergency Badge */}
                  {livestream.isEmergency && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <Badge className="bg-red-600 text-white">
                        🚨 Emergency
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {livestream.title}
                  </h3>

                  {livestream.host && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {livestream.host.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{livestream.host.name}</p>
                        <p className="text-xs text-gray-500">
                          Trust Score: {livestream.host.trustScore}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{livestream.viewerCount} watching</span>
                    {livestream.safetyMode && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Safety Mode
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
