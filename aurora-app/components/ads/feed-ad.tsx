"use client";

import { useState, useEffect } from "react";
import { NativeAdBanner } from "./native-ad-banner";

interface FeedAdProps {
  isPremium?: boolean;
}

export function FeedAd({ isPremium: propIsPremium }: FeedAdProps) {
  const [isPremium, setIsPremium] = useState(propIsPremium ?? false);

  useEffect(() => {
    // If not passed as prop, check from API
    if (propIsPremium === undefined) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.isPremium) setIsPremium(true);
        })
        .catch(() => {});
    }
  }, [propIsPremium]);

  // Premium users don't see ads
  if (isPremium) return null;

  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <NativeAdBanner 
        slot="feed-native-ad"
        format="fluid"
        className="shadow-sm"
      />
    </div>
  );
}
