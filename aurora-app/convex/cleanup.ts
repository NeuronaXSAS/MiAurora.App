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
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a media URL is valid and not a placeholder
 * Used to filter out broken/fake content from feeds
 */
function isValidMediaUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.includes("example.com")) return false;
  if (url.includes("placeholder")) return false;
  if (url.includes("test.com")) return false;
  if (!url.startsWith("http") && !url.startsWith("/")) return false;
  return true;
}

// ============================================
// DIAGNOSTIC QUERIES
// ============================================

/**
 * Get statistics about data quality issues
 */
/**
 * Comprehensive data quality and health statistics
 * Used by the admin dashboard for real-time monitoring
 */
export const getDataQualityStats = query({
  args: {},
  handler: async (ctx) => {
    // Count reels by status
    const allReels = await ctx.db.query("reels").collect();
    const reelStats = {
      total: allReels.length,
      approved: allReels.filter((r) => r.moderationStatus === "approved")
        .length,
      pending: allReels.filter((r) => r.moderationStatus === "pending").length,
      flagged: allReels.filter((r) => r.moderationStatus === "flagged").length,
      withValidVideo: allReels.filter((r) => isValidMediaUrl(r.videoUrl))
        .length,
      withBrokenVideo: allReels.filter((r) => !isValidMediaUrl(r.videoUrl))
        .length,
    };

    // Count posts with/without location
    const allPosts = await ctx.db.query("posts").collect();
    const postStats = {
      total: allPosts.length,
      withLocation: allPosts.filter((p) => p.location?.coordinates).length,
      withoutLocation: allPosts.filter((p) => !p.location?.coordinates).length,
      reelPosts: allPosts.filter((p) => p.postType === "reel" || p.reelId)
        .length,
    };

    // Count routes
    const allRoutes = await ctx.db.query("routes").collect();
    const routeStats = {
      total: allRoutes.length,
      public: allRoutes.filter((r) => r.sharingLevel === "public").length,
      withCoordinates: allRoutes.filter((r) => r.coordinates?.length > 0)
        .length,
    };

    return {
      reels: reelStats,
      posts: postStats,
      routes: routeStats,
      summary: {
        brokenReels: reelStats.withBrokenVideo,
        postsWithoutLocation: postStats.withoutLocation,
        totalIssues: reelStats.withBrokenVideo + postStats.withoutLocation,
      },
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

    return allReels
      .filter(
        (r) =>
          !r.videoUrl ||
          r.videoUrl.includes("example.com") ||
          r.videoUrl.includes("placeholder") ||
          r.moderationStatus === "pending",
      )
      .slice(0, limit)
      .map((r) => ({
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
/**
 * Delete reels with broken/invalid video URLs
 * Includes cleanup of associated posts, likes, and comments
 */
export const deleteBrokenReels = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;

    const allReels = await ctx.db.query("reels").collect();
    const brokenReels = allReels.filter((r) => !isValidMediaUrl(r.videoUrl));

    if (dryRun) {
      return {
        dryRun: true,
        wouldDelete: brokenReels.length,
        reelIds: brokenReels.map((r) => r._id),
      };
    }

    // Delete broken reels
    let deleted = 0;
    for (const reel of brokenReels) {
      // Also delete associated post if it exists
      const associatedPost = await ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("reelId"), reel._id))
        .first();

      if (associatedPost) {
        await ctx.db.delete(associatedPost._id);
      }

      // Delete reel likes
      const likes = await ctx.db
        .query("reelLikes")
        .withIndex("by_reel", (q) => q.eq("reelId", reel._id))
        .collect();
      for (const like of likes) {
        await ctx.db.delete(like._id);
      }

      // Delete reel comments
      const comments = await ctx.db
        .query("reelComments")
        .withIndex("by_reel", (q) => q.eq("reelId", reel._id))
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
/**
 * Approve pending reels that have valid video URLs
 */
export const approveValidPendingReels = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;

    const pendingReels = await ctx.db
      .query("reels")
      .filter((q) => q.eq(q.field("moderationStatus"), "pending"))
      .collect();

    const validPending = pendingReels.filter((r) =>
      isValidMediaUrl(r.videoUrl),
    );

    if (dryRun) {
      return {
        dryRun: true,
        wouldApprove: validPending.length,
        reelIds: validPending.map((r) => r._id),
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
    const postsWithoutLocation = allPosts.filter((p) => {
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
        postIds: postsWithoutLocation.slice(0, 20).map((p) => p._id),
      };
    }

    let deleted = 0;
    for (const post of postsWithoutLocation) {
      // Delete associated comments
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }

      // Delete votes
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_target", (q) => q.eq("targetId", post._id))
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
    const centerLng = args.centerLng ?? -74.006;
    const radiusKm = args.radiusKm ?? 50;

    const postsWithoutLocation = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("location"), undefined))
      .collect();

    if (dryRun) {
      return {
        dryRun: true,
        wouldUpdate: postsWithoutLocation.length,
      };
    }

    // City names for random assignment
    const cityNames = [
      "Downtown",
      "Midtown",
      "Uptown",
      "East Side",
      "West Side",
      "Financial District",
      "Arts District",
      "Tech Hub",
      "University Area",
      "Shopping Center",
      "Business Park",
      "Residential Area",
    ];

    let updated = 0;
    for (const post of postsWithoutLocation) {
      // Generate random point within radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;
      const latOffset = (distance / 111) * Math.cos(angle);
      const lngOffset =
        (distance / (111 * Math.cos((centerLat * Math.PI) / 180))) *
        Math.sin(angle);

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
      standard: allPosts.filter((p) => !p.postType || p.postType === "standard")
        .length,
      poll: allPosts.filter((p) => p.postType === "poll").length,
      aiChat: allPosts.filter((p) => p.postType === "ai_chat").length,
      reel: allPosts.filter((p) => p.postType === "reel" || p.reelId).length,
    };
    const postsByDimension = {
      professional: allPosts.filter((p) => p.lifeDimension === "professional")
        .length,
      social: allPosts.filter((p) => p.lifeDimension === "social").length,
      daily: allPosts.filter((p) => p.lifeDimension === "daily").length,
      travel: allPosts.filter((p) => p.lifeDimension === "travel").length,
      financial: allPosts.filter((p) => p.lifeDimension === "financial").length,
    };
    const postsByModeration = {
      approved: allPosts.filter((p) => p.moderationStatus === "approved")
        .length,
      pending: allPosts.filter((p) => p.moderationStatus === "pending").length,
      flagged: allPosts.filter((p) => p.moderationStatus === "flagged").length,
      noStatus: allPosts.filter((p) => !p.moderationStatus).length,
    };

    // Reels breakdown
    const allReels = await ctx.db.query("reels").collect();
    const reelsByModeration = {
      approved: allReels.filter((r) => r.moderationStatus === "approved")
        .length,
      pending: allReels.filter((r) => r.moderationStatus === "pending").length,
      flagged: allReels.filter((r) => r.moderationStatus === "flagged").length,
      rejected: allReels.filter((r) => r.moderationStatus === "rejected")
        .length,
    };
    const reelsByProvider = {
      cloudinary: allReels.filter((r) => r.provider === "cloudinary").length,
      aws: allReels.filter((r) => r.provider === "aws").length,
      custom: allReels.filter((r) => r.provider === "custom").length,
    };

    // Routes breakdown
    const allRoutes = await ctx.db.query("routes").collect();
    const routesByType = {
      walking: allRoutes.filter((r) => r.routeType === "walking").length,
      running: allRoutes.filter((r) => r.routeType === "running").length,
      cycling: allRoutes.filter((r) => r.routeType === "cycling").length,
      commuting: allRoutes.filter((r) => r.routeType === "commuting").length,
    };
    const routesBySharing = {
      public: allRoutes.filter((r) => r.sharingLevel === "public").length,
      anonymous: allRoutes.filter((r) => r.sharingLevel === "anonymous").length,
      private: allRoutes.filter((r) => r.sharingLevel === "private").length,
    };

    // Generated content (AI)
    const generatedDebates = await ctx.db.query("generatedDebates").collect();
    const generatedTips = await ctx.db.query("generatedTips").collect();

    // Users
    const allUsers = await ctx.db.query("users").collect();
    const userStats = {
      total: allUsers.length,
      onboarded: allUsers.filter((u) => u.onboardingCompleted).length,
      premium: allUsers.filter((u) => u.isPremium).length,
      withCredits: allUsers.filter((u) => (u.credits || 0) > 0).length,
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
        withLocation: allPosts.filter((p) => p.location?.coordinates).length,
        verified: allPosts.filter((p) => p.isVerified).length,
        anonymous: allPosts.filter((p) => p.isAnonymous).length,
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
  args: {
    contentType: v.union(
      v.literal("posts"),
      v.literal("reels"),
      v.literal("routes"),
    ),
  },
  handler: async (ctx, args) => {
    // Known seed user patterns (adjust based on your seed data)
    const seedPatterns = ["seed", "test", "demo", "example"];

    if (args.contentType === "posts") {
      const posts = await ctx.db.query("posts").collect();
      const withAuthors = await Promise.all(
        posts.slice(0, 100).map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          const isSeeded =
            author?.email?.includes("seed") ||
            author?.name?.toLowerCase().includes("test") ||
            seedPatterns.some((p) => author?.email?.includes(p));
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
        }),
      );

      return {
        total: posts.length,
        seeded: withAuthors.filter((p) => p.isSeeded).length,
        real: withAuthors.filter((p) => !p.isSeeded).length,
        sample: withAuthors.slice(0, 20),
      };
    }

    if (args.contentType === "reels") {
      const reels = await ctx.db.query("reels").collect();
      const withAuthors = await Promise.all(
        reels.slice(0, 100).map(async (reel) => {
          const author = await ctx.db.get(reel.authorId);
          const isSeeded =
            author?.email?.includes("seed") ||
            seedPatterns.some((p) => author?.email?.includes(p)) ||
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
        }),
      );

      return {
        total: reels.length,
        seeded: withAuthors.filter((r) => r.isSeeded).length,
        real: withAuthors.filter((r) => !r.isSeeded).length,
        sample: withAuthors.slice(0, 20),
      };
    }

    if (args.contentType === "routes") {
      const routes = await ctx.db.query("routes").collect();
      const withCreators = await Promise.all(
        routes.slice(0, 100).map(async (route) => {
          const creator = await ctx.db.get(route.creatorId);
          const isSeeded =
            creator?.email?.includes("seed") ||
            seedPatterns.some((p) => creator?.email?.includes(p));
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
        }),
      );

      return {
        total: routes.length,
        seeded: withCreators.filter((r) => r.isSeeded).length,
        real: withCreators.filter((r) => !r.isSeeded).length,
        sample: withCreators.slice(0, 20),
      };
    }

    return { total: 0, seeded: 0, real: 0, sample: [] };
  },
});

/**
 * Delete all seeded/test content
 */
/**
 * Get comprehensive user activity metrics
 * Tracks user behavior from landing to deep features
 */
export const getUserActivityMetrics = query({
  args: {
    timeRangeHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.timeRangeHours ?? 24;
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    const recentUsers = allUsers.filter((u) => u._creationTime >= cutoffTime);

    // Get posts activity
    const allPosts = await ctx.db.query("posts").collect();
    const recentPosts = allPosts.filter((p) => p._creationTime >= cutoffTime);

    // Get reels activity
    const allReels = await ctx.db.query("reels").collect();
    const recentReels = allReels.filter((r) => r._creationTime >= cutoffTime);

    // Get comments activity
    const allComments = await ctx.db.query("comments").collect();
    const recentComments = allComments.filter(
      (c) => c._creationTime >= cutoffTime,
    );

    // Get routes activity
    const allRoutes = await ctx.db.query("routes").collect();
    const recentRoutes = allRoutes.filter((r) => r._creationTime >= cutoffTime);

    // Calculate engagement metrics
    const totalViews = allReels.reduce((sum, r) => sum + (r.views || 0), 0);
    const totalLikes = allReels.reduce((sum, r) => sum + (r.likes || 0), 0);
    const postUpvotes = allPosts.reduce((sum, p) => sum + (p.upvotes || 0), 0);

    // User journey metrics
    const onboardedUsers = allUsers.filter((u) => u.onboardingCompleted).length;
    const activeToday = new Set([
      ...recentPosts.map((p) => p.authorId.toString()),
      ...recentReels.map((r) => r.authorId.toString()),
      ...recentComments.map((c) => c.authorId.toString()),
    ]).size;

    // Safety metrics
    const flaggedContent = {
      posts: allPosts.filter((p) => p.moderationStatus === "flagged").length,
      reels: allReels.filter((r) => r.moderationStatus === "flagged").length,
      comments: allComments.filter((c) => c.moderationStatus === "flagged")
        .length,
    };

    // Content health
    const brokenReels = allReels.filter(
      (r) => !isValidMediaUrl(r.videoUrl),
    ).length;
    const postsWithoutLocation = allPosts.filter(
      (p) => !p.location?.coordinates,
    ).length;

    return {
      timeRangeHours: hours,
      users: {
        total: allUsers.length,
        newInPeriod: recentUsers.length,
        onboarded: onboardedUsers,
        onboardingRate:
          allUsers.length > 0
            ? Math.round((onboardedUsers / allUsers.length) * 100)
            : 0,
        activeInPeriod: activeToday,
      },
      content: {
        posts: {
          total: allPosts.length,
          newInPeriod: recentPosts.length,
          totalUpvotes: postUpvotes,
        },
        reels: {
          total: allReels.length,
          newInPeriod: recentReels.length,
          totalViews,
          totalLikes,
          healthy: allReels.length - brokenReels,
          broken: brokenReels,
        },
        comments: {
          total: allComments.length,
          newInPeriod: recentComments.length,
        },
        routes: {
          total: allRoutes.length,
          newInPeriod: recentRoutes.length,
        },
      },
      safety: {
        flaggedContent,
        totalFlagged:
          flaggedContent.posts + flaggedContent.reels + flaggedContent.comments,
        moderationQueue: {
          pendingPosts: allPosts.filter((p) => p.moderationStatus === "pending")
            .length,
          pendingReels: allReels.filter((r) => r.moderationStatus === "pending")
            .length,
          pendingComments: allComments.filter(
            (c) => c.moderationStatus === "pending",
          ).length,
        },
      },
      health: {
        brokenReels,
        postsWithoutLocation,
        issueCount: brokenReels + postsWithoutLocation,
      },
    };
  },
});

/**
 * Get recent moderation activity and audit log
 */
export const getModerationAuditLog = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get recently moderated content
    const allPosts = await ctx.db.query("posts").order("desc").take(200);
    const allReels = await ctx.db.query("reels").order("desc").take(200);
    const allComments = await ctx.db.query("comments").order("desc").take(200);

    const moderatedItems: Array<{
      type: "post" | "reel" | "comment";
      id: string;
      status: string;
      createdAt: number;
      authorId: string;
      preview: string;
    }> = [];

    // Add moderated posts
    for (const post of allPosts) {
      if (post.moderationStatus && post.moderationStatus !== "approved") {
        moderatedItems.push({
          type: "post",
          id: post._id,
          status: post.moderationStatus,
          createdAt: post._creationTime,
          authorId: post.authorId,
          preview: (post.title || post.description || "Untitled").substring(
            0,
            50,
          ),
        });
      }
    }

    // Add moderated reels
    for (const reel of allReels) {
      if (reel.moderationStatus && reel.moderationStatus !== "approved") {
        moderatedItems.push({
          type: "reel",
          id: reel._id,
          status: reel.moderationStatus,
          createdAt: reel._creationTime,
          authorId: reel.authorId,
          preview: (reel.caption || "Untitled reel").substring(0, 50),
        });
      }
    }

    // Add moderated comments
    for (const comment of allComments) {
      if (comment.moderationStatus && comment.moderationStatus !== "approved") {
        moderatedItems.push({
          type: "comment",
          id: comment._id,
          status: comment.moderationStatus,
          createdAt: comment._creationTime,
          authorId: comment.authorId,
          preview: (comment.content || "").substring(0, 50),
        });
      }
    }

    // Sort by creation time and take limit
    return moderatedItems
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/**
 * Get content health breakdown for dashboard
 */
export const getContentHealthBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const allReels = await ctx.db.query("reels").collect();
    const allPosts = await ctx.db.query("posts").collect();

    // Detailed reel health
    const reelHealth = {
      total: allReels.length,
      withValidVideo: allReels.filter((r) => isValidMediaUrl(r.videoUrl))
        .length,
      withValidThumbnail: allReels.filter((r) =>
        isValidMediaUrl(r.thumbnailUrl),
      ).length,
      withCaption: allReels.filter((r) => r.caption && r.caption.length > 0)
        .length,
      withHashtags: allReels.filter((r) => r.hashtags && r.hashtags.length > 0)
        .length,
      withLocation: allReels.filter((r) => r.location).length,
      withEngagement: allReels.filter(
        (r) =>
          (r.views && r.views > 0) ||
          (r.likes && r.likes > 0) ||
          (r.comments && r.comments > 0),
      ).length,
      byModerationStatus: {
        approved: allReels.filter((r) => r.moderationStatus === "approved")
          .length,
        pending: allReels.filter((r) => r.moderationStatus === "pending")
          .length,
        flagged: allReels.filter((r) => r.moderationStatus === "flagged")
          .length,
        rejected: allReels.filter((r) => r.moderationStatus === "rejected")
          .length,
        noStatus: allReels.filter((r) => !r.moderationStatus).length,
      },
    };

    // Detailed post health
    const postHealth = {
      total: allPosts.length,
      withLocation: allPosts.filter((p) => p.location?.coordinates).length,
      withMedia: allPosts.filter((p) => p.media && p.media.length > 0).length,
      withDescription: allPosts.filter(
        (p) => p.description && p.description.length > 50,
      ).length,
      verified: allPosts.filter((p) => p.isVerified).length,
      anonymous: allPosts.filter((p) => p.isAnonymous).length,
      withEngagement: allPosts.filter(
        (p) =>
          (p.upvotes && p.upvotes > 0) ||
          (p.commentCount && p.commentCount > 0),
      ).length,
      byType: {
        standard: allPosts.filter(
          (p) => p.postType === "standard" || !p.postType,
        ).length,
        poll: allPosts.filter((p) => p.postType === "poll").length,
        reel: allPosts.filter((p) => p.postType === "reel").length,
        aiChat: allPosts.filter((p) => p.postType === "ai_chat").length,
      },
      byModerationStatus: {
        approved: allPosts.filter((p) => p.moderationStatus === "approved")
          .length,
        pending: allPosts.filter((p) => p.moderationStatus === "pending")
          .length,
        flagged: allPosts.filter((p) => p.moderationStatus === "flagged")
          .length,
        noStatus: allPosts.filter((p) => !p.moderationStatus).length,
      },
    };

    // Calculate health scores (0-100)
    const reelHealthScore =
      allReels.length > 0
        ? Math.round(
          (reelHealth.withValidVideo / allReels.length) * 40 +
          (reelHealth.withEngagement / allReels.length) * 30 +
          (reelHealth.byModerationStatus.approved / allReels.length) * 30,
        )
        : 100;

    const postHealthScore =
      allPosts.length > 0
        ? Math.round(
          (postHealth.withLocation / allPosts.length) * 30 +
          (postHealth.withEngagement / allPosts.length) * 40 +
          (postHealth.byModerationStatus.approved / allPosts.length) * 30,
        )
        : 100;

    return {
      reels: reelHealth,
      posts: postHealth,
      scores: {
        reels: reelHealthScore,
        posts: postHealthScore,
        overall: Math.round((reelHealthScore + postHealthScore) / 2),
      },
      issues: {
        brokenReels: allReels.length - reelHealth.withValidVideo,
        postsWithoutLocation: allPosts.length - postHealth.withLocation,
        pendingModeration:
          reelHealth.byModerationStatus.pending +
          postHealth.byModerationStatus.pending,
        flaggedContent:
          reelHealth.byModerationStatus.flagged +
          postHealth.byModerationStatus.flagged,
      },
    };
  },
});

