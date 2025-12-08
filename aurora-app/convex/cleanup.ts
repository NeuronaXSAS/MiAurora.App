/**
 * Aurora App - Data Cleanup & Quality Control
 * 
 * Utilities to clean up seeded/test data that causes issues:
 * - Broken reels with invalid URLs
 * - Posts without proper locations
 * - Orphaned data
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// DIAGNOSTIC QUERIES
// ============================================

/**
 * Get statistics about data quality issues
 */
export const getDataQualityStats = query({
  args: {},
  handler: async (ctx) => {
    // Count reels by status
    const allReels = await ctx.db.query("reels").collect();
    const reelStats = {
      total: allReels.length,
      approved: allReels.filter(r => r.moderationStatus === "approved").length,
      pending: allReels.filter(r => r.moderationStatus === "pending").length,
      flagged: allReels.filter(r => r.moderationStatus === "flagged").length,
      withValidVideo: allReels.filter(r => 
        r.videoUrl && 
        !r.videoUrl.includes("example.com") && 
        !r.videoUrl.includes("placeholder")
      ).length,
      withBrokenVideo: allReels.filter(r => 
        !r.videoUrl || 
        r.videoUrl.includes("example.com") || 
        r.videoUrl.includes("placeholder")
      ).length,
    };

    // Count posts with/without location
    const allPosts = await ctx.db.query("posts").collect();
    const postStats = {
      total: allPosts.length,
      withLocation: allPosts.filter(p => p.location?.coordinates).length,
      withoutLocation: allPosts.filter(p => !p.location?.coordinates).length,
      reelPosts: allPosts.filter(p => p.postType === "reel" || p.reelId).length,
    };

    // Count routes
    const allRoutes = await ctx.db.query("routes").collect();
    const routeStats = {
      total: allRoutes.length,
      public: allRoutes.filter(r => r.sharingLevel === "public").length,
      withCoordinates: allRoutes.filter(r => r.coordinates?.length > 0).length,
    };

    return {
      reels: reelStats,
      posts: postStats,
      routes: routeStats,
      summary: {
        brokenReels: reelStats.withBrokenVideo,
        postsWithoutLocation: postStats.withoutLocation,
        totalIssues: reelStats.withBrokenVideo + postStats.withoutLocation,
      }
    };
  },
});

/**
 * List broken reels for review
 */
export const listBrokenReels = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const allReels = await ctx.db.query("reels").take(limit * 2);
    
    return allReels.filter(r => 
      !r.videoUrl || 
      r.videoUrl.includes("example.com") || 
      r.videoUrl.includes("placeholder") ||
      r.moderationStatus === "pending"
    ).slice(0, limit).map(r => ({
      _id: r._id,
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl,
      caption: r.caption,
      moderationStatus: r.moderationStatus,
      authorId: r.authorId,
      _creationTime: r._creationTime,
    }));
  },
});

// ============================================
// CLEANUP MUTATIONS
// ============================================

/**
 * Delete broken reels (those with invalid URLs)
 * Returns count of deleted items
 */
