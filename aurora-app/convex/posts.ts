import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new post and award credits to the author
 */
export const create = mutation({
  args: {
    authorId: v.id("users"),
    lifeDimension: v.union(
      v.literal("professional"),
      v.literal("social"),
      v.literal("daily"),
      v.literal("travel"),
      v.literal("financial")
    ),
    title: v.string(),
    description: v.string(),
    rating: v.number(),
    location: v.optional(
      v.object({
        name: v.string(),
        coordinates: v.array(v.number()),
      })
    ),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (args.title.length < 10 || args.title.length > 200) {
      throw new Error("Title must be 10-200 characters");
    }
    if (args.description.length < 20 || args.description.length > 2000) {
      throw new Error("Description must be 20-2000 characters");
    }
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Create post with approved status (text-only posts auto-approve for now)
    // Posts with images will be moderated separately
    const postId = await ctx.db.insert("posts", {
      authorId: args.authorId,
      lifeDimension: args.lifeDimension,
      title: args.title,
      description: args.description,
      rating: args.rating,
      location: args.location,
      verificationCount: 0,
      isVerified: false,
      isAnonymous: args.isAnonymous ?? false,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      moderationStatus: 'approved', // Text-only posts auto-approve
    });

    // Trigger async text moderation for title + description
    await ctx.scheduler.runAfter(0, api.posts.moderatePostText, {
      postId,
      title: args.title,
      description: args.description,
    });

    // Award credits to author immediately for text posts
    const user = await ctx.db.get(args.authorId);
    if (user) {
      await ctx.db.patch(args.authorId, {
        credits: user.credits + 10,
      });

      // Log transaction
      await ctx.db.insert("transactions", {
        userId: args.authorId,
        amount: 10,
        type: "post_created",
        relatedId: postId,
      });
    }

    return { success: true, postId };
  },
});

/**
 * Get personalized feed with Aurora Algorithm ranking
 * Combines recency, engagement, trust, and verification for optimal content discovery
 */
export const getFeed = query({
  args: {
    lifeDimension: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("social"),
        v.literal("daily"),
        v.literal("travel"),
        v.literal("financial")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let posts;

    // Filter by life dimension if provided
    if (args.lifeDimension) {
      const dimension = args.lifeDimension;
      posts = await ctx.db
        .query("posts")
        .withIndex("by_dimension", (q) => q.eq("lifeDimension", dimension))
        .order("desc")
        .take(limit * 2); // Get more for ranking
    } else {
      posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit * 2);
    }

    // Enrich posts with author info and calculate Aurora engagement score
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        // Aurora Algorithm: Smart engagement scoring
        const upvotes = post.upvotes || 0;
        const downvotes = post.downvotes || 0;
        const comments = post.commentCount || 0;
        const verifications = post.verificationCount || 0;
        const trustScore = author?.trustScore || 0;
        const ageHours = (Date.now() - post._creationTime) / (1000 * 60 * 60);
        
        // Weighted engagement formula
        const netVotes = upvotes - downvotes;
        const engagementScore = 
          (netVotes * 1.0) +
          (comments * 2.0) +
          (verifications * 3.0) +
          (trustScore * 0.1) +
          (Math.max(0, 48 - ageHours) * 0.5);
        
        return {
          ...post,
          author: post.isAnonymous
            ? { name: "Anonymous", trustScore: 0 }
            : {
                name: author?.name ?? "Unknown",
                trustScore: author?.trustScore ?? 0,
                profileImage: author?.profileImage,
              },
          engagementScore,
        };
      })
    );

    // Sort by Aurora Algorithm score
    return enrichedPosts
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);
  },
});

/**
 * Get posts within map bounds for map visualization
 */
export const getPostsForMap = query({
  args: {
    lifeDimension: v.optional(
      v.union(
        v.literal("professional"),
        v.literal("social"),
        v.literal("daily"),
        v.literal("travel"),
        v.literal("financial")
      )
    ),
  },
  handler: async (ctx, args) => {
    let posts;

    // Filter by life dimension if provided
    if (args.lifeDimension) {
      const dimension = args.lifeDimension; // Type narrowing
      posts = await ctx.db
        .query("posts")
        .withIndex("by_dimension", (q) => q.eq("lifeDimension", dimension))
        .collect();
    } else {
      posts = await ctx.db.query("posts").collect();
    }

    // Filter posts that have location data
    const postsWithLocation = posts.filter((post) => post.location !== undefined);

    return postsWithLocation;
  },
});

/**
 * Get a single post by ID
 */
export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      return null;
    }

    // Get author info
    const author = await ctx.db.get(post.authorId);

    return {
      ...post,
      author: post.isAnonymous
        ? { name: "Anonymous", trustScore: 0 }
        : {
            name: author?.name ?? "Unknown",
            trustScore: author?.trustScore ?? 0,
            profileImage: author?.profileImage,
          },
    };
  },
});

/**
 * Verify a post (increases verification count and awards credits)
 */
export const verify = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user is trying to verify their own post
    if (post.authorId === args.userId) {
      throw new Error("Cannot verify your own post");
    }

    // Check if user has already verified this post
    const existingVerification = await ctx.db
      .query("verifications")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();

    if (existingVerification) {
      throw new Error("You have already verified this post");
    }

    // Create verification record
    await ctx.db.insert("verifications", {
      postId: args.postId,
      userId: args.userId,
    });

    // Update post verification count
    const newVerificationCount = post.verificationCount + 1;
    await ctx.db.patch(args.postId, {
      verificationCount: newVerificationCount,
      isVerified: newVerificationCount >= 5,
    });

    // Award credits to verifying user
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 5,
        trustScore: Math.min(1000, user.trustScore + 1),
      });

      // Log transaction
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 5,
        type: "verification",
        relatedId: args.postId,
      });
    }

    return { success: true, newVerificationCount };
  },
});

