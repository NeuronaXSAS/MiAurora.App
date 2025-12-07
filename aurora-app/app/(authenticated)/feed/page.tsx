"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RedditPostCard } from "@/components/reddit-post-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { RouteFeedCard } from "@/components/route-feed-card";
import { ReelFeedCard } from "@/components/reel-feed-card";
import { OpportunityFeedCard } from "@/components/opportunity-feed-card";
import { SisterSpotlightCard } from "@/components/sister-spotlight-card";
import { FeedAd } from "@/components/ads/feed-ad";

import { OnboardingWizard } from "@/components/onboarding-wizard";
import { AIChatCompanion } from "@/components/ai-chat-companion";
import { MobileFeed } from "./mobile-feed";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { SafetyPulse } from "@/components/safety-pulse";
import { WelcomeExperience } from "@/components/welcome-experience";
import { ValuePropositionBanner } from "@/components/value-proposition-banner";
import { FeedLoadingSkeleton } from "@/components/loading-skeleton";
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
  Shield, Heart, Briefcase, MessageSquare, ArrowRight,
} from "lucide-react";
import { CreateOptionsModal } from "@/components/create-options-modal";
import { PostCreateDialog } from "@/components/post-create-dialog";
import { PollCreateDialog } from "@/components/poll-create-dialog";
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

type SortOption = "best" | "hot" | "new" | "top";
type ViewMode = "card" | "immersive";

