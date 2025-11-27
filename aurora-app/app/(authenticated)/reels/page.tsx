"use client";

import { useState, useEffect } from "react";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type FeedTab = "forYou" | "trending";

export default function ReelsPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>("forYou");
  const router = useRouter();

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

  if (!userId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Reels Feed */}
      <ReelsFeed 
        currentUserId={userId} 
        sortBy={activeTab === "trending" ? "trending" : "recent"}
      />

      {/* Floating Create Button */}
      <Link href="/reels/create">
        <Button
          size="lg"
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:from-[var(--color-aurora-violet)] hover:to-[var(--color-aurora-purple)] z-50 transition-all hover:scale-110"
        >
          <Camera className="w-6 h-6" />
        </Button>
      </Link>

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/70 via-black/40 to-transparent pt-4 pb-8 px-4 safe-area-inset-top">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/Au_Logo_1.png" alt="Aurora App" className="w-8 h-8" />
            <span className="text-white font-bold text-lg">Reels</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/10 backdrop-blur-sm rounded-full p-1">
            <button
              onClick={() => setActiveTab("forYou")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === "forYou"
                  ? "bg-white text-[var(--color-aurora-violet)]"
                  : "text-white/80 hover:text-white"
              )}
            >
              <Sparkles className="w-4 h-4" />
              For You
            </button>
            <button
              onClick={() => setActiveTab("trending")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === "trending"
                  ? "bg-white text-[var(--color-aurora-violet)]"
                  : "text-white/80 hover:text-white"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Trending
            </button>
          </div>

          {/* Spacer for balance */}
          <div className="w-8" />
        </div>
      </div>

      {/* Safety Tip Overlay (shows occasionally) */}
      <SafetyTip />
    </div>
  );
}

function SafetyTip() {
  const [show, setShow] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "💡 Double-tap to like a reel!",
    "🛡️ Share safety experiences to earn credits",
    "👥 Tag locations to help other women",
    "✨ Your reels help build safer communities",
  ];

  useEffect(() => {
    // Show tip after 3 seconds, then hide after 5 more seconds
    const showTimer = setTimeout(() => {
      setTipIndex(Math.floor(Math.random() * tips.length));
      setShow(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 8000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
      <div className="px-4 py-2 bg-[var(--color-aurora-purple)]/90 backdrop-blur-sm rounded-full text-white text-sm font-medium shadow-lg">
        {tips[tipIndex]}
      </div>
    </div>
  );
}
