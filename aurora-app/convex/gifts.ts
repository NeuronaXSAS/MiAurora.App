/**
 * Aurora Premium - Gifts Service
 * 
 * Handles virtual gifts, super chats, and creator earnings.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GIFT_CATALOG, REVENUE_SHARES, ROOM_LIMITS } from "./premiumConfig";

// ============================================
// GIFT QUERIES
// ============================================

/**
 * Get all available gifts
 */
export const getGifts = query({
  args: {},
  handler: async () => {
    return GIFT_CATALOG;
  },
});

/**
 * Get gifts by category
 */
export const getGiftsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return GIFT_CATALOG.filter(g => g.category === args.category);
  },
});

/**
 * Get gift leaderboard for a creator
 */
export const getGiftLeaderboard = query({
  args: {
    creatorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const gifts = await ctx.db
      .query("giftTransactions")
      .withIndex("by_recipient", (q) => q.eq("toUserId", args.creatorId))
      .collect();
    
    // Aggregate by sender
    const senderTotals: Record<string, { senderId: string; totalCredits: number; giftCount: number }> = {};
    
    for (const gift of gifts) {
      const senderId = gift.fromUserId;
      if (!senderTotals[senderId]) {
        senderTotals[senderId] = { senderId, totalCredits: 0, giftCount: 0 };
      }
      senderTotals[senderId].totalCredits += gift.credits;
      senderTotals[senderId].giftCount += 1;
    }
    
    // Sort by total credits descending
    const sorted = Object.values(senderTotals)
      .sort((a, b) => b.totalCredits - a.totalCredits)
      .slice(0, limit);
    
    // Enrich with user info
    const enriched = await Promise.all(
      sorted.map(async (entry, index) => {
        const user = await ctx.db.get(entry.senderId as any);
        const userData = user as { name?: string; profileImage?: string } | null;
        return {
          rank: index + 1,
          userId: entry.senderId,
          name: userData?.name || "Anonymous",
          profileImage: userData?.profileImage,
          totalCredits: entry.totalCredits,
          giftCount: entry.giftCount,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Get creator's total gift earnings
 */
export const getCreatorGiftEarnings = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    const gifts = await ctx.db
      .query("giftTransactions")
      .withIndex("by_recipient", (q) => q.eq("toUserId", args.creatorId))
      .collect();
    
    const totalCredits = gifts.reduce((sum, g) => sum + g.credits, 0);
    const totalEarnings = gifts.reduce((sum, g) => sum + g.creatorEarnings, 0);
    const totalPlatformFee = gifts.reduce((sum, g) => sum + g.platformFee, 0);
    
    return {
      totalGifts: gifts.length,
      totalCredits,
      totalEarnings,
      totalPlatformFee,
      recentGifts: gifts.slice(-10).reverse(),
    };
  },
});

/**
 * Get active super chats for a livestream
 */
export const getActiveSuperChats = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const superChats = await ctx.db
      .query("superChats")
      .withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId))
      .collect();
    
    // Filter to only active (not expired) super chats
    const active = superChats.filter(sc => sc.pinnedUntil > now);
    
    // Enrich with user info
    const enriched = await Promise.all(
      active.map(async (sc) => {
        const user = await ctx.db.get(sc.userId);
        return {
          ...sc,
          user: user ? {
            name: user.name,
            profileImage: user.profileImage,
          } : null,
        };
      })
    );
    
    return enriched;
  },
});

// ============================================
// GIFT MUTATIONS
// ============================================

/**
 * Send a gift to a creator
 */
