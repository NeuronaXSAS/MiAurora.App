/**
 * Aurora App - Resource Guard
 * 
 * Protects against excessive API usage in free tier.
 * CRITICAL: We have $0 budget, every API call costs money!
 * 
 * Limits:
 * - Gemini: 200 requests/day (free tier)
 * - Agora: 10,000 minutes/month (free tier)
 * - Cloudinary: 25 credits/month (free tier)
 * - Brave Search: 2,000 queries/month (free tier)
 */

// Daily limits for free tier
export const RESOURCE_LIMITS = {
  gemini: {
    dailyRequests: 150, // Leave buffer from 200 limit
    maxTokensPerRequest: 300,
    model: 'gemini-2.0-flash-lite', // Most economical
  },
  agora: {
    monthlyMinutes: 8000, // Leave buffer from 10,000
    maxSessionMinutes: 30, // Max 30 min per session
    requireRealUser: true, // Don't start without real user
  },
  cloudinary: {
    monthlyCredits: 20, // Leave buffer from 25
    maxFileSizeMB: 10,
    maxVideoLengthSeconds: 60,
  },
  braveSearch: {
    monthlyQueries: 1500, // Leave buffer from 2,000
    cacheHours: 24, // Cache results for 24 hours
  },
};

// In-memory counters (reset on server restart, but better than nothing)
const usageCounters = {
  gemini: { count: 0, lastReset: Date.now() },
  agora: { minutes: 0, lastReset: Date.now() },
  cloudinary: { credits: 0, lastReset: Date.now() },
  braveSearch: { count: 0, lastReset: Date.now() },
};

// Check if we should reset daily counters
function checkDailyReset(counter: { count?: number; minutes?: number; credits?: number; lastReset: number }) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  if (now - counter.lastReset > dayMs) {
    if ('count' in counter) counter.count = 0;
    if ('minutes' in counter) counter.minutes = 0;
    if ('credits' in counter) counter.credits = 0;
    counter.lastReset = now;
  }
}

/**
 * Check if Gemini API call is allowed
 */
export function canUseGemini(): { allowed: boolean; reason?: string; remaining: number } {
  checkDailyReset(usageCounters.gemini);
  
  const remaining = RESOURCE_LIMITS.gemini.dailyRequests - usageCounters.gemini.count;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Daily Gemini limit reached. Resets at midnight UTC.',
      remaining: 0,
    };
  }
  
  // Reserve 20% for critical features
  if (remaining < RESOURCE_LIMITS.gemini.dailyRequests * 0.2) {
    console.warn(`⚠️ Gemini usage high: ${remaining} requests remaining`);
  }
  
  return { allowed: true, remaining };
}

/**
 * Record Gemini API usage
 */
export function recordGeminiUsage() {
  checkDailyReset(usageCounters.gemini);
  usageCounters.gemini.count++;
  console.log(`📊 Gemini usage: ${usageCounters.gemini.count}/${RESOURCE_LIMITS.gemini.dailyRequests}`);
}

/**
 * Check if Agora streaming is allowed
 */
export function canUseAgora(hasRealUser: boolean): { allowed: boolean; reason?: string } {
  // CRITICAL: Don't allow Agora without real users
  if (RESOURCE_LIMITS.agora.requireRealUser && !hasRealUser) {
    return {
      allowed: false,
      reason: 'Livestreaming requires at least one viewer. Share your stream link first!',
    };
  }
  
  checkDailyReset(usageCounters.agora);
  
  const remainingMinutes = RESOURCE_LIMITS.agora.monthlyMinutes - usageCounters.agora.minutes;
  
  if (remainingMinutes <= 0) {
    return {
      allowed: false,
      reason: 'Monthly streaming minutes exhausted. Resets next month.',
    };
  }
  
  return { allowed: true };
}

/**
 * Record Agora usage (call every minute during stream)
 */
export function recordAgoraMinute() {
  usageCounters.agora.minutes++;
  console.log(`📊 Agora usage: ${usageCounters.agora.minutes}/${RESOURCE_LIMITS.agora.monthlyMinutes} minutes`);
}

