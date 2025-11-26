"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Star,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Image as ImageIcon,
  Video,
  MoreVertical,
  Trash2,
  Send,
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

interface PostCardProps {
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
  hasVerified?: boolean;
  showActions?: boolean;
}

const lifeDimensionColors = {
  professional: "bg-aurora-blue/20 text-aurora-blue",
  social: "bg-aurora-lavender/30 text-aurora-violet",
  daily: "bg-aurora-mint/50 text-green-800",
  travel: "bg-aurora-orange/20 text-aurora-orange",
  financial: "bg-aurora-pink/30 text-aurora-pink",
};

const lifeDimensionLabels = {
  professional: "Professional",
  social: "Social",
  daily: "Daily Life",
  travel: "Travel",
  financial: "Financial",
};

export function PostCard({
  post,
  currentUserId,
  onVerify,
  onDelete,
  hasVerified = false,
  showActions = true,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  
  const isAuthor = currentUserId === post.authorId;
  const dimensionColor =
    lifeDimensionColors[post.lifeDimension as keyof typeof lifeDimensionColors] ||
    "bg-gray-100 text-gray-800";
  
  const dimensionLabel =
    lifeDimensionLabels[post.lifeDimension as keyof typeof lifeDimensionLabels] ||
    post.lifeDimension;

  const vote = useMutation(api.comments.vote);
  const createComment = useMutation(api.comments.create);
  const comments = useQuery(
    api.comments.getByPost,
    showComments ? { postId: post._id as Id<"posts"> } : "skip"
  );
  
  // Get user's current vote
  const currentVote = useQuery(
    api.comments.getUserVote,
    currentUserId ? { 
      userId: currentUserId as Id<"users">, 
      targetId: post._id 
    } : "skip"
  );

  // Get fresh post data to see updated counts
  const freshPost = useQuery(
    api.posts.getPost,
    { postId: post._id as Id<"posts"> }
  );

  // Update local state when vote is fetched
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
      // Fresh post data will be refetched automatically
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  const handleVerify = async () => {
    if (!onVerify) return;
    setIsVerifying(true);
    try {
      await onVerify();
      setVerifySuccess(true);
      setTimeout(() => setVerifySuccess(false), 3000);
    } catch (error) {
      console.error("Verify error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Use fresh data if available, otherwise use prop data
  const displayPost = freshPost || post;

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

  return (
    <Card className="hover-lift animate-fade-in-up overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar>
              <AvatarImage src={post.author.profileImage} />
              <AvatarFallback>
                {(post.author.name && post.author.name !== 'null' ? post.author.name : 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">
                  {post.author.name && post.author.name !== 'null' ? post.author.name : 'Anonymous'}
                </p>
                {post.author.trustScore > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Trust: {post.author.trustScore}
                  </Badge>
                )}
                {!isAuthor && !post.isAnonymous && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] text-xs"
                    onClick={() => window.location.href = `/messages/${post.authorId}`}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {formatDistanceToNow(post._creationTime, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={dimensionColor}>{dimensionLabel}</Badge>
            {isAuthor && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        {/* Title and Rating */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-base sm:text-lg flex-1 min-w-0 text-[var(--foreground)]">{post.title}</h3>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    i < post.rating
                      ? "fill-[var(--color-aurora-yellow)] text-[var(--color-aurora-yellow)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{post.description}</p>
        </div>

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <MapPin className="w-4 h-4 text-[var(--color-aurora-purple)]" />
            <span>{post.location.name}</span>
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.media.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {index === 3 && post.media && post.media.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                    +{post.media.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Voting and Engagement */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 border-t">
          {/* Upvote/Downvote */}
          <div className="flex items-center gap-2">
            <Button
              variant={userVote === "upvote" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleVote("upvote")}
              className="min-h-[44px] px-3 flex-1 sm:flex-none"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              <span className="min-w-[20px] text-center">{displayPost.upvotes || 0}</span>
            </Button>
            <Button
              variant={userVote === "downvote" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleVote("downvote")}
              className="min-h-[44px] px-3 flex-1 sm:flex-none"
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              <span className="min-w-[20px] text-center">{displayPost.downvotes || 0}</span>
            </Button>
          </div>

          {/* Comments */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="min-h-[44px] px-3"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            <span className="min-w-[20px] text-center">{displayPost.commentCount || 0}</span>
          </Button>

          {/* Verification */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
            {displayPost.isVerified && (
              <Badge variant="outline" className="text-green-600 border-green-600 justify-center py-1.5">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            {!displayPost.isVerified && displayPost.verificationCount > 0 && (
              <Badge variant="outline" className="text-aurora-blue border-aurora-blue justify-center py-1.5 whitespace-nowrap">
                {displayPost.verificationCount}/5 verifications
              </Badge>
            )}
            {showActions && onVerify && !isAuthor && (
              <Button
                variant={hasVerified || verifySuccess ? "outline" : "default"}
                size="sm"
                onClick={handleVerify}
                disabled={hasVerified || isVerifying || verifySuccess}
                className={`min-h-[44px] ${verifySuccess ? "bg-[var(--color-aurora-mint)] text-green-700 border-[var(--color-aurora-mint)]" : ""}`}
              >
                {verifySuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    +5 Credits!
                  </>
                ) : hasVerified ? (
                  "Verified"
                ) : (
                  "Verify (+5)"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-3 pt-3 border-t">
            {/* Comment Input */}
            {currentUserId && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="min-h-[44px] min-w-[44px]"
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
      </CardContent>
    </Card>
  );
}
