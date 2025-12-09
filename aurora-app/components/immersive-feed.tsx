"use client";

/**
 * Immersive Feed Component - TikTok-style Engagement
 *
 * Full-screen vertical scroll with snap-to-content, side action bar,
 * and enhanced engagement features for maximum user retention.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  MapPin,
  Users,
  Send,
  X,
  Gift,
  ThumbsUp,
  ThumbsDown,
  Award,
  Flame,
  Eye,
  Clock,
  LayoutGrid,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ImmersiveFeedProps {
  userId: Id<"users"> | null;
  initialItems?: any[];
  onExitImmersive?: () => void;
  showControls?: boolean;
}

// Quick reaction emojis for posts
const QUICK_REACTIONS = [
  { emoji: "💜", label: "Love", credits: 1 },
  { emoji: "🔥", label: "Fire", credits: 1 },
  { emoji: "💪", label: "Strong", credits: 1 },
  { emoji: "🙌", label: "Support", credits: 1 },
  { emoji: "✨", label: "Sparkle", credits: 2 },
];

// Side Action Bar Component
function ActionBar({
  item,
  userId,
  onLike,
  onComment,
  onShare,
  onSave,
  isLiked,
  isSaved,
  likeCount,
  commentCount,
  shareCount,
}: {
  item: any;
  userId: Id<"users"> | null;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Author Avatar */}
      <Link href={`/user/${item.authorId}`} className="relative">
        <Avatar className="w-12 h-12 ring-2 ring-white/50">
          <AvatarImage src={item.author?.profileImage} />
          <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
            {item.author?.name?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-[var(--color-aurora-pink)] rounded-full flex items-center justify-center">
          <span className="text-white text-xs">+</span>
        </div>
      </Link>

      {/* Like Button with Long Press for Reactions */}
      <div className="relative">
        <button
          onClick={onLike}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowReactions(true);
          }}
          className="flex flex-col items-center gap-1 group"
        >
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isLiked
                ? "bg-[var(--color-aurora-pink)] text-white scale-110"
                : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30",
            )}
          >
            <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
          </div>
          <span className="text-white text-xs font-semibold">
            {formatCount(likeCount)}
          </span>
        </button>

        {/* Quick Reactions Popup */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              className="absolute right-full mr-2 top-0 flex gap-1 bg-white/90 backdrop-blur-md rounded-full px-2 py-1 shadow-lg"
            >
              {QUICK_REACTIONS.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => {
                    onLike();
                    setShowReactions(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center hover:scale-125 transition-transform"
                  title={`${reaction.label} (+${reaction.credits} credit)`}
                >
                  <span className="text-2xl">{reaction.emoji}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comment Button */}
      <button
        onClick={onComment}
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all group-hover:scale-110">
          <MessageCircle className="w-6 h-6" />
        </div>
        <span className="text-white text-xs font-semibold">
          {formatCount(commentCount)}
        </span>
      </button>

      {/* Save/Bookmark Button */}
      <button
        onClick={onSave}
        className="flex flex-col items-center gap-1 group"
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
            isSaved
              ? "bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)]"
              : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30",
          )}
        >
          <Bookmark className={cn("w-6 h-6", isSaved && "fill-current")} />
        </div>
        <span className="text-white text-xs font-semibold">Save</span>
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all group-hover:scale-110">
          <Share2 className="w-6 h-6" />
        </div>
        <span className="text-white text-xs font-semibold">
          {formatCount(shareCount)}
        </span>
      </button>

      {/* Gift/Tip Button (Premium Feature) */}
      <button className="flex flex-col items-center gap-1 group">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white hover:scale-110 transition-all">
          <Gift className="w-6 h-6" />
        </div>
        <span className="text-white text-xs font-semibold">Gift</span>
      </button>
    </div>
  );
}

// Format large numbers (1000 -> 1K, 1000000 -> 1M)
function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// Comment Drawer Component
function CommentDrawer({
  isOpen,
  onClose,
  postId,
  userId,
  comments,
}: {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"posts">;
  userId: Id<"users"> | null;
  comments: any[];
}) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || !userId) return;
    setIsSubmitting(true);
    // Submit comment logic here
    setNewComment("");
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 h-[70vh] bg-[var(--card)] rounded-t-3xl z-50 flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {comments?.length || 0} Comments
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--accent)] rounded-full"
              >
                <X className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {comments?.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                  <p className="text-[var(--muted-foreground)]">
                    Be the first to comment!
                  </p>
                  <p className="text-xs text-[var(--color-aurora-yellow)] mt-1">
                    +5 credits for first comment
                  </p>
                </div>
              )}

              {comments?.map((comment: any) => (
                <div key={comment._id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author?.profileImage} />
                    <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] text-xs">
                      {comment.author?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--foreground)]">
                        {comment.author?.name || "Anonymous"}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDistanceToNow(comment._creationTime, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)] mt-1">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--color-aurora-pink)]">
                        <Heart className="w-4 h-4" />
                        {comment.likes || 0}
                      </button>
                      <button className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[var(--color-aurora-purple)] text-white text-xs">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 pr-12 bg-[var(--accent)] rounded-full text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-purple)]/50"
                    onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || isSubmitting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-aurora-purple)] disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Single Feed Item Card - Full Screen
