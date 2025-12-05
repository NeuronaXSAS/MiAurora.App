"use client";

/**
 * Aurora App - Landing Page Ad Component
 * 
 * Premium, non-intrusive ad placements for the landing page.
 * Designed to monetize search-only users while maintaining brand quality.
 * Supports: Google AdSense, native ads, and sponsor placements.
 */

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles, ExternalLink, Heart, Shield, Briefcase } from "lucide-react";

interface LandingAdProps {
  variant: "banner" | "native" | "sidebar" | "search-results" | "footer";
  slot?: string;
  className?: string;
}

// Placeholder sponsored content for when AdSense isn't configured
const PLACEHOLDER_SPONSORS = [
  {
    title: "Women in Tech Summit 2025",
    description: "Join 10,000+ women leaders. Early bird tickets available.",
    icon: Sparkles,
    color: "#5537a7",
    cta: "Learn More",
  },
  {
    title: "Safe Workspace Certification",
    description: "Get your company certified as a safe workplace for women.",
    icon: Shield,
    color: "#22c55e",
    cta: "Get Certified",
  },
  {
    title: "Women-Led Startups Fund",
    description: "Apply for funding. $50M available for women founders.",
    icon: Briefcase,
    color: "#e5e093",
    cta: "Apply Now",
  },
];

export function LandingAd({ variant, slot, className = "" }: LandingAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [placeholderIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDER_SPONSORS.length));

  useEffect(() => {
    // Check if AdSense is configured
    const hasAdSense = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    if (hasAdSense && adRef.current) {
      try {
        // @ts-ignore - AdSense global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setShowPlaceholder(false);
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, []);

  const sponsor = PLACEHOLDER_SPONSORS[placeholderIndex];
  const SponsorIcon = sponsor.icon;

  // Banner variant - horizontal, prominent
  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`w-full ${className}`}
      >
        <Card className="bg-gradient-to-r from-[#3d0d73]/5 to-[#5537a7]/5 border-[#5537a7]/10 overflow-hidden">
          <div className="p-1 bg-[#5537a7]/5 border-b border-[#5537a7]/10">
            <p className="text-[10px] text-[#3d0d73]/50 text-center uppercase tracking-wider">Sponsored Partner</p>
          </div>
          {showPlaceholder ? (
            <div className="p-4 md:p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${sponsor.color}20` }}>
                <SponsorIcon className="w-6 h-6" style={{ color: sponsor.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#3d0d73] text-sm md:text-base">{sponsor.title}</h4>
                <p className="text-xs md:text-sm text-[#3d0d73]/60">{sponsor.description}</p>
              </div>
              <button className="px-4 py-2 bg-[#5537a7] text-white rounded-xl text-sm font-medium hover:bg-[#3d0d73] transition-colors flex items-center gap-1 flex-shrink-0">
                {sponsor.cta} <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div ref={adRef} className="min-h-[90px]">
              <ins className="adsbygoogle" style={{ display: "block" }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slot || "landing-banner"}
                data-ad-format="horizontal"
                data-full-width-responsive="true" />
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Native variant - blends with content
  if (variant === "native") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={className}
      >
        <Card className="p-4 border-[#5537a7]/10 hover:shadow-md transition-all bg-white">
          <div className="flex items-center gap-1 mb-2">
            <Badge className="text-[9px] bg-[#5537a7]/10 text-[#5537a7] border-0">Sponsored</Badge>
          </div>
          {showPlaceholder ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sponsor.color}15` }}>
                <SponsorIcon className="w-5 h-5" style={{ color: sponsor.color }} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[#3d0d73] text-sm">{sponsor.title}</h4>
                <p className="text-xs text-[#3d0d73]/60 mt-1">{sponsor.description}</p>
                <button className="mt-2 text-xs text-[#5537a7] font-medium hover:underline flex items-center gap-1">
                  {sponsor.cta} <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div ref={adRef}>
              <ins className="adsbygoogle" style={{ display: "block" }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slot || "landing-native"}
                data-ad-format="fluid" />
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Search results variant - appears in search results
  if (variant === "search-results") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={className}
      >
        <Card className="p-4 border-[#e5e093]/50 bg-[#e5e093]/5">
          <div className="flex items-center gap-1 mb-2">
            <Badge className="text-[9px] bg-[#e5e093]/30 text-[#3d0d73] border-0">Ad</Badge>
          </div>
          {showPlaceholder ? (
            <div>
              <h4 className="font-medium text-[#3d0d73] text-sm">{sponsor.title}</h4>
              <p className="text-xs text-[#3d0d73]/60 mt-1 line-clamp-2">{sponsor.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[#3d0d73]/40">sponsor.com</span>
                <button className="text-xs text-[#5537a7] font-medium">{sponsor.cta}</button>
              </div>
            </div>
          ) : (
            <div ref={adRef}>
              <ins className="adsbygoogle" style={{ display: "block" }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slot || "search-results"}
                data-ad-format="fluid" />
            </div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Sidebar variant
  if (variant === "sidebar") {
    return (
      <div className={`sticky top-24 ${className}`}>
        <Card className="p-4 border-[#5537a7]/10 bg-gradient-to-b from-white to-[#fffaf1]">
          <p className="text-[10px] text-[#3d0d73]/40 text-center mb-3 uppercase tracking-wider">Partner</p>
          {showPlaceholder ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${sponsor.color}15` }}>
                <SponsorIcon className="w-8 h-8" style={{ color: sponsor.color }} />
              </div>
              <h4 className="font-semibold text-[#3d0d73] text-sm">{sponsor.title}</h4>
              <p className="text-xs text-[#3d0d73]/60 mt-2">{sponsor.description}</p>
              <button className="mt-4 w-full py-2 bg-[#5537a7] text-white rounded-xl text-sm font-medium hover:bg-[#3d0d73] transition-colors">
                {sponsor.cta}
              </button>
            </div>
          ) : (
            <div ref={adRef}>
              <ins className="adsbygoogle" style={{ display: "block" }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slot || "sidebar"}
                data-ad-format="vertical" />
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Footer variant - wide banner
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        <Card className="bg-[#3d0d73] text-white overflow-hidden">
          <div className="p-1 bg-white/5">
            <p className="text-[10px] text-white/40 text-center uppercase tracking-wider">Featured Partner</p>
          </div>
          {showPlaceholder ? (
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-[#f29de5]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Support Women Worldwide</h4>
                  <p className="text-white/70 text-sm">Partner with Aurora App to reach millions of women globally.</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-white text-[#3d0d73] rounded-xl font-semibold hover:bg-white/90 transition-colors flex-shrink-0">
                Become a Partner
              </button>
            </div>
          ) : (
            <div ref={adRef} className="min-h-[100px]">
              <ins className="adsbygoogle" style={{ display: "block" }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
                data-ad-slot={slot || "footer-banner"}
                data-ad-format="horizontal"
                data-full-width-responsive="true" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
