"use client";

/**
 * Cookie Consent & Data Management Component
 * 
 * GDPR/CCPA compliant cookie consent banner with granular controls.
 * Supports different business models while ensuring great UX.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Cookie, Shield, BarChart3, Target, Settings, ChevronDown,
  ChevronUp, Check, X, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean; // Always true, required
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const COOKIE_CONSENT_KEY = "aurora-cookie-consent";
const COOKIE_PREFERENCES_KEY = "aurora-cookie-preferences";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
    
    // Dispatch event for analytics/tracking scripts
    window.dispatchEvent(new CustomEvent("aurora-consent-updated", { detail: prefs }));
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    });
  };

  const cookieCategories = [
    {
      id: "essential",
      name: "Essential",
      icon: Shield,
      description: "Required for Aurora App to function. Cannot be disabled.",
      details: "Authentication, security, preferences, and core functionality.",
      required: true,
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: BarChart3,
      description: "Help us understand how you use Aurora App.",
      details: "Page views, feature usage, performance metrics. All data is anonymized.",
      required: false,
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: Target,
      description: "Personalized content and relevant opportunities.",
      details: "Job recommendations, community suggestions, and partner offers.",
      required: false,
    },
    {
      id: "personalization",
      name: "Personalization",
      icon: Settings,
      description: "Remember your preferences across sessions.",
      details: "Theme, language, feed preferences, and saved filters.",
      required: false,
    },
  ];

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Cookie Banner - Fixed for mobile with proper z-index and touch targets */}
      <AnimatePresence>
        {showBanner && !showSettings && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-6 pointer-events-auto"
            style={{ 
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              isolation: "isolate"
            }}
          >
            <div className="max-w-4xl mx-auto bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="font-bold text-lg text-[var(--foreground)] mb-1">
                      Your Privacy Matters 💜
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                      Aurora App uses cookies to provide a safe, personalized experience. 
                      We never sell your data. Choose what works for you.
                    </p>
                    {/* Buttons - Stack vertically on mobile for better touch targets */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                      <Button
                        onClick={acceptAll}
                        className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[48px] w-full sm:w-auto touch-manipulation"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Accept All
                      </Button>
                      <Button
                        onClick={acceptEssential}
                        variant="outline"
                        className="border-[var(--border)] min-h-[48px] w-full sm:w-auto touch-manipulation"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        Essential Only
                      </Button>
                      <Button
                        onClick={() => setShowSettings(true)}
                        variant="ghost"
                        className="min-h-[48px] w-full sm:w-auto touch-manipulation"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Customize
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 bg-[var(--accent)]/50 border-t border-[var(--border)]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>By using Aurora App, you agree to our policies</span>
                  <div className="flex gap-3">
                    <Link href="/legal/privacy" className="hover:text-[var(--color-aurora-purple)] flex items-center gap-1 min-h-[44px] items-center">
                      Privacy <ExternalLink className="w-3 h-3" />
                    </Link>
                    <Link href="/legal/cookies" className="hover:text-[var(--color-aurora-purple)] flex items-center gap-1 min-h-[44px] items-center">
                      Cookies <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg bg-[var(--card)] border-[var(--border)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Cookie className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Control how Aurora App uses cookies and data. Your choices are saved locally.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {cookieCategories.map((category) => (
              <div
                key={category.id}
                className="border border-[var(--border)] rounded-xl overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--accent)]/50"
                  onClick={() => setExpandedSection(
                    expandedSection === category.id ? null : category.id
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      preferences[category.id as keyof CookiePreferences]
                        ? "bg-[var(--color-aurora-purple)]/20"
                        : "bg-[var(--accent)]"
                    }`}>
                      <category.icon className={`w-5 h-5 ${
                        preferences[category.id as keyof CookiePreferences]
                          ? "text-[var(--color-aurora-purple)]"
                          : "text-[var(--muted-foreground)]"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">
                          {category.name}
                        </span>
                        {category.required && (
                          <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] text-[10px]">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={preferences[category.id as keyof CookiePreferences]}
                      disabled={category.required}
                      onCheckedChange={(checked) => {
                        if (!category.required) {
                          setPreferences({
                            ...preferences,
                            [category.id]: checked,
                          });
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {expandedSection === category.id ? (
                      <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedSection === category.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-sm text-[var(--muted-foreground)] bg-[var(--accent)] p-3 rounded-lg">
                          {category.details}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => savePreferences(preferences)}
              className="flex-1 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]"
            >
              Save Preferences
            </Button>
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="border-[var(--border)] min-h-[44px]"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Hook to check cookie consent status
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (saved) {
      setConsent(JSON.parse(saved));
    }

    const handleUpdate = (e: CustomEvent<CookiePreferences>) => {
      setConsent(e.detail);
    };

    window.addEventListener("aurora-consent-updated", handleUpdate as EventListener);
    return () => window.removeEventListener("aurora-consent-updated", handleUpdate as EventListener);
  }, []);

  return consent;
}
