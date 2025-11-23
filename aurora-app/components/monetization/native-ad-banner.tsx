"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";

interface NativeAdBannerProps {
  isPremium?: boolean;
  adSlot?: string; // Google AdSense ad slot ID
}

/**
 * Native Ad Banner Component
 * 
 * Displays Google AdSense ads for free users.
 * Premium users see nothing (ad-free experience).
 * 
 * Features:
 * - Prevents Cumulative Layout Shift (CLS) with min-height
 * - Lazy loads AdSense script
 * - Respects premium status
 * - Uses centralized config for Publisher ID
 */
export function NativeAdBanner({ 
  isPremium = false, 
  adSlot = "1234567890" // Default slot, can be overridden
}: NativeAdBannerProps) {
  // Get Publisher ID from environment
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  // Premium users don't see ads
  if (isPremium) {
    return null;
  }

  // If AdSense not configured, show placeholder
  if (!publisherId) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <Card className="w-full min-h-[250px] flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 my-4">
          <div className="text-center text-gray-400">
            <p className="text-sm">📢 Ad Space</p>
            <p className="text-xs mt-1">
              Configure NEXT_PUBLIC_ADSENSE_PUBLISHER_ID to show ads
            </p>
          </div>
        </Card>
      );
    }
    return null; // Don't show anything in production if not configured
  }

  useEffect(() => {
    // Load AdSense script if not already loaded
    if (typeof window !== "undefined" && !(window as any).adsbygoogle) {
      const script = document.createElement("script");
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-ad-client", publisherId);
      document.head.appendChild(script);
    }

    // Push ad after script loads
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [publisherId]);

  return (
    <Card className="w-full min-h-[250px] flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 my-4">
      <div className="text-center">
        {/* Google AdSense Ad Unit */}
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={publisherId}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        
        {/* Fallback content while ad loads */}
        <div className="text-sm text-gray-400 mt-4">
          <p>Advertisement</p>
          <p className="text-xs mt-1">
            Upgrade to Premium for an ad-free experience
          </p>
        </div>
      </div>
    </Card>
  );
}
