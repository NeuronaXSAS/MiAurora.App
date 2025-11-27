"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Clock,
  Users as UsersIcon,
} from "lucide-react";

import { SafetyCheckin } from "@/components/safety-checkin";
import { SisterAccompaniment } from "@/components/sister-accompaniment";
import { AuroraGuardianManager } from "@/components/aurora-guardian-manager";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function EmergencyPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState("guardians");
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

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Aurora Guardian</h1>
              <p className="text-sm sm:text-base text-white/80">
                Your Safety Network
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Tabs for different safety features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 mb-6 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
            <TabsTrigger value="guardians" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Guardians</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-mint)] data-[state=active]:text-[var(--color-aurora-violet)] rounded-lg py-2 sm:py-2.5">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="accompany" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-pink)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5">
              <UsersIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Accompany</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guardians">
            {userId && <AuroraGuardianManager userId={userId} />}
          </TabsContent>

          <TabsContent value="checkin">
            {userId && <SafetyCheckin userId={userId} />}
          </TabsContent>

          <TabsContent value="accompany">
            {userId && <SisterAccompaniment userId={userId} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
