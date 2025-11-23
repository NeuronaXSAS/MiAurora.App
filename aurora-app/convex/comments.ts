import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a comment on a post
 */
export const create = mutation({
  args: {
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    // Create comment (visible by default, may be hidden by moderation)
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: args.authorId,
      content: args.content,
      parentCommentId: args.parentCommentId,
      upvotes: 0,
      downvotes: 0,
      isDeleted: false,
      moderationStatus: 'approved', // Default to approved
      isHidden: false,
    });

    // TODO: Re-enable moderation when system is fully integrated
    // Trigger async moderation
    // await ctx.scheduler.runAfter(0, api.comments.moderateComment, {
    //   commentId,
    //   content: args.content,
    // });

    // Update post comment count
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        commentCount: (post.commentCount || 0) + 1,
      });

      // Create notification for post author (if not commenting on own post)
      if (post.authorId !== args.authorId) {
        const commenter = await ctx.db.get(args.authorId);
        if (commenter) {
          await ctx.db.insert("notifications", {
            userId: post.authorId,
            type: "comment",
            title: "New comment",
            message: `${commenter.name} commented on your post`,
            isRead: false,
            actionUrl: `/feed`, // Could be more specific with post ID
            fromUserId: args.authorId,
            relatedId: args.postId,
          });
        }
      }
    }

    return commentId;
  },
});

/**
 * Get comments for a post
 */
export const getByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.eq(q.field("isHidden"), false) // Hide toxic comments
        )
      )
      .collect();

    // Fetch author info for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            name: author.name,
            profileImage: author.profileImage,
            trustScore: author.trustScore,
          } : null,
        };
      })
    );

    return commentsWithAuthors;
  },
});

/**
 * Vote on content (post or comment)
 */
export const vote = mutation({
  args: {
    userId: v.id("users"),
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  },
  handler: async (ctx, args) => {
    // Check existing vote
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_user_and_target", (q) => 
        q.eq("userId", args.userId).eq("targetId", args.targetId)
      )
      .first();

    let oldVote: "upvote" | "downvote" | null = existing ? existing.voteType : null;

    // Record or update the vote
    if (existing) {
      if (existing.voteType === args.voteType) {
        // Remove vote if clicking same button
        await ctx.db.delete(existing._id);
        oldVote = args.voteType;
        args.voteType = null as any; // Will be used to decrement
      } else {
        await ctx.db.patch(existing._id, { voteType: args.voteType });
      }
    } else {
      await ctx.db.insert("votes", {
        userId: args.userId,
        targetId: args.targetId,
        targetType: args.targetType,
        voteType: args.voteType,
      });
    }

    // Update counts on the target
    if (args.targetType === "post") {
      const post = await ctx.db.get(args.targetId as any);
      if (post && "upvotes" in post) {
        let upvotes = post.upvotes || 0;
        let downvotes = post.downvotes || 0;

        // Adjust counts based on vote change
        if (oldVote === "upvote") upvotes--;
        if (oldVote === "downvote") downvotes--;
        if (args.voteType === "upvote") upvotes++;
        if (args.voteType === "downvote") downvotes++;

        await ctx.db.patch(args.targetId as any, { 
          upvotes: Math.max(0, upvotes), 
          downvotes: Math.max(0, downvotes) 
        });
      }
    } else {
      const comment = await ctx.db.get(args.targetId as any);
      if (comment && "upvotes" in comment) {
        let upvotes = comment.upvotes || 0;
        let downvotes = comment.downvotes || 0;

        if (oldVote === "upvote") upvotes--;
        if (oldVote === "downvote") downvotes--;
        if (args.voteType === "upvote") upvotes++;
        if (args.voteType === "downvote") downvotes++;

        await ctx.db.patch(args.targetId as any, { 
          upvotes: Math.max(0, upvotes), 
          downvotes: Math.max(0, downvotes) 
        });
      }
    }

    return { success: true };
  },
});

/**
 * Delete comment
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.authorId !== args.userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.commentId, { isDeleted: true });

    // Update post comment count
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, (post.commentCount || 0) - 1),
      });
    }

    return { success: true };
  },
});


/**
 * Get user's vote on a target
 */
export const getUserVote = query({
  args: {
    userId: v.id("users"),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_user_and_target", (q) => 
        q.eq("userId", args.userId).eq("targetId", args.targetId)
      )
      .first();

    return vote ? vote.voteType : null;
  },
});


/**
 * Moderate comment content
 * TODO: Re-enable when moderation system is fully integrated
 * Called asynchronously after comment creation
 * Auto-hides toxic comments
 */
// import { action as defineAction } from "./_generated/server";
// import { api } from "./_generated/api";

// export const moderateComment = defineAction({
//   args: {
//     commentId: v.id("comments"),
//     content: v.string(),
//   },
//   handler: async (ctx, args) => {
//     try {
//       const result = await ctx.runAction(api.actions.moderation.screenContent, {
//         contentType: 'text',
//         content: args.content,
//         metadata: {
//           contentId: args.commentId,
//           platform: 'comments',
//         },
//       });

//       // Auto-hide toxic comments (score >= 60)
//       if (result.flagged && result.score >= 60) {
//         await ctx.runMutation(api.comments.updateCommentModeration, {
//           commentId: args.commentId,
//           moderationScore: result.score,
//           moderationStatus: 'flagged',
//           isHidden: true, // Auto-hide toxic comments
//         });

//         // Add to moderation queue for review
//         const comment = await ctx.runQuery(api.comments.getComment, { commentId: args.commentId });
//         if (comment) {
//           await ctx.runMutation(api.moderation.addToModerationQueue, {
//             contentType: 'comment',
//             contentId: args.commentId,
//             authorId: comment.authorId,
//             flagged: true,
//             score: result.score,
//             reason: result.reason,
//             categories: result.categories,
//             confidence: result.confidence,
//             contentPreview: args.content.substring(0, 200),
//           });
//         }
//       } else {
//         // Clean comment - just log the score
//         await ctx.runMutation(api.comments.updateCommentModeration, {
//           commentId: args.commentId,
//           moderationScore: result.score,
//           moderationStatus: 'approved',
//           isHidden: false,
//         });
//       }

//       return { success: true, flagged: result.flagged };
//     } catch (error) {
//       console.error('Comment moderation error:', error);
//       return { success: false, error: 'Moderation failed' };
//     }
//   },
// });

/**
 * Update comment moderation results
 */
export const updateCommentModeration = mutation({
  args: {
    commentId: v.id("comments"),
    moderationScore: v.number(),
    moderationStatus: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('flagged')
    ),
    isHidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      moderationScore: args.moderationScore,
      moderationStatus: args.moderationStatus,
      isHidden: args.isHidden,
    });
  },
});

/**
 * Get a single comment by ID
 */
export const getComment = query({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return null;

    const author = await ctx.db.get(comment.authorId);
    
    return {
      ...comment,
      author: author ? {
        name: author.name,
        profileImage: author.profileImage,
        trustScore: author.trustScore,
      } : null,
    };
  },
});
