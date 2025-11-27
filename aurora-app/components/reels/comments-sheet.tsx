'use client';

/**
 * CommentsSheet Component
 * 
 * Bottom sheet for viewing and adding comments on reels.
 * Supports nested replies and real-time updates.
 */

import { useState, useRef, useEffect } from 'react';
import { X, Send, Heart, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';

interface CommentsSheetProps {
  reelId: Id<'reels'>;
  currentUserId: Id<'users'>;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsSheet({ reelId, currentUserId, isOpen, onClose }: CommentsSheetProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: Id<'reelComments'>; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const comments = useQuery(api.reels.getReelComments, isOpen ? { reelId, limit: 50 } : 'skip');
  const addComment = useMutation(api.reels.addComment);
  const likeComment = useMutation(api.reels.likeComment);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment({
        reelId,
        userId: currentUserId,
        content: newComment.trim(),
        parentId: replyingTo?.id,
      });
      setNewComment('');
      setReplyingTo(null);
      
      // Scroll to bottom after adding comment
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleLike = async (commentId: Id<'reelComments'>) => {
    try {
      await likeComment({ commentId, userId: currentUserId });
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-3xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-[var(--muted)] rounded-full mx-auto mt-3 mb-2" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            Comments {comments?.total ? `(${comments.total})` : ''}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {comments === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : comments.comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--muted-foreground)]">No comments yet</p>
              <p className="text-sm text-[var(--muted-foreground)]">Be the first to comment!</p>
            </div>
          ) : (
            comments.comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={() => setReplyingTo({ id: comment._id, name: comment.author?.name || 'Anonymous' })}
                onLike={() => handleLike(comment._id)}
                formatTimeAgo={formatTimeAgo}
              />
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="px-6 py-2 bg-[var(--muted)] flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">
              Replying to <span className="font-medium text-[var(--foreground)]">{replyingTo.name}</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-[var(--color-aurora-purple)] text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input */}
        <form 
          onSubmit={handleSubmit}
          className="px-6 py-4 border-t border-[var(--border)] safe-area-inset-bottom"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : 'Add a comment...'}
                className="w-full h-12 px-4 pr-12 bg-[var(--muted)] rounded-full text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-purple)]"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  newComment.trim()
                    ? "bg-[var(--color-aurora-purple)] text-white"
                    : "bg-transparent text-[var(--muted-foreground)]"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

interface CommentItemProps {
  comment: {
    _id: Id<'reelComments'>;
    content: string;
    likes: number;
    isLiked: boolean;
    _creationTime: number;
    author: {
      _id: Id<'users'>;
      name: string;
      profileImage?: string;
    } | null;
    replies?: Array<{
      _id: Id<'reelComments'>;
      content: string;
      likes: number;
      isLiked: boolean;
      _creationTime: number;
      author: {
        _id: Id<'users'>;
        name: string;
        profileImage?: string;
      } | null;
    }>;
  };
  currentUserId: Id<'users'>;
  onReply: () => void;
  onLike: () => void;
  formatTimeAgo: (timestamp: number) => string;
}

function CommentItem({ comment, currentUserId, onReply, onLike, formatTimeAgo }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex-shrink-0 flex items-center justify-center overflow-hidden">
          {comment.author?.profileImage ? (
            <img
              src={comment.author.profileImage}
              alt={comment.author.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {comment.author?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {comment.author?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatTimeAgo(comment._creationTime)}
            </span>
          </div>
          <p className="text-sm text-[var(--foreground)] mt-1 break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onLike}
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--color-aurora-pink)]"
            >
              <Heart className={cn("w-4 h-4", comment.isLiked && "fill-[var(--color-aurora-pink)] text-[var(--color-aurora-pink)]")} />
              {comment.likes > 0 && comment.likes}
            </button>
            <button
              onClick={onReply}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium"
            >
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-13 pl-10 border-l-2 border-[var(--border)]">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-sm text-[var(--color-aurora-purple)] font-medium"
            >
              View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {reply.author?.profileImage ? (
                      <img
                        src={reply.author.profileImage}
                        alt={reply.author.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {reply.author?.name?.[0]?.toUpperCase() || 'A'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">
                        {reply.author?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatTimeAgo(reply._creationTime)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--foreground)] mt-1 break-words">
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowReplies(false)}
                className="text-sm text-[var(--muted-foreground)]"
              >
                Hide replies
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