/**
 * Get user safety metrics
 */
export const getUserSafetyMetrics = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const allPosts = await ctx.db.query("posts").collect();
    const allReels = await ctx.db.query("reels").collect();
    const allComments = await ctx.db.query("comments").collect();

    // Get flagged content per user
    const userFlaggedContent: Record<
      string,
      { posts: number; reels: number; comments: number }
    > = {};

    for (const post of allPosts) {
      if (post.moderationStatus === "flagged") {
        const key = post.authorId;
        if (!userFlaggedContent[key]) {
          userFlaggedContent[key] = { posts: 0, reels: 0, comments: 0 };
        }
        userFlaggedContent[key].posts++;
      }
    }

    for (const reel of allReels) {
      if (reel.moderationStatus === "flagged") {
        const key = reel.authorId;
        if (!userFlaggedContent[key]) {
          userFlaggedContent[key] = { posts: 0, reels: 0, comments: 0 };
        }
        userFlaggedContent[key].reels++;
      }
    }

    for (const comment of allComments) {
      if (comment.moderationStatus === "flagged") {
        const key = comment.authorId;
        if (!userFlaggedContent[key]) {
          userFlaggedContent[key] = { posts: 0, reels: 0, comments: 0 };
        }
        userFlaggedContent[key].comments++;
      }
    }

    // Calculate risk levels
    const usersWithFlags = Object.entries(userFlaggedContent)
      .map(([userId, counts]) => ({
        userId,
        ...counts,
        total: counts.posts + counts.reels + counts.comments,
      }))
      .filter((u) => u.total > 0);

    const highRiskUsers = usersWithFlags.filter((u) => u.total >= 3);
    const mediumRiskUsers = usersWithFlags.filter(
      (u) => u.total >= 2 && u.total < 3,
    );
    const lowRiskUsers = usersWithFlags.filter((u) => u.total === 1);

    // Trust score distribution
    const trustScoreDistribution = {
      excellent: allUsers.filter((u) => (u.trustScore || 0) >= 80).length,
      good: allUsers.filter(
        (u) => (u.trustScore || 0) >= 60 && (u.trustScore || 0) < 80,
      ).length,
      moderate: allUsers.filter(
        (u) => (u.trustScore || 0) >= 40 && (u.trustScore || 0) < 60,
      ).length,
      low: allUsers.filter(
        (u) => (u.trustScore || 0) >= 20 && (u.trustScore || 0) < 40,
      ).length,
      veryLow: allUsers.filter((u) => (u.trustScore || 0) < 20).length,
      noScore: allUsers.filter((u) => !u.trustScore).length,
    };

    return {
      totalUsers: allUsers.length,
      usersWithFlaggedContent: usersWithFlags.length,
      riskDistribution: {
        high: highRiskUsers.length,
        medium: mediumRiskUsers.length,
        low: lowRiskUsers.length,
      },
      highRiskUsers: highRiskUsers.slice(0, 10), // Top 10 for review
      trustScoreDistribution,
      safetyScore:
        allUsers.length > 0
          ? Math.round(100 - (usersWithFlags.length / allUsers.length) * 100)
          : 100,
    };
  },
});

