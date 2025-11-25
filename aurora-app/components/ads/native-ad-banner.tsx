"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface NativeAdBannerProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export function NativeAdBanner({ 
  slot, 
  format = "auto",
  className = "" 
}: NativeAdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  
  // Note: Premium user check should be done at parent component level
  // This component just renders the ad slot

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && adRef.current) {
        // @ts-ignore - AdSense global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <Card className={`overflow-hidden border-aurora-lavender/30 ${className}`}>
      <div className="p-2 bg-aurora-cream/30">
        <p className="text-xs text-gray-500 text-center">Sponsored</p>
      </div>
      <div ref={adRef} className="min-h-[100px] flex items-center justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </Card>
  );
}
