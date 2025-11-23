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
