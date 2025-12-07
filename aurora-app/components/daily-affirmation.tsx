"use client";

import { memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface DailyAffirmationProps {
  userId: Id<"users">;
}

// Fallback affirmations for when DB is empty (no network needed)
const FALLBACK_AFFIRMATIONS = [
  "You are capable of amazing things. Today is full of possibilities.",
  "Your strength is greater than any challenge you face.",
  "You deserve all the good things coming your way.",
  "Every step forward is progress, no matter how small.",
  "You are worthy of love, success, and happiness.",
  "Your voice matters. Your story matters. You matter.",
  "Today you choose to be kind to yourself.",
  "You have the power to create positive change.",
];

export const DailyAffirmation = memo(function DailyAffirmation({ userId }: DailyAffirmationProps) {
  const affirmation = useQuery(api.habits.getDailyAffirmation, { userId });

  // Use fallback while loading or if no affirmation
  const displayText = affirmation?.text || 
    FALLBACK_AFFIRMATIONS[new Date().getDate() % FALLBACK_AFFIRMATIONS.length];

  return (
    <Card className="bg-gradient-to-r from-[var(--color-aurora-pink)]/10 to-[var(--color-aurora-purple)]/10 border-[var(--color-aurora-pink)]/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--color-aurora-purple)] font-medium mb-1">
              Today's Affirmation
            </p>
            <p className="text-sm text-[var(--foreground)] italic leading-relaxed">
              "{displayText}"
            </p>
            {affirmation?.author && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                — {affirmation.author}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
