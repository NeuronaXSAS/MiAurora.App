"use client";

/**
 * Daily Engagement Hub - The "Reason to Return" Component
 * 
 * This component creates daily engagement loops that drive retention:
 * - Login streak tracking with multipliers
 * - Daily challenges with credit rewards
 * - Progress visualization
 * - Social proof (activity indicators)
 */

import { useState, useEffect, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Sparkles,
  Target,
  Gift,
  Trophy,
  Star,
  ChevronRight,
  Zap,
  Heart,
  Shield,
  MapPin,
  MessageSquare,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DailyEngagementProps {
  userId: Id<"users">;
  compact?: boolean;
}

// Daily challenges that rotate
const DAILY_CHALLENGES = [
  {
    id: "post",
    title: "Share Your Voice",
    description: "Create a post to help the community",
    icon: MessageSquare,
    credits: 15,
    action: "/feed",
    color: "aurora-purple",
  },
  {
    id: "route",
    title: "Safety Pioneer",
    description: "Share a safe route you know",
    icon: MapPin,
    credits: 25,
    action: "/routes/track",
    color: "aurora-mint",
  },
  {
    id: "verify",
    title: "Truth Guardian",
    description: "Verify 3 community posts",
    icon: Shield,
    credits: 20,
    action: "/feed",
    color: "aurora-blue",
  },
  {
    id: "connect",
    title: "Build Connections",
    description: "Send a supportive message",
    icon: Heart,
    credits: 10,
    action: "/circles",
    color: "aurora-pink",
  },
  {
    id: "wellness",
    title: "Self-Care Check",
    description: "Log your mood and hydration",
    icon: Sparkles,
    credits: 10,
    action: "/health",
    color: "aurora-lavender",
  },
];

// Get today's challenge based on day of year
function getTodayChallenge() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}

// Streak milestones with bonus credits
const STREAK_MILESTONES = [
  { days: 3, bonus: 10, emoji: "🌱" },
  { days: 7, bonus: 25, emoji: "🔥" },
  { days: 14, bonus: 50, emoji: "⭐" },
  { days: 30, bonus: 100, emoji: "💎" },
  { days: 60, bonus: 200, emoji: "👑" },
  { days: 100, bonus: 500, emoji: "🏆" },
];

// Credit animation component
const CreditEarnAnimation = memo(function CreditEarnAnimation({
  amount,
  onComplete,
}: {
  amount: number;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -30, scale: 1 }}
      exit={{ opacity: 0, y: -60 }}
      className="fixed bottom-20 right-4 z-50 pointer-events-none"
    >
      <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        <span className="font-bold">+{amount} credits!</span>
      </div>
    </motion.div>
  );
});

// Streak display component
const StreakDisplay = memo(function StreakDisplay({
  streak,
  multiplier,
}: {
  streak: number;
  multiplier: number;
}) {
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > streak);
  const progress = nextMilestone
    ? ((streak % nextMilestone.days) / nextMilestone.days) * 100
    : 100;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            streak > 0
              ? "bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)]"
              : "bg-[var(--muted)]"
          )}
        >
          <Flame
            className={cn(
              "w-7 h-7",
              streak > 0 ? "text-white" : "text-[var(--muted-foreground)]"
            )}
          />
        </div>
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--color-aurora-purple)] rounded-full flex items-center justify-center text-white text-xs font-bold"
          >
            {streak}
          </motion.div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--foreground)]">
            {streak > 0 ? `${streak} Day Streak` : "Start Your Streak"}
          </span>
          {multiplier > 1 && (
            <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] text-xs">
              {multiplier}x bonus
            </Badge>
          )}
        </div>
        {nextMilestone && (
          <div className="mt-1">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
              <span>
                {nextMilestone.emoji} {nextMilestone.days} days
              </span>
              <span>+{nextMilestone.bonus} bonus</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>
    </div>
  );
});

