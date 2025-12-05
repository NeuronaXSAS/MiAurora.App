"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  MapPin,
  Volume2,
  VolumeX,
  Trash2,
  Eye,
  Bookmark,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReelCommentsSheet } from "@/components/reels/reel-comments-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ReelFeedCardProps {
  reel: {
    _id: Id<"reels">;
    _creationTime: number;
    authorId: Id<"users">;
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    hashtags?: string[];
    location?: {
      name: string;
      coordinates: number[];
    };
    duration: number;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    // Author info
    author?: {
      _id: Id<"users">;
      name: string;
      profileImage?: string;
    } | null;
  };
  currentUserId?: Id<"users">;
  onDelete?: () => void;
  isMobile?: boolean;
}

function ReelFeedCardComponent({ reel, currentUserId, onDelete, isMobile = false }: ReelFeedCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const likeReelMutation = useMutation(api.reels.likeReel);
  const incrementViews = useMutation(api.reels.incrementViews);
  
  const isAuthor = currentUserId === reel.authorId;

  // Increment views only once
  useEffect(() => {
    if (reel._id) {
      incrementViews({ reelId: reel._id }).catch(console.error);
    }
  }, [reel._id]);

  // Auto-play/pause based on visibility (Intersection Observer)
  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            // Video is mostly visible - auto play
            videoRef.current?.play().catch(() => {});
          } else {
            // Video is not visible - pause
            videoRef.current?.pause();
          }
        });
      },
      { threshold: [0, 0.5, 0.7, 1] }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);
  
  // Double-tap to like (Instagram-style)
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap detected
      if (!isLiked && currentUserId) {
        handleLike();
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 1000);
      }
    }
    setLastTap(now);
  }, [lastTap, isLiked, currentUserId]);
  
  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    try {
      await likeReelMutation({ reelId: reel._id, userId: currentUserId });
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  }, [currentUserId, reel._id, isLiked, likeReelMutation]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: reel.caption || "Check out this reel on Aurora App",
        url: `${window.location.origin}/reels/${reel._id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/reels/${reel._id}`);
    }
  }, [reel._id, reel.caption]);

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
    // TODO: Implement save to collection
  }, [isSaved]);
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card 
      ref={containerRef}
      className={`hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)] ${isMobile ? 'rounded-none border-x-0' : 'rounded-2xl'} overflow-hidden`}
    >
      <CardContent className="p-0">
        {/* Video Container - Optimized for engagement */}
        <div 
          className="relative aspect-[9/14] max-h-[450px] bg-black rounded-t-2xl overflow-hidden"
          onClick={handleDoubleTap}
        >
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.thumbnailUrl}
            className="w-full h-full object-cover cursor-pointer"
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Double-tap heart animation */}
          <AnimatePresence>
            {showDoubleTapHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Play/Pause Overlay */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                  <Play className="w-12 h-12 text-white fill-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Author overlay on video */}
          {reel.author && (
            <div className="absolute top-3 left-3 right-16">
              <Link 
                href={`/profile/${reel.author._id}`}
                className="flex items-center gap-2 group"
              >
                <Avatar className="w-9 h-9 border-2 border-white/50 shadow-lg">
                  <AvatarImage src={reel.author.profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white text-xs">
                    {reel.author.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-white text-sm drop-shadow-lg truncate">
                  {reel.author.name}
                </span>
              </Link>
            </div>
          )}
          
          {/* Top Right Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm min-h-[40px] min-w-[40px] rounded-full p-0"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            {isAuthor && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="bg-black/50 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/20 backdrop-blur-sm min-h-[40px] min-w-[40px] rounded-full p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Bottom overlay with caption and actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-12">
            {/* Caption */}
            {reel.caption && (
              <p className="text-white text-sm leading-relaxed mb-2 line-clamp-2">{reel.caption}</p>
            )}
            
            {/* Location & Duration */}
            <div className="flex items-center gap-3 text-xs text-white/80">
              {reel.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {reel.location.name}
                </span>
              )}
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0 text-xs px-2 py-0">
                {formatDuration(reel.duration)}
              </Badge>
            </div>
          </div>

          {/* Right side action buttons - TikTok/Instagram style */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
            {/* Like */}
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              disabled={!currentUserId}
              whileTap={{ scale: 1.2 }}
              className="flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-colors ${isLiked ? 'text-[var(--color-aurora-pink)]' : 'text-white'}`}>
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow font-medium">{reel.likes}</span>
            </motion.button>
            
            {/* Comments */}
            <motion.button
              onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
              whileTap={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow font-medium">{reel.comments}</span>
            </motion.button>
            
            {/* Save */}
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              whileTap={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${isSaved ? 'text-[var(--color-aurora-yellow)]' : 'text-white'}`}>
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow font-medium">Save</span>
            </motion.button>
            
            {/* Share */}
            <motion.button 
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              whileTap={{ scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow font-medium">{reel.shares}</span>
            </motion.button>
          </div>
        </div>
        
        {/* Compact footer with hashtags and stats */}
        <div className="p-3 space-y-2">
          {/* Hashtags */}
          {reel.hashtags && reel.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reel.hashtags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs text-[var(--color-aurora-purple)] bg-[var(--color-aurora-lavender)]/30 px-2 py-0">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {reel.views} views
              </span>
              <span>{formatDistanceToNow(reel._creationTime, { addSuffix: true })}</span>
            </div>
            {reel.author && (
              <Link 
                href={`/profile/${reel.author._id}`}
                className="text-[var(--color-aurora-purple)] hover:underline"
              >
                View profile
              </Link>
            )}
          </div>
        </div>
      </CardContent>

      {/* Comments Sheet */}
      <ReelCommentsSheet
        open={showComments}
        onOpenChange={setShowComments}
        reelId={reel._id}
        currentUserId={currentUserId}
      />
    </Card>
  );
}

// Memoize for better performance in feed lists
export const ReelFeedCard = memo(ReelFeedCardComponent);
