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
