"use client";

/**
 * Safety Alert Badge - Aurora App Search
 * Displays warnings for known problematic sites
 */

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

// Known problematic domains (community-reported)
const PROBLEMATIC_DOMAINS = new Set([
  "4chan.org", "8kun.top", "kiwifarms.net", "stormfront.org",
  "returnofkings.com", "theredpill.com", "incels.is",
]);

// Known trusted women-focused domains
const TRUSTED_DOMAINS = new Set([
  "unwomen.org", "who.int", "womenshealth.gov", "rainn.org",
  "thehotline.org", "ncadv.org", "womenforwomen.org", "catalyst.org",
  "leanin.org", "girlswhocode.com", "aauw.org", "now.org",
]);

interface SafetyAlertBadgeProps {
  domain: string;
  safetyFlags?: string[];
  className?: string;
}

export function SafetyAlertBadge({ domain, safetyFlags = [], className = "" }: SafetyAlertBadgeProps) {
  const normalizedDomain = domain.toLowerCase().replace("www.", "");
  
  // Check if domain is problematic
  const isProblematic = PROBLEMATIC_DOMAINS.has(normalizedDomain) || 
    safetyFlags.some(f => f.toLowerCase().includes("warning") || f.toLowerCase().includes("unsafe"));
  
  // Check if domain is trusted
  const isTrusted = TRUSTED_DOMAINS.has(normalizedDomain);
  
  // Check for community reports
  const hasCommunityWarning = safetyFlags.some(f => 
    f.toLowerCase().includes("community") || f.toLowerCase().includes("reported")
  );

  if (isProblematic) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Badge className="text-[9px] bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)] border-[var(--color-aurora-salmon)]/30 h-5 gap-1">
          <ShieldAlert className="w-3 h-3" />
          Safety Warning
        </Badge>
      </motion.div>
    );
  }

  if (hasCommunityWarning) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Badge className="text-[9px] bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-[var(--color-aurora-yellow)]/30 h-5 gap-1">
          <AlertTriangle className="w-3 h-3" />
          Community Reported
        </Badge>
      </motion.div>
    );
  }

  if (isTrusted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Badge className="text-[9px] bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-[var(--color-aurora-mint)]/30 h-5 gap-1">
          <ShieldCheck className="w-3 h-3" />
          Trusted Source
        </Badge>
      </motion.div>
    );
  }

  return null;
}

export default SafetyAlertBadge;
