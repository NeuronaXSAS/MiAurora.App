"use client";

import { useEffect, useState } from "react";

export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if running as PWA
    if (typeof window !== "undefined") {
      const isPWA = window.matchMedia("(display-mode: standalone)").matches;
      setIsInstalled(isPWA);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered:", reg);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log("New service worker available");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateServiceWorker = () => {
    if (registration) {
      registration.update();
    }
  };

  const unregisterServiceWorker = async () => {
    if (registration) {
      await registration.unregister();
      setRegistration(null);
    }
  };

  return {
    isOnline,
    isInstalled,
    registration,
    updateServiceWorker,
    unregisterServiceWorker,
  };
}
