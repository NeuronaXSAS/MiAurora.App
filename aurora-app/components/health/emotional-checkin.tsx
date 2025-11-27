"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Smile } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface EmotionalCheckinProps {
  userId: Id<"users">;
}

const moodEmojis = [
  { value: 1, emoji: "😢", label: "Struggling", color: "text-red-400" },
  { value: 2, emoji: "😐", label: "Okay", color: "text-yellow-400" },
  { value: 3, emoji: "😊", label: "Good", color: "text-green-400" },
  { value: 4, emoji: "😄", label: "Great", color: "text-blue-400" },
  { value: 5, emoji: "🤩", label: "Amazing", color: "text-purple-400" },
];

export function EmotionalCheckin({ userId }: EmotionalCheckinProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Safe queries with null coalescing for error handling
  const todayMood = useQuery(api.health.getTodayMood, { userId }) ?? null;
  const moodHistory = useQuery(api.health.getMoodHistory, { userId, days: 7 }) ?? [];
  const logMood = useMutation(api.health.logMood);

  // Load today's mood if it exists
  useEffect(() => {
    if (todayMood) {
      setSelectedMood(todayMood.mood);
      setJournal(todayMood.journal || "");
    }
  }, [todayMood]);

  const handleSave = async () => {
    if (selectedMood === null) return;

    setIsSaving(true);
    try {
      await logMood({
        userId,
        mood: selectedMood,
        journal: journal || undefined,
      });
    } catch (error) {
      console.error("Error saving mood:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate mood insights
  const getMoodInsight = () => {
    if (!moodHistory || moodHistory.length === 0) {
      return "Start tracking your mood to see insights!";
    }

    const avgMood = moodHistory.reduce((sum, log) => sum + log.mood, 0) / moodHistory.length;
    
    if (avgMood >= 4) return "You've been feeling great this week! ✨";
    if (avgMood >= 3) return "Your mood has been positive lately! 😊";
    if (avgMood >= 2) return "Things have been okay. Remember to take care of yourself! 💝";
    return "It's been a tough week. You're not alone, and it's okay to ask for help. 🤗";
  };

  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
          <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
          Emotional Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mood Selector */}
        <div>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">How are you feeling today?</p>
          <div className="flex justify-between gap-2">
            {moodEmojis.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all min-w-[56px] min-h-[72px] ${
                  selectedMood === mood.value
                    ? "bg-[var(--color-aurora-pink)]/30 border-2 border-[var(--color-aurora-pink)] scale-110"
                    : "bg-[var(--accent)] border border-[var(--border)] hover:bg-[var(--accent)]/80"
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1">{mood.emoji}</span>
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Journal Entry */}
        {selectedMood !== null && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top duration-300">
            <label className="text-sm text-[var(--muted-foreground)]">
              Want to share more? (Optional)
            </label>
            <Textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="What's on your mind today?"
              maxLength={500}
              rows={3}
              className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
            <p className="text-xs text-[var(--muted-foreground)] text-right">
              {journal.length}/500
            </p>
          </div>
        )}

        {/* Save Button */}
        {selectedMood !== null && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/90 text-white font-semibold min-h-[44px]"
          >
            {isSaving ? "Saving..." : todayMood ? "Update Check-in" : "Save Check-in"}
          </Button>
        )}

        {/* Mood History Chart */}
        {moodHistory && moodHistory.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--foreground)] mb-3">Last 7 Days</p>
            <div className="flex items-end justify-between gap-2 h-24">
              {moodHistory.slice(0, 7).reverse().map((log, idx) => {
                const moodData = moodEmojis.find(m => m.value === log.mood);
                const height = (log.mood / 5) * 100;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-[var(--color-aurora-pink)]/60 to-[var(--color-aurora-pink)]/30 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs">{moodData?.emoji}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Weekly Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-[var(--accent)] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[var(--color-aurora-pink)]">
                  {moodHistory.length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Check-ins</p>
              </div>
              <div className="bg-[var(--accent)] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[var(--color-aurora-purple)]">
                  {(moodHistory.reduce((sum, log) => sum + log.mood, 0) / moodHistory.length).toFixed(1)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Avg Mood</p>
              </div>
              <div className="bg-[var(--accent)] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[var(--color-aurora-mint)]">
                  {moodHistory.filter(log => log.mood >= 4).length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Great Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Mood Insight */}
        <div className="bg-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-pink)]/20 rounded-xl p-3">
          <p className="text-sm text-[var(--foreground)] text-center">
            {getMoodInsight()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
