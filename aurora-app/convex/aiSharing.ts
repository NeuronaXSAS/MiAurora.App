import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Share AI conversation as a post
 */
export const shareConversation = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    messageCount: v.number(), // How many recent messages to include
    lifeDimension: v.union(
      v.literal("professional"),
      v.literal("social"),
      v.literal("daily"),
      v.literal("travel"),
      v.literal("financial")
    ),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate
    if (args.title.length < 10 || args.title.length > 200) {
      throw new Error("Title must be 10-200 characters");
    }

    if (args.messageCount < 2 || args.messageCount > 10) {
      throw new Error("Must share 2-10 messages");
    }

    // Get recent messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.messageCount);

    if (messages.length < 2) {
      throw new Error("Not enough messages to share");
    }

    // Reverse to get chronological order
    const conversationMessages = messages.reverse();

    // Format conversation as description
    const description = conversationMessages
      .map((msg) => {
        const role = msg.role === "user" ? "You" : "Aurora AI";
        return `**${role}:** ${msg.content}`;
      })
      .join("\n\n");

    // Create post
    const postId = await ctx.db.insert("posts", {
      authorId: args.userId,
      lifeDimension: args.lifeDimension,
      title: args.title,
      description: description.substring(0, 2000), // Limit to 2000 chars
      rating: 4, // Default good rating for AI chats
      verificationCount: 0,
      isVerified: false,
      isAnonymous: args.isAnonymous ?? false,
      postType: "ai_chat",
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    });

    // Award credits for sharing
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 10,
      });

      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 10,
        type: "post_created",
        relatedId: postId,
      });
    }

    return { success: true, postId };
  },
});

/**
 * Get shareable conversation preview
 */
export const getShareablePreview = query({
  args: {
    userId: v.id("users"),
    messageCount: v.number(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.messageCount);

    return messages.reverse();
  },
});