export default function FeedPage() {
  const isMobile = useIsMobile();
  const [contentType, setContentType] = useState<string>("all");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showQuests, setShowQuests] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  
  // Import ImmersiveFeed for desktop TikTok-style view
  const ImmersiveFeed = require("@/components/immersive-feed").ImmersiveFeed;
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
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

  // Fetch unified feed with personalization based on user preferences
  const feedItems = useQuery(api.feed.getUnifiedFeed, { 
    limit: 50,
    userId: userId || undefined,
  });

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

  // Desktop Immersive View (TikTok-style)
  if (viewMode === "immersive") {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Minimal header for immersive mode */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setViewMode("card")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Card View</span>
            </button>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors">
                    <currentSort.icon className="w-4 h-4" />
                    {currentSort.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
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
            </div>
          </div>
        </div>
        
        {/* Full-screen immersive feed */}
        <ImmersiveFeed userId={userId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sort & Filter Bar - No duplicate header, uses GlobalHeader from layout */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] text-sm font-medium transition-colors min-h-[40px]">
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

            {isMounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)] text-sm min-h-[40px]">
                    {contentType === "all" ? "All" : contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[var(--card)] border-[var(--border)]">
                  {[
                    { value: "all", label: "All" },
                    { value: "post", label: "Posts" },
                    { value: "poll", label: "Polls" },
                    { value: "reel", label: "Reels" },
                    { value: "route", label: "Routes" },
                    { value: "opportunity", label: "Opportunities" },
                    { value: "ai_chat", label: "AI Chats" },
                  ].map((type) => (
                    <DropdownMenuItem
                      key={type.value}
                      onClick={() => setContentType(type.value)}
                      className={`text-[var(--foreground)] hover:bg-[var(--accent)] ${contentType === type.value ? "bg-[var(--accent)]" : ""}`}
                    >
                      {type.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode("card")}
                className="p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]"
                title="Card View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("immersive")}
                className="p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                title="Immersive View (TikTok-style)"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content - Reddit-style: Wide Feed + Right Sidebar */}
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Main Feed Column - Full width focus */}
          <div className="space-y-3 min-w-0">
            {/* Loading State - Fast visual feedback */}
          {feedItems === undefined && (
            <FeedLoadingSkeleton />
          )}
          
          {/* Value Proposition Banner - Shows Aurora App's value */}
          {feedItems !== undefined && sortedItems.length > 0 && (
            <ValuePropositionBanner variant="minimal" dismissible={true} className="mb-1" />
          )}

          {/* Welcome Experience for new users only */}
          {userId && user && !user.onboardingCompleted && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <WelcomeExperience userId={userId} />
            </motion.div>
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

          {/* Feed Items - Smooth staggered loading */}
          {sortedItems
            .filter((item: any) => {
              // Safety check - skip null/undefined items
              if (!item || !item._id) return false;
              
              if (contentType === "all") return true;
              if (contentType === "poll") return item.type === "post" && item.postType === "poll";
              if (contentType === "reel") return item.type === "post" && (item.postType === "reel" || item.reel || item.reelId);
              if (contentType === "ai_chat") return item.type === "post" && item.postType === "ai_chat";
              if (contentType === "post") return item.type === "post" && (!item.postType || item.postType === "standard") && !item.route && !item.reel && !item.reelId;
              if (contentType === "route") return item.type === "route" || (item.type === "post" && (item.route || item.routeId));
              return item.type === contentType;
            })
            .map((item: any, index: number) => {
              // Safety check for rendering
              if (!item || !item._id) return null;
              
              const showAd = index > 0 && index % 5 === 0;
              const showSisterSpotlight = index === 3; // Show after 3rd post
              const isReel = item.type === "post" && (item.reel || item.reelId || item.postType === "reel");
              const isPoll = item.type === "post" && item.postType === "poll";
              const isAIChat = item.type === "post" && item.postType === "ai_chat";
              const isRoutePost = item.type === "post" && (item.route || item.routeId);
              const isStandardPost = item.type === "post" && !isReel && !isPoll && !isAIChat && !isRoutePost;
              
              return (
                <motion.div 
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
                  className="feed-item card-interactive"
                >
                  {/* Sister Spotlight - Fun people discovery */}
                  {showSisterSpotlight && userId && (
                    <div className="mb-3">
                      <SisterSpotlightCard currentUserId={userId} />
                    </div>
                  )}
                  {showAd && <FeedAd />}
                  {isPoll && (
                    <PollCard post={item} currentUserId={userId || undefined} onDelete={() => handleDelete(item._id as Id<"posts">)} />
                  )}
                  {isAIChat && (
                    <AIChatCard post={item} currentUserId={userId || undefined} onDelete={() => handleDelete(item._id as Id<"posts">)} />
                  )}
                  {isStandardPost && (
                    <RedditPostCard
                      post={item}
                      currentUserId={userId || undefined}
                      onVerify={() => handleVerify(item._id as Id<"posts">)}
                      onDelete={() => handleDelete(item._id as Id<"posts">)}
                      showActions={true}
                    />
                  )}
                  {isRoutePost && item.route && (
                    <RouteFeedCard 
                      route={{
                        ...item.route,
                        _creationTime: item._creationTime,
                        creatorId: item.authorId,
                      }} 
                      currentUserId={userId || undefined} 
                      onDelete={() => handleDelete(item._id as Id<"posts">)} 
                    />
                  )}
                  {isReel && item.reel && (
                    <ReelFeedCard 
                      reel={{
                        ...item.reel,
                        _id: item.reel._id || item._id,
                        _creationTime: item.reel._creationTime || item._creationTime,
                        authorId: item.reel.authorId || item.authorId,
                      }} 
                      currentUserId={userId || undefined} 
                      onDelete={() => handleDelete(item._id as Id<"posts">)} 
                    />
                  )}
                  {item.type === "route" && (
                    <RouteFeedCard route={item as any} currentUserId={userId || undefined} onDelete={() => handleRouteDelete(item._id as Id<"routes">)} />
                  )}
                  {item.type === "opportunity" && (
                    <OpportunityFeedCard opportunity={item as any} currentUserId={userId || undefined} onDelete={() => handleOpportunityDelete(item._id as Id<"opportunities">)} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Right Sidebar - Desktop only, Reddit-style discovery */}
          <aside className="hidden xl:block space-y-4 sticky top-20 self-start">
            {/* Create Post CTA - Prominent */}
            {user && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0) || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--foreground)] truncate">{user.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      <span className="text-[var(--color-aurora-yellow)]">✦</span> {user.credits || 0} credits
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-full bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-purple)] text-white rounded-xl"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
            )}

            {/* Safety Pulse - Compact */}
            <SafetyPulse compact />
            
            {/* Explore Communities Card */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-3">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  Explore Communities
                </h3>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { name: "c/CareerWomen", icon: "💼", members: "12.4k" },
                  { name: "c/SafetyFirst", icon: "🛡️", members: "8.2k" },
                  { name: "c/WellnessCircle", icon: "💗", members: "15.1k" },
                  { name: "c/SafeTravels", icon: "✈️", members: "6.8k" },
                  { name: "c/MomSupport", icon: "👶", members: "9.3k" },
                ].map((community) => (
                  <Link
                    key={community.name}
                    href="/circles"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--accent)] transition-colors group"
                  >
                    <span className="text-base">{community.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors">
                        {community.name}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{community.members}</span>
                  </Link>
                ))}
                <Link
                  href="/circles"
                  className="flex items-center justify-center gap-2 p-2 mt-1 rounded-lg bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/20 transition-colors text-xs font-medium"
                >
                  View All
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3">
              <h3 className="font-bold text-[var(--foreground)] mb-2 flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                Trending
              </h3>
              <div className="space-y-2">
                {[
                  { topic: "Remote Work Safety", posts: 234 },
                  { topic: "Salary Negotiation", posts: 189 },
                  { topic: "Night Running Routes", posts: 156 },
                  { topic: "Tech Interview Tips", posts: 142 },
                  { topic: "Self-Defense Classes", posts: 98 },
                ].map((trend, idx) => (
                  <div key={trend.topic} className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors truncate">
                        {trend.topic}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{trend.posts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { href: "/map", icon: Shield, label: "Safety Map", color: "aurora-mint" },
                  { href: "/opportunities", icon: Briefcase, label: "Jobs", color: "aurora-blue" },
                  { href: "/health", icon: Heart, label: "Wellness", color: "aurora-pink" },
                  { href: "/assistant", icon: MessageSquare, label: "AI Help", color: "aurora-purple" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors text-xs font-medium text-[var(--foreground)]"
                  >
                    <item.icon className={`w-3.5 h-3.5 text-[var(--color-${item.color})]`} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="text-xs text-[var(--muted-foreground)] px-2 space-y-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link href="/legal/terms" className="hover:underline">Terms</Link>
                <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
                <Link href="/legal/guidelines" className="hover:underline">Guidelines</Link>
              </div>
              <p className="text-[var(--muted-foreground)]/60">
                Aurora App © 2025. Made with 💜 for women everywhere.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Onboarding Wizard */}
      {userId && <OnboardingWizard open={showOnboarding} onComplete={() => setShowOnboarding(false)} userId={userId} />}

      {/* AI Chat Companion */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAIChat(false)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <AIChatCompanion 
              className="h-[600px]" 
              onClose={() => setShowAIChat(false)}
            />
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Share2 className="w-5 h-5" />
              Invite Friends to Aurora App
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Share Aurora App and earn 15 credits when your friends join!
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
                const text = encodeURIComponent("Join me on Aurora App - a safe space for women! 💜");
                const url = encodeURIComponent(`${window.location.origin}?ref=${userId}`);
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
              }}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            >
              Share on WhatsApp
            </Button>
            <Button
              onClick={() => {
                const subject = encodeURIComponent("Join me on Aurora App!");
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
