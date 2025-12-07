"use client";

/**
 * Aurora Verified Badge - Aurora App Search
 * Displays verification status for community-verified sources
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Star, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type VerificationLevel = "gold" | "silver" | "bronze" | "community";

interface AuroraVerifiedBadgeProps {
  level: VerificationLevel;
  verifiedBy?: string;
  verifiedDate?: string;
  className?: string;
}

// Renamed to reflect algorithmic analysis, NOT community verification
const LEVEL_CONFIG = {
  gold: {
    icon: Award,
    label: "Official Source",
    description: "Official women's organization or government health site",
    bgColor: "bg-amber-500/20",
    textColor: "text-amber-600",
    borderColor: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  silver: {
    icon: Star,
    label: "High Trust",
    description: "Women-focused source with high credibility score",
    bgColor: "bg-slate-400/20",
    textColor: "text-slate-500",
    borderColor: "border-slate-400/30",
    glow: "shadow-slate-400/20",
  },
  bronze: {
    icon: CheckCircle,
    label: "Credible",
    description: "Source meets credibility threshold (70+)",
    bgColor: "bg-[var(--color-aurora-mint)]/30",
    textColor: "text-[var(--color-aurora-violet)]",
    borderColor: "border-[var(--color-aurora-mint)]/50",
    glow: "shadow-[var(--color-aurora-mint)]/20",
  },
  community: {
    icon: Sparkles,
    label: "Women-Focused",
    description: "Content specifically addresses women's perspectives",
    bgColor: "bg-[var(--color-aurora-pink)]/20",
    textColor: "text-[var(--color-aurora-pink)]",
    borderColor: "border-[var(--color-aurora-pink)]/30",
    glow: "shadow-[var(--color-aurora-pink)]/20",
  },
};

export function AuroraVerifiedBadge({ 
  level, 
  verifiedBy,
  verifiedDate,
  className = "" 
}: AuroraVerifiedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Badge 
          className={`text-[9px] ${config.bgColor} ${config.textColor} ${config.borderColor} h-5 gap-1 cursor-help shadow-sm ${config.glow}`}
        >
          <Icon className="w-3 h-3" />
          {config.label}
        </Badge>
      </motion.div>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-2 shadow-lg max-w-xs">
              <p className="font-medium text-sm text-[var(--foreground)]">{config.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{config.description}</p>
              {verifiedBy && (
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                  Verified by: {verifiedBy}
                </p>
              )}
              {verifiedDate && (
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Date: {verifiedDate}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to determine verification level based on domain/score
export function getVerificationLevel(
  domain: string,
  credibilityScore: number,
  isWomenFocused: boolean
): VerificationLevel | null {
  const normalizedDomain = domain.toLowerCase().replace("www.", "");
  
  // Gold: Official women's organizations
  const goldDomains = ["unwomen.org", "who.int", "womenshealth.gov", "rainn.org", "thehotline.org"];
  if (goldDomains.includes(normalizedDomain)) return "gold";
  
  // Silver: High credibility women-focused
  if (isWomenFocused && credibilityScore >= 80) return "silver";
  
  // Bronze: Good credibility
  if (credibilityScore >= 70) return "bronze";
  
  // Community: Women-focused with decent credibility
  if (isWomenFocused && credibilityScore >= 50) return "community";
  
  return null;
}

export default AuroraVerifiedBadge;