export const deleteBrokenReels = mutation({
  args: { 
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true; // Default to dry run for safety
    
    const allReels = await ctx.db.query("reels").collect();
    const brokenReels = allReels.filter(r => 
      !r.videoUrl || 
      r.videoUrl.includes("example.com") || 
      r.videoUrl.includes("placeholder")
    );

    if (dryRun) {
      return {
        dryRun: true,
        wouldDelete: brokenReels.length,
        reelIds: brokenReels.map(r => r._id),
      };
    }

    // Delete broken reels
    let deleted = 0;
    for (const reel of brokenReels) {
      // Also delete associated post if it exists
      const associatedPost = await ctx.db
        .query("posts")
        .filter(q => q.eq(q.field("reelId"), reel._id))
        .first();
      
      if (associatedPost) {
        await ctx.db.delete(associatedPost._id);
      }
      
      // Delete reel likes
      const likes = await ctx.db
        .query("reelLikes")
        .withIndex("by_reel", q => q.eq("reelId", reel._id))
        .collect();
      for (const like of likes) {
        await ctx.db.delete(like._id);
      }
      
      // Delete reel comments
      const comments = await ctx.db
        .query("reelComments")
        .withIndex("by_reel", q => q.eq("reelId", reel._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      
      await ctx.db.delete(reel._id);
      deleted++;
    }

    return {
      dryRun: false,
      deleted,
    };
  },
});

/**
 * Approve all pending reels that have valid video URLs
 * (For bootstrapping - in production, use proper moderation)
 */
export const approveValidPendingReels = mutation({
  args: { 
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    
    const pendingReels = await ctx.db
      .query("reels")
      .filter(q => q.eq(q.field("moderationStatus"), "pending"))
      .collect();
    
    const validPending = pendingReels.filter(r => 
      r.videoUrl && 
      !r.videoUrl.includes("example.com") && 
      !r.videoUrl.includes("placeholder") &&
      r.videoUrl.startsWith("http")
    );

    if (dryRun) {
      return {
        dryRun: true,
        wouldApprove: validPending.length,
        reelIds: validPending.map(r => r._id),
      };
    }

    let approved = 0;
    for (const reel of validPending) {
      await ctx.db.patch(reel._id, {
        moderationStatus: "approved",
      });
      approved++;
    }

    return {
      dryRun: false,
      approved,
    };
  },
});

/**
 * Delete posts without location (for map-centric platform)
 * Be careful - this is destructive!
 */
export const deletePostsWithoutLocation = mutation({
  args: { 
    dryRun: v.optional(v.boolean()),
    keepReelPosts: v.optional(v.boolean()), // Keep reel posts even without location
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const keepReelPosts = args.keepReelPosts ?? true;
    
    const allPosts = await ctx.db.query("posts").collect();
    const postsWithoutLocation = allPosts.filter(p => {
      if (!p.location?.coordinates) {
        // Optionally keep reel posts
        if (keepReelPosts && (p.postType === "reel" || p.reelId)) {
          return false;
        }
        return true;
      }
      return false;
    });

    if (dryRun) {
      return {
        dryRun: true,
        wouldDelete: postsWithoutLocation.length,
        postIds: postsWithoutLocation.slice(0, 20).map(p => p._id),
      };
    }

    let deleted = 0;
    for (const post of postsWithoutLocation) {
      // Delete associated comments
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", q => q.eq("postId", post._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      
      // Delete votes
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_target", q => q.eq("targetId", post._id))
        .collect();
      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }
      
      await ctx.db.delete(post._id);
      deleted++;
    }

    return {
      dryRun: false,
      deleted,
    };
  },
});

/**
 * Add random locations to posts that don't have them
 * (For testing/demo purposes only)
 */
export const addRandomLocationsToPostsWithout = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    centerLat: v.optional(v.number()),
    centerLng: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const centerLat = args.centerLat ?? 40.7128; // NYC default
    const centerLng = args.centerLng ?? -74.0060;
    const radiusKm = args.radiusKm ?? 50;

    const postsWithoutLocation = await ctx.db
      .query("posts")
      .filter(q => q.eq(q.field("location"), undefined))
      .collect();

    if (dryRun) {
      return {
        dryRun: true,
        wouldUpdate: postsWithoutLocation.length,
      };
    }

    // City names for random assignment
    const cityNames = [
      "Downtown", "Midtown", "Uptown", "East Side", "West Side",
      "Financial District", "Arts District", "Tech Hub", "University Area",
      "Shopping Center", "Business Park", "Residential Area"
    ];

    let updated = 0;
    for (const post of postsWithoutLocation) {
      // Generate random point within radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;
      const latOffset = (distance / 111) * Math.cos(angle);
      const lngOffset = (distance / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
      
      const newLat = centerLat + latOffset;
      const newLng = centerLng + lngOffset;
      const cityName = cityNames[Math.floor(Math.random() * cityNames.length)];

      await ctx.db.patch(post._id, {
        location: {
          name: cityName,
          coordinates: [newLng, newLat],
        },
      });
      updated++;
    }

    return {
      dryRun: false,
      updated,
    };
  },
});

