import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Monthly credit earning limit
 */
const MONTHLY_CREDIT_LIMIT = 1000;

/**
 * Check and reset monthly credits if needed
 */
export const checkMonthlyReset = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const now = Date.now();
    const lastReset = user.lastCreditReset || user._creationTime;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days

    // Reset if more than 30 days have passed
    if (lastReset < oneMonthAgo) {
      await ctx.db.patch(args.userId, {
        monthlyCreditsEarned: 0,
        lastCreditReset: now,
      });

      // Log the reset
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 0,
        type: "monthly_reset",
        relatedId: args.userId,
      });

      return { reset: true, previousEarned: user.monthlyCreditsEarned || 0 };
    }

    return { reset: false };
  },
});

/**
 * Award credits with monthly limit check
 */
export const awardCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    relatedId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check monthly reset
    await ctx.scheduler.runAfter(0, "credits:checkMonthlyReset" as any, {
      userId: args.userId,
    });

    const monthlyEarned = user.monthlyCreditsEarned || 0;

    // Check if user has reached monthly limit
    if (monthlyEarned >= MONTHLY_CREDIT_LIMIT) {
      throw new Error(
        `Monthly credit limit reached (${MONTHLY_CREDIT_LIMIT}). Resets in ${getRemainingDays(
          user.lastCreditReset || user._creationTime
        )} days.`
      );
    }

    // Calculate actual amount to award (respect limit)
    const remainingAllowance = MONTHLY_CREDIT_LIMIT - monthlyEarned;
    const actualAmount = Math.min(args.amount, remainingAllowance);

    // Update user credits
    await ctx.db.patch(args.userId, {
      credits: user.credits + actualAmount,
      monthlyCreditsEarned: monthlyEarned + actualAmount,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: actualAmount,
      type: args.type,
      relatedId: args.relatedId,
    });

    return {
      success: true,
      awarded: actualAmount,
      newBalance: user.credits + actualAmount,
      monthlyEarned: monthlyEarned + actualAmount,
      monthlyLimit: MONTHLY_CREDIT_LIMIT,
      limitReached: monthlyEarned + actualAmount >= MONTHLY_CREDIT_LIMIT,
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
    type: v.string(),
    relatedId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < args.amount) {
      throw new Error(
        `Insufficient credits. You have ${user.credits}, need ${args.amount}.`
      );
    }

    // Deduct credits
    await ctx.db.patch(args.userId, {
      credits: user.credits - args.amount,
    });

    // Log transaction (negative amount for spending)
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.amount,
      type: args.type,
      relatedId: args.relatedId,
    });

    return {
      success: true,
      spent: args.amount,
      newBalance: user.credits - args.amount,
    };
  },
});

/**
 * Get user's credit transaction history
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
      .take(limit);

    // Filter by type if specified
    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    // Enrich with related data
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        let relatedData = null;

        // Get related post, opportunity, route, etc.
        if (transaction.relatedId) {
          try {
            // Try to get as different types
            const relatedPost = await ctx.db.get(transaction.relatedId as any);
            if (relatedPost) {
              relatedData = {
                type: "post",
                title: (relatedPost as any).title || "Post",
              };
            }
          } catch (e) {
            // Ignore if not found
          }
        }

        return {
          ...transaction,
          relatedData,
          formattedType: formatTransactionType(transaction.type),
        };
      })
    );

    return enrichedTransactions;
  },
});

/**
 * Get credit statistics for user
 */
export const getCreditStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get all transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate stats
    const totalEarned = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlyEarned = user.monthlyCreditsEarned || 0;
    const monthlyRemaining = MONTHLY_CREDIT_LIMIT - monthlyEarned;
    const daysUntilReset = getRemainingDays(
      user.lastCreditReset || user._creationTime
    );

    // Breakdown by type
    const earnedByType: Record<string, number> = {};
    const spentByType: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.amount > 0) {
        earnedByType[t.type] = (earnedByType[t.type] || 0) + t.amount;
      } else {
        spentByType[t.type] = (spentByType[t.type] || 0) + Math.abs(t.amount);
      }
    });

    return {
      currentBalance: user.credits,
      totalEarned,
      totalSpent,
      monthlyEarned,
      monthlyLimit: MONTHLY_CREDIT_LIMIT,
      monthlyRemaining,
      daysUntilReset,
      earnedByType,
      spentByType,
      transactionCount: transactions.length,
    };
  },
});

/**
 * Export transaction history as CSV data
 */
export const exportTransactions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Format as CSV data
    const csvData = transactions.map((t) => ({
      date: new Date(t._creationTime).toISOString(),
      type: formatTransactionType(t.type),
      amount: t.amount,
      balance: "N/A", // Would need to calculate running balance
      description: t.type,
    }));

    return csvData;
  },
});

// Helper functions

function getRemainingDays(lastReset: number): number {
  const now = Date.now();
  const nextReset = lastReset + 30 * 24 * 60 * 60 * 1000; // 30 days
  const remaining = nextReset - now;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    post_created: "Post Created",
    verification: "Post Verified",
    opportunity_unlock: "Opportunity Unlocked",
    route_shared: "Route Shared",
    route_completed: "Route Completed",
    reel_created: "Reel Created",
    livestream_hosted: "Livestream Hosted",
    gift_received: "Gift Received",
    gift_sent: "Gift Sent",
    monthly_reset: "Monthly Reset",
    bonus: "Bonus",
    referral: "Referral Bonus",
  };

  return typeMap[type] || type;
}
