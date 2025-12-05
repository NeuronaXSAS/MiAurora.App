"use client";

/**
 * Offline Indicator - Shows network status to users
 * 
 * Critical for PWA experience - users need to know when
 * they're offline so they understand feature limitations.
 */

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide "reconnected" message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="offline-indicator flex items-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          <span>You&apos;re offline</span>
        </motion.div>
      )}
      
      {isOnline && showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          <span>Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
