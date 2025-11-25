"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface NestedCommentProps {
  comment: any;
  currentUserId?: Id<"users">;
  postId: Id<"posts">;
  depth?: number;
  maxDepth?: number;
}

export function NestedComment({
  comment,
  currentUserId,
  postId,
  depth = 0,
  maxDepth = 5,
}: NestedCommentProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const vote = useMutation(api.comments.vote);
  const createComment = useMutation(api.comments.create);

  const handleReply = async () => {
    if (!currentUserId || !replyText.trim()) return;
    
    try {
      await createComment({
        postId,
        authorId: currentUserId,
        content: replyText,
        parentCommentId: comment._id,
      });
      setReplyText("");
      setShowReply(false);
    } catch (error) {
      console.error("Reply error:", error);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!currentUserId) return;
    
    try {
      await vote({
        userId: currentUserId,
        targetId: comment._id,
        targetType: "comment",
        voteType,
      });
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  // Calculate indentation (max 5 levels)
  const indentLevel = Math.min(depth, maxDepth);
  const indentClass = `ml-${indentLevel * 4}`;
  
  // Render children recursively
  const children = comment.replies || [];
  const hasChildren = children.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-2 text-sm mb-3">
        {/* Collapse button for threads with replies */}
        {hasChildren && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors w-4 flex-shrink-0"
          >
            {isCollapsed ? "+" : "−"}
          </button>
        )}
        
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.author?.profileImage} />
          <AvatarFallback>
            {comment.author?.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold">{comment.author?.name || "Anonymous"}</span>
              {comment.author?.trustScore > 0 && (
                <span className="text-xs text-gray-500">
                  Trust: {comment.author.trustScore}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
              </span>
            </div>
            
            {!isCollapsed && (
              <>
                <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleVote("upvote")}
                    disabled={!currentUserId}
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {comment.upvotes || 0}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleVote("downvote")}
                    disabled={!currentUserId}
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    {comment.downvotes || 0}
                  </Button>
                  
                  {currentUserId && depth < maxDepth && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowReply(!showReply)}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
              </>
            )}
            
            {isCollapsed && hasChildren && (
              <p className="text-xs text-gray-500 mt-1">
                [{children.length} {children.length === 1 ? 'reply' : 'replies'} hidden]
              </p>
            )}
          </div>
          
          {/* Reply Input */}
          {showReply && !isCollapsed && (
            <div className="mt-2 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyText.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Nested Replies */}
          {!isCollapsed && hasChildren && (
            <div className="mt-3 space-y-3">
              {children.map((child: any) => (
                <NestedComment
                  key={child._id}
                  comment={child}
                  currentUserId={currentUserId}
                  postId={postId}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
