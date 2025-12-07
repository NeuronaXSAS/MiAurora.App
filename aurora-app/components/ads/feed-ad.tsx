"use client";

import { useState, useEffect } from "react";
import { SmartAd } from "./smart-ad";

interface FeedAdProps {
  isPremium?: boolean;
}

/**
 * Feed Ad Component
 * 
 * Displays non-intrusive ads in the feed for free users.
 * Premium users see no ads.
 */
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
    <div className="w-full max-w-2xl mx-auto">
      <SmartAd placement="feed" isPremium={isPremium} />
    </div>
  );
}
