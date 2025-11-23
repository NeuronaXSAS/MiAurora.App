"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ThumbsUp, ThumbsDown, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AIChatCardProps {
  post: {
    _id: Id<"posts">;
    _creationTime: number;
    authorId: Id<"users">;
    title: string;
    description: string;
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

export function AIChatCard({ post, currentUserId, onDelete, isMobile = false }: AIChatCardProps) {
  const votePost = useMutation(api.posts.votePost);
  const deletePost = useMutation(api.posts.deletePost);

  const isAuthor = currentUserId === post.authorId;

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!currentUserId) return;
    
    try {
      await votePost({
        postId: post._id,
        userId: currentUserId,
        voteType,
      });
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || !isAuthor) return;
    
    if (!confirm("Are you sure you want to delete this shared conversation?")) {
      return;
    }
    
    try {
      await deletePost({
        postId: post._id,
        userId: currentUserId,
      });
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete: " + (error as Error).message);
    }
  };

  const lifeDimensionColors: Record<string, string> = {
    professional: "bg-blue-100 text-blue-800",
    social: "bg-green-100 text-green-800",
    daily: "bg-yellow-100 text-yellow-800",
    travel: "bg-purple-100 text-purple-800",
    financial: "bg-red-100 text-red-800",
  };

  // Parse the conversation from description
  const conversationParts = post.description.split("\n\n");

  return (
    <Card className={`hover-lift animate-fade-in-up ${isMobile ? 'rounded-none border-x-0' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {!post.isAnonymous && post.author && (
                  <span className="font-medium text-sm">
                    {post.author.name || post.author.email.split('@')[0]}
                  </span>
                )}
                {post.isAnonymous && (
                  <span className="font-medium text-sm text-gray-500">Anonymous</span>
                )}
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(post._creationTime, { addSuffix: true })}
                </span>
              </div>
              <h3 className="font-semibold text-lg leading-tight">{post.title}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={lifeDimensionColors[post.lifeDimension] || "bg-gray-100 text-gray-800"}>
              {post.lifeDimension}
            </Badge>
            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Conversation */}
        <div className="space-y-3 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {conversationParts.map((part, index) => {
            const isUser = part.startsWith("**You:**");
            const content = part.replace(/\*\*(You|Aurora AI):\*\* /, "");
            
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[85%] ${
                    isUser
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Engagement Actions */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote("upvote")}
            disabled={!currentUserId}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{post.upvotes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVote("downvote")}
            disabled={!currentUserId}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{post.downvotes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentCount || 0}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
