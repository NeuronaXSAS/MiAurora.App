/**
 * Aurora AI Search Engine - API Usage Tracking
 * 
 * Tracks Brave API usage for Free tier (2,000 requests/month).
 * Alerts at 80% usage and enables graceful degradation.
 * 
 * Requirements: 12.3, 12.4, 12.6
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Free tier limit
const FREE_TIER_LIMIT = 2000;
const ALERT_THRESHOLD = 0.8; // 80%

/**
 * Get current month string (YYYY-MM format)
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get current API usage for this month
 */
export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const month = getCurrentMonth();
    
    const usage = await ctx.db
      .query("searchApiUsage")
      .withIndex("by_month", (q) => q.eq("month", month))
      .first();

    if (!usage) {
      return {
        month,
        used: 0,
        limit: FREE_TIER_LIMIT,
        remaining: FREE_TIER_LIMIT,
        percentUsed: 0,
        isNearLimit: false,
        isAtLimit: false,
      };
    }

    const remaining = Math.max(0, usage.limit - usage.used);
    const percentUsed = Math.round((usage.used / usage.limit) * 100);

    return {
      month: usage.month,
      used: usage.used,
      limit: usage.limit,
      remaining,
      percentUsed,
      isNearLimit: percentUsed >= ALERT_THRESHOLD * 100,
      isAtLimit: remaining === 0,
    };
  },
});

/**
 * Increment API usage counter
 * Property 16: Counter should increment by exactly 1
 */
export const incrementUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const month = getCurrentMonth();
    const now = Date.now();
    
    const existing = await ctx.db
      .query("searchApiUsage")
      .withIndex("by_month", (q) => q.eq("month", month))
      .first();

    if (existing) {
      // Increment existing counter
      const newUsed = existing.used + 1;
      await ctx.db.patch(existing._id, {
        used: newUsed,
        lastUpdated: now,
      });

      const remaining = Math.max(0, existing.limit - newUsed);
      const percentUsed = Math.round((newUsed / existing.limit) * 100);

      return {
        used: newUsed,
        limit: existing.limit,
        remaining,
        percentUsed,
        isNearLimit: percentUsed >= ALERT_THRESHOLD * 100,
        isAtLimit: remaining === 0,
      };
    }

    // Create new month entry
    await ctx.db.insert("searchApiUsage", {
      month,
      used: 1,
      limit: FREE_TIER_LIMIT,
      lastUpdated: now,
    });

    return {
      used: 1,
      limit: FREE_TIER_LIMIT,
      remaining: FREE_TIER_LIMIT - 1,
      percentUsed: 0,
      isNearLimit: false,
      isAtLimit: false,
    };
  },
});

/**
 * Check if API limit allows a new request
 */
export const checkLimit = query({
  args: { isAuthenticated: v.boolean() },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();
    
    const usage = await ctx.db
      .query("searchApiUsage")
      .withIndex("by_month", (q) => q.eq("month", month))
      .first();

    if (!usage) {
      return { allowed: true, reason: null };
    }

    const remaining = usage.limit - usage.used;
    const percentUsed = (usage.used / usage.limit) * 100;

    // At limit - no requests allowed
    if (remaining <= 0) {
      return { 
        allowed: false, 
        reason: 'API_LIMIT_REACHED',
        message: 'Monthly API limit reached. Showing community results only.',
      };
    }

    // Near limit - prioritize authenticated users
    if (percentUsed >= ALERT_THRESHOLD * 100 && !args.isAuthenticated) {
      return { 
        allowed: false, 
        reason: 'RATE_LIMITED',
        message: 'Search is limited for guests. Sign in for full access.',
      };
    }

    return { allowed: true, reason: null };
  },
});

/**
 * Get usage history for admin dashboard
 */
export const getUsageHistory = query({
  args: {},
  handler: async (ctx) => {
    const allUsage = await ctx.db.query("searchApiUsage").collect();
    
    return allUsage
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(u => ({
        month: u.month,
        used: u.used,
        limit: u.limit,
        percentUsed: Math.round((u.used / u.limit) * 100),
      }));
  },
});

/**
 * Update API limit (for when upgrading to Base tier)
 */
export const updateLimit = mutation({
  args: { newLimit: v.number() },
  handler: async (ctx, args) => {
    const month = getCurrentMonth();
    
    const existing = await ctx.db
      .query("searchApiUsage")
      .withIndex("by_month", (q) => q.eq("month", month))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        limit: args.newLimit,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("searchApiUsage", {
        month,
        used: 0,
        limit: args.newLimit,
        lastUpdated: Date.now(),
      });
    }

    return { success: true, newLimit: args.newLimit };
  },
});