/**
 * Get real-time feed health metrics
 * Used to identify issues with the feed display
 */
export const getFeedHealthMetrics = query({
  args: {},
  handler: async (ctx) => {
    const allPosts = await ctx.db.query("posts").order("desc").take(100);
    const allReels = await ctx.db.query("reels").order("desc").take(100);

    // Check for reels that would show as "black boxes" in feed
    const feedReadyReels = allReels.filter(
      (r) => isValidMediaUrl(r.videoUrl) && r.moderationStatus === "approved",
    );

    const problematicReels = allReels.filter(
      (r) => !isValidMediaUrl(r.videoUrl) || r.moderationStatus !== "approved",
    );

    // Analyze why reels might appear broken
    const reelIssues = {
      missingVideoUrl: allReels.filter((r) => !r.videoUrl).length,
      placeholderUrl: allReels.filter(
        (r) =>
          r.videoUrl?.includes("example.com") ||
          r.videoUrl?.includes("placeholder"),
      ).length,
      notApproved: allReels.filter((r) => r.moderationStatus !== "approved")
        .length,
      noThumbnail: allReels.filter((r) => !isValidMediaUrl(r.thumbnailUrl))
        .length,
      noEngagement: allReels.filter(
        (r) =>
          (!r.views || r.views === 0) &&
          (!r.likes || r.likes === 0) &&
          (!r.comments || r.comments === 0) &&
          (!r.caption || r.caption.length < 10),
      ).length,
    };

    // Posts that link to problematic reels
    const postsWithBrokenReels = allPosts.filter((p) => {
      if (!p.reelId) return false;
      const linkedReel = allReels.find((r) => r._id === p.reelId);
      return !linkedReel || !isValidMediaUrl(linkedReel.videoUrl);
    });

    return {
      reels: {
        total: allReels.length,
        feedReady: feedReadyReels.length,
        problematic: problematicReels.length,
        healthPercentage:
          allReels.length > 0
            ? Math.round((feedReadyReels.length / allReels.length) * 100)
            : 100,
      },
      issues: reelIssues,
      postsWithBrokenReels: postsWithBrokenReels.length,
      recommendations: [
        reelIssues.placeholderUrl > 0
          ? `Delete ${reelIssues.placeholderUrl} reels with placeholder URLs`
          : null,
        reelIssues.notApproved > 0
          ? `Review ${reelIssues.notApproved} unapproved reels`
          : null,
        postsWithBrokenReels.length > 0
          ? `Fix ${postsWithBrokenReels.length} posts linking to broken reels`
          : null,
      ].filter(Boolean),
    };
  },
});