/**
 * Check if user has verified a post
 */
export const hasUserVerified = query({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("verifications")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();

    return verification !== null;
  },
});

/**
 * Get user's recent posts
 */
export const getUserRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(args.limit ?? 10);

    return posts;
  },
});

/**
 * Add media to a post
 */
export const addMedia = mutation({
  args: {
    postId: v.id("posts"),
    media: v.array(
      v.object({
        type: v.union(v.literal("image"), v.literal("video")),
        storageId: v.id("_storage"),
        url: v.string(),
        thumbnailUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    const existingMedia = post.media ?? [];
    const newMedia = [...existingMedia, ...args.media];

    // Limit to 5 media files per post
    if (newMedia.length > 5) {
      throw new Error("Maximum 5 media files per post");
    }

    await ctx.db.patch(args.postId, {
      media: newMedia,
    });

    return { success: true };
  },
});

/**
 * Delete a post (only by the author)
 */
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user is the author
    if (post.authorId !== args.userId) {
      throw new Error("You can only delete your own posts");
    }

    // Delete all verifications for this post
    const verifications = await ctx.db
      .query("verifications")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const verification of verifications) {
      await ctx.db.delete(verification._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);

    return { success: true };
  },
});

/**
 * Vote on a post (upvote or downvote)
 */
export const votePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user has already voted
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_user_and_target", (q) =>
        q.eq("userId", args.userId).eq("targetId", args.postId)
      )
      .first();

    if (existingVote) {
      // If same vote type, remove vote (toggle)
      if (existingVote.voteType === args.voteType) {
        await ctx.db.delete(existingVote._id);
        
        // Update post counts
        if (args.voteType === "upvote") {
          await ctx.db.patch(args.postId, {
            upvotes: Math.max(0, (post.upvotes || 0) - 1),
          });
        } else {
          await ctx.db.patch(args.postId, {
            downvotes: Math.max(0, (post.downvotes || 0) - 1),
          });
        }
      } else {
        // Change vote type
        await ctx.db.patch(existingVote._id, {
          voteType: args.voteType,
        });
        
        // Update post counts
        if (args.voteType === "upvote") {
          await ctx.db.patch(args.postId, {
            upvotes: (post.upvotes || 0) + 1,
            downvotes: Math.max(0, (post.downvotes || 0) - 1),
          });
        } else {
          await ctx.db.patch(args.postId, {
            upvotes: Math.max(0, (post.upvotes || 0) - 1),
            downvotes: (post.downvotes || 0) + 1,
          });
        }
      }
    } else {
      // Create new vote
      await ctx.db.insert("votes", {
        userId: args.userId,
        targetId: args.postId,
        targetType: "post",
        voteType: args.voteType,
      });
      
      // Update post counts
      if (args.voteType === "upvote") {
        await ctx.db.patch(args.postId, {
          upvotes: (post.upvotes || 0) + 1,
        });
      } else {
        await ctx.db.patch(args.postId, {
          downvotes: (post.downvotes || 0) + 1,
        });
      }
    }

    return { success: true };
  },
});


/**
 * Moderate post text content
 * Called asynchronously after post creation
 */
import { action as defineAction } from "./_generated/server";
import { api } from "./_generated/api";

export const moderatePostText = defineAction({
  args: {
    postId: v.id("posts"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable moderation when system is fully integrated
    return { success: true, flagged: false };
    /*
    try {
      // Screen combined title + description
      const combinedText = `Title: ${args.title}\n\nDescription: ${args.description}`;
      
      const result = await ctx.runAction(api.actions.moderation.screenContent, {
        contentType: 'text',
        content: combinedText,
        metadata: {
          contentId: args.postId,
          platform: 'posts',
        },
      });

      // If flagged, update post and add to moderation queue
      if (result.flagged && result.score >= 70) {
        // High severity - flag the post
        await ctx.runMutation(api.posts.updatePostModeration, {
          postId: args.postId,
          moderationScore: result.score,
          moderationReason: result.reason,
          moderationStatus: 'flagged',
        });

        // Add to moderation queue
        const post = await ctx.runQuery(api.posts.getPost, { postId: args.postId });
        if (post) {
          await ctx.runMutation(api.moderation.addToModerationQueue, {
            contentType: 'post',
            contentId: args.postId,
            authorId: post.authorId,
            flagged: true,
            score: result.score,
            reason: result.reason,
            categories: result.categories,
            confidence: result.confidence,
            contentPreview: `${args.title.substring(0, 100)}...`,
          });
        }
      } else {
        // Low severity or clean - just log the score
        await ctx.runMutation(api.posts.updatePostModeration, {
          postId: args.postId,
          moderationScore: result.score,
          moderationReason: result.reason,
          moderationStatus: 'approved',
        });
      }

      return { success: true, flagged: result.flagged };
    } catch (error) {
      console.error('Post moderation error:', error);
      return { success: false, error: 'Moderation failed' };
    }
    */
  },
});

/**
 * Update post moderation results
 */
export const updatePostModeration = mutation({
  args: {
    postId: v.id("posts"),
    moderationScore: v.number(),
    moderationReason: v.string(),
    moderationStatus: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('flagged')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      moderationScore: args.moderationScore,
      moderationReason: args.moderationReason,
      moderationStatus: args.moderationStatus,
    });
  },
});