// ============================================
// COMPREHENSIVE CONTENT MONITORING
// ============================================

/**
 * Get complete content inventory across all types
 * For admin dashboard monitoring
 */
export const getContentInventory = query({
  args: {},
  handler: async (ctx) => {
    // Posts breakdown
    const allPosts = await ctx.db.query("posts").collect();
    const postsByType = {
      standard: allPosts.filter(p => !p.postType || p.postType === "standard").length,
      poll: allPosts.filter(p => p.postType === "poll").length,
      aiChat: allPosts.filter(p => p.postType === "ai_chat").length,
      reel: allPosts.filter(p => p.postType === "reel" || p.reelId).length,
    };
    const postsByDimension = {
      professional: allPosts.filter(p => p.lifeDimension === "professional").length,
      social: allPosts.filter(p => p.lifeDimension === "social").length,
      daily: allPosts.filter(p => p.lifeDimension === "daily").length,
      travel: allPosts.filter(p => p.lifeDimension === "travel").length,
      financial: allPosts.filter(p => p.lifeDimension === "financial").length,
    };
    const postsByModeration = {
      approved: allPosts.filter(p => p.moderationStatus === "approved").length,
      pending: allPosts.filter(p => p.moderationStatus === "pending").length,
      flagged: allPosts.filter(p => p.moderationStatus === "flagged").length,
      noStatus: allPosts.filter(p => !p.moderationStatus).length,
    };

    // Reels breakdown
    const allReels = await ctx.db.query("reels").collect();
    const reelsByModeration = {
      approved: allReels.filter(r => r.moderationStatus === "approved").length,
      pending: allReels.filter(r => r.moderationStatus === "pending").length,
      flagged: allReels.filter(r => r.moderationStatus === "flagged").length,
      rejected: allReels.filter(r => r.moderationStatus === "rejected").length,
    };
    const reelsByProvider = {
      cloudinary: allReels.filter(r => r.provider === "cloudinary").length,
      aws: allReels.filter(r => r.provider === "aws").length,
      custom: allReels.filter(r => r.provider === "custom").length,
    };

    // Routes breakdown
    const allRoutes = await ctx.db.query("routes").collect();
    const routesByType = {
      walking: allRoutes.filter(r => r.routeType === "walking").length,
      running: allRoutes.filter(r => r.routeType === "running").length,
      cycling: allRoutes.filter(r => r.routeType === "cycling").length,
      commuting: allRoutes.filter(r => r.routeType === "commuting").length,
    };
    const routesBySharing = {
      public: allRoutes.filter(r => r.sharingLevel === "public").length,
      anonymous: allRoutes.filter(r => r.sharingLevel === "anonymous").length,
      private: allRoutes.filter(r => r.sharingLevel === "private").length,
    };

    // Generated content (AI)
    const generatedDebates = await ctx.db.query("generatedDebates").collect();
    const generatedTips = await ctx.db.query("generatedTips").collect();

    // Users
    const allUsers = await ctx.db.query("users").collect();
    const userStats = {
      total: allUsers.length,
      onboarded: allUsers.filter(u => u.onboardingCompleted).length,
      premium: allUsers.filter(u => u.isPremium).length,
      withCredits: allUsers.filter(u => (u.credits || 0) > 0).length,
    };

    // Comments
    const allComments = await ctx.db.query("comments").collect();
    const reelComments = await ctx.db.query("reelComments").collect();

    // Circles
    const allCircles = await ctx.db.query("circles").collect();

    // Daily debates
    const dailyDebates = await ctx.db.query("dailyDebates").collect();

    return {
      posts: {
        total: allPosts.length,
        byType: postsByType,
        byDimension: postsByDimension,
        byModeration: postsByModeration,
        withLocation: allPosts.filter(p => p.location?.coordinates).length,
        verified: allPosts.filter(p => p.isVerified).length,
        anonymous: allPosts.filter(p => p.isAnonymous).length,
      },
      reels: {
        total: allReels.length,
        byModeration: reelsByModeration,
        byProvider: reelsByProvider,
        totalViews: allReels.reduce((sum, r) => sum + (r.views || 0), 0),
        totalLikes: allReels.reduce((sum, r) => sum + (r.likes || 0), 0),
      },
      routes: {
        total: allRoutes.length,
        byType: routesByType,
        bySharing: routesBySharing,
        totalDistance: allRoutes.reduce((sum, r) => sum + (r.distance || 0), 0),
      },
      generatedContent: {
        debates: generatedDebates.length,
        tips: generatedTips.length,
        total: generatedDebates.length + generatedTips.length,
      },
      users: userStats,
      engagement: {
        comments: allComments.length,
        reelComments: reelComments.length,
        circles: allCircles.length,
        dailyDebates: dailyDebates.length,
      },
    };
  },
});

