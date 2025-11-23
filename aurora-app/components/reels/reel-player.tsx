"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ReelPlayerProps {
  reel: {
    _id: Id<"reels">;
    videoUrl: string;
    thumbnailUrl: string;
    caption?: string;
    hashtags?: string[];
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    author: {
      _id: Id<"users">;
      name: string;
      profileImage?: string;
      trustScore: number;
    } | null;
    aiMetadata?: {
      safetyCategory?: "Harassment" | "Joy" | "Lighting Issue" | "Infrastructure Problem" | "Positive Experience" | "Warning";
      sentiment?: number;
      detectedObjects?: string[];
      visualTags?: string[];
    } | null;
  };
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export function ReelPlayer({ reel, isActive, onLike, onComment, onShare }: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const incrementViews = useMutation(api.reels.incrementViews);

  // Auto-play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => {
        setIsPlaying(true);
        // Increment view count on first play
        incrementViews({ reelId: reel._id });
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel._id, incrementViews]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Calculate safety score from AI metadata
  const getSafetyScore = () => {
    if (!reel.aiMetadata?.sentiment) return null;
    
    // Convert sentiment (-1 to 1) to safety score (0-100)
    // Positive sentiment = higher safety
    const score = Math.round(((reel.aiMetadata.sentiment + 1) / 2) * 100);
    return score;
  };

  const safetyScore = getSafetyScore();

  // Get safety color based on score
  const getSafetyColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  // Get safety icon based on category
  const getSafetyIcon = () => {
    const category = reel.aiMetadata?.safetyCategory;
    if (category === "Harassment" || category === "Warning") {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Shield className="w-5 h-5" />;
  };

  // Format number for display
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative w-full h-screen bg-black snap-start snap-always">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlayPause}
      />

      {/* Safety Score Overlay (Top Right) */}
      {safetyScore !== null && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
          <div className={cn("flex items-center gap-1", getSafetyColor(safetyScore))}>
            {getSafetyIcon()}
            <span className="font-bold text-lg">{safetyScore}</span>
          </div>
        </div>
      )}

      {/* Interaction Buttons (Right Side) */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6">
        {/* Like */}
        <button
          onClick={onLike}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            reel.isLiked ? "bg-red-500" : "bg-white/20 backdrop-blur-sm"
          )}>
            <Heart className={cn("w-6 h-6", reel.isLiked && "fill-white")} />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.likes)}</span>
        </button>

        {/* Comment */}
        <button
          onClick={onComment}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.comments)}</span>
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.shares)}</span>
        </button>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Author Info */}
        {reel.author && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {reel.author.profileImage ? (
                <img
                  src={reel.author.profileImage}
                  alt={reel.author.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                reel.author.name[0].toUpperCase()
              )}
            </div>
            <div>
              <p className="text-white font-semibold">{reel.author.name}</p>
              <p className="text-white/70 text-xs">Trust Score: {reel.author.trustScore}</p>
            </div>
          </div>
        )}

        {/* Caption */}
        {reel.caption && (
          <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>
        )}

        {/* AI Tags (Safety Intelligence) */}
        {reel.aiMetadata && (
          <div className="flex flex-wrap gap-2 mb-2">
            {reel.aiMetadata.safetyCategory && (
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
                reel.aiMetadata.safetyCategory === "Harassment" || reel.aiMetadata.safetyCategory === "Warning"
                  ? "bg-red-500/80 text-white"
                  : reel.aiMetadata.safetyCategory === "Joy" || reel.aiMetadata.safetyCategory === "Positive Experience"
                  ? "bg-green-500/80 text-white"
                  : "bg-yellow-500/80 text-white"
              )}>
                {reel.aiMetadata.safetyCategory === "Harassment" && "⚠️ Harassment Risk"}
                {reel.aiMetadata.safetyCategory === "Joy" && "😊 Positive Vibe"}
                {reel.aiMetadata.safetyCategory === "Lighting Issue" && "💡 Lighting Issue"}
                {reel.aiMetadata.safetyCategory === "Infrastructure Problem" && "🚧 Infrastructure"}
                {reel.aiMetadata.safetyCategory === "Positive Experience" && "✨ Safe Space"}
                {reel.aiMetadata.safetyCategory === "Warning" && "⚠️ Warning"}
              </span>
            )}
            
            {reel.aiMetadata.visualTags?.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Hashtags */}
        {reel.hashtags && reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reel.hashtags.map((tag, i) => (
              <span key={i} className="text-white/80 text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
