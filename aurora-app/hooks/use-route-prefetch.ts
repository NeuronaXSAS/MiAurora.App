"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Common routes that users frequently navigate to
 * Prefetch these for instant navigation
 */
const COMMON_ROUTES = [
  "/feed",
  "/map",
  "/circles",
  "/messages",
  "/profile",
  "/opportunities",
  "/health",
];

/**
 * Hook to prefetch common routes for faster navigation
 * Only prefetches on fast connections to save bandwidth
 */
export function useRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    // Check if we should prefetch (fast connection, not data saver)
    const connection = (navigator as any).connection;
    const shouldPrefetch = 
      !connection?.saveData && 
      connection?.effectiveType !== "slow-2g" &&
      connection?.effectiveType !== "2g";

    if (!shouldPrefetch) return;

    // Prefetch common routes after initial load
    const timer = setTimeout(() => {
      COMMON_ROUTES.forEach((route) => {
        router.prefetch(route);
      });
    }, 2000); // Wait 2s after page load

    return () => clearTimeout(timer);
  }, [router]);

  // Manual prefetch for specific routes (e.g., on hover)
  const prefetchRoute = useCallback((route: string) => {
    router.prefetch(route);
  }, [router]);

  return { prefetchRoute };
}

/**
 * Hook to prefetch a route on hover/focus
 * Use on navigation links for instant transitions
 */
export function usePrefetchOnInteraction(route: string) {
  const router = useRouter();

  const handleInteraction = useCallback(() => {
    router.prefetch(route);
  }, [router, route]);

  return {
    onMouseEnter: handleInteraction,
    onFocus: handleInteraction,
    onTouchStart: handleInteraction,
  };
}
