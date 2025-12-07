"use client";

import { useState, useMemo } from "react";
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
  Clock,
  Trash2,
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
  const [selectedEntryId, setSelectedEntryId] = useState<Id<"lifeEntries"> | null>(null);

  const monthStart = format(startOfMonth(viewMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(viewMonth), "yyyy-MM-dd");

  const entries = useQuery(api.lifeCanvas.getLifeEntries, {
    userId,
    startDate: monthStart,
    endDate: monthEnd,
  });

  const entryDetail = useQuery(
    api.lifeCanvas.getLifeEntryById,
    selectedEntryId ? { entryId: selectedEntryId } : "skip"
  );

  const deleteEntry = useMutation(api.lifeCanvas.deleteLifeEntry);

  // Group entries by date and sort
  const groupedEntries = useMemo(() => {
    if (!entries) return [];
    
    const groups = new Map<string, typeof entries>();
    entries.forEach((entry) => {
      const existing = groups.get(entry.date) || [];
      groups.set(entry.date, [...existing, entry]);
    });

    // Sort groups by date descending, entries within group by createdAt descending
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayEntries]) => ({
        date,
        entries: dayEntries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      }));
  }, [entries]);

  const handleDeleteEntry = async (entryId: Id<"lifeEntries">) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await deleteEntry({ entryId });
      setSelectedEntryId(null);
    }
  };

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
            {selectedEntryId && entryDetail ? (
              // Detail View
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEntryId(null)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to list
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEntry(selectedEntryId)}
                    className="text-[var(--color-aurora-salmon)] hover:text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <Card className="bg-[var(--accent)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
                      <Calendar className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      {format(new Date(entryDetail.date), "EEEE, MMMM d, yyyy")}
                    </CardTitle>
                    {entryDetail.createdAt && (
                      <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(entryDetail.createdAt), "h:mm a")}
                      </p>
                    )}
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
              // List View - Grouped by date
              <div className="space-y-4">
                {groupedEntries.length > 0 ? (
                  groupedEntries.map(({ date, entries: dayEntries }) => (
                    <div key={date}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {format(new Date(date), "EEEE, MMM d")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {dayEntries.length} {dayEntries.length === 1 ? "entry" : "entries"}
                        </Badge>
                      </div>
                      
                      {/* Entries for this date */}
                      <div className="space-y-2 ml-2 border-l-2 border-[var(--color-aurora-lavender)]/30 pl-3">
                        {dayEntries.map((entry) => (
                          <button
                            key={entry._id}
                            onClick={() => setSelectedEntryId(entry._id)}
                            className="w-full text-left p-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--color-aurora-lavender)]/20 transition-colors border border-[var(--border)]"
                          >
                            <div className="flex items-center justify-between mb-1">
                              {entry.createdAt && (
                                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(entry.createdAt), "h:mm a")}
                                </span>
                              )}
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
                              <div className="flex gap-1 mt-1">
                                {entry.dimensions.slice(0, 4).map((dim) => (
                                  <span key={dim} className="text-sm">
                                    {DIMENSION_EMOJIS[dim]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
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
