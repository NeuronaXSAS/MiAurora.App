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
          className="fixed bottom-4 left-4 right-4 z-[90] sm:left-auto sm:right-4 sm:max-w-md"
        >
          <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                {/* Gift Icon with animation */}
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Gift className="w-7 h-7 text-white" />
                </motion.div>

                <div className="flex-1 min-w-0 pr-6">
                  {/* Credit Badge */}
                  <Badge className="bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)] font-bold mb-2 text-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    +{credits} Free Credits
                  </Badge>

                  <h3 className="font-bold text-white text-lg mb-1">
                    Join Aurora App Today!
                  </h3>
                  <p className="text-white/80 text-sm mb-3">
                    Get {credits} credits instantly when you sign up. Use them for premium features!
                  </p>

                  {/* Social proof */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {["👩‍💻", "👩‍🎨", "👩‍⚕️", "👩‍🔬"].map((emoji, i) => (
                        <div 
                          key={i}
                          className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs border-2 border-[var(--color-aurora-purple)]"
                        >
                          {emoji}
                        </div>
                      ))}
                    </div>
                    <span className="text-white/70 text-xs">
                      <Users className="w-3 h-3 inline mr-1" />
                      10,000+ women joined
                    </span>
                  </div>

                  {/* CTA Button */}
                  <Link href="/api/auth/login?provider=GoogleOAuth">
                    <Button 
                      className="w-full bg-white text-[var(--color-aurora-purple)] hover:bg-white/90 font-bold rounded-xl min-h-[48px] shadow-lg"
                    >
                      Claim Your {credits} Credits
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom trust bar */}
            <div className="px-4 sm:px-5 py-2 bg-black/10 border-t border-white/10">
              <p className="text-white/60 text-xs text-center">
                🔒 No credit card required • Free forever tier available
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