function FeedItemCard({
  item,
  userId,
  isActive,
  onCommentOpen,
}: {
  item: any;
  userId: Id<"users"> | null;
  isActive: boolean;
  onCommentOpen: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(item.upvotes || item.likes || 0);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev: number) => (isLiked ? prev - 1 : prev + 1));
    // TODO: Call mutation to like/unlike
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title || "Check this out on Aurora App",
          text: item.content?.substring(0, 100) || "",
          url: `${window.location.origin}/feed?post=${item._id}`,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  const isReel = item.reel || item.postType === "reel";
  const isRoute = item.type === "route" || item.route;

  // Helper to check if URL is valid (not example.com placeholder)
  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    if (url.includes("example.com")) return false;
    if (url.includes("placeholder")) return false;
    return url.startsWith("http") || url.startsWith("/");
  };

  const videoUrl = isValidUrl(item.reel?.videoUrl) ? item.reel?.videoUrl : null;
  const thumbnailUrl = isValidUrl(item.reel?.thumbnailUrl)
    ? item.reel?.thumbnailUrl
    : null;
  const mediaUrl = isValidUrl(item.mediaUrl) ? item.mediaUrl : null;
  const imageUrl = isValidUrl(item.imageUrl) ? item.imageUrl : null;

  const hasMedia = mediaUrl || imageUrl || videoUrl || thumbnailUrl;

  return (
    <div className="relative w-full h-full snap-start snap-always">
      {/* Background - Image or Video */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-aurora-violet)] to-black">
        {isReel && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl || undefined}
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
            onClick={() => {
              if (videoRef.current) {
                if (isPlaying) {
                  videoRef.current.pause();
                } else {
                  videoRef.current.play();
                }
                setIsPlaying(!isPlaying);
              }
            }}
          />
        ) : hasMedia ? (
          <Image
            src={mediaUrl || imageUrl || thumbnailUrl || "/Au_Logo_1.png"}
            alt={item.title || "Post"}
            fill
            className="object-cover"
          />
        ) : (
          // Text-only post with gradient background
          <div className="w-full h-full bg-gradient-to-br from-[var(--color-aurora-purple)] via-[var(--color-aurora-violet)] to-[var(--color-aurora-pink)]" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Video Controls - Only show if there's a valid video */}
      {isReel && videoUrl && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {/* Play/Pause Indicator - Only show if there's a valid video */}
      {isReel && videoUrl && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Content Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/user/${item.authorId}`}>
            <Avatar className="w-10 h-10 ring-2 ring-white/30">
              <AvatarImage src={item.author?.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white text-sm">
                {item.author?.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/user/${item.authorId}`}
              className="font-semibold text-white hover:underline"
            >
              {item.author?.name || "Anonymous"}
            </Link>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(item._creationTime, { addSuffix: true })}
              {item.location && (
                <>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  {typeof item.location === "string"
                    ? item.location
                    : item.location?.name ||
                      item.location?.city ||
                      "Unknown location"}
                </>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/90 text-white rounded-full px-4"
          >
            Follow
          </Button>
        </div>

        {/* Post Title/Content */}
        {item.title && (
          <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">
            {item.title}
          </h3>
        )}

        <p className="text-white/90 text-sm line-clamp-3 mb-3">
          {item.content || item.reel?.caption || item.description}
        </p>

        {/* Tags/Hashtags */}
        {(item.tags?.length > 0 || item.reel?.hashtags?.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {(item.tags || item.reel?.hashtags || [])
              .slice(0, 4)
              .map((tag: string) => (
                <span
                  key={tag}
                  className="text-[var(--color-aurora-pink)] text-sm font-medium"
                >
                  #{tag}
                </span>
              ))}
          </div>
        )}

        {/* Route Safety Badge */}
        {isRoute && (
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0">
              <Shield className="w-3 h-3 mr-1" />
              Safety Score:{" "}
              {Math.round((item.route?.rating || item.rating || 4) * 20)}%
            </Badge>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-white/70 text-xs">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatCount(
              item.views ||
                item.reel?.views ||
                Math.floor(Math.random() * 10000),
            )}{" "}
            views
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-[var(--color-aurora-pink)]" />
            Trending
          </span>
        </div>
      </div>

      {/* Side Action Bar */}
      <div className="absolute right-3 bottom-24 z-10">
        <ActionBar
          item={item}
          userId={userId}
          onLike={handleLike}
          onComment={onCommentOpen}
          onShare={handleShare}
          onSave={() => setIsSaved(!isSaved)}
          isLiked={isLiked}
          isSaved={isSaved}
          likeCount={likeCount}
          commentCount={item.commentCount || item.comments || 0}
          shareCount={item.shares || 0}
        />
      </div>

      {/* Swipe Hint - Only on first item */}
      {isActive && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/50 z-10"
        >
          <ChevronUp className="w-6 h-6 animate-bounce" />
          <span className="text-xs">Swipe up for more</span>
        </motion.div>
      )}
    </div>
  );
}

