import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Aurora App - Direct Messages
 * 
 * Competitive messaging features:
 * - Send, edit, delete messages
 * - Reactions (emoji)
 * - Reply to specific messages
 * - Read receipts
 * - Typing indicators (via presence)
 * - Media attachments
 * - Message forwarding
 */

// Reaction emoji options
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🙏", "💜"];

/**
 * Send a direct message
 * IMPORTANT: Only matched users can send messages to each other
 */
export const send = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    media: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("file")),
      storageId: v.id("_storage"),
      url: v.string(),
      fileName: v.optional(v.string()),
      fileSize: v.optional(v.number()),
    }))),
    replyToId: v.optional(v.id("directMessages")), // Reply to a specific message
  },
  handler: async (ctx, args) => {
    // Check if users are matched before allowing message
    const connection1 = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.senderId).eq("toUserId", args.receiverId)
      )
      .first();

    const connection2 = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_to", (q) => 
        q.eq("fromUserId", args.receiverId).eq("toUserId", args.senderId)
      )
      .first();

    const isMatched = connection1?.status === "matched" || connection2?.status === "matched";
    
    if (!isMatched) {
      throw new Error("You can only message users you've matched with. Like each other in Sister Spotlight to connect!");
    }

    // Validate content
    if (!args.content.trim() && (!args.media || args.media.length === 0)) {
      throw new Error("Message must have content or media");
    }

    if (args.content.length > 5000) {
      throw new Error("Message too long (max 5000 characters)");
    }

    // Get reply message if replying
    let replyPreview = undefined;
    if (args.replyToId) {
      const replyMsg = await ctx.db.get(args.replyToId);
      if (replyMsg) {
        replyPreview = {
          messageId: args.replyToId,
          content: replyMsg.content.slice(0, 100),
          senderId: replyMsg.senderId,
        };
      }
    }

    // Create message
    const messageId = await ctx.db.insert("directMessages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      isRead: false,
      media: args.media,
      replyTo: replyPreview,
      reactions: [],
      isEdited: false,
      isDeleted: false,
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
 * Edit a message (within 15 minutes of sending)
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("directMessages"),
    userId: v.id("users"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Only sender can edit
    if (message.senderId !== args.userId) {
      throw new Error("You can only edit your own messages");
    }

    // Check if message is deleted
    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message");
    }

    // Check time limit (15 minutes)
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - message._creationTime > fifteenMinutes) {
      throw new Error("Messages can only be edited within 15 minutes of sending");
    }

    // Validate new content
    if (!args.newContent.trim()) {
      throw new Error("Message content cannot be empty");
    }

    if (args.newContent.length > 5000) {
      throw new Error("Message too long (max 5000 characters)");
    }

    // Update message
    await ctx.db.patch(args.messageId, {
      content: args.newContent,
      isEdited: true,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get conversation between two users
 * Includes all message metadata: reactions, edits, replies, forwards
 */
export const getConversation = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

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

    // Filter out messages hidden by this user
    const visibleMessages = messages.filter(msg => {
      const hiddenBy = msg.hiddenBy || [];
      return !hiddenBy.includes(args.userId);
    });

    // Enrich with sender info and reaction details
    const enrichedMessages = await Promise.all(
      visibleMessages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        
        // Get reaction user names
        const reactionsWithNames = await Promise.all(
          (msg.reactions || []).map(async (r: { userId: Id<"users">; emoji: string; timestamp: number }) => {
            const user = await ctx.db.get(r.userId);
            return {
              ...r,
              userName: (user && "name" in user) ? user.name : "Unknown",
            };
          })
        );

        // Get reply-to sender name if exists
        let replyToSenderName = null;
        if (msg.replyTo?.senderId) {
          const replyToSender = await ctx.db.get(msg.replyTo.senderId);
          replyToSenderName = (replyToSender && "name" in replyToSender) ? replyToSender.name : "Unknown";
        }

        // Type guard for user
        const senderData = sender && "name" in sender ? {
          name: sender.name,
          profileImage: sender.profileImage,
          avatarConfig: (sender as any).avatarConfig,
        } : null;

        return {
          ...msg,
          sender: senderData,
          reactions: reactionsWithNames,
          replyToSenderName,
          // For deleted messages, show placeholder
          displayContent: msg.isDeleted ? "This message was deleted" : msg.content,
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

        // Type guard for user
        const partnerData = partner && "name" in partner ? {
          name: partner.name,
          profileImage: partner.profileImage,
          trustScore: partner.trustScore,
        } : null;

        return {
          partnerId,
          partner: partnerData,
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
 * Delete a message
 * Options: "for_me" (hide from your view) or "for_everyone" (soft delete)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("directMessages"),
    userId: v.id("users"),
    deleteType: v.union(v.literal("for_me"), v.literal("for_everyone")),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    if (args.deleteType === "for_everyone") {
      // Only sender can delete for everyone
      if (message.senderId !== args.userId) {
        throw new Error("You can only delete your own messages for everyone");
      }

      // Soft delete - mark as deleted but keep record
      await ctx.db.patch(args.messageId, {
        isDeleted: true,
        deletedAt: Date.now(),
        content: "",
        media: undefined,
      });
    } else {
      // Delete for me - add to hidden list
      const hiddenBy = message.hiddenBy || [];
      if (!hiddenBy.includes(args.userId)) {
        await ctx.db.patch(args.messageId, {
          hiddenBy: [...hiddenBy, args.userId],
        });
      }
    }

    return { success: true };
  },
});

/**
 * Add reaction to a message
 */
export const addReaction = mutation({
  args: {
    messageId: v.id("directMessages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Validate emoji
    if (!REACTION_EMOJIS.includes(args.emoji)) {
      throw new Error("Invalid reaction emoji");
    }

    // Get current reactions
    const reactions = message.reactions || [];
    
    // Check if user already reacted with this emoji
    const existingIndex = reactions.findIndex(
      (r: { userId: string; emoji: string }) => r.userId === args.userId && r.emoji === args.emoji
    );

    if (existingIndex >= 0) {
      // Remove reaction (toggle off)
      reactions.splice(existingIndex, 1);
    } else {
      // Remove any existing reaction from this user first
      const userReactionIndex = reactions.findIndex(
        (r: { userId: string }) => r.userId === args.userId
      );
      if (userReactionIndex >= 0) {
        reactions.splice(userReactionIndex, 1);
      }
      // Add new reaction
      reactions.push({
        userId: args.userId,
        emoji: args.emoji,
        timestamp: Date.now(),
      });
    }

    await ctx.db.patch(args.messageId, { reactions });

    return { success: true };
  },
});

/**
 * Remove reaction from a message
 */
export const removeReaction = mutation({
  args: {
    messageId: v.id("directMessages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    const reactions = (message.reactions || []).filter(
      (r: { userId: string }) => r.userId !== args.userId
    );

    await ctx.db.patch(args.messageId, { reactions });

    return { success: true };
  },
});

/**
 * Forward a message to another user
 */
export const forwardMessage = mutation({
  args: {
    messageId: v.id("directMessages"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const originalMessage = await ctx.db.get(args.messageId);
    
    if (!originalMessage) {
      throw new Error("Message not found");
    }

    // Create forwarded message
    const newMessageId = await ctx.db.insert("directMessages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: originalMessage.content,
      isRead: false,
      media: originalMessage.media,
      isForwarded: true,
      forwardedFrom: args.messageId,
      reactions: [],
      isEdited: false,
      isDeleted: false,
    });

    // Create notification
    const sender = await ctx.db.get(args.senderId);
    if (sender) {
      await ctx.db.insert("notifications", {
        userId: args.receiverId,
        type: "message",
        title: "Forwarded message",
        message: `${sender.name} forwarded you a message`,
        isRead: false,
        actionUrl: `/messages/${args.senderId}`,
        fromUserId: args.senderId,
        relatedId: newMessageId,
      });
    }

    return { success: true, messageId: newMessageId };
  },
});

/**
 * Copy message content (just returns the content, actual copy is client-side)
 */
export const getMessageContent = query({
  args: {
    messageId: v.id("directMessages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message || message.isDeleted) {
      return null;
    }

    return { content: message.content };
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
