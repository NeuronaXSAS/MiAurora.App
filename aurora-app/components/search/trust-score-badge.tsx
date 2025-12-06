"use client";

/**
 * Aurora Trust Score™ Badge Component
 * 
 * Visual display of the trust score with badges and expandable details.
 * Designed to be instantly recognizable, WARM, and "addictive" to check.
 * 
 * REDESIGNED: More feminine, warmer colors, dynamic explanations
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Sparkles, Heart, Lightbulb } from "lucide-react";
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-transform hover:scale-105"
        style={{ 
          backgroundColor: `${trustScore.color}15`,
          border: `1.5px solid ${trustScore.color}30`
        }}
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
    <div className="space-y-3">
      {/* Aurora Analysis Header - Warm & Inviting */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)]/15 to-[var(--color-aurora-pink)]/15 border border-[var(--color-aurora-purple)]/20">
          <Sparkles className="w-3 h-3 text-[var(--color-aurora-purple)]" />
          <span className="text-[10px] font-semibold text-[var(--color-aurora-purple)]">Aurora Trust Score™</span>
        </div>
      </div>

      {/* Main Score + Badges Row */}
      <div className="flex items-center gap-4">
        {/* Large Score Badge - More Feminine Design */}
        <div 
          className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold transition-transform hover:scale-105 cursor-help"
          style={{ 
            background: `linear-gradient(135deg, ${trustScore.color}20, ${trustScore.color}10)`,
            boxShadow: `0 4px 20px ${trustScore.color}25, inset 0 1px 0 rgba(255,255,255,0.2)`,
            border: `2px solid ${trustScore.color}40`
          }}
          title={`Aurora Trust Score: ${trustScore.score}/100 - ${trustScore.label}`}
        >
          <span className="text-xl">{trustScore.emoji}</span>
          <span 
            className="text-base font-black"
            style={{ color: trustScore.color }}
          >
            {trustScore.score}
          </span>
        </div>

        {/* Quick Badges - Warmer, More Feminine */}
        <div className="flex flex-wrap gap-2">
          <QuickBadge 
            emoji={trustScore.badges.gender.emoji} 
            label={trustScore.badges.gender.label}
            color={trustScore.badges.gender.type === 'positive' ? '#a855f7' : trustScore.badges.gender.type === 'dominated' ? '#6b7280' : '#9ca3af'}
            highlight={trustScore.badges.gender.type === 'positive'}
          />
          <QuickBadge 
            emoji={trustScore.badges.content.emoji} 
            label={trustScore.badges.content.label}
            color="#8b5cf6"
          />
          <QuickBadge 
            emoji={trustScore.badges.freshness.emoji} 
            label={trustScore.badges.freshness.label}
            color={trustScore.badges.freshness.type === 'fresh' ? '#22c55e' : trustScore.badges.freshness.type === 'recent' ? '#84cc16' : '#eab308'}
          />
          {trustScore.badges.ai.percentage > 10 && (
            <QuickBadge 
              emoji={trustScore.badges.ai.emoji} 
              label={trustScore.badges.ai.label}
              color={trustScore.badges.ai.percentage > 50 ? '#ef4444' : trustScore.badges.ai.percentage > 30 ? '#f97316' : '#eab308'}
              warning={trustScore.badges.ai.percentage > 50}
            />
          )}
        </div>
      </div>

      {/* Expandable Details - Warm & Helpful */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-aurora-purple)] hover:text-[var(--color-aurora-violet)] transition-colors font-medium"
      >
        <Heart className="w-3 h-3" />
        <span>Why Aurora {trustScore.score >= 70 ? 'loves' : trustScore.score >= 50 ? 'notes' : 'flags'} this</span>
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
            <div className="p-4 bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 rounded-xl border border-[var(--color-aurora-purple)]/10 space-y-3">
              {/* Main Explanation - Warm & Personal */}
              <p className="text-sm text-[var(--foreground)] font-medium leading-relaxed">
                {trustScore.details.whyThisScore}
              </p>
              
              {/* Sisters Say - Community Voice */}
              {trustScore.details.sistersSay && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-aurora-pink)]/10 rounded-lg">
                  <span className="text-sm">💜</span>
                  <span className="text-xs text-[var(--color-aurora-purple)] font-medium">
                    {trustScore.details.sistersSay}
                  </span>
                </div>
              )}
              
              {/* Key Factors - Positive */}
              {trustScore.details.keyFactors.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-aurora-purple)] font-semibold mb-1.5">✨ What we love</p>
                  <ul className="text-xs text-[var(--foreground)]/80 space-y-1">
                    {trustScore.details.keyFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--color-aurora-mint)]">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Concerns - Gentle Warning */}
              {trustScore.details.concerns.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] font-semibold mb-1.5">⚡ Heads up</p>
                  <ul className="text-xs text-[var(--foreground)]/70 space-y-1">
                    {trustScore.details.concerns.map((concern, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--color-aurora-yellow)]">•</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Action Tip - Helpful Advice */}
              {trustScore.details.actionTip && (
                <div className="flex items-start gap-2 px-3 py-2 bg-[var(--color-aurora-mint)]/10 rounded-lg border border-[var(--color-aurora-mint)]/20">
                  <Lightbulb className="w-4 h-4 text-[var(--color-aurora-mint)] flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-[var(--foreground)]/80">
                    {trustScore.details.actionTip}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickBadge({ 
  emoji, 
  label, 
  color, 
  highlight = false,
  warning = false 
}: { 
  emoji: string; 
  label: string; 
  color: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all hover:scale-105 cursor-help ${
        highlight ? 'ring-2 ring-offset-1 ring-[var(--color-aurora-purple)]/30' : ''
      } ${warning ? 'animate-pulse' : ''}`}
      style={{ 
        background: highlight 
          ? `linear-gradient(135deg, ${color}20, ${color}10)` 
          : `${color}12`,
        color: color,
        border: `1.5px solid ${color}25`
      }}
      title={`${label}`}
    >
      <span className="text-sm">{emoji}</span>
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
