"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin,
  Volume2,
  VolumeX,
  Trash2,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReelCommentsSheet } from "@/components/reels/reel-comments-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

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

export function ReelFeedCard({ reel, currentUserId, onDelete, isMobile = false }: ReelFeedCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const likeReelMutation = useMutation(api.reels.likeReel);
  const incrementViews = useMutation(api.reels.incrementViews);
  
  const isAuthor = currentUserId === reel.authorId;

  useEffect(() => {
    if (reel._id) {
      incrementViews({ reelId: reel._id }).catch(console.error);
    }
  }, [reel._id, incrementViews]);
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleLike = async () => {
    if (!currentUserId) return;
    try {
      await likeReelMutation({ reelId: reel._id, userId: currentUserId });
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className={`hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)] ${isMobile ? 'rounded-none border-x-0' : 'rounded-2xl'}`}>
      <CardContent className="p-0">
        {/* Video Container - More compact */}
        <div className="relative aspect-[9/14] max-h-[400px] bg-black rounded-t-2xl overflow-hidden">
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.thumbnailUrl}
            className="w-full h-full object-cover cursor-pointer"
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                <Play className="w-10 h-10 text-white fill-white" />
              </div>
            </div>
          )}

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

          {/* Right side action buttons */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-3">
            <button
              onClick={handleLike}
              disabled={!currentUserId}
              className="flex flex-col items-center"
            >
              <div className={`w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center ${isLiked ? 'text-[var(--color-aurora-pink)]' : 'text-white'}`}>
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow">{reel.likes}</span>
            </button>
            
            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow">{reel.comments}</span>
            </button>
            
            <button className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-white text-xs mt-1 drop-shadow">{reel.shares}</span>
            </button>
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
