"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { RouteFeedCard } from "@/components/route-feed-card";
import { OpportunityFeedCard } from "@/components/opportunity-feed-card";
import { PostCreateDialog } from "@/components/post-create-dialog";
import { PollCreateDialog } from "@/components/poll-create-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Sparkles, BarChart3, FileText, CheckCircle2, MapPin, Users, Target } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function FeedPage() {
  const isMobile = useIsMobile();
  const [contentType, setContentType] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Your Feed</h1>
              <p className="text-sm text-gray-600">
                Discover and share community intelligence
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Create</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Create Post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPollDialog(true)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Create Poll
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter */}
          <div className="mt-4">
            <Select
              value={contentType}
              onValueChange={setContentType}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="post">Posts Only</SelectItem>
                <SelectItem value="poll">Polls Only</SelectItem>
                <SelectItem value="route">Routes Only</SelectItem>
                <SelectItem value="opportunity">Opportunities Only</SelectItem>
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
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Welcome to Your Feed!</h3>
                <p className="text-gray-600">
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
                    <div className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-400 transition-all cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg">Complete Your Profile</h4>
                            <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                              +10 credits
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Add your bio, location, and career goals to help others connect with you
                          </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-gray-300 group-hover:text-purple-600 transition-colors" />
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
                    <div className="group relative backdrop-blur-xl bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-6 hover:border-cyan-400 transition-all cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg">Share Your First Location</h4>
                            <span className="text-sm font-semibold text-cyan-600 bg-cyan-100 px-3 py-1 rounded-full">
                              +50 credits
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            Rate a workplace, venue, or neighborhood to help other women stay safe
                          </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-gray-300 group-hover:text-cyan-600 transition-colors" />
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
                  <div
                    onClick={() => setShowCreateDialog(true)}
                    className="group relative backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 hover:border-green-400 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg">Share Your First Experience</h4>
                          <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            +25 credits
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Create your first post to contribute to the community
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-gray-300 group-hover:text-green-600 transition-colors" />
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
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      alert("Link copied! Share with friends to earn credits.");
                    }}
                    className="group relative backdrop-blur-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 hover:border-orange-400 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-lg">Invite a Friend</h4>
                          <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                            +15 credits
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Share Aurora with friends and earn credits when they join
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-gray-300 group-hover:text-orange-600 transition-colors" />
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

      {/* Create Post Dialog */}
      {userId && (
        <>
          <PostCreateDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            userId={userId}
          />
          <PollCreateDialog
            open={showPollDialog}
            onOpenChange={setShowPollDialog}
            userId={userId}
          />
        </>
      )}
    </div>
  );
}
