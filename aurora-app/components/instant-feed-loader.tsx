"use client";

/**
 * Instant Feed Loader - Optimistic UI for PWA
 * 
 * Shows cached/placeholder content immediately while real data loads.
 * Critical for PWA experience on miaurora.app
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, Briefcase } from "lucide-react";

// Placeholder content that shows Aurora App's value immediately
const INSTANT_PLACEHOLDERS = [
  {
    type: "safety",
    icon: Shield,
    title: "Safety First",
    subtitle: "Community-powered safety intelligence",
    color: "var(--color-aurora-mint)",
  },
  {
    type: "community", 
    icon: Heart,
    title: "Sister Support",
    subtitle: "Connect with women who understand",
    color: "var(--color-aurora-pink)",
  },
  {
    type: "opportunity",
    icon: Briefcase,
    title: "Career Growth",
    subtitle: "Opportunities from women-friendly employers",
    color: "var(--color-aurora-blue)",
  },
];

interface InstantFeedLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function InstantFeedLoader({ isLoading, children }: InstantFeedLoaderProps) {
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  // Rotate through placeholders while loading
  useEffect(() => {
    if (!isLoading) {
      // Small delay before hiding to prevent flash
      const timer = setTimeout(() => setShowPlaceholders(false), 100);
      return () => clearTimeout(timer);
    }
    
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % INSTANT_PLACEHOLDERS.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!showPlaceholders) {
    return <>{children}</>;
  }

  const placeholder = INSTANT_PLACEHOLDERS[currentPlaceholder];
  const Icon = placeholder.icon;

  return (
    <div className="space-y-4">
      {/* Animated value proposition */}
      <motion.div
        key={currentPlaceholder}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl p-6 text-center"
      >
        <div 
          className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ backgroundColor: `${placeholder.color}20` }}
        >
          <Icon className="w-7 h-7" style={{ color: placeholder.color }} />
        </div>
        <h3 className="font-semibold text-[var(--foreground)] mb-1">{placeholder.title}</h3>
        <p className="text-sm text-[var(--muted-foreground)]">{placeholder.subtitle}</p>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--color-aurora-purple)]"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Skeleton cards */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 skeleton-shimmer"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-[var(--accent)] rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--accent)] rounded w-32 mb-2" />
                <div className="h-3 bg-[var(--accent)] rounded w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[var(--accent)] rounded w-full" />
              <div className="h-4 bg-[var(--accent)] rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Optimistic action feedback
 * Shows immediate visual feedback before server confirms
 */
export function OptimisticAction({ 
  children, 
  onAction,
  successMessage = "Done!",
}: { 
  children: React.ReactNode;
  onAction: () => Promise<void>;
  successMessage?: string;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const handleAction = async () => {
    setStatus("pending");
    try {
      await onAction();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="relative" onClick={handleAction}>
      {children}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-[var(--color-aurora-mint)]/90 rounded-xl"
          >
            <span className="text-[var(--color-aurora-violet)] font-medium text-sm">
              {successMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
