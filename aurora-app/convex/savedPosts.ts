/**
 * Saved Posts - Bookmark functionality for Aurora App
 * 
 * Allows users to save posts for later viewing across all devices.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save a post (bookmark)
 */
export const savePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Check if already saved
    const existing = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      return { success: true, alreadySaved: true };
    }

    // Save the post
    await ctx.db.insert("savedPosts", {
      userId: args.userId,
      postId: args.postId,
    });

    return { success: true, alreadySaved: false };
  },
});

/**
 * Unsave a post (remove bookmark)
 */
export const unsavePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    if (saved) {
      await ctx.db.delete(saved._id);
    }

    return { success: true };
  },
});

/**
 * Toggle save status
 */
export const toggleSave = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    } else {
      await ctx.db.insert("savedPosts", {
        userId: args.userId,
        postId: args.postId,
      });
      return { saved: true };
    }
  },
});

/**
 * Check if a post is saved
 */
export const isPostSaved = query({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const saved = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    return !!saved;
  },
});

/**
 * Get all saved posts for a user
 */
export const getSavedPosts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const savedPosts = await ctx.db
      .query("savedPosts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Fetch full post data with author info
    const postsWithData = await Promise.all(
      savedPosts.map(async (saved) => {
        const post = await ctx.db.get(saved.postId);
        if (!post) return null;

        const author = await ctx.db.get(post.authorId);

        return {
          ...post,
          savedAt: saved._creationTime,
          author: author
            ? {
                _id: author._id,
                name: author.name,
                profileImage: author.profileImage,
                trustScore: author.trustScore,
              }
            : null,
        };
      })
    );

    return postsWithData.filter(Boolean);
  },
});

/**
 * Get saved post IDs for quick lookup
 */
export const getSavedPostIds = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const savedPosts = await ctx.db
      .query("savedPosts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return savedPosts.map((s) => s.postId);
  },
});
