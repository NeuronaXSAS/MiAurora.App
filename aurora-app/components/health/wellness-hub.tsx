"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Droplets, 
  Moon, 
  Sparkles, 
  Calendar,
  TrendingUp,
  Plus,
  Minus,
  Check,
  Brain,
  Activity,
  Flower2,
  ChevronRight,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

interface WellnessHubProps {
  userId: Id<"users">;
  compact?: boolean;
}

export function WellnessHub({ userId, compact = false }: WellnessHubProps) {
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  
  const hydration = useQuery(api.health.getTodayHydration, { userId, clientDate: today });
  const mood = useQuery(api.health.getTodayMood, { userId, clientDate: today });
  const meditationStats = useQuery(api.health.getMeditationStats, { userId });
  
  const logWater = useMutation(api.health.logWater);
  const logMood = useMutation(api.health.logMood);

  const handleWaterChange = async (delta: number) => {
    const current = hydration?.glasses || 0;
    const newValue = Math.max(0, Math.min(12, current + delta));
    await logWater({ userId, glasses: newValue, clientDate: today });
  };

  const handleMoodSelect = async (moodValue: number) => {
    await logMood({ userId, mood: moodValue, clientDate: today });
    setShowMoodPicker(false);
  };

  const moodEmojis = ["😢", "😐", "😊", "😄", "🤩"];
  const moodLabels = ["Struggling", "Okay", "Good", "Great", "Amazing"];

  const wellnessFeatures = [
    {
      id: "cycle",
      title: "Cycle Tracker",
      description: "Track your menstrual health",
      icon: Flower2,
      color: "from-[var(--color-aurora-pink)] to-pink-400",
      href: "/health/cycle",
      badge: "Health",
    },
    {
      id: "meditation",
      title: "Meditation",
      description: "Guided breathing & mindfulness",
      icon: Brain,
      color: "from-[var(--color-aurora-purple)] to-indigo-400",
      href: "/health/meditation",
      badge: "+5 credits",
    },
    {
      id: "sleep",
      title: "Sleep Journal",
      description: "Track your rest patterns",
      icon: Moon,
      color: "from-indigo-500 to-purple-400",
      href: "/health/sleep",
      badge: "Coming Soon",
    },
  ];

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-[var(--color-aurora-pink)]/10 to-[var(--color-aurora-purple)]/10 border-[var(--color-aurora-pink)]/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              <span className="font-semibold text-[var(--foreground)]">Wellness</span>
            </div>
            <Link href="/health">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Hydration Mini */}
            <div className="bg-[var(--card)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                <span className="text-xs text-[var(--muted-foreground)]">Water</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[var(--foreground)]">
                  {hydration?.glasses || 0}/{hydration?.goal || 8}
                </span>
                <div className="flex gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="w-7 h-7"
                    onClick={() => handleWaterChange(-1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="w-7 h-7"
                    onClick={() => handleWaterChange(1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mood Mini */}
            <div className="bg-[var(--card)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                <span className="text-xs text-[var(--muted-foreground)]">Mood</span>
              </div>
              {mood ? (
                <span className="text-2xl">{moodEmojis[mood.mood - 1]}</span>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={() => setShowMoodPicker(true)}
                >
                  Check in
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Wellness Hub</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Take care of yourself 💜</p>
        </div>
        <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">
          <Sparkles className="w-3 h-3 mr-1" /> Self-Care
        </Badge>
      </div>

      {/* Daily Check-ins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hydration Tracker */}
        <Card className="bg-gradient-to-br from-[var(--color-aurora-blue)]/10 to-[var(--color-aurora-mint)]/10 border-[var(--color-aurora-blue)]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[var(--color-aurora-blue)]/20 rounded-xl flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-[var(--color-aurora-blue)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">Hydration</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Stay refreshed</p>
                </div>
              </div>
              {hydration?.completed && (
                <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
                  <Check className="w-3 h-3 mr-1" /> Goal Met!
                </Badge>
              )}
            </div>

            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-[var(--foreground)]">
                {hydration?.glasses || 0}
                <span className="text-lg text-[var(--muted-foreground)]">/{hydration?.goal || 8}</span>
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">glasses today</p>
            </div>

            <Progress 
              value={((hydration?.glasses || 0) / (hydration?.goal || 8)) * 100} 
              className="h-3 mb-4"
            />

            <div className="flex justify-center gap-3">
              <Button 
                size="lg"
                variant="outline"
                className="min-h-[48px] min-w-[48px] rounded-xl"
                onClick={() => handleWaterChange(-1)}
                disabled={(hydration?.glasses || 0) <= 0}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                className="min-h-[48px] px-8 rounded-xl bg-[var(--color-aurora-blue)]"
                onClick={() => handleWaterChange(1)}
              >
                <Plus className="w-5 h-5 mr-2" /> Add Glass
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mood Check-in */}
        <Card className="bg-gradient-to-br from-[var(--color-aurora-pink)]/10 to-[var(--color-aurora-purple)]/10 border-[var(--color-aurora-pink)]/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[var(--color-aurora-pink)]/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">Mood Check-in</p>
                  <p className="text-xs text-[var(--muted-foreground)]">How are you feeling?</p>
                </div>
              </div>
              {mood && (
                <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                  <Coins className="w-3 h-3 mr-1" /> +5
                </Badge>
              )}
            </div>

            {mood ? (
              <div className="text-center py-4">
                <p className="text-6xl mb-2">{moodEmojis[mood.mood - 1]}</p>
                <p className="text-lg font-medium text-[var(--foreground)]">{moodLabels[mood.mood - 1]}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Logged today</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowMoodPicker(true)}
                >
                  Update
                </Button>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-center text-sm text-[var(--muted-foreground)] mb-4">
                  Tap to log your mood
                </p>
                <div className="flex justify-center gap-2">
                  {moodEmojis.map((emoji, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMoodSelect(idx + 1)}
                      className="text-3xl p-2 rounded-xl hover:bg-[var(--accent)] transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wellness Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {wellnessFeatures.map((feature) => (
          <Link key={feature.id} href={feature.href}>
            <Card className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-pink)]/50 transition-all cursor-pointer h-full">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">{feature.title}</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-2">{feature.description}</p>
                <Badge variant="outline" className="text-xs">
                  {feature.badge}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Meditation Stats */}
      {meditationStats && meditationStats.totalSessions > 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">Meditation Journey</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {meditationStats.totalSessions} sessions • {meditationStats.totalMinutes} minutes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--muted-foreground)]">Earned</p>
                <p className="text-lg font-bold text-[var(--color-aurora-yellow)]">
                  +{meditationStats.totalCredits}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Picker Modal */}
      <AnimatePresence>
        {showMoodPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowMoodPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--card)] rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-center text-[var(--foreground)] mb-4">
                How are you feeling?
              </h3>
              <div className="flex justify-center gap-3 mb-4">
                {moodEmojis.map((emoji, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMoodSelect(idx + 1)}
                    className="text-4xl p-3 rounded-xl hover:bg-[var(--accent)] transition-colors"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] px-2">
                <span>Struggling</span>
                <span>Amazing</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
