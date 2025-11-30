"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, MessageCircle, Share2, Shield, AlertTriangle, Volume2, VolumeX, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ShareSheet } from "./share-sheet";
import { CommentsSheet } from "./comments-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  currentUserId: Id<"users">;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export function ReelPlayer({ reel, isActive, currentUserId, onLike }: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localLikes, setLocalLikes] = useState(reel.likes);
  const [localIsLiked, setLocalIsLiked] = useState(reel.isLiked);
  const lastTapRef = useRef<number>(0);
  const incrementViews = useMutation(api.reels.incrementViews);
  const deleteReel = useMutation(api.reels.deleteReel);
  
  const isOwner = reel.author?._id === currentUserId;

  const handleDeleteReel = async () => {
    if (!currentUserId) return;
    setIsDeleting(true);
    try {
      await deleteReel({ reelId: reel._id, userId: currentUserId });
      setShowDeleteDialog(false);
      // Reload the page to refresh the feed
      window.location.reload();
    } catch (error) {
      console.error("Error deleting reel:", error);
      alert("Failed to delete reel. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    setLocalLikes(reel.likes);
    setLocalIsLiked(reel.isLiked);
  }, [reel.likes, reel.isLiked]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => {
        setIsPlaying(true);
        incrementViews({ reelId: reel._id });
      }).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel._id, incrementViews]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!localIsLiked) {
        setLocalIsLiked(true);
        setLocalLikes(prev => prev + 1);
        onLike();
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0 && Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          togglePlayPause();
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [localIsLiked, onLike, togglePlayPause]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleLikeClick = () => {
    setLocalIsLiked(!localIsLiked);
    setLocalLikes(prev => localIsLiked ? prev - 1 : prev + 1);
    onLike();
    if (!localIsLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const getSafetyScore = () => {
    if (!reel.aiMetadata?.sentiment) return null;
    return Math.round(((reel.aiMetadata.sentiment + 1) / 2) * 100);
  };

  const safetyScore = getSafetyScore();

  const getSafetyColor = (score: number) => {
    if (score >= 70) return "text-[var(--color-aurora-mint)]";
    if (score >= 40) return "text-[var(--color-aurora-yellow)]";
    return "text-[var(--color-aurora-salmon)]";
  };

  const getSafetyIcon = () => {
    const category = reel.aiMetadata?.safetyCategory;
    if (category === "Harassment" || category === "Warning") {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Shield className="w-5 h-5" />;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative w-full h-screen bg-black snap-start snap-always">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        onClick={handleDoubleTap}
      />

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-32 h-32 text-white fill-white animate-bounce-in drop-shadow-lg" />
        </div>
      )}

      {!isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-white border-b-[15px] border-b-transparent ml-2" />
          </div>
        </div>
      )}

      {safetyScore !== null && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 z-10">
          <div className={cn("flex items-center gap-1", getSafetyColor(safetyScore))}>
            {getSafetyIcon()}
            <span className="font-bold text-lg">{safetyScore}</span>
          </div>
        </div>
      )}

      <div className="absolute right-4 bottom-32 flex flex-col gap-5 z-10">
        {reel.author && (
          <div className="relative mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-0.5">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {reel.author.profileImage ? (
                  <img src={reel.author.profileImage} alt={reel.author.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{reel.author.name[0].toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[var(--color-aurora-pink)] flex items-center justify-center">
              <span className="text-white text-xs">+</span>
            </div>
          </div>
        )}

        <button onClick={handleLikeClick} className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200", localIsLiked ? "bg-[var(--color-aurora-pink)]" : "bg-white/20 backdrop-blur-sm")}>
            <Heart className={cn("w-6 h-6 transition-transform", localIsLiked && "fill-white scale-110")} />
          </div>
          <span className="text-xs font-medium">{formatCount(localLikes)}</span>
        </button>

        <button onClick={() => setShowCommentsSheet(true)} className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.comments)}</span>
        </button>

        <button onClick={() => setShowShareSheet(true)} className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.shares)}</span>
        </button>

        <button onClick={toggleMute} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* More Options (Delete for owner) */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-[var(--color-aurora-salmon)] focus:text-[var(--color-aurora-salmon)] cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Reel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
        {reel.author && (
          <div className="flex items-center gap-3 mb-3">
            <p className="text-white font-semibold">@{reel.author.name.toLowerCase().replace(/\s+/g, '_')}</p>
            {reel.author.trustScore >= 100 && (
              <div className="px-2 py-0.5 bg-[var(--color-aurora-mint)]/20 rounded-full">
                <span className="text-[var(--color-aurora-mint)] text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
        )}

        {reel.caption && <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>}

        {reel.aiMetadata?.safetyCategory && (
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
              reel.aiMetadata.safetyCategory === "Harassment" || reel.aiMetadata.safetyCategory === "Warning"
                ? "bg-[var(--color-aurora-salmon)]/80 text-white"
                : reel.aiMetadata.safetyCategory === "Joy" || reel.aiMetadata.safetyCategory === "Positive Experience"
                ? "bg-[var(--color-aurora-mint)]/80 text-[var(--color-aurora-violet)]"
                : "bg-[var(--color-aurora-yellow)]/80 text-[var(--color-aurora-violet)]"
            )}>
              {reel.aiMetadata.safetyCategory === "Harassment" && "⚠️ Harassment Risk"}
              {reel.aiMetadata.safetyCategory === "Joy" && "😊 Positive Vibe"}
              {reel.aiMetadata.safetyCategory === "Lighting Issue" && "💡 Lighting Issue"}
              {reel.aiMetadata.safetyCategory === "Infrastructure Problem" && "🚧 Infrastructure"}
              {reel.aiMetadata.safetyCategory === "Positive Experience" && "✨ Safe Space"}
              {reel.aiMetadata.safetyCategory === "Warning" && "⚠️ Warning"}
            </span>
          </div>
        )}

        {reel.hashtags && reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reel.hashtags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-white/80 text-xs font-medium">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <ShareSheet reelId={reel._id} caption={reel.caption} authorName={reel.author?.name} isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} />
      <CommentsSheet reelId={reel._id} currentUserId={currentUserId} isOpen={showCommentsSheet} onClose={() => setShowCommentsSheet(false)} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--foreground)]">Delete Reel?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--muted-foreground)]">
              This action cannot be undone. This will permanently delete your reel and all associated comments and likes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-[var(--border)]"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90 text-white"
              disabled={isDeleting}
              onClick={handleDeleteReel}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
