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
 * Returns all entries, grouped by date with summed intensity
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
 * Get aggregated intensity per day for the canvas visualization
 * Sums intensity scores from all entries on each day
 */
export const getDailyIntensities = query({
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

    // Filter by date range and aggregate by date
    const dateMap = new Map<string, { totalIntensity: number; entryCount: number }>();
    
    entries
      .filter((e) => e.date >= args.startDate && e.date <= args.endDate)
      .forEach((entry) => {
        const existing = dateMap.get(entry.date) || { totalIntensity: 0, entryCount: 0 };
        dateMap.set(entry.date, {
          totalIntensity: existing.totalIntensity + (entry.intensityScore || 0),
          entryCount: existing.entryCount + 1,
        });
      });

    // Convert to array and cap intensity at 4
    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      intensity: Math.min(4, data.totalIntensity), // Cap at 4 for display
      entryCount: data.entryCount,
    }));
  },
});

/**
 * Get all life entries for a specific date (supports multiple entries per day)
 */
export const getLifeEntriesForDate = query({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("lifeEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
    
    // Sort by createdAt descending (newest first)
    return entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
});

/**
 * Get a single life entry by ID (for editing)
 */
export const getLifeEntryById = query({
  args: {
    entryId: v.id("lifeEntries"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.entryId);
  },
});

/**
 * Create a new life entry (supports multiple entries per day)
 * Each entry awards 5 credits
 */
export const createLifeEntry = mutation({
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

    // Always create a new entry (multiple entries per day supported)
    const entryId = await ctx.db.insert("lifeEntries", {
      userId: args.userId,
      date: args.date,
      createdAt: Date.now(),
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
    });

    // Award credits for each entry (5 credits)
    const JOURNAL_ENTRY_CREDITS = 5;
    await ctx.db.patch(args.userId, {
      credits: user.credits + JOURNAL_ENTRY_CREDITS,
      monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + JOURNAL_ENTRY_CREDITS,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: JOURNAL_ENTRY_CREDITS,
      type: "life_entry",
      relatedId: entryId,
    });

    return { success: true, entryId, creditsEarned: JOURNAL_ENTRY_CREDITS };
  },
});

/**
 * Update an existing life entry
 */
export const updateLifeEntry = mutation({
  args: {
    entryId: v.id("lifeEntries"),
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
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new Error("Entry not found");

    // Recalculate intensity score
    let intensityScore = 0;
    const journalText = args.journalText ?? entry.journalText;
    const mood = args.mood ?? entry.mood;
    const gratitude = args.gratitude ?? entry.gratitude;
    const dimensions = args.dimensions ?? entry.dimensions;
    const hydrationGlasses = args.hydrationGlasses ?? entry.hydrationGlasses;

    if (journalText && journalText.length > 0) intensityScore += 1;
    if (journalText && journalText.length > 100) intensityScore += 1;
    if (mood) intensityScore += 0.5;
    if (gratitude && gratitude.length > 0) intensityScore += 0.5;
    if (dimensions && dimensions.length > 0) intensityScore += 0.5;
    if (hydrationGlasses && hydrationGlasses >= 8) intensityScore += 0.5;
    intensityScore = Math.min(4, Math.floor(intensityScore));

    await ctx.db.patch(args.entryId, {
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
    });

    return { success: true };
  },
});

/**
 * Delete a life entry
 */
export const deleteLifeEntry = mutation({
  args: {
    entryId: v.id("lifeEntries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new Error("Entry not found");
    
    await ctx.db.delete(args.entryId);
    return { success: true };
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

    // Get unique days with entries
    const uniqueDays = new Set(entries.map((e) => e.date));
    const totalDaysLogged = uniqueDays.size;

    // Current streak (based on unique days, not individual entries)
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      const hasEntry = uniqueDays.has(dateStr);
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
      totalDaysLogged,
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
