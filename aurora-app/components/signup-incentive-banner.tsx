"use client";

/**
 * Signup Incentive Banner
 * 
 * Floating banner that follows users on the landing page,
 * encouraging them to join with a credit bonus incentive.
 * Similar to cookie consent - persistent until dismissed.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Gift, ArrowRight, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const SIGNUP_BANNER_DISMISSED_KEY = "aurora-signup-banner-dismissed";

interface SignupIncentiveBannerProps {
  credits?: number;
  showAfterScroll?: number; // pixels to scroll before showing
}

export function SignupIncentiveBanner({ 
  credits = 25, 
  showAfterScroll = 300 
}: SignupIncentiveBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(SIGNUP_BANNER_DISMISSED_KEY);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after scroll threshold
    const handleScroll = () => {
      if (window.scrollY > showAfterScroll && !isDismissed) {
        setIsVisible(true);
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem(SIGNUP_BANNER_DISMISSED_KEY, "true");
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-[90] max-w-[280px]"
        >
          {/* Compact Signup Banner */}
          <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-xl shadow-xl overflow-hidden border border-white/20">
            <div className="p-3 flex items-center gap-3">
              <Gift className="w-5 h-5 text-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  <span className="text-[var(--color-aurora-yellow)] font-bold">+{credits} credits</span> when you join
                </p>
              </div>
              <Link href="/api/auth/login?provider=GoogleOAuth">
                <Button 
                  size="sm"
                  className="bg-white text-[var(--color-aurora-purple)] hover:bg-white/90 font-bold rounded-lg min-h-[36px] px-4"
                >
                  Join
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
