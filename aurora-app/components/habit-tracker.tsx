"use client";

import { useState, useCallback, memo } from "react";
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
import {
  Target,
  Plus,
  Flame,
  Check,
  Trophy,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HabitTrackerProps {
  userId: Id<"users">;
  compact?: boolean;
}

// Preset habits for quick setup
const PRESET_HABITS = [
  { name: "Drink 8 glasses of water", emoji: "💧", type: "build" as const },
  { name: "Exercise 30 minutes", emoji: "🏃‍♀️", type: "build" as const },
  { name: "Read for 20 minutes", emoji: "📚", type: "build" as const },
  { name: "Meditate", emoji: "🧘‍♀️", type: "build" as const },
  { name: "No social media before noon", emoji: "📵", type: "break" as const },
  { name: "No smoking", emoji: "🚭", type: "break" as const },
  { name: "No alcohol", emoji: "🍷", type: "break" as const },
  { name: "Sleep before midnight", emoji: "😴", type: "build" as const },
  { name: "Practice gratitude", emoji: "🙏", type: "build" as const },
  { name: "Take vitamins", emoji: "💊", type: "build" as const },
  { name: "Skincare routine", emoji: "✨", type: "build" as const },
  { name: "Journal", emoji: "📝", type: "build" as const },
];

// Memoized habit item for performance
const HabitItem = memo(function HabitItem({
  habit,
  onToggle,
  isToggling,
}: {
  habit: {
    _id: Id<"habits">;
    name: string;
    emoji: string;
    type: "build" | "break";
    currentStreak: number;
    todayCompleted: boolean;
  };
  onToggle: (id: Id<"habits">) => void;
  isToggling: boolean;
}) {
  return (
    <motion.button
      layout
      onClick={() => onToggle(habit._id)}
      disabled={isToggling}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl transition-all min-h-[56px]
        ${habit.todayCompleted
          ? "bg-[var(--color-aurora-mint)]/20 border-2 border-[var(--color-aurora-mint)]"
          : "bg-[var(--accent)] border-2 border-transparent hover:border-[var(--color-aurora-pink)]/30"
        }
        ${isToggling ? "opacity-50" : ""}
      `}
    >
      <span className="text-2xl flex-shrink-0">{habit.emoji}</span>
      <div className="flex-1 text-left min-w-0">
        <p className={`font-medium text-sm truncate ${
          habit.todayCompleted ? "text-[var(--color-aurora-mint)]" : "text-[var(--foreground)]"
        }`}>
          {habit.name}
        </p>
        {habit.currentStreak > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="w-3 h-3 text-[var(--color-aurora-yellow)]" />
            <span className="text-xs text-[var(--muted-foreground)]">
              {habit.currentStreak} day{habit.currentStreak !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
        ${habit.todayCompleted
          ? "bg-[var(--color-aurora-mint)] text-white"
          : "bg-[var(--muted)]/50"
        }
      `}>
        {habit.todayCompleted ? (
          <Check className="w-5 h-5" />
        ) : (
          <div className="w-3 h-3 rounded-full border-2 border-[var(--muted-foreground)]/30" />
        )}
      </div>
    </motion.button>
  );
});

