/**
 * Aurora App - Community Truth Score™
 * 
 * Crowdsourced search intelligence - "Rotten Tomatoes for News"
 * Allows women to vote on search result trustworthiness.
 * 
 * PRIVACY: No PII stored. All votes are anonymous using one-way hashes.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Rate limit: 30 votes per session per hour
const RATE_LIMIT_PER_HOUR = 30;

// Minimum votes for confidence levels
const CONFIDENCE_THRESHOLDS = {
  building: 5,
  low: 15,
  medium: 50,
};

/**
 * Record an anonymous vote on a search result
 * 
 * @param urlHash - SHA-256 hash of normalized URL
 * @param sessionHash - One-way hash of anonymous session
 * @param vote - "trust" or "flag"
 * @param hourKey - Current hour key for rate limiting
 */
export const recordVote = mutation({
  args: {
    urlHash: v.string(),
    sessionHash: v.string(),
    vote: v.union(v.literal("trust"), v.literal("flag")),
    hourKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { urlHash, sessionHash, vote, hourKey } = args;

    // 1. Check rate limit
    const rateLimit = await ctx.db
      .query("searchVoteRateLimits")
      .withIndex("by_session_hour", (q) =>
        q.eq("sessionHash", sessionHash).eq("hourKey", hourKey)
      )
      .first();

    if (rateLimit && rateLimit.voteCount >= RATE_LIMIT_PER_HOUR) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    // 2. Check for existing vote (prevent duplicates)
    const existingVote = await ctx.db
      .query("searchVotes")
      .withIndex("by_session_url", (q) =>
        q.eq("sessionHash", sessionHash).eq("urlHash", urlHash)
      )
      .first();

    if (existingVote) {
      // If same vote, ignore. If different, update.
      if (existingVote.vote === vote) {
        return { success: true, action: "unchanged" };
      }
      
      // Update existing vote
      await ctx.db.patch(existingVote._id, { vote, timestamp: Date.now() });
      
      // Update aggregates (swap vote)
      await updateAggregates(ctx, urlHash, existingVote.vote, vote);
      
      return { success: true, action: "updated" };
    }

    // 3. Record new vote
    await ctx.db.insert("searchVotes", {
      urlHash,
      sessionHash,
      vote,
      timestamp: Date.now(),
    });

    // 4. Update rate limit
    if (rateLimit) {
      await ctx.db.patch(rateLimit._id, { voteCount: rateLimit.voteCount + 1 });
    } else {
      await ctx.db.insert("searchVoteRateLimits", {
        sessionHash,
        hourKey,
        voteCount: 1,
      });
    }

    // 5. Update aggregates
    await updateAggregates(ctx, urlHash, null, vote);

    return { success: true, action: "created" };
  },
});

/**
 * Update vote aggregates for a URL
 */
async function updateAggregates(
  ctx: any,
  urlHash: string,
  oldVote: "trust" | "flag" | null,
  newVote: "trust" | "flag"
) {
  const existing = await ctx.db
    .query("searchVoteAggregates")
    .withIndex("by_url", (q: any) => q.eq("urlHash", urlHash))
    .first();

  if (existing) {
    let { trustCount, flagCount, totalVotes } = existing;

    // Remove old vote if updating
    if (oldVote === "trust") trustCount--;
    if (oldVote === "flag") flagCount--;

    // Add new vote
    if (newVote === "trust") trustCount++;
    if (newVote === "flag") flagCount++;

    // Only increment total if new vote (not update)
    if (!oldVote) totalVotes++;

    // Calculate score and confidence
    const communityScore = totalVotes > 0 
      ? Math.round((trustCount / totalVotes) * 100) 
      : 0;
    const confidenceLevel = getConfidenceLevel(totalVotes);

    await ctx.db.patch(existing._id, {
      trustCount,
      flagCount,
      totalVotes,
      communityScore,
      confidenceLevel,
      lastUpdated: Date.now(),
    });
  } else {
    // Create new aggregate
    const trustCount = newVote === "trust" ? 1 : 0;
    const flagCount = newVote === "flag" ? 1 : 0;
    const totalVotes = 1;
    const communityScore = newVote === "trust" ? 100 : 0;

    await ctx.db.insert("searchVoteAggregates", {
      urlHash,
      trustCount,
      flagCount,
      totalVotes,
      communityScore,
      confidenceLevel: "building",
      lastUpdated: Date.now(),
    });
  }
}

