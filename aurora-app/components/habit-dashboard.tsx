"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Plus,
  Flame,
  Check,
  Trophy,
  Sparkles,
  TrendingUp,
  X,
  Calendar,
  BarChart3,
  Zap,
  Heart,
  Briefcase,
  BookOpen,
  Dumbbell,
  Moon,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isBefore,
  subDays,
} from "date-fns";

interface HabitDashboardProps {
  userId: Id<"users">;
}

// Life dimensions for tracking different areas
const LIFE_DIMENSIONS = [
  {
    id: "health",
    name: "Health",
    emoji: "💪",
    icon: Dumbbell,
    color: "var(--color-aurora-mint)",
  },
  {
    id: "career",
    name: "Career",
    emoji: "💼",
    icon: Briefcase,
    color: "var(--color-aurora-blue)",
  },
  {
    id: "relationships",
    name: "Relationships",
    emoji: "💕",
    icon: Heart,
    color: "var(--color-aurora-pink)",
  },
  {
    id: "growth",
    name: "Growth",
    emoji: "🌱",
    icon: BookOpen,
    color: "var(--color-aurora-purple)",
  },
  {
    id: "creativity",
    name: "Creativity",
    emoji: "🎨",
    icon: Palette,
    color: "var(--color-aurora-yellow)",
  },
  {
    id: "rest",
    name: "Rest",
    emoji: "😴",
    icon: Moon,
    color: "var(--color-aurora-lavender)",
  },
] as const;

// Preset habits with categories
const PRESET_HABITS = [
  {
    name: "Drink 8 glasses of water",
    emoji: "💧",
    type: "build" as const,
    dimension: "health",
  },
  {
    name: "Exercise 30 minutes",
    emoji: "🏃‍♀️",
    type: "build" as const,
    dimension: "health",
  },
  {
    name: "Read for 20 minutes",
    emoji: "📚",
    type: "build" as const,
    dimension: "growth",
  },
  { name: "Meditate", emoji: "🧘‍♀️", type: "build" as const, dimension: "rest" },
  {
    name: "No social media before noon",
    emoji: "📵",
    type: "break" as const,
    dimension: "growth",
  },
  {
    name: "No smoking",
    emoji: "🚭",
    type: "break" as const,
    dimension: "health",
  },
  {
    name: "Practice gratitude",
    emoji: "🙏",
    type: "build" as const,
    dimension: "growth",
  },
  {
    name: "Connect with a friend",
    emoji: "👋",
    type: "build" as const,
    dimension: "relationships",
  },
  {
    name: "Work on side project",
    emoji: "💻",
    type: "build" as const,
    dimension: "career",
  },
  {
    name: "Skincare routine",
    emoji: "✨",
    type: "build" as const,
    dimension: "health",
  },
  { name: "Journal", emoji: "📝", type: "build" as const, dimension: "growth" },
  {
    name: "Sleep before midnight",
    emoji: "🌙",
    type: "build" as const,
    dimension: "rest",
  },
];

// Habit color options
const HABIT_COLORS = [
  { name: "Aurora Pink", value: "var(--color-aurora-pink)" },
  { name: "Aurora Purple", value: "var(--color-aurora-purple)" },
  { name: "Aurora Mint", value: "var(--color-aurora-mint)" },
  { name: "Aurora Yellow", value: "var(--color-aurora-yellow)" },
  { name: "Aurora Blue", value: "var(--color-aurora-blue)" },
  { name: "Aurora Salmon", value: "var(--color-aurora-salmon)" },
];

