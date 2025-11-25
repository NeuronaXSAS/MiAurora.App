/**
 * Content Moderation Functions
 * 
 * Handles moderation queue, admin actions, and content review.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Add content to moderation queue
 */
export const addToModerationQueue = mutation({
  args: {
    contentType: v.union(
      v.literal("reel"),
      v.literal("post"),
      v.literal("comment"),
      v.literal("livestream_snapshot")
    ),
    contentId: v.string(),
    authorId: v.id("users"),
    flagged: v.boolean(),
    score: v.number(),
    reason: v.string(),
    categories: v.array(v.string()),
    confidence: v.number(),
    contentPreview: v.string(),
  },
  handler: async (ctx, args) => {
    const queueId = await ctx.db.insert("moderationQueue", {
      ...args,
      status: "pending",
    });

    return queueId;
  },
});

/**
 * Get moderation queue
 * Admin only
 */
export const getModerationQueue = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("appealed")
    )),
    contentType: v.optional(v.union(
      v.literal("reel"),
      v.literal("post"),
      v.literal("comment"),
      v.literal("livestream_snapshot")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let items;

    if (args.status) {
      items = await ctx.db
        .query("moderationQueue")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      items = await ctx.db
        .query("moderationQueue")
        .order("desc")
        .take(limit);
    }

    if (args.contentType) {
      items = items.filter((item) => item.contentType === args.contentType);
    }

    // Enrich with author info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const author = await ctx.db.get(item.authorId);
        return {
          ...item,
          author: author ? {
            name: author.name,
            email: author.email,
            trustScore: author.trustScore,
          } : null,
        };
      })
    );

    return enrichedItems;
  },
});

/**
 * Approve content
 * Admin action
 */
export const approveContent = mutation({
  args: {
    queueId: v.id("moderationQueue"),
    adminId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const queueItem = await ctx.db.get(args.queueId);
    if (!queueItem) throw new Error("Queue item not found");

    // Update queue status
    await ctx.db.patch(args.queueId, {
      status: "approved",
      reviewedBy: args.adminId,
      reviewedAt: Date.now(),
      adminNotes: args.notes,
    });

    // Update content status
    if (queueItem.contentType === "reel") {
      const reelId = queueItem.contentId as Id<"reels">;
      await ctx.db.patch(reelId, {
        moderationStatus: "approved",
      });
    } else if (queueItem.contentType === "post") {
      const postId = queueItem.contentId as Id<"posts">;
      await ctx.db.patch(postId, {
        moderationStatus: "approved",
      });
    } else if (queueItem.contentType === "comment") {
      const commentId = queueItem.contentId as Id<"comments">;
      await ctx.db.patch(commentId, {
        moderationStatus: "approved",
      });
    }

    return { success: true };
  },
});

/**
 * Reject/Delete content
 * Admin action
 */
export const rejectContent = mutation({
  args: {
    queueId: v.id("moderationQueue"),
    adminId: v.id("users"),
    notes: v.optional(v.string()),
    deleteContent: v.boolean(), // If true, delete the content
  },
  handler: async (ctx, args) => {
    const queueItem = await ctx.db.get(args.queueId);
    if (!queueItem) throw new Error("Queue item not found");

    // Update queue status
    await ctx.db.patch(args.queueId, {
      status: "rejected",
      reviewedBy: args.adminId,
      reviewedAt: Date.now(),
      adminNotes: args.notes,
    });

    // Update or delete content
    if (args.deleteContent) {
      if (queueItem.contentType === "reel") {
        const reelId = queueItem.contentId as Id<"reels">;
        await ctx.db.delete(reelId);
      } else if (queueItem.contentType === "post") {
        const postId = queueItem.contentId as Id<"posts">;
        await ctx.db.delete(postId);
      } else if (queueItem.contentType === "comment") {
        const commentId = queueItem.contentId as Id<"comments">;
        await ctx.db.patch(commentId, {
          isDeleted: true,
        });
      }
    } else {
      // Just flag it
      if (queueItem.contentType === "reel") {
        const reelId = queueItem.contentId as Id<"reels">;
        await ctx.db.patch(reelId, {
          moderationStatus: "rejected",
        });
      } else if (queueItem.contentType === "post") {
        const postId = queueItem.contentId as Id<"posts">;
        await ctx.db.patch(postId, {
          moderationStatus: "flagged",
        });
      } else if (queueItem.contentType === "comment") {
        const commentId = queueItem.contentId as Id<"comments">;
        await ctx.db.patch(commentId, {
          moderationStatus: "flagged",
        });
      }
    }

    return { success: true };
  },
});

/**
 * Ban user
 * Admin action - suspends user account
 */
export const banUser = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
    reason: v.string(),
    duration: v.optional(v.number()), // Days, undefined = permanent
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Mark user as deleted (soft ban)
    await ctx.db.patch(args.userId, {
      isDeleted: true,
      deletionReason: `Banned by admin: ${args.reason}`,
      deletionRequestedAt: Date.now(),
    });

    // TODO: Add ban expiration logic if duration is provided

    return { success: true };
  },
});

/**
 * Get moderation stats
 * Admin dashboard
 */
export const getModerationStats = query({
  args: {},
  handler: async (ctx) => {
    const allQueue = await ctx.db.query("moderationQueue").collect();

    const pending = allQueue.filter((item) => item.status === "pending").length;
    const approved = allQueue.filter((item) => item.status === "approved").length;
    const rejected = allQueue.filter((item) => item.status === "rejected").length;

    const avgScore = allQueue.length > 0
      ? allQueue.reduce((sum, item) => sum + item.score, 0) / allQueue.length
      : 0;

    const categoryCount: Record<string, number> = {};
    allQueue.forEach((item) => {
      item.categories.forEach((cat) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });

    return {
      total: allQueue.length,
      pending,
      approved,
      rejected,
      avgScore: Math.round(avgScore),
      categoryCount,
    };
  },
});
