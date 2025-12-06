"use client";

/**
 * Community Truth Badge - Community Truth Score™
 * 
 * Displays the community's collective trust score for a search result.
 * Shows confidence level and vote count.
 * 
 * Design: Aurora brand colors, warm feminine aesthetic
 */

import { motion } from "framer-motion";
import { Users, TrendingUp, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface CommunityTruthBadgeProps {
  communityScore: number | null;
  totalVotes: number;
  confidenceLevel: "building" | "low" | "medium" | "high";
  label?: string;
  compact?: boolean;
}

export function CommunityTruthBadge({
  communityScore,
  totalVotes,
  confidenceLevel,
  label,
  compact = false,
}: CommunityTruthBadgeProps) {
  // Get color based on score
  const getScoreColor = () => {
    if (communityScore === null) return "var(--muted-foreground)";
    if (communityScore >= 70) return "var(--color-aurora-mint)";
    if (communityScore >= 40) return "var(--color-aurora-yellow)";
    return "var(--color-aurora-salmon)";
  };

  // Get icon based on confidence
  const getConfidenceIcon = () => {
    switch (confidenceLevel) {
      case "high":
        return <CheckCircle2 className="w-3 h-3" />;
      case "medium":
        return <TrendingUp className="w-3 h-3" />;
      case "low":
        return <HelpCircle className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div 
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
          style={{ 
            backgroundColor: `color-mix(in srgb, ${getScoreColor()} 20%, transparent)`,
            color: getScoreColor()
          }}
        >
          <Users className="w-3 h-3" />
          {communityScore !== null ? (
            <span>{communityScore}</span>
          ) : (
            <span className="text-[var(--muted-foreground)]">—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Score Display */}
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
          style={{ 
            backgroundColor: `color-mix(in srgb, ${getScoreColor()} 15%, transparent)`,
          }}
        >
          <Users className="w-4 h-4" style={{ color: getScoreColor() }} />
          {communityScore !== null ? (
            <motion.span 
              key={communityScore}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold"
              style={{ color: getScoreColor() }}
            >
              {communityScore}
            </motion.span>
          ) : (
            <span className="text-sm text-[var(--muted-foreground)]">—</span>
          )}
        </div>
        
        {/* Confidence Indicator */}
        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          {getConfidenceIcon()}
          <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Label */}
      {label && (
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      )}
    </div>
  );
}

/**
 * Perception Gap Indicator
 * 
 * Shows the difference between AI Score and Community Score.
 * Highlights when there's significant disagreement.
 */
interface PerceptionGapIndicatorProps {
  aiScore: number;
  communityScore: number | null;
  totalVotes: number;
  showLabels?: boolean;
}

export function PerceptionGapIndicator({
  aiScore,
  communityScore,
  totalVotes,
  showLabels = true,
}: PerceptionGapIndicatorProps) {
  // Don't show gap if not enough votes
  if (communityScore === null || totalVotes < 5) {
    return null;
  }

  const gap = aiScore - communityScore;
  const absGap = Math.abs(gap);
  const isSignificant = absGap >= 15;

  // Get gap indicator
  const getGapInfo = () => {
    if (absGap < 10) {
      return { 
        type: "aligned", 
        label: "AI & Sisters agree", 
        emoji: "🤝",
        color: "var(--color-aurora-mint)"
      };
    }
    if (gap > 0) {
      return { 
        type: "ai-higher", 
        label: "AI trusts more", 
        emoji: "🤖",
        color: "var(--color-aurora-purple)"
      };
    }
    return { 
      type: "community-higher", 
      label: "Sisters trust more", 
      emoji: "💜",
      color: "var(--color-aurora-pink)"
    };
  };

  const gapInfo = getGapInfo();

  if (!isSignificant && !showLabels) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-2"
    >
      {/* Visual Comparison Bar */}
      <div className="flex items-center gap-2">
        {/* AI Score */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--muted-foreground)]">AI</span>
          <div className="w-8 h-6 rounded-md bg-[var(--color-aurora-purple)]/20 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--color-aurora-purple)]">{aiScore}</span>
          </div>
        </div>

        {/* Gap Indicator */}
        <div 
          className="flex-1 h-1.5 rounded-full relative overflow-hidden"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {/* Gradient showing the gap */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(absGap, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              background: isSignificant 
                ? `linear-gradient(90deg, var(--color-aurora-purple), var(--color-aurora-pink))`
                : gapInfo.color
            }}
          />
        </div>

        {/* Community Score */}
        <div className="flex items-center gap-1">
          <div className="w-8 h-6 rounded-md bg-[var(--color-aurora-pink)]/20 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--color-aurora-pink)]">{communityScore}</span>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">Sisters</span>
        </div>
      </div>

      {/* Gap Label */}
      {showLabels && (
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm">{gapInfo.emoji}</span>
          <span 
            className="text-xs font-medium"
            style={{ color: gapInfo.color }}
          >
            {gapInfo.label}
          </span>
          {isSignificant && (
            <span className="text-xs text-[var(--muted-foreground)]">
              ({absGap} point gap)
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Combined AI vs Community Score Display
 * 
 * Shows both scores side-by-side with perception gap.
 */
interface AIvsCommunityScoreProps {
  aiScore: number;
  communityScore: number | null;
  totalVotes: number;
  confidenceLevel: "building" | "low" | "medium" | "high";
  compact?: boolean;
}

export function AIvsCommunityScore({
  aiScore,
  communityScore,
  totalVotes,
  confidenceLevel,
  compact = false,
}: AIvsCommunityScoreProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {/* AI Score */}
        <div className="flex items-center gap-1">
          <span className="text-[var(--muted-foreground)]">AI:</span>
          <span className="font-bold text-[var(--color-aurora-purple)]">{aiScore}</span>
        </div>
        
        <span className="text-[var(--muted-foreground)]">vs</span>
        
        {/* Community Score */}
        <div className="flex items-center gap-1">
          <span className="text-[var(--muted-foreground)]">Sisters:</span>
          {communityScore !== null ? (
            <span className="font-bold text-[var(--color-aurora-pink)]">{communityScore}</span>
          ) : (
            <span className="text-[var(--muted-foreground)]">—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-[var(--accent)]/50 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--foreground)]">
          Trust Comparison
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {totalVotes} community vote{totalVotes !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Scores Side by Side */}
      <div className="flex items-center justify-around">
        {/* AI Score */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-[var(--color-aurora-purple)]/20 flex items-center justify-center mb-1">
            <span className="text-xl font-bold text-[var(--color-aurora-purple)]">{aiScore}</span>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">AI Score</span>
        </div>

        {/* VS */}
        <div className="text-lg text-[var(--muted-foreground)]">vs</div>

        {/* Community Score */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-[var(--color-aurora-pink)]/20 flex items-center justify-center mb-1">
            {communityScore !== null ? (
              <span className="text-xl font-bold text-[var(--color-aurora-pink)]">{communityScore}</span>
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">...</span>
            )}
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">Sisters</span>
        </div>
      </div>

      {/* Perception Gap */}
      <PerceptionGapIndicator
        aiScore={aiScore}
        communityScore={communityScore}
        totalVotes={totalVotes}
        showLabels={true}
      />
    </div>
  );
}