// Daily challenge card
const DailyChallengeCard = memo(function DailyChallengeCard({
  challenge,
  isCompleted,
  onClaim,
}: {
  challenge: (typeof DAILY_CHALLENGES)[0];
  isCompleted: boolean;
  onClaim: () => void;
}) {
  const Icon = challenge.icon;

  return (
    <motion.div
      layout
      className={cn(
        "p-4 rounded-xl border-2 transition-all",
        isCompleted
          ? "bg-[var(--color-aurora-mint)]/10 border-[var(--color-aurora-mint)]"
          : "bg-[var(--accent)] border-transparent hover:border-[var(--color-aurora-purple)]/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            isCompleted
              ? "bg-[var(--color-aurora-mint)]"
              : `bg-[var(--color-${challenge.color})]/20`
          )}
        >
          {isCompleted ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <Icon
              className={`w-6 h-6 text-[var(--color-${challenge.color})]`}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[var(--foreground)]">
              {challenge.title}
            </h4>
            <Badge
              className={cn(
                "text-xs",
                isCompleted
                  ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                  : "bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
              )}
            >
              {isCompleted ? "Claimed!" : `+${challenge.credits}`}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {challenge.description}
          </p>
          {!isCompleted && (
            <Link href={challenge.action}>
              <Button
                size="sm"
                className="mt-2 h-8 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/90"
              >
                Start Challenge
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Activity pulse - shows platform is alive
const ActivityPulse = memo(function ActivityPulse({
  onlineNow,
  postsToday,
}: {
  onlineNow?: number;
  postsToday?: number;
}) {
  // Use provided values or defaults with slight randomization for liveliness
  const [stats, setStats] = useState({
    onlineNow: onlineNow || 127,
    postsToday: postsToday || 45,
  });

  // Update when props change
  useEffect(() => {
    if (onlineNow !== undefined) {
      setStats(prev => ({ ...prev, onlineNow }));
    }
    if (postsToday !== undefined) {
      setStats(prev => ({ ...prev, postsToday }));
    }
  }, [onlineNow, postsToday]);

  // Subtle animation to show platform is alive
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        onlineNow: Math.max(50, prev.onlineNow + Math.floor(Math.random() * 5) - 2),
        postsToday: prev.postsToday + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-aurora-mint)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-aurora-mint)]"></span>
        </span>
        <span className="text-[var(--muted-foreground)]">
          <strong className="text-[var(--foreground)]">{stats.onlineNow}</strong>{" "}
          sisters online
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-[var(--muted-foreground)]">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{stats.postsToday} posts today</span>
      </div>
    </div>
  );
});

// Main component
export function DailyEngagement({ userId, compact = false }: DailyEngagementProps) {
  const [showCreditAnimation, setShowCreditAnimation] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Real queries from backend
  const dailyStatus = useQuery(api.engagement.getDailyStatus, { userId });
  const claimDailyBonus = useMutation(api.engagement.claimDailyBonus);
  
  // Extract data from query
  const streak = dailyStatus?.currentStreak || 0;
  const multiplier = dailyStatus?.streakMultiplier || 1;
  const canClaimDaily = dailyStatus?.canClaimDaily ?? true;
  const todayChallenge = dailyStatus?.todayChallenge || getTodayChallenge();

  const handleClaimDaily = async () => {
    if (isClaiming || !canClaimDaily) return;
    
    setIsClaiming(true);
    try {
      const result = await claimDailyBonus({ userId });
      if (result.success) {
        setShowCreditAnimation(result.creditsAwarded);
      }
    } catch (error) {
      console.error("Failed to claim daily bonus:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Compact view for sidebar
  if (compact) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardContent className="p-4 space-y-3">
          <StreakDisplay streak={streak} multiplier={multiplier} />
          
          {canClaimDaily && (
            <Button
              onClick={handleClaimDaily}
              disabled={isClaiming}
              className="w-full bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90 disabled:opacity-50"
            >
              <Gift className="w-4 h-4 mr-2" />
              {isClaiming ? "Claiming..." : "Claim Daily Bonus"}
            </Button>
          )}

          <div className="pt-2 border-t border-[var(--border)]">
            <ActivityPulse 
              onlineNow={dailyStatus?.onlineNow}
              postsToday={dailyStatus?.postsToday}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <>
      <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Daily Hub</h3>
              <p className="text-white/80 text-sm">
                Complete tasks to earn credits
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {dailyStatus?.credits || 0}
              </div>
              <div className="text-white/80 text-xs flex items-center justify-end gap-1">
                <Sparkles className="w-3 h-3" />
                credits
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Streak section */}
          <StreakDisplay streak={streak} multiplier={multiplier} />

          {/* Daily login bonus */}
          {canClaimDaily && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-aurora-yellow)]/10 to-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-yellow)]/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-yellow)] flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      Daily Login Bonus
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      +{Math.floor(5 * multiplier)} credits
                      {multiplier > 1 && (
                        <span className="text-[var(--color-aurora-yellow)]">
                          {" "}
                          ({multiplier}x streak bonus!)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClaimDaily}
                  disabled={isClaiming}
                  className="bg-[var(--color-aurora-yellow)] hover:bg-[var(--color-aurora-yellow)]/90 text-[var(--color-aurora-violet)] disabled:opacity-50"
                >
                  {isClaiming ? "..." : "Claim"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Today's challenge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                Today's Challenge
              </h4>
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Clock className="w-3 h-3" />
                Resets in 12h
              </div>
            </div>
            <DailyChallengeCard
              challenge={todayChallenge}
              isCompleted={false}
              onClaim={() => {}}
            />
          </div>

          {/* Activity pulse */}
          <div className="pt-3 border-t border-[var(--border)]">
            <ActivityPulse 
              onlineNow={dailyStatus?.onlineNow}
              postsToday={dailyStatus?.postsToday}
            />
          </div>
        </CardContent>
      </Card>

      {/* Credit animation */}
      <AnimatePresence>
        {showCreditAnimation && (
          <CreditEarnAnimation
            amount={showCreditAnimation}
            onComplete={() => setShowCreditAnimation(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