// WeekDay component for the calendar view
const WeekDay = memo(function WeekDay({
  date,
  habits,
  completionMap,
  onDayClick,
}: {
  date: Date;
  habits: { _id: string }[];
  completionMap: Map<string, Set<string>>;
  onDayClick: (date: Date) => void;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayName = format(date, "EEE");
  const dayNum = format(date, "d");
  const isCurrentDay = isToday(date);
  const isPast = isBefore(date, new Date()) && !isCurrentDay;

  // Calculate completion for this day
  const dayCompletions = completionMap.get(dateStr) || new Set();
  const completedCount = dayCompletions.size;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? completedCount / totalHabits : 0;

  return (
    <button
      onClick={() => onDayClick(date)}
      className={`
        flex flex-col items-center p-2 rounded-xl transition-all min-w-[50px]
        ${
          isCurrentDay
            ? "bg-gradient-to-b from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white"
            : "hover:bg-[var(--accent)]"
        }
      `}
    >
      <span
        className={`text-xs ${isCurrentDay ? "text-white/80" : "text-[var(--muted-foreground)]"}`}
      >
        {dayName}
      </span>
      <span
        className={`text-lg font-bold ${isCurrentDay ? "text-white" : "text-[var(--foreground)]"}`}
      >
        {dayNum}
      </span>
      {/* Completion indicator dots */}
      <div className="flex gap-0.5 mt-1">
        {totalHabits > 0 && (
          <>
            {completionRate >= 1 ? (
              <div
                className={`w-2 h-2 rounded-full ${isCurrentDay ? "bg-white" : "bg-[var(--color-aurora-mint)]"}`}
              />
            ) : completionRate > 0 ? (
              <div
                className={`w-2 h-2 rounded-full ${isCurrentDay ? "bg-white/60" : "bg-[var(--color-aurora-yellow)]"}`}
              />
            ) : isPast ? (
              <div
                className={`w-2 h-2 rounded-full ${isCurrentDay ? "bg-white/30" : "bg-[var(--color-aurora-salmon)]/50"}`}
              />
            ) : (
              <div className="w-2 h-2 rounded-full bg-[var(--muted)]/30" />
            )}
          </>
        )}
      </div>
    </button>
  );
});

// Habit item component
const HabitItemEnhanced = memo(function HabitItemEnhanced({
  habit,
  onToggle,
  isToggling,
  showWeekView = false,
  weekCompletions = new Set<string>(),
}: {
  habit: {
    _id: Id<"habits">;
    name: string;
    emoji: string;
    type: "build" | "break";
    currentStreak: number;
    longestStreak: number;
    todayCompleted: boolean;
    color?: string;
  };
  onToggle: (id: Id<"habits">) => void;
  isToggling: boolean;
  showWeekView?: boolean;
  weekCompletions?: Set<string>;
}) {
  const habitColor =
    habit.color ||
    (habit.type === "build"
      ? "var(--color-aurora-mint)"
      : "var(--color-aurora-salmon)");

  return (
    <motion.div
      layout
      className={`
        relative rounded-xl transition-all overflow-hidden
        ${
          habit.todayCompleted
            ? "bg-[var(--color-aurora-mint)]/10"
            : "bg-[var(--accent)]"
        }
      `}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: habitColor }}
      />

      <button
        onClick={() => onToggle(habit._id)}
        disabled={isToggling}
        className={`
          w-full flex items-center gap-3 p-3 pl-4 min-h-[60px] transition-opacity
          ${isToggling ? "opacity-50" : ""}
        `}
      >
        <span className="text-2xl flex-shrink-0">{habit.emoji}</span>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={`font-medium text-sm truncate ${
                habit.todayCompleted
                  ? "text-[var(--color-aurora-mint)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {habit.name}
            </p>
            <Badge
              className={`text-[10px] px-1.5 py-0 h-4 ${
                habit.type === "build"
                  ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0"
                  : "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)] border-0"
              }`}
            >
              {habit.type === "build" ? "BUILD" : "QUIT"}
            </Badge>
          </div>

          {/* Streak display */}
          <div className="flex items-center gap-3 mt-1">
            {habit.currentStreak > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-[var(--color-aurora-yellow)]" />
                <span className="text-xs font-medium text-[var(--color-aurora-yellow)]">
                  {habit.currentStreak}
                </span>
              </div>
            )}
            {habit.longestStreak > 0 &&
              habit.longestStreak > habit.currentStreak && (
                <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs">{habit.longestStreak}</span>
                </div>
              )}
          </div>
        </div>

        {/* Week view mini calendar */}
        {showWeekView && (
          <div className="hidden sm:flex gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
              const isCompleted = weekCompletions.has(date);
              const isToday = i === 6;
              return (
                <div
                  key={i}
                  className={`
                    w-3 h-3 rounded-sm transition-colors
                    ${
                      isCompleted
                        ? "bg-[var(--color-aurora-mint)]"
                        : isToday
                          ? "bg-[var(--color-aurora-lavender)]"
                          : "bg-[var(--muted)]/30"
                    }
                  `}
                />
              );
            })}
          </div>
        )}

        {/* Completion checkbox */}
        <div
          className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
          ${
            habit.todayCompleted
              ? "bg-[var(--color-aurora-mint)] text-white"
              : "bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50"
          }
        `}
        >
          {habit.todayCompleted ? (
            <Check className="w-5 h-5" />
          ) : (
            <div className="w-3 h-3 rounded-full border-2 border-[var(--muted-foreground)]/30" />
          )}
        </div>
      </button>
    </motion.div>
  );
});

