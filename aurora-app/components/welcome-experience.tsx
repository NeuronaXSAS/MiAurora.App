"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Shield, 
  Users, 
  Heart, 
  Coins,
  MapPin,
  Video,
  ChevronRight,
  Gift,
  Target,
  Zap,
  Star,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

interface WelcomeExperienceProps {
  userId: Id<"users">;
  onDismiss?: () => void;
}

interface WelcomeTask {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  credits: number;
  href: string;
  completed: boolean;
  color: string;
}

export function WelcomeExperience({ userId, onDismiss }: WelcomeExperienceProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const user = useQuery(api.users.getUser, { userId });
  const userStats = useQuery(api.users.getUserStats, { userId });

  // Check localStorage for dismissed state
  useEffect(() => {
    const isDismissed = localStorage.getItem(`aurora-welcome-dismissed-${userId}`);
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, [userId]);

  // Show celebration for new users with welcome bonus
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(`aurora-welcome-seen-${userId}`);
    if (!hasSeenWelcome && user?.credits && user.credits >= 50) {
      setShowCelebration(true);
      localStorage.setItem(`aurora-welcome-seen-${userId}`, "true");
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [userId, user?.credits]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`aurora-welcome-dismissed-${userId}`, "true");
    onDismiss?.();
  };

  if (dismissed) return null;

  // Define welcome tasks based on user progress
  const welcomeTasks: WelcomeTask[] = [
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add bio and interests",
      icon: Target,
      credits: 25,
      href: "/settings",
      completed: !!user?.onboardingCompleted,
      color: "from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]",
    },
    {
      id: "safety-rating",
      title: "Rate a Location",
      description: "Help others stay safe",
      icon: MapPin,
      credits: 25,
      href: "/map",
      completed: (userStats?.totalPosts || 0) > 0,
      color: "from-[var(--color-aurora-blue)] to-[var(--color-aurora-mint)]",
    },
    {
      id: "join-circle",
      title: "Join a Circle",
      description: "Connect with your community",
      icon: Users,
      credits: 15,
      href: "/circles",
      completed: false, // Would check circle membership
      color: "from-[var(--color-aurora-pink)] to-pink-400",
    },
    {
      id: "wellness",
      title: "Track Your Wellness",
      description: "Log mood or hydration",
      icon: Heart,
      credits: 10,
      href: "/health",
      completed: false, // Would check health logs
      color: "from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]",
    },
  ];

  const completedTasks = welcomeTasks.filter(t => t.completed).length;
  const totalCreditsAvailable = welcomeTasks.reduce((sum, t) => sum + (t.completed ? 0 : t.credits), 0);
  const progress = (completedTasks / welcomeTasks.length) * 100;

  return (
    <>
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-3xl p-8 text-center text-white max-w-sm mx-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Gift className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Aurora App! 💜</h2>
              <p className="text-white/80 mb-4">You've received your welcome bonus</p>
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <p className="text-4xl font-bold">+50</p>
                <p className="text-sm text-white/70">Credits</p>
              </div>
              <Button 
                onClick={() => setShowCelebration(false)}
                className="bg-white text-[var(--color-aurora-purple)] hover:bg-white/90 min-h-[48px] px-8"
              >
                Let's Go! <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20 overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--foreground)]">Get Started</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Complete tasks to earn {totalCreditsAvailable} credits
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Dismiss
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--muted-foreground)]">Progress</span>
              <span className="text-xs font-medium text-[var(--foreground)]">
                {completedTasks}/{welcomeTasks.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {welcomeTasks.map((task) => (
              <Link key={task.id} href={task.href}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                    task.completed 
                      ? "bg-[var(--color-aurora-mint)]/20 opacity-60" 
                      : "bg-[var(--card)] hover:bg-[var(--accent)]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    task.completed 
                      ? "bg-[var(--color-aurora-mint)]" 
                      : `bg-gradient-to-r ${task.color}`
                  }`}>
                    {task.completed ? (
                      <Check className="w-5 h-5 text-[var(--color-aurora-violet)]" />
                    ) : (
                      <task.icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${
                      task.completed ? "line-through text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
                    }`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">{task.description}</p>
                  </div>
                  {!task.completed && (
                    <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-xs">
                      +{task.credits}
                    </Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Bonus tip */}
          {completedTasks === welcomeTasks.length && (
            <div className="mt-4 p-3 bg-[var(--color-aurora-mint)]/20 rounded-xl text-center">
              <Star className="w-5 h-5 text-[var(--color-aurora-yellow)] mx-auto mb-1" />
              <p className="text-sm font-medium text-[var(--foreground)]">All tasks complete!</p>
              <p className="text-xs text-[var(--muted-foreground)]">You're ready to explore Aurora App</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
