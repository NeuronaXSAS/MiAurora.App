"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { RouteFeedCard } from "@/components/route-feed-card";
import { OpportunityFeedCard } from "@/components/opportunity-feed-card";

import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { MobileFeed } from "./mobile-feed";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, CheckCircle2, MapPin, Users, Target, Share2, Copy, Mail } from "lucide-react";
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

export default function FeedPage() {
  const isMobile = useIsMobile();
  const [contentType, setContentType] = useState<string>("all");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showQuests, setShowQuests] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get user ID and check onboarding status
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

  const verifyPost = useMutation(api.posts.verify);
  const deletePost = useMutation(api.posts.deletePost);
  const deleteRoute = useMutation(api.routes.deleteRoute);
  const deleteOpportunity = useMutation(api.opportunities.deleteOpportunity);

  const handleVerify = async (postId: Id<"posts">) => {
    if (!userId) return;
    try {
      await verifyPost({
        postId,
        userId,
      });
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  const handleDelete = async (postId: Id<"posts">) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await deletePost({
        postId,
        userId,
      });
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post. " + (error as Error).message);
    }
  };

  const handleRouteDelete = async (routeId: Id<"routes">) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this route?")) return;
    
    try {
      await deleteRoute({ routeId, userId });
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete route. " + (error as Error).message);
    }
  };

  const handleOpportunityDelete = async (opportunityId: Id<"opportunities">) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    
    try {
      await deleteOpportunity({ opportunityId, userId });
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete opportunity. " + (error as Error).message);
    }
  };

  // Show mobile-optimized feed for mobile users (after all hooks)
  if (isMobile) {
    return <MobileFeed />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-40 shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse">
                Your Feed
              </h1>
              <p className="text-sm text-gray-300">
                Discover and share community intelligence
              </p>
            </div>

          </div>

          {/* Filter */}
          {isMounted && (
            <div className="mt-4">
              <Select
                value={contentType}
                onValueChange={setContentType}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/20 text-white backdrop-blur-xl" suppressHydrationWarning>
                  <SelectValue placeholder="All Content" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 text-white">
                  <SelectItem value="all" className="hover:bg-white/10 focus:bg-white/10">All Content</SelectItem>
                  <SelectItem value="post" className="hover:bg-white/10 focus:bg-white/10">Posts Only</SelectItem>
                  <SelectItem value="poll" className="hover:bg-white/10 focus:bg-white/10">Polls Only</SelectItem>
                  <SelectItem value="route" className="hover:bg-white/10 focus:bg-white/10">Routes Only</SelectItem>
                  <SelectItem value="opportunity" className="hover:bg-white/10 focus:bg-white/10">Opportunities Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Feed Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Loading State */}
          {feedItems === undefined && (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          )}

          {/* Gamified Empty State - Only when feed is empty AND quests are visible */}
          {feedItems && feedItems.length === 0 && showQuests && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-purple-500/50">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Welcome to Your Feed!
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Complete these steps to get started and earn credits
                </p>
                <button
                  onClick={() => setShowQuests(false)}
                  className="text-xs text-gray-400 hover:text-white transition-colors underline"
                >
                  Hide quests
                </button>
              </div>

              <div className="grid gap-4">
                {/* Complete Profile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link href="/settings">
                    <div className="group relative backdrop-blur-xl bg-white/10 border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-400 hover:bg-white/15 transition-all cursor-pointer overflow-hidden shadow-2xl hover:shadow-purple-500/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg text-white">Complete Your Profile</h4>
                            <span className="text-sm font-semibold text-purple-200 bg-purple-600/30 px-3 py-1 rounded-full border border-purple-400/50">
                              +10 credits
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Add your bio, location, and career goals to help others connect with you
                          </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-gray-600 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>

                {/* Verify Location */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link href="/map">
                    <div className="group relative backdrop-blur-xl bg-white/10 border-2 border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400 hover:bg-white/15 transition-all cursor-pointer overflow-hidden shadow-2xl hover:shadow-cyan-500/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/50">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg text-white">Share Your First Location</h4>
                            <span className="text-sm font-semibold text-cyan-200 bg-cyan-600/30 px-3 py-1 rounded-full border border-cyan-400/50">
                              +50 credits
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Rate a workplace, venue, or neighborhood to help other women stay safe
                          </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>

                {/* Share Experience - Opens Create Modal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div
                    onClick={() => {
                      // Trigger the Create button in the sidebar
                      const createButton = document.querySelector('[data-create-button]') as HTMLButtonElement;
                      if (createButton) {
                        createButton.click();
                      }
                    }}
                    className="group relative backdrop-blur-xl bg-white/10 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-400 hover:bg-white/15 transition-all cursor-pointer overflow-hidden shadow-2xl hover:shadow-green-500/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/50">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-white">Share Your First Experience</h4>
                          <span className="text-sm font-semibold text-green-200 bg-green-600/30 px-3 py-1 rounded-full border border-green-400/50">
                            +25 credits
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Create your first post to contribute to the community
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-gray-600 group-hover:text-green-400 transition-colors" />
                    </div>
                  </div>
                </motion.div>

                {/* Invite Friend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div
                    onClick={() => setShowShareDialog(true)}
                    className="group relative backdrop-blur-xl bg-white/10 border-2 border-orange-500/30 rounded-2xl p-6 hover:border-orange-400 hover:bg-white/15 transition-all cursor-pointer overflow-hidden shadow-2xl hover:shadow-orange-500/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/50">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg text-white">Invite a Friend</h4>
                          <span className="text-sm font-semibold text-orange-200 bg-orange-600/30 px-3 py-1 rounded-full border border-orange-400/50">
                            +15 credits
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Share Aurora with friends and earn credits when they join
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-gray-600 group-hover:text-orange-400 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Show quests button when hidden */}
          {feedItems && feedItems.length === 0 && !showQuests && (
            <div className="text-center py-8">
              <button
                onClick={() => setShowQuests(true)}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-6 py-3 text-white hover:bg-white/20 transition-all"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Show earning opportunities
              </button>
            </div>
          )}

          {/* Empty state message when quests are hidden */}
          {feedItems && feedItems.length === 0 && !showQuests && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
              <p className="text-gray-400 text-sm mb-4">
                Be the first to share something with the community!
              </p>
            </div>
          )}

          {/* Feed Items */}
          {feedItems &&
            feedItems
              .filter((item: any) => {
                if (contentType === "all") return true;
                if (contentType === "poll") return item.type === "post" && item.postType === "poll";
                if (contentType === "post") return item.type === "post" && item.postType !== "poll";
                return item.type === contentType;
              })
              .map((item: any) => {
                if (item.type === "post") {
                  // Check if it's a poll
                  if (item.postType === "poll") {
                    return (
                      <PollCard
                        key={item._id}
                        post={item}
                        currentUserId={userId || undefined}
                        onDelete={() => handleDelete(item._id as Id<"posts">)}
                      />
                    );
                  }
                  
                  // Check if it's an AI chat
                  if (item.postType === "ai_chat") {
                    return (
                      <AIChatCard
                        key={item._id}
                        post={item}
                        currentUserId={userId || undefined}
                        onDelete={() => handleDelete(item._id as Id<"posts">)}
                      />
                    );
                  }
                  
                  // Regular post
                  return (
                    <PostCard
                      key={item._id}
                      post={item}
                      currentUserId={userId || undefined}
                      onVerify={() => handleVerify(item._id as Id<"posts">)}
                      onDelete={() => handleDelete(item._id as Id<"posts">)}
                      hasVerified={false}
                      showActions={true}
                    />
                  );
                }
                
                if (item.type === "route") {
                  return (
                    <RouteFeedCard
                      key={item._id}
                      route={item as any}
                      currentUserId={userId || undefined}
                      onDelete={() => handleRouteDelete(item._id as Id<"routes">)}
                    />
                  );
                }
                
                if (item.type === "opportunity") {
                  return (
                    <OpportunityFeedCard
                      key={item._id}
                      opportunity={item as any}
                      currentUserId={userId || undefined}
                      onDelete={() => handleOpportunityDelete(item._id as Id<"opportunities">)}
                    />
                  );
                }
                
                return null;
              })}
        </div>
      </div>

      {/* Onboarding Wizard */}
      {userId && (
        <OnboardingWizard
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          userId={userId}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Invite Friends to Aurora
            </DialogTitle>
            <DialogDescription>
              Share Aurora and earn 15 credits when your friends join!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {/* Copy Link */}
            <Button
              onClick={() => {
                const inviteLink = `${window.location.origin}?ref=${userId}`;
                navigator.clipboard.writeText(inviteLink);
                alert("✅ Link copied! Share it with your friends.");
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <Copy className="w-4 h-4 mr-3" />
              Copy Invite Link
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={() => {
                const text = encodeURIComponent("Join me on Aurora - a safe space for women to connect, share experiences, and thrive together! 💜");
                const url = encodeURIComponent(`${window.location.origin}?ref=${userId}`);
                window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
              }}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share on WhatsApp
            </Button>

            {/* Email */}
            <Button
              onClick={() => {
                const subject = encodeURIComponent("Join me on Aurora!");
                const body = encodeURIComponent(`Hi!\n\nI've been using Aurora - a safe space for women to connect, share experiences, and thrive together.\n\nJoin me here: ${window.location.origin}?ref=${userId}\n\n💜 Aurora App`);
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
              className="w-full justify-start"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-3" />
              Share via Email
            </Button>

            {/* Twitter/X */}
            <Button
              onClick={() => {
                const text = encodeURIComponent("Join me on Aurora - a safe space for women to connect and thrive! 💜");
                const url = encodeURIComponent(`${window.location.origin}?ref=${userId}`);
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
              }}
              className="w-full justify-start bg-black hover:bg-gray-800 text-white"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X (Twitter)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
