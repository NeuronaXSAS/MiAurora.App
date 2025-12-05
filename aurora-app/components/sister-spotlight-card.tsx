"use client";

/**
 * Sister Spotlight Card - Fun people discovery in the feed
 * 
 * Appears every few posts in the feed to help users discover
 * and connect with other women. Swipe-style interaction keeps
 * users engaged and scrolling.
 */

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  X, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  MessageCircle,
  Users,
  ChevronRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface SisterSpotlightCardProps {
  currentUserId: Id<"users">;
  onConnect?: (userId: Id<"users">) => void;
  onSkip?: (userId: Id<"users">) => void;
}

export function SisterSpotlightCard({ currentUserId, onConnect, onSkip }: SisterSpotlightCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  
  // Fetch suggested users
  const suggestedUsers = useQuery(api.users.getSuggestedUsers, { 
    userId: currentUserId,
    limit: 5,
  });

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Visual indicators for swipe direction
  const connectOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null; // Don't show if no suggestions
  }

  const currentUser = suggestedUsers[currentIndex];
  if (!currentUser) return null;

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;
    
    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swiped right - Connect
      setDirection("right");
      handleConnect();
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swiped left - Skip
      setDirection("left");
      handleSkip();
    }
  };

  const handleConnect = () => {
    onConnect?.(currentUser._id);
    setShowMatch(true);
    setTimeout(() => {
      setShowMatch(false);
      goToNext();
    }, 1500);
  };

  const handleSkip = () => {
    onSkip?.(currentUser._id);
    goToNext();
  };

  const goToNext = () => {
    setDirection(null);
    if (currentIndex < suggestedUsers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
    x.set(0);
  };

  return (
    <div className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 via-[var(--color-aurora-pink)]/10 to-[var(--color-aurora-lavender)]/20 rounded-2xl p-4 border border-[var(--color-aurora-purple)]/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--foreground)]">Sister Spotlight</h3>
            <p className="text-[10px] text-[var(--muted-foreground)]">Discover amazing women</p>
          </div>
        </div>
        <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 text-[10px]">
          {currentIndex + 1}/{suggestedUsers.length}
        </Badge>
      </div>

      {/* Swipeable Card */}
      <div className="relative h-[280px]">
        <AnimatePresence>
          {showMatch && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-aurora-mint)]/90 rounded-2xl"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <Heart className="w-16 h-16 text-[var(--color-aurora-pink)] fill-[var(--color-aurora-pink)] mx-auto mb-2" />
                </motion.div>
                <p className="font-bold text-[var(--color-aurora-violet)]">Connected!</p>
                <p className="text-sm text-[var(--color-aurora-purple)]">Say hi to {currentUser.name?.split(" ")[0]} 💜</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{ x, rotate, opacity }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] h-full p-4 shadow-lg relative overflow-hidden">
            {/* Swipe Indicators */}
            <motion.div 
              style={{ opacity: connectOpacity }}
              className="absolute top-4 right-4 z-10 bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] px-3 py-1 rounded-full font-bold text-sm rotate-12"
            >
              CONNECT 💜
            </motion.div>
            <motion.div 
              style={{ opacity: skipOpacity }}
              className="absolute top-4 left-4 z-10 bg-[var(--muted)] text-[var(--muted-foreground)] px-3 py-1 rounded-full font-bold text-sm -rotate-12"
            >
              SKIP
            </motion.div>

            {/* Profile Content */}
            <div className="flex flex-col items-center text-center h-full">
              {/* Avatar */}
              <div className="relative mb-3">
                <Avatar className="w-20 h-20 border-4 border-[var(--color-aurora-lavender)]">
                  <AvatarImage src={currentUser.profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white text-2xl">
                    {currentUser.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                {currentUser.isPremium && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--color-aurora-yellow)] rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-[var(--color-aurora-violet)] fill-current" />
                  </div>
                )}
              </div>

              {/* Name & Trust Score */}
              <h4 className="font-bold text-lg text-[var(--foreground)]">{currentUser.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-[10px]">
                  Trust: {currentUser.trustScore || 0}
                </Badge>
                {currentUser.credits && currentUser.credits > 100 && (
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-[10px]">
                    Active
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="mt-3 space-y-1.5 text-sm text-[var(--muted-foreground)]">
                {currentUser.location && (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{currentUser.location}</span>
                  </div>
                )}
                {currentUser.industry && (
                  <div className="flex items-center justify-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    <span>{currentUser.industry}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {currentUser.bio && (
                <p className="mt-3 text-sm text-[var(--foreground)] line-clamp-2 px-2">
                  "{currentUser.bio}"
                </p>
              )}

              {/* Interests */}
              {currentUser.interests && currentUser.interests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {currentUser.interests.slice(0, 3).map((interest, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[10px] bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-purple)]"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Swipe hint */}
              <p className="mt-auto text-[10px] text-[var(--muted-foreground)]">
                ← Swipe to skip • Swipe to connect →
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button
          onClick={handleSkip}
          variant="outline"
          className="w-14 h-14 rounded-full border-2 border-[var(--muted)] hover:border-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10 transition-all"
        >
          <X className="w-6 h-6 text-[var(--muted-foreground)]" />
        </Button>
        
        <Link href={`/user/${currentUser._id}`}>
          <Button
            variant="outline"
            className="w-12 h-12 rounded-full border-2 border-[var(--color-aurora-purple)]/30 hover:border-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10"
          >
            <Users className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          </Button>
        </Link>
        
        <Button
          onClick={handleConnect}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 transition-all shadow-lg"
        >
          <Heart className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* View All Link */}
      <Link 
        href="/circles" 
        className="flex items-center justify-center gap-1 mt-3 text-xs text-[var(--color-aurora-purple)] hover:underline"
      >
        <span>Find more sisters in Circles</span>
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/**
 * Compact version for mobile feed
 */
export function SisterSpotlightCompact({ currentUserId }: { currentUserId: Id<"users"> }) {
  const suggestedUsers = useQuery(api.users.getSuggestedUsers, { 
    userId: currentUserId,
    limit: 5,
  });

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl p-3 border border-[var(--color-aurora-purple)]/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
        <span className="text-sm font-semibold text-[var(--foreground)]">Sisters to meet</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {suggestedUsers.map((user) => (
          <Link 
            key={user._id} 
            href={`/user/${user._id}`}
            className="flex-shrink-0 flex flex-col items-center gap-1 group"
          >
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-[var(--color-aurora-lavender)] group-hover:border-[var(--color-aurora-purple)] transition-colors">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
                  {user.name?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--color-aurora-mint)] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <MessageCircle className="w-3 h-3 text-[var(--color-aurora-violet)]" />
              </div>
            </div>
            <span className="text-[10px] text-[var(--foreground)] font-medium truncate max-w-[60px]">
              {user.name?.split(" ")[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
