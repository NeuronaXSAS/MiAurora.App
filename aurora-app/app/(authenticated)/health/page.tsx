"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CycleTracker } from "@/components/health/cycle-tracker";
import { HydrationTracker } from "@/components/health/hydration-tracker";
import { EmotionalCheckin } from "@/components/health/emotional-checkin";
import { MeditationSection } from "@/components/health/meditation-section";
import { HealthStatsDashboard } from "@/components/health/health-stats-dashboard";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Moon, 
  Droplets, 
  Heart, 
  Sparkles,
  Flower2,
  TrendingUp,
  Calendar,
  Award,
  Flame
} from "lucide-react";
import { SmartAd, useIsPremium } from "@/components/ads/smart-ad";

export default function HealthPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const isPremium = useIsPremium();

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/");
      }
    };
    getUserId();
  }, [router]);

  // Fetch wellness data for overview
  const hydrationHistory = useQuery(
    api.health.getHydrationHistory,
    userId ? { userId, days: 30 } : "skip"
  );
  const moodHistory = useQuery(
    api.health.getMoodHistory,
    userId ? { userId, days: 30 } : "skip"
  );
  const meditationStats = useQuery(
    api.health.getMeditationStats,
    userId ? { userId } : "skip"
  );

  // Calculate wellness score and streaks
  const calculateWellnessScore = () => {
    if (!hydrationHistory || !moodHistory) return 0;
    
    const hydrationScore = hydrationHistory.length > 0 
      ? (hydrationHistory.filter(h => h.completed).length / Math.min(hydrationHistory.length, 7)) * 25
      : 0;
    
    const moodScore = moodHistory.length > 0
      ? (moodHistory.reduce((sum, m) => sum + m.mood, 0) / moodHistory.length / 5) * 25
      : 0;
    
    const meditationScore = meditationStats?.totalSessions 
      ? Math.min((meditationStats.totalSessions / 10) * 25, 25)
      : 0;
    
    const consistencyScore = hydrationHistory.length >= 7 && moodHistory.length >= 7 ? 25 : 
      (hydrationHistory.length + moodHistory.length) / 14 * 25;
    
    return Math.round(hydrationScore + moodScore + meditationScore + consistencyScore);
  };

  const calculateStreak = () => {
    if (!hydrationHistory || hydrationHistory.length === 0) return 0;
    let streak = 0;
    const sortedHistory = [...hydrationHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (const day of sortedHistory) {
      if (day.glasses > 0) streak++;
      else break;
    }
    return streak;
  };

  const wellnessScore = calculateWellnessScore();
  const currentStreak = calculateStreak();

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-aurora-pink)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-pink)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)] text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Flower2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Soul Sanctuary</h1>
              <p className="text-white/80 text-sm sm:text-base">Your holistic wellness journey</p>
            </div>
          </div>

          {/* Wellness Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs text-white/80">Wellness Score</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{wellnessScore}%</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div 
                  className="h-full bg-[var(--color-aurora-mint)] rounded-full transition-all duration-500"
                  style={{ width: `${wellnessScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-xs text-white/80">Current Streak</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{currentStreak}</p>
              <p className="text-xs text-white/60">days active</p>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs text-white/80">This Month</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{moodHistory?.length || 0}</p>
              <p className="text-xs text-white/60">check-ins</p>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                <span className="text-xs text-white/80">Meditations</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{meditationStats?.totalSessions || 0}</p>
              <p className="text-xs text-white/60">completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4 sm:mb-6 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--color-aurora-pink)] data-[state=active]:to-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cycle" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-pink)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Cycle</span>
            </TabsTrigger>
            <TabsTrigger 
              value="hydration" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-blue)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <Droplets className="w-4 h-4" />
              <span className="hidden sm:inline">Hydration</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mood" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger 
              value="meditate" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-mint)] data-[state=active]:text-[var(--color-aurora-violet)] rounded-lg py-2 sm:py-2.5"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Meditate</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Enhanced Stats Dashboard */}
          <TabsContent value="overview">
            <HealthStatsDashboard userId={userId} />
          </TabsContent>

          <TabsContent value="cycle">
            <CycleTracker userId={userId} />
          </TabsContent>

          <TabsContent value="hydration">
            <HydrationTracker userId={userId} />
          </TabsContent>

          <TabsContent value="mood">
            <EmotionalCheckin userId={userId} />
          </TabsContent>

          <TabsContent value="meditate">
            <MeditationSection userId={userId} />
          </TabsContent>
        </Tabs>

        {/* Banner Ad - Bottom of health page */}
        <SmartAd placement="banner" isPremium={isPremium} />
      </div>
    </div>
  );
}