/**
 * List all content by source (real users vs seeded/generated)
 */
export const getContentBySource = query({
  args: { contentType: v.union(v.literal("posts"), v.literal("reels"), v.literal("routes")) },
  handler: async (ctx, args) => {
    // Known seed user patterns (adjust based on your seed data)
    const seedPatterns = ["seed", "test", "demo", "example"];
    
    if (args.contentType === "posts") {
      const posts = await ctx.db.query("posts").collect();
      const withAuthors = await Promise.all(
        posts.slice(0, 100).map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          const isSeeded = author?.email?.includes("seed") || 
                          author?.name?.toLowerCase().includes("test") ||
                          seedPatterns.some(p => author?.email?.includes(p));
          return {
            _id: post._id,
            title: post.title,
            authorName: author?.name || "Unknown",
            authorEmail: author?.email || "Unknown",
            isSeeded,
            hasLocation: !!post.location?.coordinates,
            postType: post.postType || "standard",
            _creationTime: post._creationTime,
          };
        })
      );
      
      return {
        total: posts.length,
        seeded: withAuthors.filter(p => p.isSeeded).length,
        real: withAuthors.filter(p => !p.isSeeded).length,
        sample: withAuthors.slice(0, 20),
      };
    }
    
    if (args.contentType === "reels") {
      const reels = await ctx.db.query("reels").collect();
      const withAuthors = await Promise.all(
        reels.slice(0, 100).map(async (reel) => {
          const author = await ctx.db.get(reel.authorId);
          const isSeeded = author?.email?.includes("seed") || 
                          seedPatterns.some(p => author?.email?.includes(p)) ||
                          reel.videoUrl?.includes("example.com");
          return {
            _id: reel._id,
            caption: reel.caption,
            authorName: author?.name || "Unknown",
            isSeeded,
            provider: reel.provider,
            moderationStatus: reel.moderationStatus,
            views: reel.views,
            _creationTime: reel._creationTime,
          };
        })
      );
      
      return {
        total: reels.length,
        seeded: withAuthors.filter(r => r.isSeeded).length,
        real: withAuthors.filter(r => !r.isSeeded).length,
        sample: withAuthors.slice(0, 20),
      };
    }
    
    if (args.contentType === "routes") {
      const routes = await ctx.db.query("routes").collect();
      const withCreators = await Promise.all(
        routes.slice(0, 100).map(async (route) => {
          const creator = await ctx.db.get(route.creatorId);
          const isSeeded = creator?.email?.includes("seed") || 
                          seedPatterns.some(p => creator?.email?.includes(p));
          return {
            _id: route._id,
            title: route.title,
            creatorName: creator?.name || "Unknown",
            isSeeded,
            routeType: route.routeType,
            sharingLevel: route.sharingLevel,
            distance: route.distance,
            _creationTime: route._creationTime,
          };
        })
      );
      
      return {
        total: routes.length,
        seeded: withCreators.filter(r => r.isSeeded).length,
        real: withCreators.filter(r => !r.isSeeded).length,
        sample: withCreators.slice(0, 20),
      };
    }
    
    return { total: 0, seeded: 0, real: 0, sample: [] };
  },
});

