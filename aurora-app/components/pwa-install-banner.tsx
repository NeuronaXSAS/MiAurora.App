"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  X, 
  Smartphone, 
  Bell, 
  Wifi, 
  Shield,
  Sparkles,
  Share,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallBannerProps {
  variant?: "banner" | "card" | "floating";
  showOnMobile?: boolean;
}

export function PWAInstallBanner({ variant = "floating", showOnMobile = true }: PWAInstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);
    
    if (standalone) return;

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently (24 hours)
    const dismissedTime = localStorage.getItem("pwa-install-dismissed-time");
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
        return;
      }
    }

    // Listen for install prompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt after delay
    if (iOS) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[Aurora App] PWA installed successfully");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed-time", Date.now().toString());
  };

  // Don't show if already installed, dismissed, or on desktop without prompt
  if (isStandalone || dismissed || (!showPrompt && !isIOS)) return null;

  // Check mobile preference
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  if (!showOnMobile && isMobile) return null;

  const benefits = [
    { icon: Bell, text: "Push notifications" },
    { icon: Wifi, text: "Works offline" },
    { icon: Shield, text: "Quick emergency access" },
    { icon: Sparkles, text: "Native app experience" },
  ];

  // Floating variant (bottom of screen)
  if (variant === "floating") {
    return (
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
          >
            <Card className="shadow-2xl border-[var(--color-aurora-purple)]/30 bg-[var(--card)] overflow-hidden">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white text-sm">Install Aurora App</span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-white/70 hover:text-white p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <CardContent className="p-4">
                {/* iOS Instructions */}
                {isIOS && showIOSInstructions ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--foreground)] font-medium">
                      Add Aurora App to your home screen:
                    </p>
                    <ol className="space-y-2 text-sm text-[var(--muted-foreground)]">
                      <li className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-aurora-purple)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-aurora-purple)]">1</span>
                        Tap the <Share className="w-4 h-4 inline mx-1" /> Share button
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-aurora-purple)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-aurora-purple)]">2</span>
                        Scroll and tap "Add to Home Screen"
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-aurora-purple)]/20 flex items-center justify-center text-xs font-bold text-[var(--color-aurora-purple)]">3</span>
                        Tap "Add" to confirm
                      </li>
                    </ol>
                    <Button
                      onClick={() => setShowIOSInstructions(false)}
                      variant="outline"
                      className="w-full min-h-[44px]"
                    >
                      Got it
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">
                      Get the full native app experience — faster, offline access, and instant notifications.
                    </p>

                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {benefits.map((benefit) => (
                        <div key={benefit.text} className="flex items-center gap-2 text-xs text-[var(--foreground)]">
                          <benefit.icon className="w-3 h-3 text-[var(--color-aurora-purple)]" />
                          {benefit.text}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleInstall}
                        className="flex-1 min-h-[48px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isIOS ? "How to Install" : "Install Now"}
                      </Button>
                      <Button
                        onClick={handleDismiss}
                        variant="outline"
                        className="min-h-[48px] border-[var(--border)]"
                      >
                        Later
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Banner variant (top of page)
  if (variant === "banner") {
    return (
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white py-3 px-4"
          >
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 hidden sm:block" />
                <div>
                  <p className="font-semibold text-sm">Install Aurora App</p>
                  <p className="text-xs text-white/80 hidden sm:block">
                    Get push notifications and offline access
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-white text-[var(--color-aurora-purple)] hover:bg-white/90 min-h-[40px]"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Install
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-white/70 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Card variant (inline)
  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Card className="border-[var(--color-aurora-purple)]/30 bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--foreground)]">Install Aurora App</h3>
                    <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">
                    Add to your home screen for the best experience with push notifications and offline access.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstall}
                      size="sm"
                      className="bg-[var(--color-aurora-purple)] min-h-[40px]"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Install
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      size="sm"
                      variant="ghost"
                      className="min-h-[40px]"
                    >
                      Not now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
