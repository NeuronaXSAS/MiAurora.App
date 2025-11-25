"use client";

import { useState, useEffect, useCallback } from "react";

type ConnectionType = "4g" | "3g" | "2g" | "slow-2g" | "unknown";
type EffectiveType = "4g" | "3g" | "2g" | "slow-2g";

interface NetworkInformation extends EventTarget {
  effectiveType: EffectiveType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener(
    type: "change",
    listener: EventListener
  ): void;
  removeEventListener(
    type: "change",
    listener: EventListener
  ): void;
}

interface ConnectionState {
  isOnline: boolean;
  connectionType: ConnectionType;
  downlink: number | null; // Mbps
  rtt: number | null; // ms
  saveData: boolean;
  isSlowConnection: boolean;
  isFastConnection: boolean;
}

interface UseConnectionOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export function useConnection(options?: UseConnectionOptions): ConnectionState & {
  getImageQuality: () => "low" | "medium" | "high";
  shouldLoadVideo: () => boolean;
  shouldPreload: () => boolean;
} {
  const [state, setState] = useState<ConnectionState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    connectionType: "unknown",
    downlink: null,
    rtt: null,
    saveData: false,
    isSlowConnection: false,
    isFastConnection: true,
  });

  const getNetworkInfo = useCallback((): Partial<ConnectionState> => {
    if (typeof navigator === "undefined") {
      return {};
    }

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      return {};
    }

    const effectiveType = connection.effectiveType || "unknown";
    const isSlowConnection =
      effectiveType === "slow-2g" ||
      effectiveType === "2g" ||
      effectiveType === "3g";
    const isFastConnection = effectiveType === "4g";

    return {
      connectionType: effectiveType as ConnectionType,
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false,
      isSlowConnection,
      isFastConnection,
    };
  }, []);

  const updateConnectionState = useCallback(() => {
    const networkInfo = getNetworkInfo();
    const newState: ConnectionState = {
      isOnline: navigator.onLine,
      connectionType: networkInfo.connectionType || "unknown",
      downlink: networkInfo.downlink || null,
      rtt: networkInfo.rtt || null,
      saveData: networkInfo.saveData || false,
      isSlowConnection: networkInfo.isSlowConnection || false,
      isFastConnection: networkInfo.isFastConnection ?? true,
    };

    setState(newState);
    options?.onConnectionChange?.(newState);
  }, [getNetworkInfo, options]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial state
    updateConnectionState();

    // Online/offline handlers
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      options?.onOnline?.();
      updateConnectionState();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      options?.onOffline?.();
    };

    // Network change handler
    const handleConnectionChange = () => {
      updateConnectionState();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, [updateConnectionState, options]);

  // Helper functions for adaptive loading
  const getImageQuality = useCallback((): "low" | "medium" | "high" => {
    if (!state.isOnline) return "low";
    if (state.saveData) return "low";
    if (state.isSlowConnection) return "low";
    if (state.connectionType === "3g") return "medium";
    return "high";
  }, [state]);

  const shouldLoadVideo = useCallback((): boolean => {
    if (!state.isOnline) return false;
    if (state.saveData) return false;
    if (state.connectionType === "slow-2g" || state.connectionType === "2g")
      return false;
    return true;
  }, [state]);

  const shouldPreload = useCallback((): boolean => {
    if (!state.isOnline) return false;
    if (state.saveData) return false;
    if (state.isSlowConnection) return false;
    return true;
  }, [state]);

  return {
    ...state,
    getImageQuality,
    shouldLoadVideo,
    shouldPreload,
  };
}

// Connection-aware image component helper
export function getOptimizedImageUrl(
  url: string,
  quality: "low" | "medium" | "high"
): string {
  // If using a CDN that supports quality params, modify URL
  // For now, return original URL
  // In production, you'd integrate with your image CDN
  const qualityMap = {
    low: 30,
    medium: 60,
    high: 90,
  };

  // Example for Cloudinary or similar CDN
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", `/upload/q_${qualityMap[quality]}/`);
  }

  return url;
}
