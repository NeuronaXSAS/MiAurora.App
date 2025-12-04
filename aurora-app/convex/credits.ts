/**
 * Aurora Premium - Credits Service
 * 
 * Handles credit purchases, engagement rewards, and referrals.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { CREDIT_PACKAGES, ENGAGEMENT_REWARDS } from "./premiumConfig";

// ============================================
// CREDIT QUERIES
// ============================================

/**
 * Get user's credit balance
 */
export const getCreditBalance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.credits || 0;
  },
});

/**
 * Get credit history for a user
 */
export const getCreditHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    
    return transactions;
  },
});

/**
 * Get available credit packages
 */
export const getAvailablePackages = query({
  args: {},
  handler: async () => {
    return CREDIT_PACKAGES;
  },
});

// ============================================
// CREDIT PURCHASE MUTATIONS
// ============================================

/**
 * Purchase credits (called after Stripe payment)
 */
export const purchaseCredits = mutation({
  args: {
    userId: v.id("users"),
    packageId: v.string(),
    stripePaymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const creditPackage = CREDIT_PACKAGES.find(p => p.packageId === args.packageId);
    if (!creditPackage) {
      throw new Error("Invalid package");
    }
    
    const totalCredits = creditPackage.credits + (creditPackage.bonus || 0);
    
    // Record purchase
    await ctx.db.insert("creditPurchases", {
      userId: args.userId,
      packageId: args.packageId,
      credits: creditPackage.credits,
      bonusCredits: creditPackage.bonus,
      amountPaid: creditPackage.priceUSD,
      currency: "USD",
      stripePaymentId: args.stripePaymentId,
      status: "completed",
    });
    
    // Add credits to user
    await ctx.db.patch(args.userId, {
      credits: user.credits + totalCredits,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: totalCredits,
      type: "credit_purchase",
      relatedId: args.packageId,
    });
    
    return {
      success: true,
      creditsAdded: totalCredits,
      newBalance: user.credits + totalCredits,
    };
  },
});

/**
 * Spend credits
 */
export const spendCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    if (user.credits < args.amount) {
      throw new Error("Insufficient credits");
    }
    
    // Deduct credits
    await ctx.db.patch(args.userId, {
      credits: user.credits - args.amount,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: args.reason,
      relatedId: args.relatedId,
    });
    
    return {
      success: true,
      creditsSpent: args.amount,
      newBalance: user.credits - args.amount,
    };
  },
});

// ============================================
// ENGAGEMENT REWARDS
// ============================================

/**
 * Award credits for engagement action
 */
export const awardEngagementCredits = mutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const reward = ENGAGEMENT_REWARDS.find(r => r.action === args.action);
    if (!reward) {
      return { success: false, reason: "Unknown action" };
    }
    
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    
    // Check for existing reward tracking
    const existingReward = await ctx.db
      .query("engagementRewards")
      .withIndex("by_user_action", (q) => 
        q.eq("userId", args.userId).eq("action", args.action)
      )
      .first();
    
    // Check cooldown
    if (existingReward && reward.cooldownMs) {
      const timeSinceLastReward = now - existingReward.lastAwarded;
      if (timeSinceLastReward < reward.cooldownMs) {
        return {
          success: false,
          reason: "Cooldown not expired",
          nextAvailable: existingReward.lastAwarded + reward.cooldownMs,
        };
      }
    }
    
    // Check daily limit
    if (existingReward && reward.dailyLimit) {
      const lastAwardedDate = new Date(existingReward.lastAwarded).toISOString().split("T")[0];
      if (lastAwardedDate === today && (existingReward.countToday || 0) >= reward.dailyLimit) {
        return {
          success: false,
          reason: "Daily limit reached",
          dailyLimit: reward.dailyLimit,
        };
      }
    }
    
    // Update or create reward tracking
    if (existingReward) {
      const lastAwardedDate = new Date(existingReward.lastAwarded).toISOString().split("T")[0];
      const countToday = lastAwardedDate === today ? (existingReward.countToday || 0) + 1 : 1;
      
      await ctx.db.patch(existingReward._id, {
        lastAwarded: now,
        countToday,
      });
    } else {
      await ctx.db.insert("engagementRewards", {
        userId: args.userId,
        action: args.action,
        lastAwarded: now,
        countToday: 1,
      });
    }
    
    // Award credits
    await ctx.db.patch(args.userId, {
      credits: user.credits + reward.credits,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: reward.credits,
      type: `engagement_${args.action}`,
      relatedId: args.relatedId,
    });
    
    return {
      success: true,
      creditsAwarded: reward.credits,
      newBalance: user.credits + reward.credits,
      action: args.action,
    };
  },
});

/**
 * Award daily login bonus
 */
export const awardDailyLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const reward = ENGAGEMENT_REWARDS.find(r => r.action === "daily_login");
    if (!reward) {
      return { success: false, reason: "Reward not configured" };
    }
    
    const now = Date.now();
    
    // Check for existing reward tracking
    const existingReward = await ctx.db
      .query("engagementRewards")
      .withIndex("by_user_action", (q) => 
        q.eq("userId", args.userId).eq("action", "daily_login")
      )
      .first();
    
    // Check cooldown (24 hours)
    if (existingReward && reward.cooldownMs) {
      const timeSinceLastReward = now - existingReward.lastAwarded;
      if (timeSinceLastReward < reward.cooldownMs) {
        return {
          success: false,
          reason: "Already claimed today",
          nextAvailable: existingReward.lastAwarded + reward.cooldownMs,
        };
      }
    }
    
    // Update or create reward tracking
    if (existingReward) {
      await ctx.db.patch(existingReward._id, {
        lastAwarded: now,
        countToday: 1,
      });
    } else {
      await ctx.db.insert("engagementRewards", {
        userId: args.userId,
        action: "daily_login",
        lastAwarded: now,
        countToday: 1,
      });
    }
    
    // Award credits
    await ctx.db.patch(args.userId, {
      credits: user.credits + reward.credits,
    });
    
    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: reward.credits,
      type: "engagement_daily_login",
    });
    
    return {
      success: true,
      creditsAwarded: reward.credits,
      newBalance: user.credits + reward.credits,
    };
  },
});