/**
 * Get confidence level based on vote count
 */
function getConfidenceLevel(totalVotes: number): "building" | "low" | "medium" | "high" {
  if (totalVotes < CONFIDENCE_THRESHOLDS.building) return "building";
  if (totalVotes < CONFIDENCE_THRESHOLDS.low) return "low";
  if (totalVotes < CONFIDENCE_THRESHOLDS.medium) return "medium";
  return "high";
}

/**
 * Get vote aggregates for a URL
 */
export const getVoteAggregates = query({
  args: {
    urlHash: v.string(),
  },
  handler: async (ctx, args) => {
    const aggregate = await ctx.db
      .query("searchVoteAggregates")
      .withIndex("by_url", (q) => q.eq("urlHash", args.urlHash))
      .first();

    if (!aggregate) {
      return {
        urlHash: args.urlHash,
        trustCount: 0,
        flagCount: 0,
        totalVotes: 0,
        communityScore: null, // null = not enough votes
        confidenceLevel: "building" as const,
        label: "Be the first to vote!",
      };
    }

    // Don't show score if building consensus
    const showScore = aggregate.confidenceLevel !== "building";

    return {
      ...aggregate,
      communityScore: showScore ? aggregate.communityScore : null,
      label: getScoreLabel(aggregate.communityScore, aggregate.confidenceLevel),
    };
  },
});

/**
 * Get vote aggregates for multiple URLs (batch query)
 */
export const getBatchVoteAggregates = query({
  args: {
    urlHashes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Record<string, any> = {};

    for (const urlHash of args.urlHashes) {
      const aggregate = await ctx.db
        .query("searchVoteAggregates")
        .withIndex("by_url", (q) => q.eq("urlHash", urlHash))
        .first();

      if (aggregate) {
        const showScore = aggregate.confidenceLevel !== "building";
        results[urlHash] = {
          ...aggregate,
          communityScore: showScore ? aggregate.communityScore : null,
          label: getScoreLabel(aggregate.communityScore, aggregate.confidenceLevel),
        };
      } else {
        results[urlHash] = {
          urlHash,
          trustCount: 0,
          flagCount: 0,
          totalVotes: 0,
          communityScore: null,
          confidenceLevel: "building",
          label: "Be the first to vote!",
        };
      }
    }

    return results;
  },
});

/**
 * Check if session has voted on a URL
 */
export const hasVoted = query({
  args: {
    urlHash: v.string(),
    sessionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("searchVotes")
      .withIndex("by_session_url", (q) =>
        q.eq("sessionHash", args.sessionHash).eq("urlHash", args.urlHash)
      )
      .first();

    return vote ? vote.vote : null;
  },
});

/**
 * Get trending debates (largest perception gaps)
 */
export const getTrendingDebates = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get aggregates with enough votes
    const aggregates = await ctx.db
      .query("searchVoteAggregates")
      .filter((q) => q.gte(q.field("totalVotes"), CONFIDENCE_THRESHOLDS.building))
      .order("desc")
      .take(100);

    // Sort by engagement (total votes) and return top N
    return aggregates
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, limit);
  },
});

/**
 * Get human-readable label for score
 */
function getScoreLabel(score: number, confidence: string): string {
  if (confidence === "building") {
    return "Building consensus...";
  }

  if (score >= 80) return "Highly trusted by sisters 💜";
  if (score >= 60) return "Generally trusted";
  if (score >= 40) return "Mixed opinions";
  if (score >= 20) return "Some concerns raised";
  return "Community flagged ⚠️";
}
