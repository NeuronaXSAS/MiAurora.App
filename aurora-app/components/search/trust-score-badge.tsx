"use client";

/**
 * Aurora Trust Score™ Badge Component
 * 
 * Visual display of the trust score with badges and expandable details.
 * Designed to be instantly recognizable and "addictive" to check.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { TrustScoreResult } from "@/lib/search/trust-score";

interface TrustScoreBadgeProps {
  trustScore: TrustScoreResult;
  compact?: boolean;
}

export function TrustScoreBadge({ trustScore, compact = false }: TrustScoreBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
        style={{ backgroundColor: `${trustScore.color}20` }}
      >
        <span className="text-sm">{trustScore.emoji}</span>
        <span 
          className="text-xs font-bold"
          style={{ color: trustScore.color }}
        >
          {trustScore.score}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main Score + Badges Row */}
      <div className="flex items-center gap-3">
        {/* Large Score Badge */}
        <div 
          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold shadow-lg"
          style={{ 
            backgroundColor: `${trustScore.color}15`,
            boxShadow: `0 0 20px ${trustScore.color}30`,
            border: `2px solid ${trustScore.color}40`
          }}
        >
          <span className="text-lg">{trustScore.emoji}</span>
          <span 
            className="text-sm font-black"
            style={{ color: trustScore.color }}
          >
            {trustScore.score}
          </span>
        </div>

        {/* Quick Badges */}
        <div className="flex flex-wrap gap-1.5">
          <QuickBadge 
            emoji={trustScore.badges.gender.emoji} 
            label={trustScore.badges.gender.label}
            color={trustScore.badges.gender.type === 'positive' ? '#a855f7' : '#6b7280'}
          />
          <QuickBadge 
            emoji={trustScore.badges.content.emoji} 
            label={trustScore.badges.content.label}
            color="#6366f1"
          />
          <QuickBadge 
            emoji={trustScore.badges.freshness.emoji} 
            label={trustScore.badges.freshness.label}
            color={trustScore.badges.freshness.type === 'fresh' ? '#22c55e' : '#eab308'}
          />
          {trustScore.badges.ai.percentage > 10 && (
            <QuickBadge 
              emoji={trustScore.badges.ai.emoji} 
              label={trustScore.badges.ai.label}
              color={trustScore.badges.ai.percentage > 50 ? '#ef4444' : '#f97316'}
            />
          )}
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <Info className="w-3 h-3" />
        <span>Why Aurora {trustScore.score >= 70 ? 'trusts' : 'flags'} this</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-[var(--accent)]/50 rounded-lg text-xs space-y-2">
              <p className="text-[var(--foreground)]">{trustScore.details.whyThisScore}</p>
              
              {trustScore.details.keyFactors.length > 0 && (
                <div>
                  <p className="text-[var(--muted-foreground)] mb-1">✓ Key factors:</p>
                  <ul className="text-[var(--foreground)]/80 space-y-0.5">
                    {trustScore.details.keyFactors.map((factor, i) => (
                      <li key={i}>• {factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {trustScore.details.concerns.length > 0 && (
                <div>
                  <p className="text-[var(--muted-foreground)] mb-1">⚠️ Concerns:</p>
                  <ul className="text-[var(--foreground)]/80 space-y-0.5">
                    {trustScore.details.concerns.map((concern, i) => (
                      <li key={i}>• {concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickBadge({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <div 
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-transform hover:scale-105"
      style={{ 
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Inline Trust Score - For compact display in search results
 */
export function InlineTrustScore({ score, color, emoji }: { score: number; color: string; emoji: string }) {
  return (
    <div 
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
      style={{ 
        backgroundColor: `${color}15`,
        color: color 
      }}
      title={`Aurora Trust Score: ${score}/100`}
    >
      <span>{emoji}</span>
      <span>{score}</span>
    </div>
  );
}
