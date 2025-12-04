"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  ChevronRight,
  Globe,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SafetyPulseProps {
  userId?: string;
  compact?: boolean;
}

export function SafetyPulse({ userId, compact = false }: SafetyPulseProps) {
  const [recentReports, setRecentReports] = useState(0);
  const [safeZones, setSafeZones] = useState(0);
  
  // Simulated real-time data - in production this would come from Convex
  useEffect(() => {
    // Simulate fetching global safety stats
    setRecentReports(Math.floor(Math.random() * 50) + 100);
    setSafeZones(Math.floor(Math.random() * 200) + 500);
  }, []);

  if (compact) {
    return (
      <Link href="/map">
        <Card className="bg-gradient-to-r from-[var(--color-aurora-mint)]/20 to-[var(--color-aurora-purple)]/10 border-[var(--color-aurora-mint)]/30 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-mint)] rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[var(--color-aurora-violet)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)] text-sm">Safety Pulse</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{safeZones} safe zones worldwide</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Global Safety Pulse</h3>
            <p className="text-white/80 text-sm">Real-time safety intelligence</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--color-aurora-mint)]/10 rounded-xl p-3 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-mint)]" />
            <p className="text-lg font-bold text-[var(--foreground)]">{safeZones}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Safe Zones</p>
          </div>
          <div className="bg-[var(--color-aurora-yellow)]/10 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-yellow)]" />
            <p className="text-lg font-bold text-[var(--foreground)]">{recentReports}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Reports Today</p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-[var(--accent)] rounded-xl p-3">
          <p className="text-sm text-[var(--foreground)] font-medium mb-2">
            🌍 Help women stay safe worldwide
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Share safety reports from your location to help other women navigate safely.
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <Link href="/map" className="flex-1">
            <Button className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]">
              <MapPin className="w-4 h-4 mr-2" />
              View Map
            </Button>
          </Link>
          <Link href="/report" className="flex-1">
            <Button variant="outline" className="w-full border-[var(--border)] min-h-[44px]">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
