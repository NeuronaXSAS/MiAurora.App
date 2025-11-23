"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReelPlayer } from "./reel-player";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface ReelsFeedProps {
  currentUserId: Id<"users">;
}

export function ReelsFeed({ currentUserId }: ReelsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  
  const feedData = useQuery(api.reels.getReelsFeed, {
    limit: 10,
    sortBy: "recent",
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
      const itemHeight = window.innerHeight;
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
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-8">
        <p className="text-xl font-semibold mb-2">No reels yet</p>
        <p className="text-white/60 text-center">
          Be the first to share your safety experience!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
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
      
      {reels.map((reel, index) => (
        <div key={reel._id} data-index={index}>
          <ReelPlayer
            reel={reel}
            isActive={index === activeIndex}
            onLike={() => handleLike(reel._id)}
            onComment={() => handleComment(reel._id)}
            onShare={() => handleShare(reel._id)}
          />
        </div>
      ))}

      {/* Load More Indicator */}
      {feedData?.hasMore && (
        <div className="h-20 flex items-center justify-center bg-black">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
