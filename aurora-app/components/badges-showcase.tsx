"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  TrendingUp,
  Heart,
  Shield,
  Briefcase,
  Star
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface BadgesShowcaseProps {
  userId: Id<"users">;
}

// Badge definitions matching backend
const BADGE_DEFINITIONS = {
  guardian_angel: { id: "guardian_angel", name: "Guardian Angel", description: "Helped 5 women feel safer", emoji: "👼", color: "#d6f4ec", category: "safety", points: 50 },
  safety_champion: { id: "safety_champion", name: "Safety Champion", description: "Verified 10 safe routes", emoji: "🛡️", color: "#c9cef4", category: "safety", points: 100 },
  sister_keeper: { id: "sister_keeper", name: "Sister's Keeper", description: "Accompanied 3 sisters safely", emoji: "🤝", color: "#f29de5", category: "community", points: 75 },
  hydration_queen: { id: "hydration_queen", name: "Hydration Queen", description: "7-day hydration streak", emoji: "💧", color: "#2e2ad6", category: "wellness", points: 30 },
  mindful_warrior: { id: "mindful_warrior", name: "Mindful Warrior", description: "Completed 10 meditation sessions", emoji: "🧘‍♀️", color: "#5537a7", category: "wellness", points: 50 },
  mood_tracker: { id: "mood_tracker", name: "Self-Aware Queen", description: "Logged mood for 14 days", emoji: "💜", color: "#f29de5", category: "wellness", points: 40 },
  storyteller: { id: "storyteller", name: "Storyteller", description: "Shared 5 inspiring posts", emoji: "✨", color: "#e5e093", category: "content", points: 25 },
  reel_star: { id: "reel_star", name: "Reel Star", description: "Created 3 reels", emoji: "🎬", color: "#f05a6b", category: "content", points: 45 },
  viral_queen: { id: "viral_queen", name: "Viral Queen", description: "Got 1000 views on a reel", emoji: "👑", color: "#e5e093", category: "content", points: 100 },
  opportunity_seeker: { id: "opportunity_seeker", name: "Opportunity Seeker", description: "Unlocked 3 opportunities", emoji: "🚀", color: "#2e2ad6", category: "career", points: 35 },
  mentor_heart: { id: "mentor_heart", name: "Mentor Heart", description: "Helped 5 women with advice", emoji: "💝", color: "#f29de5", category: "career", points: 60 },
  aurora_pioneer: { id: "aurora_pioneer", name: "Aurora Pioneer", description: "Early adopter of Aurora App", emoji: "🌟", color: "#5537a7", category: "special", points: 100 },
  credit_collector: { id: "credit_collector", name: "Credit Collector", description: "Earned 500 credits", emoji: "💰", color: "#e5e093", category: "milestone", points: 50 },
  consistency_queen: { id: "consistency_queen", name: "Consistency Queen", description: "Active for 30 days", emoji: "🔥", color: "#ec4c28", category: "milestone", points: 150 },
} as const;

type BadgeId = keyof typeof BADGE_DEFINITIONS;

const CATEGORIES = [
  { id: "all", label: "All", icon: Star },
  { id: "wellness", label: "Wellness", icon: Heart },
  { id: "safety", label: "Safety", icon: Shield },
  { id: "content", label: "Content", icon: Sparkles },
  { id: "career", label: "Career", icon: Briefcase },
  { id: "milestone", label: "Milestones", icon: Award },
];

export function BadgesShowcase({ userId }: BadgesShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [celebratingBadge, setCelebratingBadge] = useState<string | null>(null);

  const userBadges = useQuery(api.badges.getUserBadges, { userId });
  const badgeProgress = useQuery(api.badges.getBadgeProgress, { userId });
  const markSeen = useMutation(api.badges.markBadgeSeen);

  // Check for new badges and show celebration
  useEffect(() => {
    if (userBadges) {
      const newBadge = userBadges.find((b) => b.isNew);
      if (newBadge) {
        setCelebratingBadge(newBadge.badgeId);
        markSeen({ badgeRecordId: newBadge._id });
      }
    }
  }, [userBadges, markSeen]);

  const earnedBadgeIds = new Set(userBadges?.map((b) => b.badgeId) || []);

  const filteredBadges = Object.values(BADGE_DEFINITIONS).filter((badge) => {
    if (selectedCategory === "all") return true;
    return badge.category === selectedCategory || badge.category === "community" && selectedCategory === "safety";
  });

  const totalPoints = userBadges?.reduce((sum, b) => {
    const def = BADGE_DEFINITIONS[b.badgeId as BadgeId];
    return sum + (def?.points || 0);
  }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Celebration Modal */}
      <AnimatePresence>
        {celebratingBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setCelebratingBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              className="bg-[var(--card)] rounded-3xl p-8 max-w-sm mx-4 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-7xl mb-4"
              >
                {BADGE_DEFINITIONS[celebratingBadge as BadgeId]?.emoji}
              </motion.div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                🎉 New Badge Earned!
              </h2>
              <h3 className="text-xl font-semibold text-[var(--color-aurora-purple)] mb-2">
                {BADGE_DEFINITIONS[celebratingBadge as BadgeId]?.name}
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                {BADGE_DEFINITIONS[celebratingBadge as BadgeId]?.description}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-aurora-yellow)]/20 rounded-full">
                <span className="text-[var(--color-aurora-yellow)]">+{BADGE_DEFINITIONS[celebratingBadge as BadgeId]?.points}</span>
                <span className="text-sm text-[var(--muted-foreground)]">credits</span>
              </div>
              <button
                onClick={() => setCelebratingBadge(null)}
                className="mt-6 w-full py-3 bg-[var(--color-aurora-purple)] text-white rounded-xl font-medium hover:bg-[var(--color-aurora-violet)] transition-colors"
              >
                Awesome! 💜
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Header */}
      <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Your Achievements</p>
              <h2 className="text-3xl font-bold">{userBadges?.length || 0} / {Object.keys(BADGE_DEFINITIONS).length}</h2>
              <p className="text-white/80 text-sm mt-1">badges earned</p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-sm">
                <span className="font-bold">{totalPoints}</span> points
              </p>
            </div>
          </div>
          <Progress 
            value={(userBadges?.length || 0) / Object.keys(BADGE_DEFINITIONS).length * 100} 
            className="mt-4 h-2 bg-white/20"
          />
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-[var(--color-aurora-purple)] text-white"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const progress = badgeProgress?.progress[badge.id];

          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`relative overflow-hidden transition-all ${
                  isEarned 
                    ? "bg-[var(--card)] border-2" 
                    : "bg-[var(--card)]/50 border border-dashed border-[var(--border)]"
                }`}
                style={{ borderColor: isEarned ? badge.color : undefined }}
              >
                <CardContent className="p-4 text-center">
                  {/* Badge Icon */}
                  <div 
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                      isEarned ? "" : "grayscale opacity-40"
                    }`}
                    style={{ backgroundColor: `${badge.color}30` }}
                  >
                    <span className="text-3xl">{badge.emoji}</span>
                  </div>

                  {/* Badge Info */}
                  <h3 className={`font-semibold text-sm mb-1 ${isEarned ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                    {badge.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-2">
                    {badge.description}
                  </p>

                  {/* Status */}
                  {isEarned ? (
                    <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Earned
                    </Badge>
                  ) : progress ? (
                    <div className="space-y-1">
                      <Progress value={progress.percentage} className="h-1.5" />
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {progress.current}/{progress.required}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[var(--muted-foreground)]">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}

                  {/* Points */}
                  <p className="text-xs mt-2" style={{ color: badge.color }}>
                    +{badge.points} pts
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
