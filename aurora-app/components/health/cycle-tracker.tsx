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
  Sun, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Safe query with error handling
  const cycleHistory = useQuery(api.cycleTracker.getCycleHistory, { userId }) ?? [];
  const predictions = useQuery(api.cycleTracker.getCyclePredictions, { userId }) ?? {
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
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-700">
            <Moon className="w-5 h-5" />
            Your Cycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions?.hasEnoughData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/50 rounded-xl">
                <p className="text-3xl font-bold text-pink-600">
                  Day {predictions.cycleDay}
                </p>
                <p className="text-sm text-gray-600">of your cycle</p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">
                  {predictions.averageCycleLength}
                </p>
                <p className="text-sm text-gray-600">day avg cycle</p>
              </div>
              
              {predictions.nextPeriodDate && (
                <div className="col-span-2 p-4 bg-pink-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-pink-600" />
                    <span className="font-semibold text-pink-700">Next Period</span>
                  </div>
                  <p className="text-lg text-pink-800">
                    {new Date(predictions.nextPeriodDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              {predictions.fertileWindowStart && (
                <div className="col-span-2 p-4 bg-purple-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-700">Fertile Window</span>
                  </div>
                  <p className="text-sm text-purple-800">
                    {new Date(predictions.fertileWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' - '}
                    {new Date(predictions.fertileWindowEnd!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Moon className="w-12 h-12 mx-auto mb-3 text-pink-300" />
              <p className="text-gray-600 mb-2">Start logging your period</p>
              <p className="text-sm text-gray-500">
                Log at least 2 cycles to see predictions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
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
                    ${isSelected ? 'ring-2 ring-pink-500 ring-offset-2' : ''}
                    ${isToday ? 'font-bold' : ''}
                    ${status === 'period' ? 'bg-pink-500 text-white' : ''}
                    ${status === 'symptom' ? 'bg-purple-200' : ''}
                    ${status === 'predicted_period' ? 'bg-pink-200 border-2 border-dashed border-pink-400' : ''}
                    ${status === 'fertile' ? 'bg-green-100' : ''}
                    ${status === 'ovulation' ? 'bg-green-300' : ''}
                    ${!status ? 'hover:bg-gray-100' : ''}
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
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Period</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-pink-200 border-2 border-dashed border-pink-400" />
              <span>Predicted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100" />
              <span>Fertile</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <span>Ovulation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entry */}
      <Card>
        <CardHeader>
          <CardTitle>
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
            <label className="text-sm font-medium mb-3 block">Period Flow</label>
            <div className="flex gap-2">
              {FLOW_OPTIONS.map(flow => (
                <Button
                  key={flow.id}
                  variant={selectedFlow === flow.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFlow(selectedFlow === flow.id ? null : flow.id)}
                  className={selectedFlow === flow.id ? "bg-pink-500 hover:bg-pink-600" : ""}
                >
                  <Droplets className={`w-4 h-4 mr-1 ${flow.color.replace('bg-', 'text-')}`} />
                  {flow.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="text-sm font-medium mb-3 block">Symptoms</label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(symptom => (
                <Badge
                  key={symptom.id}
                  variant={selectedSymptoms.includes(symptom.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedSymptoms.includes(symptom.id) 
                      ? "bg-purple-500 hover:bg-purple-600" 
                      : "hover:bg-purple-50"
                  }`}
                  onClick={() => toggleSymptom(symptom.id)}
                >
                  {symptom.emoji} {symptom.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Mood & Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Mood</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setMood(level)}
                    className={`text-2xl transition-transform ${
                      mood >= level ? 'scale-110' : 'opacity-30'
                    }`}
                  >
                    {level === 1 ? '😢' : level === 2 ? '😐' : level === 3 ? '🙂' : level === 4 ? '😊' : '🤩'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Energy</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`text-2xl transition-transform ${
                      energy >= level ? 'scale-110' : 'opacity-30'
                    }`}
                  >
                    {level <= 2 ? '🔋' : level <= 4 ? '⚡' : '🚀'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Textarea
              placeholder="How are you feeling today?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {selectedFlow && (
              <Button 
                onClick={handleLogPeriod}
                className="flex-1 bg-pink-500 hover:bg-pink-600"
              >
                <Droplets className="w-4 h-4 mr-2" />
                Log Period Day
              </Button>
            )}
            <Button 
              onClick={handleLogSymptoms}
              variant={selectedFlow ? "outline" : "default"}
              className={`flex-1 ${!selectedFlow ? "bg-purple-500 hover:bg-purple-600" : ""}`}
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
