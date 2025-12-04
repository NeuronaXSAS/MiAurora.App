"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Video, Users, Play, Radio } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Id } from "@/convex/_generated/dataModel";

// Lazy load LivePlayer
const LivePlayer = dynamic(
  () => import("@/components/live/live-player").then(mod => ({ default: mod.LivePlayer })),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black z-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" /></div> }
);

export default function LivePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedLivestream, setSelectedLivestream] = useState<Id<"livestreams"> | null>(null);
  const router = useRouter();
  
  const cleanupStale = useMutation(api.livestreams.cleanupStaleLivestreams);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
          cleanupStale({}).catch(() => {});
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      }
    };
    init();
  }, [router, cleanupStale]);

  const livestreams = useQuery(api.livestreams.getLivestreams, { limit: 20 });

  if (selectedLivestream && userId) {
    return <LivePlayer livestreamId={selectedLivestream} userId={userId} onClose={() => setSelectedLivestream(null)} />;
  }

  const isLoading = livestreams === undefined;
  const hasStreams = livestreams && livestreams.length > 0;

  return (
    <div className="h-[calc(100dvh-60px)] flex flex-col bg-[var(--background)]">
      {/* Compact Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <h1 className="text-lg font-bold text-[var(--foreground)]">Live</h1>
        </div>
        <Link href="/live/broadcast">
          <Button size="sm" className="bg-[var(--color-aurora-purple)] min-h-[40px] px-4">
            <Video className="w-4 h-4 mr-1" /> Go Live
          </Button>
        </Link>
      </div>

      {/* Content - Fills remaining space */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--card)] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[var(--muted)]" />
                <div className="p-2 space-y-2">
                  <div className="h-3 bg-[var(--muted)] rounded w-3/4" />
                  <div className="h-2 bg-[var(--muted)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Streams Grid - Compact cards */}
        {hasStreams && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {livestreams.map((stream) => (
              <button
                key={stream._id}
                onClick={() => setSelectedLivestream(stream._id)}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--color-aurora-purple)]/50 transition-all text-left group"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-gradient-to-br from-[var(--color-aurora-purple)]/30 to-[var(--color-aurora-pink)]/30 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  {/* Live badge */}
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                    LIVE
                  </span>
                  {/* Viewers */}
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Users className="w-3 h-3" />{stream.viewerCount}
                  </span>
                  {/* Emergency */}
                  {stream.isEmergency && (
                    <span className="absolute top-2 right-2 bg-[var(--color-aurora-orange)] text-white text-[10px] px-1.5 py-0.5 rounded">
                      SOS
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="p-2">
                  <p className="font-medium text-sm text-[var(--foreground)] line-clamp-1">{stream.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{stream.host?.name || "Anonymous"}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty State - Compact */}
        {!isLoading && !hasStreams && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-[var(--color-aurora-purple)]" />
            </div>
            <h2 className="text-lg font-bold mb-1 text-[var(--foreground)]">No Live Streams</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-xs">
              Be the first to share your experience!
            </p>
            <Link href="/live/broadcast">
              <Button className="bg-[var(--color-aurora-purple)] min-h-[44px]">
                <Video className="w-4 h-4 mr-2" /> Start Streaming
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
