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
  const [showQuickCall, setShowQuickCall] = useState(false);
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

  // Quick emergency numbers
  const emergencyNumbers = [
    { label: "911", region: "US/Canada" },
    { label: "112", region: "International" },
    { label: "999", region: "UK" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header with Quick Actions */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between gap-3">
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
            
            {/* Quick Emergency Call Button */}
            <button
              onClick={() => setShowQuickCall(!showQuickCall)}
              className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-[var(--color-aurora-orange)] hover:bg-[var(--color-aurora-orange)]/90 flex items-center justify-center shadow-lg transition-all active:scale-95"
              aria-label="Quick emergency call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
          </div>

          {/* Quick Call Dropdown */}
          {showQuickCall && (
            <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <p className="text-sm text-white/80 mb-3 font-medium">Emergency Services</p>
              <div className="flex gap-2">
                {emergencyNumbers.map((num) => (
                  <a
                    key={num.label}
                    href={`tel:${num.label}`}
                    className="flex-1 py-3 px-4 bg-white rounded-xl text-center hover:bg-white/90 transition-colors min-h-[52px] flex flex-col items-center justify-center"
                  >
                    <span className="text-lg font-bold text-[var(--color-aurora-violet)]">{num.label}</span>
                    <span className="text-[10px] text-[var(--color-aurora-violet)]/70">{num.region}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Tabs for different safety features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 mb-6 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="guardians" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg py-3 sm:py-2.5 min-h-[44px]"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden xs:inline">Guardians</span>
            </TabsTrigger>
            <TabsTrigger 
              value="checkin" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-mint)] data-[state=active]:text-[var(--color-aurora-violet)] rounded-lg py-3 sm:py-2.5 min-h-[44px]"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden xs:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger 
              value="accompany" 
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-pink)] data-[state=active]:text-white rounded-lg py-3 sm:py-2.5 min-h-[44px]"
            >
              <UsersIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Accompany</span>
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

        {/* Safety Tips Card */}
        <div className="mt-6 p-4 bg-[var(--color-aurora-lavender)]/20 border border-[var(--color-aurora-lavender)]/30 rounded-2xl">
          <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--color-aurora-purple)]" />
            Safety Tips
          </h3>
          <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
            <li>• Add at least 2 trusted guardians for emergencies</li>
            <li>• Set up regular check-ins when traveling alone</li>
            <li>• Use sister accompaniment for late-night commutes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
