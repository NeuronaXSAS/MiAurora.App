import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List available opportunities with optional category filter
 */
export const list = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("job"),
        v.literal("mentorship"),
        v.literal("resource"),
        v.literal("event"),
        v.literal("funding")
      )
    ),
  },
  handler: async (ctx, args) => {
    let opportunitiesQuery = ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true));

    const opportunities = await opportunitiesQuery.collect();

    // Filter by category if provided
    const filtered = args.category
      ? opportunities.filter((opp) => opp.category === args.category)
      : opportunities;

    return filtered;
  },
});

/**
 * Get a single opportunity by ID
 */
export const get = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.opportunityId);
  },
});

/**
 * Unlock an opportunity (deduct credits and record unlock)
 */
export const unlock = mutation({
  args: {
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const opportunity = await ctx.db.get(args.opportunityId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    if (!opportunity.isActive) {
      throw new Error("Opportunity is no longer active");
    }

    // Check if already unlocked
    const existingUnlock = await ctx.db
      .query("unlocks")
      .withIndex("by_user_and_opportunity", (q) =>
        q.eq("userId", args.userId).eq("opportunityId", args.opportunityId)
      )
      .first();

    if (existingUnlock) {
      throw new Error("You have already unlocked this opportunity");
    }

    // Check if user has enough credits
    if (user.credits < opportunity.creditCost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    await ctx.db.patch(args.userId, {
      credits: user.credits - opportunity.creditCost,
    });

    // Create unlock record
    await ctx.db.insert("unlocks", {
      userId: args.userId,
      opportunityId: args.opportunityId,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -opportunity.creditCost,
      type: "opportunity_unlock",
      relatedId: args.opportunityId,
    });

    return { success: true, newCredits: user.credits - opportunity.creditCost };
  },
});

/**
 * Check if user has unlocked an opportunity
 */
export const hasUnlocked = query({
  args: {
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const unlock = await ctx.db
      .query("unlocks")
      .withIndex("by_user_and_opportunity", (q) =>
        q.eq("userId", args.userId).eq("opportunityId", args.opportunityId)
      )
      .first();

    return unlock !== null;
  },
});

/**
 * Get user's unlocked opportunities
 */
export const getUserUnlocks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unlocks = await ctx.db
      .query("unlocks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get full opportunity details
    const opportunities = await Promise.all(
      unlocks.map(async (unlock) => {
        const opportunity = await ctx.db.get(unlock.opportunityId);
        return {
          ...opportunity,
          unlockedAt: unlock._creationTime,
        };
      })
    );

    return opportunities.filter((opp) => opp !== null);
  },
});

/**
 * Create a new opportunity (admin function - DEPRECATED, use create instead)
 */
export const createAdmin = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("job"),
      v.literal("mentorship"),
      v.literal("resource"),
      v.literal("event"),
      v.literal("funding")
    ),
    creditCost: v.number(),
    companyName: v.optional(v.string()),
    salaryRange: v.optional(v.string()),
    safetyRating: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // This function is deprecated - kept for backwards compatibility
    throw new Error("Use the 'create' function with creatorId instead");
  },
});

/**
 * Update opportunity active status
 */
export const updateStatus = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.opportunityId, {
      isActive: args.isActive,
    });

    return { success: true };
  },
});


/**
 * Create a new opportunity (user-generated)
 */
export const create = mutation({
  args: {
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("job"),
      v.literal("mentorship"),
      v.literal("resource"),
      v.literal("event"),
      v.literal("funding")
    ),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    creditCost: v.number(), // 5-100 credits
    contactEmail: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    salary: v.optional(v.string()),
    requirements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Validate credit cost
    if (args.creditCost < 5 || args.creditCost > 100) {
      throw new Error("Credit cost must be between 5 and 100");
    }

    const opportunityId = await ctx.db.insert("opportunities", {
      creatorId: args.creatorId,
      title: args.title,
      description: args.description,
      category: args.category,
      company: args.company || "Community Member",
      location: args.location,
      creditCost: args.creditCost,
      contactEmail: args.contactEmail,
      externalLink: args.externalLink,
      thumbnailStorageId: args.thumbnailStorageId,
      salary: args.salary,
      requirements: args.requirements,
      isActive: true,
    });

    return { success: true, opportunityId };
  },
});

