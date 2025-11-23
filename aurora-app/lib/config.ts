/**
 * Centralized Configuration Management
 * 
 * Single source of truth for all environment variables.
 * Provides type safety and validation for configuration values.
 */

interface AppConfig {
  // Core Infrastructure
  convexUrl: string;
  nodeEnv: string;
  
  // Authentication
  workos: {
    apiKey: string;
    clientId: string;
    redirectUri: string;
  };
  
  // AI Services
  googleAI: {
    apiKey: string;
  };
  
  // Video Services
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
  };
  
  // Livestreaming
  agora: {
    appId: string;
    appCertificate: string | null;
  };
  
  // Maps & Location
  mapbox: {
    token: string;
    style: string;
  };
  
  // Analytics
  posthog: {
    key: string;
    host: string;
  };
  
  // Monetization
  adsense: {
    publisherId: string;
  };
  
  // Emergency Services
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

/**
 * Validate required environment variables
 */
function validateConfig(): void {
  const required = [
    'NEXT_PUBLIC_CONVEX_URL',
    'WORKOS_API_KEY',
    'WORKOS_CLIENT_ID',
    'GOOGLE_AI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing required environment variables: ${missing.join(', ')}\n` +
      `   Check docs/ENV_MASTER_GUIDE.md for setup instructions.`
    );
  }
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  validateConfig();
}

/**
 * Application Configuration
 * 
 * Reads from environment variables with sensible defaults.
 * Server-side only variables are marked with comments.
 */
export const CONFIG: AppConfig = {
  // Core Infrastructure
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Authentication (WorkOS)
  workos: {
    apiKey: process.env.WORKOS_API_KEY || '', // Server-side only
    clientId: process.env.WORKOS_CLIENT_ID || '',
    redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  },
  
  // AI Services (Google Gemini)
  googleAI: {
    apiKey: process.env.GOOGLE_AI_API_KEY || '', // Server-side only
  },
  
  // Video Services (Cloudinary)
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '', // Server-side only
    uploadPreset: 'aurora_reels', // Configured in Cloudinary dashboard
  },
  
  // Livestreaming (Agora)
  agora: {
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
    appCertificate: process.env.AGORA_APP_CERTIFICATE || null, // Server-side only, optional for test mode
  },
  
  // Maps & Location (Mapbox)
  mapbox: {
    token: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
    style: process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/streets-v12',
  },
  
  // Analytics (PostHog)
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  },
  
  // Monetization (Google AdSense)
  adsense: {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
  },
  
  // Emergency Services (Twilio)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '', // Server-side only
    authToken: process.env.TWILIO_AUTH_TOKEN || '', // Server-side only
    fromNumber: process.env.TWILIO_PHONE_NUMBER || '+13613265007', // Your Twilio number
  },
};

/**
 * Helper to check if a service is configured
 */
export const isConfigured = {
  workos: !!CONFIG.workos.apiKey && !!CONFIG.workos.clientId,
  googleAI: !!CONFIG.googleAI.apiKey,
  cloudinary: !!CONFIG.cloudinary.cloudName && !!CONFIG.cloudinary.apiKey,
  agora: !!CONFIG.agora.appId,
  mapbox: !!CONFIG.mapbox.token,
  posthog: !!CONFIG.posthog.key,
  adsense: !!CONFIG.adsense.publisherId,
  twilio: !!CONFIG.twilio.accountSid && !!CONFIG.twilio.authToken,
};

/**
 * Get configuration status for debugging
 */
export function getConfigStatus() {
  return {
    environment: CONFIG.nodeEnv,
    services: {
      workos: isConfigured.workos ? '✅ Configured' : '❌ Missing credentials',
      googleAI: isConfigured.googleAI ? '✅ Configured' : '❌ Missing API key',
      cloudinary: isConfigured.cloudinary ? '✅ Configured' : '❌ Missing credentials',
      agora: isConfigured.agora ? '✅ Configured' : '❌ Missing App ID',
      mapbox: isConfigured.mapbox ? '✅ Configured' : '❌ Missing token',
      posthog: isConfigured.posthog ? '✅ Configured' : '❌ Missing key',
      adsense: isConfigured.adsense ? '✅ Configured' : '⚠️  Missing Publisher ID (optional)',
      twilio: isConfigured.twilio ? '✅ Configured' : '⚠️  Missing credentials (optional)',
    },
  };
}

// Log configuration status in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('📋 Aurora Configuration Status:');
  const status = getConfigStatus();
  Object.entries(status.services).forEach(([service, state]) => {
    console.log(`   ${service}: ${state}`);
  });
}
