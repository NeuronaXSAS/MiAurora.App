/**
 * Aurora AI Search Engine - Search Cache Functions
 * 
 * Implements aggressive caching to minimize Brave API calls.
 * Cache expires after 24 hours.
 * 
 * Requirements: 12.1, 12.2, 12.5
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Creates a simple hash of normalized query for cache lookup
 * Uses djb2 algorithm - fast and good distribution
 */
function hashQuery(queryStr: string): string {
  const normalized = queryStr.toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get cached search results
 */
export const getCachedSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const queryHash = hashQuery(args.query);
    const now = Date.now();

    const cached = await ctx.db
      .query("searchCache")
      .withIndex("by_hash", (q) => q.eq("queryHash", queryHash))
      .first();

    // Return null if not found or expired
    if (!cached || cached.expiresAt < now) {
      return null;
    }

    return {
      results: cached.results,
      auroraInsights: cached.auroraInsights,
      cachedAt: cached.cachedAt,
      hitCount: cached.hitCount,
    };
  },
});

/**
 * Cache search results
 */
export const cacheSearchResults = mutation({
  args: {
    query: v.string(),
    results: v.any(),
    auroraInsights: v.any(),
  },
  handler: async (ctx, args) => {
    const queryHash = hashQuery(args.query);
    const now = Date.now();

    // Check if already cached
    const existing = await ctx.db
      .query("searchCache")
      .withIndex("by_hash", (q) => q.eq("queryHash", queryHash))
      .first();

    if (existing) {
      // Update existing cache entry
      await ctx.db.patch(existing._id, {
        results: args.results,
        auroraInsights: args.auroraInsights,
        cachedAt: now,
        expiresAt: now + CACHE_DURATION_MS,
        hitCount: existing.hitCount + 1,
      });
      return existing._id;
    }

    // Create new cache entry
    return await ctx.db.insert("searchCache", {
      queryHash,
      query: args.query,
      results: args.results,
      auroraInsights: args.auroraInsights,
      cachedAt: now,
      expiresAt: now + CACHE_DURATION_MS,
      hitCount: 1,
    });
  },
});

/**
 * Increment cache hit count
 */
export const incrementCacheHit = mutation({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const queryHash = hashQuery(args.query);

    const cached = await ctx.db
      .query("searchCache")
      .withIndex("by_hash", (q) => q.eq("queryHash", queryHash))
      .first();

    if (cached) {
      await ctx.db.patch(cached._id, {
        hitCount: cached.hitCount + 1,
      });
    }
  },
});

/**
 * Clean expired cache entries
 */
export const cleanExpiredCache = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all expired entries
    const expired = await ctx.db
      .query("searchCache")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();

    // Delete expired entries
    let deletedCount = 0;
    for (const entry of expired) {
      await ctx.db.delete(entry._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

/**
 * Get cache statistics
 */
export const getCacheStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const allEntries = await ctx.db.query("searchCache").collect();
    const validEntries = allEntries.filter(e => e.expiresAt > now);
    const expiredEntries = allEntries.filter(e => e.expiresAt <= now);
    
    const totalHits = validEntries.reduce((sum, e) => sum + e.hitCount, 0);

    return {
      totalEntries: allEntries.length,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      totalHits,
      averageHitsPerEntry: validEntries.length > 0 
        ? Math.round(totalHits / validEntries.length) 
        : 0,
    };
  },
});
