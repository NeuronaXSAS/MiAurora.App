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

    // Fetch recent posts with author data and route data if linked
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(limit);

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        // Get route data if this post is linked to a route
        let routeData = null;
        if (post.routeId) {
          const route = await ctx.db.get(post.routeId);
          if (route) {
            routeData = {
              _id: route._id,
              title: route.title,
              routeType: route.routeType,
              distance: route.distance,
              duration: route.duration,
              rating: route.rating,
              tags: route.tags,
              coordinates: route.coordinates,
              startLocation: route.startLocation,
              endLocation: route.endLocation,
              completionCount: route.completionCount,
            };
          }
        }

        // Get reel data if this post is linked to a reel
        let reelData = null;
        if (post.reelId) {
          const reel = await ctx.db.get(post.reelId);
          if (reel) {
            reelData = {
              _id: reel._id,
              authorId: reel.authorId,
              videoUrl: reel.videoUrl,
              thumbnailUrl: reel.thumbnailUrl,
              caption: reel.caption,
              hashtags: reel.hashtags,
              location: reel.location,
              duration: reel.duration,
              views: reel.views,
              likes: reel.likes,
              shares: reel.shares,
              comments: reel.comments,
            };
          }
        }
        
        return {
          ...post,
          author,
          route: routeData,
          reel: reelData,
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


/**
 * Get public feed for landing page (no auth required)
 * Returns posts that are suitable for public viewing
 */
export const getPublicFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    try {
      // Get recent posts - prioritize those with good engagement
      const posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit * 2); // Get more to filter

      // If no posts, return empty array
      if (!posts || posts.length === 0) {
        return [];
      }

      const publicPosts = await Promise.all(
        posts.map(async (post) => {
          try {
            const author = post.authorId ? await ctx.db.get(post.authorId) : null;
            
            // Use stored commentCount instead of querying comments table
            const commentCount = post.commentCount ?? 0;

            return {
              _id: post._id,
              _creationTime: post._creationTime,
              title: post.title || "",
              content: post.description || "",
              category: post.lifeDimension || post.postType || "general",
              location: post.location?.name || null,
              rating: post.rating || 0,
              upvotes: post.upvotes || 0,
              commentCount: commentCount,
              isAnonymous: post.isAnonymous ?? false,
              authorName: post.isAnonymous ? null : (author?.name || null),
              type: "post" as const,
            };
          } catch {
            // Skip posts that fail to process
            return null;
          }
        })
      );

      // Filter out null entries and posts with very little content
      const filteredPosts = publicPosts.filter(
        (post): post is NonNullable<typeof post> => 
          post !== null && typeof post.content === 'string' && post.content.length > 20
      );

      return filteredPosts.slice(0, limit);
    } catch {
      // Return empty array on any error to prevent page crash
      return [];
    }
  },
});
