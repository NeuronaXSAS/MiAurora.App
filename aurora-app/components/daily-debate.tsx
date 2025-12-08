"use client";

/**
 * Daily Debate Component - Interactive Discussion Driver
 * 
 * Shows today's debate topic with voting and comments.
 * Designed to spark engagement and generate organic content.
 * 
 * Users earn credits for:
 * - Voting: +2 credits
 * - Commenting: +5 credits
 * - Suggesting debates: +10 credits
 */

import { useState, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Sparkles,
  Globe,
  ChevronRight,
  Plus,
  Check,
  Users,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyDebateProps {
  userId: Id<"users">;
  language?: string;
  compact?: boolean;
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  ar: "العربية",
  hi: "हिन्दी",
};

export const DailyDebate = memo(function DailyDebate({
  userId,
  language = "en",
  compact = false,
}: DailyDebateProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [showCreditAnimation, setShowCreditAnimation] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);

  // Fetch today's debate
  const debate = useQuery(api.contentGeneration.getTodayDebate, { language });
  const voteOnDebate = useMutation(api.contentGeneration.voteOnDebate);
  const suggestDebate = useMutation(api.contentGeneration.suggestDebate);

  const handleVote = async (optionIndex: number) => {
    if (hasVoted || !debate) return;

    setSelectedOption(optionIndex);
    
    try {
      const result = await voteOnDebate({
        debateId: debate._id,
        optionIndex,
        userId,
      });

      if (result.success) {
        setHasVoted(true);
        setCreditsEarned(result.creditsEarned || 2);
        setShowCreditAnimation(true);
        setTimeout(() => setShowCreditAnimation(false), 2000);
      }
    } catch (error) {
      console.error("Vote failed:", error);
      setSelectedOption(null);
    }
  };

  // Calculate vote percentages
  const getVotePercentage = (optionIndex: number): number => {
    if (!debate || debate.totalVotes === 0) return 0;
    const votes = debate.votes?.[optionIndex] || 0;
    return Math.round((votes / debate.totalVotes) * 100);
  };

  // Loading state
  if (debate === undefined) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)] animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-3" />
          <div className="space-y-2">
            <div className="h-10 bg-[var(--muted)] rounded" />
            <div className="h-10 bg-[var(--muted)] rounded" />
            <div className="h-10 bg-[var(--muted)] rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No debate available
  if (!debate) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardContent className="p-4 text-center">
          <MessageSquare className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No debate today. Be the first to suggest one!
          </p>
          <Button
            onClick={() => setShowSuggestDialog(true)}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            Suggest Debate
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact view for sidebar
  if (compact) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-3">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4" />
            Daily Debate
          </h3>
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2 mb-2">
            {debate.topic}
          </p>
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {debate.totalVotes} votes
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-xs">
              Vote Now
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <>
      <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Daily Debate
            </h3>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {LANGUAGE_NAMES[language] || language}
              </Badge>
              <Badge className="bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)] border-0 text-xs">
                +2 credits
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Question */}
          <p className="text-lg font-semibold text-[var(--foreground)] mb-4">
            {debate.topic}
          </p>

          {/* Category badge */}
          <Badge className="mb-4 bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] border-0">
            {debate.category}
          </Badge>

          {/* Options */}
          <div className="space-y-2">
            {(debate.options || []).map((option: string, index: number) => {
              const percentage = getVotePercentage(index);
              const isSelected = selectedOption === index;
              const isWinning = hasVoted && percentage === Math.max(...(debate.options || []).map((_: string, i: number) => getVotePercentage(i)));

              return (
                <motion.button
                  key={index}
                  onClick={() => handleVote(index)}
                  disabled={hasVoted}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all relative overflow-hidden min-h-[48px]",
                    hasVoted
                      ? isSelected
                        ? "bg-[var(--color-aurora-purple)]/20 border-2 border-[var(--color-aurora-purple)]"
                        : "bg-[var(--accent)] border-2 border-transparent"
                      : "bg-[var(--accent)] border-2 border-transparent hover:border-[var(--color-aurora-purple)]/30"
                  )}
                  whileTap={!hasVoted ? { scale: 0.98 } : {}}
                >
                  {/* Progress bar background */}
                  {hasVoted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-xl",
                        isWinning
                          ? "bg-[var(--color-aurora-purple)]/20"
                          : "bg-[var(--muted)]/30"
                      )}
                    />
                  )}

                  <div className="relative flex items-center justify-between">
                    <span className={cn(
                      "font-medium",
                      isSelected ? "text-[var(--color-aurora-purple)]" : "text-[var(--foreground)]"
                    )}>
                      {option}
                    </span>
                    
                    {hasVoted && (
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Check className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                        )}
                        <span className={cn(
                          "text-sm font-semibold",
                          isWinning ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]"
                        )}>
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {debate.totalVotes} votes
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {debate.commentCount || 0} comments
              </span>
            </div>
            
            <Button
              onClick={() => setShowSuggestDialog(true)}
              variant="ghost"
              size="sm"
              className="text-[var(--color-aurora-purple)]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Suggest
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credit Animation */}
      <AnimatePresence>
        {showCreditAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed bottom-20 right-4 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">+{creditsEarned} credits!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggest Debate Dialog */}
      <SuggestDebateDialog
        isOpen={showSuggestDialog}
        onClose={() => setShowSuggestDialog(false)}
        userId={userId}
        onSubmit={suggestDebate}
      />
    </>
  );
});

// Suggest Debate Dialog Component
function SuggestDebateDialog({
  isOpen,
  onClose,
  userId,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users">;
  onSubmit: any;
}) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("career");
  const [options, setOptions] = useState(["", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: "career", label: "Career" },
    { value: "safety", label: "Safety" },
    { value: "wellness", label: "Wellness" },
    { value: "travel", label: "Travel" },
    { value: "finance", label: "Finance" },
    { value: "relationships", label: "Relationships" },
  ];

  const handleSubmit = async () => {
    if (!topic.trim() || options.filter(o => o.trim()).length < 2) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        topic: topic.trim(),
        category,
        options: options.filter(o => o.trim()),
        userId,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setTopic("");
        setOptions(["", "", ""]);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit suggestion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[var(--card)] border-[var(--border)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Plus className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Suggest a Debate
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-[var(--color-aurora-mint)] rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Thank you!
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your suggestion has been submitted. You earned +10 credits!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Topic */}
              <div>
                <Label className="text-[var(--foreground)]">Debate Topic</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Should companies offer unlimited PTO?"
                  className="mt-1 bg-[var(--accent)] border-[var(--border)]"
                  maxLength={200}
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-[var(--foreground)]">Category</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm transition-all",
                        category === cat.value
                          ? "bg-[var(--color-aurora-purple)] text-white"
                          : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-lavender)]/30"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <Label className="text-[var(--foreground)]">Answer Options (2-3)</Label>
                <div className="space-y-2 mt-1">
                  {options.map((option, index) => (
                    <Input
                      key={index}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[index] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="bg-[var(--accent)] border-[var(--border)]"
                      maxLength={100}
                    />
                  ))}
                </div>
              </div>

              {/* Credit reward */}
              <div className="flex items-center gap-2 p-3 bg-[var(--color-aurora-yellow)]/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                <span className="text-sm text-[var(--foreground)]">
                  You'll earn <strong>+10 credits</strong> for suggesting a debate!
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!topic.trim() || options.filter(o => o.trim()).length < 2 || isSubmitting}
                className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/90"
              >
                {isSubmitting ? "Submitting..." : "Submit Suggestion"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
