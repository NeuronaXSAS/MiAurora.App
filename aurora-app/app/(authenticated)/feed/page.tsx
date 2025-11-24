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
import { Sparkles, CheckCircle2, MapPin, Users, Target } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FeedPage() {
  const isMobile = useIsMobile();
  const [contentType, setContentType] = useState<string>("all");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

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
          <div className="mt-4">
            <Select
              value={contentType}
              onValueChange={setContentType}
            >
              <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/20 text-white backdrop-blur-xl">
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

          {/* Gamified Empty State */}
          {feedItems && feedItems.length === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/50 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Welcome to Your Feed!
                </h3>
                <p className="text-gray-300">
                  Complete these steps to get started and earn credits
                </p>
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

                {/* Share Experience */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link href="/feed">
                    <div className="group relative backdrop-blur-xl bg-white/10 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-400 hover:bg-white/15 transition-all cursor-pointer overflow-hidden shadow-2xl hover:shadow-green-500/30"
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
                  </Link>
                </motion.div>

                {/* Invite Friend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      alert("Link copied! Share with friends to earn credits.");
                    }}
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
    </div>
  );
}
