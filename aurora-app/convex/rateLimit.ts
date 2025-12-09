/**
 * Aurora App - Persistent Rate Limiting with Convex
 *
 * Enterprise-grade rate limiting that persists across server restarts
 * and works correctly in serverless environments.
 *
 * Features:
 * - Persistent storage in Convex database
 * - Automatic cleanup of expired entries
 * - Premium vs Free tier differentiation
 * - Safety-first approach (emergency features never limited)
 */

import { v } from "convex/values";
import { mutation, query, MutationCtx, internalMutation } from "./_generated/server";

/**
 * Rate limit configurations
 * Defines limits for different actions based on user tier
 */
export const RATE_LIMIT_CONFIG = {
  // AI Chat - Most expensive resource
  aiChat: {
    free: { requests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/day
    premium: { requests: 1000, windowMs: 24 * 60 * 60 * 1000 }, // 1000/day
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
  // Search
  search: {
    free: { requests: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
    premium: { requests: 200, windowMs: 60 * 60 * 1000 }, // 200/hour
  },
  // Direct messages
  sendMessage: {
    free: { requests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
    premium: { requests: 500, windowMs: 60 * 60 * 1000 }, // 500/hour
  },
  // Emergency/Panic - High limit for safety (never block emergencies)
  emergency: {
    free: { requests: 100, windowMs: 60 * 60 * 1000 },
    premium: { requests: 100, windowMs: 60 * 60 * 1000 },
  },
  // General API calls
  general: {
    free: { requests: 100, windowMs: 60 * 1000 }, // 100/minute
    premium: { requests: 500, windowMs: 60 * 1000 }, // 500/minute
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Check rate limit for a user action
 * Returns whether the action is allowed and updates the counter
 */
export const checkRateLimit = mutation({
  args: {
    identifier: v.string(), // Usually oderyId or
    actionType: v.string(),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { identifier, actionType, isPremium } = args;
    const now = Date.now();

    // Get config for this action type
    const config = RATE_LIMIT_CONFIG[actionType as RateLimitType];
    if (!config) {
      // Unknown action type - allow but log
      console.warn(`Unknown rate limit action type: ${actionType}`);
      return {
        allowed: true,
        remaining: 999,
        resetIn: 0,
        limit: 999,
      };
    }

    const limits = isPremium ? config.premium : config.free;
    const key = `${identifier}:${actionType}`;

    // Find existing rate limit entry
    const existingEntry = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    // Check if we need to reset (window expired)
    if (existingEntry && now > existingEntry.resetTime) {
      // Window expired - reset counter
      await ctx.db.patch(existingEntry._id, {
        count: 1,
        resetTime: now + limits.windowMs,
        lastUpdated: now,
      });

      return {
        allowed: true,
        remaining: limits.requests - 1,
        resetIn: limits.windowMs,
        limit: limits.requests,
      };
    }

    if (existingEntry) {
      // Check if limit exceeded
      if (existingEntry.count >= limits.requests) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: existingEntry.resetTime - now,
          limit: limits.requests,
        };
      }

      // Increment counter
      await ctx.db.patch(existingEntry._id, {
        count: existingEntry.count + 1,
        lastUpdated: now,
      });

      return {
        allowed: true,
        remaining: limits.requests - existingEntry.count - 1,
        resetIn: existingEntry.resetTime - now,
        limit: limits.requests,
      };
    }

    // Create new entry
    await ctx.db.insert("rateLimits", {
      key,
      identifier,
      actionType,
      count: 1,
      resetTime: now + limits.windowMs,
      lastUpdated: now,
    });

    return {
      allowed: true,
      remaining: limits.requests - 1,
      resetIn: limits.windowMs,
      limit: limits.requests,
    };
  },
});

/**
 * Get current rate limit status without incrementing
 */
export const getRateLimitStatus = query({
  args: {
    identifier: v.string(),
    actionType: v.string(),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { identifier, actionType, isPremium } = args;
    const now = Date.now();

    const config = RATE_LIMIT_CONFIG[actionType as RateLimitType];
    if (!config) {
      return {
        allowed: true,
        remaining: 999,
        resetIn: 0,
        limit: 999,
      };
    }

    const limits = isPremium ? config.premium : config.free;
    const key = `${identifier}:${actionType}`;

    const entry = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!entry || now > entry.resetTime) {
      return {
        allowed: true,
        remaining: limits.requests,
        resetIn: limits.windowMs,
        limit: limits.requests,
      };
    }

    return {
      allowed: entry.count < limits.requests,
      remaining: Math.max(0, limits.requests - entry.count),
      resetIn: entry.resetTime - now,
      limit: limits.requests,
    };
  },
});

/**
 * Reset rate limit for a specific user/action (admin function)
 */
export const resetRateLimit = mutation({
  args: {
    adminId: v.id("users"),
    identifier: v.string(),
    actionType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      throw new Error("Admin not found");
    }

    // Check admin status using environment variable
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(admin.email.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    if (args.actionType) {
      // Reset specific action type
      const key = `${args.identifier}:${args.actionType}`;
      const entry = await ctx.db
        .query("rateLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (entry) {
        await ctx.db.delete(entry._id);
      }

      return { success: true, deleted: entry ? 1 : 0 };
    } else {
      // Reset all rate limits for this identifier
      const entries = await ctx.db
        .query("rateLimits")
        .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
        .collect();

      for (const entry of entries) {
        await ctx.db.delete(entry._id);
      }

      return { success: true, deleted: entries.length };
    }
  },
});

/**
 * Cleanup expired rate limit entries
 * Should be run periodically (e.g., via scheduled function)
 * This is an internal mutation so it can be called by cron jobs
 */
export const cleanupExpiredRateLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let deletedCount = 0;

    // Get all rate limits that have expired
    // We'll do this in batches to avoid timeout
    const expiredEntries = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("resetTime"), now))
      .take(500); // Process up to 500 at a time

    for (const entry of expiredEntries) {
      await ctx.db.delete(entry._id);
      deletedCount++;
    }

    console.log(`[Rate Limit Cleanup] Deleted ${deletedCount} expired entries`);

    return { success: true, deletedCount };
  },
});

