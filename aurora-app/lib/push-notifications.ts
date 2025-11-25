/**
 * Push Notifications System for Aurora
 * Handles safety alerts, check-in reminders, and community notifications
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}


// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

// Show local notification (without push server)
export async function showLocalNotification(payload: NotificationPayload): Promise<void> {
  if (!isPushSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || '/icon.png',
    badge: payload.badge || '/icon.png',
    tag: payload.tag,
    data: payload.data,
    requireInteraction: payload.requireInteraction,
    vibrate: [200, 100, 200],
  });
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


// Predefined notification types for Aurora
export const AuroraNotifications = {
  // Safety alerts
  safetyAlert: (message: string, url?: string): NotificationPayload => ({
    title: '🚨 Safety Alert',
    body: message,
    tag: 'safety-alert',
    requireInteraction: true,
    data: { url: url || '/emergency', type: 'safety' },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  // Check-in reminder
  checkInReminder: (userName?: string): NotificationPayload => ({
    title: '💜 Safety Check-in',
    body: userName 
      ? `Hey ${userName}, time for your safety check-in!` 
      : 'Time for your safety check-in!',
    tag: 'checkin-reminder',
    data: { url: '/emergency', type: 'checkin' },
    actions: [
      { action: 'safe', title: "I'm Safe" },
      { action: 'help', title: 'Need Help' },
    ],
  }),

  // Emergency contact alert
  emergencyAlert: (contactName: string): NotificationPayload => ({
    title: '🆘 Emergency Alert',
    body: `${contactName} may need help! They missed their safety check-in.`,
    tag: 'emergency-alert',
    requireInteraction: true,
    data: { url: '/emergency', type: 'emergency' },
    actions: [
      { action: 'call', title: 'Call Now' },
      { action: 'view', title: 'View Location' },
    ],
  }),

  // Credits earned
  creditsEarned: (amount: number, reason: string): NotificationPayload => ({
    title: '✨ Credits Earned!',
    body: `You earned ${amount} credits for ${reason}`,
    tag: 'credits',
    data: { url: '/profile', type: 'credits', amount },
  }),

  // Circle activity
  circleActivity: (circleName: string, activity: string): NotificationPayload => ({
    title: `💜 ${circleName}`,
    body: activity,
    tag: 'circle-activity',
    data: { url: '/circles', type: 'circle' },
  }),

  // New message
  newMessage: (senderName: string, preview: string): NotificationPayload => ({
    title: `💬 ${senderName}`,
    body: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
    tag: 'message',
    data: { url: '/messages', type: 'message' },
  }),

  // Cycle reminder
  cycleReminder: (phase: string, tip: string): NotificationPayload => ({
    title: `🌸 ${phase} Phase`,
    body: tip,
    tag: 'cycle-reminder',
    data: { url: '/health', type: 'cycle' },
  }),

  // Achievement unlocked
  achievement: (title: string, description: string): NotificationPayload => ({
    title: `🏆 ${title}`,
    body: description,
    tag: 'achievement',
    data: { url: '/profile', type: 'achievement' },
  }),
};

// Notification preferences manager
export class NotificationPreferences {
  private static STORAGE_KEY = 'aurora-notification-prefs';

  static getPreferences(): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      safetyAlerts: true,
      checkInReminders: true,
      emergencyAlerts: true,
      credits: true,
      circleActivity: true,
      messages: true,
      cycleReminders: true,
      achievements: true,
    };
  }

  static setPreference(key: string, value: boolean): void {
    const prefs = this.getPreferences();
    prefs[key] = value;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
  }

  static isEnabled(type: string): boolean {
    const prefs = this.getPreferences();
    return prefs[type] !== false;
  }
}
