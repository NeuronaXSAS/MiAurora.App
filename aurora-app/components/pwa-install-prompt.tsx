"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <Card className="shadow-xl border border-[var(--border)] bg-[var(--card)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[var(--color-aurora-lavender)]/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 text-[var(--foreground)]">Install Aurora App</h3>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                Get quick access and work offline. Install our app for the best experience.
              </p>
              
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall} className="flex-1 min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
                  Install
                </Button>
                <Button size="sm" variant="outline" onClick={handleDismiss} className="min-h-[44px] border-[var(--border)]">
                  Not Now
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
