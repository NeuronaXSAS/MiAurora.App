import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Admin email whitelist - CEO/CTO access only
const ADMIN_EMAILS: string[] = [
  "neuronax.sas@gmail.com",      // CEO - Primary admin
  "auroraapp.info@gmail.com",    // Secondary admin
];

// Check if user is admin
export const isAdmin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  },
});

// Get admin dashboard stats
export const getDashboardStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get all users
    const users = await ctx.db.query("users").collect();
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const activeToday = users.filter(u => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return u._creationTime > dayAgo;
    }).length;

    // Get posts stats
    const posts = await ctx.db.query("posts").collect();
    const totalPosts = posts.length;
    const postsToday = posts.filter(p => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return p._creationTime > dayAgo;
    }).length;

    // Get routes stats
    const routes = await ctx.db.query("routes").collect();
    const totalRoutes = routes.length;
    const publicRoutes = routes.filter(r => r.sharingLevel === "public").length;

    // Get reels stats
    const reels = await ctx.db.query("reels").collect();
    const totalReels = reels.length;
    const totalReelViews = reels.reduce((sum, r) => sum + (r.views || 0), 0);

    // Get livestreams stats
    const livestreams = await ctx.db.query("livestreams").collect();
    const activeLivestreams = livestreams.filter(l => l.status === "live").length;
    const totalLivestreams = livestreams.length;

    // Get emergency alerts
    const emergencyAlerts = await ctx.db.query("emergencyAlerts").collect();
    const activeEmergencies = emergencyAlerts.filter(e => e.status === "active").length;
    const totalEmergencies = emergencyAlerts.length;

    // Get opportunities
    const opportunities = await ctx.db.query("opportunities").collect();
    const activeOpportunities = opportunities.filter(o => o.isActive).length;

    // Get circles
    const circles = await ctx.db.query("circles").collect();
    const totalCircles = circles.length;

    // Get messages (DMs)
    const messages = await ctx.db.query("directMessages").collect();
    const messagesToday = messages.filter(m => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return m._creationTime > dayAgo;
    }).length;

    // Calculate engagement metrics
    const totalCreditsInCirculation = users.reduce((sum, u) => sum + (u.credits || 0), 0);
    const avgTrustScore = users.length > 0 
      ? users.reduce((sum, u) => sum + (u.trustScore || 0), 0) / users.length 
      : 0;

    return {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        newToday: activeToday,
        premiumRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : "0",
      },
      content: {
        posts: totalPosts,
        postsToday,
        routes: totalRoutes,
        publicRoutes,
        reels: totalReels,
        reelViews: totalReelViews,
      },
      live: {
        activeLivestreams,
        totalLivestreams,
      },
      safety: {
        activeEmergencies,
        totalEmergencies,
        emergencyResponseRate: totalEmergencies > 0 
          ? (((totalEmergencies - activeEmergencies) / totalEmergencies) * 100).toFixed(1) 
          : "100",
      },
      community: {
        circles: totalCircles,
        opportunities: activeOpportunities,
        messagesToday,
      },
      economy: {
        totalCredits: totalCreditsInCirculation,
        avgTrustScore: avgTrustScore.toFixed(1),
      },
    };
  },
});

// Get recent activity feed for admin
export const getRecentActivity = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const limit = args.limit || 20;
    const activities: any[] = [];

    // Get recent users
    const recentUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(5);
    
    for (const u of recentUsers) {
      activities.push({
        type: "user_joined",
        timestamp: u._creationTime,
        data: { name: u.name, email: u.email, isPremium: u.isPremium },
      });
    }

    // Get recent posts
    const recentPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(5);
    
    for (const p of recentPosts) {
      const author = await ctx.db.get(p.authorId);
      activities.push({
        type: "post_created",
        timestamp: p._creationTime,
        data: { title: p.title, author: author?.name || "Anonymous", dimension: p.lifeDimension },
      });
    }

    // Get recent emergency alerts
    const recentEmergencies = await ctx.db
      .query("emergencyAlerts")
      .order("desc")
      .take(3);
    
    for (const e of recentEmergencies) {
      const alertUser = await ctx.db.get(e.userId);
      activities.push({
        type: "emergency_alert",
        timestamp: e._creationTime,
        data: { 
          user: alertUser?.name || "Unknown", 
          status: e.status, 
          type: e.alertType,
          location: e.location?.address || "Unknown location",
        },
      });
    }

    // Get recent livestreams
    const recentLivestreams = await ctx.db
      .query("livestreams")
      .order("desc")
      .take(3);
    
    for (const l of recentLivestreams) {
      const host = await ctx.db.get(l.hostId);
      activities.push({
        type: "livestream",
        timestamp: l._creationTime,
        data: { 
          title: l.title, 
          host: host?.name || "Unknown", 
          status: l.status,
          viewers: l.viewerCount,
        },
      });
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

// Get user growth data for charts
export const getUserGrowthData = query({
  args: { userId: v.id("users"), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    const days = args.days || 30;
    const users = await ctx.db.query("users").collect();
    
    // Group users by day
    const dailyData: Record<string, number> = {};
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = 0;
    }

    for (const u of users) {
      const date = new Date(u._creationTime).toISOString().split("T")[0];
      if (dailyData[date] !== undefined) {
        dailyData[date]++;
      }
    }

    return Object.entries(dailyData).map(([date, count]) => ({
      date,
      users: count,
    }));
  },
});

// Add admin email (only existing admins can add)
export const addAdminEmail = mutation({
  args: { 
    userId: v.id("users"), 
    newAdminEmail: v.string() 
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Note: In production, you'd want to store admin emails in the database
    // For now, this is a placeholder that logs the request
    console.log(`Admin ${user.email} requested to add ${args.newAdminEmail} as admin`);
    
    return { success: true, message: "Admin email addition logged. Update ADMIN_EMAILS array in code." };
  },
});
