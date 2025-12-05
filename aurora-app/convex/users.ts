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

    // Create new user with generous welcome bonus (50 credits)
    // This ensures users can immediately experience premium features
    const WELCOME_BONUS = 50;
    
    const userId = await ctx.db.insert("users", {
      workosId: args.workosId,
      email: args.email,
      name: args.name,
      profileImage: args.profileImage,
      credits: WELCOME_BONUS,
      trustScore: 0,
      onboardingCompleted: false,
      monthlyCreditsEarned: 0,
      lastCreditReset: Date.now(),
    });

    // Log welcome bonus transaction
    await ctx.db.insert("transactions", {
      userId,
      amount: WELCOME_BONUS,
      type: "welcome_bonus",
    });
    
    // Create welcome notification
    await ctx.db.insert("notifications", {
      userId,
      type: "tip",
      title: "Welcome to Aurora App! 💜",
      message: `You've received ${WELCOME_BONUS} credits to get started. Explore safety features, connect with the community, and earn more credits!`,
      isRead: false,
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

    // Check if this is first time completing onboarding
    const isFirstCompletion = !user.onboardingCompleted;
    const ONBOARDING_BONUS = 25;

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

    // Award onboarding completion bonus (first time only)
    if (isFirstCompletion) {
      await ctx.db.patch(user._id, {
        credits: user.credits + ONBOARDING_BONUS,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + ONBOARDING_BONUS,
      });

      // Log bonus transaction
      await ctx.db.insert("transactions", {
        userId: user._id,
        amount: ONBOARDING_BONUS,
        type: "onboarding_complete",
      });

      // Create celebration notification
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "tip",
        title: "Profile Complete! 🎉",
        message: `You earned ${ONBOARDING_BONUS} credits for completing your profile. Keep exploring to earn more!`,
        isRead: false,
      });
    }

    return { success: true, bonusAwarded: isFirstCompletion ? ONBOARDING_BONUS : 0 };
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
 * Update user avatar
 */
