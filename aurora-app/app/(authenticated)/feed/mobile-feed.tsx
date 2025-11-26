"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MobileRouteCard } from "@/components/mobile-route-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { PostCard } from "@/components/post-card";
import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export function MobileFeed() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Get user data to check onboarding status
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  // Show onboarding if user has no industry set (first time)
  useEffect(() => {
    if (user && !user.industry) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Fetch unified feed
  const feedItems = useQuery(api.feed.getUnifiedFeed, {
    limit: 50,
  });

  // Show all content types for mobile
  const displayItems = feedItems || [];

  return (
    <div className="bg-[var(--background)] min-h-screen">
      {/* Header - Fixed with proper spacing for mobile menu button */}
      <div className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-4">
        <div className="ml-12">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Your Feed</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Discover and share community intelligence
          </p>
        </div>
      </div>
      
      {/* Feed Content */}
      <div className="px-3 py-4 space-y-4 max-w-2xl mx-auto">

      {/* Loading State */}
      {feedItems === undefined && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}

      {/* Empty State */}
      {displayItems.length === 0 && feedItems !== undefined && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[var(--color-aurora-purple)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No content yet</h3>
          <p className="text-[var(--muted-foreground)] mb-4">
            Be the first to share!
          </p>
        </div>
      )}

      {/* Feed Items */}
      {displayItems.map((item: any) => {
        if (item.type === "route") {
          // Generate AI safety insight (placeholder - will be enhanced with Gemini)
          const safetyScore = Math.round(item.rating * 20);
          const safetyInsight = safetyScore >= 70 
            ? `This route is ${safetyScore - 50}% safer than average paths in the area. Well-lit with good visibility.`
            : safetyScore >= 40
            ? `Moderate safety rating. Consider traveling during daylight hours.`
            : `Use caution on this route. Limited lighting and fewer people reported.`;

          return (
            <MobileRouteCard
              key={item._id}
              route={item}
              safetyInsight={safetyInsight}
            />
          );
        }

        if (item.type === "post" && item.postType === "poll") {
          return (
            <PollCard
              key={item._id}
              post={item}
              currentUserId={userId || undefined}
              isMobile={true}
            />
          );
        }

        if (item.type === "post" && item.postType === "ai_chat") {
          return (
            <AIChatCard
              key={item._id}
              post={item}
              currentUserId={userId || undefined}
              isMobile={true}
            />
          );
        }

        // Regular posts (no postType or standard postType)
        if (item.type === "post" && !item.postType) {
          return (
            <PostCard
              key={item._id}
              post={item}
              currentUserId={userId || undefined}
              onVerify={() => {}}
              onDelete={() => {}}
              hasVerified={false}
              showActions={true}
            />
          );
        }

        return null;
      })}
      </div>

      {/* Onboarding Wizard for new users */}
      {userId && (
        <OnboardingWizard
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          userId={userId}
        />
      )}
    </div>
  );
}
