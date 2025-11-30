"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2, Crown, AlertCircle } from "lucide-react";

// Dynamically import BroadcastStudio with no SSR to avoid window/Agora SDK issues
const BroadcastStudio = dynamic(
  () => import("@/components/live/broadcast-studio").then(mod => ({ default: mod.BroadcastStudio })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }
);

export default function BroadcastPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const router = useRouter();

  // Get user ID and check rate limit
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
          setIsPremium(data.isPremium || false);
          
          // Check rate limit for livestreams
          const limit = data.isPremium ? 10 : 2;
          const stored = localStorage.getItem('aurora_usage');
          let used = 0;
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const today = new Date().toDateString();
              if (parsed.date === today) {
                used = parsed.usage?.livestreams || 0;
              }
            } catch (e) {}
          }
          
          if (used >= limit) {
            setIsRateLimited(true);
          }
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (isRateLimited) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-aurora-orange)]/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[var(--color-aurora-orange)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-gray-400">
              {isPremium 
                ? "You've reached your daily limit of 10 livestreams. Come back tomorrow!"
                : "You've used your 2 free livestreams today. Upgrade to Premium for 10 streams per day!"}
            </p>
          </div>
          {!isPremium && (
            <Link href="/premium">
              <Button className="bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] text-slate-900 hover:opacity-90 min-h-[44px]">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium - $5/month
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={() => router.push('/live')} className="min-h-[44px] text-white border-white/20">
            Back to Live
          </Button>
        </div>
      </div>
    );
  }

  return <BroadcastStudio userId={userId} />;
}
