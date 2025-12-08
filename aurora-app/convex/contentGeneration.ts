/**
 * Aurora App - AI Content Generation System
 * 
 * Manages AI-generated content for bootstrapping the ecosystem.
 * Designed to be temporary - users take over content creation.
 * 
 * Philosophy: Seed, don't sustain. Generate once, use forever.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// Supported languages for content generation
export const SUPPORTED_LANGUAGES = ["en", "es", "pt", "fr", "ar", "hi"] as const;
type Language = typeof SUPPORTED_LANGUAGES[number];

// ============================================
// CONTENT QUERIES
// ============================================

/**
 * Get today's debate for a specific language
 */
export const getTodayDebate = query({
  args: { 
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lang = (args.language || "en") as Language;
    const today = new Date().toISOString().split("T")[0];
    
    // Get debate scheduled for today
    const debate = await ctx.db
      .query("generatedDebates")
      .withIndex("by_scheduled_date", (q) => q.eq("scheduledDate", today))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (!debate) {
      // Fallback to most recent active debate
      const fallback = await ctx.db
        .query("generatedDebates")
        .filter((q) => q.eq(q.field("status"), "active"))
        .order("desc")
        .first();
      
      if (!fallback) return null;
      
      return {
        ...fallback,
        topic: fallback.translations[lang] || fallback.translations.en,
        options: fallback.optionTranslations?.[lang] || fallback.optionTranslations?.en || fallback.options,
      };
    }
    
    return {
      ...debate,
      topic: debate.translations[lang] || debate.translations.en,
      options: debate.optionTranslations?.[lang] || debate.optionTranslations?.en || debate.options,
    };
  },
});

/**
 * Get safety tips for a category and language
 */
export const getSafetyTips = query({
  args: {
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lang = (args.language || "en") as Language;
    const limit = args.limit || 10;
    
    let tipsQuery = ctx.db
      .query("generatedTips")
      .filter((q) => q.eq(q.field("status"), "active"));
    
    const tips = await tipsQuery.take(limit * 2); // Get more to filter
    
    // Filter by category if specified
    let filtered = tips;
    if (args.category) {
      filtered = tips.filter(t => t.category === args.category);
    }
    
    // Return with correct language
    return filtered.slice(0, limit).map(tip => ({
      ...tip,
      content: tip.translations[lang] || tip.translations.en,
    }));
  },
});

/**
 * Get discussion prompts
 */
export const getDiscussionPrompts = query({
  args: {
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lang = (args.language || "en") as Language;
    const limit = args.limit || 5;
    
    const prompts = await ctx.db
      .query("generatedPrompts")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(limit);
    
    return prompts.map(prompt => ({
      ...prompt,
      content: prompt.translations[lang] || prompt.translations.en,
    }));
  },
});

/**
 * Get weekly challenge
 */
export const getWeeklyChallenge = query({
  args: { language: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const lang = (args.language || "en") as Language;
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split("T")[0];
    
    const challenge = await ctx.db
      .query("generatedChallenges")
      .withIndex("by_week", (q) => q.eq("weekStart", weekStart))
      .first();
    
    if (!challenge) return null;
    
    return {
      ...challenge,
      title: challenge.translations[lang]?.title || challenge.translations.en.title,
      description: challenge.translations[lang]?.description || challenge.translations.en.description,
    };
  },
});

// ============================================
// CONTENT MUTATIONS
// ============================================

/**
 * Store generated debate (called from API route after AI generation)
 */
