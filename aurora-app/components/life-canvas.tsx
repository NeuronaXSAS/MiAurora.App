"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Heart,
  Sparkles,
  PenLine,
  Droplets,
  Moon,
  Zap,
  ChevronLeft,
  ChevronRight,
  Settings,
  TrendingUp,
  Flame,
  BookOpen,
} from "lucide-react";
import { LifeEntriesViewer } from "./life-entries-viewer";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, subYears, addYears } from "date-fns";

interface LifeCanvasProps {
  userId: Id<"users">;
}

const MOOD_EMOJIS = ["😢", "😐", "😊", "😄", "🤩"];
const DIMENSIONS = [
  { id: "career", emoji: "💼", label: "Career" },
  { id: "health", emoji: "💪", label: "Health" },
  { id: "relationships", emoji: "💕", label: "Relationships" },
  { id: "growth", emoji: "🌱", label: "Growth" },
  { id: "creativity", emoji: "🎨", label: "Creativity" },
  { id: "adventure", emoji: "✈️", label: "Adventure" },
  { id: "rest", emoji: "😴", label: "Rest" },
] as const;

// Intensity colors matching Aurora brand
const INTENSITY_COLORS = [
  "bg-[var(--color-aurora-lavender)]/20", // 0 - empty
  "bg-[var(--color-aurora-pink)]/30", // 1 - light
  "bg-[var(--color-aurora-pink)]/50", // 2 - medium
  "bg-[var(--color-aurora-pink)]/70", // 3 - good
  "bg-[var(--color-aurora-purple)]", // 4 - full
];