export const updateAvatar = mutation({
  args: {
    userId: v.id("users"),
    avatarConfig: v.object({
      seed: v.string(),
      backgroundColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
      skinColor: v.string(),
      eyesStyle: v.string(),
      mouthStyle: v.string(),
      earrings: v.string(),
      freckles: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      avatarConfig: args.avatarConfig,
    });

    return { success: true };
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


/**
 * Complete user data deletion (GDPR compliant)
 * Deletes ALL data associated with a user across all tables
 */
export const deleteUserComplete = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    console.log(`Starting complete data deletion for user: ${args.userId}`);

    // 1. Delete posts and related data
    const posts = await ctx.db.query("posts").withIndex("by_author", (q) => q.eq("authorId", args.userId)).collect();
    for (const post of posts) {
      const postVerifications = await ctx.db.query("verifications").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
      for (const v of postVerifications) await ctx.db.delete(v._id);
      const postComments = await ctx.db.query("comments").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
      for (const c of postComments) await ctx.db.delete(c._id);
      await ctx.db.delete(post._id);
    }

    // 2. Delete comments, votes, verifications
    const comments = await ctx.db.query("comments").withIndex("by_author", (q) => q.eq("authorId", args.userId)).collect();
    for (const c of comments) await ctx.db.delete(c._id);
    
    const votes = await ctx.db.query("votes").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const v of votes) await ctx.db.delete(v._id);
    
    const verifications = await ctx.db.query("verifications").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const v of verifications) await ctx.db.delete(v._id);

    // 3. Delete unlocks and transactions
    const unlocks = await ctx.db.query("unlocks").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const u of unlocks) await ctx.db.delete(u._id);
    
    const transactions = await ctx.db.query("transactions").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const t of transactions) await ctx.db.delete(t._id);

    // 4. Delete routes and completions
    const routes = await ctx.db.query("routes").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect();
    for (const route of routes) {
      const completions = await ctx.db.query("routeCompletions").withIndex("by_route", (q) => q.eq("routeId", route._id)).collect();
      for (const c of completions) await ctx.db.delete(c._id);
      const flags = await ctx.db.query("routeFlags").withIndex("by_route", (q) => q.eq("routeId", route._id)).collect();
      for (const f of flags) await ctx.db.delete(f._id);
      await ctx.db.delete(route._id);
    }
    const routeCompletions = await ctx.db.query("routeCompletions").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const c of routeCompletions) await ctx.db.delete(c._id);

    // 5. Delete opportunities
    const opportunities = await ctx.db.query("opportunities").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect();
    for (const o of opportunities) await ctx.db.delete(o._id);

    // 6. Delete messages
    const messages = await ctx.db.query("messages").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const m of messages) await ctx.db.delete(m._id);

    // 7. Delete reels and interactions
    const reels = await ctx.db.query("reels").withIndex("by_author", (q) => q.eq("authorId", args.userId)).collect();
    for (const reel of reels) {
      const likes = await ctx.db.query("reelLikes").withIndex("by_reel", (q) => q.eq("reelId", reel._id)).collect();
      for (const l of likes) await ctx.db.delete(l._id);
      const reelComments = await ctx.db.query("reelComments").withIndex("by_reel", (q) => q.eq("reelId", reel._id)).collect();
      for (const c of reelComments) await ctx.db.delete(c._id);
      await ctx.db.delete(reel._id);
    }
    const userReelComments = await ctx.db.query("reelComments").withIndex("by_author", (q) => q.eq("authorId", args.userId)).collect();
    for (const c of userReelComments) await ctx.db.delete(c._id);

    // 8. Delete livestreams
    const livestreams = await ctx.db.query("livestreams").withIndex("by_host", (q) => q.eq("hostId", args.userId)).collect();
    for (const stream of livestreams) {
      const viewers = await ctx.db.query("livestreamViewers").withIndex("by_livestream", (q) => q.eq("livestreamId", stream._id)).collect();
      for (const v of viewers) await ctx.db.delete(v._id);
      const likes = await ctx.db.query("livestreamLikes").withIndex("by_livestream", (q) => q.eq("livestreamId", stream._id)).collect();
      for (const l of likes) await ctx.db.delete(l._id);
      await ctx.db.delete(stream._id);
    }
    const viewerRecords = await ctx.db.query("livestreamViewers").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const v of viewerRecords) await ctx.db.delete(v._id);

    // 9. Delete notifications
    const notifications = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const n of notifications) await ctx.db.delete(n._id);

    // 10. Delete emergency data
    const emergencyContacts = await ctx.db.query("emergencyContacts").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const c of emergencyContacts) await ctx.db.delete(c._id);
    const emergencyAlerts = await ctx.db.query("emergencyAlerts").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const a of emergencyAlerts) await ctx.db.delete(a._id);

    // 11. Delete direct messages
    const sentDMs = await ctx.db.query("directMessages").withIndex("by_sender", (q) => q.eq("senderId", args.userId)).collect();
    for (const m of sentDMs) await ctx.db.delete(m._id);
    const receivedDMs = await ctx.db.query("directMessages").withIndex("by_receiver", (q) => q.eq("receiverId", args.userId)).collect();
    for (const m of receivedDMs) await ctx.db.delete(m._id);

    // 12. Delete poll votes
    const pollVotes = await ctx.db.query("pollVotes").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const v of pollVotes) await ctx.db.delete(v._id);

    // 13. Delete health data
    const hydrationLogs = await ctx.db.query("hydrationLogs").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const l of hydrationLogs) await ctx.db.delete(l._id);
    const emotionalCheckins = await ctx.db.query("emotionalCheckins").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const c of emotionalCheckins) await ctx.db.delete(c._id);
    const meditationSessions = await ctx.db.query("meditationSessions").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const s of meditationSessions) await ctx.db.delete(s._id);
    const cycleLogs = await ctx.db.query("cycleLogs").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const l of cycleLogs) await ctx.db.delete(l._id);

    // 14. Delete safety check-ins
    const safetyCheckins = await ctx.db.query("safetyCheckins").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const c of safetyCheckins) await ctx.db.delete(c._id);

    // 15. Delete workplace reports
    const workplaceReports = await ctx.db.query("workplaceReports").withIndex("by_reporter", (q) => q.eq("reporterId", args.userId)).collect();
    for (const r of workplaceReports) await ctx.db.delete(r._id);

    // 16. Delete guardian connections
    const guardianConnections = await ctx.db.query("auroraGuardians").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const g of guardianConnections) await ctx.db.delete(g._id);
    const guardianOf = await ctx.db.query("auroraGuardians").withIndex("by_guardian", (q) => q.eq("guardianId", args.userId)).collect();
    for (const g of guardianOf) await ctx.db.delete(g._id);

    // 17. Delete guardian notifications
    const guardianNotifs = await ctx.db.query("guardianNotifications").withIndex("by_guardian", (q) => q.eq("guardianId", args.userId)).collect();
    for (const n of guardianNotifs) await ctx.db.delete(n._id);
    const fromUserNotifs = await ctx.db.query("guardianNotifications").withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId)).collect();
    for (const n of fromUserNotifs) await ctx.db.delete(n._id);

    // 18. Delete location shares
    const locationShares = await ctx.db.query("locationShares").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const s of locationShares) await ctx.db.delete(s._id);

    // 19. Delete circle data
    const circleMemberships = await ctx.db.query("circleMembers").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const m of circleMemberships) await ctx.db.delete(m._id);
    const circles = await ctx.db.query("circles").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect();
    for (const circle of circles) {
      const members = await ctx.db.query("circleMembers").withIndex("by_circle", (q) => q.eq("circleId", circle._id)).collect();
      for (const m of members) await ctx.db.delete(m._id);
      const circlePosts = await ctx.db.query("circlePosts").withIndex("by_circle", (q) => q.eq("circleId", circle._id)).collect();
      for (const p of circlePosts) await ctx.db.delete(p._id);
      await ctx.db.delete(circle._id);
    }
    const userCirclePosts = await ctx.db.query("circlePosts").withIndex("by_author", (q) => q.eq("authorId", args.userId)).collect();
    for (const p of userCirclePosts) await ctx.db.delete(p._id);

    // 20. Delete saved posts
    const savedPosts = await ctx.db.query("savedPosts").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const s of savedPosts) await ctx.db.delete(s._id);

    // 21. Delete accompaniment sessions
    const accompanimentSessions = await ctx.db.query("accompanimentSessions").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const s of accompanimentSessions) await ctx.db.delete(s._id);

    // 22. Delete route flags
    const routeFlags = await ctx.db.query("routeFlags").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const f of routeFlags) await ctx.db.delete(f._id);

    // 23. Delete reel likes by user
    const reelLikes = await ctx.db.query("reelLikes").collect();
    for (const like of reelLikes) {
      if (like.userId === args.userId) await ctx.db.delete(like._id);
    }

    // 24. Delete reel comment likes by user
    const reelCommentLikes = await ctx.db.query("reelCommentLikes").collect();
    for (const like of reelCommentLikes) {
      if (like.userId === args.userId) await ctx.db.delete(like._id);
    }

    // 25. Delete livestream likes by user
    const livestreamLikes = await ctx.db.query("livestreamLikes").collect();
    for (const like of livestreamLikes) {
      if (like.userId === args.userId) await ctx.db.delete(like._id);
    }

    // 26. Delete user reports (reports made by user)
    const userReports = await ctx.db.query("userReports").withIndex("by_reporter", (q) => q.eq("reporterId", args.userId)).collect();
    for (const r of userReports) await ctx.db.delete(r._id);

    // 27. Delete moderation queue entries for user's content
    const moderationEntries = await ctx.db.query("moderationQueue").withIndex("by_author", (q) => q.eq("authorId", args.userId)).collect();
    for (const m of moderationEntries) await ctx.db.delete(m._id);

    // 28. Delete subscriptions (both as subscriber and creator)
    const subscriberSubs = await ctx.db.query("subscriptions").withIndex("by_subscriber", (q) => q.eq("subscriberId", args.userId)).collect();
    for (const s of subscriberSubs) await ctx.db.delete(s._id);
    const creatorSubs = await ctx.db.query("subscriptions").withIndex("by_creator", (q) => q.eq("creatorId", args.userId)).collect();
    for (const s of creatorSubs) await ctx.db.delete(s._id);

    // 29. Delete tips (sent and received)
    const sentTips = await ctx.db.query("tips").withIndex("by_sender", (q) => q.eq("fromUserId", args.userId)).collect();
    for (const t of sentTips) await ctx.db.delete(t._id);
    const receivedTips = await ctx.db.query("tips").withIndex("by_recipient", (q) => q.eq("toUserId", args.userId)).collect();
    for (const t of receivedTips) await ctx.db.delete(t._id);

    // 30. Delete payouts
    const payouts = await ctx.db.query("payouts").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const p of payouts) await ctx.db.delete(p._id);

    // 31. Delete emergency responses
    const emergencyResponses = await ctx.db.query("emergencyResponses").withIndex("by_responder", (q) => q.eq("responderId", args.userId)).collect();
    for (const r of emergencyResponses) await ctx.db.delete(r._id);

    // 32. Delete analytics events (anonymize rather than delete for aggregate data)
    const analyticsEvents = await ctx.db.query("analytics_events").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const e of analyticsEvents) {
      // Anonymize by removing userId but keeping aggregate data
      await ctx.db.patch(e._id, { userId: undefined });
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);

    console.log(`Complete data deletion finished for user: ${args.userId}`);
    return { success: true, deletedTables: 32 };
  },
});

