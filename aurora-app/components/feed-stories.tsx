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

import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Flame, Heart, Plus, Radio, Shield, Trophy } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { createAuroraAvatarDataUri } from "@/lib/avatar";

interface FeedStoriesProps {
  userId: Id<"users">;
}

interface StoryUser {
  avatarConfig?: {
    seed: string;
    backgroundColor: string;
  } | null;
  name?: string;
  _id: string;
}

interface LiveStory {
  _id: string;
  title: string;
  host: StoryUser | null;
  viewerCount: number;
  channelName: string;
}

function getAvatarUrl(user: StoryUser): string {
  if (user.avatarConfig) {
    const { seed, backgroundColor } = user.avatarConfig;
    return createAuroraAvatarDataUri({
      seed,
      backgroundColor,
    });
  }

  return createAuroraAvatarDataUri({
    seed: user.name || user._id,
    backgroundColor: "c9cef4",
  });
}

function StoryAvatar({
  user,
  alt,
  fallback,
}: {
  user: StoryUser;
  alt: string;
  fallback: ReactNode;
}) {
  if (!user.avatarConfig) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-aurora-lavender)]">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={getAvatarUrl(user)}
      alt={alt}
      className="h-full w-full object-cover"
    />
  );
}

export function FeedStories({ userId }: FeedStoriesProps) {
  const liveStreams = useQuery(api.livestreams.getLivestreams, { limit: 5 });
  const user = useQuery(api.users.getUser, { userId });

  const storyItems = [
    {
      id: "create",
      type: "create" as const,
      label: "Your Story",
      user: user
        ? ({
            _id: String(user._id),
            name: user.name,
            avatarConfig:
              user.avatarConfig &&
              typeof user.avatarConfig === "object" &&
              "seed" in user.avatarConfig &&
              "backgroundColor" in user.avatarConfig
                ? {
                    seed: String(user.avatarConfig.seed),
                    backgroundColor: String(user.avatarConfig.backgroundColor),
                  }
                : null,
          } satisfies StoryUser)
        : null,
    },
    ...((liveStreams || []) as LiveStory[]).map((stream) => ({
      id: stream._id,
      type: "live" as const,
      label: stream.title,
      user: stream.host,
      viewerCount: stream.viewerCount,
      channelName: stream.channelName,
    })),
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
    <div className="border-b border-[var(--border)] bg-[var(--card)] py-3">
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
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-[2px]">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--card)]">
                      {item.user ? (
                        <StoryAvatar
                          user={item.user}
                          alt="Your avatar"
                          fallback={<span className="text-lg">U</span>}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[var(--color-aurora-lavender)]">
                          <span className="text-lg">U</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--color-aurora-blue)]">
                    <Plus className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--foreground)]">Your Story</span>
              </Link>
            )}

            {item.type === "live" && item.user && (
              <Link href={`/live/${item.channelName}`} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-red-500 to-pink-500 p-[2px]">
                    <div className="h-full w-full overflow-hidden rounded-full bg-[var(--card)]">
                      <StoryAvatar
                        user={item.user}
                        alt={item.user.name || "Live"}
                        fallback={<Radio className="h-6 w-6 text-[var(--color-aurora-purple)]" />}
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    <Radio className="h-2 w-2" />
                    LIVE
                  </div>
                </div>
                <span className="max-w-[64px] truncate text-[10px] font-medium text-[var(--foreground)]">
                  {item.user.name?.split(" ")[0] || "Live"}
                </span>
                <span className="text-[8px] text-[var(--muted-foreground)]">
                  {item.viewerCount} watching
                </span>
              </Link>
            )}

            {(item.type === "safety" || item.type === "trending" || item.type === "challenges") && (
              <Link href={item.href || "#"} className="flex flex-col items-center gap-1">
                <div
                  className="h-16 w-16 rounded-full p-[2px]"
                  style={{
                    background: `linear-gradient(135deg, ${item.color}, ${item.color}80)`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--card)]">
                    {item.icon && <item.icon className="h-6 w-6" style={{ color: item.color }} />}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[var(--foreground)]">{item.label}</span>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FeedStoriesCompact({ userId }: FeedStoriesProps) {
  const liveStreams = useQuery(api.livestreams.getLivestreams, { limit: 3 });
  useQuery(api.users.getUser, { userId });

  const hasLive = Boolean(liveStreams && liveStreams.length > 0);

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
      <Link
        href="/create/reel"
        className="whitespace-nowrap rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] px-3 py-1.5 text-xs font-medium text-white"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" />
          Create
        </span>
      </Link>

      {hasLive && (
        <Link
          href="/live"
          className="whitespace-nowrap rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 animate-pulse"
        >
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            {liveStreams?.length || 0} Live
          </span>
        </Link>
      )}

      <Link
        href="/map"
        className="whitespace-nowrap rounded-full border border-[var(--color-aurora-mint)]/30 bg-[var(--color-aurora-mint)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-aurora-mint)]"
      >
        <span className="flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Safety
        </span>
      </Link>

      <Link
        href="/feed?sort=hot"
        className="whitespace-nowrap rounded-full border border-[var(--color-aurora-pink)]/30 bg-[var(--color-aurora-pink)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-aurora-pink)]"
      >
        <span className="flex items-center gap-1.5">
          <Flame className="h-3 w-3" />
          Hot
        </span>
      </Link>

      <Link
        href="/circles"
        className="whitespace-nowrap rounded-full border border-[var(--color-aurora-purple)]/30 bg-[var(--color-aurora-purple)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-aurora-purple)]"
      >
        <span className="flex items-center gap-1.5">
          <Heart className="h-3 w-3" />
          Circles
        </span>
      </Link>
    </div>
  );
}