/**
 * Update an existing opportunity
 */
export const update = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("job"),
      v.literal("mentorship"),
      v.literal("resource"),
      v.literal("event"),
      v.literal("funding")
    )),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    creditCost: v.optional(v.number()),
    contactEmail: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    salary: v.optional(v.string()),
    requirements: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    if (opportunity.creatorId !== args.userId) {
      throw new Error("Unauthorized: You can only edit your own opportunities");
    }

    // Validate credit cost if provided
    if (args.creditCost !== undefined && (args.creditCost < 5 || args.creditCost > 100)) {
      throw new Error("Credit cost must be between 5 and 100");
    }

    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.company !== undefined) updates.company = args.company;
    if (args.location !== undefined) updates.location = args.location;
    if (args.creditCost !== undefined) updates.creditCost = args.creditCost;
    if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail;
    if (args.externalLink !== undefined) updates.externalLink = args.externalLink;
    if (args.thumbnailStorageId !== undefined) updates.thumbnailStorageId = args.thumbnailStorageId;
    if (args.salary !== undefined) updates.salary = args.salary;
    if (args.requirements !== undefined) updates.requirements = args.requirements;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.opportunityId, updates);

    return { success: true };
  },
});

/**
 * Delete an opportunity
 */
export const deleteOpportunity = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.opportunityId);
    
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    if (opportunity.creatorId !== args.userId) {
      throw new Error("Unauthorized: You can only delete your own opportunities");
    }

    // Delete thumbnail if exists
    if (opportunity.thumbnailStorageId) {
      try {
        await ctx.storage.delete(opportunity.thumbnailStorageId);
      } catch (error) {
        console.error("Error deleting thumbnail:", error);
      }
    }

    // Delete the opportunity
    await ctx.db.delete(args.opportunityId);

    return { success: true };
  },
});

/**
 * Get opportunities created by a user
 */
export const getByCreator = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .collect();

    return opportunities;
  },
});


// ============================================
// CREDIT-BASED INTERACTIONS
// ============================================

const COMMENT_CREDIT_COST = 2;
const LIKE_CREDIT_COST = 1;

/**
 * Comment on an opportunity (costs 2 credits)
 */
export const commentOnOpportunity = mutation({
  args: {
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
    content: v.string(),
    parentId: v.optional(v.id("opportunityComments")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity || !opportunity.isActive) {
      throw new Error("Opportunity not found or inactive");
    }

    // Validate content
    if (!args.content || args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }
    if (args.content.length > 500) {
      throw new Error("Comment must be 500 characters or less");
    }

    // Check credits
    if (user.credits < COMMENT_CREDIT_COST) {
      throw new Error(`Insufficient credits. Need ${COMMENT_CREDIT_COST} credits to comment.`);
    }

    // Deduct credits
    await ctx.db.patch(args.userId, {
      credits: user.credits - COMMENT_CREDIT_COST,
    });

    // Create comment
    const commentId = await ctx.db.insert("opportunityComments", {
      opportunityId: args.opportunityId,
      authorId: args.userId,
      content: args.content.trim(),
      parentId: args.parentId,
      likes: 0,
      isDeleted: false,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -COMMENT_CREDIT_COST,
      type: "opportunity_comment",
      relatedId: args.opportunityId,
    });

    return { success: true, commentId, newCredits: user.credits - COMMENT_CREDIT_COST };
  },
});

/**
 * Like an opportunity (costs 1 credit, refundable on unlike)
 */
