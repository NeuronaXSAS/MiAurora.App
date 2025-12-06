"use client";

/**
 * Value Proposition Banner
 * 
 * Shows Aurora App's core value to users in a beautiful, WARM, premium way.
 * REDESIGNED: More feminine, warmer colors, better icons, premium feel.
 */

import { useState, useEffect } from "react";
import { Shield, Users, Briefcase, Heart, X, Sparkles, MapPin, MessageCircle, Compass, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ValuePropositionBannerProps {
  variant?: "hero" | "inline" | "minimal";
  dismissible?: boolean;
  className?: string;
}

const valueProps = [
  {
    icon: Shield,
    emoji: "🛡️",
    title: "Safety Intelligence",
    description: "Real-time safety ratings by women, for women",
    color: "#22c55e", // Aurora Mint
    bgGradient: "from-emerald-500/20 to-teal-500/10",
    href: "/map",
  },
  {
    icon: Heart,
    emoji: "💜",
    title: "Sister Circles",
    description: "Private communities that truly understand",
    color: "#a855f7", // Aurora Purple
    bgGradient: "from-purple-500/20 to-pink-500/10",
    href: "/circles",
  },
  {
    icon: Compass,
    emoji: "✨",
    title: "Safe Routes",
    description: "Navigate confidently with community insights",
    color: "#f29de5", // Aurora Pink
    bgGradient: "from-pink-500/20 to-rose-500/10",
    href: "/map",
  },
  {
    icon: Star,
    emoji: "💼",
    title: "Opportunities",
    description: "Career growth with women who lift each other",
    color: "#eab308", // Aurora Yellow
    bgGradient: "from-amber-500/20 to-yellow-500/10",
    href: "/opportunities",
  },
];

export function ValuePropositionBanner({ 
  variant = "inline", 
  dismissible = true,
  className = "" 
}: ValuePropositionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Rotate through value props for minimal variant
  useEffect(() => {
    if (variant === "minimal") {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % valueProps.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  // Check if user has dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("aurora-value-banner-dismissed");
    if (dismissed && dismissible) {
      setIsVisible(false);
    }
  }, [dismissible]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("aurora-value-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  // MINIMAL VARIANT - Warm, rotating banner
  if (variant === "minimal") {
    const activeProp = valueProps[activeIndex];
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative overflow-hidden rounded-2xl ${className}`}
      >
        {/* Warm gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-r ${activeProp.bgGradient} opacity-50`} />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5" />
        
        <Link href={activeProp.href} className="relative flex items-center gap-4 p-4 group">
          {/* Animated Icon Container */}
          <motion.div 
            key={activeIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
            style={{ 
              background: `linear-gradient(135deg, ${activeProp.color}30, ${activeProp.color}15)`,
              border: `2px solid ${activeProp.color}30`
            }}
          >
            <span className="text-xl">{activeProp.emoji}</span>
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{activeProp.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{activeProp.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {valueProps.map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === activeIndex 
                    ? 'bg-[var(--color-aurora-purple)] w-4' 
                    : 'bg-[var(--color-aurora-purple)]/30'
                }`}
              />
            ))}
          </div>
        </Link>
        
        {dismissible && (
          <button
            onClick={(e) => { e.preventDefault(); handleDismiss(); }}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors opacity-50 hover:opacity-100"
          >
            <X className="w-3 h-3 text-[var(--muted-foreground)]" />
          </button>
        )}
      </motion.div>
    );
  }

  // HERO VARIANT - Premium, warm welcome
  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl ${className}`}
      >
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-aurora-purple)] via-[var(--color-aurora-violet)] to-[var(--color-aurora-pink)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative p-6 text-white">
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to Aurora App 💜</h2>
              <p className="text-white/80 text-sm">Your Safety. Your Community. Your Growth.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {valueProps.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={prop.href}
                  className="block bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 transition-all hover:scale-[1.02] border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{prop.emoji}</span>
                    <p className="font-semibold text-sm">{prop.title}</p>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{prop.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // INLINE VARIANT - Warm, horizontal scroll
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-r from-[var(--color-aurora-purple)]/5 via-[var(--card)] to-[var(--color-aurora-pink)]/5 border border-[var(--color-aurora-purple)]/10 rounded-2xl p-4 ${className}`}
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors z-10"
        >
          <X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
        <p className="text-xs font-semibold text-[var(--color-aurora-purple)] uppercase tracking-wide">Discover Aurora App</p>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {valueProps.map((prop, i) => (
          <motion.div
            key={prop.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              href={prop.href}
              className="flex-shrink-0 w-36 group"
            >
              <div 
                className={`bg-gradient-to-br ${prop.bgGradient} rounded-xl p-4 transition-all group-hover:scale-[1.02] group-hover:shadow-lg border border-transparent group-hover:border-[var(--color-aurora-purple)]/20`}
              >
                <div 
                  className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                  style={{ 
                    background: `linear-gradient(135deg, ${prop.color}25, ${prop.color}10)`,
                    border: `1.5px solid ${prop.color}30`
                  }}
                >
                  <span className="text-lg">{prop.emoji}</span>
                </div>
                <p className="font-semibold text-xs text-[var(--foreground)] mb-1">{prop.title}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] leading-relaxed line-clamp-2">{prop.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
