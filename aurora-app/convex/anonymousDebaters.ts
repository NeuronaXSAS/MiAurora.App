import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get or create anonymous debater by session hash
 */
export const getOrCreateDebater = mutation({
  args: {
    sessionHash: v.string(),
    pseudonym: v.string(),
    countryCode: v.string(),
    countryFlag: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if debater exists
    const existing = await ctx.db
      .query("anonymousDebaters")
      .withIndex("by_session", (q) => q.eq("sessionHash", args.sessionHash))
      .first();

    if (existing) {
      // Update last seen
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
      });
      return existing;
    }

    // Create new anonymous debater
    const id = await ctx.db.insert("anonymousDebaters", {
      sessionHash: args.sessionHash,
      pseudonym: args.pseudonym,
      countryCode: args.countryCode,
      countryFlag: args.countryFlag,
      interactionCount: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Get anonymous debater by session
 */
export const getBySession = query({
  args: { sessionHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("anonymousDebaters")
      .withIndex("by_session", (q) => q.eq("sessionHash", args.sessionHash))
      .first();
  },
});

/**
 * Update pseudonym for anonymous debater
 */
export const updatePseudonym = mutation({
  args: {
    sessionHash: v.string(),
    pseudonym: v.string(),
  },
  handler: async (ctx, args) => {
    const debater = await ctx.db
      .query("anonymousDebaters")
      .withIndex("by_session", (q) => q.eq("sessionHash", args.sessionHash))
      .first();

    if (!debater) throw new Error("Debater not found");

    await ctx.db.patch(debater._id, {
      pseudonym: args.pseudonym,
    });

    return { success: true };
  },
});

/**
 * Increment interaction count
 */
export const incrementInteraction = mutation({
  args: { anonymousId: v.id("anonymousDebaters") },
  handler: async (ctx, args) => {
    const debater = await ctx.db.get(args.anonymousId);
    if (!debater) throw new Error("Debater not found");

    await ctx.db.patch(args.anonymousId, {
      interactionCount: debater.interactionCount + 1,
      lastSeen: Date.now(),
    });

    return debater.interactionCount + 1;
  },
});

/**
 * Check if pseudonym is unique in a debate thread
 */
export const isPseudonymUniqueInDebate = query({
  args: {
    debateId: v.id("dailyDebates"),
    pseudonym: v.string(),
    excludeSessionHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all comments in this debate
    const comments = await ctx.db
      .query("debateComments")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();

    // Get anonymous IDs from comments
    const anonymousIds = comments
      .filter((c) => c.authorType === "anonymous" && c.anonymousId)
      .map((c) => c.anonymousId!);

    // Check each anonymous debater
    for (const anonId of anonymousIds) {
      const debater = await ctx.db.get(anonId);
      if (debater && debater.pseudonym.toLowerCase() === args.pseudonym.toLowerCase()) {
        // If it's the same session, allow it
        if (args.excludeSessionHash && debater.sessionHash === args.excludeSessionHash) {
          continue;
        }
        return false;
      }
    }

    return true;
  },
});

/**
 * Migrate anonymous debater to registered user
 */
export const migrateToUser = mutation({
  args: {
    sessionHash: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const debater = await ctx.db
      .query("anonymousDebaters")
      .withIndex("by_session", (q) => q.eq("sessionHash", args.sessionHash))
      .first();

    if (!debater) return { success: false, message: "No anonymous history found" };

    // Mark as migrated
    await ctx.db.patch(debater._id, {
      migratedToUserId: args.userId,
    });

    // Update all their comments to be from the member
    const comments = await ctx.db
      .query("debateComments")
      .withIndex("by_anonymous", (q) => q.eq("anonymousId", debater._id))
      .collect();

    for (const comment of comments) {
      await ctx.db.patch(comment._id, {
        authorType: "member",
        memberId: args.userId,
        anonymousId: undefined,
      });
    }

    // Update all their votes
    const votes = await ctx.db
      .query("debateVotes")
      .withIndex("by_anonymous_debate", (q) => q.eq("anonymousId", debater._id))
      .collect();

    for (const vote of votes) {
      await ctx.db.patch(vote._id, {
        voterType: "member",
        memberId: args.userId,
        anonymousId: undefined,
      });
    }

    return { 
      success: true, 
      migratedComments: comments.length,
      migratedVotes: votes.length,
      pseudonym: debater.pseudonym,
      countryFlag: debater.countryFlag,
    };
  },
});
