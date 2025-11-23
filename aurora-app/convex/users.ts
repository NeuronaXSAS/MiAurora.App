import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get or create user by WorkOS ID
 * Called after successful authentication
 */
export const getOrCreateUser = mutation({
  args: {
    workosId: v.string(),
    email: v.string(),
    name: v.string(),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .first();

    if (existingUser) {
      return existingUser;
    }

    // Create new user with signup bonus
    const userId = await ctx.db.insert("users", {
      workosId: args.workosId,
      email: args.email,
      name: args.name,
      profileImage: args.profileImage,
      credits: 25, // Signup bonus
      trustScore: 0,
      onboardingCompleted: false,
    });

    // Log signup bonus transaction
    await ctx.db.insert("transactions", {
      userId,
      amount: 25,
      type: "signup_bonus",
    });

    const user = await ctx.db.get(userId);
    return user;
  },
});

/**
 * Get current user by WorkOS ID
 */
export const getCurrentUser = query({
  args: { workosId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .first();

    return user;
  },
});

/**
 * Get user by ID
 */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Complete onboarding and award bonus credits
 */
export const completeOnboarding = mutation({
  args: {
    workosId: v.string(),
    industry: v.optional(v.string()),
    location: v.optional(v.string()),
    careerGoals: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Update user profile
    await ctx.db.patch(user._id, {
      industry: args.industry,
      location: args.location,
      careerGoals: args.careerGoals,
      bio: args.bio,
      interests: args.interests,
      profileImage: args.profileImage,
      onboardingCompleted: true,
    });

    return { success: true };
  },
});

/**
 * Update user credits
 */
export const updateCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("post_created"),
      v.literal("verification"),
      v.literal("opportunity_unlock"),
      v.literal("signup_bonus"),
      v.literal("referral")
    ),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Update credits
    const newCredits = user.credits + args.amount;
    
    if (newCredits < 0) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(args.userId, {
      credits: newCredits,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: args.amount,
      type: args.type,
      relatedId: args.relatedId,
    });

    return { success: true, newCredits };
  },
});

/**
 * Update user trust score
 */
export const updateTrustScore = mutation({
  args: {
    userId: v.id("users"),
    increment: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const newTrustScore = Math.min(1000, Math.max(0, user.trustScore + args.increment));

    await ctx.db.patch(args.userId, {
      trustScore: newTrustScore,
    });

    return { success: true, newTrustScore };
  },
});

/**
 * Get user's credit transaction history
 */
export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);

    return transactions;
  },
});

/**
 * Get user statistics for profile page
 */
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get total posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();

    // Get total verifications
    const verifications = await ctx.db
      .query("verifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get total unlocks
    const unlocks = await ctx.db
      .query("unlocks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate impact (sum of verification counts on user's posts)
    const impactCount = posts.reduce((sum, post) => sum + post.verificationCount, 0);

    return {
      totalPosts: posts.length,
      totalVerifications: verifications.length,
      totalUnlocks: unlocks.length,
      womenHelped: impactCount,
    };
  },
});

/**
 * Delete user account and all associated data
 */
export const deleteAccount = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // Delete all user's comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete all user's votes
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete all user's verifications
    const verifications = await ctx.db
      .query("verifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const verification of verifications) {
      await ctx.db.delete(verification._id);
    }

    // Delete all user's unlocks
    const unlocks = await ctx.db
      .query("unlocks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const unlock of unlocks) {
      await ctx.db.delete(unlock._id);
    }

    // Delete all user's transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Delete all user's routes
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();
    
    for (const route of routes) {
      await ctx.db.delete(route._id);
    }

    // Delete all user's route completions
    const routeCompletions = await ctx.db
      .query("routeCompletions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const completion of routeCompletions) {
      await ctx.db.delete(completion._id);
    }

    // Delete all user's opportunities
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();
    
    for (const opportunity of opportunities) {
      await ctx.db.delete(opportunity._id);
    }

    // Delete all user's messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});
