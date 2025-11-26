"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Pause, RotateCcw } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface MeditationSectionProps {
  userId: Id<"users">;
}

export function MeditationSection({ userId }: MeditationSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const stats = useQuery(api.health.getMeditationStats, { userId });
  const logMeditation = useMutation(api.health.logMeditation);

  const durations = [5, 10, 15];

  const startMeditation = () => {
    setTimeLeft(selectedDuration * 60);
    setIsActive(true);

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          completeMeditation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setIntervalId(id);
  };

  const pauseMeditation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsActive(false);
  };

  const resetMeditation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsActive(false);
    setTimeLeft(0);
  };

  const completeMeditation = async () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsActive(false);

    // Log meditation and award credits
    await logMeditation({
      userId,
      duration: selectedDuration,
      type: "breathing",
    });

    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const breathingPhase = Math.floor((timeLeft % 8) / 4); // 0 = inhale, 1 = exhale

  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
          <Sparkles className="w-5 h-5 text-[var(--color-aurora-lavender)]" />
          Meditation & Mindfulness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Breathing Circle */}
        {isActive && (
          <div className="relative w-48 h-48 mx-auto">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-aurora-lavender)]/40 to-[var(--color-aurora-pink)]/40 transition-all duration-[4000ms] ease-in-out ${
                breathingPhase === 0 ? "scale-100" : "scale-75"
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold text-[var(--foreground)] mb-2">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {breathingPhase === 0 ? "Breathe In..." : "Breathe Out..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Duration Selection */}
        {!isActive && timeLeft === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)] text-center">
              Choose your meditation duration
            </p>
            <div className="flex justify-center gap-3">
              {durations.map((duration) => (
                <button
                  key={duration}
                  onClick={() => setSelectedDuration(duration)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all min-h-[44px] ${
                    selectedDuration === duration
                      ? "bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] scale-110"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80"
                  }`}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!isActive && timeLeft === 0 && (
            <Button
              onClick={startMeditation}
              className="bg-[var(--color-aurora-lavender)] hover:bg-[var(--color-aurora-lavender)]/90 text-[var(--color-aurora-violet)] font-semibold px-8 min-h-[44px]"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          )}

          {isActive && (
            <>
              <Button
                onClick={pauseMeditation}
                variant="outline"
                className="border-[var(--border)] min-h-[44px]"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button
                onClick={resetMeditation}
                variant="outline"
                className="border-[var(--border)] min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          )}

          {!isActive && timeLeft > 0 && (
            <>
              <Button
                onClick={startMeditation}
                className="bg-[var(--color-aurora-lavender)] hover:bg-[var(--color-aurora-lavender)]/90 text-[var(--color-aurora-violet)] font-semibold min-h-[44px]"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button
                onClick={resetMeditation}
                variant="outline"
                className="border-[var(--border)] min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Stats */}
        {stats && stats.totalSessions > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border)]">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalSessions}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalMinutes}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--color-aurora-yellow)]">{stats.totalCredits}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Credits</p>
            </div>
          </div>
        )}

        {/* Mindfulness Quote */}
        <div className="bg-[var(--color-aurora-lavender)]/10 border border-[var(--color-aurora-lavender)]/20 rounded-xl p-4">
          <p className="text-sm text-[var(--foreground)] text-center italic">
            "Peace comes from within. Do not seek it without." - Buddha
          </p>
        </div>

        {/* Credit Reward Info */}
        <div className="text-center">
          <p className="text-xs text-[var(--muted-foreground)]">
            Complete a session to earn <span className="text-[var(--color-aurora-yellow)] font-semibold">5 credits</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
