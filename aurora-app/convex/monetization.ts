/**
 * Creator Monetization Backend
 * 
 * Handles subscriptions, tips, premium content, and payouts.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Subscribe to a creator
 */
export const subscribeToCreator = mutation({
  args: {
    subscriberId: v.id("users"),
    creatorId: v.id("users"),
    tier: v.union(v.literal("basic"), v.literal("premium"), v.literal("vip")),
  },
  handler: async (ctx, args) => {
    // Check if already subscribed
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber_creator", (q) => 
        q.eq("subscriberId", args.subscriberId).eq("creatorId", args.creatorId)
      )
      .first();

    if (existing && existing.status === "active") {
      throw new Error("Already subscribed to this creator");
    }

    // Get subscription cost
    const costs = { basic: 50, premium: 100, vip: 200 };
    const cost = costs[args.tier];

    // Check subscriber has enough credits
    const subscriber = await ctx.db.get(args.subscriberId);
    if (!subscriber || subscriber.credits < cost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits from subscriber
    await ctx.db.patch(args.subscriberId, {
      credits: subscriber.credits - cost,
    });

    // Add credits to creator (90% - 10% platform fee)
    const creatorEarnings = Math.floor(cost * 0.9);
    const creator = await ctx.db.get(args.creatorId);
    if (creator) {
      await ctx.db.patch(args.creatorId, {
        credits: creator.credits + creatorEarnings,
      });
    }

    // Create or update subscription
    let subscriptionId: string;
    if (existing) {
      await ctx.db.patch(existing._id, {
        tier: args.tier,
        status: "active",
        renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      subscriptionId = existing._id;
    } else {
      subscriptionId = await ctx.db.insert("subscriptions", {
        subscriberId: args.subscriberId,
        creatorId: args.creatorId,
        tier: args.tier,
        status: "active",
        renewsAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    // Log transactions
    await ctx.db.insert("transactions", {
      userId: args.subscriberId,
      amount: -cost,
      type: "subscription",
      relatedId: subscriptionId,
    });

    await ctx.db.insert("transactions", {
      userId: args.creatorId,
      amount: creatorEarnings,
      type: "subscription_earnings",
      relatedId: subscriptionId,
    });

    return { success: true, subscriptionId };
  },
});

/**
 * Send tip to creator
 */
export const tipCreator = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amount: v.number(),
    contentId: v.optional(v.string()), // Reel, livestream, or post ID
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount < 1 || args.amount > 1000) {
      throw new Error("Tip amount must be between 1 and 1000 credits");
    }

    // Check sender has enough credits
    const sender = await ctx.db.get(args.fromUserId);
    if (!sender || sender.credits < args.amount) {
      throw new Error("Insufficient credits");
    }

    // Deduct from sender
    await ctx.db.patch(args.fromUserId, {
      credits: sender.credits - args.amount,
    });

    // Add to creator (95% - 5% platform fee for tips)
    const creatorEarnings = Math.floor(args.amount * 0.95);
    const creator = await ctx.db.get(args.toUserId);
    if (creator) {
      await ctx.db.patch(args.toUserId, {
        credits: creator.credits + creatorEarnings,
      });
    }

    // Create tip record
    const tipId = await ctx.db.insert("tips", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      amount: args.amount,
      contentId: args.contentId,
      message: args.message,
    });

    // Log transactions
    await ctx.db.insert("transactions", {
      userId: args.fromUserId,
      amount: -args.amount,
      type: "tip_sent",
      relatedId: tipId,
    });

    await ctx.db.insert("transactions", {
      userId: args.toUserId,
      amount: creatorEarnings,
      type: "tip_received",
      relatedId: tipId,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.toUserId,
      type: "tip",
      title: "New tip received!",
      message: `${sender?.name} sent you ${args.amount} credits${args.message ? `: "${args.message}"` : ''}`,
      isRead: false,
      fromUserId: args.fromUserId,
      relatedId: tipId,
    });

    return { success: true, tipId };
  },
});

