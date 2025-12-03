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
        {/* Video Container */}
        <div className="relative aspect-[9/16] max-h-[500px] bg-black rounded-t-2xl overflow-hidden">
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
              <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          )}
          
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm min-h-[44px] min-w-[44px] rounded-full"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            {isAuthor && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="bg-black/50 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/20 backdrop-blur-sm min-h-[44px] min-w-[44px] rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {/* Duration Badge */}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-black/50 text-white backdrop-blur-sm border-0">
              {formatDuration(reel.duration)}
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Author Info */}
          {reel.author && (
            <Link 
              href={`/profile/${reel.author._id}`}
              className="flex items-center gap-3 group"
            >
              <Avatar className="w-10 h-10 border-2 border-[var(--color-aurora-pink)]/30 group-hover:border-[var(--color-aurora-pink)] transition-colors">
                <AvatarImage src={reel.author.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white text-sm">
                  {reel.author.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors truncate">
                  {reel.author.name}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatDistanceToNow(reel._creationTime, { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[36px] px-4 border-[var(--color-aurora-pink)]/50 text-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/10"
                onClick={(e) => e.preventDefault()}
              >
                Follow
              </Button>
            </Link>
          )}

          {reel.caption && (
            <p className="text-[var(--foreground)] leading-relaxed">{reel.caption}</p>
          )}
          
          {reel.hashtags && reel.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reel.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-[var(--color-aurora-purple)] bg-[var(--color-aurora-lavender)]/30">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {reel.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <MapPin className="w-4 h-4 text-[var(--color-aurora-mint)]" />
              <span>{reel.location.name}</span>
            </div>
          )}
          
          {/* Stats & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {reel.views}
              </span>
              <span>{formatDistanceToNow(reel._creationTime, { addSuffix: true })}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUserId}
                className={`min-h-[44px] px-3 ${isLiked ? 'text-[var(--color-aurora-pink)]' : 'hover:text-[var(--color-aurora-pink)]'}`}
              >
                <Heart className={`w-5 h-5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {reel.likes}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowComments(true)}
                className="min-h-[44px] px-3 hover:text-[var(--color-aurora-purple)]"
              >
                <MessageCircle className="w-5 h-5 mr-1" />
                {reel.comments}
              </Button>
              
              <Button variant="ghost" size="sm" className="min-h-[44px] px-3 hover:text-[var(--color-aurora-blue)]">
                <Share2 className="w-5 h-5 mr-1" />
                {reel.shares}
              </Button>
            </div>
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
