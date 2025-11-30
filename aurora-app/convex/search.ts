/**
 * Aurora App - Global Search
 * 
 * Search across posts, routes, reels, opportunities, and circles.
 * Returns unified results with type indicators.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Search across all public content
 */
export const globalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();
    const limit = args.limit || 20;

    if (searchQuery.length < 2) {
      return { results: [], total: 0 };
    }

    const results: Array<{
      type: "post" | "route" | "reel" | "opportunity" | "circle" | "resource";
      id: string;
      title: string;
      description?: string;
      author?: { name: string; profileImage?: string };
      metadata?: Record<string, any>;
      createdAt: number;
    }> = [];

    // Search Posts
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(100);

    for (const post of posts) {
      if (
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery)
      ) {
        const author = await ctx.db.get(post.authorId);
        results.push({
          type: "post",
          id: post._id,
          title: post.title,
          description: post.description.slice(0, 150) + (post.description.length > 150 ? "..." : ""),
          author: post.isAnonymous ? undefined : author ? {
            name: author.name,
            profileImage: author.profileImage,
          } : undefined,
          metadata: {
            rating: post.rating,
            upvotes: post.upvotes || 0,
            commentCount: post.commentCount || 0,
            dimension: post.lifeDimension,
          },
          createdAt: post._creationTime,
        });
      }
    }

    // Search Routes (public only)
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .order("desc")
      .take(50);

    for (const route of routes) {
      if (
        route.title.toLowerCase().includes(searchQuery) ||
        route.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        route.startLocation.name.toLowerCase().includes(searchQuery) ||
        route.endLocation.name.toLowerCase().includes(searchQuery)
      ) {
        const author = await ctx.db.get(route.creatorId);
        results.push({
          type: "route",
          id: route._id,
          title: route.title,
          description: `${route.routeType} route • ${(route.distance / 1000).toFixed(1)}km`,
          author: route.isAnonymous ? undefined : author ? {
            name: author.name,
            profileImage: author.profileImage,
          } : undefined,
          metadata: {
            routeType: route.routeType,
            distance: route.distance,
            rating: route.rating,
            tags: route.tags,
          },
          createdAt: route._creationTime,
        });
      }
    }

    // Search Reels (approved only)
    const reels = await ctx.db
      .query("reels")
      .order("desc")
      .take(50);

    for (const reel of reels) {
      if (reel.moderationStatus !== "approved") continue;
      
      const captionMatch = reel.caption?.toLowerCase().includes(searchQuery);
      const hashtagMatch = reel.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery));
      
      if (captionMatch || hashtagMatch) {
        const author = await ctx.db.get(reel.authorId);
        results.push({
          type: "reel",
          id: reel._id,
          title: reel.caption?.slice(0, 60) || "Reel",
          description: reel.hashtags?.map(t => `#${t}`).join(" "),
          author: reel.isAnonymous ? undefined : author ? {
            name: author.name,
            profileImage: author.profileImage,
          } : undefined,
          metadata: {
            views: reel.views,
            likes: reel.likes,
            thumbnailUrl: reel.thumbnailUrl,
          },
          createdAt: reel._creationTime,
        });
      }
    }

    // Search Opportunities (active only)
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    for (const opp of opportunities) {
      if (
        opp.title.toLowerCase().includes(searchQuery) ||
        opp.description.toLowerCase().includes(searchQuery) ||
        opp.company?.toLowerCase().includes(searchQuery) ||
        opp.location?.toLowerCase().includes(searchQuery)
      ) {
        results.push({
          type: "opportunity",
          id: opp._id,
          title: opp.title,
          description: opp.description.slice(0, 150) + (opp.description.length > 150 ? "..." : ""),
          metadata: {
            category: opp.category,
            company: opp.company,
            location: opp.location,
            creditCost: opp.creditCost,
          },
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
          title: resource.name,
          description: resource.description.slice(0, 150),
          metadata: {
            category: resource.category,
            isVerified: resource.isVerified,
          },
          createdAt: resource._creationTime,
        });
      }
    }

    // Sort by relevance (exact matches first) and recency
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchQuery ? 1 : 0;
      const bExact = b.title.toLowerCase() === searchQuery ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return b.createdAt - a.createdAt;
    });

    return {
      results: results.slice(0, limit),
      total: results.length,
    };
  },
});
