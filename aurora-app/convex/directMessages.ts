import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Send a direct message
 */
export const send = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    media: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("video")),
      storageId: v.id("_storage"),
      url: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    // Validate content
    if (!args.content.trim() && (!args.media || args.media.length === 0)) {
      throw new Error("Message must have content or media");
    }

    if (args.content.length > 2000) {
      throw new Error("Message too long (max 2000 characters)");
    }

    // Create message
    const messageId = await ctx.db.insert("directMessages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      isRead: false,
      media: args.media,
    });

    // Create notification for receiver
    const sender = await ctx.db.get(args.senderId);
    if (sender) {
      await ctx.db.insert("notifications", {
        userId: args.receiverId,
        type: "message",
        title: "New message",
        message: `${sender.name} sent you a message`,
        isRead: false,
        actionUrl: `/messages/${args.senderId}`,
        fromUserId: args.senderId,
        relatedId: messageId,
      });
    }

    return { success: true, messageId };
  },
});

/**
 * Get conversation between two users
 */
export const getConversation = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get all messages between the two users
    const messages = await ctx.db
      .query("directMessages")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), args.userId),
            q.eq(q.field("receiverId"), args.otherUserId)
          ),
          q.and(
            q.eq(q.field("senderId"), args.otherUserId),
            q.eq(q.field("receiverId"), args.userId)
          )
        )
      )
      .order("desc")
      .take(limit);

    // Enrich with sender info
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          sender: sender ? {
            name: sender.name,
            profileImage: sender.profileImage,
          } : null,
        };
      })
    );

    return enrichedMessages.reverse(); // Oldest first
  },
});

/**
 * Get list of conversations for a user
 */
export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all messages where user is sender or receiver
    const sentMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();

    const receivedMessages = await ctx.db
      .query("directMessages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();

    // Combine and group by conversation partner
    const allMessages = [...sentMessages, ...receivedMessages];
    const conversationMap = new Map<string, any>();

    for (const msg of allMessages) {
      const partnerId = msg.senderId === args.userId ? msg.receiverId : msg.senderId;
      
      if (!conversationMap.has(partnerId) || 
          msg._creationTime > conversationMap.get(partnerId)._creationTime) {
        conversationMap.set(partnerId, msg);
      }
    }

    // Enrich with partner info and unread count
    const conversations = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([partnerId, lastMessage]) => {
        const partner = await ctx.db.get(partnerId as Id<"users">);
        
        // Count unread messages from this partner
        const unreadCount = receivedMessages.filter(
          (m) => m.senderId === partnerId && !m.isRead
        ).length;

        return {
          partnerId,
          partner: partner && "name" in partner ? {
            name: partner.name,
            profileImage: partner.profileImage,
            trustScore: partner.trustScore,
          } : null,
          lastMessage: {
            content: lastMessage.content,
            timestamp: lastMessage._creationTime,
            isFromMe: lastMessage.senderId === args.userId,
          },
          unreadCount,
        };
      })
    );

    // Sort by most recent message
    return conversations.sort((a, b) => 
      b.lastMessage.timestamp - a.lastMessage.timestamp
    );
  },
});

/**
 * Mark messages as read
 */
export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all unread messages from otherUserId to userId
    const unreadMessages = await ctx.db
      .query("directMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), args.otherUserId),
          q.eq(q.field("receiverId"), args.userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    // Mark all as read
    for (const msg of unreadMessages) {
      await ctx.db.patch(msg._id, { isRead: true });
    }

    return { success: true, markedCount: unreadMessages.length };
  },
});

/**
 * Delete a message (soft delete by clearing content)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("directMessages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Only sender can delete
    if (message.senderId !== args.userId) {
      throw new Error("You can only delete your own messages");
    }

    // Soft delete by replacing content
    await ctx.db.patch(args.messageId, {
      content: "[Message deleted]",
      media: undefined,
    });

    return { success: true };
  },
});

/**
 * Search users for starting a conversation
 */
export const searchUsers = query({
  args: {
    query: v.string(),
    currentUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    if (args.query.length < 2) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();
    
    // Filter by name match and exclude current user
    const matchedUsers = allUsers
      .filter((user) => 
        user._id !== args.currentUserId &&
        user.name.toLowerCase().includes(args.query.toLowerCase())
      )
      .slice(0, limit);

    return matchedUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage,
      trustScore: user.trustScore,
      location: user.location,
    }));
  },
});
