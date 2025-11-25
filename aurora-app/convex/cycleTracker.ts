import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log a period day
export const logPeriod = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    flow: v.union(v.literal("light"), v.literal("medium"), v.literal("heavy"), v.literal("spotting")),
    symptoms: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if entry exists for this date
    const existing = await ctx.db
      .query("cycleLogs")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        flow: args.flow,
        symptoms: args.symptoms,
        notes: args.notes,
      });
      return existing._id;
    }

    return await ctx.db.insert("cycleLogs", {
      userId: args.userId,
      date: args.date,
      type: "period",
      flow: args.flow,
      symptoms: args.symptoms,
      notes: args.notes,
    });
  },
});

// Log symptoms (non-period day)
export const logSymptoms = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    symptoms: v.array(v.string()),
    mood: v.optional(v.number()), // 1-5
    energy: v.optional(v.number()), // 1-5
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cycleLogs")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        symptoms: args.symptoms,
        mood: args.mood,
        energy: args.energy,
        notes: args.notes,
      });
      return existing._id;
    }

    return await ctx.db.insert("cycleLogs", {
      userId: args.userId,
      date: args.date,
      type: "symptom",
      symptoms: args.symptoms,
      mood: args.mood,
      energy: args.energy,
      notes: args.notes,
    });
  },
});

// Get cycle history
export const getCycleHistory = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db
      .query("cycleLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(90); // Last 90 days

    if (args.startDate) {
      logs = logs.filter(log => log.date >= args.startDate!);
    }
    if (args.endDate) {
      logs = logs.filter(log => log.date <= args.endDate!);
    }

    return logs;
  },
});

// Get cycle predictions
export const getCyclePredictions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get period logs from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = sixMonthsAgo.toISOString().split('T')[0];

    const periodLogs = await ctx.db
      .query("cycleLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "period"))
      .order("asc")
      .collect();

    const filteredLogs = periodLogs.filter(log => log.date >= startDate);

    if (filteredLogs.length < 2) {
      return {
        hasEnoughData: false,
        averageCycleLength: 28,
        nextPeriodDate: null,
        fertileWindowStart: null,
        fertileWindowEnd: null,
        ovulationDate: null,
      };
    }

    // Find cycle start dates (first day of each period)
    const cycleStarts: string[] = [];
    let lastPeriodDate: string | null = null;

    for (const log of filteredLogs) {
      if (!lastPeriodDate || daysBetween(lastPeriodDate, log.date) > 3) {
        cycleStarts.push(log.date);
      }
      lastPeriodDate = log.date;
    }

    // Calculate average cycle length
    const cycleLengths: number[] = [];
    for (let i = 1; i < cycleStarts.length; i++) {
      cycleLengths.push(daysBetween(cycleStarts[i - 1], cycleStarts[i]));
    }

    const averageCycleLength = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28;

    // Predict next period
    const lastCycleStart = cycleStarts[cycleStarts.length - 1];
    const nextPeriodDate = addDays(lastCycleStart, averageCycleLength);

    // Predict fertile window (typically days 10-16 of cycle, ovulation around day 14)
    const ovulationDay = Math.round(averageCycleLength - 14);
    const ovulationDate = addDays(lastCycleStart, ovulationDay);
    const fertileWindowStart = addDays(lastCycleStart, ovulationDay - 5);
    const fertileWindowEnd = addDays(lastCycleStart, ovulationDay + 1);

    return {
      hasEnoughData: true,
      averageCycleLength,
      nextPeriodDate,
      fertileWindowStart,
      fertileWindowEnd,
      ovulationDate,
      cycleDay: daysBetween(lastCycleStart, new Date().toISOString().split('T')[0]) + 1,
    };
  },
});

// Delete a log entry
export const deleteLog = mutation({
  args: {
    logId: v.id("cycleLogs"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);
    if (!log || log.userId !== args.userId) {
      throw new Error("Log not found or unauthorized");
    }
    await ctx.db.delete(args.logId);
  },
});

// Helper functions
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
