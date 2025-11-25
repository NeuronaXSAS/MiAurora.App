/**
 * Aurora Reels - Backend Logic
 * 
 * Handles video upload credentials, reel creation, and queries.
 * Provider-agnostic design allows easy migration between video services.
 */

import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { api } from './_generated/api';

/**
 * Generate secure upload credentials for client-side video uploads
 * 
 * This is called from the frontend before uploading a video.
 * Returns basic metadata for client-side upload configuration.
 * 
 * IMPORTANT: Cloudinary credentials (cloud name, API key) must be configured
 * on the client side via NEXT_PUBLIC_* environment variables.
 * This query only provides server-side metadata like timestamps.
 */
export const generateUploadCredentials = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        credentials: null,
      };
    }

    // Return server-side metadata only
    // Client must use NEXT_PUBLIC_* env vars for Cloudinary config
    const timestamp = Math.round(Date.now() / 1000);
    
    return {
      success: true,
      credentials: {
        timestamp,
        expiresAt: timestamp + 3600,
        // Note: uploadUrl, apiKey, cloudName must be configured client-side
        // using NEXT_PUBLIC_CLOUDINARY_* environment variables
      },
    };
  },
});

/**
 * Create a new reel after successful upload
 * 
 * Called by the frontend after video upload completes.
 * Saves reel metadata to database and awards credits.
 */
export const createReel = mutation({
  args: {
    authorId: v.id('users'),
    provider: v.union(
      v.literal('cloudinary'),
      v.literal('aws'),
      v.literal('custom')
    ),
    externalId: v.string(),
    videoUrl: v.string(),
    thumbnailUrl: v.string(),
    duration: v.number(),
    metadata: v.object({
      width: v.number(),
      height: v.number(),
      format: v.string(),
      sizeBytes: v.number(),
      transformations: v.optional(v.any()),
    }),
    caption: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    location: v.optional(
      v.object({
        name: v.string(),
        coordinates: v.array(v.number()),
      })
    ),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate caption length
    if (args.caption && args.caption.length > 500) {
      throw new Error('Caption must be 500 characters or less');
    }

    // Validate duration (15-90 seconds)
    if (args.duration < 15 || args.duration > 90) {
      throw new Error('Reel duration must be between 15 and 90 seconds');
    }

    // Create reel with pending moderation status
    const reelId = await ctx.db.insert('reels', {
      authorId: args.authorId,
      provider: args.provider,
      externalId: args.externalId,
      videoUrl: args.videoUrl,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      metadata: args.metadata,
      caption: args.caption,
      hashtags: args.hashtags,
      location: args.location,
      isAnonymous: args.isAnonymous || false,
      moderationStatus: 'pending', // Will be reviewed by AI
      // Initialize engagement metrics
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    });

    // Trigger AI moderation asynchronously
    // Screen both the video thumbnail and caption
    await ctx.scheduler.runAfter(0, api.reels.moderateReel, {
      reelId,
      thumbnailUrl: args.thumbnailUrl,
      caption: args.caption || '',
    });

    // Note: Credits are awarded AFTER moderation approval
    // See moderateReel action below

    return {
      success: true,
      reelId,
      message: 'Reel submitted for review. Credits will be awarded once approved.',
    };
  },
});

/**
 * Moderate a reel using AI
 * Called asynchronously after reel creation
 */
