"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CycleTracker } from "@/components/health/cycle-tracker";
import { HydrationTracker } from "@/components/health/hydration-tracker";
import { EmotionalCheckin } from "@/components/health/emotional-checkin";
import { MeditationSection } from "@/components/health/meditation-section";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Moon, 
  Droplets, 
  Heart, 
  Sparkles,
  Flower2
} from "lucide-react";

export default function HealthPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState("cycle");
  const router = useRouter();

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/");
      }
    };
    getUserId();
  }, [router]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-aurora-pink)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-pink)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)] text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Flower2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Soul Sanctuary</h1>
              <p className="text-white/80 text-sm sm:text-base">Your holistic wellness companion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4 sm:mb-6 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
            <TabsTrigger 
              value="cycle" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-pink)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Cycle</span>
            </TabsTrigger>
            <TabsTrigger 
              value="hydration" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-blue)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <Droplets className="w-4 h-4" />
              <span className="hidden sm:inline">Hydration</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mood" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger 
              value="meditate" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-mint)] data-[state=active]:text-[var(--color-aurora-violet)] rounded-lg py-2 sm:py-2.5"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Meditate</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cycle">
            <CycleTracker userId={userId} />
          </TabsContent>

          <TabsContent value="hydration">
            <HydrationTracker userId={userId} />
          </TabsContent>

          <TabsContent value="mood">
            <EmotionalCheckin userId={userId} />
          </TabsContent>

          <TabsContent value="meditate">
            <MeditationSection userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
