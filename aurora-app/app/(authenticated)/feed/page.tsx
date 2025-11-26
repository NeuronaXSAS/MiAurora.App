"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PostCard } from "@/components/post-card";
import { PollCard } from "@/components/poll-card";
import { AIChatCard } from "@/components/ai-chat-card";
import { RouteFeedCard } from "@/components/route-feed-card";
import { OpportunityFeedCard } from "@/components/opportunity-feed-card";
import { FeedAd } from "@/components/ads/feed-ad";

import { PostCardSkeleton } from "@/components/loading-skeleton";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { MobileFeed } from "./mobile-feed";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                Your Feed
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Discover and share community intelligence
              </p>
            </div>

            {/* Filter */}
            {isMounted && (
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="w-[140px] sm:w-[180px] bg-[var(--background)] border-[var(--border)]" suppressHydrationWarning>
                  <SelectValue placeholder="All Content" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="poll">Polls</SelectItem>
                  <SelectItem value="route">Routes</SelectItem>
                  <SelectItem value="opportunity">Opportunities</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-4">
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
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-[var(--foreground)]">
                  Welcome to Your Feed!
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm mb-2">
                  Complete these steps to get started and earn credits
                </p>
                <button
                  onClick={() => setShowQuests(false)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors underline"
                >
                  Hide quests
                </button>
              </div>

              <div className="grid gap-3">
                {/* Complete Profile */}
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

                {/* Share Location */}
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

                {/* Create Post */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div
                    onClick={() => {
                      const createButton = document.querySelector('[data-create-button]') as HTMLButtonElement;
                      if (createButton) createButton.click();
                    }}
                    className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-aurora-mint)]/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--color-aurora-mint)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--foreground)]">Share Your First Experience</h4>
                        <p className="text-[var(--muted-foreground)] text-sm truncate">Create a post for the community</p>
                      </div>
                      <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">+25</Badge>
                    </div>
                  </div>
                </motion.div>

                {/* Invite Friend */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <div
                    onClick={() => setShowShareDialog(true)}
                    className="group bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--color-aurora-pink)]/50 hover:shadow-lg transition-all cursor-pointer"
                  >
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
          {feedItems && feedItems.length === 0 && !showQuests && (
            <div className="text-center py-8">
              <button
                onClick={() => setShowQuests(true)}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-6 py-3 text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Show earning opportunities
              </button>
            </div>
          )}

          {/* Empty state message when quests are hidden */}
          {feedItems && feedItems.length === 0 && !showQuests && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">No posts yet</h3>
              <p className="text-[var(--muted-foreground)] text-sm mb-4">
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
              .map((item: any, index: number) => {
                // Inject ad every 5th item
                const showAd = index > 0 && index % 5 === 0;
                
                return (
                  <div key={item._id}>
                    {showAd && <FeedAd />}
                    
                    {item.type === "post" && item.postType === "poll" && (
                      <PollCard
                        post={item}
                        currentUserId={userId || undefined}
                        onDelete={() => handleDelete(item._id as Id<"posts">)}
                      />
                    )}
                    
                    {item.type === "post" && item.postType === "ai_chat" && (
                      <AIChatCard
                        post={item}
                        currentUserId={userId || undefined}
                        onDelete={() => handleDelete(item._id as Id<"posts">)}
                      />
                    )}
                    
                    {item.type === "post" && item.postType !== "poll" && item.postType !== "ai_chat" && (
                      <PostCard
                        post={item}
                        currentUserId={userId || undefined}
                        onVerify={() => handleVerify(item._id as Id<"posts">)}
                        onDelete={() => handleDelete(item._id as Id<"posts">)}
                        hasVerified={false}
                        showActions={true}
                      />
                    )}
                    
                    {item.type === "route" && (
                      <RouteFeedCard
                        route={item as any}
                        currentUserId={userId || undefined}
                        onDelete={() => handleRouteDelete(item._id as Id<"routes">)}
                      />
                    )}
                    
                    {item.type === "opportunity" && (
                      <OpportunityFeedCard
                        opportunity={item as any}
                        currentUserId={userId || undefined}
                        onDelete={() => handleOpportunityDelete(item._id as Id<"opportunities">)}
                      />
                    )}
                  </div>
                );
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
