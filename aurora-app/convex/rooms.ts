/**
 * Aurora Premium - Rooms Service
 * 
 * Handles Circle rooms (chat, audio, video, forum, broadcast).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ROOM_LIMITS } from "./premiumConfig";

// ============================================
// ROOM QUERIES
// ============================================

/**
 * Get rooms for a Circle
 */
export const getCircleRooms = query({
  args: { circleId: v.id("circles") },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Enrich with participant counts for active rooms
    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query("roomParticipants")
          .withIndex("by_room_active", (q) => 
            q.eq("roomId", room._id).eq("isActive", true)
          )
          .collect();
        
        return {
          ...room,
          participantCount: participants.length,
          hostCount: participants.filter(p => p.role === "host").length,
          speakerCount: participants.filter(p => p.role === "speaker").length,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Get room details
 */
export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    
    const circle = await ctx.db.get(room.circleId);
    const creator = await ctx.db.get(room.createdBy);
    
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_active", (q) => 
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .collect();
    
    // Enrich participants with user info
    const enrichedParticipants = await Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        const userData = user as { name?: string; profileImage?: string } | null;
        return {
          ...p,
          user: userData ? {
            name: userData.name,
            profileImage: userData.profileImage,
          } : null,
        };
      })
    );
    
    const creatorData = creator as { name?: string; profileImage?: string } | null;
    const circleData = circle as { name?: string; category?: string } | null;
    
    return {
      ...room,
      circle: circleData ? { name: circleData.name, category: circleData.category } : null,
      creator: creatorData ? { name: creatorData.name, profileImage: creatorData.profileImage } : null,
      participants: enrichedParticipants,
      participantCount: participants.length,
    };
  },
});

/**
 * Check if user can access a room
 */
export const canAccessRoom = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return { allowed: false, reason: "Room not found" };
    }
    
    // Public rooms are accessible to all
    if (room.visibility === "public") {
      return { allowed: true };
    }
    
    // Check Circle membership
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", room.circleId).eq("userId", args.userId)
      )
      .first();
    
    if (!membership) {
      return { allowed: false, reason: "Not a Circle member" };
    }
    
    // Members-only rooms
    if (room.visibility === "members") {
      return { allowed: true };
    }
    
    // Tier-restricted rooms
    if (room.visibility === "tier" && room.requiredTier) {
      const circleMembership = await ctx.db
        .query("circleMemberships")
        .withIndex("by_circle_user", (q) => 
          q.eq("circleId", room.circleId).eq("userId", args.userId)
        )
        .first();
      
      if (!circleMembership || circleMembership.status !== "active") {
        return { 
          allowed: false, 
          reason: `Requires ${room.requiredTier} tier`,
          requiredTier: room.requiredTier,
        };
      }
      
      // Check tier hierarchy
      const tierOrder = ["free", "supporter", "vip"];
      const userTierIndex = tierOrder.indexOf(circleMembership.tier);
      const requiredTierIndex = tierOrder.indexOf(room.requiredTier);
      
      if (userTierIndex < requiredTierIndex) {
        return {
          allowed: false,
          reason: `Requires ${room.requiredTier} tier`,
          requiredTier: room.requiredTier,
          currentTier: circleMembership.tier,
        };
      }
    }
    
    return { allowed: true };
  },
});

// ============================================
// ROOM MUTATIONS
// ============================================

/**
 * Create a new room
 */
export const createRoom = mutation({
  args: {
    circleId: v.id("circles"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("chat"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("forum"),
      v.literal("broadcast")
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("tier")
    ),
    requiredTier: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is Circle admin
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.createdBy)
      )
      .first();
    
    if (!membership || membership.role !== "admin") {
      throw new Error("Only Circle admins can create rooms");
    }
    
    // Set max participants based on room type
    let maxParticipants: number | undefined;
    if (args.type === "video") {
      maxParticipants = ROOM_LIMITS.VIDEO_MAX_PARTICIPANTS;
    } else if (args.type === "broadcast") {
      maxParticipants = ROOM_LIMITS.BROADCAST_MAX_HOSTS;
    }
    
    // Generate Agora channel for audio/video/broadcast
    let agoraChannel: string | undefined;
    if (["audio", "video", "broadcast"].includes(args.type)) {
      agoraChannel = `aurora_room_${args.circleId}_${Date.now()}`;
    }
    
    // Set default features for chat rooms
    const features = args.type === "chat" ? {
      threads: true,
      reactions: true,
      gifs: true,
      polls: true,
      pins: true,
      mentions: true,
    } : undefined;
    
    const roomId = await ctx.db.insert("rooms", {
      circleId: args.circleId,
      name: args.name,
      description: args.description,
      type: args.type,
      visibility: args.visibility,
      requiredTier: args.requiredTier,
      maxParticipants,
      createdBy: args.createdBy,
      isActive: true,
      agoraChannel,
      features,
    });
    
    return { success: true, roomId, agoraChannel };
  },
});

