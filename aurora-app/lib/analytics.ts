/**
 * Comprehensive Event Tracking System
 * Provides structured analytics tracking for all user interactions
 * 
 * Handles ad-blocker scenarios gracefully without console spam
 */

import { posthog, safeCapture, safeIdentify, isPostHogAvailable } from './posthog';

// Event Categories
export enum EventCategory {
  USER = 'user',
  CONTENT = 'content',
  ENGAGEMENT = 'engagement',
  ROUTE = 'route',
  CREDIT = 'credit',
  SOCIAL = 'social',
  VIDEO = 'video',
  EMERGENCY = 'emergency',
  MONETIZATION = 'monetization',
}

// User Events
export const UserEvents = {
  SIGNUP: 'user_signup',
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  PROFILE_VIEW: 'user_profile_view',
  PROFILE_EDIT: 'user_profile_edit',
  ONBOARDING_START: 'user_onboarding_start',
  ONBOARDING_COMPLETE: 'user_onboarding_complete',
  SETTINGS_CHANGE: 'user_settings_change',
  ACCOUNT_DELETE: 'user_account_delete',
} as const;

// Content Events
export const ContentEvents = {
  POST_CREATE: 'content_post_create',
  POST_VIEW: 'content_post_view',
  POST_EDIT: 'content_post_edit',
  POST_DELETE: 'content_post_delete',
  POLL_CREATE: 'content_poll_create',
  POLL_VOTE: 'content_poll_vote',
  AI_CHAT_SHARE: 'content_ai_chat_share',
  OPPORTUNITY_CREATE: 'content_opportunity_create',
  OPPORTUNITY_EDIT: 'content_opportunity_edit',
} as const;

// Engagement Events
export const EngagementEvents = {
  LIKE: 'engagement_like',
  UNLIKE: 'engagement_unlike',
  UPVOTE: 'engagement_upvote',
  DOWNVOTE: 'engagement_downvote',
  COMMENT: 'engagement_comment',
  COMMENT_REPLY: 'engagement_comment_reply',
  SHARE: 'engagement_share',
  SAVE: 'engagement_save',
  VERIFY: 'engagement_verify',
  REPORT: 'engagement_report',
} as const;

// Route Events
export const RouteEvents = {
  ROUTE_START: 'route_start',
  ROUTE_PAUSE: 'route_pause',
  ROUTE_RESUME: 'route_resume',
  ROUTE_COMPLETE: 'route_complete',
  ROUTE_SHARE: 'route_share',
  ROUTE_VIEW: 'route_view',
  ROUTE_NAVIGATE: 'route_navigate',
  ROUTE_RATE: 'route_rate',
  GPS_PERMISSION_GRANT: 'route_gps_permission_grant',
  GPS_PERMISSION_DENY: 'route_gps_permission_deny',
} as const;

// Credit Events
export const CreditEvents = {
  CREDIT_EARN: 'credit_earn',
  CREDIT_SPEND: 'credit_spend',
  CREDIT_BALANCE_CHECK: 'credit_balance_check',
  OPPORTUNITY_UNLOCK: 'credit_opportunity_unlock',
  MONTHLY_RESET: 'credit_monthly_reset',
} as const;

// Social Events
export const SocialEvents = {
  FOLLOW: 'social_follow',
  UNFOLLOW: 'social_unfollow',
  BLOCK: 'social_block',
  UNBLOCK: 'social_unblock',
  MESSAGE_SEND: 'social_message_send',
  MESSAGE_READ: 'social_message_read',
  CONVERSATION_START: 'social_conversation_start',
} as const;

// Video Events (for future Reels/Live features)
export const VideoEvents = {
  VIDEO_UPLOAD: 'video_upload',
  VIDEO_VIEW: 'video_view',
  VIDEO_WATCH_TIME: 'video_watch_time',
  VIDEO_COMPLETE: 'video_complete',
  VIDEO_REPLAY: 'video_replay',
  LIVE_START: 'live_start',
  LIVE_END: 'live_end',
  LIVE_JOIN: 'live_join',
  LIVE_LEAVE: 'live_leave',
  LIVE_GIFT: 'live_gift',
} as const;

// Emergency Events
export const EmergencyEvents = {
  PANIC_BUTTON_PRESS: 'emergency_panic_button_press',
  PANIC_BUTTON_CANCEL: 'emergency_panic_button_cancel',
  EMERGENCY_ALERT_SENT: 'emergency_alert_sent',
  EMERGENCY_RESPONSE: 'emergency_response',
  EMERGENCY_RESOLVED: 'emergency_resolved',
  SAFE_ARRIVAL: 'emergency_safe_arrival',
} as const;

// Monetization Events (for future ad platform)
export const MonetizationEvents = {
  AD_VIEW: 'monetization_ad_view',
  AD_CLICK: 'monetization_ad_click',
  AD_CONVERSION: 'monetization_ad_conversion',
  GIFT_PURCHASE: 'monetization_gift_purchase',
  GIFT_SEND: 'monetization_gift_send',
  SUBSCRIPTION_START: 'monetization_subscription_start',
  SUBSCRIPTION_CANCEL: 'monetization_subscription_cancel',
} as const;

// Event Properties Interfaces
export interface BaseEventProperties {
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  platform?: 'web' | 'mobile' | 'pwa';
  userAgent?: string;
}

