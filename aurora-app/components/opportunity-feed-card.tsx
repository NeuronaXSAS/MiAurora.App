"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Briefcase, GraduationCap, FileText, Calendar, DollarSign, MapPin, Sparkles, MoreVertical, Trash2, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface OpportunityFeedCardProps {
  opportunity: {
    _id: string;
    _creationTime: number;
    creatorId?: string;
    title: string;
    description: string;
    category: string;
    creditCost: number;
    company?: string;
    location?: string;
  };
  currentUserId?: Id<"users">;
  onDelete?: () => void;
}

const categoryIcons = {
  job: Briefcase,
  mentorship: GraduationCap,
  resource: FileText,
  event: Calendar,
  funding: DollarSign,
};

const categoryColors = {
  job: "bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]",
  mentorship: "bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-violet)]",
  resource: "bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-mint)]",
  event: "bg-[var(--color-aurora-yellow)]/30 text-[var(--color-aurora-yellow)]",
  funding: "bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]",
};

export function OpportunityFeedCard({ opportunity, currentUserId, onDelete }: OpportunityFeedCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const Icon = categoryIcons[opportunity.category as keyof typeof categoryIcons] || Briefcase;
  const colorClass = categoryColors[opportunity.category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800";
  const isCreator = currentUserId === opportunity.creatorId;

  const deleteOpportunity = useMutation(api.opportunities.deleteOpportunity);
  const likeOpportunity = useMutation(api.opportunities.likeOpportunity);
  const unlikeOpportunity = useMutation(api.opportunities.unlikeOpportunity);
  const commentOnOpportunity = useMutation(api.opportunities.commentOnOpportunity);

  // Get like status and comments
  const likeStatus = useQuery(
    api.opportunities.getOpportunityLikeStatus,
    currentUserId ? { opportunityId: opportunity._id as Id<"opportunities">, userId: currentUserId } : "skip"
  );
  const comments = useQuery(api.opportunities.getOpportunityComments, {
    opportunityId: opportunity._id as Id<"opportunities">,
  });

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);
    try {
      if (likeStatus?.hasLiked) {
        await unlikeOpportunity({
          userId: currentUserId,
          opportunityId: opportunity._id as Id<"opportunities">,
        });
      } else {
        await likeOpportunity({
          userId: currentUserId,
          opportunityId: opportunity._id as Id<"opportunities">,
        });
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!currentUserId || !commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      await commentOnOpportunity({
        userId: currentUserId,
        opportunityId: opportunity._id as Id<"opportunities">,
        content: commentText.trim(),
      });
      setCommentText("");
      setShowCommentInput(false);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserId || !isCreator) return;

    if (!confirm("Are you sure? Users who unlocked this opportunity will keep access, but you'll stop earning credits from new unlocks.")) {
      return;
    }

    try {
      await deleteOpportunity({
        opportunityId: opportunity._id as Id<"opportunities">,
        userId: currentUserId,
      });
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete opportunity: " + (error as Error).message);
    }
  };

  return (
    <Card className="hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-[var(--foreground)]">{opportunity.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {formatDistanceToNow(opportunity._creationTime, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={colorClass}>
              {opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)}
            </Badge>
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Opportunity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Company and Location */}
        {(opportunity.company || opportunity.location) && (
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)]">
            {opportunity.company && (
              <span className="font-medium text-[var(--foreground)]">{opportunity.company}</span>
            )}
            {opportunity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{opportunity.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-[var(--foreground)]/80 line-clamp-2">{opportunity.description}</p>

        {/* Engagement Actions - Requires credits to interact */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1">
            {/* Like - costs 1 credit */}
            <Button
              variant="ghost"
              size="sm"
              className={`min-h-[40px] min-w-[40px] p-2 group ${
                likeStatus?.hasLiked 
                  ? "text-[var(--color-aurora-pink)]" 
                  : "hover:bg-[var(--color-aurora-mint)]/20 hover:text-[var(--color-aurora-purple)]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLike();
              }}
              disabled={isLiking || !currentUserId}
              title={likeStatus?.hasLiked ? "Unlike (refund 1 credit)" : "Like (1 credit)"}
            >
              {isLiking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${likeStatus?.hasLiked ? "fill-current" : ""}`} />
              )}
              {(likeStatus?.likeCount ?? 0) > 0 && (
                <span className="ml-1 text-xs">{likeStatus?.likeCount}</span>
              )}
            </Button>
            
            {/* Comment - costs 2 credits */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] min-w-[40px] p-2 hover:bg-[var(--color-aurora-lavender)]/30 group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCommentInput(!showCommentInput);
              }}
              title="Comment (2 credits)"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {(comments?.length ?? 0) > 0 && (
                <span className="ml-1 text-xs">{comments?.length}</span>
              )}
            </Button>
            
            {/* Share - free */}
            <Button
              variant="ghost"
              size="sm"
              className="min-h-[40px] min-w-[40px] p-2 hover:bg-[var(--color-aurora-pink)]/20 group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(`${window.location.origin}/opportunities`);
                alert("Link copied!");
              }}
              title="Share (free)"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
              <span className="text-sm font-medium text-[var(--color-aurora-yellow)]">{opportunity.creditCost}</span>
            </div>
            <Link href="/opportunities">
              <Button size="sm" className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]">
                View
              </Button>
            </Link>
          </div>
        </div>

        {/* Comment Input */}
        {showCommentInput && currentUserId && (
          <div className="pt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment... (2 credits)"
                className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-purple)]"
                maxLength={500}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || isCommenting}
                className="bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/90 text-white min-h-[40px]"
              >
                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
              </Button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Commenting costs 2 credits
            </p>
          </div>
        )}

        {/* Comments Preview */}
        {comments && comments.length > 0 && (
          <div className="pt-3 space-y-2">
            {comments.slice(0, 2).map((comment) => (
              <div key={comment._id} className="flex gap-2 text-sm">
                <span className="font-medium text-[var(--foreground)]">
                  {comment.author?.name || "Anonymous"}:
                </span>
                <span className="text-[var(--muted-foreground)] line-clamp-1">
                  {comment.content}
                </span>
              </div>
            ))}
            {comments.length > 2 && (
              <Link href="/opportunities" className="text-xs text-[var(--color-aurora-purple)] hover:underline">
                View all {comments.length} comments
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
