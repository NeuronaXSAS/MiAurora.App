"use client";

/**
 * Mobile-Optimized Post Card
 * 
 * Inspired by Reddit's mobile design with Aurora App branding.
 * Features:
 * - Large touch targets (44px minimum)
 * - Swipeable actions
 * - Quick reactions
 * - Inline comments preview
 * - Credit rewards feedback
 */

import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark,
  MoreHorizontal, Award, Sparkles, MapPin, Clock, Eye,
  CheckCircle2, Flame, TrendingUp, Gift, Heart
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface MobilePostCardProps {
  post: {
    _id: string;
    _creationTime: number;
    title?: string;
    description?: string;
    content?: string;
    lifeDimension?: string;
    category?: string;
    authorId: string;
    location?: { name: string };
    media?: Array<{ type: "image" | "video"; url: string }>;
    imageUrl?: string;
    isVerified?: boolean;
    isAnonymous?: boolean;
    upvotes?: number;
    downvotes?: number;
    commentCount?: number;
    views?: number;
    author?: {
      _id?: string;
      name?: string;
      profileImage?: string;
    };
  };
  currentUserId?: Id<"users">;
  onVote?: (direction: "up" | "down") => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  compact?: boolean;
}

// Community mapping for Aurora App
const COMMUNITIES: Record<string, { name: string; icon: string; color: string }> = {
  professional: { name: "c/CareerWomen", icon: "💼", color: "var(--color-aurora-blue)" },
  social: { name: "c/WomenConnect", icon: "👥", color: "var(--color-aurora-purple)" },
  daily: { name: "c/DailyLife", icon: "🏠", color: "var(--color-aurora-pink)" },
  travel: { name: "c/SafeTravels", icon: "✈️", color: "var(--color-aurora-mint)" },
  financial: { name: "c/WomenFinance", icon: "💰", color: "var(--color-aurora-yellow)" },
  safety: { name: "c/SafetyFirst", icon: "🛡️", color: "var(--color-aurora-mint)" },
  health: { name: "c/WellnessCircle", icon: "💗", color: "var(--color-aurora-pink)" },
  motherhood: { name: "c/MomSupport", icon: "👶", color: "var(--color-aurora-lavender)" },
  general: { name: "c/Aurora", icon: "🌸", color: "var(--color-aurora-purple)" },
};