// ============================================
// REFERRAL SYSTEM
// ============================================

/**
 * Create a referral code for user
 */
export const createReferralCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Generate unique referral code
    const code = `AURORA_${user.name.substring(0, 4).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;
    
    return { code };
  },
});

/**
 * Process referral when new user signs up
 */
export const processReferral = mutation({
  args: {
    referralCode: v.string(),
    refereeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find referral by code
    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_code", (q) => q.eq("referralCode", args.referralCode))
      .first();
    
    if (!referral) {
      return { success: false, reason: "Invalid referral code" };
    }
    
    if (referral.status !== "pending") {
      return { success: false, reason: "Referral already used" };
    }
    
    // Update referral status
    await ctx.db.patch(referral._id, {
      refereeId: args.refereeId,
      status: "completed",
      completedAt: Date.now(),
    });
    
    // Award credits to both users (100 each)
    const REFERRAL_CREDITS = 100;
    
    // Award to referrer
    const referrer = await ctx.db.get(referral.referrerId);
    if (referrer) {
      await ctx.db.patch(referral.referrerId, {
        credits: referrer.credits + REFERRAL_CREDITS,
      });
      await ctx.db.insert("transactions", {
        userId: referral.referrerId,
        amount: REFERRAL_CREDITS,
        type: "referral_bonus",
        relatedId: args.refereeId,
      });
      await ctx.db.patch(referral._id, { referrerCredited: true });
    }
    
    // Award to referee
    const referee = await ctx.db.get(args.refereeId);
    if (referee) {
      await ctx.db.patch(args.refereeId, {
        credits: referee.credits + REFERRAL_CREDITS,
      });
      await ctx.db.insert("transactions", {
        userId: args.refereeId,
        amount: REFERRAL_CREDITS,
        type: "referral_welcome",
        relatedId: referral.referrerId,
      });
      await ctx.db.patch(referral._id, { refereeCredited: true });
    }
    
    return {
      success: true,
      creditsAwarded: REFERRAL_CREDITS,
    };
  },
});

/**
 * Create pending referral (when user shares their code)
 */
export const createPendingReferral = mutation({
  args: {
    referrerId: v.id("users"),
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if code already exists
    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_code", (q) => q.eq("referralCode", args.referralCode))
      .first();
    
    if (existing) {
      return { success: false, reason: "Code already exists" };
    }
    
    await ctx.db.insert("referrals", {
      referrerId: args.referrerId,
      refereeId: args.referrerId, // Placeholder, will be updated
      referralCode: args.referralCode,
      status: "pending",
      referrerCredited: false,
      refereeCredited: false,
    });
    
    return { success: true, code: args.referralCode };
  },
});

/**
 * Get user's referral stats
 */
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();
    
    const completed = referrals.filter(r => r.status === "completed");
    const pending = referrals.filter(r => r.status === "pending");
    
    return {
      totalReferrals: completed.length,
      pendingReferrals: pending.length,
      totalCreditsEarned: completed.length * 100,
    };
  },
});


// ============================================
// ADDITIONAL QUERIES FOR CREDITS PAGE
// ============================================

/**
 * Get credit stats for dashboard
 */
export const getCreditStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        currentBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
        monthlyEarned: 0,
        monthlyLimit: 500,
        monthlyRemaining: 500,
        daysUntilReset: 30,
        earnedByType: {},
      };
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate earnings by type
    const earnedByType: Record<string, number> = {};
    transactions
      .filter(t => t.amount > 0)
      .forEach(t => {
        const type = t.type || "other";
        earnedByType[type] = (earnedByType[type] || 0) + t.amount;
      });

    // Calculate days until monthly reset
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const monthlyLimit = 500; // Default monthly earning limit
    const monthlyEarned = user.monthlyCreditsEarned || 0;

    return {
      currentBalance: user.credits || 0,
      totalEarned,
      totalSpent,
      monthlyEarned,
      monthlyLimit,
      monthlyRemaining: Math.max(0, monthlyLimit - monthlyEarned),
      daysUntilReset,
      earnedByType,
    };
  },
});

/**
 * Get transaction history with filtering
 */
export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit * 2); // Get more to filter

    if (args.type && args.type !== "all") {
      if (args.type === "earned") {
        transactions = transactions.filter(t => t.amount > 0);
      } else if (args.type === "spent") {
        transactions = transactions.filter(t => t.amount < 0);
      } else {
        const filterType = args.type;
        transactions = transactions.filter(t => t.type?.includes(filterType) ?? false);
      }
    }

    return transactions.slice(0, limit);
  },
});

/**
 * Export transactions for CSV download
 */
export const exportTransactions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return transactions.map(t => ({
      date: new Date(t._creationTime).toISOString(),
      type: t.type || "unknown",
      amount: t.amount,
      description: t.relatedId ?? "",
    }));
  },
});
