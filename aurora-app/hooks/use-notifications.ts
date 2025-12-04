"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isNotificationSupported,
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  showNotification,
  showSafetyAlert,
  showCheckinReminder,
  showMessageNotification,
  showLivestreamNotification,
  showGiftNotification,
  showCreditNotification,
  showAchievementNotification,
  showOpportunityNotification,
  showCircleNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  isNotificationTypeEnabled,
  type NotificationType,
  type NotificationPreferences,
} from "@/lib/notifications";

export interface UseNotificationsReturn {
  // Status
  isSupported: boolean;
  isPushSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  isLoading: boolean;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  
  // Notification methods
  notify: (type: NotificationType, title: string, body: string, options?: Record<string, unknown>) => Promise<boolean>;
  notifySafetyAlert: (title: string, body: string, url?: string) => Promise<boolean>;
  notifyCheckin: (checkinId: string, location?: string) => Promise<boolean>;
  notifyMessage: (senderName: string, preview: string, conversationId: string) => Promise<boolean>;
  notifyLivestream: (hostName: string, title: string, livestreamId: string) => Promise<boolean>;
  notifyGift: (senderName: string, giftName: string, credits: number) => Promise<boolean>;
  notifyCredits: (amount: number, reason: string) => Promise<boolean>;
  notifyAchievement: (name: string, description: string) => Promise<boolean>;
  notifyOpportunity: (title: string, company: string, opportunityId: string) => Promise<boolean>;
  notifyCircle: (circleName: string, activity: string, circleId: string) => Promise<boolean>;
  
  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  isTypeEnabled: (type: NotificationType) => boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences());

  // Check initial state
  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermission("unsupported");
      return;
    }

    setPermission(getNotificationPermission());

    // Check push subscription
    if (isPushSupported() && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      return result === "granted";
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to push
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const subscription = await subscribeToPush();
      const success = !!subscription;
      setIsSubscribed(success);
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) setIsSubscribed(false);
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generic notify
  const notify = useCallback(async (
    type: NotificationType,
    title: string,
    body: string,
    options?: Record<string, unknown>
  ): Promise<boolean> => {
    if (!isNotificationTypeEnabled(type)) return false;
    return showNotification(type, title, body, options);
  }, []);

  // Specific notification methods
  const notifySafetyAlert = useCallback(async (title: string, body: string, url?: string) => {
    return showSafetyAlert(title, body, url);
  }, []);

  const notifyCheckin = useCallback(async (checkinId: string, location?: string) => {
    return showCheckinReminder(checkinId, location);
  }, []);

  const notifyMessage = useCallback(async (senderName: string, preview: string, conversationId: string) => {
    if (!isNotificationTypeEnabled("message")) return false;
    return showMessageNotification(senderName, preview, conversationId);
  }, []);

  const notifyLivestream = useCallback(async (hostName: string, title: string, livestreamId: string) => {
    if (!isNotificationTypeEnabled("livestream")) return false;
    return showLivestreamNotification(hostName, title, livestreamId);
  }, []);

  const notifyGift = useCallback(async (senderName: string, giftName: string, credits: number) => {
    if (!isNotificationTypeEnabled("gift_received")) return false;
    return showGiftNotification(senderName, giftName, credits);
  }, []);

  const notifyCredits = useCallback(async (amount: number, reason: string) => {
    if (!isNotificationTypeEnabled("credit_earned")) return false;
    return showCreditNotification(amount, reason);
  }, []);

  const notifyAchievement = useCallback(async (name: string, description: string) => {
    if (!isNotificationTypeEnabled("achievement")) return false;
    return showAchievementNotification(name, description);
  }, []);

  const notifyOpportunity = useCallback(async (title: string, company: string, opportunityId: string) => {
    if (!isNotificationTypeEnabled("opportunity")) return false;
    return showOpportunityNotification(title, company, opportunityId);
  }, []);

  const notifyCircle = useCallback(async (circleName: string, activity: string, circleId: string) => {
    if (!isNotificationTypeEnabled("circle_activity")) return false;
    return showCircleNotification(circleName, activity, circleId);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    saveNotificationPreferences(prefs);
    setPreferences(getNotificationPreferences());
  }, []);

  // Check if type is enabled
  const isTypeEnabled = useCallback((type: NotificationType) => {
    return isNotificationTypeEnabled(type);
  }, []);

  return {
    isSupported: isNotificationSupported(),
    isPushSupported: isPushSupported(),
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    notify,
    notifySafetyAlert,
    notifyCheckin,
    notifyMessage,
    notifyLivestream,
    notifyGift,
    notifyCredits,
    notifyAchievement,
    notifyOpportunity,
    notifyCircle,
    preferences,
    updatePreferences,
    isTypeEnabled,
  };
}
