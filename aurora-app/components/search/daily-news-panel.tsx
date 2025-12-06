"use client";

/**
 * Daily News Panel - "What Sisters Think" 💜
 * 
 * 2 curated news stories daily for community discussion
 * Strategic engagement feature for Aurora App
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper, ThumbsUp, ThumbsDown, Minus,
  MessageCircle, Share2, ExternalLink, Sparkles,
  TrendingUp, Users, Clock, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { generateAnonymousSessionHash } from "@/lib/anonymous-session";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DailyNewsPanelProps {
  userId?: Id<"users"> | null;
  variant?: "full" | "compact" | "landing";
}

const CATEGORY_COLORS: Record<string, string> = {
  safety: "bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]",
  rights: "bg-[var(--color-aurora-purple)] text-white",
  health: "bg-[var(--color-aurora-pink)] text-[var(--color-aurora-violet)]",
  career: "bg-[var(--color-aurora-blue)] text-white",
  finance: "bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)]",
  tech: "bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]",
  world: "bg-[var(--color-aurora-violet)] text-white",
};

const CATEGORY_LABELS: Record<string, string> = {
  safety: "Safety",
  rights: "Women's Rights",
  health: "Health",
  career: "Career",
  finance: "Finance",
  tech: "Tech",
  world: "World News",
};

export function DailyNewsPanel({ userId, variant = "full" }: DailyNewsPanelProps) {
  const [sessionHash, setSessionHash] = useState<string>("");
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  const stories = useQuery(api.dailyNews.getTodayStories);
  const voteOnStory = useMutation(api.dailyNews.voteOnStory);

  // Generate session hash on mount
  useEffect(() => {
    generateAnonymousSessionHash().then(setSessionHash);
  }, []);

  if (!stories || stories.length === 0) {
    return null; // Don't show if no stories today
  }

  if (variant === "landing") {
    return (
      <LandingVariant 
        stories={stories} 
        sessionHash={sessionHash}
        userId={userId}
        onVote={voteOnStory}
      />
    );
  }

  if (variant === "compact") {
    return (
      <CompactVariant 
        stories={stories}
        sessionHash={sessionHash}
        userId={userId}
        onVote={voteOnStory}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--foreground)]">What Sisters Think</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Today's news, your voice 💜
            </p>
          </div>
        </div>
        <Badge className="bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)]">
          <Sparkles className="w-3 h-3 mr-1" />
          +2 credits per vote
        </Badge>
      </div>

      {/* Stories */}
      <div className="grid gap-4 md:grid-cols-2">
        {stories.map((story) => (
          <NewsStoryCard
            key={story._id}
            story={story}
            sessionHash={sessionHash}
            userId={userId}
            onVote={voteOnStory}
            isExpanded={expandedStory === story._id}
            onToggleExpand={() => setExpandedStory(
              expandedStory === story._id ? null : story._id
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Individual story card
function NewsStoryCard({
  story,
  sessionHash,
  userId,
  onVote,
  isExpanded,
  onToggleExpand,
}: {
  story: any;
  sessionHash: string;
  userId?: Id<"users"> | null;
  onVote: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const existingVote = useQuery(
    api.dailyNews.getUserVote,
    sessionHash ? { storyId: story._id, sessionHash } : "skip"
  );

  useEffect(() => {
    if (existingVote !== undefined) {
      setUserVote(existingVote);
    }
  }, [existingVote]);

  const handleVote = async (vote: "agree" | "disagree" | "neutral") => {
    if (!sessionHash || isVoting) return;
    
    setIsVoting(true);
    try {
      await onVote({
        storyId: story._id,
        sessionHash,
        userId: userId || undefined,
        vote,
      });
      setUserVote(vote);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500);
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const total = story.totalVotes || 1;
  const agreePercent = Math.round((story.agreeCount / total) * 100);
  const disagreePercent = Math.round((story.disagreeCount / total) * 100);

  return (
    <motion.div
      layout
      className="relative bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Celebration animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-[var(--color-aurora-purple)]/20 backdrop-blur-sm z-10"
          >
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-[var(--color-aurora-yellow)] mx-auto mb-2" />
              <p className="font-bold text-[var(--foreground)]">Voice heard! 💜</p>
              {userId && (
                <p className="text-xs text-[var(--color-aurora-purple)]">+2 credits</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      {story.imageUrl && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={story.imageUrl}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className={`absolute top-2 left-2 ${CATEGORY_COLORS[story.category]}`}>
            {CATEGORY_LABELS[story.category]}
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {!story.imageUrl && (
          <Badge className={`mb-2 ${CATEGORY_COLORS[story.category]}`}>
            {CATEGORY_LABELS[story.category]}
          </Badge>
        )}

        <h3 className="font-bold text-[var(--foreground)] line-clamp-2 mb-2">
          {story.title}
        </h3>

        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
          {story.summary}
        </p>

        {/* Source */}
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-4">
          <span>{story.sourceName}</span>
          <span>•</span>
          <a
            href={story.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[var(--color-aurora-purple)] hover:underline"
          >
            Read full story
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Vote buttons */}
        <div className="flex gap-2 mb-4">
          <VoteButton
            type="agree"
            label="Agree"
            icon={<ThumbsUp className="w-4 h-4" />}
            isSelected={userVote === "agree"}
            onClick={() => handleVote("agree")}
            disabled={isVoting}
            color="bg-[var(--color-aurora-mint)]"
          />
          <VoteButton
            type="neutral"
            label="Neutral"
            icon={<Minus className="w-4 h-4" />}
            isSelected={userVote === "neutral"}
            onClick={() => handleVote("neutral")}
            disabled={isVoting}
            color="bg-[var(--color-aurora-lavender)]"
          />
          <VoteButton
            type="disagree"
            label="Disagree"
            icon={<ThumbsDown className="w-4 h-4" />}
            isSelected={userVote === "disagree"}
            onClick={() => handleVote("disagree")}
            disabled={isVoting}
            color="bg-[var(--color-aurora-salmon)]/20"
          />
        </div>

        {/* Results bar */}
        {story.totalVotes > 0 && (
          <div className="space-y-2">
            <div className="flex h-3 rounded-full overflow-hidden bg-[var(--accent)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${agreePercent}%` }}
                className="bg-[var(--color-aurora-mint)]"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - agreePercent - disagreePercent}%` }}
                className="bg-[var(--color-aurora-lavender)]"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${disagreePercent}%` }}
                className="bg-[var(--color-aurora-salmon)]/50"
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {story.totalVotes} votes
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {story.commentCount} comments
              </span>
            </div>
          </div>
        )}

        {/* Expand for comments */}
        <button
          onClick={onToggleExpand}
          className="w-full mt-3 py-2 text-sm text-[var(--color-aurora-purple)] hover:bg-[var(--accent)] rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? "Hide discussion" : "Join the discussion"}
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </button>
      </div>

      {/* Expanded comments section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)]"
          >
            <NewsComments storyId={story._id} sessionHash={sessionHash} userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Vote button component
function VoteButton({
  type,
  label,
  icon,
  isSelected,
  onClick,
  disabled,
  color,
}: {
  type: string;
  label: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
        text-sm font-medium transition-all min-h-[44px]
        ${isSelected 
          ? `${color} text-[var(--color-aurora-violet)] ring-2 ring-[var(--color-aurora-purple)]` 
          : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]/80"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Comments section
function NewsComments({
  storyId,
  sessionHash,
  userId,
}: {
  storyId: Id<"dailyNewsStories">;
  sessionHash: string;
  userId?: Id<"users"> | null;
}) {
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(!userId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = useQuery(api.dailyNews.getComments, { storyId, limit: 20 });
  const addComment = useMutation(api.dailyNews.addComment);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({
        storyId,
        sessionHash,
        authorId: userId || undefined,
        content: newComment.trim(),
        isAnonymous,
      });
      setNewComment("");
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
      {/* Comment input */}
      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full p-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm resize-none h-20"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            Post anonymously
          </label>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="bg-[var(--color-aurora-purple)] min-h-[36px]"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments?.map((comment) => (
          <div key={comment._id} className="p-3 rounded-xl bg-[var(--accent)]/50">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-[var(--foreground)]">
                {comment.isAnonymous ? "Anonymous Sister" : comment.author?.name || "Sister"}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-[var(--foreground)]">{comment.content}</p>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-4">
            Be the first to share your thoughts! 💜
          </p>
        )}
      </div>
    </div>
  );
}

// Landing page variant - more prominent
function LandingVariant({
  stories,
  sessionHash,
  userId,
  onVote,
}: {
  stories: any[];
  sessionHash: string;
  userId?: Id<"users"> | null;
  onVote: any;
}) {
  return (
    <div className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl p-6 border border-[var(--color-aurora-purple)]/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
          <Newspaper className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            What Sisters Think 💜
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Today's news through women's eyes
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stories.slice(0, 2).map((story) => (
          <NewsStoryCard
            key={story._id}
            story={story}
            sessionHash={sessionHash}
            userId={userId}
            onVote={onVote}
            isExpanded={false}
            onToggleExpand={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

// Compact variant for sidebar/feed
function CompactVariant({
  stories,
  sessionHash,
  userId,
  onVote,
}: {
  stories: any[];
  sessionHash: string;
  userId?: Id<"users"> | null;
  onVote: any;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-[var(--color-aurora-purple)]" />
        <span className="font-semibold text-sm text-[var(--foreground)]">
          Today's Discussion
        </span>
      </div>
      {stories.slice(0, 2).map((story) => (
        <Link
          key={story._id}
          href={`/news/${story._id}`}
          className="block p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 transition-colors"
        >
          <Badge className={`mb-1 text-xs ${CATEGORY_COLORS[story.category]}`}>
            {CATEGORY_LABELS[story.category]}
          </Badge>
          <p className="font-medium text-sm text-[var(--foreground)] line-clamp-2">
            {story.title}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
            <span>{story.totalVotes} votes</span>
            <span>•</span>
            <span>{story.commentCount} comments</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default DailyNewsPanel;
