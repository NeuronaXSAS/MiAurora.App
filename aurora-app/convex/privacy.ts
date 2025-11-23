/**
 * Privacy Controls and Data Management
 * GDPR/CCPA compliance features
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
// import { getAuthUserId } from '@convex-dev/auth/server';

// Helper to get authenticated user ID
async function getAuthUserId(ctx: any): Promise<any | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  
  const user = await ctx.db
    .query('users')
    .withIndex('by_workos_id', (q: any) => q.eq('workosId', identity.subject))
    .first();
  
  return user?._id || null;
}

/**
 * Get user's privacy settings
 */
export const getPrivacySettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || !('privacySettings' in user)) return null;

    return {
      dataSharing: user.privacySettings?.dataSharing ?? true,
      analyticsTracking: user.privacySettings?.analyticsTracking ?? true,
      personalizedAds: user.privacySettings?.personalizedAds ?? false,
      locationSharing: user.privacySettings?.locationSharing ?? true,
      profileVisibility: user.privacySettings?.profileVisibility ?? 'public',
      messagePrivacy: user.privacySettings?.messagePrivacy ?? 'everyone',
      activityStatus: user.privacySettings?.activityStatus ?? true,
    };
  },
});

/**
 * Update privacy settings
 */
export const updatePrivacySettings = mutation({
  args: {
    dataSharing: v.optional(v.boolean()),
    analyticsTracking: v.optional(v.boolean()),
    personalizedAds: v.optional(v.boolean()),
    locationSharing: v.optional(v.boolean()),
    profileVisibility: v.optional(v.union(v.literal('public'), v.literal('private'), v.literal('friends'))),
    messagePrivacy: v.optional(v.union(v.literal('everyone'), v.literal('friends'), v.literal('none'))),
    activityStatus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || !('privacySettings' in user)) throw new Error('User not found');

    const currentSettings = user.privacySettings || {
      dataSharing: true,
      analyticsTracking: true,
      personalizedAds: false,
      locationSharing: true,
      profileVisibility: 'public' as const,
      messagePrivacy: 'everyone' as const,
      activityStatus: true,
    };

    await ctx.db.patch(userId, {
      privacySettings: {
        ...currentSettings,
        ...args,
      },
    });

    return { success: true };
  },
});

/**
 * Request data export (GDPR Right to Access)
 */
export const requestDataExport = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Collect all user data
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorId', userId))
      .collect();

    const routes = await ctx.db
      .query('routes')
      .withIndex('by_creator', (q) => q.eq('creatorId', userId))
      .collect();

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_author', (q) => q.eq('authorId', userId))
      .collect();

    const votes = await ctx.db
      .query('votes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const opportunities = await ctx.db
      .query('opportunities')
      .withIndex('by_creator', (q) => q.eq('creatorId', userId))
      .collect();

    const messages = await ctx.db
      .query('directMessages')
      .withIndex('by_sender', (q) => q.eq('senderId', userId))
      .collect();

    const receivedMessages = await ctx.db
      .query('directMessages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', userId))
      .collect();

    const emergencyAlerts = await ctx.db
      .query('emergencyAlerts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    // Type guard to ensure we have a user
    if (!('name' in user) || !('email' in user)) {
      throw new Error('Invalid user data');
    }

    // Compile data export
    const dataExport = {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        industry: user.industry,
        bio: user.bio,
        interests: user.interests,
        careerGoals: user.careerGoals,
        credits: user.credits,
        trustScore: user.trustScore,
        createdAt: user._creationTime,
      },
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        description: p.description,
        lifeDimension: p.lifeDimension,
        rating: p.rating,
        location: p.location,
        createdAt: p._creationTime,
      })),
      routes: routes.map(r => ({
        id: r._id,
        distance: r.distance,
        duration: r.duration,
        tags: r.tags,
        rating: r.rating,
        createdAt: r._creationTime,
      })),
      comments: comments.map(c => ({
        id: c._id,
        content: c.content,
        postId: c.postId,
        createdAt: c._creationTime,
      })),
      votes: votes.map(v => ({
        id: v._id,
        targetId: v.targetId,
        voteType: v.voteType,
        createdAt: v._creationTime,
      })),
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        relatedId: t.relatedId,
        createdAt: t._creationTime,
      })),
      opportunities: opportunities.map(o => ({
        id: o._id,
        title: o.title,
        description: o.description,
        category: o.category,
        createdAt: o._creationTime,
      })),
      messagesSent: messages.length,
      messagesReceived: receivedMessages.length,
      emergencyAlerts: emergencyAlerts.length,
      statistics: {
        totalPosts: posts.length,
        totalRoutes: routes.length,
        totalComments: comments.length,
        totalVotes: votes.length,
        totalCreditsEarned: transactions
          .filter(t => t.type === 'earn')
          .reduce((sum, t) => sum + t.amount, 0),
        totalCreditsSpent: transactions
          .filter(t => t.type === 'spend')
          .reduce((sum, t) => sum + t.amount, 0),
      },
    };

    // In production, this would generate a downloadable file
    // For now, return the data directly
    return dataExport;
  },
});

