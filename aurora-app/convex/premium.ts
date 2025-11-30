/**
 * Aurora Premium - Subscription Management
 * 
 * Handles premium subscription status and benefits.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Activate premium for a user (called by Stripe webhook)
 */
export const activatePremium = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user to premium
    await ctx.db.patch(args.userId, {
      isPremium: true,
    });

    // Log the subscription
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: 0, // Subscription, not credits
      type: "premium_activated",
      relatedId: args.stripeSubscriptionId,
    });

    // Award bonus credits for subscribing
    await ctx.db.patch(args.userId, {
      credits: user.credits + 100, // 100 bonus credits
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: 100,
      type: "premium_bonus",
      relatedId: args.stripeSubscriptionId,
    });

    return { success: true };
  },
});

/**
 * Deactivate premium for a user (called by Stripe webhook)
 */
export const deactivatePremium = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      isPremium: false,
    });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: 0,
      type: "premium_cancelled",
    });

    return { success: true };
  },
});

/**
 * Check if user is premium
 */
export const isPremium = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.isPremium || false;
  },
});

/**
 * Get premium benefits for display
 */
export const getPremiumBenefits = query({
  args: {},
  handler: async () => {
    return {
      price: 5, // USD per month
      benefits: [
        {
          id: "ad_free",
          title: "Ad-Free Experience",
          description: "No advertisements or sponsored content",
          freeLimit: "With ads",
          premiumLimit: "No ads",
        },
        {
          id: "ai_chat",
          title: "AI Companion Messages",
          description: "Daily conversations with Aurora AI",
          freeLimit: "10/day",
          premiumLimit: "1000/day",
        },
        {
          id: "posts",
          title: "Post Creation",
          description: "Share your experiences",
          freeLimit: "5/hour",
          premiumLimit: "50/hour",
        },
        {
          id: "reels",
          title: "Reel Uploads",
          description: "Share video content",
          freeLimit: "3/day",
          premiumLimit: "20/day",
        },
        {
          id: "livestreams",
          title: "Livestreams",
          description: "Go live with your community",
          freeLimit: "2/day",
          premiumLimit: "10/day",
        },
        {
          id: "badge",
          title: "Premium Badge",
          description: "Show your support",
          freeLimit: "No",
          premiumLimit: "Yes ✨",
        },
      ],
    };
  },
});

/**
 * Get user's rate limit status
 */
export const getRateLimitStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const isPremium = user?.isPremium || false;

    // Return limits based on premium status
    return {
      isPremium,
      limits: {
        aiChat: isPremium ? 1000 : 10,
        posts: isPremium ? 50 : 5,
        reels: isPremium ? 20 : 3,
        livestreams: isPremium ? 10 : 2,
        comments: isPremium ? 200 : 20,
      },
    };
  },
});
