"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Droplets, 
  Heart, 
  Moon, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

interface CycleTrackerProps {
  userId: Id<"users">;
}

const SYMPTOMS = [
  { id: "cramps", label: "Cramps", emoji: "😣" },
  { id: "headache", label: "Headache", emoji: "🤕" },
  { id: "bloating", label: "Bloating", emoji: "🎈" },
  { id: "fatigue", label: "Fatigue", emoji: "😴" },
  { id: "mood_swings", label: "Mood Swings", emoji: "🎭" },
  { id: "breast_tenderness", label: "Breast Tenderness", emoji: "💔" },
  { id: "acne", label: "Acne", emoji: "😤" },
  { id: "cravings", label: "Cravings", emoji: "🍫" },
  { id: "backache", label: "Backache", emoji: "🔙" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
];

const FLOW_OPTIONS = [
  { id: "spotting", label: "Spotting", color: "bg-pink-200" },
  { id: "light", label: "Light", color: "bg-pink-300" },
  { id: "medium", label: "Medium", color: "bg-pink-400" },
  { id: "heavy", label: "Heavy", color: "bg-pink-500" },
];

export function CycleTracker({ userId }: CycleTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Safe queries with null coalescing for error handling
  const cycleHistoryRaw = useQuery(api.cycleTracker.getCycleHistory, { userId });
  const cycleHistory = cycleHistoryRaw ?? [];
  const predictionsRaw = useQuery(api.cycleTracker.getCyclePredictions, { userId });
  const predictions = predictionsRaw ?? {
    hasEnoughData: false,
    averageCycleLength: 28,
    nextPeriodDate: null,
    fertileWindowStart: null,
    fertileWindowEnd: null,
    ovulationDate: null,
  };
  const logPeriod = useMutation(api.cycleTracker.logPeriod);
  const logSymptoms = useMutation(api.cycleTracker.logSymptoms);

  const handleLogPeriod = async () => {
    if (!selectedFlow) return;
    
    await logPeriod({
      userId,
      date: selectedDate,
      flow: selectedFlow as "light" | "medium" | "heavy" | "spotting",
      symptoms: selectedSymptoms,
      notes: notes || undefined,
    });

    // Reset form
    setSelectedFlow(null);
    setSelectedSymptoms([]);
    setNotes("");
  };

  const handleLogSymptoms = async () => {
    await logSymptoms({
      userId,
      date: selectedDate,
      symptoms: selectedSymptoms,
      mood,
      energy,
      notes: notes || undefined,
    });

    setSelectedSymptoms([]);
    setNotes("");
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty days for alignment
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const log = cycleHistory?.find(l => l.date === dateStr);
    
    if (log?.type === "period") return "period";
    if (log?.symptoms?.length) return "symptom";
    
    // Check predictions
    if (predictions?.hasEnoughData) {
      if (dateStr === predictions.nextPeriodDate) return "predicted_period";
      if (dateStr >= predictions.fertileWindowStart! && dateStr <= predictions.fertileWindowEnd!) {
        return "fertile";
      }
      if (dateStr === predictions.ovulationDate) return "ovulation";
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cycle Overview Card */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Moon className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Your Cycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions?.hasEnoughData ? (
            <div className="space-y-4">
              {/* Cycle Day Progress */}
              <div className="relative p-4 bg-gradient-to-r from-[var(--color-aurora-pink)]/20 to-[var(--color-aurora-purple)]/20 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-4xl font-bold text-[var(--color-aurora-pink)]">
                      Day {predictions.cycleDay || 1}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">of {predictions.averageCycleLength} day cycle</p>
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-[var(--muted-foreground)] text-xs">
                    {cycleHistory.filter(l => l.type === "period").length} days logged
                  </Badge>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] rounded-full transition-all"
                    style={{ width: `${Math.min(((predictions.cycleDay || 1) / predictions.averageCycleLength) * 100, 100)}%` }}
                  />
                </div>
                {/* Phase indicator */}
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  {(predictions.cycleDay || 1) <= 5 ? "🩸 Menstrual Phase" : 
                   (predictions.cycleDay || 1) <= 13 ? "🌱 Follicular Phase" :
                   (predictions.cycleDay || 1) <= 16 ? "✨ Ovulation Phase" : "🌙 Luteal Phase"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {predictions.nextPeriodDate && (
                  <div className="p-3 bg-[var(--color-aurora-pink)]/10 rounded-xl border border-[var(--color-aurora-pink)]/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                      <span className="font-medium text-sm text-[var(--foreground)]">Next Period</span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]">
                      {new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      in {Math.max(0, Math.ceil((new Date(predictions.nextPeriodDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </p>
                  </div>
                )}
                
                {predictions.ovulationDate && (
                  <div className="p-3 bg-[var(--color-aurora-mint)]/10 rounded-xl border border-[var(--color-aurora-mint)]/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      <span className="font-medium text-sm text-[var(--foreground)]">Ovulation</span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]">
                      {new Date(predictions.ovulationDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {(() => {
                        const days = Math.ceil((new Date(predictions.ovulationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return days > 0 ? `in ${days} days` : days === 0 ? "today" : `${Math.abs(days)} days ago`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
              
              {predictions.fertileWindowStart && (
                <div className="p-3 bg-[var(--color-aurora-lavender)]/10 rounded-xl border border-[var(--color-aurora-lavender)]/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    <span className="font-medium text-sm text-[var(--foreground)]">Fertile Window</span>
                  </div>
                  <p className="text-sm text-[var(--foreground)]">
                    {new Date(predictions.fertileWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(predictions.fertileWindowEnd!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Moon className="w-12 h-12 mx-auto mb-3 text-[var(--color-aurora-pink)]" />
              <p className="text-[var(--foreground)] mb-2">Start logging your period</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Log at least 2 cycles to see predictions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Calendar className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                className="border-[var(--border)] min-w-[44px] min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                className="border-[var(--border)] min-w-[44px] min-h-[44px]"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-[var(--muted-foreground)] py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              
              const dateStr = date.toISOString().split('T')[0];
              const status = getDateStatus(date);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <motion.button
                  key={dateStr}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    aspect-square rounded-full flex items-center justify-center text-sm
                    transition-all relative
                    ${isSelected ? 'ring-2 ring-[var(--color-aurora-pink)] ring-offset-2' : ''}
                    ${isToday ? 'font-bold' : ''}
                    ${status === 'period' ? 'bg-[var(--color-aurora-pink)] text-white' : ''}
                    ${status === 'symptom' ? 'bg-[var(--color-aurora-lavender)]' : ''}
                    ${status === 'predicted_period' ? 'bg-[var(--color-aurora-pink)]/30 border-2 border-dashed border-[var(--color-aurora-pink)]' : ''}
                    ${status === 'fertile' ? 'bg-[var(--color-aurora-mint)]/30' : ''}
                    ${status === 'ovulation' ? 'bg-[var(--color-aurora-mint)]' : ''}
                    ${!status ? 'hover:bg-[var(--accent)]' : ''}
                  `}
                >
                  {date.getDate()}
                  {status === 'ovulation' && (
                    <span className="absolute -top-1 -right-1 text-xs">✨</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-[var(--foreground)]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-pink)]" />
              <span>Period</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-pink)]/30 border-2 border-dashed border-[var(--color-aurora-pink)]" />
              <span>Predicted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-mint)]/30" />
              <span>Fertile</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-mint)]" />
              <span>Ovulation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cycle Statistics */}
      {cycleHistory.length > 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Cycle Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[var(--color-aurora-pink)]/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-aurora-pink)]">
                  {cycleHistory.filter(l => l.type === "period").length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Period Days Logged</p>
              </div>
              <div className="bg-[var(--color-aurora-purple)]/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-aurora-purple)]">
                  {predictions?.averageCycleLength || 28}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Avg Cycle Length</p>
              </div>
              <div className="bg-[var(--color-aurora-lavender)]/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-aurora-violet)]">
                  {cycleHistory.filter(l => l.symptoms && l.symptoms.length > 0).length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Symptom Logs</p>
              </div>
              <div className="bg-[var(--color-aurora-mint)]/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">
                  {predictions?.hasEnoughData ? "✓" : "..."}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Predictions Ready</p>
              </div>
            </div>
            
            {/* Most Common Symptoms */}
            {cycleHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">Most Common Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const symptomCounts: Record<string, number> = {};
                    cycleHistory.forEach(log => {
                      log.symptoms?.forEach((s: string) => {
                        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
                      });
                    });
                    const topSymptoms = Object.entries(symptomCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);
                    
                    return topSymptoms.map(([symptomId, count]) => {
                      const symptom = SYMPTOMS.find(s => s.id === symptomId);
                      return symptom ? (
                        <Badge key={symptomId} variant="secondary" className="bg-[var(--accent)]">
                          {symptom.emoji} {symptom.label} ({count})
                        </Badge>
                      ) : null;
                    });
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Log Entry */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-[var(--foreground)]">
            Log for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flow Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block text-[var(--foreground)]">Period Flow</label>
            <div className="flex flex-wrap gap-2">
              {FLOW_OPTIONS.map(flow => (
                <Button
                  key={flow.id}
                  variant={selectedFlow === flow.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFlow(selectedFlow === flow.id ? null : flow.id)}
                  className={`min-h-[44px] ${selectedFlow === flow.id ? "bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/90" : "border-[var(--border)]"}`}
                >
                  <Droplets className="w-4 h-4 mr-1 text-[var(--color-aurora-pink)]" />
                  {flow.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="text-sm font-medium mb-3 block text-[var(--foreground)]">Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(symptom => (
                <Badge
                  key={symptom.id}
                  variant={selectedSymptoms.includes(symptom.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-all min-h-[36px] px-3 ${
                    selectedSymptoms.includes(symptom.id) 
                      ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white" 
                      : "hover:bg-[var(--accent)] border-[var(--border)]"
                  }`}
                  onClick={() => toggleSymptom(symptom.id)}
                >
                  {symptom.emoji} {symptom.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Mood & Energy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">Mood</label>
              <div className="flex gap-1 justify-start overflow-x-auto pb-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setMood(level)}
                    className={`text-xl sm:text-2xl transition-all min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex-shrink-0 rounded-lg ${
                      mood === level 
                        ? 'scale-110 bg-[var(--color-aurora-pink)]/20 ring-2 ring-[var(--color-aurora-pink)]' 
                        : mood > level 
                        ? 'opacity-50' 
                        : 'opacity-30 hover:opacity-60'
                    }`}
                  >
                    {level === 1 ? '😢' : level === 2 ? '😐' : level === 3 ? '🙂' : level === 4 ? '😊' : '🤩'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {mood === 1 ? 'Very Low' : mood === 2 ? 'Low' : mood === 3 ? 'Neutral' : mood === 4 ? 'Good' : 'Great'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">Energy</label>
              <div className="flex gap-1 justify-start overflow-x-auto pb-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`text-xl sm:text-2xl transition-all min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex-shrink-0 rounded-lg ${
                      energy === level 
                        ? 'scale-110 bg-[var(--color-aurora-mint)]/20 ring-2 ring-[var(--color-aurora-mint)]' 
                        : energy > level 
                        ? 'opacity-50' 
                        : 'opacity-30 hover:opacity-60'
                    }`}
                  >
                    {level === 1 ? '😴' : level === 2 ? '🥱' : level === 3 ? '🙂' : level === 4 ? '⚡' : '🚀'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {energy === 1 ? 'Exhausted' : energy === 2 ? 'Tired' : energy === 3 ? 'Normal' : energy === 4 ? 'Energized' : 'Super Charged'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">Notes</label>
            <Textarea
              placeholder="How are you feeling today?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="bg-[var(--background)] border-[var(--border)]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {selectedFlow && (
              <Button 
                onClick={handleLogPeriod}
                className="flex-1 bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/90 min-h-[44px]"
              >
                <Droplets className="w-4 h-4 mr-2" />
                Log Period Day
              </Button>
            )}
            <Button 
              onClick={handleLogSymptoms}
              variant={selectedFlow ? "outline" : "default"}
              className={`flex-1 min-h-[44px] ${!selectedFlow ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]" : "border-[var(--border)]"}`}
              disabled={selectedSymptoms.length === 0 && !notes}
            >
              <Heart className="w-4 h-4 mr-2" />
              Log Symptoms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