/**
 * Request account deletion (GDPR Right to be Forgotten)
 */
export const requestAccountDeletion = mutation({
  args: {
    confirmation: v.string(), // User must type "DELETE MY ACCOUNT"
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    if (args.confirmation !== 'DELETE MY ACCOUNT') {
      throw new Error('Invalid confirmation');
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Mark account for deletion (actual deletion happens in background job)
    await ctx.db.patch(userId, {
      deletionRequested: true,
      deletionRequestedAt: Date.now(),
      deletionReason: args.reason,
    });

    // In production, this would trigger a background job to:
    // 1. Anonymize all user content (replace authorId with "deleted_user")
    // 2. Delete personal information
    // 3. Remove profile data
    // 4. Keep aggregated analytics (anonymized)

    return {
      success: true,
      message: 'Account deletion requested. Your data will be permanently deleted within 30 days.',
    };
  },
});

/**
 * Cancel account deletion request
 */
export const cancelAccountDeletion = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || !('deletionRequested' in user)) throw new Error('User not found');

    if (!user.deletionRequested) {
      throw new Error('No deletion request found');
    }

    await ctx.db.patch(userId, {
      deletionRequested: false,
      deletionRequestedAt: undefined,
      deletionReason: undefined,
    });

    return { success: true };
  },
});

/**
 * Get data retention policy
 */
export const getDataRetentionPolicy = query({
  args: {},
  handler: async () => {
    return {
      userProfiles: 'Retained until account deletion',
      posts: 'Retained indefinitely (anonymized after account deletion)',
      routes: 'Retained indefinitely (anonymized after account deletion)',
      messages: 'Retained for 1 year, then deleted',
      analytics: 'Aggregated data retained indefinitely (anonymized)',
      emergencyAlerts: 'Retained for 2 years for safety purposes',
      deletedAccounts: 'Personal data deleted within 30 days of request',
    };
  },
});

/**
 * Get consent status
 */
export const getConsentStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || !('consents' in user)) return null;

    return {
      termsAccepted: user.consents?.termsAccepted ?? false,
      termsAcceptedAt: user.consents?.termsAcceptedAt,
      privacyPolicyAccepted: user.consents?.privacyPolicyAccepted ?? false,
      privacyPolicyAcceptedAt: user.consents?.privacyPolicyAcceptedAt,
      marketingConsent: user.consents?.marketingConsent ?? false,
      marketingConsentAt: user.consents?.marketingConsentAt,
      analyticsConsent: user.consents?.analyticsConsent ?? true,
      analyticsConsentAt: user.consents?.analyticsConsentAt,
    };
  },
});

/**
 * Update consent
 */
export const updateConsent = mutation({
  args: {
    termsAccepted: v.optional(v.boolean()),
    privacyPolicyAccepted: v.optional(v.boolean()),
    marketingConsent: v.optional(v.boolean()),
    analyticsConsent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || !('consents' in user)) throw new Error('User not found');

    const now = Date.now();
    const consents: any = user.consents || {};

    if (args.termsAccepted !== undefined) {
      consents.termsAccepted = args.termsAccepted;
      consents.termsAcceptedAt = now;
    }

    if (args.privacyPolicyAccepted !== undefined) {
      consents.privacyPolicyAccepted = args.privacyPolicyAccepted;
      consents.privacyPolicyAcceptedAt = now;
    }

    if (args.marketingConsent !== undefined) {
      consents.marketingConsent = args.marketingConsent;
      consents.marketingConsentAt = now;
    }

    if (args.analyticsConsent !== undefined) {
      consents.analyticsConsent = args.analyticsConsent;
      consents.analyticsConsentAt = now;
    }

    await ctx.db.patch(userId, { consents });

    return { success: true };
  },
});

/**
 * Anonymize user data (for account deletion)
 */
export const anonymizeUserData = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // This would be called by a background job
    // Only admin/system can call this

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    // Anonymize user profile
    await ctx.db.patch(args.userId, {
      name: 'Deleted User',
      email: `deleted_${args.userId}@aurora.app`,
      profileImage: undefined,
      location: undefined,
      industry: undefined,
      bio: undefined,
      interests: undefined,
      careerGoals: undefined,
      isDeleted: true,
    });

    // Anonymize posts (keep content for community value)
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_author', (q) => q.eq('authorId', args.userId))
      .collect();

    for (const post of posts) {
      await ctx.db.patch(post._id, {
        isAnonymous: true,
      });
    }

    // Delete personal messages
    const messages = await ctx.db
      .query('directMessages')
      .withIndex('by_sender', (q) => q.eq('senderId', args.userId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    const receivedMessages = await ctx.db
      .query('directMessages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', args.userId))
      .collect();

    for (const message of receivedMessages) {
      await ctx.db.delete(message._id);
    }

    return { success: true };
  },
});
