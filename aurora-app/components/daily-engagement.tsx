"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Gift, 
  Star, 
  Zap, 
  Trophy,
  Sparkles,
  Heart,
  MessageSquare,
  MapPin,
  ChevronRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface DailyEngagementProps {
  userId?: string;
  onDismiss?: () => void;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  action: string;
  href: string;
}

export function DailyEngagement({ userId, onDismiss }: DailyEngagementProps) {
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);

  useEffect(() => {
    // Load streak from localStorage
    const savedStreak = localStorage.getItem(`aurora-streak-${userId}`);
    const lastVisit = localStorage.getItem(`aurora-last-visit-${userId}`);
    const today = new Date().toDateString();
    
    if (lastVisit === today) {
      setStreak(parseInt(savedStreak || "0"));
      setDailyRewardClaimed(localStorage.getItem(`aurora-daily-claimed-${userId}-${today}`) === "true");
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastVisit === yesterday) {
        const newStreak = parseInt(savedStreak || "0") + 1;
        setStreak(newStreak);
        localStorage.setItem(`aurora-streak-${userId}`, newStreak.toString());
      } else {
        setStreak(1);
        localStorage.setItem(`aurora-streak-${userId}`, "1");
      }
      localStorage.setItem(`aurora-last-visit-${userId}`, today);
    }

    // Generate daily challenges
    const todayChallenges: DailyChallenge[] = [
      {
        id: "safety-report",
        title: "Safety Scout",
        description: "Rate a location's safety",
        icon: MapPin,
        reward: 25,
        progress: 0,
        target: 1,
        completed: false,
        action: "Rate Now",
        href: "/map",
      },
      {
        id: "engage-post",
        title: "Community Voice",
        description: "Comment on 3 posts",
        icon: MessageSquare,
        reward: 15,
        progress: 0,
        target: 3,
        completed: false,
        action: "Browse Feed",
        href: "/feed",
      },
      {
        id: "support-sister",
        title: "Sister Support",
        description: "Send an encouraging message",
        icon: Heart,
        reward: 20,
        progress: 0,
        target: 1,
        completed: false,
        action: "Message",
        href: "/messages",
      },
    ];
    setChallenges(todayChallenges);
  }, [userId]);

  const claimDailyReward = () => {
    setShowReward(true);
    setDailyRewardClaimed(true);
    const today = new Date().toDateString();
    localStorage.setItem(`aurora-daily-claimed-${userId}-${today}`, "true");
    
    setTimeout(() => setShowReward(false), 3000);
  };

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalReward = challenges.reduce((sum, c) => sum + (c.completed ? c.reward : 0), 0);

  return (
    <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20 overflow-hidden relative">
      {/* Dismiss button */}
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
        >
          <X className="w-4 h-4 text-[var(--muted-foreground)]" />
        </button>
      )}

      <CardContent className="p-4">
        {/* Streak & Daily Reward */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              {streak >= 7 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-aurora-purple)] rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-[var(--foreground)]">{streak} Day Streak! 🔥</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {streak >= 7 ? "You're on fire! Keep it up!" : `${7 - streak} more days for bonus`}
              </p>
            </div>
          </div>
          
          {!dailyRewardClaimed ? (
            <Button 
              onClick={claimDailyReward}
              size="sm"
              className="bg-[var(--color-aurora-yellow)] hover:bg-[var(--color-aurora-yellow)]/90 text-[var(--color-aurora-violet)] font-bold min-h-[40px] px-4"
            >
              <Gift className="w-4 h-4 mr-1" />
              Claim +{5 + streak}
            </Button>
          ) : (
            <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
              ✓ Claimed
            </Badge>
          )}
        </div>

        {/* Daily Challenges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">Daily Challenges</p>
            <Badge variant="outline" className="text-xs border-[var(--color-aurora-purple)]/30">
              {completedChallenges}/{challenges.length} Done
            </Badge>
          </div>
          
          {challenges.map((challenge) => (
            <Link key={challenge.id} href={challenge.href}>
              <motion.div 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                  challenge.completed 
                    ? "bg-[var(--color-aurora-mint)]/20" 
                    : "bg-[var(--card)] hover:bg-[var(--accent)]"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  challenge.completed 
                    ? "bg-[var(--color-aurora-mint)]" 
                    : "bg-[var(--color-aurora-purple)]/20"
                }`}>
                  <challenge.icon className={`w-5 h-5 ${
                    challenge.completed 
                      ? "text-[var(--color-aurora-violet)]" 
                      : "text-[var(--color-aurora-purple)]"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-[var(--foreground)]">{challenge.title}</p>
                    <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] text-xs">
                      +{challenge.reward}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">{challenge.description}</p>
                  {!challenge.completed && (
                    <Progress 
                      value={(challenge.progress / challenge.target) * 100} 
                      className="h-1 mt-1"
                    />
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Bonus tip */}
        <div className="mt-3 p-2 bg-[var(--accent)] rounded-lg">
          <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[var(--color-aurora-purple)]" />
            Complete all challenges for a <span className="font-bold text-[var(--color-aurora-purple)]">mystery bonus!</span>
          </p>
        </div>
      </CardContent>

      {/* Reward Animation */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center"
          >
            <div className="text-center text-white">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Trophy className="w-16 h-16 mx-auto mb-2" />
              </motion.div>
              <p className="text-2xl font-bold">+{5 + streak} Credits!</p>
              <p className="text-sm opacity-80">Daily reward claimed</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
