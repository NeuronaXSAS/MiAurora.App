/**
 * Aurora Premium - Subscription Service
 * 
 * Handles user subscriptions, tier management, and access control.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { SUBSCRIPTION_TIERS, REVENUE_SHARES, SAFETY_FEATURES } from "./premiumConfig";

// ============================================
// SUBSCRIPTION QUERIES
// ============================================

/**
 * Get user's current subscription
 */
export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!subscription) {
      // Return free tier info
      return {
        tier: "free",
        billingCycle: "monthly" as const,
        status: "active" as const,
        benefits: SUBSCRIPTION_TIERS[0].benefits,
      };
    }
    
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === subscription.tier);
    return {
      ...subscription,
      benefits: tierConfig?.benefits || SUBSCRIPTION_TIERS[0].benefits,
    };
  },
});

/**
 * Get user's rate limits based on subscription tier
 */
export const getUserLimits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    const tier = subscription?.status === "active" ? subscription.tier : "free";
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === tier) || SUBSCRIPTION_TIERS[0];
    
    return {
      tier,
      isPremium: tier !== "free",
      limits: {
        aiMessagesPerDay: tierConfig.benefits.aiMessagesPerDay,
        postsPerHour: tierConfig.benefits.postsPerHour,
        reelsPerDay: tierConfig.benefits.reelsPerDay,
        livestreamsPerDay: tierConfig.benefits.livestreamsPerDay,
        monthlyCredits: tierConfig.benefits.monthlyCredits,
      },
      features: {
        adFree: tierConfig.benefits.adFree,
        prioritySupport: tierConfig.benefits.prioritySupport,
        advancedAnalytics: tierConfig.benefits.advancedAnalytics,
        exclusiveEvents: tierConfig.benefits.exclusiveEvents,
        safetyConsultations: tierConfig.benefits.safetyConsultations,
      },
      badge: tierConfig.benefits.badge,
    };
  },
});

/**
 * Check if user can access a premium feature
 */
export const checkAccess = query({
  args: {
    userId: v.id("users"),
    feature: v.string(),
    requiredTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Safety features are ALWAYS accessible
    if (SAFETY_FEATURES.includes(args.feature)) {
      return { allowed: true, reason: "Safety feature - always free" };
    }
    
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    const userTier = subscription?.status === "active" ? subscription.tier : "free";
    
    // If no specific tier required, allow access
    if (!args.requiredTier) {
      return { allowed: true };
    }
    
    // Check tier hierarchy: free < plus < pro < elite
    const tierOrder = ["free", "plus", "pro", "elite"];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(args.requiredTier);
    
    if (userTierIndex >= requiredTierIndex) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: `Requires ${args.requiredTier} tier or higher`,
      requiredTier: args.requiredTier,
      currentTier: userTier,
      upgradeUrl: "/premium",
    };
  },
});

// ============================================
// SUBSCRIPTION MUTATIONS
// ============================================

/**
 * Create or update a subscription (called by Stripe webhook)
 */
export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    tier: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check for existing subscription
    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === args.tier);
    if (!tierConfig) {
      throw new Error("Invalid tier");
    }
    
    const now = Date.now();
    const periodDays = args.billingCycle === "annual" ? 365 : 30;
    const periodEnd = now + (periodDays * 24 * 60 * 60 * 1000);
    
    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        tier: args.tier,
        billingCycle: args.billingCycle,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: "active",
      });
    } else {
      // Create new subscription
      await ctx.db.insert("userSubscriptions", {
        userId: args.userId,
        tier: args.tier,
        billingCycle: args.billingCycle,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: "active",
      });
    }
    
    // Update user's isPremium flag
    await ctx.db.patch(args.userId, {
      isPremium: args.tier !== "free",
    });
    
    // Award monthly credits
    if (tierConfig.benefits.monthlyCredits > 0) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + tierConfig.benefits.monthlyCredits,
      });
      
      // Log transaction
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: tierConfig.benefits.monthlyCredits,
        type: "subscription_credits",
        relatedId: args.stripeSubscriptionId,
      });
    }
    
    // Log subscription creation
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: 0,
      type: "subscription_created",
      relatedId: args.tier,
    });
    
    return { success: true, tier: args.tier };
  },
});

