"use client";

import { useState, useRef, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Send, 
  MessageCircle, 
  Reply,
  Loader2,
  Sparkles
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

interface ReelCommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reelId: Id<"reels">;
  currentUserId?: Id<"users">;
}

export function ReelCommentsSheet({ 
  open, 
  onOpenChange, 
  reelId, 
  currentUserId 
}: ReelCommentsSheetProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: Id<"reelComments">; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const comments = useQuery(api.reels.getReelComments, { reelId, limit: 50 });
  const addComment = useMutation(api.reels.addComment);
  const likeComment = useMutation(api.reels.likeComment);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUserId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({
        reelId,
        userId: currentUserId,
        content: newComment.trim(),
        parentId: replyingTo?.id,
      });
      setNewComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: Id<"reelComments">) => {
    if (!currentUserId) return;
    try {
      await likeComment({ commentId, userId: currentUserId });
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const generateAvatar = (seed: string) => {
    const avatar = createAvatar(lorelei, {
      seed,
      backgroundColor: ["c9cef4"],
    });
    return avatar.toDataUri();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] rounded-t-3xl bg-[var(--card)] border-t border-[var(--border)]">
        <DrawerHeader className="pb-4 border-b border-[var(--border)]">
          <DrawerTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <MessageCircle className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Comments
            {comments && (
              <span className="text-sm font-normal text-[var(--muted-foreground)]">
                ({comments.total})
              </span>
            )}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 h-[calc(85vh-180px)] py-4 overflow-y-auto px-4">
          {!comments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-aurora-purple)]" />
            </div>
          ) : comments.comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-[var(--color-aurora-lavender)]/20 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[var(--color-aurora-purple)]" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-1">Be the first to comment!</p>
              <p className="text-sm text-[var(--muted-foreground)]">Share your thoughts with the community 💜</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onReply={(id, name) => setReplyingTo({ id, name })}
                  generateAvatar={generateAvatar}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[var(--card)] border-t border-[var(--border)]">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-3 py-2 bg-[var(--color-aurora-lavender)]/10 rounded-lg">
              <span className="text-sm text-[var(--muted-foreground)]">
                Replying to <span className="text-[var(--color-aurora-purple)] font-medium">{replyingTo.name}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-6 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."}
              className="flex-1 h-12 rounded-xl bg-[var(--background)] border-[var(--border)]"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={!currentUserId || isSubmitting}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || !currentUserId || isSubmitting}
              className="h-12 w-12 rounded-xl bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}


// Comment Item Component
interface CommentItemProps {
  comment: {
    _id: Id<"reelComments">;
    _creationTime: number;
    content: string;
    likes: number;
    isLiked: boolean;
    author: {
      _id: Id<"users">;
      name: string;
      profileImage?: string;
    } | null;
    replies?: Array<{
      _id: Id<"reelComments">;
      _creationTime: number;
      content: string;
      likes: number;
      isLiked: boolean;
      author: {
        _id: Id<"users">;
        name: string;
        profileImage?: string;
      } | null;
    }>;
  };
  currentUserId?: Id<"users">;
  onLike: (commentId: Id<"reelComments">) => void;
  onReply: (commentId: Id<"reelComments">, authorName: string) => void;
  generateAvatar: (seed: string) => string;
  isReply?: boolean;
}

function CommentItem({ 
  comment, 
  currentUserId, 
  onLike, 
  onReply, 
  generateAvatar,
  isReply = false 
}: CommentItemProps) {
  const authorName = comment.author?.name || "Anonymous";
  
  return (
    <div className={`${isReply ? "ml-10 pl-4 border-l-2 border-[var(--color-aurora-lavender)]/30" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-9 h-9 flex-shrink-0">
          {comment.author?.profileImage ? (
            <AvatarImage src={comment.author.profileImage} />
          ) : (
            <AvatarImage src={generateAvatar(comment.author?._id || "anon")} />
          )}
          <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] text-xs">
            {authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-[var(--foreground)]">
              {authorName}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-sm text-[var(--foreground)] leading-relaxed mb-2">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(comment._id)}
              disabled={!currentUserId}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.isLiked 
                  ? "text-[var(--color-aurora-pink)]" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--color-aurora-pink)]"
              }`}
            >
              <Heart className={`w-4 h-4 ${comment.isLiked ? "fill-current" : ""}`} />
              {comment.likes > 0 && comment.likes}
            </button>
            
            {!isReply && (
              <button
                onClick={() => onReply(comment._id, authorName)}
                disabled={!currentUserId}
                className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)] transition-colors"
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              onLike={onLike}
              onReply={onReply}
              generateAvatar={generateAvatar}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
