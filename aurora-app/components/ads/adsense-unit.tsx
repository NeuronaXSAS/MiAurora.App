"use client";

/**
 * Google AdSense Ad Unit Component
 * 
 * Displays Google AdSense ads with graceful fallback handling.
 * Configure your AdSense client ID in environment variables.
 */

import { useEffect, useRef, useState } from "react";

interface AdSenseUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  style?: React.CSSProperties;
}

// AdSense client ID - Aurora App's AdSense account
const ADSENSE_CLIENT_ID = "ca-pub-9358935810206071";

export function AdSenseUnit({ 
  slot, 
  format = "auto", 
  className = "",
  style = {}
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    // Don't load ads in development
    if (process.env.NODE_ENV === "development") {
      return;
    }

    try {
      // Push ad to AdSense
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch (error) {
      console.warn("AdSense failed to load:", error);
      setAdError(true);
    }
  }, []);

  // Don't render anything if there's an error or in development
  if (adError || process.env.NODE_ENV === "development") {
    return null;
  }



  return (
    <div ref={adRef} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Landing Page Ad - Horizontal banner for landing page sections
 */
export function LandingPageAd({ className = "" }: { className?: string }) {
  return (
    <AdSenseUnit
      slot="2595473780"
      format="horizontal"
      className={`my-8 ${className}`}
    />
  );
}

/**
 * Feed Ad - Rectangle ad for between feed posts
 */
export function FeedAd({ className = "" }: { className?: string }) {
  return (
    <AdSenseUnit
      slot="5431899428"
      format="rectangle"
      className={`my-4 ${className}`}
    />
  );
}

/**
 * Search Results Ad - Ad for search results page
 */
export function SearchResultsAd({ className = "" }: { className?: string }) {
  return (
    <AdSenseUnit
      slot="5088284491"
      format="auto"
      className={`my-3 ${className}`}
    />
  );
}