export const deleteSeededContent = mutation({
  args: {
    contentType: v.union(
      v.literal("posts"),
      v.literal("reels"),
      v.literal("routes"),
      v.literal("all"),
    ),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const seedPatterns = ["seed", "test", "demo", "example"];

    // Get all seed users
    const allUsers = await ctx.db.query("users").collect();
    const seedUserIds = allUsers
      .filter((u) =>
        seedPatterns.some(
          (p) => u.email?.includes(p) || u.name?.toLowerCase().includes(p),
        ),
      )
      .map((u) => u._id);

    const deleted = { posts: 0, reels: 0, routes: 0 };

    if (args.contentType === "posts" || args.contentType === "all") {
      const posts = await ctx.db.query("posts").collect();
      const seededPosts = posts.filter((p) => seedUserIds.includes(p.authorId));

      if (!dryRun) {
        for (const post of seededPosts) {
          await ctx.db.delete(post._id);
        }
      }
      deleted.posts = seededPosts.length;
    }

    if (args.contentType === "reels" || args.contentType === "all") {
      const reels = await ctx.db.query("reels").collect();
      const seededReels = reels.filter(
        (r) =>
          seedUserIds.includes(r.authorId) ||
          r.videoUrl?.includes("example.com"),
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
      const seededRoutes = routes.filter((r) =>
        seedUserIds.includes(r.creatorId),
      );

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
      .filter((q) => q.neq(q.field("location"), undefined))
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