/**
 * Update subscription tier (upgrade/downgrade)
 */
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    newTier: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!subscription) {
      throw new Error("No active subscription found");
    }
    
    const oldTierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === subscription.tier);
    const newTierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === args.newTier);
    
    if (!newTierConfig) {
      throw new Error("Invalid tier");
    }
    
    // Calculate proration
    const now = Date.now();
    const totalPeriod = subscription.currentPeriodEnd - subscription.currentPeriodStart;
    const remainingPeriod = subscription.currentPeriodEnd - now;
    const remainingRatio = remainingPeriod / totalPeriod;
    
    const oldPrice = subscription.billingCycle === "annual" 
      ? (oldTierConfig?.annualPrice || 0) 
      : (oldTierConfig?.monthlyPrice || 0);
    const newPrice = subscription.billingCycle === "annual"
      ? newTierConfig.annualPrice
      : newTierConfig.monthlyPrice;
    
    const proratedCredit = oldPrice * remainingRatio;
    const proratedCharge = newPrice * remainingRatio;
    const proratedDifference = proratedCharge - proratedCredit;
    
    // Update subscription
    await ctx.db.patch(subscription._id, {
      tier: args.newTier,
    });
    
    // Update user's isPremium flag
    await ctx.db.patch(args.userId, {
      isPremium: args.newTier !== "free",
    });
    
    // Log tier change
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: 0,
      type: "subscription_tier_change",
      relatedId: `${subscription.tier}_to_${args.newTier}`,
    });
    
    return {
      success: true,
      oldTier: subscription.tier,
      newTier: args.newTier,
      proratedDifference: Math.round(proratedDifference * 100) / 100,
    };
  },
});

/**
 * Cancel subscription
 */
export const cancelSubscription = mutation({
  args: {
    userId: v.id("users"),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!subscription) {
      throw new Error("No active subscription found");
    }
    
    if (args.cancelAtPeriodEnd) {
      // Cancel at end of period (user keeps benefits until then)
      await ctx.db.patch(subscription._id, {
        cancelAtPeriodEnd: true,
      });
    } else {
      // Immediate cancellation
      await ctx.db.patch(subscription._id, {
        status: "cancelled",
      });
      
      // Update user's isPremium flag
      await ctx.db.patch(args.userId, {
        isPremium: false,
      });
    }
    
    // Log cancellation
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: 0,
      type: "subscription_cancelled",
      relatedId: subscription._id,
    });
    
    return { success: true };
  },
});

/**
 * Handle Stripe webhook for subscription events
 */
export const handleStripeWebhook = mutation({
  args: {
    eventType: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_stripe_subscription", (q) => 
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
    
    if (!subscription) {
      console.log("Subscription not found for Stripe ID:", args.stripeSubscriptionId);
      return { success: false, error: "Subscription not found" };
    }
    
    switch (args.eventType) {
      case "customer.subscription.updated":
        if (args.status === "past_due") {
          await ctx.db.patch(subscription._id, { status: "past_due" });
        } else if (args.status === "active") {
          await ctx.db.patch(subscription._id, { status: "active" });
        }
        break;
        
      case "customer.subscription.deleted":
        await ctx.db.patch(subscription._id, { status: "cancelled" });
        await ctx.db.patch(subscription.userId, { isPremium: false });
        break;
        
      case "invoice.payment_succeeded":
        // Renew subscription period
        const now = Date.now();
        const periodDays = subscription.billingCycle === "annual" ? 365 : 30;
        await ctx.db.patch(subscription._id, {
          currentPeriodStart: now,
          currentPeriodEnd: now + (periodDays * 24 * 60 * 60 * 1000),
          status: "active",
        });
        
        // Award monthly credits
        const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === subscription.tier);
        if (tierConfig && tierConfig.benefits.monthlyCredits > 0) {
          const user = await ctx.db.get(subscription.userId);
          if (user) {
            await ctx.db.patch(subscription.userId, {
              credits: user.credits + tierConfig.benefits.monthlyCredits,
            });
          }
        }
        break;
        
      case "invoice.payment_failed":
        await ctx.db.patch(subscription._id, { status: "past_due" });
        break;
    }
    
    return { success: true };
  },
});

// ============================================
// TIER COMPARISON HELPERS
// ============================================

/**
 * Compare two tiers and return if first is higher or equal
 */
export const compareTiers = query({
  args: {
    userTier: v.string(),
    requiredTier: v.string(),
  },
  handler: async (ctx, args) => {
    const tierOrder = ["free", "plus", "pro", "elite"];
    const userIndex = tierOrder.indexOf(args.userTier);
    const requiredIndex = tierOrder.indexOf(args.requiredTier);
    
    return {
      meetsRequirement: userIndex >= requiredIndex,
      userTierIndex: userIndex,
      requiredTierIndex: requiredIndex,
    };
  },
});

/**
 * Get all active premium subscribers count
 */
export const getPremiumStats = query({
  args: {},
  handler: async (ctx) => {
    const allSubscriptions = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    const stats = {
      total: allSubscriptions.length,
      plus: allSubscriptions.filter(s => s.tier === "plus").length,
      pro: allSubscriptions.filter(s => s.tier === "pro").length,
      elite: allSubscriptions.filter(s => s.tier === "elite").length,
    };
    
    return stats;
  },
});
