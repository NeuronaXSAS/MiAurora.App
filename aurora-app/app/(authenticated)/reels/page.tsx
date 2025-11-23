"use client";

import { useState, useEffect } from "react";
import { ReelsFeed } from "@/components/reels/reels-feed";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

export default function ReelsPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

  // Get user ID from cookie
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          // Not authenticated, redirect to home
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
      <ReelsFeed currentUserId={userId} />

      {/* Floating Create Button */}
      <Link href="/reels/create">
        <Button
          size="lg"
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 z-50"
        >
          <Camera className="w-6 h-6" />
        </Button>
      </Link>

      {/* Top Navigation Bar (Optional) */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Safety Reels</h1>
          <div className="flex gap-2">
            <button className="text-white/80 hover:text-white text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
              For You
            </button>
            <button className="text-white/80 hover:text-white text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
              Trending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
