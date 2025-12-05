/**
 * Aurora App - Public Search (No Authentication Required)
 * 
 * LANDING PAGE SEARCH: Give visitors a taste of Aurora App's value
 * Shows partial results to entice registration while protecting full content.
 * 
 * Security: Only returns public, non-sensitive preview data
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Public search for landing page - returns limited preview data
 * No authentication required - safe for unauthenticated visitors
 */
export const publicSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();
    const limit = Math.min(args.limit || 8, 12); // Cap at 12 results for preview

    if (searchQuery.length < 2) {
      return { results: [], total: 0, hasMore: false };
    }

    const results: Array<{
      type: "post" | "route" | "circle" | "opportunity" | "resource";
      id: string;
      previewTitle: string;
      previewSnippet: string;
      category?: string;
      stats?: { label: string; value: string };
      createdAt: number;
    }> = [];

    // Search Posts - Only public, non-anonymous posts
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(100);

    for (const post of posts) {
      if (post.isAnonymous) continue; // Skip anonymous posts for privacy
      
      if (
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "post",
          id: post._id,
          previewTitle: truncateText(post.title, 50),
          previewSnippet: truncateText(post.description, 80) + "...",
          category: post.lifeDimension,
          stats: { label: "engagement", value: `${(post.upvotes || 0) + (post.commentCount || 0)}` },
          createdAt: post._creationTime,
        });
      }
    }

    // Search Routes - Only public routes
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .order("desc")
      .take(50);

    for (const route of routes) {
      if (route.isAnonymous) continue;
      
      if (
        route.title.toLowerCase().includes(searchQuery) ||
        route.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        route.startLocation.name.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "route",
          id: route._id,
          previewTitle: truncateText(route.title, 50),
          previewSnippet: `Safe ${route.routeType} route • ${(route.distance / 1000).toFixed(1)}km`,
          category: route.routeType,
          stats: route.rating ? { label: "safety", value: `${route.rating}/5` } : undefined,
          createdAt: route._creationTime,
        });
      }
    }

    // Search Circles - Only public circles
    const circles = await ctx.db
      .query("circles")
      .take(50);

    for (const circle of circles) {
      if (circle.isPrivate) continue;
      
      if (
        circle.name.toLowerCase().includes(searchQuery) ||
        circle.description.toLowerCase().includes(searchQuery) ||
        circle.category.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "circle",
          id: circle._id,
          previewTitle: truncateText(circle.name, 50),
          previewSnippet: truncateText(circle.description, 80) + "...",
          category: circle.category,
          stats: { label: "members", value: `${circle.memberCount || 0}` },
          createdAt: circle._creationTime,
        });
      }
    }

    // Search Opportunities - Only active opportunities
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    for (const opp of opportunities) {
      if (
        opp.title.toLowerCase().includes(searchQuery) ||
        opp.description.toLowerCase().includes(searchQuery) ||
        opp.company?.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "opportunity",
          id: opp._id,
          previewTitle: truncateText(opp.title, 50),
          previewSnippet: opp.company ? `at ${opp.company}` : truncateText(opp.description, 60),
          category: opp.category,
          stats: opp.location ? { label: "location", value: opp.location } : undefined,
          createdAt: opp._creationTime,
        });
      }
    }

    // Search Safety Resources
    const resources = await ctx.db
      .query("safetyResources")
      .take(50);

    for (const resource of resources) {
      if (
        resource.name.toLowerCase().includes(searchQuery) ||
        resource.description.toLowerCase().includes(searchQuery) ||
        resource.category.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "resource",
          id: resource._id,
          previewTitle: truncateText(resource.name, 50),
          previewSnippet: truncateText(resource.description, 80) + "...",
          category: resource.category,
          stats: resource.isVerified ? { label: "status", value: "Verified ✓" } : undefined,
          createdAt: resource._creationTime,
        });
      }
    }

    // Sort by relevance and recency
    results.sort((a, b) => {
      const aExact = a.previewTitle.toLowerCase() === searchQuery ? 100 : 0;
      const bExact = b.previewTitle.toLowerCase() === searchQuery ? 100 : 0;
      const aStarts = a.previewTitle.toLowerCase().startsWith(searchQuery) ? 50 : 0;
      const bStarts = b.previewTitle.toLowerCase().startsWith(searchQuery) ? 50 : 0;
      
      const aScore = aExact + aStarts;
      const bScore = bExact + bStarts;
      
      if (aScore !== bScore) return bScore - aScore;
      return b.createdAt - a.createdAt;
    });

    const totalResults = results.length;
    const limitedResults = results.slice(0, limit);

    return {
      results: limitedResults,
      total: totalResults,
      hasMore: totalResults > limit,
    };
  },
});

/**
 * Get trending/popular content for landing page
 * Shows what's hot without requiring authentication
 */
export const getTrendingPreview = query({
  args: {},
  handler: async (ctx) => {
    const trending: Array<{
      type: "post" | "route" | "circle" | "opportunity";
      id: string;
      previewTitle: string;
      previewSnippet: string;
      category?: string;
      engagement: number;
    }> = [];

    // Get top posts by engagement
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(50);

    const topPosts = posts
      .filter(p => !p.isAnonymous)
      .sort((a, b) => ((b.upvotes || 0) + (b.commentCount || 0)) - ((a.upvotes || 0) + (a.commentCount || 0)))
      .slice(0, 3);

    for (const post of topPosts) {
      trending.push({
        type: "post",
        id: post._id,
        previewTitle: truncateText(post.title, 40),
        previewSnippet: truncateText(post.description, 60),
        category: post.lifeDimension,
        engagement: (post.upvotes || 0) + (post.commentCount || 0),
      });
    }

    // Get popular circles
    const circles = await ctx.db
      .query("circles")
      .take(50);

    const topCircles = circles
      .filter(c => !c.isPrivate)
      .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      .slice(0, 2);

    for (const circle of topCircles) {
      trending.push({
        type: "circle",
        id: circle._id,
        previewTitle: truncateText(circle.name, 40),
        previewSnippet: truncateText(circle.description, 60),
        category: circle.category,
        engagement: circle.memberCount || 0,
      });
    }

    // Get recent opportunities
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(3);

    for (const opp of opportunities) {
      trending.push({
        type: "opportunity",
        id: opp._id,
        previewTitle: truncateText(opp.title, 40),
        previewSnippet: opp.company || truncateText(opp.description, 40),
        category: opp.category,
        engagement: 0,
      });
    }

    return trending.slice(0, 6);
  },
});

// Helper function to truncate text safely
function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim();
}
