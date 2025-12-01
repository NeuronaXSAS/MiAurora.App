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

export default function HealthPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

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

          {/* Overview Tab - Your Journey */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Monthly Progress */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                    Your 30-Day Journey
                  </h3>
                  
                  {/* Mood Trend Chart */}
                  {moodHistory && moodHistory.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-2">Mood Trend</p>
                        <div className="flex items-end gap-1 h-20">
                          {moodHistory.slice(0, 30).reverse().map((log, idx) => {
                            const height = (log.mood / 5) * 100;
                            const moodColors = ['bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'];
                            return (
                              <div 
                                key={idx} 
                                className={`flex-1 ${moodColors[log.mood - 1]} rounded-t opacity-80 hover:opacity-100 transition-all cursor-pointer`}
                                style={{ height: `${height}%` }}
                                title={`${log.date}: ${['😢', '😐', '😊', '😄', '🤩'][log.mood - 1]}`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                          <span>30 days ago</span>
                          <span>Today</span>
                        </div>
                      </div>

                      {/* Insights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--border)]">
                        <div className="bg-[var(--accent)] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-[var(--color-aurora-pink)]">
                            {(moodHistory.reduce((sum, m) => sum + m.mood, 0) / moodHistory.length).toFixed(1)}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">Avg Mood</p>
                        </div>
                        <div className="bg-[var(--accent)] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">
                            {moodHistory.filter(m => m.mood >= 4).length}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">Great Days</p>
                        </div>
                        <div className="bg-[var(--accent)] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-[var(--color-aurora-purple)]">
                            {moodHistory.filter(m => m.journal).length}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">Journal Entries</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-[var(--color-aurora-pink)]/30 mx-auto mb-3" />
                      <p className="text-[var(--muted-foreground)]">Start tracking your mood to see your journey!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className="bg-gradient-to-br from-[var(--color-aurora-pink)]/20 to-[var(--color-aurora-purple)]/20 border-[var(--color-aurora-pink)]/30 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
                  onClick={() => setActiveTab("mood")}
                >
                  <CardContent className="p-4 text-center">
                    <Heart className="w-8 h-8 text-[var(--color-aurora-pink)] mx-auto mb-2" />
                    <p className="font-semibold text-[var(--foreground)]">Daily Check-in</p>
                    <p className="text-xs text-[var(--muted-foreground)]">How are you feeling?</p>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-gradient-to-br from-[var(--color-aurora-blue)]/20 to-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-blue)]/30 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
                  onClick={() => setActiveTab("hydration")}
                >
                  <CardContent className="p-4 text-center">
                    <Droplets className="w-8 h-8 text-[var(--color-aurora-blue)] mx-auto mb-2" />
                    <p className="font-semibold text-[var(--foreground)]">Log Water</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Stay hydrated!</p>
                  </CardContent>
                </Card>
              </div>

              {/* Motivational Message */}
              <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-8 h-8 text-[var(--color-aurora-purple)] mx-auto mb-3" />
                  <p className="text-lg font-medium text-[var(--foreground)] mb-2">
                    {wellnessScore >= 80 ? "You're doing amazing! Keep it up! 🌟" :
                     wellnessScore >= 60 ? "Great progress! You're on the right track! 💪" :
                     wellnessScore >= 40 ? "Every step counts. Keep going! 🌸" :
                     "Start your wellness journey today! 💜"}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Your consistency builds your strength. Aurora App is here for you every day.
                  </p>
                </CardContent>
              </Card>
            </div>
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
      </div>
    </div>
  );
}
