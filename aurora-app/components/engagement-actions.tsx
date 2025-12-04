"use client";

/**
 * Engagement Actions Component
 * 
 * Enhanced engagement UI with:
 * - Quick reactions (emoji picker)
 * - Double-tap to like
 * - Credit rewards for engagement
 * - Share with credit bonus
 * - Animated feedback
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  ThumbsUp, ThumbsDown, Award, Gift, Sparkles, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

// Quick reaction options with credit rewards
const REACTIONS = [
  { emoji: "💜", label: "Love", credits: 1 },
  { emoji: "🔥", label: "Fire", credits: 1 },
  { emoji: "💪", label: "Strong", credits: 1 },
  { emoji: "🙌", label: "Support", credits: 1 },
  { emoji: "✨", label: "Amazing", credits: 2 },
  { emoji: "🥰", label: "Adore", credits: 2 },
];

interface EngagementActionsProps {
  postId: Id<"posts">;
  userId: Id<"users"> | null;
  initialLikes: number;
  initialComments: number;
  initialShares: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  variant?: "horizontal" | "vertical" | "compact";
  showCredits?: boolean;
  className?: string;
}

// Credit earned toast notification
function CreditToast({ credits, action }: { credits: number; action: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)] rounded-full shadow-lg font-medium text-sm"
    >
      <Sparkles className="w-4 h-4" />
      +{credits} credit{credits > 1 ? "s" : ""} for {action}!
    </motion.div>
  );
}

// Double-tap heart animation
function DoubleTapHeart({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <Heart className="w-24 h-24 text-[var(--color-aurora-pink)] fill-[var(--color-aurora-pink)] drop-shadow-lg" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Quick reactions popup
function ReactionsPopup({
  show,
  onSelect,
  onClose,
}: {
  show: boolean;
  onSelect: (reaction: typeof REACTIONS[0]) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full left-0 mb-2 flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-2 py-1.5 shadow-xl z-50"
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onSelect(reaction)}
                className="w-10 h-10 flex items-center justify-center hover:scale-125 transition-transform rounded-full hover:bg-[var(--accent)]"
                title={`${reaction.label} (+${reaction.credits} credit)`}
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function EngagementActions({
  postId,
  userId,
  initialLikes,
  initialComments,
  initialShares,
  isLiked: initialIsLiked = false,
  isSaved: initialIsSaved = false,
  onLike,
  onComment,
  onShare,
  onSave,
  variant = "horizontal",
  showCredits = true,
  className,
}: EngagementActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [showReactions, setShowReactions] = useState(false);
  const [showCreditToast, setShowCreditToast] = useState<{ credits: number; action: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Show credit toast
  const showCredit = useCallback((credits: number, action: string) => {
    if (!showCredits) return;
    setShowCreditToast({ credits, action });
    setTimeout(() => setShowCreditToast(null), 2000);
  }, [showCredits]);

  // Handle like
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    setLikes((prev: number) => isLiked ? prev - 1 : prev + 1);
    if (!isLiked) {
      showCredit(1, "liking");
    }
    onLike?.();
  }, [isLiked, onLike, showCredit]);

  // Handle reaction select
  const handleReaction = useCallback((reaction: typeof REACTIONS[0]) => {
    setIsLiked(true);
    setLikes((prev: number) => prev + 1);
    showCredit(reaction.credits, reaction.label.toLowerCase());
    setShowReactions(false);
    onLike?.();
  }, [onLike, showCredit]);

  // Handle save
  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
    if (!isSaved) {
      showCredit(1, "saving");
    }
    onSave?.();
  }, [isSaved, onSave, showCredit]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check this out on Aurora App",
          url: `${window.location.origin}/feed?post=${postId}`,
        });
        showCredit(2, "sharing");
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(`${window.location.origin}/feed?post=${postId}`);
      setCopied(true);
      showCredit(1, "copying link");
      setTimeout(() => setCopied(false), 2000);
    }
    onShare?.();
  }, [postId, onShare, showCredit]);

  // Format count
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const isVertical = variant === "vertical";
  const isCompact = variant === "compact";

  return (
    <>
      <div className={cn(
        "flex items-center",
        isVertical ? "flex-col gap-4" : "gap-1",
        className
      )}>
        {/* Like Button with Long Press for Reactions */}
        <div className="relative">
          <button
            onClick={handleLike}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowReactions(true);
            }}
            className={cn(
              "flex items-center gap-1.5 transition-all",
              isVertical 
                ? "flex-col p-2" 
                : "px-3 py-1.5 rounded-full hover:bg-[var(--accent)]",
              isLiked && "text-[var(--color-aurora-pink)]"
            )}
          >
            <Heart className={cn(
              isCompact ? "w-5 h-5" : "w-6 h-6",
              isLiked && "fill-current"
            )} />
            <span className={cn(
              "font-medium",
              isCompact ? "text-xs" : "text-sm"
            )}>
              {formatCount(likes)}
            </span>
          </button>
          
          <ReactionsPopup
            show={showReactions}
            onSelect={handleReaction}
            onClose={() => setShowReactions(false)}
          />
        </div>

        {/* Comment Button */}
        <button
          onClick={onComment}
          className={cn(
            "flex items-center gap-1.5 transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            isVertical 
              ? "flex-col p-2" 
              : "px-3 py-1.5 rounded-full hover:bg-[var(--accent)]"
          )}
        >
          <MessageCircle className={isCompact ? "w-5 h-5" : "w-6 h-6"} />
          <span className={cn(
            "font-medium",
            isCompact ? "text-xs" : "text-sm"
          )}>
            {formatCount(initialComments)}
          </span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className={cn(
            "flex items-center gap-1.5 transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            isVertical 
              ? "flex-col p-2" 
              : "px-3 py-1.5 rounded-full hover:bg-[var(--accent)]"
          )}
        >
          {copied ? (
            <Check className={cn(isCompact ? "w-5 h-5" : "w-6 h-6", "text-[var(--color-aurora-mint)]")} />
          ) : (
            <Share2 className={isCompact ? "w-5 h-5" : "w-6 h-6"} />
          )}
          {!isCompact && (
            <span className="text-sm font-medium">
              {copied ? "Copied!" : formatCount(initialShares)}
            </span>
          )}
        </button>

        {/* Save/Bookmark Button */}
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 transition-all",
            isVertical 
              ? "flex-col p-2" 
              : "px-3 py-1.5 rounded-full hover:bg-[var(--accent)]",
            isSaved 
              ? "text-[var(--color-aurora-yellow)]" 
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Bookmark className={cn(
            isCompact ? "w-5 h-5" : "w-6 h-6",
            isSaved && "fill-current"
          )} />
          {!isCompact && !isVertical && (
            <span className="text-sm font-medium">Save</span>
          )}
        </button>

        {/* Gift/Tip Button (Premium) */}
        {!isCompact && (
          <button
            className={cn(
              "flex items-center gap-1.5 transition-all text-[var(--muted-foreground)] hover:text-[var(--color-aurora-pink)]",
              isVertical 
                ? "flex-col p-2" 
                : "px-3 py-1.5 rounded-full hover:bg-[var(--accent)]"
            )}
          >
            <Gift className="w-6 h-6" />
            {!isVertical && <span className="text-sm font-medium">Gift</span>}
          </button>
        )}
      </div>

      {/* Credit Toast */}
      <AnimatePresence>
        {showCreditToast && (
          <CreditToast credits={showCreditToast.credits} action={showCreditToast.action} />
        )}
      </AnimatePresence>
    </>
  );
}

// Double-tap wrapper for posts
export function DoubleTapLikeWrapper({
  children,
  onDoubleTap,
  className,
}: {
  children: React.ReactNode;
  onDoubleTap: () => void;
  className?: string;
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap detected
      onDoubleTap();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 600);
    }
    setLastTap(now);
  }, [lastTap, onDoubleTap]);

  return (
    <div className={cn("relative", className)} onClick={handleTap}>
      {children}
      <DoubleTapHeart show={showHeart} />
    </div>
  );
}
