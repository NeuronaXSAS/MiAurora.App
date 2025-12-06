"use client";

/**
 * Community Vote Buttons - Community Truth Score™
 * 
 * Warm, inviting vote buttons for search results.
 * Allows anonymous voting on trustworthiness.
 * 
 * Design: Aurora brand colors, 44px touch targets, celebration animations
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Sparkles, Heart } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  generateAnonymousSessionHash,
  generateUrlHash,
  getCurrentHourKey,
  getLocalVote,
  setLocalVote,
} from "@/lib/anonymous-session";

interface CommunityVoteButtonsProps {
  url: string;
  urlHash?: string; // Pre-computed hash (optional)
  initialVote?: "trust" | "flag" | null;
  onVote?: (vote: "trust" | "flag") => void;
  compact?: boolean;
}

export function CommunityVoteButtons({
  url,
  urlHash: precomputedHash,
  initialVote,
  onVote,
  compact = false,
}: CommunityVoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState<"trust" | "flag" | null>(initialVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [urlHash, setUrlHash] = useState(precomputedHash || "");
  const [sessionHash, setSessionHash] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recordVote = useMutation(api.communityTruth.recordVote);

  // Initialize hashes
  useEffect(() => {
    async function init() {
      if (!precomputedHash) {
        const hash = await generateUrlHash(url);
        setUrlHash(hash);
        
        // Check local cache for existing vote
        const localVote = getLocalVote(hash);
        if (localVote && !initialVote) {
          setCurrentVote(localVote);
        }
      }
      
      const session = await generateAnonymousSessionHash();
      setSessionHash(session);
    }
    init();
  }, [url, precomputedHash, initialVote]);

  const handleVote = useCallback(async (vote: "trust" | "flag") => {
    if (isVoting || !urlHash || !sessionHash) return;
    
    // Optimistic update
    const previousVote = currentVote;
    setCurrentVote(vote);
    setIsVoting(true);
    setError(null);

    try {
      const hourKey = getCurrentHourKey();
      await recordVote({ urlHash, sessionHash, vote, hourKey });
      
      // Save to local cache
      setLocalVote(urlHash, vote);
      
      // Show celebration for trust votes
      if (vote === "trust") {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }
      
      onVote?.(vote);
    } catch (err: any) {
      // Revert on error
      setCurrentVote(previousVote);
      
      if (err.message === "RATE_LIMIT_EXCEEDED") {
        setError("You're voting fast! Take a breath 💜");
      } else {
        setError("Vote saved locally, syncing...");
        // Still save locally for offline support
        setLocalVote(urlHash, vote);
      }
    } finally {
      setIsVoting(false);
    }
  }, [urlHash, sessionHash, currentVote, isVoting, recordVote, onVote]);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleVote("trust")}
          disabled={isVoting}
          className={`p-2 rounded-lg transition-all min-w-[36px] min-h-[36px] ${
            currentVote === "trust"
              ? "bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]"
              : "hover:bg-[var(--color-aurora-mint)]/20 text-[var(--muted-foreground)]"
          }`}
          title="Trust this source"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleVote("flag")}
          disabled={isVoting}
          className={`p-2 rounded-lg transition-all min-w-[36px] min-h-[36px] ${
            currentVote === "flag"
              ? "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
              : "hover:bg-[var(--color-aurora-salmon)]/10 text-[var(--muted-foreground)]"
          }`}
          title="Flag as misleading"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vote Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)] mr-1">
          Is this trustworthy?
        </span>
        
        {/* Trust Button */}
        <motion.button
          onClick={() => handleVote("trust")}
          disabled={isVoting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-h-[44px] ${
            currentVote === "trust"
              ? "bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] shadow-md"
              : "bg-[var(--color-aurora-mint)]/20 hover:bg-[var(--color-aurora-mint)]/40 text-[var(--foreground)]"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${currentVote === "trust" ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">Trust</span>
        </motion.button>

        {/* Flag Button */}
        <motion.button
          onClick={() => handleVote("flag")}
          disabled={isVoting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all min-h-[44px] ${
            currentVote === "flag"
              ? "bg-[var(--color-aurora-salmon)]/30 text-[var(--color-aurora-salmon)] shadow-md"
              : "bg-[var(--accent)] hover:bg-[var(--color-aurora-salmon)]/20 text-[var(--muted-foreground)]"
          }`}
        >
          <ThumbsDown className={`w-4 h-4 ${currentVote === "flag" ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">Flag</span>
        </motion.button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-[var(--color-aurora-purple)] mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  scale: 0,
                  x: 20 + Math.random() * 40,
                  y: 10
                }}
                animate={{ 
                  opacity: 0, 
                  scale: 1,
                  y: -30 - Math.random() * 20,
                  x: 20 + Math.random() * 60
                }}
                transition={{ 
                  duration: 0.8 + Math.random() * 0.4,
                  delay: i * 0.1
                }}
                className="absolute"
              >
                {i % 2 === 0 ? (
                  <Heart className="w-4 h-4 text-[var(--color-aurora-pink)] fill-current" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[var(--color-aurora-yellow)]" />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
