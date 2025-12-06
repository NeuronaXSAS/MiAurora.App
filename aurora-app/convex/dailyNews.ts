/**
 * Aurora App - Daily News Panels 💜
 * 
 * "What Sisters Think" - 2 curated news stories daily
 * Community-powered opinion panels for women's perspectives
 * 
 * Strategic value:
 * - Daily engagement driver
 * - Community voice amplification
 * - Women's perspective on current events
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get today's news stories
 */
export const getTodayStories = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    
    const stories = await ctx.db
      .query("dailyNewsStories")
      .withIndex("by_date", (q) => q.eq("date", today))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return stories.sort((a, b) => a.slot - b.slot);
  },
});

/**
 * Get stories for a specific date
 */
export const getStoriesByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("dailyNewsStories")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return stories.sort((a, b) => a.slot - b.slot);
  },
});

/**
 * Vote on a news story (anonymous or logged in)
 */
export const voteOnStory = mutation({
  args: {
    storyId: v.id("dailyNewsStories"),
    sessionHash: v.string(),
    userId: v.optional(v.id("users")),
    vote: v.union(
      v.literal("agree"),
      v.literal("disagree"),
      v.literal("neutral")
    ),
  },
  handler: async (ctx, args) => {
    const { storyId, sessionHash, userId, vote } = args;

    // Check for existing vote
    const existingVote = await ctx.db
      .query("dailyNewsVotes")
      .withIndex("by_session_story", (q) =>
        q.eq("sessionHash", sessionHash).eq("storyId", storyId)
      )
      .first();

    const story = await ctx.db.get(storyId);
    if (!story) throw new Error("Story not found");

    if (existingVote) {
      // Update existing vote
      const oldVote = existingVote.vote;
      if (oldVote === vote) {
        return { success: true, action: "unchanged" };
      }

      await ctx.db.patch(existingVote._id, { vote, timestamp: Date.now() });

      // Update story counts
      const updates: any = {};
      if (oldVote === "agree") updates.agreeCount = story.agreeCount - 1;
      if (oldVote === "disagree") updates.disagreeCount = story.disagreeCount - 1;
      if (oldVote === "neutral") updates.neutralCount = story.neutralCount - 1;
      if (vote === "agree") updates.agreeCount = (updates.agreeCount ?? story.agreeCount) + 1;
      if (vote === "disagree") updates.disagreeCount = (updates.disagreeCount ?? story.disagreeCount) + 1;
      if (vote === "neutral") updates.neutralCount = (updates.neutralCount ?? story.neutralCount) + 1;

      await ctx.db.patch(storyId, updates);

      return { success: true, action: "updated" };
    }

    // Create new vote
    await ctx.db.insert("dailyNewsVotes", {
      storyId,
      sessionHash,
      userId,
      vote,
      timestamp: Date.now(),
    });

    // Update story counts
    const updates: any = { totalVotes: story.totalVotes + 1 };
    if (vote === "agree") updates.agreeCount = story.agreeCount + 1;
    if (vote === "disagree") updates.disagreeCount = story.disagreeCount + 1;
    if (vote === "neutral") updates.neutralCount = story.neutralCount + 1;

    await ctx.db.patch(storyId, updates);

    // Award credits if logged in (first vote of the day)
    if (userId) {
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, {
          credits: user.credits + 2,
        });
        await ctx.db.insert("transactions", {
          userId,
          amount: 2,
          type: "daily_news_vote",
          relatedId: storyId,
        });
      }
    }

    return { success: true, action: "created" };
  },
});

/**
 * Get user's vote on a story
 */
export const getUserVote = query({
  args: {
    storyId: v.id("dailyNewsStories"),
    sessionHash: v.string(),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("dailyNewsVotes")
      .withIndex("by_session_story", (q) =>
        q.eq("sessionHash", args.sessionHash).eq("storyId", args.storyId)
      )
      .first();

    return vote?.vote ?? null;
  },
});

/**
 * Add a comment to a news story
 */
