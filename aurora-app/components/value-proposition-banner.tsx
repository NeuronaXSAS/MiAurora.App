"use client";

/**
 * Value Proposition Banner
 * 
 * Shows Aurora App's core value to users in a beautiful, non-intrusive way.
 * Appears contextually to reinforce the platform's mission.
 */

import { useState, useEffect } from "react";
import { Shield, Users, Briefcase, Heart, X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ValuePropositionBannerProps {
  variant?: "hero" | "inline" | "minimal";
  dismissible?: boolean;
  className?: string;
}

const valueProps = [
  {
    icon: Shield,
    title: "Safety First",
    description: "Community-powered safety intelligence",
    color: "var(--color-aurora-mint)",
    href: "/map",
  },
  {
    icon: Users,
    title: "Supportive Community",
    description: "Connect with women worldwide",
    color: "var(--color-aurora-pink)",
    href: "/circles",
  },
  {
    icon: Briefcase,
    title: "Career Growth",
    description: "Unlock opportunities & mentorship",
    color: "var(--color-aurora-blue)",
    href: "/opportunities",
  },
  {
    icon: Heart,
    title: "Wellness Hub",
    description: "Track health & emotional wellbeing",
    color: "var(--color-aurora-pink)",
    href: "/health",
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

  if (variant === "minimal") {
    const activeProp = valueProps[activeIndex];
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 rounded-xl p-3 ${className}`}
      >
        <Link href={activeProp.href} className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${activeProp.color}20` }}
          >
            <activeProp.icon className="w-4 h-4" style={{ color: activeProp.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">{activeProp.title}</p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">{activeProp.description}</p>
          </div>
          <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
        </Link>
      </motion.div>
    );
  }

  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl p-6 text-white relative overflow-hidden ${className}`}
      >
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Welcome to Aurora App</h2>
            <p className="text-white/80 text-sm">Your Safety. Your Community. Your Growth.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {valueProps.map((prop) => (
            <Link
              key={prop.title}
              href={prop.href}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors"
            >
              <prop.icon className="w-5 h-5 mb-2" />
              <p className="font-medium text-sm">{prop.title}</p>
              <p className="text-xs text-white/70">{prop.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    );
  }

  // Inline variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 relative ${className}`}
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-[var(--accent)] transition-colors"
        >
          <X className="w-4 h-4 text-[var(--muted-foreground)]" />
        </button>
      )}

      <p className="text-xs font-medium text-[var(--color-aurora-purple)] mb-3">DISCOVER AURORA APP</p>
      
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {valueProps.map((prop) => (
          <Link
            key={prop.title}
            href={prop.href}
            className="flex-shrink-0 w-28 bg-[var(--accent)] hover:bg-[var(--accent)]/80 rounded-xl p-3 transition-colors text-center"
          >
            <div 
              className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: `${prop.color}20` }}
            >
              <prop.icon className="w-5 h-5" style={{ color: prop.color }} />
            </div>
            <p className="font-medium text-xs text-[var(--foreground)]">{prop.title}</p>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
