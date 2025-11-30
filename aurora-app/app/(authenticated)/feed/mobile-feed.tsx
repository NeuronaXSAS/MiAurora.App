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
import { AIChatCompanion } from "@/components/ai-chat-companion";
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
  Shield,
  Menu,
  Plus,
} from "lucide-react";
import { CreateOptionsModal } from "@/components/create-options-modal";
import { PostCreateDialog } from "@/components/post-create-dialog";
import { PollCreateDialog } from "@/components/poll-create-dialog";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";

type SortOption = "best" | "hot" | "new" | "top";

export function MobileFeed() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);

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
    <div className="bg-[var(--background)] min-h-screen">
      {/* Aurora-styled Header - Compact & Elegant */}
      <div className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: Menu + AI Chat (Aurora Logo) */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            
            {/* AI Chat - Aurora Logo */}
            <button 
              onClick={() => setShowAIChat(true)}
              className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-0.5 hover:scale-105 transition-transform"
              aria-label="Aurora AI Chat"
            >
              <div className="w-full h-full rounded-[9px] bg-[var(--card)] flex items-center justify-center">
                <Image src="/Au_Logo_1.png" alt="Aurora AI" width={24} height={24} className="object-contain" />
              </div>
            </button>
          </div>

          {/* Center: Create Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
            aria-label="Create"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium hidden xs:inline">Create</span>
          </button>

          {/* Right: Emergency + Search + Notifications + Profile */}
          <div className="flex items-center gap-1">
            {/* Emergency - Orange EXCLUSIVE */}
            <Link 
              href="/emergency"
              className="p-2 rounded-lg bg-[var(--color-aurora-orange)] hover:bg-[var(--color-aurora-orange)]/90 transition-colors shadow-md"
              aria-label="Emergency"
            >
              <Shield className="w-5 h-5 text-white" />
            </Link>

            <button className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors">
              <Search className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            
            <button className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors">
              <Bell className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-[var(--border)]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] text-sm font-medium transition-colors">
                <currentSort.icon className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                {currentSort.label}
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
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

          <button className="p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors ml-auto">
            <LayoutGrid className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
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
        {sortedItems.map((item: any, index: number) => {
          const showSuggested = index === 3;

          return (
            <div key={item._id}>
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

              {item.type === "post" && (!item.postType || item.postType === "standard") && (
                <RedditPostCard
                  post={item}
                  currentUserId={userId || undefined}
                  onVerify={() => {}}
                  onDelete={() => {}}
                  hasVerified={false}
                  showActions={true}
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

      {/* AI Chat Companion Modal */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowAIChat(false)}>
          <div className="w-full sm:max-w-lg sm:p-4" onClick={(e) => e.stopPropagation()}>
            <AIChatCompanion className="h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-2xl" />
          </div>
        </div>
      )}

      {/* Create Modals */}
      <CreateOptionsModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSelectPost={() => setShowPostDialog(true)}
        onSelectPoll={() => setShowPollDialog(true)}
      />
      {userId && (
        <>
          <PostCreateDialog open={showPostDialog} onOpenChange={setShowPostDialog} userId={userId} />
          <PollCreateDialog open={showPollDialog} onOpenChange={setShowPollDialog} userId={userId} />
        </>
      )}
    </div>
  );
}
