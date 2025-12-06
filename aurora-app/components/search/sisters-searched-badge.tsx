"use client";

/**
 * Sisters Searched This - Aurora App Search
 * Shows community search insights and popularity
 */

import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface SistersSearchedBadgeProps {
  searchCount?: number;
  helpfulCount?: number;
  relatedSearches?: string[];
  className?: string;
}

export function SistersSearchedBadge({ 
  searchCount = 0, 
  helpfulCount = 0,
  relatedSearches = [],
  className = "" 
}: SistersSearchedBadgeProps) {
  // Only show if there's meaningful community data
  if (searchCount < 5 && helpfulCount < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {searchCount >= 5 && (
        <Badge className="text-[9px] bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] border-0 h-5 gap-1">
          <Users className="w-3 h-3" />
          {searchCount}+ sisters searched
        </Badge>
      )}
      
      {helpfulCount >= 3 && (
        <Badge className="text-[9px] bg-[var(--color-aurora-pink)]/10 text-[var(--color-aurora-pink)] border-0 h-5 gap-1">
          <Heart className="w-3 h-3" />
          {helpfulCount} found helpful
        </Badge>
      )}

      {relatedSearches.length > 0 && (
        <Badge className="text-[9px] bg-[var(--accent)] text-[var(--muted-foreground)] border-0 h-5 gap-1">
          <TrendingUp className="w-3 h-3" />
          Related: {relatedSearches[0]}
        </Badge>
      )}
    </motion.div>
  );
}

export default SistersSearchedBadge;
