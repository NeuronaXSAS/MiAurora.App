"use client";

/**
 * Pending Likes - Shows users who have liked you
 * 
 * When someone likes you, you get notified and can come here
 * to see who liked you and swipe right to match!
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  X, 
  MessageCircle, 
  MapPin, 
  Briefcase,
  Sparkles,
  Users,
  Star,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface PendingLikesProps {
  userId: Id<"users">;
  onBack?: () => void;
}

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
    const config = user.avatarConfig as any;
    const { seed, backgroundColor, hairStyle, hairColor, skinColor } = config;
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor?.replace('#', '') || 'c9cef4'}&hair=${hairStyle || 'variant01'}&hairColor=${hairColor?.replace('#', '') || '000000'}&skinColor=${skinColor?.replace('#', '') || 'f5d0c5'}`;
  }
  const seed = user.name || user._id;
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c9cef4`;
}

export function PendingLikes({ userId, onBack }: PendingLikesProps) {
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [respondedUsers, setRespondedUsers] = useState<Set<string>>(new Set());

  // Get users who liked you but you haven't responded
  const pendingLikes = useQuery(api.connections.getPendingLikes, { userId });
  
  const likeUser = useMutation(api.connections.likeUser);
  const skipUser = useMutation(api.connections.skipUser);

  const handleLike = async (likedUser: any) => {
    if (respondedUsers.has(likedUser._id)) return;

    try {
      const result = await likeUser({
        userId: userId,
        likedUserId: likedUser._id,
      });

      setRespondedUsers(prev => new Set([...prev, likedUser._id]));

      if (result.isMatch) {
        setMatchedUser(likedUser);
        setShowMatch(true);
        setTimeout(() => {
          setShowMatch(false);
          setMatchedUser(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error liking user:", error);
    }
  };

  const handleSkip = async (skippedUser: any) => {
    if (respondedUsers.has(skippedUser._id)) return;

    try {
      await skipUser({
        userId: userId,
        skippedUserId: skippedUser._id,
      });
      setRespondedUsers(prev => new Set([...prev, skippedUser._id]));
    } catch (error) {
      console.error("Error skipping user:", error);
    }
  };

  // Filter out users we've already responded to
  const activeLikes = pendingLikes?.filter(
    (user: any) => !respondedUsers.has(user._id)
  ) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Sisters Who Like You
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Swipe right to match and start chatting!
          </p>
        </div>
        {activeLikes.length > 0 && (
          <Badge className="bg-[var(--color-aurora-pink)] text-white">
            {activeLikes.length} new
          </Badge>
        )}
      </div>

      {/* Match Celebration Overlay */}
      <AnimatePresence>
        {showMatch && matchedUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-br from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4"
              >
                💜
              </motion.div>
              <h3 className="text-2xl font-bold text-[var(--color-aurora-violet)] mb-2">
                It's a Match!
              </h3>
              <p className="text-[var(--color-aurora-purple)] mb-6">
                You and {matchedUser.name?.split(" ")[0]} can now chat!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/messages/${matchedUser._id}`}>
                  <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setShowMatch(false)}
                  className="min-h-[44px]"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {pendingLikes === undefined && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty State */}
      {pendingLikes !== undefined && activeLikes.length === 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 flex items-center justify-center">
              <Heart className="w-8 h-8 text-[var(--color-aurora-pink)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No pending likes yet
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4 max-w-xs mx-auto">
              When someone likes you, they'll appear here. Keep being awesome!
            </p>
            <Link href="/feed">
              <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]">
                <Sparkles className="w-4 h-4 mr-2" />
                Discover Sisters
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Likes List */}
      {activeLikes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {activeLikes.map((user: any, index: number) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Gradient Header */}
                  <div className="h-2 bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]" />
                  
                  <CardContent className="p-4">
                    {/* Profile Section */}
                    <div className="flex items-start gap-3 mb-3">
                      <Link href={`/user/${user._id}`}>
                        <div className="w-16 h-16 rounded-full border-3 border-[var(--color-aurora-lavender)] overflow-hidden bg-[var(--color-aurora-lavender)] shadow-md hover:scale-105 transition-transform">
                          <img 
                            src={getAvatarUrl(user)}
                            alt={user.name || "User"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/user/${user._id}`}>
                          <h4 className="font-bold text-[var(--foreground)] hover:text-[var(--color-aurora-purple)] transition-colors truncate">
                            {user.name}
                          </h4>
                        </Link>
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-[10px]">
                            Trust: {user.trustScore || 0}
                          </Badge>
                          {user.isPremium && (
                            <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-[10px]">
                              ⭐ Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                          Liked you {user.likedAt ? formatDistanceToNow(user.likedAt, { addSuffix: true }) : "recently"}
                        </p>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-1 text-xs text-[var(--muted-foreground)] mb-3">
                      {user.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[var(--color-aurora-blue)] flex-shrink-0" />
                          <span className="truncate">{user.location}</span>
                        </div>
                      )}
                      {user.industry && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-[var(--color-aurora-purple)] flex-shrink-0" />
                          <span className="truncate">{user.industry}</span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-xs text-[var(--foreground)] line-clamp-2 mb-3 italic">
                        "{user.bio}"
                      </p>
                    )}

                    {/* Interests */}
                    {user.interests && user.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {user.interests.slice(0, 3).map((interest: string, idx: number) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-[10px] bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-purple)] px-2 py-0"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-2 border-t border-[var(--border)]">
                      <Button
                        onClick={() => handleSkip(user)}
                        variant="outline"
                        className="flex-1 min-h-[44px] border-[var(--muted)] hover:border-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
                      >
                        <X className="w-4 h-4 mr-1 text-[var(--muted-foreground)]" />
                        Skip
                      </Button>
                      
                      <Link href={`/user/${user._id}`} className="flex-shrink-0">
                        <Button
                          variant="outline"
                          className="min-h-[44px] min-w-[44px] border-[var(--color-aurora-purple)]/30 hover:border-[var(--color-aurora-purple)]"
                        >
                          <Users className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                        </Button>
                      </Link>
                      
                      <Button
                        onClick={() => handleLike(user)}
                        className="flex-1 min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90"
                      >
                        <Heart className="w-4 h-4 mr-1 text-white" />
                        Match
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Footer */}
      <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
        💜 When you both like each other, it's a match! Matches can chat directly.
      </p>
    </div>
  );
}
