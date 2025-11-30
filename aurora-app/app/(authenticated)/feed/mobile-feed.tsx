"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RedditPostCard } from "@/components/reddit-post-card";
import { MobileRouteCard } from "@/components/mobile-route-card";
import { ReelFeedCard } from "@/components/reel-feed-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { FeedAd } from "@/components/ads/feed-ad";
import { 
  Sparkles, 
  ChevronDown, 
  Flame, 
  TrendingUp, 
  Clock,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "best" | "hot" | "new" | "top";
type ContentFilter = "all" | "posts" | "routes" | "polls" | "reels" | "opportunities";

export function MobileFeed() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [isPremium, setIsPremium] = useState(false);

  // Get user ID and premium status
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
          setIsPremium(data.isPremium || false);
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

  // Mutations for post actions
  const verifyPost = useMutation(api.posts.verify);
  const deletePost = useMutation(api.posts.deletePost);

  // Handle verify post
  const handleVerify = async (postId: Id<"posts">) => {
    if (!userId) return;
    try {
      await verifyPost({ postId, userId });
    } catch (error) {
      console.error("Verify error:", error);
    }
  };

  // Handle delete post
  const handleDelete = async (postId: Id<"posts">) => {
    if (!userId) return;
    try {
      await deletePost({ postId, userId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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

  const contentFilterOptions: { value: ContentFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "posts", label: "Posts" },
    { value: "routes", label: "Routes" },
    { value: "polls", label: "Polls" },
    { value: "reels", label: "Reels" },
    { value: "opportunities", label: "Jobs" },
  ];

  const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];
  const currentFilter = contentFilterOptions.find(opt => opt.value === contentFilter) || contentFilterOptions[0];

  // Filter items based on content type
  const filteredItems = sortedItems.filter((item: any) => {
    if (contentFilter === "all") return true;
    if (contentFilter === "posts") return item.type === "post" && !item.route && !item.reel && item.postType !== "poll";
    if (contentFilter === "routes") return item.type === "route" || (item.type === "post" && item.route);
    if (contentFilter === "polls") return item.type === "post" && item.postType === "poll";
    if (contentFilter === "reels") return item.type === "post" && item.reel;
    if (contentFilter === "opportunities") return item.type === "opportunity";
    return true;
  });

  return (
    <div className="bg-[var(--background)] min-h-screen">
      {/* Sort & Filter Bar */}
      <div className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] text-sm font-medium transition-colors min-h-[36px] whitespace-nowrap">
                <currentSort.icon className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                {currentSort.label}
                <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[var(--card)] border-[var(--border)]">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`flex items-center gap-2 text-[var(--foreground)] hover:bg-[var(--accent)] ${
                    sortBy === option.value ? "bg-[var(--accent)]" : ""
                  }`}
                >
                  <option.icon className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Content Type Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-aurora-purple)]/10 hover:bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] text-sm font-medium transition-colors min-h-[36px] whitespace-nowrap border border-[var(--color-aurora-purple)]/30">
                {currentFilter.label}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-[var(--card)] border-[var(--border)]">
              {contentFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setContentFilter(option.value)}
                  className={`text-[var(--foreground)] hover:bg-[var(--accent)] ${
                    contentFilter === option.value ? "bg-[var(--accent)] font-medium" : ""
                  }`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Feed Content */}
      <div className="py-3 space-y-3 px-3">
        {/* Loading State */}
        {feedItems === undefined && (
          <div className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}

        {/* Empty State */}
        {sortedItems.length === 0 && feedItems !== undefined && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[var(--color-aurora-purple)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No posts yet</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-4">
              Be the first to share something with the community!
            </p>
          </div>
        )}

        {/* Suggested for you label */}
        {sortedItems.length > 0 && (
          <div className="px-1 py-1">
            <span className="text-xs text-[var(--muted-foreground)] font-medium">Suggested for you</span>
          </div>
        )}

        {/* Feed Items */}
        {filteredItems.map((item: any, index: number) => {
          const showSuggested = index === 3;
          // Show ad every 5 posts for free users
          const showAd = !isPremium && index > 0 && index % 5 === 0;

          return (
            <div key={item._id}>
              {/* Show ad before certain posts */}
              {showAd && <FeedAd isPremium={isPremium} />}

              {showSuggested && (
                <div className="px-1 py-2 flex items-center gap-2">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--muted-foreground)]">More posts</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              )}

              {item.type === "route" && (
                <MobileRouteCard
                  route={item}
                  safetyInsight={`Safety score: ${Math.round(item.rating * 20)}%`}
                />
              )}

              {item.type === "post" && item.postType === "poll" && (
                <PollCard
                  post={item}
                  currentUserId={userId || undefined}
                  isMobile={true}
                />
              )}

              {item.type === "post" && item.postType === "ai_chat" && (
                <AIChatCard
                  post={item}
                  currentUserId={userId || undefined}
                  isMobile={true}
                />
              )}

              {item.type === "post" && (!item.postType || item.postType === "standard") && !item.route && (
                <RedditPostCard
                  post={item}
                  currentUserId={userId || undefined}
                  onVerify={() => handleVerify(item._id as Id<"posts">)}
                  onDelete={() => handleDelete(item._id as Id<"posts">)}
                  showActions={true}
                />
              )}

              {item.type === "post" && item.route && (
                <MobileRouteCard
                  route={{
                    ...item.route,
                    _creationTime: item._creationTime,
                    creatorId: item.authorId,
                  }}
                  safetyInsight={`Safety score: ${Math.round((item.route.rating || 0) * 20)}%`}
                />
              )}

              {item.type === "post" && item.reel && (
                <ReelFeedCard
                  reel={{
                    ...item.reel,
                    _creationTime: item._creationTime,
                  }}
                  currentUserId={userId || undefined}
                  onDelete={() => handleDelete(item._id as Id<"posts">)}
                  isMobile={true}
                />
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
