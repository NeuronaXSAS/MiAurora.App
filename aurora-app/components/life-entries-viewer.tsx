"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
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
} from "@/components/ui/dialog";
import {
  BookOpen,
  Calendar,
  Heart,
  Droplets,
  Moon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";

interface LifeEntriesViewerProps {
  userId: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOOD_EMOJIS = ["😢", "😐", "😊", "😄", "🤩"];
const DIMENSION_EMOJIS: Record<string, string> = {
  career: "💼",
  health: "💪",
  relationships: "💕",
  growth: "🌱",
  creativity: "🎨",
  adventure: "✈️",
  rest: "😴",
};

export function LifeEntriesViewer({ userId, open, onOpenChange }: LifeEntriesViewerProps) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const monthStart = format(startOfMonth(viewMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(viewMonth), "yyyy-MM-dd");

  const entries = useQuery(api.lifeCanvas.getLifeEntries, {
    userId,
    startDate: monthStart,
    endDate: monthEnd,
  });

  const entryDetail = useQuery(
    api.lifeCanvas.getLifeEntry,
    selectedEntry ? { userId, date: selectedEntry } : "skip"
  );

  const sortedEntries = entries?.sort((a, b) => b.date.localeCompare(a.date)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-[var(--card)] border-[var(--border)] p-0">
        <DialogHeader className="p-4 pb-2 border-b border-[var(--border)]">
          <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <BookOpen className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Your Life Journal
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="h-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-[var(--foreground)]">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              disabled={viewMonth >= new Date()}
              className="h-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Entries List or Detail View */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedEntry && entryDetail ? (
              // Detail View
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntry(null)}
                  className="mb-2"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to list
                </Button>

                <Card className="bg-[var(--accent)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
                      <Calendar className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      {format(new Date(entryDetail.date), "EEEE, MMMM d, yyyy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mood & Energy */}
                    {(entryDetail.mood || entryDetail.energy) && (
                      <div className="flex gap-4">
                        {entryDetail.mood && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--muted-foreground)]">Mood:</span>
                            <span className="text-2xl">{MOOD_EMOJIS[entryDetail.mood - 1]}</span>
                          </div>
                        )}
                        {entryDetail.energy && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--muted-foreground)]">Energy:</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Sparkles
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < entryDetail.energy!
                                      ? "text-[var(--color-aurora-yellow)]"
                                      : "text-[var(--muted-foreground)]/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Journal Text */}
                    {entryDetail.journalText && (
                      <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">Journal:</p>
                        <p className="text-[var(--foreground)] whitespace-pre-wrap">
                          {entryDetail.journalText}
                        </p>
                      </div>
                    )}

                    {/* Dimensions */}
                    {entryDetail.dimensions && entryDetail.dimensions.length > 0 && (
                      <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-2">Focus areas:</p>
                        <div className="flex flex-wrap gap-2">
                          {entryDetail.dimensions.map((dim) => (
                            <Badge
                              key={dim}
                              className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]"
                            >
                              {DIMENSION_EMOJIS[dim]} {dim}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Health Data */}
                    <div className="flex flex-wrap gap-4">
                      {entryDetail.hydrationGlasses !== undefined && entryDetail.hydrationGlasses > 0 && (
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                          <span className="text-sm text-[var(--foreground)]">
                            {entryDetail.hydrationGlasses} glasses
                          </span>
                        </div>
                      )}
                      {entryDetail.hasPeriod && (
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                          <span className="text-sm text-[var(--foreground)]">Period day</span>
                        </div>
                      )}
                      {entryDetail.sleepHours !== undefined && entryDetail.sleepHours > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--foreground)]">
                            😴 {entryDetail.sleepHours}h sleep
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Gratitude */}
                    {entryDetail.gratitude && entryDetail.gratitude.length > 0 && (
                      <div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-2">Grateful for:</p>
                        <ul className="space-y-1">
                          {entryDetail.gratitude.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[var(--foreground)]">
                              <Heart className="w-4 h-4 text-[var(--color-aurora-pink)] mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // List View
              <div className="space-y-3">
                {sortedEntries.length > 0 ? (
                  sortedEntries.map((entry) => (
                    <button
                      key={entry._id}
                      onClick={() => setSelectedEntry(entry.date)}
                      className="w-full text-left p-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--color-aurora-lavender)]/20 transition-colors border border-[var(--border)]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {format(new Date(entry.date), "EEEE, MMM d")}
                        </span>
                        <div className="flex items-center gap-2">
                          {entry.mood && (
                            <span className="text-lg">{MOOD_EMOJIS[entry.mood - 1]}</span>
                          )}
                          {entry.intensityScore !== undefined && entry.intensityScore > 0 && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: entry.intensityScore }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full bg-[var(--color-aurora-pink)]"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {entry.journalText && (
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                          {entry.journalText}
                        </p>
                      )}
                      {entry.dimensions && entry.dimensions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entry.dimensions.slice(0, 4).map((dim) => (
                            <span key={dim} className="text-sm">
                              {DIMENSION_EMOJIS[dim]}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-50" />
                    <p className="text-[var(--foreground)] font-medium mb-1">No entries this month</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Start journaling to see your entries here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
