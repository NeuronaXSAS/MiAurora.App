"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, Trash2, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

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

  const votePoll = useMutation(api.polls.votePoll);
  const deletePoll = useMutation(api.polls.deletePoll);
  const votePost = useMutation(api.posts.votePost);
  
  // Get user's existing vote
  const userVote = useQuery(
    api.polls.getUserVote,
    currentUserId ? { postId: post._id, userId: currentUserId } : "skip"
  );

  const isAuthor = currentUserId === post.authorId;
  const hasVoted = userVote !== null && userVote !== undefined;
  const totalVotes = post.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;

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
    professional: "bg-blue-100 text-blue-800",
    social: "bg-green-100 text-green-800",
    daily: "bg-yellow-100 text-yellow-800",
    travel: "bg-purple-100 text-purple-800",
    financial: "bg-red-100 text-red-800",
  };

  return (
    <Card className={`hover-lift animate-fade-in-up ${isMobile ? 'rounded-none border-x-0' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-orange-600" />
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
              {post.description && (
                <p className="text-sm text-gray-600 mt-1">{post.description}</p>
              )}
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
                    className={`w-full justify-start h-auto p-4 text-left hover:bg-purple-50 hover:border-purple-300 ${
                      isMobile ? 'min-h-[44px]' : ''
                    }`}
                    onClick={() => handleVote(index)}
                    disabled={isVoting}
                  >
                    <span className="font-medium">{option.text}</span>
                  </Button>
                ) : (
                  // Results mode
                  <div className={`relative p-4 rounded-lg border ${
                    isSelected ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium ${
                        isSelected ? 'text-purple-900' : 'text-gray-900'
                      }`}>
                        {option.text}
                        {isSelected && ' ✓'}
                      </span>
                      <span className="text-sm font-bold text-gray-700">
                        {percentage}%
                      </span>
                    </div>
                    {showResults && (
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Poll Stats */}
        <div className="flex items-center justify-between pt-2 border-t text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
            </div>
          </div>
          
          {!currentUserId && !hasVoted && (
            <span className="text-xs text-gray-500">Login to vote</span>
          )}
        </div>

        {/* Engagement Actions */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePostVote("upvote")}
            disabled={!currentUserId}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{post.upvotes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePostVote("downvote")}
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
