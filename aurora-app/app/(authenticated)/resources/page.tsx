"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResourceDirectory } from "@/components/resources/resource-directory";
import { Id } from "@/convex/_generated/dataModel";
import { Shield, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common countries for the selector
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "PH", name: "Philippines" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "UAE" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PL", name: "Poland" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
];

export default function ResourcesPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
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
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] via-[var(--color-aurora-pink)] to-[var(--color-aurora-orange)] text-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Safety Resources</h1>
                <p className="text-white/80 text-sm sm:text-base">Hotlines, shelters, legal aid & more</p>
              </div>
            </div>
            
            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-white/70" />
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white min-h-[44px]">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="global">🌍 Global Resources</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Onboarding Info Card */}
        <div className="bg-[var(--color-aurora-lavender)]/10 border border-[var(--color-aurora-lavender)]/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] mb-1">Community-Verified Resources</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Find hotlines, shelters, legal aid, medical services, and counseling resources verified by our community. 
                Select your country above to see local resources, or browse global resources available worldwide.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] px-2 py-1 rounded-full">🆘 Emergency Hotlines</span>
                <span className="text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] px-2 py-1 rounded-full">🏠 Shelters</span>
                <span className="text-xs bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)] px-2 py-1 rounded-full">⚖️ Legal Aid</span>
                <span className="text-xs bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] px-2 py-1 rounded-full">🏥 Medical</span>
                <span className="text-xs bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] px-2 py-1 rounded-full">💬 Counseling</span>
              </div>
            </div>
          </div>
        </div>

        <ResourceDirectory 
          userId={userId} 
          country={selectedCountry === "global" ? undefined : selectedCountry}
        />
      </div>
    </div>
  );
}
