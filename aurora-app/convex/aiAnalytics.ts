import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * AI Analytics - Track user interactions with Aurora Companion
 */

/**
 * Log an AI interaction
 */
export const logInteraction = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("text_chat"),
      v.literal("voice_chat"),
      v.literal("shared_chat")
    ),
    messageCount: v.optional(v.number()),
    duration: v.optional(v.number()),
    sentiment: v.optional(v.string()),
    topics: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiInteractions", {
      userId: args.userId,
      type: args.type,
      messageCount: args.messageCount,
      duration: args.duration,
      sentiment: args.sentiment,
      topics: args.topics,
    });

    return { success: true };
  },
});

/**
 * Get AI interaction statistics for a user
 */
export const getInteractionStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const interactions = await ctx.db
      .query("aiInteractions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const textChats = interactions.filter((i) => i.type === "text_chat").length;
    const voiceSessions = interactions.filter((i) => i.type === "voice_chat").length;
    const sharedChats = interactions.filter((i) => i.type === "shared_chat").length;

    const totalDuration = interactions
      .filter((i) => i.duration)
      .reduce((sum, i) => sum + (i.duration || 0), 0);

    const totalMessages = interactions
      .filter((i) => i.messageCount)
      .reduce((sum, i) => sum + (i.messageCount || 0), 0);

    // Collect all topics
    const allTopics: string[] = [];
    interactions.forEach((i) => {
      if (i.topics) {
        allTopics.push(...i.topics);
      }
    });

    // Count topic frequency
    const topicCounts: Record<string, number> = {};
    allTopics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    // Sentiment analysis
    const sentiments = interactions
      .filter((i) => i.sentiment)
      .map((i) => i.sentiment);
    
    const positiveCount = sentiments.filter((s) => s === "positive").length;
    const overallSentiment = sentiments.length > 0 
      ? positiveCount / sentiments.length 
      : 0.5;

    return {
      totalInteractions: interactions.length,
      textChats,
      voiceSessions,
      sharedChats,
      totalDuration,
      totalMessages,
      topTopics,
      overallSentiment,
    };
  },
});

/**
 * Get weekly interaction summary
 */
export const getWeeklySummary = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const interactions = await ctx.db
      .query("aiInteractions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentInteractions = interactions.filter(
      (i) => i._creationTime > weekAgo
    );

    // Group by day
    const dailyCounts: Record<string, number> = {};
    recentInteractions.forEach((i) => {
      const date = new Date(i._creationTime).toISOString().split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      totalThisWeek: recentInteractions.length,
      dailyCounts,
      averagePerDay: recentInteractions.length / 7,
    };
  },
});
