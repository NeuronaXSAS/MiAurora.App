"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Droplets, 
  Heart, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Calendar,
  Flame,
  Moon,
  Sun,
  Activity
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface HealthStatsDashboardProps {
  userId: Id<"users">;
}

export function HealthStatsDashboard({ userId }: HealthStatsDashboardProps) {
  const hydrationHistory = useQuery(api.health.getHydrationHistory, { userId, days: 30 });
  const moodHistory = useQuery(api.health.getMoodHistory, { userId, days: 30 });
  const meditationStats = useQuery(api.health.getMeditationStats, { userId });

  // Calculate statistics
  const hydrationStats = calculateHydrationStats(hydrationHistory || []);
  const moodStats = calculateMoodStats(moodHistory || []);

  const moodEmojis = ["😢", "😐", "😊", "😄", "🤩"];
  const moodColors = ["#f05a6b", "#e5e093", "#d6f4ec", "#c9cef4", "#f29de5"];

  return (
    <div className="space-y-6">
      {/* Weekly Overview Ring Charts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Hydration Ring */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="p-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="#2e2ad6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${hydrationStats.weeklyCompletion * 2.2} 220`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-[var(--color-aurora-blue)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{hydrationStats.weeklyCompletion}%</p>
            <p className="text-xs text-[var(--muted-foreground)]">Hydration Goal</p>
          </CardContent>
        </Card>

        {/* Mood Ring */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="p-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="#f29de5"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(moodStats.averageMood / 5) * 220} 220`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {moodEmojis[Math.round(moodStats.averageMood) - 1] || "😊"}
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{moodStats.averageMood.toFixed(1)}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Avg Mood</p>
          </CardContent>
        </Card>

        {/* Meditation Ring */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="p-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="#5537a7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min((meditationStats?.totalMinutes || 0) / 60 * 100, 100) * 2.2} 220`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--color-aurora-purple)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{meditationStats?.totalMinutes || 0}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Minutes Meditated</p>
          </CardContent>
        </Card>

        {/* Streak Ring */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="p-4 text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="#ec4c28"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(hydrationStats.currentStreak / 7 * 100, 100) * 2.2} 220`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{hydrationStats.currentStreak}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Mood Journey (30 Days)
            {moodStats.trend !== 0 && (
              <span className={`ml-auto flex items-center text-sm ${moodStats.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                {moodStats.trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(moodStats.trend).toFixed(1)}%
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moodHistory && moodHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Visual Chart */}
              <div className="flex items-end gap-1 h-32 pt-4">
                {moodHistory.slice(0, 30).reverse().map((log, idx) => {
                  const height = (log.mood / 5) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full rounded-t-sm transition-all hover:opacity-80 cursor-pointer"
                        style={{ 
                          height: `${height}%`, 
                          backgroundColor: moodColors[log.mood - 1],
                          minHeight: "8px"
                        }}
                        title={`${log.date}: ${moodEmojis[log.mood - 1]}`}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-4 pt-2 border-t border-[var(--border)]">
                {moodEmojis.map((emoji, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: moodColors[idx] }}
                    />
                    <span className="text-xs">{emoji}</span>
                  </div>
                ))}
              </div>

              {/* Mood Distribution */}
              <div className="grid grid-cols-5 gap-2 pt-4">
                {moodEmojis.map((emoji, idx) => {
                  const count = moodHistory.filter(m => m.mood === idx + 1).length;
                  const percentage = moodHistory.length > 0 ? (count / moodHistory.length) * 100 : 0;
                  return (
                    <div key={idx} className="text-center">
                      <div className="text-2xl mb-1">{emoji}</div>
                      <Progress 
                        value={percentage} 
                        className="h-2 mb-1"
                        style={{ "--progress-color": moodColors[idx] } as React.CSSProperties}
                      />
                      <p className="text-xs text-[var(--muted-foreground)]">{count} days</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-[var(--color-aurora-pink)]/30 mx-auto mb-3" />
              <p className="text-[var(--muted-foreground)]">Start tracking your mood to see patterns!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hydration Weekly View */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[var(--color-aurora-blue)]" />
            Hydration This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hydrationHistory && hydrationHistory.length > 0 ? (
            <div className="space-y-3">
              {hydrationHistory.slice(0, 7).reverse().map((log, idx) => {
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const date = new Date(log.date);
                const dayName = dayNames[date.getDay()];
                const percentage = (log.glasses / log.goal) * 100;
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-10 text-sm text-[var(--muted-foreground)]">{dayName}</span>
                    <div className="flex-1 h-8 bg-[var(--accent)] rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-[var(--color-aurora-blue)] to-[var(--color-aurora-mint)] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {log.glasses}/{log.goal} 💧
                        </span>
                      </div>
                    </div>
                    {log.completed && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Droplets className="w-12 h-12 text-[var(--color-aurora-blue)]/30 mx-auto mb-3" />
              <p className="text-[var(--muted-foreground)]">Start logging water to see your progress!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meditation Stats */}
      {meditationStats && meditationStats.totalSessions > 0 && (
        <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[var(--color-aurora-purple)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Meditation Journey</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Your mindfulness progress</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-[var(--card)] rounded-xl">
                <p className="text-2xl font-bold text-[var(--color-aurora-purple)]">{meditationStats.totalSessions}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Sessions</p>
              </div>
              <div className="text-center p-3 bg-[var(--card)] rounded-xl">
                <p className="text-2xl font-bold text-[var(--color-aurora-pink)]">{meditationStats.totalMinutes}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Minutes</p>
              </div>
              <div className="text-center p-3 bg-[var(--card)] rounded-xl">
                <p className="text-2xl font-bold text-[var(--color-aurora-yellow)]">{meditationStats.totalCredits}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function calculateHydrationStats(history: Array<{ glasses: number; goal: number; completed: boolean; date: string }>) {
  if (history.length === 0) {
    return { weeklyCompletion: 0, currentStreak: 0, totalGlasses: 0 };
  }

  const last7 = history.slice(0, 7);
  const completedDays = last7.filter(h => h.completed).length;
  const weeklyCompletion = Math.round((completedDays / 7) * 100);

  let currentStreak = 0;
  for (const day of history) {
    if (day.glasses > 0) currentStreak++;
    else break;
  }

  const totalGlasses = history.reduce((sum, h) => sum + h.glasses, 0);

  return { weeklyCompletion, currentStreak, totalGlasses };
}

function calculateMoodStats(history: Array<{ mood: number; date: string }>) {
  if (history.length === 0) {
    return { averageMood: 3, trend: 0, bestDay: null };
  }

  const averageMood = history.reduce((sum, m) => sum + m.mood, 0) / history.length;

  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(history.length / 2);
  const recentAvg = history.slice(0, midpoint).reduce((sum, m) => sum + m.mood, 0) / midpoint || 0;
  const olderAvg = history.slice(midpoint).reduce((sum, m) => sum + m.mood, 0) / (history.length - midpoint) || 0;
  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  return { averageMood, trend, bestDay: null };
}
