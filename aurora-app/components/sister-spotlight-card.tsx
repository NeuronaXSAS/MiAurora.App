"use client";

/**
 * Sister Spotlight Card - Fun people discovery in the feed
 * 
 * Tinder-style matching where both users must like each other to connect.
 * Shows DiceBear avatars and creates real matches with notifications.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
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
  Check,
} from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

// Generate DiceBear Lorelei avatar URL
function getAvatarUrl(user: { 
  avatarConfig?: { 
    seed: string; 
    backgroundColor: string;
    hairStyle: string;
    hairColor: string;
    skinColor: string;
  } | null;
  name?: string;
  _id: string;
}): string {
  if (user.avatarConfig) {
    const { seed, backgroundColor, hairStyle, hairColor, skinColor } = user.avatarConfig;
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor.replace('#', '')}&hair=${hairStyle}&hairColor=${hairColor.replace('#', '')}&skinColor=${skinColor.replace('#', '')}`;
  }
  // Fallback to name-based avatar
  const seed = user.name || user._id;
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c9cef4`;
}

interface SisterSpotlightCardProps {
  currentUserId: Id<"users">;
}

export function SisterSpotlightCard({ currentUserId }: SisterSpotlightCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  
  // Fetch suggested users
  const suggestedUsers = useQuery(api.users.getSuggestedUsers, { 
    userId: currentUserId,
    limit: 5,
  });

  // Mutations
  const likeUser = useMutation(api.connections.likeUser);
  const skipUser = useMutation(api.connections.skipUser);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Visual indicators for swipe direction
  const connectOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null;
  }

  const currentUser = suggestedUsers[currentIndex];
  if (!currentUser) return null;

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;
    
    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handleConnect();
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleSkip();
    }
  };

  const handleConnect = async () => {
    try {
      const result = await likeUser({
        userId: currentUserId,
        likedUserId: currentUser._id,
      });

      if (result.isMatch) {
        // It's a match! Show celebration
        setMatchedUser(result.matchedUser);
        setShowMatch(true);
        setTimeout(() => {
          setShowMatch(false);
          setMatchedUser(null);
          goToNext();
        }, 2500);
      } else {
        // Just a like, move to next
        goToNext();
      }
    } catch (error) {
      console.error("Error liking user:", error);
      goToNext();
    }
  };

  const handleSkip = async () => {
    try {
      await skipUser({
        userId: currentUserId,
        skippedUserId: currentUser._id,
      });
    } catch (error) {
      console.error("Error skipping user:", error);
    }
    goToNext();
  };

  const goToNext = () => {
    if (currentIndex < suggestedUsers.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    x.set(0);
  };

  const avatarUrl = getAvatarUrl(currentUser);

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
      <div className="relative h-[320px]">
        {/* Match Celebration Overlay */}
        <AnimatePresence>
          {showMatch && matchedUser && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)] rounded-2xl"
            >
              <div className="text-center px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.6 }}
                  className="relative mb-4"
                >
                  {/* Both avatars */}
                  <div className="flex items-center justify-center -space-x-4">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[var(--color-aurora-lavender)]">
                      <img 
                        src={getAvatarUrl(matchedUser)} 
                        alt={matchedUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="w-10 h-10 bg-[var(--color-aurora-pink)] rounded-full flex items-center justify-center z-10 border-4 border-white shadow-lg"
                    >
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </motion.div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-2xl font-bold text-[var(--color-aurora-violet)] mb-1">
                    It's a Match! 💜
                  </h3>
                  <p className="text-[var(--color-aurora-purple)] mb-4">
                    You and {matchedUser.name?.split(" ")[0]} liked each other
                  </p>
                  <Link href={`/messages/${matchedUser._id}`}>
                    <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-xl">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send a Message
                    </Button>
                  </Link>
                </motion.div>
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
              LIKE 💜
            </motion.div>
            <motion.div 
              style={{ opacity: skipOpacity }}
              className="absolute top-4 left-4 z-10 bg-[var(--muted)] text-[var(--muted-foreground)] px-3 py-1 rounded-full font-bold text-sm -rotate-12"
            >
              SKIP
            </motion.div>

            {/* Profile Content */}
            <div className="flex flex-col items-center text-center h-full">
              {/* DiceBear Avatar */}
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full border-4 border-[var(--color-aurora-lavender)] overflow-hidden bg-[var(--color-aurora-lavender)] shadow-lg">
                  <img 
                    src={avatarUrl}
                    alt={currentUser.name || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {currentUser.isPremium && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--color-aurora-yellow)] rounded-full flex items-center justify-center border-2 border-white">
                    <Star className="w-4 h-4 text-[var(--color-aurora-violet)] fill-current" />
                  </div>
                )}
              </div>

              {/* Name & Trust Score */}
              <h4 className="font-bold text-xl text-[var(--foreground)]">{currentUser.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-xs">
                  Trust: {currentUser.trustScore || 0}
                </Badge>
                {currentUser.credits && currentUser.credits > 100 && (
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-xs">
                    Active
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="mt-3 space-y-1.5 text-sm text-[var(--muted-foreground)]">
                {currentUser.location && (
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{currentUser.location}</span>
                  </div>
                )}
                {currentUser.industry && (
                  <div className="flex items-center justify-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{currentUser.industry}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {currentUser.bio && (
                <p className="mt-3 text-sm text-[var(--foreground)] line-clamp-2 px-2 italic">
                  "{currentUser.bio}"
                </p>
              )}

              {/* Interests */}
              {currentUser.interests && currentUser.interests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {currentUser.interests.slice(0, 3).map((interest, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-purple)]"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Swipe hint */}
              <p className="mt-auto text-xs text-[var(--muted-foreground)]">
                ← Swipe to skip • Swipe to like →
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

      {/* Info text */}
      <p className="text-center text-[10px] text-[var(--muted-foreground)] mt-3">
        💜 Both must like to match • Matches can chat
      </p>

      {/* View All Link */}
      <Link 
        href="/circles" 
        className="flex items-center justify-center gap-1 mt-2 text-xs text-[var(--color-aurora-purple)] hover:underline"
      >
        <span>Find more sisters in Circles</span>
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

/**
 * Compact version for mobile feed - horizontal scroll
 */
export function SisterSpotlightCompact({ currentUserId }: { currentUserId: Id<"users"> }) {
  const suggestedUsers = useQuery(api.users.getSuggestedUsers, { 
    userId: currentUserId,
    limit: 5,
  });

  const likeUser = useMutation(api.connections.likeUser);

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  const handleQuickLike = async (userId: Id<"users">) => {
    try {
      await likeUser({
        userId: currentUserId,
        likedUserId: userId,
      });
    } catch (error) {
      console.error("Error liking user:", error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl p-3 border border-[var(--color-aurora-purple)]/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
        <span className="text-sm font-semibold text-[var(--foreground)]">Sisters to meet</span>
        <span className="text-[10px] text-[var(--muted-foreground)]">• Like to match</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {suggestedUsers.map((user) => {
          const avatarUrl = getAvatarUrl(user);
          
          return (
            <div 
              key={user._id} 
              className="flex-shrink-0 flex flex-col items-center gap-1 group"
            >
              <div className="relative">
                <Link href={`/user/${user._id}`}>
                  <div className="w-16 h-16 rounded-full border-2 border-[var(--color-aurora-lavender)] group-hover:border-[var(--color-aurora-purple)] transition-colors overflow-hidden bg-[var(--color-aurora-lavender)]">
                    <img 
                      src={avatarUrl}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <button
                  onClick={() => handleQuickLike(user._id)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--color-aurora-pink)] rounded-full flex items-center justify-center hover:bg-[var(--color-aurora-purple)] transition-colors shadow-md"
                >
                  <Heart className="w-3 h-3 text-white" />
                </button>
              </div>
              <span className="text-[10px] text-[var(--foreground)] font-medium truncate max-w-[64px]">
                {user.name?.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
