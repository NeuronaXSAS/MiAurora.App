import posthog from 'posthog-js';

// Track if PostHog is blocked (by ad-blockers)
let isBlocked = false;

export function initPostHog() {
  // Disable PostHog in development to avoid ad blocker errors
  if (typeof window !== 'undefined' && 
      process.env.NEXT_PUBLIC_POSTHOG_KEY && 
      process.env.NODE_ENV === 'production') {
    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        // Disable automatic retries to prevent console spam from ad-blockers
        disable_persistence: false,
        disable_session_recording: true, // Often blocked by ad-blockers
        autocapture: false, // Reduce network requests
        capture_pageview: false, // We'll handle this manually
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
        // Handle blocked requests silently
        on_xhr_error: () => {
          isBlocked = true;
          // Silently fail - don't spam console
        },
        bootstrap: {
          // Disable feature flags to reduce blocked requests
          featureFlags: {},
        },
      });
    } catch {
      // Silently fail - likely blocked by ad-blocker
      isBlocked = true;
    }
  }
  return posthog;
}

/**
 * Safe wrapper for PostHog capture that handles ad-blocker scenarios
 * Fails silently without retries or console spam
 */
export function safeCapture(eventName: string, properties?: Record<string, unknown>) {
  if (isBlocked || typeof window === 'undefined') return;
  
  try {
    posthog.capture(eventName, properties);
  } catch {
    // Silently fail - likely blocked
    isBlocked = true;
  }
}

/**
 * Safe wrapper for PostHog identify
 */
export function safeIdentify(userId: string, traits?: Record<string, unknown>) {
  if (isBlocked || typeof window === 'undefined') return;
  
  try {
    posthog.identify(userId, traits);
  } catch {
    isBlocked = true;
  }
}

/**
 * Check if PostHog is available (not blocked)
 */
export function isPostHogAvailable(): boolean {
  return !isBlocked && typeof window !== 'undefined';
}

export { posthog };