/**
 * Delete user by WorkOS ID (for webhook integration)
 * This performs a complete GDPR-compliant deletion of all user data
 */
export const deleteUserByWorkosId = mutation({
  args: { workosId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .first();

    if (!user) {
      console.log(`User with WorkOS ID ${args.workosId} not found - may already be deleted`);
      return { success: true, message: "User not found", userId: null };
    }

    console.log(`Starting complete deletion for user ${user._id} (WorkOS: ${args.workosId})`);
    
    // Return the userId so the webhook can call deleteUserComplete
    return { success: true, userId: user._id };
  },
});

/**
 * Cleanup orphaned data from deleted users
 */
export const cleanupOrphanedData = mutation({
  args: {},
  handler: async (ctx) => {
    let deletedCount = 0;

    // Find posts from deleted/non-existent users
    const allPosts = await ctx.db.query("posts").collect();
    for (const post of allPosts) {
      const author = await ctx.db.get(post.authorId);
      if (!author || author.isDeleted) {
        const verifications = await ctx.db.query("verifications").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        for (const v of verifications) await ctx.db.delete(v._id);
        const comments = await ctx.db.query("comments").withIndex("by_post", (q) => q.eq("postId", post._id)).collect();
        for (const c of comments) await ctx.db.delete(c._id);
        await ctx.db.delete(post._id);
        deletedCount++;
      }
    }

    // Find reels from deleted users
    const allReels = await ctx.db.query("reels").collect();
    for (const reel of allReels) {
      const author = await ctx.db.get(reel.authorId);
      if (!author || author.isDeleted) {
        const likes = await ctx.db.query("reelLikes").withIndex("by_reel", (q) => q.eq("reelId", reel._id)).collect();
        for (const l of likes) await ctx.db.delete(l._id);
        await ctx.db.delete(reel._id);
        deletedCount++;
      }
    }

    // Find routes from deleted users
    const allRoutes = await ctx.db.query("routes").collect();
    for (const route of allRoutes) {
      const creator = await ctx.db.get(route.creatorId);
      if (!creator || creator.isDeleted) {
        await ctx.db.delete(route._id);
        deletedCount++;
      }
    }

    // Find livestreams from deleted users
    const allLivestreams = await ctx.db.query("livestreams").collect();
    for (const stream of allLivestreams) {
      const host = await ctx.db.get(stream.hostId);
      if (!host || host.isDeleted) {
        await ctx.db.delete(stream._id);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} orphaned records`);
    return { success: true, deletedCount };
  },
});

/**
 * Get recent users for landing page social proof
 * Returns users with profile images for avatar display
 */
export const getRecentUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 8;
    
    // Get recent users who have profile images (for better social proof)
    const users = await ctx.db
      .query("users")
      .order("desc")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .take(limit * 2); // Get more to filter
    
    // Prioritize users with profile images
    const withImages = users.filter(u => u.profileImage);
    const withoutImages = users.filter(u => !u.profileImage);
    
    // Return mix, prioritizing those with images
    const result = [...withImages, ...withoutImages].slice(0, limit);
    
    // Return only safe public fields
    return result.map(u => ({
      _id: u._id,
      name: u.name,
      profileImage: u.profileImage,
    }));
  },
});

/**
 * Get suggested users for Sister Spotlight feature
 * Returns users that the current user might want to connect with
 * Based on similar interests, location, industry, and activity
 */
export const getSuggestedUsers = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const currentUser = await ctx.db.get(args.userId);
    
    if (!currentUser) return [];
    
    // Get all active users except current user
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.neq(q.field("_id"), args.userId),
          q.neq(q.field("isDeleted"), true)
        )
      )
      .take(100);
    
    // Score users based on compatibility
    const scoredUsers = allUsers.map(user => {
      let score = 0;
      
      // Same industry = +30 points
      if (currentUser.industry && user.industry === currentUser.industry) {
        score += 30;
      }
      
      // Same location = +25 points
      if (currentUser.location && user.location === currentUser.location) {
        score += 25;
      }
      
      // Shared interests = +10 points each
      if (currentUser.interests && user.interests) {
        const shared = currentUser.interests.filter(i => 
          user.interests?.includes(i)
        );
        score += shared.length * 10;
      }
      
      // Higher trust score = +1 point per 10 trust
      score += Math.floor((user.trustScore || 0) / 10);
      
      // Has profile image = +15 points (more engaging)
      if (user.profileImage) score += 15;
      
      // Has bio = +10 points
      if (user.bio) score += 10;
      
      // Premium user = +5 points
      if (user.isPremium) score += 5;
      
      // Active user (has credits) = +5 points
      if ((user.credits || 0) > 25) score += 5;
      
      // Add some randomness to keep it fresh
      score += Math.random() * 20;
      
      return { user, score };
    });
    
    // Sort by score and take top matches
    scoredUsers.sort((a, b) => b.score - a.score);
    
    // Return only safe public fields
    return scoredUsers.slice(0, limit).map(({ user }) => ({
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      industry: user.industry,
      interests: user.interests,
      trustScore: user.trustScore,
      credits: user.credits,
      isPremium: user.isPremium,
    }));
  },
});
