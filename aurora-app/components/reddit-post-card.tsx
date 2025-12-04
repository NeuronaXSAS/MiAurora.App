"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Bookmark,
  Award,
  Trash2,
  Send,
  CheckCircle2,
  Flame,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NestedComment } from "@/components/nested-comment";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

interface RedditPostCardProps {
  post: {
    _id: string;
    _creationTime: number;
    title: string;
    description: string;
    rating: number;
    lifeDimension: string;
    authorId: string;
    location?: {
      name: string;
      coordinates: number[];
    };
    media?: Array<{
      type: "image" | "video";
      url: string;
    }>;
    verificationCount: number;
    isVerified: boolean;
    isAnonymous: boolean;
    upvotes?: number;
    downvotes?: number;
    commentCount?: number;
    author: {
      name: string;
      trustScore: number;
      profileImage?: string;
    };
  };
  currentUserId?: Id<"users">;
  onVerify?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const communityIcons: Record<string, string> = {
  professional: "💼",
  social: "👥",
  daily: "🏠",
  travel: "✈️",
  financial: "💰",
  safety: "🛡️",
  health: "💗",
  motherhood: "👶",
};

const communityNames: Record<string, string> = {
  professional: "c/CareerWomen",
  social: "c/WomenConnect",
  daily: "c/DailyLife",
  travel: "c/SafeTravels",
  financial: "c/WomenFinance",
  safety: "c/SafetyFirst",
  health: "c/WellnessCircle",
  motherhood: "c/MomSupport",
};

export function RedditPostCard({
  post,
  currentUserId,
  onVerify,
  onDelete,
  showActions = true,
}: RedditPostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Check if post is saved using Convex (real backend)
  const savedStatus = useQuery(
    api.savedPosts.isPostSaved,
    currentUserId ? { userId: currentUserId, postId: post._id as Id<"posts"> } : "skip"
  );
  const toggleSave = useMutation(api.savedPosts.toggleSave);
  
  const isSaved = savedStatus ?? false;

  // Handle save/unsave post with real backend
  const handleSave = async () => {
    if (!currentUserId) return;
    try {
      await toggleSave({ userId: currentUserId, postId: post._id as Id<"posts"> });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);


  const isAuthor = currentUserId === post.authorId;
  const communityName = communityNames[post.lifeDimension] || "r/Aurora";
  const communityIcon = communityIcons[post.lifeDimension] || "🌸";

  const vote = useMutation(api.comments.vote);
  const createComment = useMutation(api.comments.create);
  const comments = useQuery(
    api.comments.getByPost,
    showComments ? { postId: post._id as Id<"posts"> } : "skip"
  );

  const currentVote = useQuery(
    api.comments.getUserVote,
    currentUserId
      ? { userId: currentUserId as Id<"users">, targetId: post._id }
      : "skip"
  );

  const freshPost = useQuery(api.posts.getPost, {
    postId: post._id as Id<"posts">,
  });

  useEffect(() => {
    if (currentVote !== undefined) {
      setUserVote(currentVote);
    }
  }, [currentVote]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!currentUserId) return;
    try {
      await vote({
        userId: currentUserId as Id<"users">,
        targetId: post._id,
        targetType: "post",
        voteType,
      });
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const displayPost = freshPost || post;
  const voteScore = (displayPost.upvotes || 0) - (displayPost.downvotes || 0);

  const handleComment = async () => {
    if (!currentUserId || !commentText.trim()) return;
    try {
      await createComment({
        postId: post._id as Id<"posts">,
        authorId: currentUserId as Id<"users">,
        content: commentText,
      });
      setCommentText("");
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.description.slice(0, 100),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--color-aurora-purple)]/40 transition-all duration-200 shadow-sm hover:shadow-lg group">
      {/* Main content area */}
      <div className="flex">
        {/* Vote column - Desktop */}
        <div className="hidden sm:flex flex-col items-center py-3 px-2 bg-[var(--accent)]/30 gap-1">
          <button
            onClick={() => handleVote("upvote")}
            className={`p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors ${
              userVote === "upvote" ? "text-[var(--color-aurora-pink)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            <ArrowBigUp className="w-6 h-6" fill={userVote === "upvote" ? "currentColor" : "none"} />
          </button>
          <span className={`text-xs font-bold ${
            voteScore > 0 ? "text-[var(--color-aurora-pink)]" : 
            voteScore < 0 ? "text-[var(--color-aurora-blue)]" : 
            "text-[var(--muted-foreground)]"
          }`}>
            {voteScore}
          </span>
          <button
            onClick={() => handleVote("downvote")}
            className={`p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors ${
              userVote === "downvote" ? "text-[var(--color-aurora-blue)]" : "text-[var(--muted-foreground)]"
            }`}
          >
            <ArrowBigDown className="w-6 h-6" fill={userVote === "downvote" ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-xs">
              {communityIcon}
            </div>
            <Link href="/circles" className="font-semibold text-[var(--color-aurora-purple)] hover:underline">
              {communityName}
            </Link>
            <span className="text-[var(--muted-foreground)]">•</span>
            <span className="text-[var(--muted-foreground)]">
              Posted by u/{post.isAnonymous ? "anonymous" : (post.author.name || "user")}
            </span>
            <span className="text-[var(--muted-foreground)]">
              {formatDistanceToNow(post._creationTime, { addSuffix: false })}
            </span>
            {displayPost.isVerified && (
              <Badge className="bg-[var(--color-aurora-mint)]/30 text-green-700 dark:text-[var(--color-aurora-mint)] border-0 text-[10px] px-1.5 py-0">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                Verified
              </Badge>
            )}
            {/* Trending/Hot badge based on engagement velocity */}
            {(() => {
              const ageHours = Math.max(1, (Date.now() - post._creationTime) / (1000 * 60 * 60));
              const engagement = (displayPost.upvotes || 0) + (displayPost.commentCount || 0) * 2;
              const velocity = engagement / ageHours;
              
              if (velocity > 5) {
                return (
                  <Badge className="bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white border-0 text-[10px] px-1.5 py-0 animate-pulse">
                    <Flame className="w-3 h-3 mr-0.5" />
                    Hot
                  </Badge>
                );
              } else if (velocity > 2) {
                return (
                  <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0 text-[10px] px-1.5 py-0">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    Trending
                  </Badge>
                );
              }
              return null;
            })()}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[var(--foreground)] mb-2 leading-snug text-base">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-[var(--foreground)]/80 mb-3 line-clamp-4 leading-relaxed">
            {post.description}
          </p>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <div className="mb-3 rounded-xl overflow-hidden border border-[var(--border)]">
              {post.media[0].type === "image" && (
                <img
                  src={post.media[0].url}
                  alt="Post media"
                  className="w-full max-h-[400px] object-cover"
                />
              )}
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
            {/* Mobile vote buttons */}
            <div className="flex sm:hidden items-center gap-1 mr-2 bg-[var(--accent)]/50 rounded-full px-1">
              <button
                onClick={() => handleVote("upvote")}
                className={`p-2 rounded-full hover:bg-[var(--accent)] transition-colors ${
                  userVote === "upvote" ? "text-[var(--color-aurora-pink)]" : ""
                }`}
              >
                <ArrowBigUp className="w-5 h-5" fill={userVote === "upvote" ? "currentColor" : "none"} />
              </button>
              <span className={`text-xs font-bold min-w-[20px] text-center ${
                voteScore > 0 ? "text-[var(--color-aurora-pink)]" : 
                voteScore < 0 ? "text-[var(--color-aurora-blue)]" : ""
              }`}>
                {voteScore}
              </span>
              <button
                onClick={() => handleVote("downvote")}
                className={`p-2 rounded-full hover:bg-[var(--accent)] transition-colors ${
                  userVote === "downvote" ? "text-[var(--color-aurora-blue)]" : ""
                }`}
              >
                <ArrowBigDown className="w-5 h-5" fill={userVote === "downvote" ? "currentColor" : "none"} />
              </button>
            </div>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-[var(--accent)] text-xs font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {displayPost.commentCount || 0}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-[var(--accent)] text-xs font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button 
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-[var(--accent)] text-xs font-medium transition-colors ${
                isSaved ? "text-[var(--color-aurora-purple)]" : ""
              }`}
            >
              <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
              {isSaved ? "Saved" : "Save"}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full hover:bg-[var(--accent)] ml-auto transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
                {isAuthor && onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-[var(--color-aurora-salmon)]">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {showActions && onVerify && !isAuthor && (
                  <DropdownMenuItem onClick={onVerify}>
                    <Award className="w-4 h-4 mr-2" />
                    Verify (+5 credits)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-[var(--border)] p-4 bg-[var(--accent)]/20">
          {/* Comment Input */}
          {currentUserId && (
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="What are your thoughts?"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] bg-[var(--background)] border-[var(--border)] resize-none rounded-xl"
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="self-end min-h-[44px] bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/90 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Comments List */}
          {comments && comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <NestedComment
                  key={comment._id}
                  comment={comment}
                  currentUserId={currentUserId}
                  postId={post._id as Id<"posts">}
                  depth={0}
                  maxDepth={5}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