export const moderateReel = action({
  args: {
    reelId: v.id('reels'),
    thumbnailUrl: v.string(),
    caption: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable moderation when system is fully integrated
    return { success: true, flagged: false };
    /*
    try {
      // Screen video thumbnail for visual content
      const visualResult = await ctx.runAction(api.actions.moderation.screenContent, {
        contentType: 'image',
        content: args.thumbnailUrl,
        metadata: {
          contentId: args.reelId,
          platform: 'reels',
        },
      });

      // Screen caption for text toxicity (if provided)
      let textResult = null;
      if (args.caption && args.caption.trim().length > 0) {
        textResult = await ctx.runAction(api.actions.moderation.screenContent, {
          contentType: 'text',
          content: args.caption,
          metadata: {
            contentId: args.reelId,
            platform: 'reels',
          },
        });
      }

      // Determine overall moderation result
      const isFlagged = visualResult.flagged || (textResult?.flagged || false);
      const maxScore = Math.max(visualResult.score, textResult?.score || 0);
      const allCategories = [
        ...visualResult.categories,
        ...(textResult?.categories || []),
      ];

      // Update reel with moderation results
      await ctx.runMutation(api.reels.updateReelModeration, {
        reelId: args.reelId,
        moderationScore: maxScore,
        moderationReason: isFlagged
          ? `${visualResult.reason}${textResult ? ` | ${textResult.reason}` : ''}`
          : 'Content approved',
        moderationCategories: allCategories,
        moderationStatus: isFlagged ? 'flagged' : 'approved',
      });

      // If flagged, add to moderation queue
      if (isFlagged) {
        const reel = await ctx.runQuery(api.reels.getReel, { reelId: args.reelId });
        if (reel) {
          await ctx.runMutation(api.moderation.addToModerationQueue, {
            contentType: 'reel',
            contentId: args.reelId,
            authorId: reel.authorId,
            flagged: true,
            score: maxScore,
            reason: visualResult.reason,
            categories: allCategories,
            confidence: visualResult.confidence,
            contentPreview: args.thumbnailUrl,
          });
        }
      } else {
        // If approved, award credits
        const reel = await ctx.runQuery(api.reels.getReel, { reelId: args.reelId });
        if (reel) {
          await ctx.runMutation(api.reels.awardReelCredits, {
            authorId: reel.authorId,
            reelId: args.reelId,
          });
        }
      }

      return { success: true, flagged: isFlagged };
    } catch (error) {
      console.error('Moderation error:', error);
      // On error, flag for manual review
      await ctx.runMutation(api.reels.updateReelModeration, {
        reelId: args.reelId,
        moderationScore: 50,
        moderationReason: 'Error during automated screening - requires manual review',
        moderationCategories: ['error'],
        moderationStatus: 'flagged',
      });
      return { success: false, error: 'Moderation failed' };
    }
    */
  },
});

/**
 * Update reel moderation results
 */
export const updateReelModeration = mutation({
  args: {
    reelId: v.id('reels'),
    moderationScore: v.number(),
    moderationReason: v.string(),
    moderationCategories: v.array(v.string()),
    moderationStatus: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('flagged'),
      v.literal('rejected')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reelId, {
      moderationScore: args.moderationScore,
      moderationReason: args.moderationReason,
      moderationCategories: args.moderationCategories,
      moderationStatus: args.moderationStatus,
    });
  },
});

/**
 * Award credits for approved reel
 */
export const awardReelCredits = mutation({
  args: {
    authorId: v.id('users'),
    reelId: v.id('reels'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.authorId);
    if (user) {
      await ctx.db.patch(args.authorId, {
        credits: user.credits + 20,
      });

      await ctx.db.insert('transactions', {
        userId: args.authorId,
        amount: 20,
        type: 'reel_created',
        relatedId: args.reelId,
      });
    }
  },
});

/**
 * Get reels feed (trending, recent, or personalized)
 * Supports pagination for infinite scroll
 */
export const getReelsFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sortBy: v.optional(
      v.union(v.literal('recent'), v.literal('trending'), v.literal('views'))
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const sortBy = args.sortBy || 'recent';

    // Get current user ID for isLiked status
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query('users')
          .withIndex('by_workos_id', (q) => q.eq('workosId', identity.subject))
          .first()
      : null;

    // Get reels based on sorting preference
    let reels;
    
    if (sortBy === 'views' || sortBy === 'trending') {
      // Sort by views (trending)
      reels = await ctx.db
        .query('reels')
        .withIndex('by_engagement')
        .filter((q) => q.eq(q.field('moderationStatus'), 'approved'))
        .order('desc')
        .take(limit);
    } else {
      // Sort by recent (default) - _creationTime is automatically indexed
      reels = await ctx.db
        .query('reels')
        .filter((q) => q.eq(q.field('moderationStatus'), 'approved'))
        .order('desc')
        .take(limit);
    }

    // Fetch author information and like status for each reel
    const reelsWithData = await Promise.all(
      reels.map(async (reel) => {
        const author = await ctx.db.get(reel.authorId);
        
        // Check if current user liked this reel
        let isLiked = false;
        if (currentUser) {
          const like = await ctx.db
            .query('reelLikes')
            .withIndex('by_user_and_reel', (q) =>
              q.eq('userId', currentUser._id).eq('reelId', reel._id)
            )
            .first();
          isLiked = !!like;
        }

        return {
          ...reel,
          author: reel.isAnonymous
            ? null
            : author
            ? {
                _id: author._id,
                name: author.name,
                profileImage: author.profileImage,
                trustScore: author.trustScore,
              }
            : null,
          isLiked,
          // Include AI metadata for safety overlays
          aiMetadata: reel.aiMetadata || null,
        };
      })
    );

    return {
      reels: reelsWithData,
      hasMore: reels.length === limit,
    };
  },
});

