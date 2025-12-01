"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Plus, Minus, Sparkles, TrendingUp, Bell, BellOff } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { format, subDays } from "date-fns";

interface HydrationTrackerProps {
  userId: Id<"users">;
}

export function HydrationTracker({ userId }: HydrationTrackerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Safe query with null coalescing for error handling
  const todayHydrationRaw = useQuery(
    api.health.getTodayHydration,
    userId ? { userId } : "skip"
  );
  const todayHydration = todayHydrationRaw ?? { glasses: 0, goal: 8, completed: false };
  
  // Get hydration history for the last 7 days
  const hydrationHistory = useQuery(
    api.health.getHydrationHistory,
    userId ? { userId, days: 7 } : "skip"
  ) ?? [];
  
  const logWater = useMutation(api.health.logWater);

  const glasses = todayHydration?.glasses || 0;
  const goal = todayHydration?.goal || 8;
  const completed = todayHydration?.completed || false;
  const percentage = Math.min((glasses / goal) * 100, 100);

  const handleAddGlass = async () => {
    const newGlasses = glasses + 1;
    await logWater({ userId, glasses: newGlasses });
    
    // Show celebration if goal reached
    if (newGlasses === goal) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handleRemoveGlass = async () => {
    if (glasses > 0) {
      await logWater({ userId, glasses: glasses - 1 });
    }
  };

  return (
    <Card className="bg-[var(--card)] border-[var(--border)] relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
          <Droplet className="w-5 h-5 text-[var(--color-aurora-pink)]" />
          Hydration Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Water Bottle SVG */}
        <div className="relative w-32 h-48 mx-auto mb-6">
          {/* Bottle Outline */}
          <svg
            viewBox="0 0 100 150"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bottle Body */}
            <path
              d="M 30 20 L 30 130 Q 30 140 40 140 L 60 140 Q 70 140 70 130 L 70 20 Z"
              fill="none"
              stroke="rgba(214, 244, 236, 0.3)"
              strokeWidth="2"
            />
            
            {/* Bottle Cap */}
            <rect
              x="35"
              y="10"
              width="30"
              height="10"
              rx="2"
              fill="rgba(214, 244, 236, 0.3)"
            />
            
            {/* Water Fill */}
            <defs>
              <clipPath id="bottle-clip">
                <path d="M 30 20 L 30 130 Q 30 140 40 140 L 60 140 Q 70 140 70 130 L 70 20 Z" />
              </clipPath>
            </defs>
            
            <rect
              x="30"
              y={20 + (110 * (1 - percentage / 100))}
              width="40"
              height={110 * (percentage / 100)}
              fill="#d6f4ec"
              opacity="0.8"
              clipPath="url(#bottle-clip)"
              className="transition-all duration-500 ease-out"
            />
            
            {/* Water Wave Effect */}
            {percentage > 0 && (
              <path
                d={`M 30 ${20 + (110 * (1 - percentage / 100))} Q 40 ${18 + (110 * (1 - percentage / 100))} 50 ${20 + (110 * (1 - percentage / 100))} T 70 ${20 + (110 * (1 - percentage / 100))}`}
                fill="none"
                stroke="#d6f4ec"
                strokeWidth="2"
                opacity="0.6"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[var(--foreground)] drop-shadow-lg">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Progress Info */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {glasses} / {goal} glasses
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {completed ? "🎉 Goal reached!" : `${goal - glasses} more to go`}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            📅 Resets daily at midnight
          </p>
        </div>

        {/* Hydration Tips */}
        {!completed && glasses < goal / 2 && (
          <div className="bg-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-pink)]/30 rounded-xl p-3 mb-4">
            <p className="text-sm text-[var(--foreground)]">
              💡 <span className="font-medium">Tip:</span> Try drinking a glass of water every 2 hours to stay hydrated throughout the day!
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleRemoveGlass}
            disabled={glasses === 0}
            variant="outline"
            size="icon"
            className="border-[var(--border)] min-w-[48px] min-h-[48px] rounded-full transition-all active:scale-95"
            aria-label="Remove one glass of water"
          >
            <Minus className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleAddGlass}
            className="bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-purple)] text-white font-semibold px-8 min-h-[48px] rounded-full transition-all active:scale-95 shadow-lg"
            aria-label="Add one glass of water"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Glass
          </Button>
        </div>

        {/* Toggle History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full mt-4 text-[var(--muted-foreground)]"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {showHistory ? "Hide History" : "Show 7-Day History"}
        </Button>

        {/* History Chart */}
        {showHistory && hydrationHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--foreground)] mb-3">Last 7 Days</p>
            <div className="flex items-end justify-between gap-1 h-20">
              {Array.from({ length: 7 }, (_, i) => {
                const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
                const dayData = hydrationHistory.find((h: any) => h.date === date);
                const dayGlasses = dayData?.glasses || 0;
                const dayGoal = dayData?.goal || 8;
                const heightPercent = Math.min((dayGlasses / dayGoal) * 100, 100);
                const dayLabel = format(subDays(new Date(), 6 - i), 'EEE');
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-16 bg-[var(--accent)] rounded-t relative overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--color-aurora-pink)] to-[var(--color-aurora-mint)] transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{dayLabel}</span>
                    <span className="text-xs font-medium text-[var(--foreground)]">{dayGlasses}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Weekly Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[var(--accent)] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-aurora-pink)]">
                  {hydrationHistory.reduce((sum: number, h: any) => sum + (h.glasses || 0), 0)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Total glasses</p>
              </div>
              <div className="bg-[var(--accent)] rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">
                  {hydrationHistory.filter((h: any) => h.completed).length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Goals reached</p>
              </div>
            </div>
          </div>
        )}

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-aurora-mint)]/20 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-[var(--color-aurora-mint)] mx-auto mb-2 animate-pulse" />
              <p className="text-2xl font-bold text-[var(--foreground)]">Goal Reached!</p>
              <p className="text-sm text-[var(--muted-foreground)]">Great job staying hydrated! 💧</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
