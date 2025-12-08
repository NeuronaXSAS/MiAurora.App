"use client";

/**
 * Share Case Modal - Share Judge verdicts to community for voting
 * 
 * Allows users to share their Aurora Judge cases (anonymously or with names)
 * for the community to vote and discuss.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    X, Scale, Users, Shield, Eye, EyeOff, Check,
    AlertTriangle, Share2, Loader2, Crown, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JudgeResult {
    winner: "person1" | "person2" | "tie" | "both_wrong";
    winnerLabel: string;
    loserLabel: string;
    toxicityScore: number;
    toxicityLevel: string;
    argumentType: string;
    caseNumber: string;
    suggestion: string;
    shareableId?: string;
}

interface ShareCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: JudgeResult;
    person1Label: string;
    person2Label: string;
    context: string;
}

// Generate anonymous session hash
async function generateSessionHash(): Promise<string> {
    const sessionData = `${navigator.userAgent}-${Date.now()}-${Math.random()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionData);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export function ShareCaseModal({
    isOpen,
    onClose,
    result,
    person1Label,
    person2Label,
    context,
}: ShareCaseModalProps) {
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [situation, setSituation] = useState(context.slice(0, 200) || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shareCase = useMutation(api.communityJudgeCases.shareCase);

    const handleShare = async () => {
        if (!situation.trim()) {
            setError("Please describe the situation briefly");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const sessionHash = await generateSessionHash();

            await shareCase({
                caseNumber: result.caseNumber,
                person1Label: isAnonymous ? "Person A" : person1Label,
                person2Label: isAnonymous ? "Person B" : person2Label,
                argumentType: result.argumentType,
                situation: situation.slice(0, 500),
                aiWinner: result.winner,
                aiToxicityScore: result.toxicityScore,
                aiSuggestion: result.suggestion,
                isAnonymous,
                sessionHash,
            });

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to share case:", err);
            setError(err instanceof Error ? err.message : "Failed to share. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-md bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Share to Community</h2>
                                        <p className="text-xs text-white/70">Let others vote on who's right</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Success State */}
                        {isSuccess ? (
                            <div className="p-8 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-aurora-mint)] flex items-center justify-center"
                                >
                                    <Check className="w-8 h-8 text-[var(--color-aurora-violet)]" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                                    Case Shared! 🎉
                                </h3>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    Your case is now live for community voting
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Content */}
                                <div className="p-4 space-y-4">
                                    {/* Case Preview */}
                                    <div className="p-3 rounded-xl bg-[var(--accent)] border border-[var(--border)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Scale className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                                            <span className="text-xs font-semibold text-[var(--foreground)]">
                                                Case #{result.caseNumber}
                                            </span>
                                            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                                                {result.argumentType}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Crown className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                                                <span className="text-sm font-medium text-[var(--foreground)]">
                                                    AI says: <span className="text-[var(--color-aurora-purple)]">{result.winnerLabel}</span> won
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Privacy Toggle */}
                                    <div>
                                        <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                                            Privacy Setting
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setIsAnonymous(true)}
                                                className={cn(
                                                    "flex items-center gap-2 p-3 rounded-xl border transition-all",
                                                    isAnonymous
                                                        ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                                                        : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50"
                                                )}
                                            >
                                                <EyeOff className={cn("w-4 h-4", isAnonymous ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]")} />
                                                <div className="text-left">
                                                    <p className={cn("text-sm font-medium", isAnonymous ? "text-[var(--color-aurora-purple)]" : "text-[var(--foreground)]")}>
                                                        Anonymous
                                                    </p>
                                                    <p className="text-[10px] text-[var(--muted-foreground)]">Names hidden</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setIsAnonymous(false)}
                                                className={cn(
                                                    "flex items-center gap-2 p-3 rounded-xl border transition-all",
                                                    !isAnonymous
                                                        ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                                                        : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50"
                                                )}
                                            >
                                                <Eye className={cn("w-4 h-4", !isAnonymous ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]")} />
                                                <div className="text-left">
                                                    <p className={cn("text-sm font-medium", !isAnonymous ? "text-[var(--color-aurora-purple)]" : "text-[var(--foreground)]")}>
                                                        Show Names
                                                    </p>
                                                    <p className="text-[10px] text-[var(--muted-foreground)]">{person1Label} vs {person2Label}</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Situation Description */}
                                    <div>
                                        <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                                            Describe the situation <span className="text-[var(--muted-foreground)]">(for voters)</span>
                                        </label>
                                        <textarea
                                            value={situation}
                                            onChange={(e) => setSituation(e.target.value)}
                                            placeholder="Briefly explain what the argument was about..."
                                            maxLength={500}
                                            rows={3}
                                            className="w-full p-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--color-aurora-purple)] resize-none"
                                        />
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-[var(--muted-foreground)]">
                                                No screenshots will be shared - privacy protected
                                            </span>
                                            <span className="text-[10px] text-[var(--muted-foreground)]">
                                                {situation.length}/500
                                            </span>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-aurora-salmon)]/10 border border-[var(--color-aurora-salmon)]/30">
                                            <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                                            <span className="text-sm text-[var(--color-aurora-salmon)]">{error}</span>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-aurora-mint)]/10 border border-[var(--color-aurora-mint)]/30">
                                        <Shield className="w-4 h-4 text-[var(--color-aurora-mint)] flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-[var(--foreground)]">
                                            Community members will vote on who they think is right. This is for fun and discussion only - not professional advice.
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/50">
                                    <button
                                        onClick={handleShare}
                                        disabled={isSubmitting || !situation.trim()}
                                        className="w-full h-12 rounded-xl bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sharing...
                                            </>
                                        ) : (
                                            <>
                                                <Share2 className="w-5 h-5" />
                                                Share for Community Vote
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-center text-[var(--muted-foreground)] mt-2">
                                        <Sparkles className="w-3 h-3 inline mr-1" />
                                        Earn 5 credits when others vote on your case
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ShareCaseModal;
