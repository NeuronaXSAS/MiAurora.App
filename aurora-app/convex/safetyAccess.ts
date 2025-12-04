/**
 * Aurora App - Safety Access Control
 * 
 * CRITICAL: This module ensures safety features are NEVER paywalled.
 * Safety is our priority, not a premium feature.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { SAFETY_FEATURES } from "./premiumConfig";

// ============================================
// SAFETY ACCESS QUERIES
// ============================================

/**
 * Check if a feature is a safety feature (always free)
 */
export const isSafetyFeature = query({
  args: { feature: v.string() },
  handler: async (ctx, args) => {
    return SAFETY_FEATURES.includes(args.feature);
  },
});

/**
 * Get all safety features list
 */
export const getSafetyFeatures = query({
  args: {},
  handler: async () => {
    return SAFETY_FEATURES;
  },
});

/**
 * Validate user can access a feature
 * Safety features ALWAYS return allowed: true
 */
export const validateAccess = query({
  args: {
    userId: v.id("users"),
    feature: v.string(),
    requiredTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // CRITICAL: Safety features are ALWAYS accessible
    if (SAFETY_FEATURES.includes(args.feature)) {
      return {
        allowed: true,
        reason: "Safety feature - always free",
        isSafetyFeature: true,
      };
    }

    // For non-safety features, check subscription
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const userTier = subscription?.status === "active" ? subscription.tier : "free";

    // If no specific tier required, allow access
    if (!args.requiredTier) {
      return { allowed: true, isSafetyFeature: false };
    }

    // Check tier hierarchy
    const tierOrder = ["free", "plus", "pro", "elite"];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(args.requiredTier);

    if (userTierIndex >= requiredTierIndex) {
      return { allowed: true, isSafetyFeature: false };
    }

    return {
      allowed: false,
      reason: `Requires ${args.requiredTier} tier or higher`,
      requiredTier: args.requiredTier,
      currentTier: userTier,
      upgradeUrl: "/premium",
      isSafetyFeature: false,
    };
  },
});

/**
 * Get user's access summary
 * Shows what features they can access based on their tier
 */
export const getUserAccessSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const userTier = subscription?.status === "active" ? subscription.tier : "free";

    // All users get safety features
    const safetyAccess = SAFETY_FEATURES.map(feature => ({
      feature,
      accessible: true,
      reason: "Safety feature - always free",
    }));

    // Free tier features
    const freeFeatures = [
      "public_circles",
      "basic_posts",
      "basic_comments",
      "view_feed",
      "view_reels",
      "view_livestreams",
      "basic_profile",
      "avatar_customization",
    ];

    const freeAccess = freeFeatures.map(feature => ({
      feature,
      accessible: true,
      reason: "Free tier feature",
    }));

    // Premium features by tier
    const premiumFeatures = {
      plus: ["ad_free", "ai_messages_100", "monthly_credits_100"],
      pro: ["ad_free", "ai_messages_unlimited", "monthly_credits_500", "priority_support", "advanced_analytics"],
      elite: ["ad_free", "ai_messages_unlimited", "monthly_credits_1500", "priority_support", "advanced_analytics", "exclusive_events", "safety_consultations"],
    };

    const tierOrder = ["free", "plus", "pro", "elite"];
    const userTierIndex = tierOrder.indexOf(userTier);

    const premiumAccess = Object.entries(premiumFeatures).flatMap(([tier, features]) => {
      const tierIndex = tierOrder.indexOf(tier);
      return features.map(feature => ({
        feature,
        accessible: userTierIndex >= tierIndex,
        reason: userTierIndex >= tierIndex ? `Included in ${tier}` : `Requires ${tier} tier`,
        requiredTier: tier,
      }));
    });

    return {
      userTier,
      isPremium: userTier !== "free",
      safetyFeatures: safetyAccess,
      freeFeatures: freeAccess,
      premiumFeatures: premiumAccess,
    };
  },
});

// ============================================
// SAFETY AUDIT FUNCTIONS
// ============================================

/**
 * Audit function to verify safety features are not paywalled
 * This should be run periodically to ensure compliance
 */
export const auditSafetyAccess = query({
  args: {},
  handler: async (ctx) => {
    const issues: string[] = [];
    
    // List of features that MUST be free
    const requiredFreeFeatures = [
      "panic_button",
      "emergency_contacts",
      "safety_checkins",
      "basic_routes",
      "safety_resources",
      "emergency_mode",
      "aurora_guardians",
      "location_sharing",
      "accompaniment_sessions",
    ];

    // Verify each required feature is in SAFETY_FEATURES
    for (const feature of requiredFreeFeatures) {
      if (!SAFETY_FEATURES.includes(feature)) {
        issues.push(`CRITICAL: ${feature} is not in SAFETY_FEATURES list`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      safetyFeaturesCount: SAFETY_FEATURES.length,
      timestamp: Date.now(),
    };
  },
});

/**
 * Get rate limits for a user based on their tier
 * Safety features have no rate limits
 */
export const getRateLimits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const userTier = subscription?.status === "active" ? subscription.tier : "free";

    // Rate limits by tier
    const rateLimits = {
      free: {
        aiMessagesPerDay: 10,
        postsPerHour: 5,
        reelsPerDay: 3,
        livestreamsPerDay: 2,
      },
      plus: {
        aiMessagesPerDay: 100,
        postsPerHour: 25,
        reelsPerDay: 10,
        livestreamsPerDay: 5,
      },
      pro: {
        aiMessagesPerDay: -1, // Unlimited
        postsPerHour: 50,
        reelsPerDay: 20,
        livestreamsPerDay: 10,
      },
      elite: {
        aiMessagesPerDay: -1, // Unlimited
        postsPerHour: 100,
        reelsPerDay: 50,
        livestreamsPerDay: 20,
      },
    };

    return {
      tier: userTier,
      limits: rateLimits[userTier as keyof typeof rateLimits] || rateLimits.free,
      // Safety features have NO rate limits
      safetyLimits: {
        panicButton: -1, // Unlimited
        emergencyContacts: -1,
        safetyCheckins: -1,
        locationSharing: -1,
      },
    };
  },
});
