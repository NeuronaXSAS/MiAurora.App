"use client";

import { useState, useEffect } from "react";
import { Crown, Sparkles, MessageSquare, Video, Radio, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UsageData {
  type: string;
  used: number;
  limit: number;
  label: string;
  icon: React.ElementType;
}

interface PremiumUsageIndicatorProps {
  isPremium?: boolean;
  usageType?: "aiChat" | "posts" | "reels" | "livestreams" | "all";
  compact?: boolean;
  className?: string;
}

// Rate limits matching lib/rate-limit.ts
const LIMITS = {
  aiChat: { free: 10, premium: 1000, label: "AI Messages", icon: MessageSquare },
  posts: { free: 5, premium: 50, label: "Posts/hour", icon: FileText },
  reels: { free: 3, premium: 20, label: "Reels/day", icon: Video },
  livestreams: { free: 2, premium: 10, label: "Streams/day", icon: Radio },
};

export function PremiumUsageIndicator({ 
  isPremium = false, 
  usageType = "all",
  compact = false,
  className 
}: PremiumUsageIndicatorProps) {
  const [usage, setUsage] = useState<Record<string, number>>({
    aiChat: 0,
    posts: 0,
    reels: 0,
    livestreams: 0,
  });

  // In a real app, this would fetch from an API
  // For now, we'll use localStorage to track usage
  useEffect(() => {
    const stored = localStorage.getItem("aurora_usage");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Reset if it's a new day
        const today = new Date().toDateString();
        if (data.date !== today) {
          localStorage.setItem("aurora_usage", JSON.stringify({ date: today, usage: {} }));
        } else {
          setUsage(data.usage || {});
        }
      } catch (e) {
        // Invalid data, reset
      }
    }
  }, []);

  const getUsageItems = (): UsageData[] => {
    if (usageType === "all") {
      return Object.entries(LIMITS).map(([key, config]) => ({
        type: key,
        used: usage[key] || 0,
        limit: isPremium ? config.premium : config.free,
        label: config.label,
        icon: config.icon,
      }));
    }
    
    const config = LIMITS[usageType];
    return [{
      type: usageType,
      used: usage[usageType] || 0,
      limit: isPremium ? config.premium : config.free,
      label: config.label,
      icon: config.icon,
    }];
  };

  const items = getUsageItems();

  if (compact) {
    const item = items[0];
    const percentage = Math.min((item.used / item.limit) * 100, 100);
    const isNearLimit = percentage >= 80;
    
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <item.icon className={cn(
          "w-4 h-4",
          isNearLimit ? "text-[var(--color-aurora-orange)]" : "text-[var(--muted-foreground)]"
        )} />
        <span className={cn(
          "text-xs font-medium",
          isNearLimit ? "text-[var(--color-aurora-orange)]" : "text-[var(--muted-foreground)]"
        )}>
          {item.used}/{item.limit}
        </span>
        {!isPremium && isNearLimit && (
          <Link href="/premium">
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-[var(--color-aurora-yellow)]">
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-4",
      isPremium 
        ? "bg-gradient-to-br from-[var(--color-aurora-yellow)]/10 to-[var(--color-aurora-orange)]/10 border-[var(--color-aurora-yellow)]/30"
        : "bg-[var(--card)] border-[var(--border)]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isPremium ? (
            <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
          ) : (
            <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          )}
          <span className="font-semibold text-[var(--foreground)]">
            {isPremium ? "Premium Usage" : "Daily Limits"}
          </span>
        </div>
        {!isPremium && (
          <Link href="/premium">
            <Button size="sm" className="h-8 bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] text-slate-900 hover:opacity-90">
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>

      {/* Usage Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const percentage = Math.min((item.used / item.limit) * 100, 100);
          const isNearLimit = percentage >= 80;
          const Icon = item.icon;
          
          return (
            <div key={item.type} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    "w-4 h-4",
                    isNearLimit && !isPremium 
                      ? "text-[var(--color-aurora-orange)]" 
                      : "text-[var(--muted-foreground)]"
                  )} />
                  <span className="text-[var(--foreground)]">{item.label}</span>
                </div>
                <span className={cn(
                  "font-medium",
                  isNearLimit && !isPremium 
                    ? "text-[var(--color-aurora-orange)]" 
                    : "text-[var(--muted-foreground)]"
                )}>
                  {item.used}/{item.limit}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={cn(
                  "h-2",
                  isNearLimit && !isPremium ? "[&>div]:bg-[var(--color-aurora-orange)]" : ""
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA for free users */}
      {!isPremium && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)] text-center">
            Upgrade to Premium for higher limits and ad-free experience
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to track and increment usage
 */
export function useUsageTracker() {
  const incrementUsage = (type: keyof typeof LIMITS) => {
    const stored = localStorage.getItem("aurora_usage");
    const today = new Date().toDateString();
    let data = { date: today, usage: {} as Record<string, number> };
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          data = parsed;
        }
      } catch (e) {
        // Invalid data
      }
    }
    
    data.usage[type] = (data.usage[type] || 0) + 1;
    localStorage.setItem("aurora_usage", JSON.stringify(data));
    
    return data.usage[type];
  };

  const getUsage = (type: keyof typeof LIMITS): number => {
    const stored = localStorage.getItem("aurora_usage");
    if (!stored) return 0;
    
    try {
      const data = JSON.parse(stored);
      const today = new Date().toDateString();
      if (data.date !== today) return 0;
      return data.usage[type] || 0;
    } catch (e) {
      return 0;
    }
  };

  const checkLimit = (type: keyof typeof LIMITS, isPremium: boolean): boolean => {
    const used = getUsage(type);
    const limit = isPremium ? LIMITS[type].premium : LIMITS[type].free;
    return used < limit;
  };

  return { incrementUsage, getUsage, checkLimit };
}
