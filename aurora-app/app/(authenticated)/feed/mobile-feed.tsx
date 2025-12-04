"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RedditPostCard } from "@/components/reddit-post-card";
import { MobileRouteCard } from "@/components/mobile-route-card";
import { ReelFeedCard } from "@/components/reel-feed-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { OpportunityFeedCard } from "@/components/opportunity-feed-card";
import { LivestreamFeedCard } from "@/components/livestream-feed-card";
import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { FeedAd } from "@/components/ads/feed-ad";
import { useDevicePerformance, useOptimizedAnimations } from "@/hooks/use-device-performance";
import { 
  Sparkles, 
  ChevronDown, 
  Flame, 
  TrendingUp, 
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "best" | "hot" | "new" | "top";
type ContentFilter = "all" | "posts" | "routes" | "polls" | "reels" | "opportunities" | "livestreams";

// Memoized feed item component for better performance
const FeedItem = memo(function FeedItem({ 
  item, 
  userId, 
  onVerify, 
  onDelete,
  isLowEnd 
}: { 
  item: any; 
  userId: Id<"users"> | null;
  onVerify: (id: Id<"posts">) => void;
  onDelete: (id: Id<"posts">) => void;
  isLowEnd: boolean;
}) {
  if (item.type === "route") {
    return (
      <MobileRouteCard
        route={item}
        safetyInsight={`Safety score: ${Math.round(item.rating * 20)}%`}
      />
    );
  }

  if (item.type === "post" && item.postType === "poll") {
    return (
      <PollCard
        post={item}
        currentUserId={userId || undefined}
        isMobile={true}
      />
    );
  }

  if (item.type === "post" && item.postType === "ai_chat") {
    return (
      <AIChatCard
        post={item}
        currentUserId={userId || undefined}
        isMobile={true}
      />
    );
  }

  if (item.type === "post" && (!item.postType || item.postType === "standard") && !item.route) {
    return (
      <RedditPostCard
        post={item}
        currentUserId={userId || undefined}
        onVerify={() => onVerify(item._id as Id<"posts">)}
        onDelete={() => onDelete(item._id as Id<"posts">)}
        showActions={true}
      />
    );
  }

  if (item.type === "post" && item.route) {
    return (
      <MobileRouteCard
        route={{
          ...item.route,
          _creationTime: item._creationTime,
          creatorId: item.authorId,
        }}
        safetyInsight={`Safety score: ${Math.round((item.route.rating || 0) * 20)}%`}
      />
    );
  }

  if (item.type === "post" && item.reel) {
    // Ensure reel has all required properties including _id and author
    const reelData = {
      _id: item.reel._id,
      _creationTime: item.reel._creationTime || item._creationTime,
      authorId: item.reel.authorId || item.authorId,
      videoUrl: item.reel.videoUrl,
      thumbnailUrl: item.reel.thumbnailUrl,
      caption: item.reel.caption,
      hashtags: item.reel.hashtags,
      location: item.reel.location,
      duration: item.reel.duration || 0,
      views: item.reel.views || 0,
      likes: item.reel.likes || 0,
      shares: item.reel.shares || 0,
      comments: item.reel.comments || 0,
      // Include author info for profile linking
      author: item.reel.author || item.author || null,
    };
    
    return (
      <ReelFeedCard
        reel={reelData}
        currentUserId={userId || undefined}
        onDelete={() => onDelete(item._id as Id<"posts">)}
        isMobile={true}
      />
    );
  }

  if (item.type === "opportunity") {
    return (
      <OpportunityFeedCard
        opportunity={item as any}
        currentUserId={userId || undefined}
      />
    );
  }

  if (item.type === "livestream") {
    return (
      <LivestreamFeedCard
        livestream={item as any}
        currentUserId={userId || undefined}
      />
    );
  }

  return null;
});

export function MobileFeed() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const [isPremium, setIsPremium] = useState(false);
  const [visibleItems, setVisibleItems] = useState(10); // Progressive loading

  // Device performance detection
  const { isLowEnd, isSlowNetwork, shouldReduceData } = useDevicePerformance();

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

  // Fetch unified feed with personalization based on user preferences
  const feedItems = useQuery(api.feed.getUnifiedFeed, {
    limit: 50,
    userId: userId || undefined,
  });

  // Mutations for post actions
  const verifyPost = useMutation(api.posts.verify);
  const deletePost = useMutation(api.posts.deletePost);

  // Handle verify post - memoized
  const handleVerify = useCallback(async (postId: Id<"posts">) => {
    if (!userId) return;
    try {
      await verifyPost({ postId, userId });
    } catch (error) {
      console.error("Verify error:", error);
    }
  }, [userId, verifyPost]);

  // Handle delete post - memoized
  const handleDelete = useCallback(async (postId: Id<"posts">) => {
    if (!userId) return;
    try {
      await deletePost({ postId, userId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  }, [userId, deletePost]);

  // Load more items on scroll - progressive loading for performance
  const loadMoreItems = useCallback(() => {
    setVisibleItems(prev => Math.min(prev + (isLowEnd ? 5 : 10), 50));
  }, [isLowEnd]);

  // Scroll handler for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 1000
      ) {
        loadMoreItems();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreItems]);

  // Sort items based on selection - memoized
  const sortedItems = useMemo(() => feedItems ? [...feedItems].sort((a: any, b: any) => {
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
  }) : [], [feedItems, sortBy]);

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
    { value: "livestreams", label: "Live" },
    { value: "opportunities", label: "Jobs" },
  ];

  const currentSort = sortOptions.find(opt => opt.value === sortBy) || sortOptions[0];
  const currentFilter = contentFilterOptions.find(opt => opt.value === contentFilter) || contentFilterOptions[0];

  // Filter items based on content type - memoized
  const filteredItems = useMemo(() => sortedItems.filter((item: any) => {
    if (contentFilter === "all") return true;
    if (contentFilter === "posts") {
      // Standard posts only - no routes, reels, or polls
      return item.type === "post" && !item.route && !item.reel && !item.reelId && !item.routeId && item.postType !== "poll" && item.postType !== "reel";
    }
    if (contentFilter === "routes") {
      // Routes - either standalone routes or posts linked to routes
      return item.type === "route" || (item.type === "post" && (item.route || item.routeId));
    }
    if (contentFilter === "polls") {
      // Polls only
      return item.type === "post" && item.postType === "poll";
    }
    if (contentFilter === "reels") {
      // Reels - posts linked to reels
      return item.type === "post" && (item.reel || item.reelId || item.postType === "reel");
    }
    if (contentFilter === "opportunities") {
      return item.type === "opportunity";
    }
    if (contentFilter === "livestreams") {
      return item.type === "livestream";
    }
    return true;
  }), [sortedItems, contentFilter]);

  // Progressive loading - only render visible items
  const displayedItems = useMemo(() => 
    filteredItems.slice(0, visibleItems), 
    [filteredItems, visibleItems]
  );

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
            <p className="text-center text-sm text-[var(--muted-foreground)] py-2">
              Loading your personalized feed...
            </p>
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

        {/* Network Status Indicator */}
        {isSlowNetwork && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-[var(--color-aurora-yellow)]/20 rounded-xl mb-3">
            <WifiOff className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
            <span className="text-xs text-[var(--foreground)]">Slow connection - Loading optimized content</span>
          </div>
        )}

        {/* Feed Items - Progressive Loading */}
        {displayedItems.map((item: any, index: number) => {
          const showSuggested = index === 3;
          // Show ad every 5 posts for free users (less on slow networks)
          const adFrequency = isSlowNetwork ? 8 : 5;
          const showAd = !isPremium && !shouldReduceData && index > 0 && index % adFrequency === 0;

          return (
            <div 
              key={item._id} 
              className="content-visibility-auto touch-feedback"
              style={{ containIntrinsicSize: 'auto 200px' }}
            >
              {/* Show ad before certain posts */}
              {showAd && <FeedAd isPremium={isPremium} />}

              {showSuggested && (
                <div className="px-1 py-2 flex items-center gap-2">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--muted-foreground)]">More posts</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              )}

              <FeedItem
                item={item}
                userId={userId}
                onVerify={handleVerify}
                onDelete={handleDelete}
                isLowEnd={isLowEnd}
              />
            </div>
          );
        })}

        {/* Load More Indicator */}
        {displayedItems.length < filteredItems.length && (
          <div className="py-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] rounded-full">
              <div className="w-4 h-4 border-2 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--muted-foreground)]">Loading more...</span>
            </div>
          </div>
        )}

        {/* End of Feed */}
        {displayedItems.length >= filteredItems.length && filteredItems.length > 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">You're all caught up! 🎉</p>
          </div>
        )}
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
