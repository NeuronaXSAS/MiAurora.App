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
import { Plus, Sparkles, BarChart3, FileText } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function FeedPage() {
  const isMobile = useIsMobile();
  const [contentType, setContentType] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

  // Get user ID from cookie
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          // Not authenticated, redirect to home
          router.push("/");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/");
      }
    };
    getUserId();
  }, [router]);

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

          {/* Empty State */}
          {feedItems && feedItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to share your experience!
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
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
