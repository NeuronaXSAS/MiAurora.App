"use client";

/**
 * Aurora App - Smart Ad Component
 * 
 * Intelligent ad placement that:
 * - Respects premium users (no ads)
 * - Shows elegant placeholder sponsors when AdSense not configured
 * - Adapts to different placements (feed, sidebar, banner, footer)
 * - Non-intrusive, brand-aligned design
 * - Tracks impressions for analytics
 */

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, Shield, Briefcase, Heart, GraduationCap, Zap } from "lucide-react";

// Aurora App's AdSense Publisher ID
const ADSENSE_CLIENT_ID = "ca-pub-9358935810206071";

// Ad slot IDs - Aurora App's AdSense ad units
const AD_SLOTS = {
  feed: "5431899428",        // In-feed native ad
  sidebar: "3908555455",     // Sidebar rectangle
  banner: "2595473780",      // Horizontal banner
  footer: "6249430724",      // Footer leaderboard
  search: "5088284491",      // Search results
  article: "3775202822",     // In-article
};

type AdPlacement = "feed" | "sidebar" | "banner" | "footer" | "search" | "article";

interface SmartAdProps {
  placement: AdPlacement;
  className?: string;
  isPremium?: boolean;
}

// Placeholder sponsors - shown when AdSense not configured or blocked
const PLACEHOLDER_SPONSORS = [
  {
    title: "Women in Tech Summit 2025",
    description: "Join 10,000+ women leaders. Early bird tickets available.",
    icon: Sparkles,
    color: "var(--color-aurora-purple)",
    cta: "Learn More",
    url: "#",
  },
  {
    title: "Safe Workspace Certification",
    description: "Get your company certified as a safe workplace for women.",
    icon: Shield,
    color: "var(--color-aurora-mint)",
    cta: "Get Certified",
    url: "#",
  },
  {
    title: "Women-Led Startups Fund",
    description: "Apply for funding. $50M available for women founders.",
    icon: Briefcase,
    color: "var(--color-aurora-yellow)",
    cta: "Apply Now",
    url: "#",
  },
  {
    title: "Free Career Coaching",
    description: "1-on-1 mentorship from senior women in your industry.",
    icon: GraduationCap,
    color: "var(--color-aurora-blue)",
    cta: "Get Matched",
    url: "#",
  },
  {
    title: "Women's Health Initiative",
    description: "Free health screenings and wellness resources.",
    icon: Heart,
    color: "var(--color-aurora-pink)",
    cta: "Learn More",
    url: "#",
  },
];

