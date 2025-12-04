"use client";

import { useState, useEffect, Suspense, lazy, useCallback, useRef } from "react";
import { MapPin, Loader2, Navigation, WifiOff, Smartphone } from "lucide-react";
import { useDevicePerformance } from "@/hooks/use-device-performance";
import { motion } from "framer-motion";

// Lazy load the heavy SafetyMap component with preload capability
const SafetyMap = lazy(() => 
  import("@/components/safety-map").then(mod => ({ default: mod.SafetyMap }))
);

// Preload state and function
let mapPreloaded = false;
let mapPreloadPromise: Promise<any> | null = null;

const preloadMap = () => {
  if (!mapPreloaded && !mapPreloadPromise) {
    mapPreloaded = true;
    // Start preloading and cache the promise
    mapPreloadPromise = import("@/components/safety-map");
  }
  return mapPreloadPromise;
};

interface LazyMapProps {
  lifeDimension?: string;
  onMarkerClick?: (postId: string) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  ratingFilter?: number;
}

// Lightweight skeleton - reduced animations for faster perceived load
function MapLoadingSkeleton() {
  const { shouldReduceMotion } = useDevicePerformance();
  
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-aurora-lavender)]/10 to-[var(--color-aurora-mint)]/10 overflow-hidden">
      {/* Simple grid pattern - no animation on low-end */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(93, 55, 167, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(93, 55, 167, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Center loading indicator - simplified */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[var(--card)]/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-[var(--border)] max-w-xs mx-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
              <p className="font-semibold text-[var(--foreground)]">Loading Map</p>
            </div>
            
            <p className="text-sm text-[var(--muted-foreground)]">
              Preparing safety view...
            </p>
            
            {/* Simple progress bar */}
            {!shouldReduceMotion && (
              <div className="w-full h-1.5 bg-[var(--accent)] rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Static placeholder for low-end devices - preloads on interaction
function StaticMapPlaceholder({ 
  onRequestFullMap, 
  isSlowNetwork 
}: { 
  onRequestFullMap: () => void;
  isSlowNetwork: boolean;
}) {
  const handleInteraction = useCallback(() => {
    preloadMap();
  }, []);

  const handleLoadMap = useCallback(() => {
    preloadMap();
    onRequestFullMap();
  }, [onRequestFullMap]);

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-cream)] to-[var(--color-aurora-lavender)]/20"
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Simple background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-aurora-purple) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className="text-center p-6 max-w-sm relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Safety Map
        </h3>
        
        <p className="text-sm text-[var(--muted-foreground)] mb-5">
          View community-verified safe locations and workplace ratings near you.
        </p>

        {isSlowNetwork && (
          <div className="flex items-center justify-center gap-2 mb-4 text-[var(--color-aurora-yellow)]">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs">Slow connection detected</span>
          </div>
        )}
        
        <button
          onClick={handleLoadMap}
          className="w-full px-6 py-4 bg-[var(--color-aurora-purple)] text-white rounded-xl font-semibold hover:bg-[var(--color-aurora-violet)] active:scale-[0.98] transition-all min-h-[56px] shadow-lg shadow-[var(--color-aurora-purple)]/30"
        >
          <div className="flex items-center justify-center gap-2">
            <Navigation className="w-5 h-5" />
            <span>Load Interactive Map</span>
          </div>
        </button>
        
        <p className="text-xs text-[var(--muted-foreground)] mt-4 flex items-center justify-center gap-1">
          <Smartphone className="w-3 h-3" />
          Optimized for your device
        </p>
      </div>
    </div>
  );
}

export function LazyMap(props: LazyMapProps) {
  const { isLowEnd, isSlowNetwork, shouldReduceData } = useDevicePerformance();
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const hasPreloaded = useRef(false);

  // Preload map using requestIdleCallback for better performance
  useEffect(() => {
    if (hasPreloaded.current) return;
    
    if (!isLowEnd && !shouldReduceData) {
      hasPreloaded.current = true;
      
      // Use requestIdleCallback if available, otherwise setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => preloadMap(), { timeout: 2000 });
      } else {
        const timer = setTimeout(preloadMap, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLowEnd, shouldReduceData]);

  // Auto-load on capable devices - immediate for good connections
  useEffect(() => {
    if (!isLowEnd && !isSlowNetwork && !shouldReduceData) {
      // Immediate load for capable devices
      setShouldLoadMap(true);
    }
  }, [isLowEnd, isSlowNetwork, shouldReduceData]);

  const handleRequestFullMap = useCallback(() => {
    setShouldLoadMap(true);
  }, []);

  // Show static placeholder on low-end devices until user requests map
  if ((isLowEnd || isSlowNetwork || shouldReduceData) && !shouldLoadMap) {
    return (
      <StaticMapPlaceholder 
        onRequestFullMap={handleRequestFullMap} 
        isSlowNetwork={isSlowNetwork}
      />
    );
  }

  return (
    <Suspense fallback={<MapLoadingSkeleton />}>
      <SafetyMap {...props} />
    </Suspense>
  );
}

export default LazyMap;
