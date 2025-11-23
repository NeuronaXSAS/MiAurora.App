import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get unified activity feed with posts, routes, and opportunities
 */
export const getUnifiedFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Fetch recent posts with author data
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(limit);

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author,
          type: "post" as const,
          timestamp: post._creationTime,
        };
      })
    );

    // Fetch recent public routes with creator data
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .order("desc")
      .take(limit);

    const routesWithCreators = await Promise.all(
      routes.map(async (route) => {
        const creator = await ctx.db.get(route.creatorId);
        return {
          ...route,
          creator,
          type: "route" as const,
          timestamp: route._creationTime,
        };
      })
    );

    // Fetch recent active opportunities with creator data
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);

    const opportunitiesWithCreators = await Promise.all(
      opportunities.map(async (opp) => {
        const creator = await ctx.db.get(opp.creatorId);
        return {
          ...opp,
          creator,
          type: "opportunity" as const,
          timestamp: opp._creationTime,
        };
      })
    );

    // Combine and sort by creation time
    const allItems = [
      ...postsWithAuthors,
      ...routesWithCreators,
      ...opportunitiesWithCreators,
    ];

    // Sort by timestamp descending
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    // Take only the requested limit
    return allItems.slice(0, limit);
  },
});

/**
 * Get filtered unified feed by content type
 */
export const getFilteredFeed = query({
  args: {
    contentType: v.optional(
      v.union(v.literal("post"), v.literal("route"), v.literal("opportunity"), v.literal("all"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const contentType = args.contentType ?? "all";

    if (contentType === "all") {
      // Return unified feed
      const allFeed = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit);
      
      return allFeed.map((post) => ({
        ...post,
        type: "post" as const,
        timestamp: post._creationTime,
      }));
    }

    if (contentType === "post") {
      const posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit);
      
      return posts.map((post) => ({
        ...post,
        type: "post" as const,
        timestamp: post._creationTime,
      }));
    }

    if (contentType === "route") {
      const routes = await ctx.db
        .query("routes")
        .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
        .order("desc")
        .take(limit);
      
      return routes.map((route) => ({
        ...route,
        type: "route" as const,
        timestamp: route._creationTime,
      }));
    }

    if (contentType === "opportunity") {
      const opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(limit);
      
      return opportunities.map((opp) => ({
        ...opp,
        type: "opportunity" as const,
        timestamp: opp._creationTime,
      }));
    }

    return [];
  },
});

/**
 * Get public recent activity for landing page (no auth required)
 * Returns anonymized activity data
 */
export const getPublicActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const activities: Array<{
      type: "post" | "route" | "opportunity";
      message: string;
      timestamp: number;
      color: string;
    }> = [];

    // Get recent posts
    const recentPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(3);

    for (const post of recentPosts) {
      const author = await ctx.db.get(post.authorId);
      const firstName = author?.name?.split(" ")[0] || "Someone";
      const locationName = post.location?.name ? ` in ${post.location.name.split(",")[0]}` : "";
      
      activities.push({
        type: "post",
        message: `${firstName} shared a ${post.lifeDimension} experience${locationName}`,
        timestamp: post._creationTime,
        color: "green",
      });
    }

    // Get recent routes
    const recentRoutes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .order("desc")
      .take(3);

    for (const route of recentRoutes) {
      const creator = await ctx.db.get(route.creatorId);
      const firstName = creator?.name?.split(" ")[0] || "Someone";
      const distance = route.distance ? `${(route.distance / 1000).toFixed(1)}km` : "";
      
      activities.push({
        type: "route",
        message: `${firstName} shared a ${distance} safe route${route.tags?.length ? ` (${route.tags[0]})` : ""}`,
        timestamp: route._creationTime,
        color: "blue",
      });
    }

    // Get recent opportunities
    const recentOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(3);

    for (const opp of recentOpportunities) {
      const creator = await ctx.db.get(opp.creatorId);
      const firstName = creator?.name?.split(" ")[0] || "Someone";
      
      activities.push({
        type: "opportunity",
        message: `${firstName} posted a ${opp.category} opportunity${opp.location ? ` in ${opp.location.split(",")[0]}` : ""}`,
        timestamp: opp._creationTime,
        color: "purple",
      });
    }

    // Sort by timestamp and take limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});
