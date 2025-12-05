"use client";

/**
 * Feed Stories - Instagram/TikTok style stories at top of feed
 * 
 * Shows:
 * - Live streams happening now (priority)
 * - Recent reels from followed users
 * - Safety alerts in your area
 * - Daily challenges/quests
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Radio, 
  Shield, 
  Sparkles, 
  Play,
  Heart,
  Flame,
  Trophy,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface FeedStoriesProps {
  userId: Id<"users">;
}

// Generate DiceBear avatar URL
function getAvatarUrl(user: { 
  avatarConfig?: { 
    seed: string; 
    backgroundColor: string;
  } | null;
  name?: string;
  _id: string;
}): string {
  if (user.avatarConfig) {
    const { seed, backgroundColor } = user.avatarConfig;
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor.replace('#', '')}`;
  }
  const seedValue = user.name || user._id;
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seedValue)}&backgroundColor=c9cef4`;
}

export function FeedStories({ userId }: FeedStoriesProps) {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  // Fetch live streams
  const liveStreams = useQuery(api.livestreams.getLivestreams, { limit: 5 });
  
  // Fetch user data for "Your Story"
  const user = useQuery(api.users.getUser, { userId });

  // Story items to display
  const storyItems = [
    // Your Story (Create)
    {
      id: "create",
      type: "create" as const,
      label: "Your Story",
      user: user,
    },
    // Live streams
    ...(liveStreams || []).map((stream: any) => ({
      id: stream._id,
      type: "live" as const,
      label: stream.title,
      user: stream.host,
      viewerCount: stream.viewerCount,
      channelName: stream.channelName,
    })),
    // Static story types
    {
      id: "safety",
      type: "safety" as const,
      label: "Safety Pulse",
      icon: Shield,
      color: "var(--color-aurora-mint)",
      href: "/map",
    },
    {
      id: "trending",
      type: "trending" as const,
      label: "Trending",
      icon: Flame,
      color: "var(--color-aurora-pink)",
      href: "/feed?sort=hot",
    },
    {
      id: "challenges",
      type: "challenges" as const,
      label: "Daily Quest",
      icon: Trophy,
      color: "var(--color-aurora-yellow)",
      href: "/challenges",
    },
  ];

  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] py-3">
      <div className="flex gap-3 overflow-x-auto px-3 scrollbar-hide">
        {storyItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0"
          >
            {item.type === "create" && (
              <Link href="/create/reel" className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center overflow-hidden">
                      {item.user?.avatarConfig ? (
                        <img 
                          src={getAvatarUrl(item.user as any)} 
                          alt="Your avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--color-aurora-lavender)] flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--color-aurora-blue)] rounded-full flex items-center justify-center border-2 border-[var(--card)]">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <span className="text-[10px] text-[var(--foreground)] font-medium">Your Story</span>
              </Link>
            )}

            {item.type === "live" && (
              <Link href={`/live/${item.channelName}`} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 p-[2px] animate-pulse">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[var(--card)]">
                      {item.user?.avatarConfig ? (
                        <img 
                          src={getAvatarUrl(item.user as any)} 
                          alt={item.user?.name || "Live"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--color-aurora-lavender)] flex items-center justify-center">
                          <Radio className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Radio className="w-2 h-2" />
                    LIVE
                  </div>
                </div>
                <span className="text-[10px] text-[var(--foreground)] font-medium truncate max-w-[64px]">
                  {item.user?.name?.split(" ")[0] || "Live"}
                </span>
                <span className="text-[8px] text-[var(--muted-foreground)]">
                  {item.viewerCount} watching
                </span>
              </Link>
            )}

            {(item.type === "safety" || item.type === "trending" || item.type === "challenges") && (
              <Link href={item.href || "#"} className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-full p-[2px]" style={{ 
                  background: `linear-gradient(135deg, ${item.color}, ${item.color}80)` 
                }}>
                  <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center">
                    {item.icon && <item.icon className="w-6 h-6" style={{ color: item.color }} />}
                  </div>
                </div>
                <span className="text-[10px] text-[var(--foreground)] font-medium">{item.label}</span>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact version for mobile - even smaller, more items visible
 */
export function FeedStoriesCompact({ userId }: FeedStoriesProps) {
  const liveStreams = useQuery(api.livestreams.getLivestreams, { limit: 3 });
  const user = useQuery(api.users.getUser, { userId });

  const hasLive = liveStreams && liveStreams.length > 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
      {/* Create Story */}
      <Link 
        href="/create/reel" 
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full text-white text-xs font-medium whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" />
        Create
      </Link>

      {/* Live indicator */}
      {hasLive && (
        <Link 
          href="/live" 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-500 text-xs font-medium whitespace-nowrap animate-pulse"
        >
          <Radio className="w-3 h-3" />
          {liveStreams.length} Live
        </Link>
      )}

      {/* Quick links */}
      <Link 
        href="/map" 
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-aurora-mint)]/10 border border-[var(--color-aurora-mint)]/30 rounded-full text-[var(--color-aurora-mint)] text-xs font-medium whitespace-nowrap"
      >
        <Shield className="w-3 h-3" />
        Safety
      </Link>

      <Link 
        href="/feed?sort=hot" 
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-pink)]/30 rounded-full text-[var(--color-aurora-pink)] text-xs font-medium whitespace-nowrap"
      >
        <Flame className="w-3 h-3" />
        Hot
      </Link>

      <Link 
        href="/circles" 
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-aurora-purple)]/10 border border-[var(--color-aurora-purple)]/30 rounded-full text-[var(--color-aurora-purple)] text-xs font-medium whitespace-nowrap"
      >
        <Heart className="w-3 h-3" />
        Circles
      </Link>
    </div>
  );
}
