"use client";

// Aurora App Notification System
// Comprehensive push notification management for web app

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification types for different features
export type NotificationType = 
  | "safety_alert"
  | "safety_checkin"
  | "emergency"
  | "message"
  | "circle_activity"
  | "livestream"
  | "gift_received"
  | "credit_earned"
  | "achievement"
  | "opportunity"
  | "route_shared"
  | "ai_response"
  | "system";

// Default notification configurations by type
const NOTIFICATION_CONFIGS: Record<NotificationType, Partial<NotificationPayload>> = {
  safety_alert: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    tag: "safety",
  },
  safety_checkin: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: "checkin",
  },
  emergency: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500],
    tag: "emergency",
  },
  message: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100, 50, 100],
    tag: "message",
  },
  circle_activity: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100],
    tag: "circle",
  },
  livestream: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100, 50, 100],
    tag: "live",
    actions: [
      { action: "watch", title: "Watch Now" },
      { action: "dismiss", title: "Later" },
    ],
  },
  gift_received: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100, 50, 100, 50, 100],
    tag: "gift",
  },
  credit_earned: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100, 50, 100],
    tag: "credits",
  },
  achievement: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100, 50, 100, 50, 100, 50, 100],
    tag: "achievement",
  },
  opportunity: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100, 50, 100],
    tag: "opportunity",
  },
  route_shared: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    vibrate: [100],
    tag: "route",
  },
  ai_response: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    silent: true,
    tag: "ai",
  },
  system: {
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    tag: "system",
  },
};

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "PushManager" in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("[Aurora Notifications] Permission request failed:", error);
    return "denied";
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn("[Aurora Notifications] Push not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      // Note: In production, you'd get the VAPID public key from your server
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.warn("[Aurora Notifications] VAPID key not configured");
        return null;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    return subscription;
  } catch (error) {
    console.error("[Aurora Notifications] Push subscription failed:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[Aurora Notifications] Unsubscribe failed:", error);
    return false;
  }
}

/**
 * Show a local notification
 */
export async function showNotification(
  type: NotificationType,
  title: string,
  body: string,
  options?: Partial<NotificationPayload>
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  
  const permission = getNotificationPermission();
  if (permission !== "granted") {
    console.warn("[Aurora Notifications] Permission not granted");
    return false;
  }

  try {
    const config = NOTIFICATION_CONFIGS[type];
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      body,
      ...config,
      ...options,
      data: {
        type,
        timestamp: Date.now(),
        ...options?.data,
      },
    });

    return true;
  } catch (error) {
    console.error("[Aurora Notifications] Show notification failed:", error);
    return false;
  }
}

/**
 * Show safety alert notification (high priority)
 */
export async function showSafetyAlert(
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  return showNotification("safety_alert", title, body, {
    data: { url: url || "/emergency" },
    actions: [
      { action: "view", title: "View Details" },
      { action: "safe", title: "I'm Safe" },
    ],
  });
}

/**
 * Show safety check-in reminder
 */
export async function showCheckinReminder(
  checkinId: string,
  location?: string
): Promise<boolean> {
  return showNotification(
    "safety_checkin",
    "Safety Check-in Reminder",
    location ? `Are you safe at ${location}?` : "Time for your safety check-in",
    {
      data: { url: "/emergency", checkinId },
      actions: [
        { action: "safe", title: "I'm Safe ✓" },
        { action: "help", title: "Need Help" },
      ],
    }
  );
}

/**
 * Show new message notification
 */
export async function showMessageNotification(
  senderName: string,
  preview: string,
  conversationId: string
): Promise<boolean> {
  return showNotification(
    "message",
    `New message from ${senderName}`,
    preview.length > 100 ? preview.substring(0, 100) + "..." : preview,
    {
      data: { url: `/messages/${conversationId}` },
      actions: [
        { action: "reply", title: "Reply" },
        { action: "view", title: "View" },
      ],
    }
  );
}

/**
 * Show livestream notification
 */
export async function showLivestreamNotification(
  hostName: string,
  title: string,
  livestreamId: string
): Promise<boolean> {
  return showNotification(
    "livestream",
    `${hostName} is live!`,
    title,
    {
      data: { url: `/live/${livestreamId}` },
    }
  );
}

/**
 * Show gift received notification
 */
export async function showGiftNotification(
  senderName: string,
  giftName: string,
  credits: number
): Promise<boolean> {
  return showNotification(
    "gift_received",
    `🎁 Gift from ${senderName}!`,
    `You received a ${giftName} worth ${credits} credits`,
    {
      data: { url: "/wallet" },
    }
  );
}

/**
 * Show credit earned notification
 */
export async function showCreditNotification(
  amount: number,
  reason: string
): Promise<boolean> {
  return showNotification(
    "credit_earned",
    `+${amount} Credits Earned! 🎉`,
    reason,
    {
      data: { url: "/wallet" },
    }
  );
}

/**
 * Show achievement notification
 */
export async function showAchievementNotification(
  achievementName: string,
  description: string
): Promise<boolean> {
  return showNotification(
    "achievement",
    `🏆 Achievement Unlocked!`,
    `${achievementName}: ${description}`,
    {
      data: { url: "/profile" },
    }
  );
}

/**
 * Show opportunity notification
 */
export async function showOpportunityNotification(
  title: string,
  company: string,
  opportunityId: string
): Promise<boolean> {
  return showNotification(
    "opportunity",
    `New Opportunity: ${title}`,
    `${company} is looking for someone like you!`,
    {
      data: { url: `/opportunities/${opportunityId}` },
      actions: [
        { action: "view", title: "View Details" },
        { action: "save", title: "Save" },
      ],
    }
  );
}

/**
 * Show circle activity notification
 */
export async function showCircleNotification(
  circleName: string,
  activity: string,
  circleId: string
): Promise<boolean> {
  return showNotification(
    "circle_activity",
    circleName,
    activity,
    {
      data: { url: `/circles/${circleId}` },
    }
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Notification preferences storage
 */
export interface NotificationPreferences {
  enabled: boolean;
  safety: boolean;
  messages: boolean;
  circles: boolean;
  livestreams: boolean;
  gifts: boolean;
  credits: boolean;
  achievements: boolean;
  opportunities: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  safety: true,
  messages: true,
  circles: true,
  livestreams: true,
  gifts: true,
  credits: true,
  achievements: true,
  opportunities: true,
  marketing: false,
};

/**
 * Get notification preferences
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  
  const stored = localStorage.getItem("aurora-notification-preferences");
  if (stored) {
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): void {
  if (typeof window === "undefined") return;
  
  const current = getNotificationPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem("aurora-notification-preferences", JSON.stringify(updated));
}

/**
 * Check if a notification type is enabled
 */
export function isNotificationTypeEnabled(type: NotificationType): boolean {
  const prefs = getNotificationPreferences();
  
  if (!prefs.enabled) return false;
  
  switch (type) {
    case "safety_alert":
    case "safety_checkin":
    case "emergency":
      return prefs.safety;
    case "message":
      return prefs.messages;
    case "circle_activity":
      return prefs.circles;
    case "livestream":
      return prefs.livestreams;
    case "gift_received":
      return prefs.gifts;
    case "credit_earned":
      return prefs.credits;
    case "achievement":
      return prefs.achievements;
    case "opportunity":
      return prefs.opportunities;
    default:
      return true;
  }
}