/**
 * Get creator's subscription tiers and pricing
 */
export const getCreatorTiers = query({
  args: {
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // For now, return standard tiers
    // Later, creators can customize these
    return {
      basic: {
        name: "Basic Supporter",
        price: 50,
        benefits: [
          "Access to subscriber-only posts",
          "Priority in livestream chat",
          "Supporter badge",
        ],
      },
      premium: {
        name: "Premium Supporter",
        price: 100,
        benefits: [
          "All Basic benefits",
          "Early access to new content",
          "Monthly exclusive livestream",
          "Direct messaging with creator",
        ],
      },
      vip: {
        name: "VIP Supporter",
        price: 200,
        benefits: [
          "All Premium benefits",
          "1-on-1 safety consultation",
          "Custom route recommendations",
          "VIP badge and priority support",
        ],
      },
    };
  },
});

/**
 * Get user's subscriptions
 */
export const getUserSubscriptions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscriber", (q) => q.eq("subscriberId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Enrich with creator info
    const enriched = await Promise.all(
      subscriptions.map(async (sub) => {
        const creator = await ctx.db.get(sub.creatorId);
        return {
          ...sub,
          creator: creator ? {
            name: creator.name,
            profileImage: creator.profileImage,
            trustScore: creator.trustScore,
          } : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get creator's subscribers
 */
export const getCreatorSubscribers = query({
  args: {
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Group by tier
    const tierCounts = {
      basic: subscriptions.filter(s => s.tier === "basic").length,
      premium: subscriptions.filter(s => s.tier === "premium").length,
      vip: subscriptions.filter(s => s.tier === "vip").length,
    };

    const totalSubscribers = subscriptions.length;
    const monthlyRevenue = subscriptions.reduce((sum, sub) => {
      const tierPrices = { basic: 50, premium: 100, vip: 200 };
      return sum + (tierPrices[sub.tier] * 0.9); // After platform fee
    }, 0);

    return {
      totalSubscribers,
      tierCounts,
      monthlyRevenue,
      subscriptions: subscriptions.slice(0, 10), // Recent 10
    };
  },
});

/**
 * Get tips received by creator
 */
export const getCreatorTips = query({
  args: {
    creatorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const tips = await ctx.db
      .query("tips")
      .withIndex("by_recipient", (q) => q.eq("toUserId", args.creatorId))
      .order("desc")
      .take(limit);

    // Enrich with sender info
    const enriched = await Promise.all(
      tips.map(async (tip) => {
        const sender = await ctx.db.get(tip.fromUserId);
        return {
          ...tip,
          sender: sender ? {
            name: sender.name,
            profileImage: sender.profileImage,
          } : null,
        };
      })
    );

    const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);
    const totalTipsAfterFee = Math.floor(totalTips * 0.95);

    return {
      tips: enriched,
      totalTips: totalTipsAfterFee,
      count: tips.length,
    };
  },
});

/**
 * Request payout (withdraw credits to real money)
 */
export const requestPayout = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    paymentMethod: v.string(), // "paypal", "bank", etc.
    paymentDetails: v.string(), // Email or account info
  },
  handler: async (ctx, args) => {
    const minPayout = 100; // Minimum 100 credits
    
    if (args.amount < minPayout) {
      throw new Error(`Minimum payout is ${minPayout} credits`);
    }

    const user = await ctx.db.get(args.userId);
    if (!user || user.credits < args.amount) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits (hold them until payout is processed)
    await ctx.db.patch(args.userId, {
      credits: user.credits - args.amount,
    });

    // Create payout request
    const payoutId = await ctx.db.insert("payouts", {
      userId: args.userId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      paymentDetails: args.paymentDetails,
      status: "pending",
      requestedAt: Date.now(),
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: "payout_request",
      relatedId: payoutId,
    });

    return { success: true, payoutId };
  },
});
