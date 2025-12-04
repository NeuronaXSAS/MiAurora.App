"use client";

import { useState, useEffect } from "react";
import { useLivestream } from "@/hooks/useLivestream";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Gift, Users, X, Send } from "lucide-react";
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

  const livestream = useQuery(api.livestreams.getLivestream, { livestreamId });
  const joinLivestream = useMutation(api.livestreams.joinLivestream);
  const leaveLivestream = useMutation(api.livestreams.leaveLivestream);
  const likeLivestream = useMutation(api.livestreams.likeLivestream);

  const {
    isConnected,
    viewerCount,
    error,
    initialize,
    joinAsViewer,
    leave,
    remoteVideosRef,
  } = useLivestream();

  // Join livestream on mount
  useEffect(() => {
    if (livestream && !isConnected) {
      const join = async () => {
        try {
          // Join livestream in backend
          await joinLivestream({
            livestreamId,
            userId,
          });

          // Initialize streaming provider
          await initialize({
            channelName: livestream.channelName,
            userId: userId,
            role: 'audience',
          });

          // Join as viewer
          await joinAsViewer();
        } catch (error) {
          console.error('Failed to join livestream:', error);
        }
      };

      join();
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        leave();
        leaveLivestream({
          livestreamId,
          userId,
        });
      }
    };
  }, [livestream, livestreamId, userId, isConnected]);

  // Handle like
  const handleLike = async () => {
    try {
      await likeLivestream({
        livestreamId,
        userId,
      });
      setHasLiked(!hasLiked);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    } catch (error) {
      console.error('Failed to like livestream:', error);
    }
  };

  // Handle send comment
  const handleSendComment = () => {
    if (!comment.trim()) return;

    // TODO: Implement live chat
    console.log('Send comment:', comment);
    setComment("");
  };

  if (!livestream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Video Player */}
      <div className="w-full h-screen relative">
        {/* Remote video container - Agora will inject video here */}
        <div
          id={`remote-video-${livestream.hostId}`}
          className="w-full h-full"
          style={{
            backgroundColor: '#1a1a2e',
            minHeight: '100vh',
          }}
        />

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p>Connecting to stream...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white p-6">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={onClose} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        )}

        {/* Top Overlay - Host Info */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {livestream.host && (
                <>
                  <Avatar className="w-10 h-10 border-2 border-white">
                    <AvatarImage src={livestream.host.profileImage} />
                    <AvatarFallback>
                      {livestream.host.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {livestream.host.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="bg-red-600 px-2 py-0.5 rounded text-white text-xs font-bold">
                        LIVE
                      </div>
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Users className="w-3 h-3" />
                        <span>{livestream.viewerCount}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Heart Animation */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-32 h-32 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}

        {/* Bottom Overlay - Interactions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
          {/* Stream Title */}
          <div className="mb-4">
            <p className="text-white font-medium">{livestream.title}</p>
          </div>

          {/* Chat Messages (Placeholder) */}
          <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
            {/* TODO: Implement real-time chat */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
              <span className="font-semibold">User1:</span> Great stream!
            </div>
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                placeholder="Add a comment..."
                className="bg-transparent border-none text-white placeholder:text-white/60 focus-visible:ring-0"
              />
              <Button
                onClick={handleSendComment}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={handleLike}
              size="icon"
              className={cn(
                "rounded-full w-12 h-12",
                hasLiked
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-white/20 hover:bg-white/30"
              )}
            >
              <Heart
                className={cn(
                  "w-6 h-6",
                  hasLiked ? "fill-white" : ""
                )}
              />
            </Button>

            <Button
              onClick={() => setShowGiftSelector(true)}
              size="icon"
              className="rounded-full w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Gift className="w-6 h-6" />
            </Button>
          </div>
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
