"use client";

import { useState, useEffect, useRef } from "react";
import { useLivestream } from "@/hooks/useLivestream";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Gift, Users, X, Send, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { GiftSelector } from "@/components/live/gift-selector";

interface LivePlayerProps {
  livestreamId: Id<"livestreams">;
  userId: Id<"users">;
  onClose: () => void;
}

export function LivePlayer({ livestreamId, userId, onClose }: LivePlayerProps) {
  const [comment, setComment] = useState("");
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const hasJoinedRef = useRef(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const livestream = useQuery(api.livestreams.getLivestream, { livestreamId });
  const joinLivestream = useMutation(api.livestreams.joinLivestream);
  const leaveLivestream = useMutation(api.livestreams.leaveLivestream);
  const likeLivestream = useMutation(api.livestreams.likeLivestream);

  const {
    isConnected,
    error,
    initialize,
    joinAsViewer,
    leave,
  } = useLivestream();

  // Handle close with cleanup
  const handleClose = async () => {
    try {
      await leave();
      await leaveLivestream({ livestreamId, userId });
    } catch (e) {
      console.error('Error leaving livestream:', e);
    }
    onClose();
  };

  // Join livestream on mount - only once
  useEffect(() => {
    if (!livestream || hasJoinedRef.current || isJoining) return;

    const joinStream = async () => {
      setIsJoining(true);
      hasJoinedRef.current = true;
      
      try {
        // Join livestream in backend
        await joinLivestream({ livestreamId, userId });

        // Initialize streaming provider
        await initialize({
          channelName: livestream.channelName,
          userId: userId,
          role: 'audience',
          onError: (err) => {
            console.error('Agora error:', err);
            setConnectionError(err.message);
          },
        });

        // Join as viewer
        await joinAsViewer();
      } catch (err) {
        console.error('Failed to join livestream:', err);
        setConnectionError((err as Error).message || 'Failed to connect');
        hasJoinedRef.current = false;
      } finally {
        setIsJoining(false);
      }
    };

    joinStream();

    // Cleanup on unmount
    return () => {
      if (hasJoinedRef.current) {
        leave().catch(console.error);
        leaveLivestream({ livestreamId, userId }).catch(console.error);
      }
    };
  }, [livestream?.channelName]);

  // Handle like
  const handleLike = async () => {
    try {
      const result = await likeLivestream({ livestreamId, userId });
      setHasLiked(result.liked);
      if (result.liked) {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    } catch (err) {
      console.error('Failed to like livestream:', err);
    }
  };

  // Handle send comment
  const handleSendComment = () => {
    if (!comment.trim()) return;
    // TODO: Implement live chat
    console.log('Send comment:', comment);
    setComment("");
  };

  // Loading state
  if (!livestream) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center safe-area-inset-top safe-area-inset-bottom">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Loading stream...</p>
        </div>
      </div>
    );
  }

  // Check if stream has ended
  if (livestream.status === 'ended') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center safe-area-inset-top safe-area-inset-bottom">
        <div className="text-center text-white p-6 max-w-sm">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-[var(--color-aurora-yellow)]" />
          <h2 className="text-xl font-bold mb-2">Stream Ended</h2>
          <p className="text-white/70 mb-6">This livestream has ended.</p>
          <Button 
            onClick={onClose}
            className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[48px] px-8"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const displayError = connectionError || error;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Area - Takes most of the screen */}
      <div className="flex-1 relative min-h-0">
        {/* Remote video container */}
        <div
          ref={videoContainerRef}
          id={`remote-video-${livestream.hostId}`}
          className="absolute inset-0 bg-[var(--color-aurora-violet)]"
        />

        {/* Connecting overlay */}
        {(!isConnected || isJoining) && !displayError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm">Connecting to stream...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {displayError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="text-center text-white max-w-sm">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--color-aurora-salmon)]" />
              <p className="text-[var(--color-aurora-salmon)] mb-4 text-sm">{displayError}</p>
              <Button 
                onClick={handleClose} 
                className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[48px]"
              >
                Go Back
              </Button>
            </div>
          </div>
        )}

        {/* Top bar - Host info & close button */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {livestream.host && (
                <>
                  <Avatar className="w-9 h-9 border-2 border-white flex-shrink-0">
                    <AvatarImage src={livestream.host.profileImage} />
                    <AvatarFallback className="bg-[var(--color-aurora-purple)] text-white text-xs">
                      {livestream.host.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">
                      {livestream.host.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 px-2 py-0.5 rounded text-white text-xs font-bold">
                        LIVE
                      </span>
                      <span className="flex items-center gap-1 text-white/80 text-xs">
                        <Users className="w-3 h-3" />
                        {livestream.viewerCount}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 min-w-[44px] min-h-[44px] flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Heart Animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}

        {/* Stream title - bottom of video */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-medium text-sm truncate">{livestream.title}</p>
        </div>
      </div>

      {/* Bottom interaction area - Fixed height, always accessible */}
      <div className="bg-[var(--color-aurora-violet)] p-3 safe-area-inset-bottom">
        {/* Chat messages preview */}
        <div className="mb-3 space-y-1 max-h-20 overflow-y-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-xs">
            <span className="font-semibold text-[var(--color-aurora-pink)]">User1:</span> Great stream! 💜
          </div>
        </div>

        {/* Input and action buttons */}
        <div className="flex items-center gap-2">
          {/* Comment input */}
          <div className="flex-1 flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Say something..."
              className="bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-10 text-sm px-0"
            />
            <Button
              onClick={handleSendComment}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full min-w-[36px] min-h-[36px]"
              disabled={!comment.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Like button */}
          <Button
            onClick={handleLike}
            size="icon"
            className={cn(
              "rounded-full min-w-[44px] min-h-[44px]",
              hasLiked
                ? "bg-red-500 hover:bg-red-600"
                : "bg-white/20 hover:bg-white/30"
            )}
          >
            <Heart className={cn("w-5 h-5 text-white", hasLiked && "fill-white")} />
          </Button>

          {/* Gift button */}
          <Button
            onClick={() => setShowGiftSelector(true)}
            size="icon"
            className="rounded-full min-w-[44px] min-h-[44px] bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]"
          >
            <Gift className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Gift Selector Modal */}
      {showGiftSelector && livestream.host && (
        <GiftSelector
          open={showGiftSelector}
          onClose={() => setShowGiftSelector(false)}
          senderId={userId}
          recipientId={livestream.hostId}
          livestreamId={livestreamId}
        />
      )}
    </div>
  );
}
