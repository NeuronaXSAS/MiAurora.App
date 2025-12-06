"use client";

/**
 * Conversation Tracker - Dashboard for tracking post discussions
 * 
 * Allows users to:
 * - See posts they've commented on
 * - Track replies to their comments
 * - Follow discussions without account (localStorage)
 * - Incentivize account creation for full features
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Bell, BellOff, Bookmark, 
  ChevronRight, Sparkles, UserPlus, X,
  TrendingUp, Clock, Heart, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface TrackedPost {
  postId: string;
  title: string;
  lastSeen: number;
  newReplies: number;
  isFollowing: boolean;
  myCommentCount: number;
}

interface ConversationTrackerProps {
  userId?: Id<"users"> | null;
  isOpen: boolean;
  onClose: () => void;
}

// Local storage key for anonymous tracking
const TRACKED_POSTS_KEY = "aurora-tracked-posts";
const ANONYMOUS_INTERACTIONS_KEY = "aurora-anon-interactions";

// Get tracked posts from localStorage (works without account)
function getLocalTrackedPosts(): TrackedPost[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TRACKED_POSTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save tracked posts to localStorage
function saveLocalTrackedPosts(posts: TrackedPost[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRACKED_POSTS_KEY, JSON.stringify(posts));
}

// Track anonymous interactions count
function getAnonymousInteractions(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(ANONYMOUS_INTERACTIONS_KEY) || "0", 10);
}

function incrementAnonymousInteractions(): number {
  const count = getAnonymousInteractions() + 1;
  localStorage.setItem(ANONYMOUS_INTERACTIONS_KEY, count.toString());
  return count;
}

export function ConversationTracker({ userId, isOpen, onClose }: ConversationTrackerProps) {
  const [localPosts, setLocalPosts] = useState<TrackedPost[]>([]);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);

  // Load local tracked posts
  useEffect(() => {
    setLocalPosts(getLocalTrackedPosts());
    setInteractionCount(getAnonymousInteractions());
  }, []);

  // Query for user's tracked posts if logged in
  const userTrackedPosts = useQuery(
    api.posts.getTrackedPosts,
    userId ? { userId } : "skip"
  );

  // Combine local and server tracked posts, filtering out nulls
  const trackedPosts = (userId ? (userTrackedPosts || []) : localPosts).filter((p): p is TrackedPost => p !== null);
  const hasNewReplies = trackedPosts.some(p => p.newReplies > 0);

  // Show signup prompt after 3 interactions without account
  useEffect(() => {
    if (!userId && interactionCount >= 3 && !showSignupPrompt) {
      setShowSignupPrompt(true);
    }
  }, [userId, interactionCount, showSignupPrompt]);

  const handleUnfollow = useCallback((postId: string) => {
    if (userId) {
      // TODO: Call mutation to unfollow
    } else {
      const updated = localPosts.filter(p => p.postId !== postId);
      setLocalPosts(updated);
      saveLocalTrackedPosts(updated);
    }
  }, [userId, localPosts]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[var(--card)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--foreground)]">My Discussions</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {trackedPosts.length} conversations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasNewReplies && (
            <Badge className="bg-[var(--color-aurora-pink)] text-white animate-pulse">
              New
            </Badge>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* Signup Prompt for Anonymous Users */}
      <AnimatePresence>
        {showSignupPrompt && !userId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 border-b border-[var(--border)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-yellow)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[var(--color-aurora-violet)]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--foreground)] text-sm">
                    Never lose track of your conversations! 💜
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Create a free account to get notified when someone replies to you.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href="/api/auth/login">
                      <Button size="sm" className="bg-[var(--color-aurora-purple)] min-h-[36px]">
                        <UserPlus className="w-4 h-4 mr-1" />
                        Sign Up Free
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setShowSignupPrompt(false)}
                      className="min-h-[36px]"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracked Posts List */}
      <div className="flex-1 overflow-y-auto">
        {trackedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[var(--muted-foreground)]" />
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">
              No discussions yet
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Comment on posts to start tracking conversations. You'll see replies here!
            </p>
            <Link href="/feed">
              <Button className="bg-[var(--color-aurora-purple)]">
                Explore Feed
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {trackedPosts.map((post) => (
              <TrackedPostItem
                key={post.postId}
                post={post}
                onUnfollow={() => handleUnfollow(post.postId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {!userId && trackedPosts.length > 0 && (
        <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/30">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>Stored locally on this device</span>
            <Link href="/api/auth/login" className="text-[var(--color-aurora-purple)] hover:underline">
              Sync across devices →
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Individual tracked post item
function TrackedPostItem({ 
  post, 
  onUnfollow 
}: { 
  post: TrackedPost; 
  onUnfollow: () => void;
}) {
  return (
    <Link href={`/feed?post=${post.postId}`}>
      <div className="p-4 hover:bg-[var(--accent)]/50 transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {post.newReplies > 0 && (
                <Badge className="bg-[var(--color-aurora-pink)] text-white text-xs px-1.5 py-0">
                  {post.newReplies} new
                </Badge>
              )}
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatDistanceToNow(post.lastSeen, { addSuffix: true })}
              </span>
            </div>
            <p className="font-medium text-[var(--foreground)] text-sm line-clamp-2">
              {post.title}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.myCommentCount} comments
              </span>
              {post.isFollowing && (
                <span className="flex items-center gap-1 text-[var(--color-aurora-purple)]">
                  <Bell className="w-3 h-3" />
                  Following
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnfollow();
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--color-aurora-salmon)]"
              title="Stop following"
            >
              <BellOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Hook to track a post when user comments
export function useTrackPost() {
  const trackPost = useCallback((postId: string, title: string) => {
    const posts = getLocalTrackedPosts();
    const existing = posts.find(p => p.postId === postId);
    
    if (existing) {
      existing.lastSeen = Date.now();
      existing.myCommentCount += 1;
    } else {
      posts.unshift({
        postId,
        title,
        lastSeen: Date.now(),
        newReplies: 0,
        isFollowing: true,
        myCommentCount: 1,
      });
    }
    
    // Keep only last 50 tracked posts
    saveLocalTrackedPosts(posts.slice(0, 50));
    incrementAnonymousInteractions();
  }, []);

  return { trackPost };
}

// Floating button to open tracker
export function ConversationTrackerButton({ 
  onClick, 
  hasNew 
}: { 
  onClick: () => void; 
  hasNew?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-3 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-all hover:scale-105"
    >
      <MessageSquare className="w-5 h-5 text-[var(--color-aurora-purple)]" />
      {hasNew && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-aurora-pink)] rounded-full animate-pulse" />
      )}
    </button>
  );
}