export function HabitTracker({ userId, compact = false }: HabitTrackerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("✨");
  const [newHabitType, setNewHabitType] = useState<"build" | "break">("build");
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ streak: number; credits: number } | null>(null);

  // Queries
  const todayStatus = useQuery(api.habits.getTodayStatus, { userId });
  const habitStats = useQuery(api.habits.getHabitStats, { userId });

  // Mutations
  const createHabit = useMutation(api.habits.createHabit);
  const toggleCompletion = useMutation(api.habits.toggleCompletion);

  const handleToggle = useCallback(async (habitId: Id<"habits">) => {
    setTogglingHabit(habitId);
    try {
      const result = await toggleCompletion({ habitId, userId });
      if (result.completed && result.milestone) {
        setCelebration({ streak: result.milestone, credits: result.creditsEarned });
        setTimeout(() => setCelebration(null), 3000);
      }
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    } finally {
      setTogglingHabit(null);
    }
  }, [toggleCompletion, userId]);

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;
    
    try {
      await createHabit({
        userId,
        name: newHabitName.trim(),
        emoji: newHabitEmoji,
        type: newHabitType,
        frequency: "daily",
      });
      setShowCreateDialog(false);
      setNewHabitName("");
      setNewHabitEmoji("✨");
    } catch (error) {
      console.error("Failed to create habit:", error);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_HABITS[0]) => {
    setNewHabitName(preset.name);
    setNewHabitEmoji(preset.emoji);
    setNewHabitType(preset.type);
  };

  const completedToday = todayStatus?.filter((h) => h.todayCompleted).length || 0;
  const totalHabits = todayStatus?.length || 0;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Compact view for dashboard
  if (compact) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between text-[var(--foreground)]">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Habits
            </div>
            {totalHabits > 0 && (
              <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                {completedToday}/{totalHabits}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayStatus && todayStatus.length > 0 ? (
            <>
              {todayStatus.slice(0, 3).map((habit) => (
                <HabitItem
                  key={habit._id}
                  habit={habit}
                  onToggle={handleToggle}
                  isToggling={togglingHabit === habit._id}
                />
              ))}
              {todayStatus.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-[var(--muted-foreground)]"
                  onClick={() => {/* Navigate to full view */}}
                >
                  +{todayStatus.length - 3} more habits
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="w-full min-h-[48px] border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first habit
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <>
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-[var(--foreground)]">
              <Target className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Daily Habits
            </CardTitle>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
              className="h-9 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Progress bar */}
          {totalHabits > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[var(--muted-foreground)]">Today's progress</span>
                <span className="font-medium text-[var(--foreground)]">{completionRate}%</span>
              </div>
              <div className="h-2 bg-[var(--muted)]/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Stats row */}
          {habitStats && habitStats.longestStreak > 0 && (
            <div className="flex gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                <span className="text-[var(--muted-foreground)]">Best:</span>
                <span className="font-semibold text-[var(--foreground)]">{habitStats.longestStreak} days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                <span className="text-[var(--muted-foreground)]">Total:</span>
                <span className="font-semibold text-[var(--foreground)]">{habitStats.totalCompletions}</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          <AnimatePresence mode="popLayout">
            {todayStatus && todayStatus.length > 0 ? (
              todayStatus.map((habit) => (
                <HabitItem
                  key={habit._id}
                  habit={habit}
                  onToggle={handleToggle}
                  isToggling={togglingHabit === habit._id}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Target className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-50" />
                <p className="text-[var(--foreground)] font-medium mb-1">No habits yet</p>
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
              className="bg-[var(--card)] rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                {celebration.streak} Day Streak!
              </h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                Amazing consistency! Keep going!
              </p>
              <div className="flex items-center justify-center gap-2 text-[var(--color-aurora-yellow)]">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">+{celebration.credits} credits earned</span>
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
            {/* Quick presets */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Quick Start
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_HABITS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`
                      px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5
                      ${newHabitName === preset.name
                        ? "bg-[var(--color-aurora-purple)] text-white"
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-lavender)]/30"
                      }
                    `}
                  >
                    <span>{preset.emoji}</span>
                    <span className="hidden sm:inline">{preset.name.split(" ").slice(0, 2).join(" ")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom habit */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Or create your own
              </Label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const emojis = ["✨", "💪", "🌟", "🎯", "💜", "🌸", "🦋", "🔥"];
                    const current = emojis.indexOf(newHabitEmoji);
                    setNewHabitEmoji(emojis[(current + 1) % emojis.length]);
                  }}
                  className="w-12 h-12 rounded-xl bg-[var(--accent)] text-2xl flex items-center justify-center hover:bg-[var(--color-aurora-lavender)]/30 transition-colors"
                >
                  {newHabitEmoji}
                </button>
                <Input
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Walk 10,000 steps"
                  className="flex-1 h-12 bg-[var(--accent)] border-[var(--border)] rounded-xl"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Habit type */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                What kind of habit?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewHabitType("build")}
                  className={`
                    p-3 rounded-xl text-sm transition-all text-left
                    ${newHabitType === "build"
                      ? "bg-[var(--color-aurora-mint)]/20 border-2 border-[var(--color-aurora-mint)]"
                      : "bg-[var(--accent)] border-2 border-transparent"
                    }
                  `}
                >
                  <span className="text-lg">🌱</span>
                  <p className="font-medium text-[var(--foreground)] mt-1">Build</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Start doing something positive</p>
                </button>
                <button
                  onClick={() => setNewHabitType("break")}
                  className={`
                    p-3 rounded-xl text-sm transition-all text-left
                    ${newHabitType === "break"
                      ? "bg-[var(--color-aurora-pink)]/20 border-2 border-[var(--color-aurora-pink)]"
                      : "bg-[var(--accent)] border-2 border-transparent"
                    }
                  `}
                >
                  <span className="text-lg">🚫</span>
                  <p className="font-medium text-[var(--foreground)] mt-1">Break</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Stop a negative habit</p>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateHabit}
              disabled={!newHabitName.trim()}
              className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
