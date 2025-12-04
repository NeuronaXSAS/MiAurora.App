"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  BellOff, 
  X, 
  Shield, 
  MessageSquare, 
  Gift,
  Sparkles,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/notifications";

interface NotificationPermissionPromptProps {
  onPermissionGranted?: () => void;
  onDismiss?: () => void;
  variant?: "modal" | "card" | "inline";
  delay?: number;
}

export function NotificationPermissionPrompt({
  onPermissionGranted,
  onDismiss,
  variant = "card",
  delay = 5000,
}: NotificationPermissionPromptProps) {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }

    // Get current permission
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Don't show if already granted or denied
    if (currentPermission !== "default") return;

    // Check if user has dismissed recently
    const dismissedTime = localStorage.getItem("aurora-notification-prompt-dismissed");
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 72) return; // Don't show for 72 hours after dismiss
    }

    // Show after delay
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleEnable = async () => {
    setIsRequesting(true);
    
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === "granted") {
        // Subscribe to push notifications
        await subscribeToPush();
        onPermissionGranted?.();
        setShow(false);
      }
    } catch (error) {
      console.error("[Aurora] Notification permission error:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("aurora-notification-prompt-dismissed", Date.now().toString());
    onDismiss?.();
  };

  // Don't render if not supported, already decided, or not showing
  if (permission === "unsupported" || permission !== "default" || !show) {
    return null;
  }

  const benefits = [
    { icon: Shield, text: "Safety alerts & check-in reminders", color: "text-[var(--color-aurora-mint)]" },
    { icon: MessageSquare, text: "New messages from your circles", color: "text-[var(--color-aurora-blue)]" },
    { icon: Gift, text: "Gifts & credit notifications", color: "text-[var(--color-aurora-yellow)]" },
    { icon: Sparkles, text: "Achievement celebrations", color: "text-[var(--color-aurora-pink)]" },
  ];

  // Modal variant
  if (variant === "modal") {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--card)] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Stay Connected</h2>
                <p className="text-white/80 text-sm">
                  Enable notifications to never miss important updates
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {benefits.map((benefit) => (
                    <div key={benefit.text} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center ${benefit.color}`}>
                        <benefit.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-[var(--foreground)]">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleEnable}
                    disabled={isRequesting}
                    className="w-full min-h-[52px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-lg font-semibold"
                  >
                    {isRequesting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enabling...
                      </span>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        Enable Notifications
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    className="w-full min-h-[44px]"
                  >
                    Maybe Later
                  </Button>
                </div>

                <p className="text-xs text-center text-[var(--muted-foreground)] mt-4">
                  You can change this anytime in Settings
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Card variant
  if (variant === "card") {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="border-[var(--color-aurora-purple)]/30 bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-[var(--foreground)]">Enable Notifications</h3>
                      <button
                        onClick={handleDismiss}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">
                      Get safety alerts, messages, and updates instantly
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleEnable}
                        disabled={isRequesting}
                        size="sm"
                        className="bg-[var(--color-aurora-purple)] min-h-[40px]"
                      >
                        {isRequesting ? "Enabling..." : "Enable"}
                      </Button>
                      <Button
                        onClick={handleDismiss}
                        size="sm"
                        variant="ghost"
                        className="min-h-[40px]"
                      >
                        Later
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

  // Inline variant
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-[var(--color-aurora-purple)]/10 border border-[var(--color-aurora-purple)]/20 rounded-xl p-3"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            <span className="text-sm text-[var(--foreground)] flex-1">
              Enable notifications for safety alerts
            </span>
            <Button
              onClick={handleEnable}
              disabled={isRequesting}
              size="sm"
              className="bg-[var(--color-aurora-purple)] min-h-[36px]"
            >
              Enable
            </Button>
            <button
              onClick={handleDismiss}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Notification status indicator for settings
 */
export function NotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }
    setPermission(getNotificationPermission());
  }, []);

  if (permission === "unsupported") {
    return (
      <Badge variant="outline" className="text-[var(--muted-foreground)]">
        <BellOff className="w-3 h-3 mr-1" />
        Not Supported
      </Badge>
    );
  }

  if (permission === "granted") {
    return (
      <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
        <Check className="w-3 h-3 mr-1" />
        Enabled
      </Badge>
    );
  }

  if (permission === "denied") {
    return (
      <Badge variant="outline" className="text-[var(--color-aurora-salmon)]">
        <BellOff className="w-3 h-3 mr-1" />
        Blocked
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[var(--muted-foreground)]">
      <Bell className="w-3 h-3 mr-1" />
      Not Set
    </Badge>
  );
}
