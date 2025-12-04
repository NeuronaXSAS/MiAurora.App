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

  const { isConnected, error, initialize, joinAsViewer, leave } = useLivestream();

  const handleClose = async () => {
    try {
      await leave();
      await leaveLivestream({ livestreamId, userId });
    } catch {}
    onClose();
  };

  // Join stream
  useEffect(() => {
    if (!livestream || hasJoinedRef.current || isJoining) return;

    const joinStream = async () => {
      setIsJoining(true);
      hasJoinedRef.current = true;
      
      try {
        await joinLivestream({ livestreamId, userId });
        await initialize({
          channelName: livestream.channelName,
          userId: userId,
          role: 'audience',
          onError: (err) => setConnectionError(err.message),
        });
        await joinAsViewer();
      } catch (err) {
        setConnectionError((err as Error).message || 'Failed to connect');
        hasJoinedRef.current = false;
      } finally {
        setIsJoining(false);
      }
    };

    joinStream();

    return () => {
      if (hasJoinedRef.current) {
        leave().catch(() => {});
        leaveLivestream({ livestreamId, userId }).catch(() => {});
      }
    };
  }, [livestream?.channelName]);

  const handleLike = async () => {
    try {
      const result = await likeLivestream({ livestreamId, userId });
      setHasLiked(result.liked);
      if (result.liked) {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    } catch {}
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    // TODO: Implement live chat
    setComment("");
  };

  // Loading
  if (!livestream) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Stream ended
  if (livestream.status === 'ended') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-xs">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-[var(--color-aurora-yellow)]" />
          <h2 className="text-lg font-bold mb-2">Stream Ended</h2>
          <Button onClick={onClose} className="bg-[var(--color-aurora-purple)] min-h-[48px] px-8">Go Back</Button>
        </div>
      </div>
    );
  }

  const displayError = connectionError || error;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video - Takes most space */}
      <div className="flex-1 relative min-h-0">
        <div ref={videoContainerRef} id="remote-video-host" className="absolute inset-0 bg-[#3d0d73]" style={{ minHeight: '200px' }} />

        {/* Connecting overlay */}
        {(!isConnected || isJoining) && !displayError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="text-center text-white">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Connecting...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {displayError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4 z-10">
            <div className="text-center text-white max-w-xs">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[var(--color-aurora-salmon)]" />
              <p className="text-sm text-[var(--color-aurora-salmon)] mb-4">{displayError}</p>
              <Button onClick={handleClose} className="bg-[var(--color-aurora-purple)] min-h-[44px]">Go Back</Button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {livestream.host && (
                <>
                  <Avatar className="w-8 h-8 border-2 border-white flex-shrink-0">
                    <AvatarImage src={livestream.host.profileImage} />
                    <AvatarFallback className="bg-[var(--color-aurora-purple)] text-white text-xs">
                      {livestream.host.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{livestream.host.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="bg-red-600 px-1.5 py-0.5 rounded text-white text-[10px] font-bold">LIVE</span>
                      <span className="text-white/80 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" />{livestream.viewerCount}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <Button onClick={handleClose} variant="ghost" size="icon" className="text-white hover:bg-white/20 w-10 h-10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Heart animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <Heart className="w-20 h-20 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent z-20">
          <p className="text-white font-medium text-sm truncate">{livestream.title}</p>
        </div>
      </div>

      {/* Bottom interaction - Compact, always visible */}
      <div className="bg-[var(--color-aurora-violet)] p-2 safe-area-inset-bottom">
        {/* Sample chat message */}
        <div className="mb-2 max-h-16 overflow-hidden">
          <div className="bg-white/10 rounded-lg px-2 py-1 text-white text-xs inline-block">
            <span className="font-semibold text-[var(--color-aurora-pink)]">User1:</span> Great stream! 💜
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white/10 rounded-full px-3 h-10">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Say something..."
              className="bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-full text-sm px-0"
            />
            <Button onClick={handleSendComment} size="icon" variant="ghost" className="text-white w-8 h-8" disabled={!comment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handleLike} size="icon" className={cn("rounded-full w-10 h-10", hasLiked ? "bg-red-500" : "bg-white/20")}>
            <Heart className={cn("w-5 h-5 text-white", hasLiked && "fill-white")} />
          </Button>

          <Button onClick={() => setShowGiftSelector(true)} size="icon" className="rounded-full w-10 h-10 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]">
            <Gift className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Gift Selector */}
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
