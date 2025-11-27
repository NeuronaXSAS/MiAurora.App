"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RedditPostCard } from "@/components/reddit-post-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { RouteFeedCard } from "@/components/route-feed-card";
import { OpportunityFeedCard } from "@/components/opportunity-feed-card";
import { FeedAd } from "@/components/ads/feed-ad";
import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { AIChatCompanion } from "@/components/ai-chat-companion";
import { MobileFeed } from "./mobile-feed";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sparkles, MapPin, Users, Target, Share2, Copy, Mail,
  ChevronDown, Flame, TrendingUp, Clock, LayoutGrid, List,
  MessageCircle, Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

type SortOption = "best" | "hot" | "new" | "top";
type ViewMode = "card" | "compact";

export default function FeedPage() {
  const isMobile = useIsMobile();
  const [contentType, setContentType] = useState<string>("all");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showQuests, setShowQuests] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [showAIChat, setShowAIChat] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  useEffect(() => {
    if (user && !user.industry) {
      setShowOnboarding(true);
    }
  }, [user]);

  const feedItems = useQuery(api.feed.getUnifiedFeed, { limit: 50 });

  const verifyPost = useMutation(api.posts.verify);
  const deletePost = useMutation(api.posts.deletePost);
  const deleteRoute = useMutation(api.routes.deleteRoute);
  const deleteOpportunity = useMutation(api.opportunities.deleteOpportunity);

  const handleVerify = async (postId: Id<"posts">) => {
    if (!userId) return;
    try {
      await verifyPost({ postId, userId });
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  const handleDelete = async (postId: Id<"posts">) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost({ postId, userId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleRouteDelete = async (routeId: Id<"routes">) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this route?")) return;
    try {
      await deleteRoute({ routeId, userId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleOpportunityDelete = async (opportunityId: Id<"opportunities">) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      await deleteOpportunity({ opportunityId, userId });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Sort items
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

  if (isMobile) {
    return <MobileFeed />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Aurora-styled Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/feed" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-0.5">
                  <div className="w-full h-full rounded-[10px] bg-[var(--card)] flex items-center justify-center overflow-hidden">
                    <Image src="/Au_Logo_1.png" alt="Aurora" width={32} height={32} className="object-contain" />
                  </div>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">Your Feed</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Community intelligence for women</p>
              </div>
            </div>

            {/* Right actions: AI + Panic + Filter */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAIChat(true)}
                className="p-2 rounded-xl hover:bg-[var(--accent)] transition-colors"
                aria-label="AI Companion"
              >
                <MessageCircle className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              </button>

              <Link 
                href="/emergency"
                className="p-2 rounded-xl bg-[var(--color-aurora-orange)] hover:bg-[var(--color-aurora-orange)]/90 transition-colors shadow-lg"
                aria-label="Emergency"
              >
                <Shield className="w-5 h-5 text-white" />
              </Link>

              {isMounted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] text-sm">
                      {contentType === "all" ? "All" : contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[var(--card)] border-[var(--border)]">
                    {["all", "post", "poll", "route", "opportunity"].map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`text-[var(--foreground)] hover:bg-[var(--accent)] ${contentType === type ? "bg-[var(--accent)]" : ""}`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="max-w-3xl mx-auto px-4 py-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
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
                    className={`flex items-center gap-2 text-[var(--foreground)] hover:bg-[var(--accent)] ${sortBy === option.value ? "bg-[var(--accent)]" : ""}`}
                  >
                    <option.icon className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "card" ? "bg-[var(--accent)]" : "hover:bg-[var(--accent)]"}`}
              >
                <LayoutGrid className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "compact" ? "bg-[var(--accent)]" : "hover:bg-[var(--accent)]"}`}
              >
                <List className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="space-y-3">
          {/* Loading State */}
          {feedItems === undefined && (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          )}

          {/* Gamified Empty State */}
          {sortedItems.length === 0 && feedItems !== undefined && showQuests && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-[var(--foreground)]">Welcome to Your Feed!</h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-2">Complete these steps to get started and earn credits</p>
                <button onClick={() => setShowQuests(false)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors underline">
                  Hide quests
                </button>
              </div>

              <div className="grid gap-3">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Link href="/settings">
                    <div className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-aurora-purple)]/50 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--foreground)]">Complete Your Profile</h4>
                          <p className="text-[var(--muted-foreground)] text-sm truncate">Add bio, location, and goals</p>
                        </div>
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">+10</Badge>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Link href="/map">
                    <div className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-aurora-blue)]/50 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--color-aurora-blue)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-[var(--color-aurora-blue)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--foreground)]">Share Your First Location</h4>
                          <p className="text-[var(--muted-foreground)] text-sm truncate">Rate a place to help others</p>
                        </div>
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">+50</Badge>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div onClick={() => setShowShareDialog(true)} className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-aurora-pink)]/50 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--color-aurora-pink)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--foreground)]">Invite a Friend</h4>
                        <p className="text-[var(--muted-foreground)] text-sm truncate">Earn credits when they join</p>
                      </div>
                      <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">+15</Badge>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Show quests button when hidden */}
          {sortedItems.length === 0 && feedItems !== undefined && !showQuests && (
            <div className="text-center py-8">
              <button onClick={() => setShowQuests(true)} className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-6 py-3 text-[var(--foreground)] hover:bg-[var(--accent)] transition-all">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Show earning opportunities
              </button>
            </div>
          )}

          {/* Feed Items */}
          {sortedItems
            .filter((item: any) => {
              if (contentType === "all") return true;
              if (contentType === "poll") return item.type === "post" && item.postType === "poll";
              if (contentType === "post") return item.type === "post" && item.postType !== "poll";
              return item.type === contentType;
            })
            .map((item: any, index: number) => {
              const showAd = index > 0 && index % 5 === 0;
              return (
                <div key={item._id}>
                  {showAd && <FeedAd />}
                  {item.type === "post" && item.postType === "poll" && (
                    <PollCard post={item} currentUserId={userId || undefined} onDelete={() => handleDelete(item._id as Id<"posts">)} />
                  )}
                  {item.type === "post" && item.postType === "ai_chat" && (
                    <AIChatCard post={item} currentUserId={userId || undefined} onDelete={() => handleDelete(item._id as Id<"posts">)} />
                  )}
                  {item.type === "post" && item.postType !== "poll" && item.postType !== "ai_chat" && (
                    <RedditPostCard
                      post={item}
                      currentUserId={userId || undefined}
                      onVerify={() => handleVerify(item._id as Id<"posts">)}
                      onDelete={() => handleDelete(item._id as Id<"posts">)}
                      hasVerified={false}
                      showActions={true}
                    />
                  )}
                  {item.type === "route" && (
                    <RouteFeedCard route={item as any} currentUserId={userId || undefined} onDelete={() => handleRouteDelete(item._id as Id<"routes">)} />
                  )}
                  {item.type === "opportunity" && (
                    <OpportunityFeedCard opportunity={item as any} currentUserId={userId || undefined} onDelete={() => handleOpportunityDelete(item._id as Id<"opportunities">)} />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Onboarding Wizard */}
      {userId && <OnboardingWizard open={showOnboarding} onComplete={() => setShowOnboarding(false)} userId={userId} />}

      {/* AI Chat Companion */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAIChat(false)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <AIChatCompanion className="h-[600px]" />
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Share2 className="w-5 h-5" />
              Invite Friends to Aurora
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Share Aurora and earn 15 credits when your friends join!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?ref=${userId}`);
                alert("✅ Link copied!");
              }}
              className="w-full justify-start bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)]"
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-3" />
              Copy Invite Link
            </Button>
            <Button
              onClick={() => {
                const text = encodeURIComponent("Join me on Aurora - a safe space for women! 💜");
                const url = encodeURIComponent(`${window.location.origin}?ref=${userId}`);
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
              }}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            >
              Share on WhatsApp
            </Button>
            <Button
              onClick={() => {
                const subject = encodeURIComponent("Join me on Aurora!");
                const body = encodeURIComponent(`Join me on Aurora: ${window.location.origin}?ref=${userId}`);
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
              className="w-full justify-start bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)]"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-3" />
              Share via Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
