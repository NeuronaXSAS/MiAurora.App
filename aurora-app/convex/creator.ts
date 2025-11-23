/**
 * Creator Dashboard Backend
 * 
 * Analytics and insights for content creators.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get creator analytics dashboard data
 */
export const getCreatorStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user data
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Get all reels
    const reels = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    // Get all livestreams
    const livestreams = await ctx.db
      .query("livestreams")
      .withIndex("by_host", (q) => q.eq("hostId", args.userId))
      .collect();

    // Get all posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    // Get all routes
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();

    // Calculate Reels metrics
    const reelsStats = {
      totalReels: reels.length,
      totalViews: reels.reduce((sum, r) => sum + r.views, 0),
      totalLikes: reels.reduce((sum, r) => sum + r.likes, 0),
      avgViews: reels.length > 0 ? Math.round(reels.reduce((sum, r) => sum + r.views, 0) / reels.length) : 0,
      avgLikes: reels.length > 0 ? Math.round(reels.reduce((sum, r) => sum + r.likes, 0) / reels.length) : 0,
      topReel: reels.length > 0 ? reels.reduce((max, r) => r.views > max.views ? r : max, reels[0]) : null,
    };

    // Calculate Livestream metrics
    const livestreamStats = {
      totalStreams: livestreams.length,
      totalViews: livestreams.reduce((sum, l) => sum + l.totalViews, 0),
      totalLikes: livestreams.reduce((sum, l) => sum + l.likes, 0),
      peakViewers: livestreams.length > 0 ? Math.max(...livestreams.map(l => l.peakViewerCount)) : 0,
      avgViewers: livestreams.length > 0 ? Math.round(livestreams.reduce((sum, l) => sum + l.peakViewerCount, 0) / livestreams.length) : 0,
      totalMinutesStreamed: livestreams.reduce((sum, l) => {
        if (l.startedAt && l.endedAt) {
          return sum + (l.endedAt - l.startedAt) / 60000;
        }
        return sum;
      }, 0),
    };

    // Calculate Posts metrics
    const postsStats = {
      totalPosts: posts.length,
      totalVerifications: posts.reduce((sum, p) => sum + p.verificationCount, 0),
      totalUpvotes: posts.reduce((sum, p) => sum + (p.upvotes || 0), 0),
      avgRating: posts.length > 0 ? (posts.reduce((sum, p) => sum + p.rating, 0) / posts.length).toFixed(1) : 0,
    };

    // Calculate Routes metrics
    const routesStats = {
      totalRoutes: routes.length,
      totalDistance: routes.reduce((sum, r) => sum + r.distance, 0),
      totalCompletions: routes.reduce((sum, r) => sum + r.completionCount, 0),
      creditsEarned: routes.reduce((sum, r) => sum + r.creditsEarned, 0),
    };

    // Get recent transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    // Calculate total earnings
    const totalEarnings = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      user: {
        name: user.name,
        email: user.email,
        credits: user.credits,
        trustScore: user.trustScore,
        profileImage: user.profileImage,
      },
      reels: reelsStats,
      livestreams: livestreamStats,
      posts: postsStats,
      routes: routesStats,
      earnings: {
        total: totalEarnings,
        monthly: user.monthlyCreditsEarned || 0,
        recentTransactions: transactions,
      },
    };
  },
});

/**
 * Get creator's top performing content
 */
export const getTopContent = query({
  args: {
    userId: v.id("users"),
    contentType: v.union(v.literal("reels"), v.literal("livestreams"), v.literal("posts")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    if (args.contentType === "reels") {
      const reels = await ctx.db
        .query("reels")
        .withIndex("by_author", (q) => q.eq("authorId", args.userId))
        .collect();

      // Sort by views
      const sorted = reels.sort((a, b) => b.views - a.views).slice(0, limit);

      return sorted.map(r => ({
        id: r._id,
        type: "reel",
        title: r.caption || "Untitled Reel",
        views: r.views,
        likes: r.likes,
        engagement: r.views > 0 ? ((r.likes / r.views) * 100).toFixed(1) : 0,
        createdAt: r._creationTime,
        thumbnailUrl: r.thumbnailUrl,
      }));
    } else if (args.contentType === "livestreams") {
      const livestreams = await ctx.db
        .query("livestreams")
        .withIndex("by_host", (q) => q.eq("hostId", args.userId))
        .collect();

      // Sort by total views
      const sorted = livestreams.sort((a, b) => b.totalViews - a.totalViews).slice(0, limit);

      return sorted.map(l => ({
        id: l._id,
        type: "livestream",
        title: l.title,
        views: l.totalViews,
        likes: l.likes,
        peakViewers: l.peakViewerCount,
        createdAt: l._creationTime,
      }));
    } else {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", args.userId))
        .collect();

      // Sort by upvotes
      const sorted = posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, limit);

      return sorted.map(p => ({
        id: p._id,
        type: "post",
        title: p.title,
        upvotes: p.upvotes || 0,
        verifications: p.verificationCount,
        comments: p.commentCount || 0,
        createdAt: p._creationTime,
      }));
    }
  },
});

/**
 * Get follower growth data (placeholder - requires followers table)
 */
export const getFollowerGrowth = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // TODO: Implement when followers table is added
    // For now, return mock data based on engagement
    
    const reels = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    const totalEngagement = reels.reduce((sum, r) => sum + r.likes + r.views, 0);

    return {
      current: Math.floor(totalEngagement / 100), // Rough estimate
      growth: "+12%", // Mock data
      trend: "up",
    };
  },
});
