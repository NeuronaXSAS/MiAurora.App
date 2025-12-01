"use client";

import { useState, useEffect, useMemo } from "react";

interface DevicePerformance {
  isLowEnd: boolean;
  isSlowNetwork: boolean;
  shouldReduceMotion: boolean;
  shouldReduceData: boolean;
  memoryStatus: "low" | "medium" | "high";
  connectionType: string;
  deviceMemory: number | null;
  hardwareConcurrency: number;
}

/**
 * Hook to detect device performance capabilities
 * Helps optimize UX for low-end devices and slow networks
 */
export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>({
    isLowEnd: false,
    isSlowNetwork: false,
    shouldReduceMotion: false,
    shouldReduceData: false,
    memoryStatus: "high",
    connectionType: "unknown",
    deviceMemory: null,
    hardwareConcurrency: 4,
  });

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Check for data saver mode
    const prefersReducedData =
      (navigator as any).connection?.saveData === true;

    // Get device memory (in GB)
    const deviceMemory = (navigator as any).deviceMemory || null;

    // Get CPU cores
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    // Get connection info
    const connection = (navigator as any).connection;
    const connectionType = connection?.effectiveType || "unknown";
    const downlink = connection?.downlink || 10; // Mbps

    // Determine if low-end device
    // Low-end: < 4GB RAM or < 4 cores or slow connection
    const isLowEnd =
      (deviceMemory !== null && deviceMemory < 4) ||
      hardwareConcurrency < 4 ||
      connectionType === "slow-2g" ||
      connectionType === "2g";

    // Determine if slow network
    const isSlowNetwork =
      connectionType === "slow-2g" ||
      connectionType === "2g" ||
      connectionType === "3g" ||
      downlink < 1.5;

    // Determine memory status
    let memoryStatus: "low" | "medium" | "high" = "high";
    if (deviceMemory !== null) {
      if (deviceMemory < 2) memoryStatus = "low";
      else if (deviceMemory < 4) memoryStatus = "medium";
    }

    setPerformance({
      isLowEnd,
      isSlowNetwork,
      shouldReduceMotion: prefersReducedMotion || isLowEnd,
      shouldReduceData: prefersReducedData || isSlowNetwork,
      memoryStatus,
      connectionType,
      deviceMemory,
      hardwareConcurrency,
    });

    // Listen for connection changes
    const handleConnectionChange = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        const newConnectionType = conn.effectiveType || "unknown";
        const newDownlink = conn.downlink || 10;
        const newIsSlowNetwork =
          newConnectionType === "slow-2g" ||
          newConnectionType === "2g" ||
          newConnectionType === "3g" ||
          newDownlink < 1.5;

        setPerformance((prev) => ({
          ...prev,
          connectionType: newConnectionType,
          isSlowNetwork: newIsSlowNetwork,
          shouldReduceData: conn.saveData || newIsSlowNetwork,
        }));
      }
    };

    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    return () => {
      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, []);

  return performance;
}

/**
 * Hook to get optimized animation settings based on device performance
 */
export function useOptimizedAnimations() {
  const { shouldReduceMotion, isLowEnd } = useDevicePerformance();

  return useMemo(
    () => ({
      // Framer Motion variants
      fadeIn: shouldReduceMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
        : { initial: { opacity: 0 }, animate: { opacity: 1 } },

      slideUp: shouldReduceMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
        : {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          },

      scale: shouldReduceMotion
        ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
        : {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
          },

      // Transition settings
      transition: shouldReduceMotion
        ? { duration: 0 }
        : isLowEnd
        ? { duration: 0.15, ease: "easeOut" }
        : { duration: 0.3, ease: "easeOut" },

      // Spring settings for interactive elements
      spring: shouldReduceMotion
        ? { type: "tween", duration: 0 }
        : isLowEnd
        ? { type: "tween", duration: 0.15 }
        : { type: "spring", stiffness: 300, damping: 30 },
    }),
    [shouldReduceMotion, isLowEnd]
  );
}

/**
 * Hook to get optimized image quality based on network
 */
export function useOptimizedImageQuality() {
  const { isSlowNetwork, shouldReduceData } = useDevicePerformance();

  return useMemo(
    () => ({
      quality: shouldReduceData ? 60 : isSlowNetwork ? 75 : 85,
      priority: !isSlowNetwork, // Only prioritize on fast networks
      loading: isSlowNetwork ? ("lazy" as const) : ("eager" as const),
      placeholder: "blur" as const,
    }),
    [isSlowNetwork, shouldReduceData]
  );
}

/**
 * Hook to determine optimal list virtualization settings
 */
export function useVirtualizationSettings() {
  const { isLowEnd, memoryStatus } = useDevicePerformance();

  return useMemo(
    () => ({
      // Number of items to render outside viewport
      overscan: isLowEnd ? 1 : memoryStatus === "low" ? 2 : 3,
      // Estimated item size for virtualization
      estimatedItemSize: 200,
      // Whether to use virtualization
      shouldVirtualize: true,
      // Batch size for loading more items
      batchSize: isLowEnd ? 10 : memoryStatus === "low" ? 15 : 25,
    }),
    [isLowEnd, memoryStatus]
  );
}
