import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a notification
 */
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("comment"),
      v.literal("upvote"),
      v.literal("verification"),
      v.literal("route_completion"),
      v.literal("opportunity_unlock"),
      v.literal("mention")
    ),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    fromUserId: v.optional(v.id("users")),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      actionUrl: args.actionUrl,
      fromUserId: args.fromUserId,
      relatedId: args.relatedId,
    });

    return notificationId;
  },
});

/**
 * Get user's notifications
 */
export const getUserNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_read", (q) => 
          q.eq("userId", args.userId).eq("isRead", false)
        )
        .order("desc")
        .take(limit);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit);
    }

    // Enrich with sender info
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let fromUser = null;
        if (notification.fromUserId) {
          fromUser = await ctx.db.get(notification.fromUserId);
        }

        return {
          ...notification,
          fromUser: fromUser ? {
            _id: fromUser._id,
            name: fromUser.name,
            profileImage: fromUser.profileImage,
          } : null,
        };
      })
    );

    return enrichedNotifications;
  },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) => 
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    );

    return { count: unreadNotifications.length };
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