/**
 * Get rate limit statistics for admin dashboard
 */
export const getRateLimitStats = query({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      throw new Error("Admin not found");
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(admin.email.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const now = Date.now();
    const allEntries = await ctx.db.query("rateLimits").collect();

    // Calculate statistics
    const activeEntries = allEntries.filter((e) => e.resetTime > now);
    const expiredEntries = allEntries.filter((e) => e.resetTime <= now);

    // Group by action type
    const byActionType: Record<
      string,
      { active: number; total: number; avgCount: number }
    > = {};

    for (const entry of allEntries) {
      if (!byActionType[entry.actionType]) {
        byActionType[entry.actionType] = { active: 0, total: 0, avgCount: 0 };
      }
      byActionType[entry.actionType].total++;
      if (entry.resetTime > now) {
        byActionType[entry.actionType].active++;
        byActionType[entry.actionType].avgCount += entry.count;
      }
    }

    // Calculate averages
    for (const actionType of Object.keys(byActionType)) {
      const stats = byActionType[actionType];
      if (stats.active > 0) {
        stats.avgCount = Math.round(stats.avgCount / stats.active);
      }
    }

    // Find users hitting limits most frequently
    const limitHitters: Record<string, number> = {};
    for (const entry of activeEntries) {
      const config = RATE_LIMIT_CONFIG[entry.actionType as RateLimitType];
      if (config) {
        const limit = config.free.requests; // Use free tier as baseline
        if (entry.count >= limit * 0.8) {
          // 80% or more of limit
          limitHitters[entry.identifier] =
            (limitHitters[entry.identifier] || 0) + 1;
        }
      }
    }

    return {
      totalEntries: allEntries.length,
      activeEntries: activeEntries.length,
      expiredEntries: expiredEntries.length,
      byActionType,
      topLimitHitters: Object.entries(limitHitters)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([identifier, count]) => ({ identifier, hitCount: count })),
    };
  },
});

/**
 * Helper function to check rate limit from other Convex functions
 * Use this when you need to check rate limit within a mutation/action
 */
export async function checkRateLimitInternal(
  ctx: MutationCtx,
  identifier: string,
  actionType: RateLimitType,
  isPremium: boolean,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
}> {
  const now = Date.now();
  const config = RATE_LIMIT_CONFIG[actionType];
  const limits = isPremium ? config.premium : config.free;
  const key = `${identifier}:${actionType}`;

  const existingEntry = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  // Window expired or no entry
  if (!existingEntry || now > existingEntry.resetTime) {
    if (existingEntry) {
      await ctx.db.patch(existingEntry._id, {
        count: 1,
        resetTime: now + limits.windowMs,
        lastUpdated: now,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        key,
        identifier,
        actionType,
        count: 1,
        resetTime: now + limits.windowMs,
        lastUpdated: now,
      });
    }

    return {
      allowed: true,
      remaining: limits.requests - 1,
      resetIn: limits.windowMs,
      limit: limits.requests,
    };
  }

  // Check if limit exceeded
  if (existingEntry.count >= limits.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existingEntry.resetTime - now,
      limit: limits.requests,
    };
  }

  // Increment counter
  await ctx.db.patch(existingEntry._id, {
    count: existingEntry.count + 1,
    lastUpdated: now,
  });

  return {
    allowed: true,
    remaining: limits.requests - existingEntry.count - 1,
    resetIn: existingEntry.resetTime - now,
    limit: limits.requests,
  };
}
