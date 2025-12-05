"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLivestream } from "@/hooks/useLivestream";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Gift, Users, X, Send, AlertTriangle, Share2, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { GiftSelector } from "@/components/live/gift-selector";
import { motion, AnimatePresence } from "framer-motion";

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
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hasJoinedRef = useRef(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  const handleLike = useCallback(async () => {
    try {
      const result = await likeLivestream({ livestreamId, userId });
      setHasLiked(result.liked);
      if (result.liked) {
        setShowHeartAnimation(true);
        // Add floating heart
        const heartId = Date.now();
        setFloatingHearts(prev => [...prev, heartId]);
        setTimeout(() => {
          setFloatingHearts(prev => prev.filter(id => id !== heartId));
        }, 2000);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    } catch {}
  }, [livestreamId, userId, likeLivestream]);

  const handleSendComment = useCallback(() => {
    if (!comment.trim()) return;
    // TODO: Implement live chat
    setComment("");
  }, [comment]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: livestream?.title || "Live on Aurora App",
        url: `${window.location.origin}/live/${livestreamId}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/live/${livestreamId}`);
    }
  }, [livestreamId, livestream?.title]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

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
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Video - Takes most space */}
      <div className="flex-1 relative min-h-0">
        <div ref={videoContainerRef} id="remote-video-host" className="absolute inset-0 bg-[#3d0d73]" style={{ minHeight: '200px' }} />

        {/* Connecting overlay */}
        <AnimatePresence>
          {(!isConnected || isJoining) && !displayError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 z-10"
            >
              <div className="text-center text-white">
                <div className="w-12 h-12 border-4 border-[var(--color-aurora-purple)]/30 border-t-[var(--color-aurora-purple)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Joining stream...</p>
                <p className="text-xs text-white/60 mt-1">Please wait</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {displayError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/90 p-4 z-10"
            >
              <div className="text-center text-white max-w-xs">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-[var(--color-aurora-salmon)]" />
                <p className="font-medium mb-2">Connection Error</p>
                <p className="text-sm text-[var(--color-aurora-salmon)] mb-4">{displayError}</p>
                <Button onClick={handleClose} className="bg-[var(--color-aurora-purple)] min-h-[48px] px-8">Go Back</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar - Auto-hide */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {livestream.host && (
                    <>
                      <Avatar className="w-10 h-10 border-2 border-white/50 flex-shrink-0 shadow-lg">
                        <AvatarImage src={livestream.host.profileImage} />
                        <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white text-sm">
                          {livestream.host.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold text-sm truncate drop-shadow">{livestream.host.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-600 text-white border-0 text-[10px] px-1.5 py-0 animate-pulse">
                            LIVE
                          </Badge>
                          <span className="text-white/80 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />{livestream.viewerCount} watching
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={toggleFullscreen} 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20 w-10 h-10"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                  <Button onClick={handleClose} variant="ghost" size="icon" className="text-white hover:bg-white/20 w-10 h-10">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating hearts animation */}
        <div className="absolute right-4 bottom-32 pointer-events-none z-30">
          <AnimatePresence>
            {floatingHearts.map((id) => (
              <motion.div
                key={id}
                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                animate={{ opacity: 0, y: -150, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute bottom-0 right-0"
              >
                <Heart className="w-8 h-8 text-[var(--color-aurora-pink)] fill-[var(--color-aurora-pink)]" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Center heart animation on like */}
        <AnimatePresence>
          {showHeartAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <Heart className="w-24 h-24 text-[var(--color-aurora-pink)] fill-[var(--color-aurora-pink)] drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title - Bottom overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"
            >
              <p className="text-white font-medium text-sm truncate drop-shadow">{livestream.title}</p>
              {livestream.description && (
                <p className="text-white/70 text-xs truncate mt-1">{livestream.description}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom interaction - Compact, always visible */}
      <div className="bg-[var(--color-aurora-violet)] p-2 safe-area-inset-bottom">
        {/* Sample chat message */}
        <div className="mb-2 max-h-20 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <div className="bg-white/10 rounded-lg px-2 py-1 text-white text-xs inline-block">
              <span className="font-semibold text-[var(--color-aurora-pink)]">User1:</span> Great stream! 💜
            </div>
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white/10 rounded-full px-3 h-11">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="Say something..."
              className="bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-full text-sm px-0"
            />
            <Button onClick={handleSendComment} size="icon" variant="ghost" className="text-white min-w-[36px] min-h-[36px]" disabled={!comment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Mute toggle */}
          <motion.button
            onClick={() => setIsMuted(!isMuted)}
            whileTap={{ scale: 0.9 }}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/20 flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </motion.button>

          {/* Like */}
          <motion.button 
            onClick={handleLike} 
            whileTap={{ scale: 1.2 }}
            className={cn("min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center", hasLiked ? "bg-[var(--color-aurora-pink)]" : "bg-white/20")}
          >
            <Heart className={cn("w-5 h-5 text-white", hasLiked && "fill-white")} />
          </motion.button>

          {/* Share */}
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.9 }}
            className="min-w-[44px] min-h-[44px] rounded-full bg-white/20 flex items-center justify-center"
          >
            <Share2 className="w-5 h-5 text-white" />
          </motion.button>

          {/* Gift */}
          <motion.button 
            onClick={() => setShowGiftSelector(true)} 
            whileTap={{ scale: 0.9 }}
            className="min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center"
          >
            <Gift className="w-5 h-5 text-white" />
          </motion.button>
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
