import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Hydration Tracking

export const logWater = mutation({
  args: {
    userId: v.id("users"),
    glasses: v.number(),
    clientDate: v.optional(v.string()), // Client's local date YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Use client date if provided, otherwise fallback to server UTC
    const today = args.clientDate || new Date().toISOString().split('T')[0];
    
    // Check if log exists for today
    const existing = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    const goal = 8; // Default goal: 8 glasses
    const completed = args.glasses >= goal;

    if (existing) {
      // Update existing log
      await ctx.db.patch(existing._id, {
        glasses: args.glasses,
        completed,
      });
      return existing._id;
    } else {
      // Create new log
      return await ctx.db.insert("hydrationLogs", {
        userId: args.userId,
        date: today,
        glasses: args.glasses,
        goal,
        completed,
      });
    }
  },
});

export const getTodayHydration = query({
  args: { 
    userId: v.id("users"),
    clientDate: v.optional(v.string()), // Client's local date YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Use client date if provided, otherwise fallback to server UTC
    const today = args.clientDate || new Date().toISOString().split('T')[0];
    
    // Verify user exists first
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { glasses: 0, goal: 8, completed: false, date: today };
    }
    
    const log = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    return log || { glasses: 0, goal: 8, completed: false, date: today };
  },
});

export const getHydrationHistory = query({
  args: { 
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const days = args.days || 7;
    const logs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(days);

    return logs;
  },
});

// Emotional Check-ins

export const logMood = mutation({
  args: {
    userId: v.id("users"),
    mood: v.number(), // 1-5
    journal: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    clientDate: v.optional(v.string()), // Client's local date YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Use client date if provided, otherwise fallback to server UTC
    const today = args.clientDate || new Date().toISOString().split('T')[0];
    
    // Check if check-in exists for today
    const existing = await ctx.db
      .query("emotionalCheckins")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (existing) {
      // Update existing check-in
      await ctx.db.patch(existing._id, {
        mood: args.mood,
        journal: args.journal,
        tags: args.tags,
      });
      return existing._id;
    } else {
      // Create new check-in
      return await ctx.db.insert("emotionalCheckins", {
        userId: args.userId,
        date: today,
        mood: args.mood,
        journal: args.journal,
        tags: args.tags,
      });
    }
  },
});

export const getTodayMood = query({
  args: { 
    userId: v.id("users"),
    clientDate: v.optional(v.string()), // Client's local date YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Use client date if provided, otherwise fallback to server UTC
    const today = args.clientDate || new Date().toISOString().split('T')[0];
    
    return await ctx.db
      .query("emotionalCheckins")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();
  },
});

export const getMoodHistory = query({
  args: { 
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const days = args.days || 7;
    const logs = await ctx.db
      .query("emotionalCheckins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(days);

    return logs;
  },
});

// Meditation Sessions

export const logMeditation = mutation({
  args: {
    userId: v.id("users"),
    duration: v.number(),
    type: v.union(
      v.literal("breathing"),
      v.literal("guided"),
      v.literal("mindfulness")
    ),
  },
  handler: async (ctx, args) => {
    // Award 5 credits for completing meditation
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 5,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 5,
      });
    }

    // Log meditation session
    return await ctx.db.insert("meditationSessions", {
      userId: args.userId,
      duration: args.duration,
      type: args.type,
      completed: true,
      creditsEarned: 5,
    });
  },
});

export const getMeditationStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        totalCredits: 0,
        sessions: [],
      };
    }
    
    const sessions = await ctx.db
      .query("meditationSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalCredits = sessions.reduce((sum, s) => sum + s.creditsEarned, 0);

    return {
      totalSessions,
      totalMinutes,
      totalCredits,
      sessions: sessions.slice(0, 10), // Last 10 sessions
    };
  },
});