// Credit toast component
function CreditToast({ show, credits }: { show: boolean; credits: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)] rounded-full text-xs font-bold shadow-lg"
        >
          <Sparkles className="w-3 h-3" />
          +{credits}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MobilePostCard = memo(function MobilePostCard({
  post,
  currentUserId,
  onVote,
  onComment,
  onShare,
  onSave,
  compact = false,
}: MobilePostCardProps) {
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showCreditToast, setShowCreditToast] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);

  const category = post.lifeDimension || post.category || "general";
  const community = COMMUNITIES[category] || COMMUNITIES.general;
  const upvotes = (post.upvotes || 0) - (post.downvotes || 0);
  const hasMedia = post.media?.length || post.imageUrl;
  const content = post.description || post.content || "";
  const title = post.title || content.substring(0, 100);

  // Show credit reward
  const showCredit = useCallback((amount: number) => {
    setCreditAmount(amount);
    setShowCreditToast(true);
    setTimeout(() => setShowCreditToast(false), 1500);
  }, []);

  // Handle vote
  const handleVote = useCallback((direction: "up" | "down") => {
    if (userVote === direction) {
      setUserVote(null);
    } else {
      setUserVote(direction);
      if (direction === "up") showCredit(1);
    }
    onVote?.(direction);
  }, [userVote, onVote, showCredit]);

  // Handle save
  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
    if (!isSaved) showCredit(1);
    onSave?.();
  }, [isSaved, onSave, showCredit]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: `${window.location.origin}/feed?post=${post._id}`,
        });
        showCredit(2);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post._id}`);
      showCredit(1);
    }
    onShare?.();
  }, [title, post._id, onShare, showCredit]);

  // Format vote count
  const formatVotes = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // Check if trending
  const isTrending = upvotes > 100 || (post.commentCount || 0) > 50;

  return (
    <article className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <CreditToast show={showCreditToast} credits={creditAmount} />
      
      {/* Header - Community & Author */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {/* Community Badge */}
        <Link 
          href={`/circles?filter=${category}`}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors"
        >
          <span className="text-sm">{community.icon}</span>
          <span className="text-xs font-medium text-[var(--foreground)]">{community.name}</span>
        </Link>

        {/* Author */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <span>•</span>
          {post.isAnonymous ? (
            <span>Anonymous</span>
          ) : (
            <Link 
              href={`/user/${post.authorId}`}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              {post.author?.name || "Aurora User"}
            </Link>
          )}
          <span>•</span>
          <span>{formatDistanceToNow(post._creationTime, { addSuffix: false })}</span>
        </div>

        {/* Trending Badge */}
        {isTrending && (
          <Badge className="ml-auto bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 text-xs">
            <Flame className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        )}

        {/* More Options */}
        <button className="p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
        </button>
      </div>

      {/* Title */}
      <Link href={`/feed?post=${post._id}`} className="block px-3">
        <h3 className={cn(
          "font-semibold text-[var(--foreground)] leading-snug",
          compact ? "text-sm line-clamp-2" : "text-base line-clamp-3"
        )}>
          {title}
        </h3>
      </Link>

      {/* Content Preview (if different from title) */}
      {content && content !== title && !compact && (
        <p className="px-3 mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
          {content}
        </p>
      )}

      {/* Media */}
      {hasMedia && !compact && (
        <div className="mt-2 mx-3 rounded-xl overflow-hidden bg-[var(--accent)]">
          {post.media?.[0]?.type === "video" ? (
            <video
              src={post.media[0].url}
              className="w-full max-h-[400px] object-cover"
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="relative aspect-video">
              <Image
                src={post.media?.[0]?.url || post.imageUrl || ""}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              {/* Image count indicator */}
              {post.media && post.media.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
                  1/{post.media.length}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Location & Verified Badge */}
      {(post.location || post.isVerified) && (
        <div className="flex items-center gap-2 px-3 mt-2">
          {post.location && (
            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <MapPin className="w-3 h-3" />
              {post.location.name.split(",")[0]}
            </span>
          )}
          {post.isVerified && (
            <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      )}

      {/* Actions Bar - Reddit Style */}
      <div className="flex items-center gap-1 px-2 py-2 mt-2 border-t border-[var(--border)]">
        {/* Vote Buttons */}
        <div className="flex items-center bg-[var(--accent)] rounded-full">
          <button
            onClick={() => handleVote("up")}
            className={cn(
              "p-2 rounded-l-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
              userVote === "up" 
                ? "text-[var(--color-aurora-pink)] bg-[var(--color-aurora-pink)]/20" 
                : "text-[var(--muted-foreground)] hover:text-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/10"
            )}
            aria-label="Upvote"
          >
            <ArrowBigUp className={cn("w-6 h-6", userVote === "up" && "fill-current")} />
          </button>
          
          <span className={cn(
            "px-1 font-semibold text-sm min-w-[32px] text-center",
            userVote === "up" && "text-[var(--color-aurora-pink)]",
            userVote === "down" && "text-[var(--color-aurora-blue)]",
            !userVote && "text-[var(--foreground)]"
          )}>
            {formatVotes(upvotes + (userVote === "up" ? 1 : userVote === "down" ? -1 : 0))}
          </span>
          
          <button
            onClick={() => handleVote("down")}
            className={cn(
              "p-2 rounded-r-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
              userVote === "down" 
                ? "text-[var(--color-aurora-blue)] bg-[var(--color-aurora-blue)]/20" 
                : "text-[var(--muted-foreground)] hover:text-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/10"
            )}
            aria-label="Downvote"
          >
            <ArrowBigDown className={cn("w-6 h-6", userVote === "down" && "fill-current")} />
          </button>
        </div>

        {/* Comments */}
        <button
          onClick={onComment}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors min-h-[44px]"
        >
          <MessageSquare className="w-5 h-5 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {post.commentCount || 0}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors min-h-[44px]"
        >
          <Share2 className="w-5 h-5 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)] hidden xs:inline">Share</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn(
            "p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
            isSaved 
              ? "text-[var(--color-aurora-yellow)] bg-[var(--color-aurora-yellow)]/20" 
              : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          )}
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
        </button>

        {/* Gift (Premium Feature) */}
        <button
          className="p-2 rounded-full text-[var(--muted-foreground)] hover:text-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Send gift"
        >
          <Gift className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Comment Input (collapsed) */}
      <div className="px-3 pb-3">
        <button
          onClick={onComment}
          className="w-full px-4 py-2.5 text-left text-sm text-[var(--muted-foreground)] bg-[var(--accent)] rounded-full hover:bg-[var(--accent)]/80 transition-colors"
        >
          Add a comment...
        </button>
      </div>
    </article>
  );
});
