import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get user's life canvas data - birth year, life expectancy, and entries
 */
export const getLifeCanvasData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      birthYear: user.birthYear,
      lifeExpectancy: user.lifeExpectancy || 80,
      gender: user.gender,
    };
  },
});

/**
 * Update user's life canvas settings (birth year, life expectancy)
 */
export const updateLifeSettings = mutation({
  args: {
    userId: v.id("users"),
    birthYear: v.optional(v.number()),
    lifeExpectancy: v.optional(v.number()),
    gender: v.optional(v.union(
      v.literal("female"),
      v.literal("non-binary"),
      v.literal("prefer-not-to-say")
    )),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {};
    if (args.birthYear !== undefined) updates.birthYear = args.birthYear;
    if (args.lifeExpectancy !== undefined) updates.lifeExpectancy = args.lifeExpectancy;
    if (args.gender !== undefined) updates.gender = args.gender;

    await ctx.db.patch(args.userId, updates);
    return { success: true };
  },
});

/**
 * Get life entries for a date range (for the canvas visualization)
 */
export const getLifeEntries = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("lifeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by date range
    return entries.filter(
      (e) => e.date >= args.startDate && e.date <= args.endDate
    );
  },
});

/**
 * Get a single life entry for a specific date
 */
export const getLifeEntry = query({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lifeEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
  },
});

/**
 * Create or update a life entry for a specific date
 */
export const upsertLifeEntry = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    journalText: v.optional(v.string()),
    mood: v.optional(v.number()),
    energy: v.optional(v.number()),
    gratitude: v.optional(v.array(v.string())),
    hydrationGlasses: v.optional(v.number()),
    hasPeriod: v.optional(v.boolean()),
    sleepHours: v.optional(v.number()),
    exerciseMinutes: v.optional(v.number()),
    dimensions: v.optional(v.array(v.union(
      v.literal("career"),
      v.literal("health"),
      v.literal("relationships"),
      v.literal("growth"),
      v.literal("creativity"),
      v.literal("adventure"),
      v.literal("rest")
    ))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Calculate intensity score based on entry completeness
    let intensityScore = 0;
    if (args.journalText && args.journalText.length > 0) intensityScore += 1;
    if (args.journalText && args.journalText.length > 100) intensityScore += 1;
    if (args.mood) intensityScore += 0.5;
    if (args.gratitude && args.gratitude.length > 0) intensityScore += 0.5;
    if (args.dimensions && args.dimensions.length > 0) intensityScore += 0.5;
    if (args.hydrationGlasses && args.hydrationGlasses >= 8) intensityScore += 0.5;
    intensityScore = Math.min(4, Math.floor(intensityScore));

    // Check if entry exists
    const existing = await ctx.db
      .query("lifeEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    const entryData = {
      journalText: args.journalText,
      mood: args.mood,
      energy: args.energy,
      gratitude: args.gratitude,
      hydrationGlasses: args.hydrationGlasses,
      hasPeriod: args.hasPeriod,
      sleepHours: args.sleepHours,
      exerciseMinutes: args.exerciseMinutes,
      dimensions: args.dimensions,
      tags: args.tags,
      intensityScore,
      isPrivate: true,
    };

    if (existing) {
      await ctx.db.patch(existing._id, entryData);
      return { success: true, entryId: existing._id, isNew: false };
    } else {
      const entryId = await ctx.db.insert("lifeEntries", {
        userId: args.userId,
        date: args.date,
        ...entryData,
      });

      // Award credits for first entry of the day (5 credits)
      const DAILY_JOURNAL_CREDITS = 5;
      await ctx.db.patch(args.userId, {
        credits: user.credits + DAILY_JOURNAL_CREDITS,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + DAILY_JOURNAL_CREDITS,
      });

      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: DAILY_JOURNAL_CREDITS,
        type: "life_entry",
        relatedId: entryId,
      });

      return { success: true, entryId, isNew: true, creditsEarned: DAILY_JOURNAL_CREDITS };
    }
  },
});

/**
 * Get life statistics for the user
 */
export const getLifeStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const entries = await ctx.db
      .query("lifeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate stats
    const totalEntries = entries.length;
    const entriesWithJournal = entries.filter((e) => e.journalText && e.journalText.length > 0).length;
    const avgMood = entries.filter((e) => e.mood).reduce((sum, e) => sum + (e.mood || 0), 0) / 
      (entries.filter((e) => e.mood).length || 1);

    // Current streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const hasEntry = entries.some((e) => e.date === dateStr);
      if (hasEntry) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Days lived calculation
    let daysLived = 0;
    let daysRemaining = 0;
    if (user.birthYear) {
      const birthDate = new Date(user.birthYear, 0, 1);
      daysLived = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      const lifeExpectancy = user.lifeExpectancy || 80;
      const expectedEndDate = new Date(user.birthYear + lifeExpectancy, 0, 1);
      daysRemaining = Math.max(0, Math.floor((expectedEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      totalEntries,
      entriesWithJournal,
      avgMood: Math.round(avgMood * 10) / 10,
      currentStreak,
      daysLived,
      daysRemaining,
      birthYear: user.birthYear,
      lifeExpectancy: user.lifeExpectancy || 80,
    };
  },
});
