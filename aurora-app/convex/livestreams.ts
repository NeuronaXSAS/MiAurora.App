/**
 * Aurora Live - Livestreaming Backend
 * 
 * Handles livestream creation, management, and viewer tracking.
 * Integrates with Agora.io for real-time video streaming.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

/**
 * Create a new livestream
 * Returns the livestream ID and channel name for Agora
 */
export const createLivestream = mutation({
  args: {
    hostId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    safetyMode: v.optional(v.boolean()),
    isEmergency: v.optional(v.boolean()),
    isPrivate: v.optional(v.boolean()),
    location: v.optional(
      v.object({
        name: v.string(),
        coordinates: v.array(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Validate title
    if (args.title.length < 3 || args.title.length > 100) {
      throw new Error('Title must be between 3 and 100 characters');
    }

    // Generate unique channel name
    const channelName = `aurora_${args.hostId}_${Date.now()}`;

    // Create livestream record
    const livestreamId = await ctx.db.insert('livestreams', {
      hostId: args.hostId,
      channelName,
      title: args.title,
      description: args.description,
      status: 'live',
      viewerCount: 0,
      peakViewerCount: 0,
      totalViews: 0,
      likes: 0,
      safetyMode: args.safetyMode ?? true,
      isEmergency: args.isEmergency ?? false,
      location: args.location,
      startedAt: Date.now(),
      isPrivate: args.isPrivate ?? false,
    });

    // Award credits to host (25 credits for going live)
    const host = await ctx.db.get(args.hostId);
    if (host) {
      await ctx.db.patch(args.hostId, {
        credits: host.credits + 25,
      });

      // Log transaction
      await ctx.db.insert('transactions', {
        userId: args.hostId,
        amount: 25,
        type: 'livestream_started',
        relatedId: livestreamId,
      });
    }

    return {
      success: true,
      livestreamId,
      channelName,
    };
  },
});

/**
 * End a livestream
 */
export const endLivestream = mutation({
  args: {
    livestreamId: v.id('livestreams'),
    hostId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      throw new Error('Livestream not found');
    }

    // Verify ownership
    if (livestream.hostId !== args.hostId) {
      throw new Error('Unauthorized: Only the host can end the livestream');
    }

    // Update livestream status
    await ctx.db.patch(args.livestreamId, {
      status: 'ended',
      endedAt: Date.now(),
    });

    // Mark all active viewers as inactive
    const activeViewers = await ctx.db
      .query('livestreamViewers')
      .withIndex('by_livestream_and_active', (q) =>
        q.eq('livestreamId', args.livestreamId).eq('isActive', true)
      )
      .collect();

    for (const viewer of activeViewers) {
      await ctx.db.patch(viewer._id, {
        isActive: false,
        leftAt: Date.now(),
      });
    }

    // Award bonus credits based on engagement
    const host = await ctx.db.get(args.hostId);
    if (host && livestream.peakViewerCount > 0) {
      let bonusCredits = 0;
      
      // Bonus for viewers
      if (livestream.peakViewerCount >= 100) bonusCredits += 50;
      else if (livestream.peakViewerCount >= 50) bonusCredits += 30;
      else if (livestream.peakViewerCount >= 10) bonusCredits += 15;
      
      // Bonus for likes
      if (livestream.likes >= 50) bonusCredits += 20;
      else if (livestream.likes >= 20) bonusCredits += 10;

      if (bonusCredits > 0) {
        await ctx.db.patch(args.hostId, {
          credits: host.credits + bonusCredits,
        });

        await ctx.db.insert('transactions', {
          userId: args.hostId,
          amount: bonusCredits,
          type: 'livestream_bonus',
          relatedId: args.livestreamId,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Get all active livestreams
 * Only returns streams that are truly live (started within last 2 hours and status is 'live')
 */
export const getLivestreams = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    // Reduced to 2 hours - streams older than this are likely abandoned
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

    // Get current user for isLiked status
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query('users')
          .withIndex('by_workos_id', (q) => q.eq('workosId', identity.subject))
          .first()
      : null;

    // Get active livestreams - only those with status 'live' AND started recently
    const allLivestreams = await ctx.db
      .query('livestreams')
      .withIndex('by_status')
      .filter((q) => q.eq(q.field('status'), 'live'))
      .order('desc')
      .take(limit * 2); // Get more to filter
    
    // Filter out stale/abandoned streams
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const livestreams = allLivestreams.filter(stream => {
      // Must have started recently (within 2 hours)
      if (!stream.startedAt || stream.startedAt < twoHoursAgo) return false;
      
      // If stream is older than 5 minutes with no viewers, it's likely abandoned
      if (stream.startedAt < fiveMinutesAgo && 
          stream.viewerCount === 0 && stream.peakViewerCount === 0) {
        return false;
      }
      
      return true;
    }).slice(0, limit);

    // Fetch host information and like status
    const livestreamsWithData = await Promise.all(
      livestreams.map(async (livestream) => {
        const host = await ctx.db.get(livestream.hostId);
        
        // Check if current user liked this livestream
        let isLiked = false;
        if (currentUser) {
          const like = await ctx.db
            .query('livestreamLikes')
            .withIndex('by_user_and_livestream', (q) =>
              q.eq('userId', currentUser._id).eq('livestreamId', livestream._id)
            )
            .first();
          isLiked = !!like;
        }

        return {
          ...livestream,
          host: host
            ? {
                _id: host._id,
                name: host.name,
                profileImage: host.profileImage,
                trustScore: host.trustScore,
              }
            : null,
          isLiked,
        };
      })
    );

    return livestreamsWithData;
  },
});

/**
 * Get a single livestream by ID
 */
export const getLivestream = query({
  args: {
    livestreamId: v.id('livestreams'),
  },
  handler: async (ctx, args) => {
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      return null;
    }

    const host = await ctx.db.get(livestream.hostId);

    return {
      ...livestream,
      host: host
        ? {
            _id: host._id,
            name: host.name,
            profileImage: host.profileImage,
            trustScore: host.trustScore,
          }
        : null,
    };
  },
});

/**
 * Join a livestream as a viewer
 */
export const joinLivestream = mutation({
  args: {
    livestreamId: v.id('livestreams'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      throw new Error('Livestream not found');
    }

    if (livestream.status !== 'live') {
      throw new Error('Livestream is not active');
    }

    // Check if user already has an active viewer record
    const existingViewer = await ctx.db
      .query('livestreamViewers')
      .withIndex('by_livestream_and_active', (q) =>
        q.eq('livestreamId', args.livestreamId).eq('isActive', true)
      )
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();

    if (existingViewer) {
      // Already viewing
      return { success: true, alreadyViewing: true };
    }

    // Create viewer record
    await ctx.db.insert('livestreamViewers', {
      livestreamId: args.livestreamId,
      userId: args.userId,
      joinedAt: Date.now(),
      isActive: true,
    });

    // Increment viewer count
    const newViewerCount = livestream.viewerCount + 1;
    const newPeakViewerCount = Math.max(livestream.peakViewerCount, newViewerCount);
    const newTotalViews = livestream.totalViews + 1;

    await ctx.db.patch(args.livestreamId, {
      viewerCount: newViewerCount,
      peakViewerCount: newPeakViewerCount,
      totalViews: newTotalViews,
    });

    return { success: true, alreadyViewing: false };
  },
});

/**
 * Leave a livestream
 */
export const leaveLivestream = mutation({
  args: {
    livestreamId: v.id('livestreams'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      throw new Error('Livestream not found');
    }

    // Find active viewer record
    const viewer = await ctx.db
      .query('livestreamViewers')
      .withIndex('by_livestream_and_active', (q) =>
        q.eq('livestreamId', args.livestreamId).eq('isActive', true)
      )
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();

    if (viewer) {
      // Mark as inactive
      await ctx.db.patch(viewer._id, {
        isActive: false,
        leftAt: Date.now(),
      });

      // Decrement viewer count
      await ctx.db.patch(args.livestreamId, {
        viewerCount: Math.max(0, livestream.viewerCount - 1),
      });
    }

    return { success: true };
  },
});

/**
 * Like a livestream
 */
export const likeLivestream = mutation({
  args: {
    livestreamId: v.id('livestreams'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      throw new Error('Livestream not found');
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query('livestreamLikes')
      .withIndex('by_user_and_livestream', (q) =>
        q.eq('userId', args.userId).eq('livestreamId', args.livestreamId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.livestreamId, {
        likes: Math.max(0, livestream.likes - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert('livestreamLikes', {
        userId: args.userId,
        livestreamId: args.livestreamId,
      });
      await ctx.db.patch(args.livestreamId, {
        likes: livestream.likes + 1,
      });
      return { liked: true };
    }
  },
});

/**
 * Get user's livestream history
 */
export const getUserLivestreams = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const livestreams = await ctx.db
      .query('livestreams')
      .withIndex('by_host', (q) => q.eq('hostId', args.userId))
      .order('desc')
      .take(limit);

    return livestreams;
  },
});

/**
 * Delete a livestream (host only)
 * Removes the livestream and all associated data
 */
export const deleteLivestream = mutation({
  args: {
    livestreamId: v.id('livestreams'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      throw new Error('Livestream not found');
    }

    // Verify ownership
    if (livestream.hostId !== args.userId) {
      throw new Error('Unauthorized: You can only delete your own livestreams');
    }

    // If livestream is still live, end it first
    if (livestream.status === 'live') {
      await ctx.db.patch(args.livestreamId, {
        status: 'ended',
        endedAt: Date.now(),
      });
    }

    // Delete all viewer records
    const viewers = await ctx.db
      .query('livestreamViewers')
      .withIndex('by_livestream_and_active', (q) =>
        q.eq('livestreamId', args.livestreamId)
      )
      .collect();

    for (const viewer of viewers) {
      await ctx.db.delete(viewer._id);
    }

    // Delete all likes
    const likes = await ctx.db
      .query('livestreamLikes')
      .filter((q) => q.eq(q.field('livestreamId'), args.livestreamId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Note: Chat messages table may not exist in all deployments
    // If livestreamMessages table exists, delete those too

    // Delete related transactions
    const transactions = await ctx.db
      .query('transactions')
      .filter((q) => q.eq(q.field('relatedId'), args.livestreamId))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Finally, delete the livestream
    await ctx.db.delete(args.livestreamId);

    return { success: true };
  },
});


/**
 * Clean up stale/abandoned livestreams
 * This should be called periodically or when loading the live page
 * - Streams older than 1 hour are considered abandoned
 * - Streams older than 5 minutes with 0 viewers are likely failed attempts
 */
export const cleanupStaleLivestreams = mutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    // Find all livestreams that are still marked as 'live'
    const liveLivestreams = await ctx.db
      .query('livestreams')
      .withIndex('by_status')
      .filter((q) => q.eq(q.field('status'), 'live'))
      .collect();
    
    let cleanedCount = 0;
    
    for (const stream of liveLivestreams) {
      let shouldEnd = false;
      
      // Case 1: Stream is older than 1 hour - definitely abandoned
      if (stream.startedAt && stream.startedAt < oneHourAgo) {
        shouldEnd = true;
      }
      
      // Case 2: Stream is older than 5 minutes with 0 viewers and 0 peak viewers
      // This catches failed broadcast attempts
      if (stream.startedAt && stream.startedAt < fiveMinutesAgo && 
          stream.viewerCount === 0 && stream.peakViewerCount === 0) {
        shouldEnd = true;
      }
      
      if (shouldEnd) {
        // Mark as ended
        await ctx.db.patch(stream._id, {
          status: 'ended',
          endedAt: Date.now(),
        });
        
        // Mark all viewers as inactive
        const activeViewers = await ctx.db
          .query('livestreamViewers')
          .withIndex('by_livestream_and_active', (q) =>
            q.eq('livestreamId', stream._id).eq('isActive', true)
          )
          .collect();

        for (const viewer of activeViewers) {
          await ctx.db.patch(viewer._id, {
            isActive: false,
            leftAt: Date.now(),
          });
        }
        
        cleanedCount++;
      }
    }
    
    return { cleanedCount };
  },
});


/**
 * Force cleanup all stale livestreams (admin function)
 * This will end ALL livestreams that appear to be abandoned
 */
export const forceCleanupAllStale = mutation({
  args: {
    userId: v.optional(v.id('users')), // Optional: only cleanup for specific user
  },
  handler: async (ctx, args) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    // Find all livestreams that are still marked as 'live'
    let query = ctx.db
      .query('livestreams')
      .withIndex('by_status')
      .filter((q) => q.eq(q.field('status'), 'live'));
    
    const liveLivestreams = await query.collect();
    
    let cleanedCount = 0;
    
    for (const stream of liveLivestreams) {
      // If userId specified, only cleanup that user's streams
      if (args.userId && stream.hostId !== args.userId) continue;
      
      // End streams that are older than 5 minutes OR have no activity
      const isOld = stream.startedAt && stream.startedAt < fiveMinutesAgo;
      const noActivity = stream.viewerCount === 0 && stream.peakViewerCount === 0;
      
      if (isOld || noActivity) {
        await ctx.db.patch(stream._id, {
          status: 'ended',
          endedAt: Date.now(),
        });
        
        // Mark all viewers as inactive
        const activeViewers = await ctx.db
          .query('livestreamViewers')
          .withIndex('by_livestream_and_active', (q) =>
            q.eq('livestreamId', stream._id).eq('isActive', true)
          )
          .collect();

        for (const viewer of activeViewers) {
          await ctx.db.patch(viewer._id, {
            isActive: false,
            leftAt: Date.now(),
          });
        }
        
        cleanedCount++;
      }
    }
    
    return { cleanedCount, message: `Cleaned up ${cleanedCount} stale livestreams` };
  },
});