export const likeOpportunity = mutation({
  args: {
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity || !opportunity.isActive) {
      throw new Error("Opportunity not found or inactive");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("opportunityLikes")
      .withIndex("by_user_and_opportunity", (q) =>
        q.eq("userId", args.userId).eq("opportunityId", args.opportunityId)
      )
      .first();

    if (existingLike) {
      throw new Error("You have already liked this opportunity");
    }

    // Check credits
    if (user.credits < LIKE_CREDIT_COST) {
      throw new Error(`Insufficient credits. Need ${LIKE_CREDIT_COST} credit to like.`);
    }

    // Deduct credits
    await ctx.db.patch(args.userId, {
      credits: user.credits - LIKE_CREDIT_COST,
    });

    // Create like
    await ctx.db.insert("opportunityLikes", {
      opportunityId: args.opportunityId,
      userId: args.userId,
    });

    // Log transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -LIKE_CREDIT_COST,
      type: "opportunity_like",
      relatedId: args.opportunityId,
    });

    return { success: true, newCredits: user.credits - LIKE_CREDIT_COST };
  },
});

/**
 * Unlike an opportunity (refunds 1 credit)
 */
export const unlikeOpportunity = mutation({
  args: {
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Find existing like
    const existingLike = await ctx.db
      .query("opportunityLikes")
      .withIndex("by_user_and_opportunity", (q) =>
        q.eq("userId", args.userId).eq("opportunityId", args.opportunityId)
      )
      .first();

    if (!existingLike) {
      throw new Error("You haven't liked this opportunity");
    }

    // Delete like
    await ctx.db.delete(existingLike._id);

    // Refund credit
    await ctx.db.patch(args.userId, {
      credits: user.credits + LIKE_CREDIT_COST,
    });

    // Log refund transaction
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: LIKE_CREDIT_COST,
      type: "opportunity_unlike_refund",
      relatedId: args.opportunityId,
    });

    return { success: true, newCredits: user.credits + LIKE_CREDIT_COST };
  },
});

/**
 * Get comments for an opportunity
 */
export const getOpportunityComments = query({
  args: {
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("opportunityComments")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .collect();

    // Get author info for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            _id: author._id,
            name: author.name,
            profileImage: author.profileImage,
          } : null,
        };
      })
    );

    return commentsWithAuthors;
  },
});

/**
 * Get like count and user's like status for an opportunity
 */
export const getOpportunityLikeStatus = query({
  args: {
    opportunityId: v.id("opportunities"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("opportunityLikes")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();

    let hasLiked = false;
    if (args.userId) {
      hasLiked = likes.some((like) => like.userId === args.userId);
    }

    return {
      likeCount: likes.length,
      hasLiked,
    };
  },
});

/**
 * Like a comment on an opportunity
 */
export const likeOpportunityComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("opportunityComments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.isDeleted) {
      throw new Error("Comment not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("opportunityCommentLikes")
      .withIndex("by_user_and_comment", (q) =>
        q.eq("userId", args.userId).eq("commentId", args.commentId)
      )
      .first();

    if (existingLike) {
      // Unlike - remove like
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, { likes: Math.max(0, comment.likes - 1) });
      return { success: true, liked: false, newLikeCount: Math.max(0, comment.likes - 1) };
    } else {
      // Like - add like
      await ctx.db.insert("opportunityCommentLikes", {
        commentId: args.commentId,
        userId: args.userId,
      });
      await ctx.db.patch(args.commentId, { likes: comment.likes + 1 });
      return { success: true, liked: true, newLikeCount: comment.likes + 1 };
    }
  },
});

/**
 * Delete a comment (soft delete, only by author)
 */
export const deleteOpportunityComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("opportunityComments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== args.userId) {
      throw new Error("Unauthorized: You can only delete your own comments");
    }

    await ctx.db.patch(args.commentId, { isDeleted: true });
    return { success: true };
  },
});
