"use client";

/**
 * Task 11.1: Debate Feed Card
 * Shows trending debates in the main feed
 */

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Vote, MessageCircle, TrendingUp, ExternalLink,
  ThumbsUp, ThumbsDown, Minus, Users
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface DebateFeedCardProps {
  debate: {
    _id: Id<"dailyDebates">;
    title: string;
    summary?: string;
    category: string;
    sourceUrl?: string;
    sourceName?: string;
    imageUrl?: string;
    agreeCount: number;
    disagreeCount: number;
    neutralCount: number;
    totalVotes: number;
  };
  onVote?: (debateId: Id<"dailyDebates">, vote: "agree" | "disagree" | "neutral") => void;
}

const categoryColors: Record<string, string> = {
  politics: "var(--color-aurora-purple)",
  economy: "var(--color-aurora-yellow)",
  society: "var(--color-aurora-pink)",
  technology: "var(--color-aurora-blue)",
  health: "var(--color-aurora-mint)",
  culture: "var(--color-aurora-lavender)",
};

export function DebateFeedCard({ debate, onVote }: DebateFeedCardProps) {
  const total = debate.totalVotes || 1;
  const agreePercent = Math.round((debate.agreeCount / total) * 100);
  const disagreePercent = Math.round((debate.disagreeCount / total) * 100);
  const neutralPercent = 100 - agreePercent - disagreePercent;

  const categoryColor = categoryColors[debate.category] || "var(--color-aurora-purple)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 transition-all bg-[var(--card)]">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Debate Icon */}
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Vote className="w-5 h-5" style={{ color: categoryColor }} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge 
                  className="text-[9px] border-0 h-5"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  <TrendingUp className="w-2.5 h-2.5 mr-1" />
                  Trending Debate
                </Badge>
                <Badge className="text-[9px] bg-[var(--accent)] text-[var(--muted-foreground)] border-0 h-5">
                  {debate.category}
                </Badge>
                <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 ml-auto">
                  <Users className="w-3 h-3" />
                  {debate.totalVotes} votes
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-[var(--foreground)] text-sm leading-tight line-clamp-2">
                {debate.title}
              </h3>

              {/* Summary */}
              {debate.summary && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1.5 line-clamp-2">
                  {debate.summary}
                </p>
              )}

              {/* Source */}
              {debate.sourceName && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    Source: {debate.sourceName}
                  </span>
                  {debate.sourceUrl && (
                    <a 
                      href={debate.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[var(--color-aurora-purple)] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vote Distribution Bar */}
        <div className="px-4 pb-3">
          <div className="h-2 rounded-full overflow-hidden flex bg-[var(--accent)]">
            <div 
              className="h-full bg-[var(--color-aurora-mint)] transition-all"
              style={{ width: `${agreePercent}%` }}
            />
            <div 
              className="h-full bg-[var(--color-aurora-lavender)] transition-all"
              style={{ width: `${neutralPercent}%` }}
            />
            <div 
              className="h-full bg-[var(--color-aurora-salmon)] transition-all"
              style={{ width: `${disagreePercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px]">
            <span className="text-[var(--color-aurora-mint)] flex items-center gap-0.5">
              <ThumbsUp className="w-2.5 h-2.5" /> {agreePercent}%
            </span>
            <span className="text-[var(--muted-foreground)] flex items-center gap-0.5">
              <Minus className="w-2.5 h-2.5" /> {neutralPercent}%
            </span>
            <span className="text-[var(--color-aurora-salmon)] flex items-center gap-0.5">
              <ThumbsDown className="w-2.5 h-2.5" /> {disagreePercent}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-[var(--accent)]/30 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs hover:bg-[var(--color-aurora-mint)]/20 hover:text-[var(--color-aurora-violet)]"
              onClick={() => onVote?.(debate._id, "agree")}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
              Agree
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs hover:bg-[var(--color-aurora-salmon)]/20 hover:text-[var(--color-aurora-salmon)]"
              onClick={() => onVote?.(debate._id, "disagree")}
            >
              <ThumbsDown className="w-3.5 h-3.5 mr-1" />
              Disagree
            </Button>
          </div>
          
          <Link href="/">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-[var(--color-aurora-purple)]/30 text-[var(--color-aurora-purple)]"
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" />
              Join Discussion
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