/**
 * Delete all seeded/test content
 */
export const deleteSeededContent = mutation({
  args: {
    contentType: v.union(v.literal("posts"), v.literal("reels"), v.literal("routes"), v.literal("all")),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const seedPatterns = ["seed", "test", "demo", "example"];
    
    // Get all seed users
    const allUsers = await ctx.db.query("users").collect();
    const seedUserIds = allUsers
      .filter(u => seedPatterns.some(p => u.email?.includes(p) || u.name?.toLowerCase().includes(p)))
      .map(u => u._id);
    
    let deleted = { posts: 0, reels: 0, routes: 0 };
    
    if (args.contentType === "posts" || args.contentType === "all") {
      const posts = await ctx.db.query("posts").collect();
      const seededPosts = posts.filter(p => seedUserIds.includes(p.authorId));
      
      if (!dryRun) {
        for (const post of seededPosts) {
          await ctx.db.delete(post._id);
        }
      }
      deleted.posts = seededPosts.length;
    }
    
    if (args.contentType === "reels" || args.contentType === "all") {
      const reels = await ctx.db.query("reels").collect();
      const seededReels = reels.filter(r => 
        seedUserIds.includes(r.authorId) || 
        r.videoUrl?.includes("example.com")
      );
      
      if (!dryRun) {
        for (const reel of seededReels) {
          await ctx.db.delete(reel._id);
        }
      }
      deleted.reels = seededReels.length;
    }
    
    if (args.contentType === "routes" || args.contentType === "all") {
      const routes = await ctx.db.query("routes").collect();
      const seededRoutes = routes.filter(r => seedUserIds.includes(r.creatorId));
      
      if (!dryRun) {
        for (const route of seededRoutes) {
          await ctx.db.delete(route._id);
        }
      }
      deleted.routes = seededRoutes.length;
    }
    
    return {
      dryRun,
      deleted,
      seedUsersFound: seedUserIds.length,
    };
  },
});

/**
 * Reduce marker density by keeping only highest-rated posts per grid cell
 * This improves map performance on mobile
 */
export const optimizeMapMarkers = query({
  args: {
    gridSizeKm: v.optional(v.number()), // Size of grid cells in km
  },
  handler: async (ctx, args) => {
    const gridSize = args.gridSizeKm ?? 1; // 1km grid by default
    const gridSizeDeg = gridSize / 111; // Approximate degrees

    const posts = await ctx.db
      .query("posts")
      .filter(q => q.neq(q.field("location"), undefined))
      .collect();

    // Group posts by grid cell
    const grid: Map<string, typeof posts> = new Map();
    
    for (const post of posts) {
      if (!post.location?.coordinates) continue;
      const [lng, lat] = post.location.coordinates;
      const gridX = Math.floor(lng / gridSizeDeg);
      const gridY = Math.floor(lat / gridSizeDeg);
      const key = `${gridX},${gridY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(post);
    }

    // For each cell, keep only the highest-rated post
    const optimizedPosts: string[] = [];
    const removedPosts: string[] = [];

    for (const [, cellPosts] of grid) {
      // Sort by rating (desc), then by verification count (desc)
      cellPosts.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.verificationCount - a.verificationCount;
      });
      
      // Keep the best one
      optimizedPosts.push(cellPosts[0]._id);
      
      // Mark others for potential removal
      for (let i = 1; i < cellPosts.length; i++) {
        removedPosts.push(cellPosts[i]._id);
      }
    }

    return {
      totalPosts: posts.length,
      optimizedCount: optimizedPosts.length,
      redundantCount: removedPosts.length,
      reductionPercent: Math.round((removedPosts.length / posts.length) * 100),
      // Don't return all IDs, just stats
    };
  },
});