export const sendGift = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    giftId: v.string(),
    livestreamId: v.optional(v.id("livestreams")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate gift exists
    const gift = GIFT_CATALOG.find(g => g.giftId === args.giftId);
    if (!gift) {
      throw new Error("Invalid gift");
    }
    
    // Check sender has enough credits
    const sender = await ctx.db.get(args.fromUserId);
    if (!sender || sender.credits < gift.credits) {
      throw new Error("Insufficient credits");
    }
    
    // Calculate earnings (85% to creator, 15% platform)
    const creatorEarnings = Math.floor(gift.credits * REVENUE_SHARES.GIFT_CREATOR_SHARE);
    const platformFee = gift.credits - creatorEarnings;
    
    // Deduct from sender
    await ctx.db.patch(args.fromUserId, {
      credits: sender.credits - gift.credits,
    });
    
    // Add to creator
    const creator = await ctx.db.get(args.toUserId);
    if (creator) {
      await ctx.db.patch(args.toUserId, {
        credits: creator.credits + creatorEarnings,
      });
    }
    
    // Record gift transaction
    const giftTxId = await ctx.db.insert("giftTransactions", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      giftId: args.giftId,
      credits: gift.credits,
      creatorEarnings,
      platformFee,
      livestreamId: args.livestreamId,
      message: args.message,
    });
    
    // Log transactions
    await ctx.db.insert("transactions", {
      userId: args.fromUserId,
      amount: -gift.credits,
      type: "gift_sent",
      relatedId: giftTxId,
    });
    
    await ctx.db.insert("transactions", {
      userId: args.toUserId,
      amount: creatorEarnings,
      type: "gift_received",
      relatedId: giftTxId,
    });
    
    // Create notification for creator
    await ctx.db.insert("notifications", {
      userId: args.toUserId,
      type: "tip",
      title: "New gift received!",
      message: `${sender.name} sent you a ${gift.name}${args.message ? `: "${args.message}"` : ""}`,
      isRead: false,
      fromUserId: args.fromUserId,
      relatedId: giftTxId,
    });
    
    return {
      success: true,
      giftId: args.giftId,
      giftName: gift.name,
      credits: gift.credits,
      creatorEarnings,
      animationUrl: gift.animationUrl,
    };
  },
});

/**
 * Send a super chat (pinned message during livestream)
 */
export const sendSuperChat = mutation({
  args: {
    userId: v.id("users"),
    livestreamId: v.id("livestreams"),
    message: v.string(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate minimum credits
    if (args.credits < ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS) {
      throw new Error(`Super Chat requires at least ${ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS} credits`);
    }
    
    // Check user has enough credits
    const user = await ctx.db.get(args.userId);
    if (!user || user.credits < args.credits) {
      throw new Error("Insufficient credits");
    }
    
    // Get livestream to find creator
    const livestream = await ctx.db.get(args.livestreamId);
    if (!livestream) {
      throw new Error("Livestream not found");
    }
    
    // Calculate earnings (85% to creator)
    const creatorEarnings = Math.floor(args.credits * REVENUE_SHARES.GIFT_CREATOR_SHARE);
    
    // Deduct from sender
    await ctx.db.patch(args.userId, {
      credits: user.credits - args.credits,
    });
    
    // Add to creator
    const creator = await ctx.db.get(livestream.hostId);
    if (creator) {
      await ctx.db.patch(livestream.hostId, {
        credits: creator.credits + creatorEarnings,
      });
    }
    
    // Calculate pin duration (60 seconds)
    const pinnedUntil = Date.now() + ROOM_LIMITS.SUPER_CHAT_PIN_DURATION_MS;
    
    // Create super chat
    const superChatId = await ctx.db.insert("superChats", {
      userId: args.userId,
      livestreamId: args.livestreamId,
      message: args.message,
      credits: args.credits,
      pinnedUntil,
      creatorEarnings,
    });
    
    // Log transactions
    await ctx.db.insert("transactions", {
      userId: args.userId,
      amount: -args.credits,
      type: "super_chat_sent",
      relatedId: superChatId,
    });
    
    await ctx.db.insert("transactions", {
      userId: livestream.hostId,
      amount: creatorEarnings,
      type: "super_chat_received",
      relatedId: superChatId,
    });
    
    return {
      success: true,
      superChatId,
      pinnedUntil,
      creatorEarnings,
    };
  },
});

/**
 * Get gifts received during a specific livestream
 */
export const getLivestreamGifts = query({
  args: { livestreamId: v.id("livestreams") },
  handler: async (ctx, args) => {
    const gifts = await ctx.db
      .query("giftTransactions")
      .withIndex("by_livestream", (q) => q.eq("livestreamId", args.livestreamId))
      .collect();
    
    // Enrich with sender info and gift details
    const enriched = await Promise.all(
      gifts.map(async (gift) => {
        const sender = await ctx.db.get(gift.fromUserId);
        const giftInfo = GIFT_CATALOG.find(g => g.giftId === gift.giftId);
        return {
          ...gift,
          sender: sender ? {
            name: sender.name,
            profileImage: sender.profileImage,
          } : null,
          giftInfo,
        };
      })
    );
    
    const totalCredits = gifts.reduce((sum, g) => sum + g.credits, 0);
    const totalEarnings = gifts.reduce((sum, g) => sum + g.creatorEarnings, 0);
    
    return {
      gifts: enriched,
      totalGifts: gifts.length,
      totalCredits,
      totalEarnings,
    };
  },
});