export function SmartAd({ placement, className = "", isPremium = false }: SmartAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [adError, setAdError] = useState(false);
  const [placeholderIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDER_SPONSORS.length));

  // Premium users don't see ads
  if (isPremium) return null;

  useEffect(() => {
    // Don't load ads in development
    if (process.env.NODE_ENV === "development") {
      return;
    }

    // Try to load AdSense
    try {
      if (typeof window !== "undefined" && adRef.current) {
        // @ts-ignore - AdSense global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setShowPlaceholder(false);
      }
    } catch (err) {
      console.warn("AdSense blocked or error:", err);
      setAdError(true);
    }
  }, []);

  const sponsor = PLACEHOLDER_SPONSORS[placeholderIndex];
  const SponsorIcon = sponsor.icon;
  const slotId = AD_SLOTS[placement];

  // Feed placement - native, blends with content
  if (placement === "feed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`my-3 ${className}`}
      >
        <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
          <div className="px-3 py-1.5 bg-[var(--accent)]/50 border-b border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Sponsored</span>
          </div>
          {showPlaceholder || adError ? (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${sponsor.color}20` }}
                >
                  <SponsorIcon className="w-5 h-5" style={{ color: sponsor.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--foreground)] text-sm">{sponsor.title}</h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{sponsor.description}</p>
                  <button className="mt-2 text-xs font-medium text-[var(--color-aurora-purple)] hover:underline flex items-center gap-1">
                    {sponsor.cta} <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div ref={adRef} className="min-h-[100px]">
              <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client={ADSENSE_CLIENT_ID}
                data-ad-slot={slotId}
                data-ad-format="fluid"
                data-ad-layout-key="-fb+5w+4e-db+86"
              />
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Sidebar placement - vertical rectangle
  if (placement === "sidebar") {
    return (
      <div className={`sticky top-24 ${className}`}>
        <Card className="overflow-hidden border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--accent)]/30">
          <div className="px-3 py-1.5 text-center border-b border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Partner</span>
          </div>
          {showPlaceholder || adError ? (
            <div className="p-4 text-center">
              <div 
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${sponsor.color}15` }}
              >
                <SponsorIcon className="w-7 h-7" style={{ color: sponsor.color }} />
              </div>
              <h4 className="font-semibold text-[var(--foreground)] text-sm">{sponsor.title}</h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">{sponsor.description}</p>
              <button className="mt-4 w-full py-2.5 bg-[var(--color-aurora-purple)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-aurora-violet)] transition-colors">
                {sponsor.cta}
              </button>
            </div>
          ) : (
            <div ref={adRef} className="min-h-[250px]">
              <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client={ADSENSE_CLIENT_ID}
                data-ad-slot={slotId}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Banner placement - horizontal
  if (placement === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`w-full my-8 ${className}`}
      >
        <Card className="overflow-hidden bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 border-[var(--color-aurora-purple)]/10">
          <div className="px-3 py-1 bg-[var(--color-aurora-purple)]/5 border-b border-[var(--color-aurora-purple)]/10">
            <span className="text-[10px] text-[var(--color-aurora-purple)]/60 uppercase tracking-wider">Sponsored Partner</span>
          </div>
          {showPlaceholder || adError ? (
            <div className="p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${sponsor.color}20` }}
              >
                <SponsorIcon className="w-6 h-6" style={{ color: sponsor.color }} />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h4 className="font-semibold text-[var(--foreground)] text-sm md:text-base">{sponsor.title}</h4>
                <p className="text-xs md:text-sm text-[var(--muted-foreground)]">{sponsor.description}</p>
              </div>
              <button className="px-5 py-2.5 bg-[var(--color-aurora-purple)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-aurora-violet)] transition-colors flex items-center gap-1 flex-shrink-0">
                {sponsor.cta} <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div ref={adRef} className="min-h-[90px]">
              <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client={ADSENSE_CLIENT_ID}
                data-ad-slot={slotId}
                data-ad-format="horizontal"
                data-full-width-responsive="true"
              />
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Search results placement
  if (placement === "search") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={className}
      >
        <Card className="p-4 border-[var(--color-aurora-yellow)]/30 bg-[var(--color-aurora-yellow)]/5">
          <div className="flex items-center gap-1 mb-2">
            <Badge className="text-[9px] bg-[var(--color-aurora-yellow)]/30 text-[var(--foreground)] border-0">Ad</Badge>
          </div>
          {showPlaceholder || adError ? (
            <div>
              <h4 className="font-medium text-[var(--foreground)] text-sm">{sponsor.title}</h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{sponsor.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">sponsor.com</span>
                <button className="text-xs text-[var(--color-aurora-purple)] font-medium">{sponsor.cta}</button>
              </div>
            </div>
          ) : (
            <div ref={adRef}>
              <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client={ADSENSE_CLIENT_ID}
                data-ad-slot={slotId}
                data-ad-format="fluid"
              />
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Footer placement - wide banner
  if (placement === "footer") {
    return (
      <div className={`w-full py-4 ${className}`}>
        <div className="max-w-4xl mx-auto px-4">
          <Card className="overflow-hidden bg-[var(--color-aurora-violet)] text-white">
            <div className="px-3 py-1 bg-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Featured Partner</span>
            </div>
            {showPlaceholder || adError ? (
              <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[var(--color-aurora-pink)]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Support Women Worldwide</h4>
                    <p className="text-white/70 text-sm">Partner with Aurora App to reach millions of women globally.</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-white text-[var(--color-aurora-violet)] rounded-xl font-semibold hover:bg-white/90 transition-colors flex-shrink-0">
                  Become a Partner
                </button>
              </div>
            ) : (
              <div ref={adRef} className="min-h-[100px]">
                <ins
                  className="adsbygoogle"
                  style={{ display: "block" }}
                  data-ad-client={ADSENSE_CLIENT_ID}
                  data-ad-slot={slotId}
                  data-ad-format="horizontal"
                  data-full-width-responsive="true"
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Article/default placement
  return (
    <div className={`my-6 ${className}`}>
      <Card className="overflow-hidden border-[var(--border)]">
        <div className="px-3 py-1.5 bg-[var(--accent)]/50 border-b border-[var(--border)]">
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Sponsored</span>
        </div>
        {showPlaceholder || adError ? (
          <div className="p-4 flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${sponsor.color}20` }}
            >
              <SponsorIcon className="w-6 h-6" style={{ color: sponsor.color }} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[var(--foreground)] text-sm">{sponsor.title}</h4>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{sponsor.description}</p>
            </div>
            <button className="px-4 py-2 bg-[var(--color-aurora-purple)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-aurora-violet)] transition-colors flex-shrink-0">
              {sponsor.cta}
            </button>
          </div>
        ) : (
          <div ref={adRef} className="min-h-[100px]">
            <ins
              className="adsbygoogle"
              style={{ display: "block", textAlign: "center" }}
              data-ad-client={ADSENSE_CLIENT_ID}
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Hook to check if user is premium (no ads)
 */
export function useIsPremium(): boolean {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.isPremium) setIsPremium(true);
      })
      .catch(() => {});
  }, []);

  return isPremium;
}