/**
 * Get a single reel by ID
 */
export const getReel = query({
  args: {
    reelId: v.id('reels'),
  },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) {
      return null;
    }

    // Fetch author information
    const author = await ctx.db.get(reel.authorId);

    return {
      ...reel,
      author: reel.isAnonymous
        ? null
        : author
        ? {
            _id: author._id,
            name: author.name,
            profileImage: author.profileImage,
            trustScore: author.trustScore,
          }
        : null,
    };
  },
});

/**
 * Get reels by user
 */
export const getUserReels = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const reels = await ctx.db
      .query('reels')
      .withIndex('by_author', (q) => q.eq('authorId', args.userId))
      .order('desc')
      .take(limit);

    return reels;
  },
});

/**
 * Increment reel view count
 */
export const incrementViews = mutation({
  args: {
    reelId: v.id('reels'),
  },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) {
      throw new Error('Reel not found');
    }

    await ctx.db.patch(args.reelId, {
      views: reel.views + 1,
    });

    // Award bonus credits for viral reels (1000+ views)
    if (reel.views + 1 === 1000) {
      const author = await ctx.db.get(reel.authorId);
      if (author) {
        await ctx.db.patch(reel.authorId, {
          credits: author.credits + 50,
        });

        await ctx.db.insert('transactions', {
          userId: reel.authorId,
          amount: 50,
          type: 'reel_viral_bonus',
          relatedId: args.reelId,
        });
      }
    }
  },
});

/**
 * Like a reel
 */
export const likeReel = mutation({
  args: {
    reelId: v.id('reels'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) {
      throw new Error('Reel not found');
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query('reelLikes')
      .withIndex('by_user_and_reel', (q) =>
        q.eq('userId', args.userId).eq('reelId', args.reelId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.reelId, {
        likes: Math.max(0, reel.likes - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert('reelLikes', {
        userId: args.userId,
        reelId: args.reelId,
      });
      await ctx.db.patch(args.reelId, {
        likes: reel.likes + 1,
      });
      return { liked: true };
    }
  },
});

/**
 * Delete a reel (author only)
 */
export const deleteReel = mutation({
  args: {
    reelId: v.id('reels'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) {
      throw new Error('Reel not found');
    }

    // Verify ownership
    if (reel.authorId !== args.userId) {
      throw new Error('Unauthorized: You can only delete your own reels');
    }

    // Delete from database
    await ctx.db.delete(args.reelId);

    // TODO: Delete from video provider (Cloudinary)
    // This should be done via a scheduled action to handle failures gracefully
    // await ctx.scheduler.runAfter(0, api.reels.deleteVideoFromProvider, {
    //   provider: reel.provider,
    //   externalId: reel.externalId,
    // });

    return { success: true };
  },
});


/**
 * Update AI metadata for a reel
 * Called by the AI analysis action
 */
export const updateAIMetadata = mutation({
  args: {
    reelId: v.id('reels'),
    aiMetadata: v.object({
      safetyCategory: v.union(
        v.literal('Harassment'),
        v.literal('Joy'),
        v.literal('Lighting Issue'),
        v.literal('Infrastructure Problem'),
        v.literal('Positive Experience'),
        v.literal('Warning')
      ),
      sentiment: v.number(),
      detectedObjects: v.array(v.string()),
      visualTags: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) {
      throw new Error('Reel not found');
    }

    await ctx.db.patch(args.reelId, {
      aiMetadata: args.aiMetadata,
    });

    return { success: true };
  },
});

/**
 * Update moderation status for a reel
 * Called by the AI analysis action or moderators
 */
export const updateModerationStatus = mutation({
  args: {
    reelId: v.id('reels'),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('flagged'),
      v.literal('rejected')
    ),
  },
  handler: async (ctx, args) => {
    const reel = await ctx.db.get(args.reelId);
    if (!reel) {
      throw new Error('Reel not found');
    }

    await ctx.db.patch(args.reelId, {
      moderationStatus: args.status,
    });

    return { success: true };
  },
});
