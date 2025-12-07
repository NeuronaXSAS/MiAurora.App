"use client";

/**
 * Aurora App - Reel Ad Component
 * 
 * Full-screen ad that appears between reels, similar to TikTok/Instagram.
 * - Blends seamlessly with reel content
 * - Skippable after 3 seconds
 * - Premium users don't see ads
 * - Elegant placeholder sponsors when AdSense not configured
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, 
  Sparkles, 
  Shield, 
  Briefcase, 
  Heart, 
  GraduationCap,
  ChevronUp,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Aurora App's AdSense Publisher ID
const ADSENSE_CLIENT_ID = "ca-pub-9358935810206071";

interface ReelAdProps {
  isActive: boolean;
  isPremium?: boolean;
  onSkip?: () => void;
}

// Placeholder sponsor ads - shown when AdSense not configured
const SPONSOR_ADS = [
  {
    id: "women-tech",
    title: "Women in Tech Summit 2025",
    description: "Join 10,000+ women leaders shaping the future of technology. Network, learn, and grow together.",
    cta: "Get Early Bird Tickets",
    url: "#",
    icon: Sparkles,
    gradient: "from-[var(--color-aurora-purple)] via-[var(--color-aurora-pink)] to-[var(--color-aurora-violet)]",
    accentColor: "var(--color-aurora-pink)",
    tagline: "March 15-17, 2025 • San Francisco",
  },
  {
    id: "safe-workplace",
    title: "Safe Workplace Certification",
    description: "Get your company certified as a safe workplace for women. Build trust and attract top talent.",
    cta: "Start Certification",
    url: "#",
    icon: Shield,
    gradient: "from-[var(--color-aurora-mint)] via-[var(--color-aurora-blue)] to-[var(--color-aurora-purple)]",
    accentColor: "var(--color-aurora-mint)",
    tagline: "Trusted by 500+ companies worldwide",
  },
  {
    id: "startup-fund",
    title: "Women Founders Fund",
    description: "$50M available for women-led startups. No pitch deck required for initial application.",
    cta: "Apply Now",
    url: "#",
    icon: Briefcase,
    gradient: "from-[var(--color-aurora-yellow)] via-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]",
    accentColor: "var(--color-aurora-yellow)",
    tagline: "Applications close January 31",
  },
  {
    id: "career-coaching",
    title: "Free Career Coaching",
    description: "1-on-1 mentorship from senior women in your industry. Get matched with your perfect mentor.",
    cta: "Get Matched Free",
    url: "#",
    icon: GraduationCap,
    gradient: "from-[var(--color-aurora-blue)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]",
    accentColor: "var(--color-aurora-blue)",
    tagline: "5,000+ mentors • 50+ industries",
  },
  {
    id: "health-initiative",
    title: "Women's Health Initiative",
    description: "Free health screenings, wellness resources, and community support for women everywhere.",
    cta: "Learn More",
    url: "#",
    icon: Heart,
    gradient: "from-[var(--color-aurora-pink)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)]",
    accentColor: "var(--color-aurora-pink)",
    tagline: "Your health matters 💜",
  },
];

export function ReelAd({ isActive, isPremium = false, onSkip }: ReelAdProps) {
  const [canSkip, setCanSkip] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(3);
  const [adIndex] = useState(() => Math.floor(Math.random() * SPONSOR_ADS.length));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const ad = SPONSOR_ADS[adIndex];
  const AdIcon = ad.icon;

  // Premium users don't see ads
  if (isPremium) return null;

  // Countdown timer for skip button
  useEffect(() => {
    if (!isActive) {
      setCanSkip(false);
      setSkipCountdown(3);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSkipCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  return (
    <div 
      className="h-[calc(100vh-60px)] w-full snap-start snap-always relative overflow-hidden"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${ad.gradient}`} />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/20"
            initial={{ 
              x: Math.random() * 400, 
              y: Math.random() * 800,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, -100],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Sponsored Badge */}
      <div className="absolute top-4 left-4 z-20">
        <Badge className="bg-black/30 backdrop-blur-sm text-white border-white/20 text-xs">
          Sponsored
        </Badge>
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20">
        <AnimatePresence mode="wait">
          {canSkip ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onSkip}
                className="bg-black/30 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 min-h-[44px] px-4"
              >
                Skip Ad
                <ChevronUp className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm"
            >
              Skip in {skipCountdown}s
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white text-center z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
          className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl"
        >
          <AdIcon className="w-12 h-12" style={{ color: ad.accentColor }} />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl sm:text-4xl font-bold mb-3 max-w-md"
        >
          {ad.title}
        </motion.h2>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 text-sm mb-4"
        >
          {ad.tagline}
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-white/90 mb-8 max-w-sm"
        >
          {ad.description}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            size="lg"
            className="bg-white text-[var(--color-aurora-violet)] hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-full shadow-xl min-h-[56px]"
          >
            {ad.cta}
            <ExternalLink className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Aurora App Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-2 text-white/50 text-xs"
        >
          <span>Ads support Aurora App</span>
          <span>•</span>
          <span>Safety features always free</span>
        </motion.div>
      </div>

      {/* Swipe Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-24 left-0 right-0 flex flex-col items-center text-white/60"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronUp className="w-6 h-6" />
        </motion.div>
        <span className="text-xs">Swipe up for more</span>
      </motion.div>
    </div>
  );
}

/**
 * Helper function to determine if an ad should be shown at a given index
 * Shows ad every 5 reels (after positions 4, 9, 14, etc.)
 */
export function shouldShowReelAd(index: number): boolean {
  return index > 0 && (index + 1) % 5 === 0;
}
