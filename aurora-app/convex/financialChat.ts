/**
 * Aurora App - Financial Chat & Planning
 * 
 * AI-powered financial wellness chat that:
 * - Provides personalized financial advice
 * - Tracks financial goals and metrics in real-time
 * - Stores conversation history for context
 * - Updates financial wellness score based on interactions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Financial chat message schema
export const sendFinancialMessage = mutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    aiResponse: v.string(),
    extractedData: v.optional(v.object({
      income: v.optional(v.number()),
      expenses: v.optional(v.number()),
      savingsGoal: v.optional(v.number()),
      currentSavings: v.optional(v.number()),
      debtAmount: v.optional(v.number()),
      budgetCategory: v.optional(v.string()),
      actionType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Store the message
    const messageId = await ctx.db.insert("financialChats", {
      userId: args.userId,
      userMessage: args.message,
      aiResponse: args.aiResponse,
      extractedData: args.extractedData,
      timestamp: Date.now(),
    });

    // Update financial profile if data was extracted
    if (args.extractedData) {
      const existingProfile = await ctx.db
        .query("financialProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();

      if (existingProfile) {
        const updates: Record<string, unknown> = { lastUpdated: Date.now() };
        
        if (args.extractedData.income !== undefined) {
          updates.monthlyIncome = args.extractedData.income;
        }
        if (args.extractedData.expenses !== undefined) {
          updates.monthlyExpenses = args.extractedData.expenses;
        }
        if (args.extractedData.savingsGoal !== undefined) {
          updates.savingsGoal = args.extractedData.savingsGoal;
        }
        if (args.extractedData.currentSavings !== undefined) {
          updates.currentSavings = args.extractedData.currentSavings;
        }
        if (args.extractedData.debtAmount !== undefined) {
          updates.totalDebt = args.extractedData.debtAmount;
        }

        // Get updated profile data for score calculation
        const updatedProfile = {
          monthlyIncome: (updates.monthlyIncome as number) ?? existingProfile.monthlyIncome,
          monthlyExpenses: (updates.monthlyExpenses as number) ?? existingProfile.monthlyExpenses,
          currentSavings: (updates.currentSavings as number) ?? existingProfile.currentSavings,
          totalDebt: (updates.totalDebt as number) ?? existingProfile.totalDebt,
        };
        
        // Calculate and update wellness score
        const wellnessScore = calculateWellnessScore(updatedProfile);
        updates.wellnessScore = wellnessScore;
        
        await ctx.db.patch(existingProfile._id, updates);
      } else {
        // Create new profile with calculated wellness score
        const newProfileData = {
          monthlyIncome: args.extractedData.income || 0,
          monthlyExpenses: args.extractedData.expenses || 0,
          currentSavings: args.extractedData.currentSavings || 0,
          totalDebt: args.extractedData.debtAmount || 0,
        };
        
        const wellnessScore = calculateWellnessScore(newProfileData);
        
        await ctx.db.insert("financialProfiles", {
          userId: args.userId,
          ...newProfileData,
          savingsGoal: args.extractedData.savingsGoal || 0,
          wellnessScore,
          lastUpdated: Date.now(),
        });
      }
    }

    // Award credits for financial planning activity
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + 2,
      });
    }

    return messageId;
  },
});

// Get chat history
export const getChatHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("financialChats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return messages.reverse();
  },
});

// Get financial profile
export const getFinancialProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("financialProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsGoal: 0,
        currentSavings: 0,
        totalDebt: 0,
        wellnessScore: 50,
        savingsRate: 0,
        debtToIncomeRatio: 0,
        emergencyFundMonths: 0,
      };
    }

    // Calculate derived metrics
    const savingsRate = profile.monthlyIncome > 0 
      ? ((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) * 100 
      : 0;
    
    const debtToIncomeRatio = profile.monthlyIncome > 0 
      ? (profile.totalDebt / (profile.monthlyIncome * 12)) * 100 
      : 0;
    
    const emergencyFundMonths = profile.monthlyExpenses > 0 
      ? profile.currentSavings / profile.monthlyExpenses 
      : 0;

    return {
      ...profile,
      savingsRate: Math.round(savingsRate * 10) / 10,
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,
      emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
    };
  },
});

// Get financial goals
export const getFinancialGoals = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("financialGoals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return goals;
  },
});

// Create or update financial goal
export const upsertFinancialGoal = mutation({
  args: {
    userId: v.id("users"),
    goalId: v.optional(v.id("financialGoals")),
    title: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.goalId) {
      await ctx.db.patch(args.goalId, {
        title: args.title,
        targetAmount: args.targetAmount,
        currentAmount: args.currentAmount,
        deadline: args.deadline,
        category: args.category,
        updatedAt: Date.now(),
      });
      return args.goalId;
    } else {
      return await ctx.db.insert("financialGoals", {
        userId: args.userId,
        title: args.title,
        targetAmount: args.targetAmount,
        currentAmount: args.currentAmount,
        deadline: args.deadline,
        category: args.category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Helper to calculate wellness score
function calculateWellnessScore(profile: {
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  totalDebt: number;
}): number {
  let score = 50; // Base score

  // Savings rate bonus (up to +20)
  const savingsRate = profile.monthlyIncome > 0
    ? ((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) * 100
    : 0;
  if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;
  else if (savingsRate > 0) score += 5;

  // Emergency fund bonus (up to +15)
  const emergencyMonths = profile.monthlyExpenses > 0
    ? profile.currentSavings / profile.monthlyExpenses
    : 0;
  if (emergencyMonths >= 6) score += 15;
  else if (emergencyMonths >= 3) score += 10;
  else if (emergencyMonths >= 1) score += 5;

  // Low debt bonus (up to +15)
  const debtRatio = profile.monthlyIncome > 0
    ? (profile.totalDebt / (profile.monthlyIncome * 12)) * 100
    : 0;
  if (debtRatio === 0) score += 15;
  else if (debtRatio < 20) score += 10;
  else if (debtRatio < 40) score += 5;

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

// Clear chat history (for privacy)
export const clearChatHistory = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("financialChats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { deleted: messages.length };
  },
});
