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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-[var(--foreground)]">
                <Video className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                Aurora Live
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Real-time safety streams from the community
              </p>
            </div>
            <Link href="/live/broadcast">
              <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]">
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
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-[var(--accent)]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[var(--accent)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--accent)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Streams Grid - Show real streams */}
        {livestreams !== undefined && livestreams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {livestreams.map((stream) => (
              <button
                key={stream._id}
                onClick={() => setSelectedLivestream(stream._id)}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--color-aurora-purple)]/50 transition-all text-left group"
              >
                {/* Thumbnail/Preview */}
                <div className="aspect-video bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-[var(--color-aurora-purple)] opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Live Badge */}
                  <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 animate-pulse">
                    🔴 LIVE
                  </Badge>
                  {/* Viewer Count */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Users className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-medium">{stream.viewerCount}</span>
                  </div>
                  {/* Emergency Badge */}
                  {stream.isEmergency && (
                    <Badge className="absolute top-3 right-3 bg-[var(--color-aurora-orange)] text-white border-0">
                      🆘 Emergency
                    </Badge>
                  )}
                </div>
                {/* Stream Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 mb-1">
                    {stream.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white text-xs">
                      {stream.host?.name?.charAt(0) || "?"}
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {stream.host?.name || "Anonymous"}
                    </span>
                  </div>
                  {stream.location && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-2 truncate">
                      📍 {stream.location.name}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State - Show when no REAL live streams */}
        {livestreams !== undefined && livestreams.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-[var(--color-aurora-purple)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--foreground)]">No Live Streams</h2>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              No one is streaming right now. Be the first to share your experience with the community!
            </p>
            <Link href="/live/broadcast">
              <Button size="lg" className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]">
                <Video className="w-5 h-5 mr-2" />
                Start Your First Stream
              </Button>
            </Link>
          </div>
        )}


      </div>
    </div>
  );
}
