import posthog from 'posthog-js';

export function initPostHog() {
  // Disable PostHog in development to avoid ad blocker errors
  if (typeof window !== 'undefined' && 
      process.env.NEXT_PUBLIC_POSTHOG_KEY && 
      process.env.NODE_ENV === 'production') {
    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        },
      });
    } catch (error) {
      console.warn('PostHog initialization failed:', error);
    }
  }
  return posthog;
}

export { posthog };
