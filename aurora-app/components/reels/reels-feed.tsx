"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReelPlayer } from "./reel-player";
import { ReelAd, shouldShowReelAd } from "@/components/ads/reel-ad";
import { useIsPremium } from "@/components/ads/smart-ad";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ReelsFeedProps {
  currentUserId: Id<"users">;
  sortBy?: "recent" | "trending";
}

export function ReelsFeed({ currentUserId, sortBy = "recent" }: ReelsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const isPremium = useIsPremium();

  const feedData = useQuery(api.reels.getReelsFeed, {
    limit: 10,
    sortBy: sortBy === "trending" ? "trending" : "recent",
  });

  const likeReel = useMutation(api.reels.likeReel);

  const reels = feedData?.reels || [];
  const isLoading = feedData === undefined;

  // Handle scroll snap to detect active reel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setHasScrolled(true);
      const scrollTop = container.scrollTop;
      // Account for global header (60px)
      const itemHeight = window.innerHeight - 60;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, reels.length]);

  // Intersection Observer for more precise active detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0");
            setActiveIndex(index);
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [reels.length]);

  const handleLike = useCallback(async (reelId: Id<"reels">) => {
    await likeReel({ reelId, userId: currentUserId });
  }, [likeReel, currentUserId]);

  const handleComment = useCallback((reelId: Id<"reels">) => {
    // TODO: Open comments modal/sheet
    console.log("Comment on reel:", reelId);
  }, []);

  const handleShare = useCallback((reelId: Id<"reels">) => {
    // TODO: Open share sheet
    console.log("Share reel:", reelId);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-aurora-violet)] to-black">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-aurora-pink)] mb-4" />
        <p className="text-white/70 text-sm">Loading safety reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-aurora-violet)] to-black text-white p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center mb-6 animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">No Safety Reels Yet</h2>
        <p className="text-white/60 text-center mb-8 max-w-xs">
          Be the first to share your safety experience and help other women in your community!
        </p>
        <a
          href="/reels/create"
          className="px-8 py-4 bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Create First Reel
        </a>
        <div className="mt-8 text-center">
          <p className="text-[var(--color-aurora-yellow)] font-medium">🎁 Earn 20 credits</p>
          <p className="text-white/40 text-sm">for your first reel</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {reels.map((reel, index) => {
        // Calculate the actual index accounting for inserted ads
        const adsBeforeThis = isPremium ? 0 : Math.floor(index / 4);
        const actualIndex = index + adsBeforeThis;
        
        return (
          <div key={reel._id}>
            {/* Show ad every 5 items (after 4 reels) for non-premium users */}
            {!isPremium && index > 0 && index % 4 === 0 && (
              <div data-index={actualIndex - 1} data-type="ad">
                <ReelAd 
                  isActive={activeIndex === actualIndex - 1}
                  isPremium={isPremium}
                />
              </div>
            )}
            <div data-index={actualIndex}>
              <ReelPlayer
                reel={reel}
                isActive={actualIndex === activeIndex}
                currentUserId={currentUserId}
                onLike={() => handleLike(reel._id)}
                onComment={() => handleComment(reel._id)}
                onShare={() => handleShare(reel._id)}
              />
            </div>
          </div>
        );
      })}

      {/* Load More Indicator */}
      {feedData?.hasMore && (
        <div className="h-20 flex items-center justify-center bg-black">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
