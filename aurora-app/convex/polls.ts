import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a poll post
 */
export const createPoll = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    options: v.array(v.string()),
    lifeDimension: v.union(
      v.literal("professional"),
      v.literal("social"),
      v.literal("daily"),
      v.literal("travel"),
      v.literal("financial")
    ),
    isAnonymous: v.optional(v.boolean()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.options.length < 2 || args.options.length > 6) {
      throw new Error("Polls must have 2-6 options");
    }

    if (args.title.length < 10 || args.title.length > 200) {
      throw new Error("Poll title must be 10-200 characters");
    }

    // Create poll options with vote counts
    const pollOptions = args.options.map(text => ({
      text,
      votes: 0,
    }));

    // Create the poll post
    const postId = await ctx.db.insert("posts", {
      authorId: args.authorId,
      lifeDimension: args.lifeDimension,
      title: args.title,
      description: args.description || "",
      rating: 3, // Default neutral rating for polls
      verificationCount: 0,
      isVerified: false,
      isAnonymous: args.isAnonymous ?? false,
      postType: "poll",
      pollOptions,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      // Add location if provided (text only for polls)
      ...(args.location ? { location: { name: args.location, coordinates: [0, 0] as [number, number] } } : {}),
    });

    // Award credits for creating poll
    await ctx.db.insert("transactions", {
      userId: args.authorId,
      amount: 10,
      type: "post_created",
      relatedId: postId,
    });

    // Update user credits
    const user = await ctx.db.get(args.authorId);
    if (user) {
      await ctx.db.patch(args.authorId, {
        credits: user.credits + 10,
      });
    }

    return { success: true, postId };
  },
});

/**
 * Vote on a poll
 */
export const votePoll = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    optionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Poll not found");
    }

    if (post.postType !== "poll" || !post.pollOptions) {
      throw new Error("This post is not a poll");
    }

    if (args.optionIndex < 0 || args.optionIndex >= post.pollOptions.length) {
      throw new Error("Invalid option index");
    }

    // Check if user has already voted
    const existingVote = await ctx.db
      .query("pollVotes")
      .withIndex("by_post_and_user", (q) => 
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();

    if (existingVote) {
      // Update existing vote
      const oldOptionIndex = existingVote.optionIndex;
      
      // Update vote record
      await ctx.db.patch(existingVote._id, {
        optionIndex: args.optionIndex,
      });

      // Update poll counts
      const updatedOptions = post.pollOptions.map((option, index) => {
        if (index === oldOptionIndex) {
          return { ...option, votes: Math.max(0, option.votes - 1) };
        }
        if (index === args.optionIndex) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });

      await ctx.db.patch(args.postId, {
        pollOptions: updatedOptions,
      });
    } else {
      // Create new vote
      await ctx.db.insert("pollVotes", {
        postId: args.postId,
        userId: args.userId,
        optionIndex: args.optionIndex,
      });

      // Update poll counts
      const updatedOptions = post.pollOptions.map((option, index) => {
        if (index === args.optionIndex) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });

      await ctx.db.patch(args.postId, {
        pollOptions: updatedOptions,
      });
    }

    return { success: true };
  },
});

/**
 * Get user's vote for a poll
 */
export const getUserVote = query({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("pollVotes")
      .withIndex("by_post_and_user", (q) => 
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();
    
    return vote?.optionIndex ?? null;
  },
});

/**
 * Delete a poll (author only)
 */
export const deletePoll = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Poll not found");
    }
    
    if (post.authorId !== args.userId) {
      throw new Error("Only the author can delete this poll");
    }
    
    // Delete all votes for this poll
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }
    
    // Delete the poll post
    await ctx.db.delete(args.postId);
    
    return { success: true };
  },
});
