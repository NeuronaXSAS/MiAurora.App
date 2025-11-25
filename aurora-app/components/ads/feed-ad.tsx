"use client";

import { NativeAdBanner } from "./native-ad-banner";

export function FeedAd() {
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