export const addComment = mutation({
  args: {
    storyId: v.id("dailyNewsStories"),
    sessionHash: v.string(),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    isAnonymous: v.boolean(),
    parentCommentId: v.optional(v.id("dailyNewsComments")),
  },
  handler: async (ctx, args) => {
    const { storyId, sessionHash, authorId, content, isAnonymous, parentCommentId } = args;

    // Validate content
    if (content.length < 5 || content.length > 500) {
      throw new Error("Comment must be 5-500 characters");
    }

    const story = await ctx.db.get(storyId);
    if (!story) throw new Error("Story not found");

    // Create comment
    const commentId = await ctx.db.insert("dailyNewsComments", {
      storyId,
      authorId,
      sessionHash,
      content,
      isAnonymous,
      upvotes: 0,
      downvotes: 0,
      replyCount: 0,
      parentCommentId,
      isHidden: false,
    });

    // Update story comment count
    await ctx.db.patch(storyId, {
      commentCount: story.commentCount + 1,
    });

    // Update parent reply count if this is a reply
    if (parentCommentId) {
      const parent = await ctx.db.get(parentCommentId);
      if (parent) {
        await ctx.db.patch(parentCommentId, {
          replyCount: parent.replyCount + 1,
        });
      }
    }

    // Award credits if logged in
    if (authorId) {
      const user = await ctx.db.get(authorId);
      if (user) {
        await ctx.db.patch(authorId, {
          credits: user.credits + 3,
        });
        await ctx.db.insert("transactions", {
          userId: authorId,
          amount: 3,
          type: "daily_news_comment",
          relatedId: commentId,
        });
      }
    }

    return { success: true, commentId };
  },
});

/**
 * Get comments for a story
 */
export const getComments = query({
  args: {
    storyId: v.id("dailyNewsStories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const comments = await ctx.db
      .query("dailyNewsComments")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .filter((q) => q.eq(q.field("isHidden"), false))
      .order("desc")
      .take(limit);

    // Enrich with author info
    const enriched = await Promise.all(
      comments.map(async (comment) => {
        let author = null;
        if (comment.authorId && !comment.isAnonymous) {
          const user = await ctx.db.get(comment.authorId);
          if (user) {
            author = {
              name: user.name,
              profileImage: user.profileImage,
              trustScore: user.trustScore,
            };
          }
        }
        return { ...comment, author };
      })
    );

    return enriched;
  },
});

/**
 * Admin: Create a daily news story
 */
export const createStory = mutation({
  args: {
    date: v.string(),
    slot: v.union(v.literal(1), v.literal(2)),
    title: v.string(),
    summary: v.string(),
    sourceUrl: v.string(),
    sourceName: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.union(
      v.literal("safety"),
      v.literal("rights"),
      v.literal("health"),
      v.literal("career"),
      v.literal("finance"),
      v.literal("tech"),
      v.literal("world")
    ),
  },
  handler: async (ctx, args) => {
    // Check if slot is already taken
    const existing = await ctx.db
      .query("dailyNewsStories")
      .withIndex("by_date_slot", (q) =>
        q.eq("date", args.date).eq("slot", args.slot)
      )
      .first();

    if (existing) {
      throw new Error(`Slot ${args.slot} for ${args.date} is already taken`);
    }

    const storyId = await ctx.db.insert("dailyNewsStories", {
      ...args,
      agreeCount: 0,
      disagreeCount: 0,
      neutralCount: 0,
      totalVotes: 0,
      commentCount: 0,
      isActive: true,
    });

    return { success: true, storyId };
  },
});

/**
 * Get recent stories for archive view
 */
export const getRecentStories = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 14; // 7 days * 2 stories

    const stories = await ctx.db
      .query("dailyNewsStories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit);

    return stories;
  },
});

/**
 * Get vote distribution for visualization
 */
export const getVoteDistribution = query({
  args: {
    storyId: v.id("dailyNewsStories"),
  },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.storyId);
    if (!story) return null;

    const total = story.totalVotes || 1;
    return {
      agree: Math.round((story.agreeCount / total) * 100),
      disagree: Math.round((story.disagreeCount / total) * 100),
      neutral: Math.round((story.neutralCount / total) * 100),
      total: story.totalVotes,
    };
  },
});
