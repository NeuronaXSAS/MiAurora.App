"use client";

import { useEffect, useState } from "react";
import { AdSenseUnit } from "@/components/ads/adsense-unit";

interface FeedAdProps {
  isPremium?: boolean;
}

export function FeedAd({ isPremium: propIsPremium }: FeedAdProps) {
  const [isPremium, setIsPremium] = useState(propIsPremium ?? false);

  useEffect(() => {
    if (propIsPremium !== undefined) {
      return;
    }

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.isPremium) {
          setIsPremium(true);
        }
      })
      .catch(() => {});
  }, [propIsPremium]);

  if (isPremium) {
    return null;
  }

  return (
    <div className="mx-auto my-3 w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="border-b border-[var(--border)] bg-[var(--accent)]/50 px-4 py-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Sponsored
        </span>
      </div>
      {process.env.NODE_ENV === "development" ? (
        <div className="p-5 text-sm text-[var(--muted-foreground)]">
          AdSense feed slot placeholder in development mode.
        </div>
      ) : (
        <AdSenseUnit
          slot="5431899428"
          format="auto"
          className="block min-h-[120px] w-full"
          style={{ minHeight: 120 }}
        />
      )}
    </div>
  );
}
