"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useDevicePerformance } from "@/hooks/use-device-performance";

// Lazy load the heavy SafetyMap component
const SafetyMap = lazy(() => import("@/components/safety-map").then(mod => ({ default: mod.SafetyMap })));

interface LazyMapProps {
  lifeDimension?: string;
  onMarkerClick?: (postId: string) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  ratingFilter?: number;
}

// Loading placeholder for the map
function MapLoadingPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-[var(--color-aurora-purple)] animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
          <p className="text-[var(--foreground)] font-medium">Loading map...</p>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          This may take a moment on slower connections
        </p>
      </div>
    </div>
  );
}

// Lightweight static map placeholder for very low-end devices
function StaticMapPlaceholder({ onRequestFullMap }: { onRequestFullMap: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-lavender)]/20 to-[var(--color-aurora-mint)]/20">
      <div className="text-center p-8 max-w-sm">
        <div className="w-20 h-20 bg-[var(--color-aurora-purple)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-10 h-10 text-[var(--color-aurora-purple)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Safety Map
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Interactive map is available. Tap to load it.
        </p>
        <button
          onClick={onRequestFullMap}
          className="px-6 py-3 bg-[var(--color-aurora-purple)] text-white rounded-xl font-medium hover:bg-[var(--color-aurora-violet)] transition-colors min-h-[48px]"
        >
          Load Interactive Map
        </button>
        <p className="text-xs text-[var(--muted-foreground)] mt-3">
          💡 Loading the map uses more data and battery
        </p>
      </div>
    </div>
  );
}

export function LazyMap(props: LazyMapProps) {
  const { isLowEnd, isSlowNetwork, shouldReduceData } = useDevicePerformance();
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // On low-end devices or slow networks, don't auto-load the map
  useEffect(() => {
    // Auto-load on capable devices
    if (!isLowEnd && !isSlowNetwork && !shouldReduceData) {
      setShouldLoadMap(true);
    }
  }, [isLowEnd, isSlowNetwork, shouldReduceData]);

  const handleRequestFullMap = () => {
    setHasInteracted(true);
    setShouldLoadMap(true);
  };

  // Show static placeholder on low-end devices until user requests map
  if ((isLowEnd || isSlowNetwork || shouldReduceData) && !shouldLoadMap) {
    return <StaticMapPlaceholder onRequestFullMap={handleRequestFullMap} />;
  }

  return (
    <Suspense fallback={<MapLoadingPlaceholder />}>
      <SafetyMap {...props} />
    </Suspense>
  );
}

export default LazyMap;