export const storeGeneratedDebate = mutation({
  args: {
    topic: v.string(),
    category: v.string(),
    options: v.array(v.string()),
    translations: v.object({
      en: v.string(),
      es: v.optional(v.string()),
      pt: v.optional(v.string()),
      fr: v.optional(v.string()),
      ar: v.optional(v.string()),
      hi: v.optional(v.string()),
    }),
    optionTranslations: v.optional(v.object({
      en: v.array(v.string()),
      es: v.optional(v.array(v.string())),
      pt: v.optional(v.array(v.string())),
      fr: v.optional(v.array(v.string())),
      ar: v.optional(v.array(v.string())),
      hi: v.optional(v.array(v.string())),
    })),
    scheduledDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedDebates", {
      ...args,
      status: "active",
      votes: {},
      totalVotes: 0,
      commentCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Store generated safety tip
 */
export const storeGeneratedTip = mutation({
  args: {
    category: v.string(),
    translations: v.object({
      en: v.string(),
      es: v.optional(v.string()),
      pt: v.optional(v.string()),
      fr: v.optional(v.string()),
      ar: v.optional(v.string()),
      hi: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedTips", {
      ...args,
      status: "active",
      verificationCount: 0,
      isVerified: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Store generated discussion prompt
 */
export const storeGeneratedPrompt = mutation({
  args: {
    category: v.string(),
    translations: v.object({
      en: v.string(),
      es: v.optional(v.string()),
      pt: v.optional(v.string()),
      fr: v.optional(v.string()),
      ar: v.optional(v.string()),
      hi: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generatedPrompts", {
      ...args,
      status: "active",
      responseCount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Vote on a debate
 */
export const voteOnDebate = mutation({
  args: {
    debateId: v.id("generatedDebates"),
    optionIndex: v.number(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate) throw new Error("Debate not found");
    
    // Check if user already voted
    const existingVote = await ctx.db
      .query("debateVotes")
      .withIndex("by_debate_user", (q) => 
        q.eq("debateId", args.debateId).eq("userId", args.userId)
      )
      .first();
    
    if (existingVote) {
      return { success: false, reason: "Already voted" };
    }
    
    // Record vote
    await ctx.db.insert("debateVotes", {
      debateId: args.debateId,
      userId: args.userId,
      optionIndex: args.optionIndex,
      votedAt: Date.now(),
    });
    
    // Update debate vote counts
    const votes = debate.votes || {};
    votes[args.optionIndex] = (votes[args.optionIndex] || 0) + 1;
    
    await ctx.db.patch(args.debateId, {
      votes,
      totalVotes: debate.totalVotes + 1,
    });
    
    // Award credits for voting
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 2,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 2,
      });
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 2,
        type: "debate_vote",
        relatedId: args.debateId,
      });
    }
    
    return { success: true, creditsEarned: 2 };
  },
});

/**
 * Verify a safety tip
 */
export const verifyTip = mutation({
  args: {
    tipId: v.id("generatedTips"),
    userId: v.id("users"),
    isAccurate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const tip = await ctx.db.get(args.tipId);
    if (!tip) throw new Error("Tip not found");
    
    // Check if user already verified
    const existing = await ctx.db
      .query("tipVerifications")
      .withIndex("by_tip_user", (q) => 
        q.eq("tipId", args.tipId).eq("userId", args.userId)
      )
      .first();
    
    if (existing) {
      return { success: false, reason: "Already verified" };
    }
    
    // Record verification
    await ctx.db.insert("tipVerifications", {
      tipId: args.tipId,
      userId: args.userId,
      isAccurate: args.isAccurate,
      verifiedAt: Date.now(),
    });
    
    // Update tip verification count
    const newCount = tip.verificationCount + (args.isAccurate ? 1 : 0);
    await ctx.db.patch(args.tipId, {
      verificationCount: newCount,
      isVerified: newCount >= 5,
    });
    
    // Award credits
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 3,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 3,
      });
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 3,
        type: "tip_verification",
        relatedId: args.tipId,
      });
    }
    
    return { success: true, creditsEarned: 3 };
  },
});

/**
 * Submit community translation
 */
export const submitTranslation = mutation({
  args: {
    contentType: v.union(v.literal("debate"), v.literal("tip"), v.literal("prompt")),
    contentId: v.string(),
    language: v.string(),
    translation: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Store translation for review
    await ctx.db.insert("communityTranslations", {
      contentType: args.contentType,
      contentId: args.contentId,
      language: args.language,
      translation: args.translation,
      submittedBy: args.userId,
      status: "pending",
      votes: 0,
      submittedAt: Date.now(),
    });
    
    // Award credits for translation
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 20,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 20,
      });
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 20,
        type: "translation_submitted",
        relatedId: args.contentId,
      });
    }
    
    return { success: true, creditsEarned: 20 };
  },
});

/**
 * User suggests a debate topic
 */
export const suggestDebate = mutation({
  args: {
    topic: v.string(),
    category: v.string(),
    options: v.array(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("debateSuggestions", {
      topic: args.topic,
      category: args.category,
      options: args.options,
      suggestedBy: args.userId,
      status: "pending",
      votes: 0,
      submittedAt: Date.now(),
    });
    
    // Award credits for suggestion
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 10,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 10,
      });
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 10,
        type: "debate_suggestion",
      });
    }
    
    return { success: true, creditsEarned: 10 };
  },
});

// ============================================
// ANALYTICS QUERIES
// ============================================

/**
 * Get content generation stats (for monitoring AWS usage)
 */
export const getContentStats = query({
  args: {},
  handler: async (ctx) => {
    const debates = await ctx.db.query("generatedDebates").collect();
    const tips = await ctx.db.query("generatedTips").collect();
    const prompts = await ctx.db.query("generatedPrompts").collect();
    const suggestions = await ctx.db.query("debateSuggestions").collect();
    const translations = await ctx.db.query("communityTranslations").collect();
    
    return {
      aiGenerated: {
        debates: debates.length,
        tips: tips.length,
        prompts: prompts.length,
      },
      userGenerated: {
        debateSuggestions: suggestions.length,
        translations: translations.length,
      },
      engagement: {
        totalDebateVotes: debates.reduce((sum, d) => sum + d.totalVotes, 0),
        verifiedTips: tips.filter(t => t.isVerified).length,
      },
      selfSufficiencyRatio: suggestions.length / Math.max(debates.length, 1),
    };
  },
});
