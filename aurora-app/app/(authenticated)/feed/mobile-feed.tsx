"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RedditPostCard } from "@/components/reddit-post-card";
import { MobileRouteCard } from "@/components/mobile-route-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { 
  Sparkles, 
  ChevronDown, 
  Flame, 
  TrendingUp, 
  Clock,
  LayoutGrid,
  Bell,
  Search,
  User,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

type SortOption = "best" | "hot" | "new" | "top";

export function MobileFeed() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best");

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

  // Sort items based on selection
  const sortedItems = feedItems ? [...feedItems].sort((a: any, b: any) => {
    switch (sortBy) {
      case "hot":
        const aScore = (a.upvotes || 0) - (a.downvotes || 0) + (a.commentCount || 0) * 2;
        const bScore = (b.upvotes || 0) - (b.downvotes || 0) + (b.commentCount || 0) * 2;
        return bScore - aScore;
      case "new":
        return b._creationTime - a._creationTime;
      case "top":
        return ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0));
      case "best":
      default:
        // Best combines recency with engagement
        const aEngagement = (a.upvotes || 0) + (a.commentCount || 0);
        const bEngagement = (b.upvotes || 0) + (b.commentCount || 0);
        const aRecency = 1 / (Date.now() - a._creationTime + 1);
        const bRecency = 1 / (Date.now() - b._creationTime + 1);
        return (bEngagement * bRecency) - (aEngagement * aRecency);
    }
  }) : [];

  const sortOptions = [
    { value: "best", label: "Best", icon: Sparkles },
    { value: "hot", label: "Hot", icon: Flame },
    { value: "new", label: "New", icon: Clock },
    { value: "top", label: "Top", icon: TrendingUp },
  ];

  const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];

  return (
    <div className="bg-[#0e1113] min-h-screen">
      {/* Reddit-style Header */}
      <div className="sticky top-0 z-30 bg-[#1a1a1b] border-b border-[#343536]">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button className="p-1 -ml-1">
              <svg className="w-6 h-6 text-[#d7dadc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-aurora-purple)] flex items-center justify-center">
                <Image 
                  src="/Au_Logo_1.png" 
                  alt="Aurora" 
                  width={24} 
                  height={24}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-[#272729]">
              <Search className="w-5 h-5 text-[#d7dadc]" />
            </button>
            <button className="p-2 rounded-full hover:bg-[#272729]">
              <Bell className="w-5 h-5 text-[#d7dadc]" />
            </button>
            <button className="w-8 h-8 rounded-full bg-[var(--color-aurora-mint)] flex items-center justify-center">
              <User className="w-4 h-4 text-[#1a1a1b]" />
            </button>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-[#343536]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#272729] hover:bg-[#343536] text-[#d7dadc] text-sm font-medium">
                <currentSort.icon className="w-4 h-4" />
                {currentSort.label}
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[#1a1a1b] border-[#343536]">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`flex items-center gap-2 text-[#d7dadc] hover:bg-[#272729] ${
                    sortBy === option.value ? "bg-[#272729]" : ""
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="p-1.5 rounded hover:bg-[#272729]">
            <LayoutGrid className="w-5 h-5 text-[#818384]" />
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="py-2 space-y-2">
        {/* Loading State */}
        {feedItems === undefined && (
          <div className="px-2 space-y-2">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}

        {/* Empty State */}
        {sortedItems.length === 0 && feedItems !== undefined && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-[#272729] rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#818384]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[#d7dadc]">No posts yet</h3>
            <p className="text-[#818384] text-sm mb-4">
              Be the first to share something with the community!
            </p>
          </div>
        )}

        {/* Suggested for you label */}
        {sortedItems.length > 0 && (
          <div className="px-4 py-2">
            <span className="text-xs text-[#818384] font-medium">Suggested for you</span>
          </div>
        )}

        {/* Feed Items */}
        {sortedItems.map((item: any, index: number) => {
          // Show "Suggested for you" divider after first few items
          const showSuggested = index === 3;

          return (
            <div key={item._id}>
              {showSuggested && (
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="text-xs text-[#818384]">•••</span>
                </div>
              )}

              {item.type === "route" && (
                <div className="px-2">
                  <MobileRouteCard
                    route={item}
                    safetyInsight={`Safety score: ${Math.round(item.rating * 20)}%`}
                  />
                </div>
              )}

              {item.type === "post" && item.postType === "poll" && (
                <div className="px-2">
                  <PollCard
                    post={item}
                    currentUserId={userId || undefined}
                    isMobile={true}
                  />
                </div>
              )}

              {item.type === "post" && item.postType === "ai_chat" && (
                <div className="px-2">
                  <AIChatCard
                    post={item}
                    currentUserId={userId || undefined}
                    isMobile={true}
                  />
                </div>
              )}

              {item.type === "post" && (!item.postType || item.postType === "standard") && (
                <div className="px-2">
                  <RedditPostCard
                    post={item}
                    currentUserId={userId || undefined}
                    onVerify={() => {}}
                    onDelete={() => {}}
                    hasVerified={false}
                    showActions={true}
                  />
                </div>
              )}
            </div>
          );
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
