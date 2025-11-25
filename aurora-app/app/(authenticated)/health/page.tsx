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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Flower2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Soul Sanctuary</h1>
              <p className="text-white/80">Your holistic wellness companion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="cycle" className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Cycle</span>
            </TabsTrigger>
            <TabsTrigger value="hydration" className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <span className="hidden sm:inline">Hydration</span>
            </TabsTrigger>
            <TabsTrigger value="mood" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Mood</span>
            </TabsTrigger>
            <TabsTrigger value="meditate" className="flex items-center gap-2">
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