// Main Immersive Feed Component
export function ImmersiveFeed({
  userId,
  initialItems,
  onExitImmersive,
  showControls = true,
}: ImmersiveFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  // Show controls on tap/click
  useEffect(() => {
    const handleInteraction = () => resetControlsTimeout();
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("mousemove", handleInteraction);
    resetControlsTimeout();
    return () => {
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Fetch feed items
  const feedItems = useQuery(api.feed.getUnifiedFeed, {
    limit: 30,
    userId: userId || undefined,
  });

  const items = feedItems || initialItems || [];

  // Handle scroll snap
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (containerRef.current && currentIndex < items.length - 1) {
          containerRef.current.scrollTo({
            top: (currentIndex + 1) * containerRef.current.clientHeight,
            behavior: "smooth",
          });
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (containerRef.current && currentIndex > 0) {
          containerRef.current.scrollTo({
            top: (currentIndex - 1) * containerRef.current.clientHeight,
            behavior: "smooth",
          });
        }
      } else if (e.key === "l") {
        // Like shortcut
      } else if (e.key === "c") {
        setShowComments(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items.length]);

  if (items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-aurora-violet)]">
        <div className="text-center text-white">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black">
      {/* Floating Control Bar - Centered, easy to reach */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: controlsVisible ? 1 : 0,
            y: controlsVisible ? 0 : -20,
            pointerEvents: controlsVisible ? "auto" : "none",
          }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 shadow-xl">
            {/* Exit to Card View */}
            {onExitImmersive && (
              <button
                onClick={onExitImmersive}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all min-h-[44px]"
                title="Switch to Card View"
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">
                  Card View
                </span>
              </button>
            )}

            {/* Content counter */}
            <div className="px-3 py-2 text-white/70 text-sm font-medium">
              <span className="text-white">{currentIndex + 1}</span>
              <span className="mx-1">/</span>
              <span>{items.length}</span>
            </div>

            {/* Scroll hint for mobile */}
            <div className="flex items-center gap-1 px-2 text-white/50 text-xs">
              <ChevronUp className="w-3 h-3" />
              <ChevronDown className="w-3 h-3" />
              <span className="hidden sm:inline">Scroll</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tap to show controls hint - only on mobile */}
      {showControls && !controlsVisible && (
        <div className="md:hidden fixed top-4 left-1/2 -translate-x-1/2 z-40">
          <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/60 text-xs">
            Tap to show controls
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="absolute top-14 left-0 right-0 z-20 flex gap-1 p-2">
        {items.slice(0, 10).map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "flex-1 h-1 rounded-full transition-all",
              idx === currentIndex
                ? "bg-white"
                : idx < currentIndex
                  ? "bg-white/50"
                  : "bg-white/20",
            )}
          />
        ))}
      </div>

      {/* Navigation Buttons - Desktop */}
      <div className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 flex-col gap-2">
        <button
          onClick={() => {
            if (containerRef.current && currentIndex > 0) {
              containerRef.current.scrollTo({
                top: (currentIndex - 1) * containerRef.current.clientHeight,
                behavior: "smooth",
              });
            }
          }}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 transition-all"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            if (containerRef.current && currentIndex < items.length - 1) {
              containerRef.current.scrollTo({
                top: (currentIndex + 1) * containerRef.current.clientHeight,
                behavior: "smooth",
              });
            }
          }}
          disabled={currentIndex === items.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 transition-all"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Feed Container with Snap Scroll */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {items.map((item: any, index: number) => (
          <div
            key={item._id}
            className="h-screen w-full snap-start snap-always"
          >
            <FeedItemCard
              item={item}
              userId={userId}
              isActive={index === currentIndex}
              onCommentOpen={() => setShowComments(true)}
            />
          </div>
        ))}
      </div>

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={items[currentIndex]?._id}
        userId={userId}
        comments={items[currentIndex]?.comments || []}
      />

      {/* Credit Earned Toast */}
      <AnimatePresence>
        {/* This would show when user earns credits */}
      </AnimatePresence>
    </div>
  );
}
