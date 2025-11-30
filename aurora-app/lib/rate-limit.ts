/**
 * Aurora App - Rate Limiting System
 * 
 * Simple in-memory rate limiting for API routes.
 * For production at scale, consider using Redis or Upstash.
 * 
 * Limits:
 * - Free users: More restrictive limits
 * - Premium users: Higher limits or unlimited
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on server restart - fine for MVP)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  // AI Chat - Most expensive resource
  aiChat: {
    free: { requests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/day
    premium: { requests: 1000, windowMs: 24 * 60 * 60 * 1000 }, // 1000/day (essentially unlimited)
  },
  // Post creation
  createPost: {
    free: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5/hour
    premium: { requests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
  },
  // Comments
  createComment: {
    free: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    premium: { requests: 200, windowMs: 60 * 60 * 1000 }, // 200/hour
  },
  // Reels upload
  uploadReel: {
    free: { requests: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3/day
    premium: { requests: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20/day
  },
  // Livestream
  startLivestream: {
    free: { requests: 2, windowMs: 24 * 60 * 60 * 1000 }, // 2/day
    premium: { requests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/day
  },
  // Emergency/Panic - No limits for safety
  emergency: {
    free: { requests: 100, windowMs: 60 * 60 * 1000 }, // High limit for safety
    premium: { requests: 100, windowMs: 60 * 60 * 1000 },
  },
  // General API calls
  general: {
    free: { requests: 100, windowMs: 60 * 1000 }, // 100/minute
    premium: { requests: 500, windowMs: 60 * 1000 }, // 500/minute
  },
};

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // milliseconds until reset
  limit: number;
}

/**
 * Check and update rate limit for a user
 */
export function checkRateLimit(
  userId: string,
  type: RateLimitType,
  isPremium: boolean = false
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const limits = isPremium ? config.premium : config.free;
  const key = `${userId}:${type}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Reset if window has passed
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + limits.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limits.requests) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
      limit: limits.requests,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    remaining: limits.requests - entry.count,
    resetIn: entry.resetTime - now,
    limit: limits.requests,
  };
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  userId: string,
  type: RateLimitType,
  isPremium: boolean = false
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const limits = isPremium ? config.premium : config.free;
  const key = `${userId}:${type}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    return {
      success: true,
      remaining: limits.requests,
      resetIn: limits.windowMs,
      limit: limits.requests,
    };
  }

  return {
    success: entry.count < limits.requests,
    remaining: Math.max(0, limits.requests - entry.count),
    resetIn: entry.resetTime - now,
    limit: limits.requests,
  };
}

/**
 * Reset rate limit for a user (admin function)
 */
export function resetRateLimit(userId: string, type?: RateLimitType): void {
  if (type) {
    rateLimitStore.delete(`${userId}:${type}`);
  } else {
    // Reset all limits for user
    for (const key of rateLimitStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}