/**
 * Join a room
 */
export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.optional(v.union(v.literal("host"), v.literal("speaker"), v.literal("listener"))),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || !room.isActive) {
      throw new Error("Room not found or inactive");
    }
    
    // Check if already in room
    const existing = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_active", (q) => 
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (existing) {
      return { success: true, alreadyJoined: true };
    }
    
    // Check participant limits for video rooms
    if (room.type === "video" && room.maxParticipants) {
      const currentCount = await ctx.db
        .query("roomParticipants")
        .withIndex("by_room_active", (q) => 
          q.eq("roomId", args.roomId).eq("isActive", true)
        )
        .collect();
      
      if (currentCount.length >= room.maxParticipants) {
        throw new Error(`Room is full (max ${room.maxParticipants} participants)`);
      }
    }
    
    // Check host limits for broadcast rooms
    if (room.type === "broadcast" && args.role === "host") {
      const currentHosts = await ctx.db
        .query("roomParticipants")
        .withIndex("by_room_active", (q) => 
          q.eq("roomId", args.roomId).eq("isActive", true)
        )
        .filter((q) => q.eq(q.field("role"), "host"))
        .collect();
      
      if (currentHosts.length >= ROOM_LIMITS.BROADCAST_MAX_HOSTS) {
        throw new Error(`Maximum ${ROOM_LIMITS.BROADCAST_MAX_HOSTS} hosts allowed`);
      }
    }
    
    // Default role based on room type
    const role = args.role || (room.type === "broadcast" ? "listener" : "speaker");
    
    await ctx.db.insert("roomParticipants", {
      roomId: args.roomId,
      userId: args.userId,
      role,
      joinedAt: Date.now(),
      isActive: true,
    });
    
    return { success: true, agoraChannel: room.agoraChannel };
  },
});

/**
 * Leave a room
 */
export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_active", (q) => 
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (participant) {
      await ctx.db.patch(participant._id, {
        isActive: false,
        leftAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Send message in a room
 */
export const sendRoomMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("roomMessages")),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || !room.isActive) {
      throw new Error("Room not found or inactive");
    }
    
    if (!["chat", "forum"].includes(room.type)) {
      throw new Error("Messages only allowed in chat and forum rooms");
    }
    
    const messageId = await ctx.db.insert("roomMessages", {
      roomId: args.roomId,
      authorId: args.authorId,
      content: args.content,
      parentId: args.parentId,
    });
    
    return { success: true, messageId };
  },
});

/**
 * Get room messages
 */
export const getRoomMessages = query({
  args: {
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const messages = await ctx.db
      .query("roomMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(limit);
    
    // Enrich with author info
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        const authorData = author as { name?: string; profileImage?: string; avatarConfig?: any } | null;
        return {
          ...msg,
          author: authorData ? {
            name: authorData.name,
            profileImage: authorData.profileImage,
            avatarConfig: authorData.avatarConfig,
          } : null,
        };
      })
    );
    
    return enriched.reverse(); // Return in chronological order
  },
});

/**
 * Pin/unpin a message
 */
export const togglePinMessage = mutation({
  args: {
    messageId: v.id("roomMessages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    
    const room = await ctx.db.get(message.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    
    // Check if user is Circle admin
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", room.circleId).eq("userId", args.userId)
      )
      .first();
    
    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can pin messages");
    }
    
    await ctx.db.patch(args.messageId, {
      isPinned: !message.isPinned,
    });
    
    return { success: true, isPinned: !message.isPinned };
  },
});

/**
 * Delete a room
 */
export const deleteRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    
    // Check if user is Circle admin
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", room.circleId).eq("userId", args.userId)
      )
      .first();
    
    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can delete rooms");
    }
    
    // Soft delete
    await ctx.db.patch(args.roomId, { isActive: false });
    
    // Mark all participants as inactive
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_active", (q) => 
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .collect();
    
    for (const p of participants) {
      await ctx.db.patch(p._id, { isActive: false, leftAt: Date.now() });
    }
    
    return { success: true };
  },
});