export interface ContentEventProperties extends BaseEventProperties {
  contentId?: string;
  contentType?: 'post' | 'poll' | 'route' | 'opportunity' | 'ai_chat' | 'reel' | 'live';
  lifeDimension?: string;
  hasMedia?: boolean;
  mediaCount?: number;
  textLength?: number;
}

export interface EngagementEventProperties extends BaseEventProperties {
  targetId?: string;
  targetType?: 'post' | 'comment' | 'route' | 'reel';
  targetAuthorId?: string;
  engagementValue?: number;
}

export interface RouteEventProperties extends BaseEventProperties {
  routeId?: string;
  distance?: number;
  duration?: number;
  pace?: number;
  safetyRating?: number;
  tags?: string[];
  isPublic?: boolean;
}

export interface CreditEventProperties extends BaseEventProperties {
  amount?: number;
  source?: string;
  balance?: number;
  transactionType?: 'earn' | 'spend';
}

export interface VideoEventProperties extends BaseEventProperties {
  videoId?: string;
  duration?: number;
  watchTime?: number;
  completionRate?: number;
  soundId?: string;
}

// Analytics Class
class Analytics {
  private isEnabled: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isEnabled = process.env.NODE_ENV === 'production';
    }
  }

  /**
   * Track a custom event
   * Fails silently if blocked by ad-blocker
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics]', eventName, properties);
      return;
    }

    // Use safe wrapper that handles ad-blocker scenarios
    safeCapture(eventName, {
      ...properties,
      timestamp: Date.now(),
      platform: this.getPlatform(),
    });
  }

  /**
   * Identify a user
   * Fails silently if blocked by ad-blocker
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics] Identify:', userId, traits);
      return;
    }

    safeIdentify(userId, traits);
  }

  /**
   * Track page view
   * Fails silently if blocked by ad-blocker
   */
  page(pageName?: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics] Page:', pageName, properties);
      return;
    }

    safeCapture('$pageview', {
      ...properties,
      pageName,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user properties
   * Fails silently if blocked by ad-blocker
   */
  setUserProperties(properties: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics] Set User Properties:', properties);
      return;
    }

    if (!isPostHogAvailable()) return;
    
    try {
      posthog.people.set(properties);
    } catch {
      // Silently fail - likely blocked by ad-blocker
    }
  }

  /**
   * Increment a user property
   */
  incrementUserProperty(property: string, value: number = 1) {
    if (!this.isEnabled) {
      console.log('[Analytics] Increment:', property, value);
      return;
    }

    // PostHog doesn't have increment, so we track it as an event instead
    this.track(`${property}_incremented`, { value });
  }

  /**
   * Reset analytics (on logout)
   * Fails silently if blocked by ad-blocker
   */
  reset() {
    if (!this.isEnabled) {
      console.log('[Analytics] Reset');
      return;
    }

    if (!isPostHogAvailable()) return;
    
    try {
      posthog.reset();
    } catch {
      // Silently fail - likely blocked by ad-blocker
    }
  }

  /**
   * Get platform type
   */
  private getPlatform(): 'web' | 'mobile' | 'pwa' {
    if (typeof window === 'undefined') return 'web';
    
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'pwa';
    }
    
    // Check if mobile
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 'mobile';
    }
    
    return 'web';
  }

  /**
   * Track session start
   */
  startSession() {
    this.track('session_start', {
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      landingPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }

  /**
   * Track session end
   */
  endSession(duration: number) {
    this.track('session_end', {
      duration,
    });
  }

  /**
   * Track time on page
   */
  trackTimeOnPage(pageName: string, duration: number) {
    this.track('time_on_page', {
      pageName,
      duration,
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(depth: number) {
    this.track('scroll_depth', {
      depth,
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance_metric', {
      metric,
      value,
      unit,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience functions for common events
export const trackUserSignup = (userId: string, method: string) => {
  analytics.track(UserEvents.SIGNUP, { userId, method });
  analytics.identify(userId, { signupMethod: method, signupDate: new Date().toISOString() });
};

export const trackPostCreate = (postId: string, properties: ContentEventProperties) => {
  analytics.track(ContentEvents.POST_CREATE, { postId, ...properties });
  analytics.incrementUserProperty('posts_created');
};

export const trackRouteComplete = (routeId: string, properties: RouteEventProperties) => {
  analytics.track(RouteEvents.ROUTE_COMPLETE, { routeId, ...properties });
  analytics.incrementUserProperty('routes_completed');
};

export const trackCreditEarn = (amount: number, source: string, balance: number) => {
  analytics.track(CreditEvents.CREDIT_EARN, { amount, source, balance, transactionType: 'earn' });
  analytics.setUserProperties({ creditBalance: balance });
};

export const trackCreditSpend = (amount: number, purpose: string, balance: number) => {
  analytics.track(CreditEvents.CREDIT_SPEND, { amount, purpose, balance, transactionType: 'spend' });
  analytics.setUserProperties({ creditBalance: balance });
};

export const trackEngagement = (
  eventName: string,
  targetId: string,
  targetType: string,
  properties?: EngagementEventProperties
) => {
  analytics.track(eventName, { targetId, targetType, ...properties });
};

export const trackEmergency = (eventName: string, properties?: Record<string, any>) => {
  analytics.track(eventName, { ...properties, priority: 'critical' });
};
