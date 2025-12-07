/**
 * Aurora App - Sister Connections (Matching System)
 * 
 * Tinder-style matching where both users must like each other to connect.
 * Only matched users can send direct messages.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Like a user (swipe right)
 * If the other user has already liked you, it's a match!
 */
export const likeUser = mutation({
  args: {
    userId: v.id("users"),
    likedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already liked
    const existingLike = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.userId).eq("toUserId", args.likedUserId)
      )
      .first();

    if (existingLike) {
      return { success: false, message: "Already liked", isMatch: false };
    }

    // Check if the other user has already liked us
    const reverseConnection = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.likedUserId).eq("toUserId", args.userId)
      )
      .first();

    const isMatch = reverseConnection && reverseConnection.status === "pending";
    const now = Date.now();

    // Create our like
    await ctx.db.insert("sisterConnections", {
      fromUserId: args.userId,
      toUserId: args.likedUserId,
      status: isMatch ? "matched" : "pending",
      createdAt: now,
      matchedAt: isMatch ? now : undefined,
    });

    // If NOT a match yet, notify the liked user that someone liked them
    if (!isMatch) {
      const currentUser = await ctx.db.get(args.userId);
      await ctx.db.insert("notifications", {
        userId: args.likedUserId,
        type: "message",
        title: "Someone likes you! 💜",
        message: `${currentUser?.name || "A sister"} wants to connect with you. Swipe right to match!`,
        isRead: false,
        actionUrl: `/circles?tab=likes`,
        fromUserId: args.userId,
      });
    }

    // If it's a match, update the other connection too
    if (isMatch && reverseConnection) {
      await ctx.db.patch(reverseConnection._id, {
        status: "matched",
        matchedAt: now,
      });

      // Get both users for notifications
      const currentUser = await ctx.db.get(args.userId);
      const likedUser = await ctx.db.get(args.likedUserId);

      // Notify both users about the match!
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "message",
        title: "It's a Match! 💜",
        message: `You and ${likedUser?.name || "a sister"} liked each other! Start chatting now.`,
        isRead: false,
        actionUrl: `/messages/${args.likedUserId}`,
        fromUserId: args.likedUserId,
      });

      await ctx.db.insert("notifications", {
        userId: args.likedUserId,
        type: "message",
        title: "It's a Match! 💜",
        message: `You and ${currentUser?.name || "a sister"} liked each other! Start chatting now.`,
        isRead: false,
        actionUrl: `/messages/${args.userId}`,
        fromUserId: args.userId,
      });

      // Award credits for making a connection
      const user = await ctx.db.get(args.userId);
      if (user) {
        await ctx.db.patch(args.userId, {
          credits: (user.credits || 0) + 5,
        });
      }
      const otherUser = await ctx.db.get(args.likedUserId);
      if (otherUser) {
        await ctx.db.patch(args.likedUserId, {
          credits: (otherUser.credits || 0) + 5,
        });
      }
    }

    return { 
      success: true, 
      isMatch,
      matchedUser: isMatch ? await ctx.db.get(args.likedUserId) : null,
    };
  },
});

/**
 * Skip a user (swipe left)
 * Won't show this user again in suggestions
 */
export const skipUser = mutation({
  args: {
    userId: v.id("users"),
    skippedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already skipped
    const existing = await ctx.db
      .query("sisterSkips")
      .withIndex("by_user_skipped", (q) => 
        q.eq("userId", args.userId).eq("skippedUserId", args.skippedUserId)
      )
      .first();

    if (existing) {
      return { success: true, message: "Already skipped" };
    }

    await ctx.db.insert("sisterSkips", {
      userId: args.userId,
      skippedUserId: args.skippedUserId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get all matches for a user
 * Returns users who have mutually liked each other
 */
export const getMatches = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get connections where this user is involved and status is matched
    const connectionsFrom = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const connectionsTo = await ctx.db
      .query("sisterConnections")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    // Get unique matched user IDs
    const matchedUserIds = new Set<string>();
    connectionsFrom.forEach(c => matchedUserIds.add(c.toUserId));
    connectionsTo.forEach(c => matchedUserIds.add(c.fromUserId));

    // Fetch user details
    const matches = await Promise.all(
      Array.from(matchedUserIds).map(async (id) => {
        const user = await ctx.db.get(id as any);
        if (!user) return null;
        
        // Find the connection to get match date
        const connection = connectionsFrom.find(c => c.toUserId === id) || 
                          connectionsTo.find(c => c.fromUserId === id);
        
        return {
          ...user,
          matchedAt: connection?.matchedAt,
        };
      })
    );

    return matches.filter(Boolean).sort((a, b) => 
      (b?.matchedAt || 0) - (a?.matchedAt || 0)
    );
  },
});

/**
 * Get pending likes (users who liked you but you haven't responded)
 */
export const getPendingLikes = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const pendingConnections = await ctx.db
      .query("sisterConnections")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Fetch user details
    const pendingUsers = await Promise.all(
      pendingConnections.map(async (c) => {
        const user = await ctx.db.get(c.fromUserId);
        return user ? { ...user, likedAt: c.createdAt } : null;
      })
    );

    return pendingUsers.filter(Boolean);
  },
});

/**
 * Check if two users are matched (can chat)
 */
export const areUsersMatched = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check both directions
    const connection1 = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.userId1).eq("toUserId", args.userId2)
      )
      .first();

    const connection2 = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.userId2).eq("toUserId", args.userId1)
      )
      .first();

    // Both must exist and be matched
    const isMatched = 
      (connection1?.status === "matched") || 
      (connection2?.status === "matched");

    return { isMatched };
  },
});

/**
 * Get connection status between two users
 */
export const getConnectionStatus = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if current user liked the other
    const myLike = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.userId).eq("toUserId", args.otherUserId)
      )
      .first();

    // Check if other user liked current user
    const theirLike = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.otherUserId).eq("toUserId", args.userId)
      )
      .first();

    if (myLike?.status === "matched" || theirLike?.status === "matched") {
      return { status: "matched", canChat: true };
    }

    if (myLike?.status === "pending") {
      return { status: "liked", canChat: false };
    }

    if (theirLike?.status === "pending") {
      return { status: "liked_you", canChat: false };
    }

    return { status: "none", canChat: false };
  },
});

/**
 * Get match count for a user
 */
export const getMatchCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connectionsFrom = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const connectionsTo = await ctx.db
      .query("sisterConnections")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    // Count unique matches
    const matchedUserIds = new Set<string>();
    connectionsFrom.forEach(c => matchedUserIds.add(c.toUserId));
    connectionsTo.forEach(c => matchedUserIds.add(c.fromUserId));

    return { count: matchedUserIds.size };
  },
});

/**
 * Unmatch/disconnect from a user
 */
export const unmatch = mutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find and update both connections
    const connection1 = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.userId).eq("toUserId", args.otherUserId)
      )
      .first();

    const connection2 = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.otherUserId).eq("toUserId", args.userId)
      )
      .first();

    if (connection1) {
      await ctx.db.patch(connection1._id, { status: "declined" });
    }
    if (connection2) {
      await ctx.db.patch(connection2._id, { status: "declined" });
    }

    return { success: true };
  },
});
