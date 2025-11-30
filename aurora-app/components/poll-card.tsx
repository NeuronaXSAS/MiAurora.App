"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, Users, Trash2, MessageSquare, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { NestedComment } from "@/components/nested-comment";

interface PollCardProps {
  post: {
    _id: Id<"posts">;
    _creationTime: number;
    authorId: Id<"users">;
    title: string;
    description?: string;
    pollOptions?: Array<{
      text: string;
      votes: number;
    }>;
    lifeDimension: string;
    isAnonymous: boolean;
    upvotes?: number;
    downvotes?: number;
    commentCount?: number;
    author?: {
      _id: Id<"users">;
      name?: string;
      email: string;
      profileImage?: string;
      trustScore?: number;
    };
  };
  currentUserId?: Id<"users">;
  onDelete?: () => void;
  isMobile?: boolean;
}

export function PollCard({ post, currentUserId, onDelete, isMobile = false }: PollCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const votePoll = useMutation(api.polls.votePoll);
  const deletePoll = useMutation(api.polls.deletePoll);
  const votePost = useMutation(api.posts.votePost);
  const createComment = useMutation(api.comments.create);
  
  // Get user's existing vote
  const userVote = useQuery(
    api.polls.getUserVote,
    currentUserId ? { postId: post._id, userId: currentUserId } : "skip"
  );

  // Get comments for this poll
  const comments = useQuery(
    api.comments.getByPost,
    showComments ? { postId: post._id } : "skip"
  );

  const isAuthor = currentUserId === post.authorId;
  const hasVoted = userVote !== null && userVote !== undefined;
  const totalVotes = post.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;

  const handleComment = async () => {
    if (!currentUserId || !commentText.trim()) return;
    
    try {
      await createComment({
        postId: post._id,
        authorId: currentUserId,
        content: commentText,
      });
      setCommentText("");
    } catch (error) {
      console.error("Comment error:", error);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!currentUserId || isVoting) return;
    
    setIsVoting(true);
    try {
      await votePoll({
        postId: post._id,
        userId: currentUserId,
        optionIndex,
      });
    } catch (error) {
      console.error("Vote error:", error);
      alert("Failed to vote: " + (error as Error).message);
    } finally {
      setIsVoting(false);
    }
  };

  const handlePostVote = async (voteType: "upvote" | "downvote") => {
    if (!currentUserId) return;
    
    try {
      await votePost({
        postId: post._id,
        userId: currentUserId,
        voteType,
      });
    } catch (error) {
      console.error("Post vote error:", error);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || !isAuthor) return;
    
    if (!confirm("Are you sure you want to delete this poll?")) {
      return;
    }
    
    try {
      await deletePoll({
        postId: post._id,
        userId: currentUserId,
      });
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete poll: " + (error as Error).message);
    }
  };

  const getOptionPercentage = (votes: number): number => {
    return totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  };

  const lifeDimensionColors: Record<string, string> = {
    professional: "bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)]",
    social: "bg-[var(--color-aurora-mint)]/50 text-green-800",
    daily: "bg-[var(--color-aurora-yellow)]/50 text-yellow-800",
    travel: "bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-violet)]",
    financial: "bg-[var(--color-aurora-pink)]/30 text-[var(--color-aurora-pink)]",
  };

  return (
    <Card className={`hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)] ${isMobile ? 'rounded-none border-x-0' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-aurora-purple)]/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-[var(--color-aurora-purple)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {!post.isAnonymous && post.author && (
                  <span className="font-medium text-sm text-[var(--foreground)]">
                    {post.author.name || post.author.email.split('@')[0]}
                  </span>
                )}
                {post.isAnonymous && (
                  <span className="font-medium text-sm text-[var(--muted-foreground)]">Anonymous</span>
                )}
                <span className="text-xs text-[var(--muted-foreground)]">•</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDistanceToNow(post._creationTime, { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-semibold text-lg leading-tight text-[var(--foreground)]">{post.title}</h3>
              {post.description && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{post.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={lifeDimensionColors[post.lifeDimension] || "bg-[var(--accent)] text-[var(--foreground)]"}>
              {post.lifeDimension}
            </Badge>
            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-[var(--color-aurora-salmon)] hover:text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10 min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Poll Options */}
        <div className="space-y-3">
          {post.pollOptions?.map((option, index) => {
            const percentage = getOptionPercentage(option.votes);
            const isSelected = userVote === index;
            const showResults = hasVoted;
            
            return (
              <div key={index} className="relative">
                {currentUserId && !hasVoted ? (
                  // Voting mode - touch-friendly buttons
                  <Button
                    variant="outline"
                    className={`w-full justify-start h-auto p-4 text-left hover:bg-[var(--color-aurora-purple)]/10 hover:border-[var(--color-aurora-purple)] border-[var(--border)] min-h-[48px]`}
                    onClick={() => handleVote(index)}
                    disabled={isVoting}
                  >
                    <span className="font-medium text-[var(--foreground)]">{option.text}</span>
                  </Button>
                ) : (
                  // Results mode
                  <div className={`relative p-4 rounded-xl border ${
                    isSelected ? 'bg-[var(--color-aurora-purple)]/10 border-[var(--color-aurora-purple)]' : 'bg-[var(--accent)] border-[var(--border)]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${
                        isSelected ? 'text-[var(--color-aurora-purple)]' : 'text-[var(--foreground)]'
                      }`}>
                        {option.text}
                        {isSelected && ' ✓'}
                      </span>
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {percentage}%
                      </span>
                    </div>
                    {showResults && (
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    )}
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Poll Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
            </div>
          </div>
          
          {!currentUserId && !hasVoted && (
            <span className="text-xs text-[var(--muted-foreground)]">Login to vote</span>
          )}
        </div>

        {/* Engagement Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePostVote("upvote")}
            disabled={!currentUserId}
            className="flex items-center gap-1 min-h-[44px] hover:bg-[var(--color-aurora-pink)]/10 hover:text-[var(--color-aurora-pink)]"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{post.upvotes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePostVote("downvote")}
            disabled={!currentUserId}
            className="flex items-center gap-1 min-h-[44px] hover:bg-[var(--muted-foreground)]/10"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{post.downvotes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 min-h-[44px] hover:bg-[var(--color-aurora-purple)]/10 hover:text-[var(--color-aurora-purple)]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentCount || 0}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-3 pt-3 border-t border-[var(--border)]">
            {/* Comment Input */}
            {currentUserId && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] border-[var(--border)] bg-[var(--background)]"
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="min-h-[44px] min-w-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white"
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
                    postId={post._id}
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
      </CardContent>
    </Card>
  );
}