// Analytics chart component
function AnalyticsSection({
  habitStats,
  todayStatus,
  weeklyData,
}: {
  habitStats:
    | {
        longestStreak?: number;
        activeStreaks?: number;
        totalCompletions?: number;
      }
    | null
    | undefined;
  todayStatus: {
    _id: string;
    name: string;
    emoji: string;
    currentStreak: number;
  }[];
  weeklyData: { date: string; rate: number }[];
}) {
  // Calculate top habits by streak
  const topHabits = useMemo(() => {
    if (!todayStatus) return [];
    return [...todayStatus]
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 3);
  }, [todayStatus]);

  const bestRate = useMemo(
    () => Math.max(...weeklyData.map((d) => d.rate), 0),
    [weeklyData],
  );
  const worstRate = useMemo(
    () =>
      Math.min(...weeklyData.filter((d) => d.rate > 0).map((d) => d.rate), 100),
    [weeklyData],
  );

  return (
    <div className="space-y-4">
      {/* Streaks leaderboard */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
            <Flame className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
            Streaks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topHabits.length > 0 ? (
            topHabits.map((habit, index) => (
              <div key={habit._id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-[var(--muted-foreground)] w-6">
                  {index + 1}
                </span>
                <span className="text-lg">{habit.emoji}</span>
                <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">
                  {habit.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                  <span className="font-bold text-[var(--foreground)]">
                    {habit.currentStreak}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              Complete habits to build streaks!
            </p>
          )}

          {/* Overall stats */}
          {habitStats && (
            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-purple)]/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {habitStats.longestStreak || 0}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Longest
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-mint)]/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {habitStats.activeStreaks || 0}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Current
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly completion rate chart */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
            <TrendingUp className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Weekly Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Simple bar chart */}
          <div className="h-32 flex items-end justify-between gap-1">
            {weeklyData.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full relative" style={{ height: "100px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${day.rate}%` }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={`
                      absolute bottom-0 w-full rounded-t-sm
                      ${
                        day.rate >= 100
                          ? "bg-[var(--color-aurora-mint)]"
                          : day.rate >= 70
                            ? "bg-[var(--color-aurora-yellow)]"
                            : day.rate > 0
                              ? "bg-[var(--color-aurora-salmon)]"
                              : "bg-[var(--muted)]/20"
                      }
                    `}
                  />
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {format(new Date(day.date), "EEE").charAt(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Rate stats */}
          <div className="flex justify-between mt-4 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-aurora-mint)]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[var(--color-aurora-mint)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {bestRate}%
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Best</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-aurora-salmon)]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[var(--color-aurora-salmon)] rotate-180" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {worstRate}%
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Worst</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Life dimensions radar display
function LifeDimensionsSection() {
  // Calculate dimension scores based on habit completions
  // Using stable placeholder scores - in production, these would come from backend
  const dimensionScores = useMemo(() => {
    const placeholderScores = [85, 72, 68, 90, 75, 60]; // Stable placeholder values
    return LIFE_DIMENSIONS.map((dim, index) => ({
      ...dim,
      score: placeholderScores[index] || 70,
    }));
  }, []);

  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
          <Zap className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
          Life Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dimensionScores.map((dim) => {
            const Icon = dim.icon;
            return (
              <div
                key={dim.id}
                className="relative p-3 rounded-xl bg-[var(--accent)] overflow-hidden"
              >
                {/* Progress background */}
                <div
                  className="absolute inset-0 opacity-20 transition-all"
                  style={{
                    background: `linear-gradient(to right, ${dim.color} ${dim.score}%, transparent ${dim.score}%)`,
                  }}
                />

                <div className="relative flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${dim.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: dim.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">
                      {dim.name}
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: dim.color }}
                    >
                      {dim.score}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[var(--muted-foreground)] text-center mt-3">
          Build habits in each dimension for a balanced life
        </p>
      </CardContent>
    </Card>
  );
}

// Main Habit Dashboard component
export function HabitDashboard({ userId }: HabitDashboardProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("✨");
  const [newHabitType, setNewHabitType] = useState<"build" | "break">("build");
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0].value);
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{
    streak: number;
    credits: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [selectedWeekDate] = useState(new Date());

  // Queries
  const todayStatus = useQuery(api.habits.getTodayStatus, { userId });
  const habitStats = useQuery(api.habits.getHabitStats, { userId });

  // Get week range for completions
  const weekStart = startOfWeek(selectedWeekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const completions = useQuery(api.habits.getCompletions, {
    userId,
    startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Build completion map
  const completionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    completions?.forEach((c) => {
      if (!map.has(c.date)) {
        map.set(c.date, new Set());
      }
      map.get(c.date)?.add(c.habitId);
    });
    return map;
  }, [completions]);

  // Calculate weekly data for chart
  const weeklyData = useMemo(() => {
    const data: { date: string; rate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayCompletions = completionMap.get(date)?.size || 0;
      const totalHabits = todayStatus?.length || 1;
      const rate = Math.round((dayCompletions / totalHabits) * 100);
      data.push({ date, rate: isNaN(rate) ? 0 : rate });
    }
    return data;
  }, [completionMap, todayStatus]);

  // Build per-habit week completions
  const habitWeekCompletions = useMemo(() => {
    const map = new Map<string, Set<string>>();
    completions?.forEach((c) => {
      if (!map.has(c.habitId)) {
        map.set(c.habitId, new Set());
      }
      map.get(c.habitId)?.add(c.date);
    });
    return map;
  }, [completions]);

  // Mutations
  const createHabit = useMutation(api.habits.createHabit);
  const toggleCompletion = useMutation(api.habits.toggleCompletion);

  const handleToggle = useCallback(
    async (habitId: Id<"habits">) => {
      setTogglingHabit(habitId);
      try {
        const result = await toggleCompletion({ habitId, userId });
        if (result.completed && result.milestone) {
          setCelebration({
            streak: result.milestone,
            credits: result.creditsEarned,
          });
          setTimeout(() => setCelebration(null), 3000);
        }
      } catch (error) {
        console.error("Failed to toggle habit:", error);
      } finally {
        setTogglingHabit(null);
      }
    },
    [toggleCompletion, userId],
  );

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;

    try {
      await createHabit({
        userId,
        name: newHabitName.trim(),
        emoji: newHabitEmoji,
        type: newHabitType,
        frequency: "daily",
        color: newHabitColor,
      });
      setShowCreateDialog(false);
      setNewHabitName("");
      setNewHabitEmoji("✨");
      setNewHabitType("build");
      setNewHabitColor(HABIT_COLORS[0].value);
    } catch (error) {
      console.error("Failed to create habit:", error);
    }
  };

  const handlePresetSelect = (preset: (typeof PRESET_HABITS)[0]) => {
    setNewHabitName(preset.name);
    setNewHabitEmoji(preset.emoji);
    setNewHabitType(preset.type);
  };

  const completedToday =
    todayStatus?.filter((h) => h.todayCompleted).length || 0;
  const totalHabits = todayStatus?.length || 0;
  const completionRate =
    totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <>
      <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
        {/* Header with fire icon */}
        <CardHeader className="pb-2 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-[var(--foreground)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-salmon)] flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              Aurora Habits
            </CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="h-9 bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Week Calendar View */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--accent)]/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--foreground)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                This Week
              </h3>
              {totalHabits > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-lg font-bold text-[var(--foreground)]">
                      {completedToday}/{totalHabits}
                    </span>
                  </div>
                  {/* Circular progress */}
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="var(--muted)"
                        strokeWidth="3"
                        opacity="0.2"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="var(--color-aurora-mint)"
                        strokeWidth="3"
                        strokeDasharray={`${completionRate} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {completionRate === 100 ? (
                        <span className="text-sm">😊</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--foreground)]">
                          {completionRate}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Week days */}
            <div className="flex justify-between">
              {weekDays.map((date) => (
                <WeekDay
                  key={date.toISOString()}
                  date={date}
                  habits={todayStatus || []}
                  completionMap={completionMap}
                  onDayClick={() => {}}
                />
              ))}
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 bg-transparent border-b border-[var(--border)] rounded-none h-11">
              <TabsTrigger
                value="today"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none"
              >
                <Target className="w-4 h-4 mr-1.5" />
                Today
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="dimensions"
                className="data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Life
              </TabsTrigger>
            </TabsList>

            {/* Today Tab */}
            <TabsContent value="today" className="p-4 m-0 space-y-2">
              <AnimatePresence mode="popLayout">
                {todayStatus && todayStatus.length > 0 ? (
                  todayStatus.map((habit) => (
                    <HabitItemEnhanced
                      key={habit._id}
                      habit={habit}
                      onToggle={handleToggle}
                      isToggling={togglingHabit === habit._id}
                      showWeekView
                      weekCompletions={
                        habitWeekCompletions.get(habit._id) || new Set()
                      }
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-aurora-pink)]/20 to-[var(--color-aurora-purple)]/20 flex items-center justify-center mx-auto mb-3">
                      <Target className="w-8 h-8 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-[var(--foreground)] font-medium mb-1">
                      No habits yet
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                      Start building positive habits today
                    </p>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Habit
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="p-4 m-0">
              <AnalyticsSection
                habitStats={habitStats}
                todayStatus={todayStatus || []}
                weeklyData={weeklyData}
              />
            </TabsContent>

            {/* Life Dimensions Tab */}
            <TabsContent value="dimensions" className="p-4 m-0">
              <LifeDimensionsSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Celebration overlay */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setCelebration(null)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-[var(--card)] rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl border border-[var(--border)]"
            >
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {celebration.streak} Day Streak!
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                You&apos;re on fire! Keep the momentum going!
              </p>
              <div className="flex items-center justify-center gap-2 text-[var(--color-aurora-yellow)]">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">
                  +{celebration.credits} credits earned
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Habit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Plus className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Create New Habit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Habit type selector */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Habit Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewHabitType("build")}
                  className={`
                    p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${
                      newHabitType === "build"
                        ? "bg-[var(--color-aurora-mint)] text-slate-900"
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-mint)]/20"
                    }
                  `}
                >
                  <Plus className="w-4 h-4" />
                  BUILD
                </button>
                <button
                  onClick={() => setNewHabitType("break")}
                  className={`
                    p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${
                      newHabitType === "break"
                        ? "bg-[var(--color-aurora-salmon)] text-white"
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-salmon)]/20"
                    }
                  `}
                >
                  <X className="w-4 h-4" />
                  QUIT
                </button>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Quick Start
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_HABITS.filter((p) => p.type === newHabitType)
                  .slice(0, 6)
                  .map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={`
                      px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5
                      ${
                        newHabitName === preset.name
                          ? "bg-[var(--color-aurora-purple)] text-white"
                          : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-lavender)]/30"
                      }
                    `}
                    >
                      <span>{preset.emoji}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom habit input */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Or create your own
              </Label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const emojis = [
                      "✨",
                      "💪",
                      "🌟",
                      "🎯",
                      "💜",
                      "🌸",
                      "🦋",
                      "🔥",
                      "💧",
                      "📚",
                    ];
                    const current = emojis.indexOf(newHabitEmoji);
                    setNewHabitEmoji(emojis[(current + 1) % emojis.length]);
                  }}
                  className="w-12 h-12 rounded-xl bg-[var(--accent)] text-2xl flex items-center justify-center hover:bg-[var(--color-aurora-lavender)]/30 transition-colors"
                >
                  {newHabitEmoji}
                </button>
                <Input
                  placeholder="Enter habit name..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="flex-1 h-12 bg-[var(--accent)] border-0"
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Pick Your Color
              </Label>
              <div className="flex gap-2">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewHabitColor(color.value)}
                    className={`
                      w-10 h-10 rounded-xl transition-all
                      ${newHabitColor === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--card)]" : ""}
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-[var(--border)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateHabit}
              disabled={!newHabitName.trim()}
              className="bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
            >
              Create Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