export function LifeCanvas({ userId }: LifeCanvasProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showEntriesViewer, setShowEntriesViewer] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form state for entry
  const [journalText, setJournalText] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [hydration, setHydration] = useState<number>(0);
  const [hasPeriod, setHasPeriod] = useState(false);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [gratitude, setGratitude] = useState<string[]>([""]);

  // Settings form
  const [birthYearInput, setBirthYearInput] = useState<number | null>(null);
  const [lifeExpectancyInput, setLifeExpectancyInput] = useState<number>(80);

  // Queries
  const lifeData = useQuery(api.lifeCanvas.getLifeCanvasData, { userId });
  const lifeStats = useQuery(api.lifeCanvas.getLifeStats, { userId });
  
  const yearStart = `${viewYear}-01-01`;
  const yearEnd = `${viewYear}-12-31`;
  const entries = useQuery(api.lifeCanvas.getLifeEntries, {
    userId,
    startDate: yearStart,
    endDate: yearEnd,
  });

  const selectedEntry = useQuery(
    api.lifeCanvas.getLifeEntry,
    selectedDate ? { userId, date: selectedDate } : "skip"
  );

  // Mutations
  const upsertEntry = useMutation(api.lifeCanvas.upsertLifeEntry);
  const updateSettings = useMutation(api.lifeCanvas.updateLifeSettings);

  // Initialize settings form when data loads
  useEffect(() => {
    if (lifeData) {
      setBirthYearInput(lifeData.birthYear || null);
      setLifeExpectancyInput(lifeData.lifeExpectancy || 80);
    }
  }, [lifeData]);

  // Load entry data when selected
  useEffect(() => {
    if (selectedEntry && showEntryDialog) {
      setJournalText(selectedEntry.journalText || "");
      setMood(selectedEntry.mood || null);
      setEnergy(selectedEntry.energy || null);
      setHydration(selectedEntry.hydrationGlasses || 0);
      setHasPeriod(selectedEntry.hasPeriod || false);
      setSelectedDimensions((selectedEntry.dimensions as string[]) || []);
      setGratitude(selectedEntry.gratitude || [""]);
    } else if (!showEntryDialog) {
      resetForm();
    }
  }, [selectedEntry, showEntryDialog]);

  const resetForm = () => {
    setJournalText("");
    setMood(null);
    setEnergy(null);
    setHydration(0);
    setHasPeriod(false);
    setSelectedDimensions([]);
    setGratitude([""]);
  };

  // Generate calendar grid
  const calendarData = useMemo(() => {
    const start = startOfYear(new Date(viewYear, 0, 1));
    const end = endOfYear(new Date(viewYear, 0, 1));
    const days = eachDayOfInterval({ start, end });
    
    // Create entry map for quick lookup
    const entryMap = new Map<string, number>();
    entries?.forEach((e) => {
      entryMap.set(e.date, e.intensityScore || 0);
    });

    // Group by week
    const weeks: { date: Date; intensity: number; dateStr: string }[][] = [];
    let currentWeek: { date: Date; intensity: number; dateStr: string }[] = [];
    
    // Add empty days at start to align with week
    const firstDayOfWeek = getDay(start);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), intensity: -1, dateStr: "" });
    }

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const intensity = entryMap.get(dateStr) ?? 0;
      currentWeek.push({ date: day, intensity, dateStr });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), intensity: -1, dateStr: "" });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [viewYear, entries]);

  const handleDayClick = (dateStr: string) => {
    if (!dateStr) return;
    const today = format(new Date(), "yyyy-MM-dd");
    if (dateStr > today) return; // Can't log future days
    
    setSelectedDate(dateStr);
    setShowEntryDialog(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedDate) return;

    try {
      await upsertEntry({
        userId,
        date: selectedDate,
        journalText: journalText || undefined,
        mood: mood || undefined,
        energy: energy || undefined,
        gratitude: gratitude.filter((g) => g.trim().length > 0),
        hydrationGlasses: hydration || undefined,
        hasPeriod: hasPeriod || undefined,
        dimensions: selectedDimensions.length > 0 
          ? selectedDimensions as ("career" | "health" | "relationships" | "growth" | "creativity" | "adventure" | "rest")[]
          : undefined,
      });
      setShowEntryDialog(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save entry:", error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        userId,
        birthYear: birthYearInput || undefined,
        lifeExpectancy: lifeExpectancyInput,
      });
      setShowSettingsDialog(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const toggleDimension = (dim: string) => {
    setSelectedDimensions((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    );
  };

  // Scroll to current month on mount
  useEffect(() => {
    if (scrollRef.current && viewYear === new Date().getFullYear()) {
      const currentWeek = Math.floor((new Date().getTime() - new Date(viewYear, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const scrollPosition = Math.max(0, (currentWeek - 10) * 14);
      scrollRef.current.scrollLeft = scrollPosition;
    }
  }, [viewYear, entries]);

  const today = format(new Date(), "yyyy-MM-dd");
  const currentYear = new Date().getFullYear();

  return (
    <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-[var(--foreground)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Life Canvas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Life Stats Summary */}
        {lifeStats && lifeStats.birthYear && (
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
              <span className="font-semibold text-[var(--foreground)]">{lifeStats.daysLived.toLocaleString()}</span>
              <span>days lived</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
              <span className="font-semibold text-[var(--foreground)]">{lifeStats.daysRemaining.toLocaleString()}</span>
              <span>days ahead</span>
            </div>
            {lifeStats.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <Flame className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                <span className="font-semibold text-[var(--foreground)]">{lifeStats.currentStreak}</span>
                <span>day streak</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {/* Year Navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewYear((y) => y - 1)}
            disabled={viewYear <= (lifeData?.birthYear || 1950)}
            className="h-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-[var(--foreground)]">{viewYear}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={viewYear >= currentYear}
            className="h-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* GitHub-style Contribution Grid */}
        <div 
          ref={scrollRef}
          className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
        >
          <div className="inline-flex flex-col gap-0.5 min-w-max">
            {/* Month labels */}
            <div className="flex gap-0.5 mb-1 ml-0">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
                <div 
                  key={month} 
                  className="text-[10px] text-[var(--muted-foreground)]"
                  style={{ width: `${(calendarData.length / 12) * 14}px`, minWidth: "28px" }}
                >
                  {month}
                </div>
              ))}
            </div>
            
            {/* Day labels */}
            <div className="flex">
              <div className="flex flex-col gap-0.5 mr-1 text-[10px] text-[var(--muted-foreground)]">
                <span className="h-3">M</span>
                <span className="h-3"></span>
                <span className="h-3">W</span>
                <span className="h-3"></span>
                <span className="h-3">F</span>
                <span className="h-3"></span>
                <span className="h-3">S</span>
              </div>
              
              {/* Grid */}
              <div className="flex gap-0.5">
                {calendarData.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-0.5">
                    {week.map((day, dayIdx) => {
                      const isToday = day.dateStr === today;
                      const isFuture = day.dateStr > today;
                      const isEmpty = day.intensity === -1;
                      
                      return (
                        <button
                          key={dayIdx}
                          onClick={() => handleDayClick(day.dateStr)}
                          disabled={isEmpty || isFuture}
                          className={`
                            w-3 h-3 rounded-sm transition-all
                            ${isEmpty ? "bg-transparent" : ""}
                            ${!isEmpty && !isFuture ? INTENSITY_COLORS[day.intensity] : ""}
                            ${isFuture && !isEmpty ? "bg-[var(--muted)]/30" : ""}
                            ${isToday ? "ring-2 ring-[var(--color-aurora-blue)] ring-offset-1" : ""}
                            ${!isEmpty && !isFuture ? "hover:ring-2 hover:ring-[var(--color-aurora-pink)] cursor-pointer" : ""}
                            disabled:cursor-default
                          `}
                          title={day.dateStr ? format(day.date, "MMM d, yyyy") : ""}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-3 text-xs text-[var(--muted-foreground)]">
          <span>Less</span>
          <div className="flex gap-1">
            {INTENSITY_COLORS.map((color, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => {
              setSelectedDate(today);
              setShowEntryDialog(true);
            }}
            className="flex-1 min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90"
          >
            <PenLine className="w-4 h-4 mr-2" />
            Log Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowEntriesViewer(true)}
            className="min-h-[48px] px-4 border-[var(--color-aurora-purple)]/30 hover:bg-[var(--color-aurora-purple)]/10"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      {/* Life Entries Viewer */}
      <LifeEntriesViewer
        userId={userId}
        open={showEntriesViewer}
        onOpenChange={setShowEntriesViewer}
      />

      {/* Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <PenLine className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              {selectedDate && format(new Date(selectedDate), "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Mood */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                How are you feeling?
              </Label>
              <div className="flex gap-2 justify-center">
                {MOOD_EMOJIS.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => setMood(i + 1)}
                    className={`
                      w-12 h-12 text-2xl rounded-xl transition-all
                      ${mood === i + 1 
                        ? "bg-[var(--color-aurora-pink)]/30 ring-2 ring-[var(--color-aurora-pink)] scale-110" 
                        : "bg-[var(--accent)] hover:bg-[var(--color-aurora-pink)]/10"
                      }
                    `}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Journal */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                What's on your mind? ✨
              </Label>
              <Textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Write about your day, thoughts, dreams..."
                className="min-h-[120px] bg-[var(--accent)] border-[var(--border)] text-[var(--foreground)] rounded-xl resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1 text-right">
                {journalText.length}/2000
              </p>
            </div>

            {/* Life Dimensions */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                What did you focus on today?
              </Label>
              <div className="flex flex-wrap gap-2">
                {DIMENSIONS.map((dim) => (
                  <button
                    key={dim.id}
                    onClick={() => toggleDimension(dim.id)}
                    className={`
                      px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5
                      ${selectedDimensions.includes(dim.id)
                        ? "bg-[var(--color-aurora-purple)] text-white"
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-lavender)]/30"
                      }
                    `}
                  >
                    <span>{dim.emoji}</span>
                    <span>{dim.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Health Tracking */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hydration */}
              <div>
                <Label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                  Water (glasses)
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHydration(Math.max(0, hydration - 1))}
                    className="h-10 w-10"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-semibold text-[var(--foreground)]">{hydration}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHydration(hydration + 1)}
                    className="h-10 w-10"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Period */}
              <div>
                <Label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                  Period today?
                </Label>
                <Button
                  variant={hasPeriod ? "default" : "outline"}
                  onClick={() => setHasPeriod(!hasPeriod)}
                  className={`h-10 ${hasPeriod ? "bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/90" : ""}`}
                >
                  {hasPeriod ? "Yes" : "No"}
                </Button>
              </div>
            </div>

            {/* Gratitude */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                3 things you're grateful for 💜
              </Label>
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    type="text"
                    value={gratitude[i] || ""}
                    onChange={(e) => {
                      const newGratitude = [...gratitude];
                      newGratitude[i] = e.target.value;
                      setGratitude(newGratitude);
                    }}
                    placeholder={`${i + 1}. I'm grateful for...`}
                    className="w-full h-10 px-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)] text-sm"
                    maxLength={100}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEntryDialog(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEntry}
              className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Settings className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Life Canvas Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Birth Year */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Year of Birth
              </Label>
              <Select
                value={birthYearInput?.toString() || ""}
                onValueChange={(v) => setBirthYearInput(parseInt(v))}
              >
                <SelectTrigger className="h-12 bg-[var(--accent)] border-[var(--border)] rounded-xl">
                  <SelectValue placeholder="Select your birth year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 80 }, (_, i) => currentYear - 13 - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                This helps visualize your life journey
              </p>
            </div>

            {/* Life Expectancy */}
            <div>
              <Label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                Life Expectancy (years)
              </Label>
              <Select
                value={lifeExpectancyInput.toString()}
                onValueChange={(v) => setLifeExpectancyInput(parseInt(v))}
              >
                <SelectTrigger className="h-12 bg-[var(--accent)] border-[var(--border)] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 51 }, (_, i) => 60 + i).map((years) => (
                    <SelectItem key={years} value={years.toString()}>
                      {years} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Default is 80 years. Adjust based on your goals and health.
              </p>
            </div>

            {birthYearInput && (
              <div className="p-4 bg-[var(--color-aurora-lavender)]/20 rounded-xl">
                <p className="text-sm text-[var(--foreground)]">
                  Based on your settings, you've lived approximately{" "}
                  <span className="font-bold text-[var(--color-aurora-pink)]">
                    {Math.floor((currentYear - birthYearInput) * 365.25).toLocaleString()}
                  </span>{" "}
                  days and have about{" "}
                  <span className="font-bold text-[var(--color-aurora-purple)]">
                    {Math.floor((birthYearInput + lifeExpectancyInput - currentYear) * 365.25).toLocaleString()}
                  </span>{" "}
                  days ahead. Make them count! 💜
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
