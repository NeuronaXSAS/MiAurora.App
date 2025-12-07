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
import { cn } from "@/lib/utils";

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
    <div className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 via-[var(--color-aurora-pink)]/10 to-[var(--color-aurora-lavender)]/20 rounded-2xl p-3 sm:p-4 border border-[var(--color-aurora-purple)]/20 overflow-hidden">
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
      <div className="relative h-[380px] sm:h-[420px]">
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
            <div className="flex flex-col items-center text-center h-full py-2">
              {/* DiceBear Avatar */}
              <div className="relative mb-2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[var(--color-aurora-lavender)] overflow-hidden bg-[var(--color-aurora-lavender)] shadow-lg">
                  <img 
                    src={avatarUrl}
                    alt={currentUser.name || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {currentUser.isPremium && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-[var(--color-aurora-yellow)] rounded-full flex items-center justify-center border-2 border-white">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--color-aurora-violet)] fill-current" />
                  </div>
                )}
              </div>

              {/* Name & Trust Score */}
              <h4 className="font-bold text-lg sm:text-xl text-[var(--foreground)]">{currentUser.name}</h4>
              <div className="flex items-center flex-wrap justify-center gap-1.5 mt-1">
                <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-[10px] sm:text-xs">
                  Trust: {currentUser.trustScore || 0}
                </Badge>
                {currentUser.credits && currentUser.credits > 100 && (
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-[10px] sm:text-xs">
                    Active
                  </Badge>
                )}
                {currentUser.isPremium && (
                  <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0 text-[10px] sm:text-xs">
                    ⭐ Premium
                  </Badge>
                )}
              </div>

              {/* Location & Industry - Always visible */}
              <div className="mt-2 space-y-1 text-xs sm:text-sm text-[var(--muted-foreground)] w-full px-2">
                {currentUser.location && (
                  <div className="flex items-center justify-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-aurora-blue)] flex-shrink-0" />
                    <span className="truncate">{currentUser.location}</span>
                  </div>
                )}
                {currentUser.industry && (
                  <div className="flex items-center justify-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--color-aurora-purple)] flex-shrink-0" />
                    <span className="truncate">{currentUser.industry}</span>
                  </div>
                )}
              </div>

              {/* Bio - Show more lines */}
              {currentUser.bio && (
                <p className="mt-2 text-xs sm:text-sm text-[var(--foreground)] line-clamp-3 px-3 italic leading-relaxed">
                  "{currentUser.bio}"
                </p>
              )}

              {/* Interests - Show more */}
              {currentUser.interests && currentUser.interests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mt-2 px-2">
                  {currentUser.interests.slice(0, 4).map((interest, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-[10px] sm:text-xs bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-purple)] px-2 py-0.5"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {currentUser.interests.length > 4 && (
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] sm:text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] px-2 py-0.5"
                    >
                      +{currentUser.interests.length - 4} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Swipe hint */}
              <p className="mt-auto pt-2 text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                ← Swipe to skip • Swipe to like →
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4">
        <Button
          onClick={handleSkip}
          variant="outline"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[var(--muted)] hover:border-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10 transition-all min-w-[48px] min-h-[48px]"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--muted-foreground)]" />
        </Button>
        
        <Link href={`/user/${currentUser._id}`}>
          <Button
            variant="outline"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[var(--color-aurora-purple)]/30 hover:border-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10 min-w-[44px] min-h-[44px]"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-aurora-purple)]" />
          </Button>
        </Link>
        
        <Button
          onClick={handleConnect}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 transition-all shadow-lg min-w-[48px] min-h-[48px]"
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </Button>
      </div>

      {/* Info text */}
      <p className="text-center text-[10px] text-[var(--muted-foreground)] mt-2 sm:mt-3">
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
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());
  const [showMatchToast, setShowMatchToast] = useState<string | null>(null);
  
  const suggestedUsers = useQuery(api.users.getSuggestedUsers, { 
    userId: currentUserId,
    limit: 5,
  });

  const likeUser = useMutation(api.connections.likeUser);

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  const handleQuickLike = async (userId: Id<"users">, userName: string) => {
    if (likedUsers.has(userId)) return;
    
    try {
      const result = await likeUser({
        userId: currentUserId,
        likedUserId: userId,
      });
      
      setLikedUsers(prev => new Set([...prev, userId]));
      
      if (result.isMatch) {
        setShowMatchToast(userName);
        setTimeout(() => setShowMatchToast(null), 3000);
      }
    } catch (error) {
      console.error("Error liking user:", error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl p-3 border border-[var(--color-aurora-purple)]/20 relative overflow-hidden">
      {/* Match Toast */}
      <AnimatePresence>
        {showMatchToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-gradient-to-r from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)] flex items-center justify-center z-10 rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="text-3xl mb-1"
              >
                💜
              </motion.div>
              <p className="font-bold text-[var(--color-aurora-violet)]">
                It's a Match with {showMatchToast}!
              </p>
              <p className="text-xs text-[var(--color-aurora-purple)]">+5 credits earned</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Sisters to meet</span>
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--color-aurora-pink)]/20 px-2 py-0.5 rounded-full">
          💜 Like to match
        </span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {suggestedUsers.map((user) => {
          const avatarUrl = getAvatarUrl(user);
          const isLiked = likedUsers.has(user._id);
          
          return (
            <motion.div 
              key={user._id} 
              className="flex-shrink-0 flex flex-col items-center gap-1 group"
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Link href={`/user/${user._id}`}>
                  <div className={`w-16 h-16 rounded-full border-2 transition-all overflow-hidden bg-[var(--color-aurora-lavender)] ${
                    isLiked 
                      ? "border-[var(--color-aurora-mint)] ring-2 ring-[var(--color-aurora-mint)]/30" 
                      : "border-[var(--color-aurora-lavender)] group-hover:border-[var(--color-aurora-purple)]"
                  }`}>
                    <img 
                      src={avatarUrl}
                      alt={user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <button
                  onClick={() => handleQuickLike(user._id, user.name?.split(" ")[0] || "Sister")}
                  disabled={isLiked}
                  className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md min-w-[28px] min-h-[28px] ${
                    isLiked 
                      ? "bg-[var(--color-aurora-mint)] cursor-default" 
                      : "bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-purple)] active:scale-110"
                  }`}
                >
                  {isLiked ? (
                    <Check className="w-3.5 h-3.5 text-[var(--color-aurora-violet)]" />
                  ) : (
                    <Heart className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
              <span className="text-[10px] text-[var(--foreground)] font-medium truncate max-w-[64px]">
                {user.name?.split(" ")[0]}
              </span>
              {user.trustScore && user.trustScore > 50 && (
                <span className="text-[8px] text-[var(--color-aurora-mint)]">
                  ✓ Trusted
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Feed-integrated Sister Spotlight - Shows as a feed card
 * More engaging version that fits naturally in the feed
 */
export function SisterSpotlightFeedCard({ currentUserId }: { currentUserId: Id<"users"> }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  
  const suggestedUsers = useQuery(api.users.getSuggestedUsers, { 
    userId: currentUserId,
    limit: 3,
  });

  const likeUser = useMutation(api.connections.likeUser);
  const skipUser = useMutation(api.connections.skipUser);

  if (!suggestedUsers || suggestedUsers.length === 0) return null;

  const currentUser = suggestedUsers[currentIndex];
  if (!currentUser) return null;

  const handleLike = async () => {
    if (likedUsers.has(currentUser._id)) {
      goToNext();
      return;
    }

    try {
      const result = await likeUser({
        userId: currentUserId,
        likedUserId: currentUser._id,
      });

      setLikedUsers(prev => new Set([...prev, currentUser._id]));

      if (result.isMatch) {
        setMatchedUser(result.matchedUser);
        setShowMatch(true);
        setTimeout(() => {
          setShowMatch(false);
          setMatchedUser(null);
          goToNext();
        }, 2500);
      } else {
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
  };

  const avatarUrl = getAvatarUrl(currentUser);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--foreground)]">Sister Spotlight</h3>
            <p className="text-[10px] text-[var(--muted-foreground)]">Swipe to connect</p>
          </div>
        </div>
        <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 text-[10px]">
          {currentIndex + 1}/{suggestedUsers.length}
        </Badge>
      </div>

      {/* Match Celebration */}
      <AnimatePresence>
        {showMatch && matchedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)]"
          >
            <div className="text-center px-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                className="text-5xl mb-3"
              >
                💜
              </motion.div>
              <h3 className="text-xl font-bold text-[var(--color-aurora-violet)]">
                It's a Match!
              </h3>
              <p className="text-[var(--color-aurora-purple)]">
                You and {matchedUser.name?.split(" ")[0]} can now chat
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/user/${currentUser._id}`}>
            <div className="w-20 h-20 rounded-full border-3 border-[var(--color-aurora-lavender)] overflow-hidden bg-[var(--color-aurora-lavender)] shadow-lg">
              <img 
                src={avatarUrl}
                alt={currentUser.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/user/${currentUser._id}`}>
              <h4 className="font-bold text-lg text-[var(--foreground)] hover:text-[var(--color-aurora-purple)]">
                {currentUser.name}
              </h4>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-xs">
                Trust: {currentUser.trustScore || 0}
              </Badge>
              {currentUser.isPremium && (
                <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-xs">
                  ⭐ Premium
                </Badge>
              )}
            </div>
            {currentUser.location && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {currentUser.location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {currentUser.bio && (
          <p className="mt-3 text-sm text-[var(--foreground)] line-clamp-2 italic">
            "{currentUser.bio}"
          </p>
        )}

        {/* Interests */}
        {currentUser.interests && currentUser.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {currentUser.interests.slice(0, 4).map((interest, idx) => (
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
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex items-center justify-center gap-4">
        <Button
          onClick={handleSkip}
          variant="outline"
          className="w-14 h-14 rounded-full border-2 border-[var(--muted)] hover:border-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
        >
          <X className="w-6 h-6 text-[var(--muted-foreground)]" />
        </Button>
        
        <Link href={`/user/${currentUser._id}`}>
          <Button
            variant="outline"
            className="w-12 h-12 rounded-full border-2 border-[var(--color-aurora-purple)]/30 hover:border-[var(--color-aurora-purple)]"
          >
            <Users className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          </Button>
        </Link>
        
        <Button
          onClick={handleLike}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 shadow-lg"
        >
          <Heart className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Footer hint */}
      <div className="px-4 pb-3 text-center">
        <p className="text-[10px] text-[var(--muted-foreground)]">
          💜 Both must like to match • Matches can chat • +5 credits on match
        </p>
      </div>
    </div>
  );
}