/**
 * Check if Cloudinary upload is allowed
 */
export function canUseCloudinary(fileSizeMB: number, isVideo: boolean, videoDuration?: number): { 
  allowed: boolean; 
  reason?: string;
} {
  // Check file size
  if (fileSizeMB > RESOURCE_LIMITS.cloudinary.maxFileSizeMB) {
    return {
      allowed: false,
      reason: `File too large. Maximum ${RESOURCE_LIMITS.cloudinary.maxFileSizeMB}MB allowed.`,
    };
  }
  
  // Check video duration
  if (isVideo && videoDuration && videoDuration > RESOURCE_LIMITS.cloudinary.maxVideoLengthSeconds) {
    return {
      allowed: false,
      reason: `Video too long. Maximum ${RESOURCE_LIMITS.cloudinary.maxVideoLengthSeconds} seconds allowed.`,
    };
  }
  
  // Estimate credits (rough: 1 credit per MB for images, 2 for video)
  const estimatedCredits = isVideo ? fileSizeMB * 2 : fileSizeMB;
  const remainingCredits = RESOURCE_LIMITS.cloudinary.monthlyCredits - usageCounters.cloudinary.credits;
  
  if (estimatedCredits > remainingCredits) {
    return {
      allowed: false,
      reason: 'Monthly upload limit reached. Try a smaller file or wait until next month.',
    };
  }
  
  return { allowed: true };
}

/**
 * Record Cloudinary usage
 */
export function recordCloudinaryUsage(credits: number) {
  usageCounters.cloudinary.credits += credits;
  console.log(`📊 Cloudinary usage: ${usageCounters.cloudinary.credits}/${RESOURCE_LIMITS.cloudinary.monthlyCredits} credits`);
}

/**
 * Check if Brave Search is allowed
 */
export function canUseBraveSearch(): { allowed: boolean; reason?: string; remaining: number } {
  checkDailyReset(usageCounters.braveSearch);
  
  const remaining = RESOURCE_LIMITS.braveSearch.monthlyQueries - usageCounters.braveSearch.count;
  
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Monthly search limit reached. Resets next month.',
      remaining: 0,
    };
  }
  
  return { allowed: true, remaining };
}

/**
 * Record Brave Search usage
 */
export function recordBraveSearchUsage() {
  usageCounters.braveSearch.count++;
  console.log(`📊 Brave Search usage: ${usageCounters.braveSearch.count}/${RESOURCE_LIMITS.braveSearch.monthlyQueries}`);
}

/**
 * Get current usage stats (for admin dashboard)
 */
export function getUsageStats() {
  return {
    gemini: {
      used: usageCounters.gemini.count,
      limit: RESOURCE_LIMITS.gemini.dailyRequests,
      percentage: Math.round((usageCounters.gemini.count / RESOURCE_LIMITS.gemini.dailyRequests) * 100),
    },
    agora: {
      used: usageCounters.agora.minutes,
      limit: RESOURCE_LIMITS.agora.monthlyMinutes,
      percentage: Math.round((usageCounters.agora.minutes / RESOURCE_LIMITS.agora.monthlyMinutes) * 100),
    },
    cloudinary: {
      used: usageCounters.cloudinary.credits,
      limit: RESOURCE_LIMITS.cloudinary.monthlyCredits,
      percentage: Math.round((usageCounters.cloudinary.credits / RESOURCE_LIMITS.cloudinary.monthlyCredits) * 100),
    },
    braveSearch: {
      used: usageCounters.braveSearch.count,
      limit: RESOURCE_LIMITS.braveSearch.monthlyQueries,
      percentage: Math.round((usageCounters.braveSearch.count / RESOURCE_LIMITS.braveSearch.monthlyQueries) * 100),
    },
  };
}

/**
 * DEVELOPMENT MODE: Disable expensive features
 */
export const DEV_MODE = {
  // Set to true to disable API calls during development
  disableGemini: false,
  disableAgora: true, // DISABLED by default - too expensive
  disableCloudinary: false,
  disableBraveSearch: false,
  
  // Use mock data instead of real API calls
  useMockData: process.env.NODE_ENV === 'development',
};
