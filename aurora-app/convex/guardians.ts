import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Search for users to add as Aurora Guardians
 */
export const searchUsers = query({
  args: {
    userId: v.id("users"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 2) return [];

    // Get all users and filter by name/email
    const allUsers = await ctx.db.query("users").collect();
    
    const searchLower = args.searchTerm.toLowerCase();
    const results = allUsers
      .filter(user => 
        user._id !== args.userId &&
        (user.name.toLowerCase().includes(searchLower) ||
         user.email.toLowerCase().includes(searchLower))
      )
      .slice(0, 10)
      .map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarConfig: user.avatarConfig,
        trustScore: user.trustScore,
      }));

    return results;
  },
});

/**
 * Send guardian request
 */
export const sendGuardianRequest = mutation({
  args: {
    userId: v.id("users"),
    guardianId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if request already exists
    const existing = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("guardianId"), args.guardianId))
      .first();

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("Already connected as guardians");
      }
      if (existing.status === "pending") {
        throw new Error("Request already pending");
      }
    }

    // Create the request
    await ctx.db.insert("auroraGuardians", {
      userId: args.userId,
      guardianId: args.guardianId,
      status: "pending",
      requestedAt: Date.now(),
      message: args.message,
      canSeeLocation: true,
      canReceiveAlerts: true,
      canReceiveCheckins: true,
    });

    // Create notification for the guardian
    const user = await ctx.db.get(args.userId);
    await ctx.db.insert("notifications", {
      userId: args.guardianId,
      type: "accompaniment_request",
      title: "New Guardian Request",
      message: `${user?.name || "Someone"} wants you to be their Aurora Guardian`,
      isRead: false,
      fromUserId: args.userId,
    });

    return { success: true };
  },
});

/**
 * Respond to guardian request
 */
export const respondToRequest = mutation({
  args: {
    requestId: v.id("auroraGuardians"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    if (args.accept) {
      // Accept the request
      await ctx.db.patch(args.requestId, {
        status: "accepted",
        acceptedAt: Date.now(),
      });

      // Create reverse connection (mutual guardianship)
      const existingReverse = await ctx.db
        .query("auroraGuardians")
        .withIndex("by_user", (q) => q.eq("userId", request.guardianId))
        .filter((q) => q.eq(q.field("guardianId"), request.userId))
        .first();

      if (!existingReverse) {
        await ctx.db.insert("auroraGuardians", {
          userId: request.guardianId,
          guardianId: request.userId,
          status: "accepted",
          requestedAt: Date.now(),
          acceptedAt: Date.now(),
          canSeeLocation: true,
          canReceiveAlerts: true,
          canReceiveCheckins: true,
        });
      }

      // Notify the requester
      const guardian = await ctx.db.get(request.guardianId);
      await ctx.db.insert("notifications", {
        userId: request.userId,
        type: "accompaniment_update",
        title: "Guardian Request Accepted!",
        message: `${guardian?.name || "Your guardian"} accepted your request`,
        isRead: false,
        fromUserId: request.guardianId,
      });
    } else {
      // Decline the request
      await ctx.db.patch(args.requestId, {
        status: "declined",
      });
    }

    return { success: true };
  },
});

/**
 * Get user's Aurora Guardians (accepted connections)
 */
export const getMyGuardians = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "accepted")
      )
      .collect();

    const guardians = await Promise.all(
      connections.map(async (conn) => {
        const guardian = await ctx.db.get(conn.guardianId);
        return guardian ? {
          connectionId: conn._id,
          user: {
            _id: guardian._id,
            name: guardian.name,
            email: guardian.email,
            avatarConfig: guardian.avatarConfig,
            trustScore: guardian.trustScore,
          },
          permissions: {
            canSeeLocation: conn.canSeeLocation,
            canReceiveAlerts: conn.canReceiveAlerts,
            canReceiveCheckins: conn.canReceiveCheckins,
          },
          acceptedAt: conn.acceptedAt,
        } : null;
      })
    );

    return guardians.filter(Boolean);
  },
});

/**
 * Get pending guardian requests (received)
 */
export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_guardian_status", (q) => 
        q.eq("guardianId", args.userId).eq("status", "pending")
      )
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        return user ? {
          _id: req._id,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarConfig: user.avatarConfig,
            trustScore: user.trustScore,
          },
          message: req.message,
          requestedAt: req.requestedAt,
        } : null;
      })
    );

    return requestsWithUsers.filter(Boolean);
  },
});

/**
 * Get sent pending guardian requests (to show "pending" status on UI)
 */
export const getSentPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      const requests = await ctx.db
        .query("auroraGuardians")
        .withIndex("by_user_status", (q) => 
          q.eq("userId", args.userId).eq("status", "pending")
        )
        .collect();

      return requests.map(req => ({
        _id: req._id,
        guardianId: req.guardianId,
        requestedAt: req.requestedAt,
      }));
    } catch (error) {
      console.error("Error in getSentPendingRequests:", error);
      return [];
    }
  },
});

/**
 * Remove guardian connection
 */
export const removeGuardian = mutation({
  args: {
    userId: v.id("users"),
    guardianId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Remove both directions
    const conn1 = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("guardianId"), args.guardianId))
      .first();

    const conn2 = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user", (q) => q.eq("userId", args.guardianId))
      .filter((q) => q.eq(q.field("guardianId"), args.userId))
      .first();

    if (conn1) await ctx.db.delete(conn1._id);
    if (conn2) await ctx.db.delete(conn2._id);

    return { success: true };
  },
});

/**
 * Update guardian permissions
 */
export const updatePermissions = mutation({
  args: {
    connectionId: v.id("auroraGuardians"),
    canSeeLocation: v.optional(v.boolean()),
    canReceiveAlerts: v.optional(v.boolean()),
    canReceiveCheckins: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { connectionId, ...permissions } = args;
    const updates: Record<string, boolean> = {};
    
    if (permissions.canSeeLocation !== undefined) {
      updates.canSeeLocation = permissions.canSeeLocation;
    }
    if (permissions.canReceiveAlerts !== undefined) {
      updates.canReceiveAlerts = permissions.canReceiveAlerts;
    }
    if (permissions.canReceiveCheckins !== undefined) {
      updates.canReceiveCheckins = permissions.canReceiveCheckins;
    }

    await ctx.db.patch(connectionId, updates);
    return { success: true };
  },
});

/**
 * Notify guardians about missed check-in
 */
export const notifyGuardiansCheckinMissed = mutation({
  args: {
    userId: v.id("users"),
    checkinId: v.id("safetyCheckins"),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { notified: 0 };

    // Get all guardians who can receive check-in notifications
    const guardianConnections = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "accepted")
      )
      .filter((q) => q.eq(q.field("canReceiveCheckins"), true))
      .collect();

    let notified = 0;
    for (const conn of guardianConnections) {
      // Create guardian notification
      await ctx.db.insert("guardianNotifications", {
        guardianId: conn.guardianId,
        fromUserId: args.userId,
        type: "checkin_missed",
        message: `${user.name} missed their scheduled check-in. Please check on them.`,
        location: args.location,
        isRead: false,
        isActioned: false,
        relatedId: args.checkinId,
      });

      // Also create regular notification
      await ctx.db.insert("notifications", {
        userId: conn.guardianId,
        type: "emergency",
        title: "⚠️ Missed Check-in Alert",
        message: `${user.name} missed their scheduled check-in`,
        isRead: false,
        fromUserId: args.userId,
        relatedId: args.checkinId,
      });

      notified++;
    }

    return { notified };
  },
});

/**
 * Notify guardians about emergency
 */
export const notifyGuardiansEmergency = mutation({
  args: {
    userId: v.id("users"),
    alertId: v.id("emergencyAlerts"),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { notified: 0 };

    // Get all guardians who can receive alerts
    const guardianConnections = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "accepted")
      )
      .filter((q) => q.eq(q.field("canReceiveAlerts"), true))
      .collect();

    let notified = 0;
    for (const conn of guardianConnections) {
      await ctx.db.insert("guardianNotifications", {
        guardianId: conn.guardianId,
        fromUserId: args.userId,
        type: "emergency_alert",
        message: `🚨 EMERGENCY: ${user.name} activated their panic button!`,
        location: args.location,
        isRead: false,
        isActioned: false,
        relatedId: args.alertId,
      });

      await ctx.db.insert("notifications", {
        userId: conn.guardianId,
        type: "emergency",
        title: "🚨 EMERGENCY ALERT",
        message: `${user.name} needs help! Panic button activated.`,
        isRead: false,
        fromUserId: args.userId,
        relatedId: args.alertId,
      });

      notified++;
    }

    return { notified };
  },
});

/**
 * Get guardian notifications
 */
export const getGuardianNotifications = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("guardianNotifications")
      .withIndex("by_guardian", (q) => q.eq("guardianId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    const withUsers = await Promise.all(
      notifications.map(async (notif) => {
        const fromUser = await ctx.db.get(notif.fromUserId);
        return {
          ...notif,
          fromUser: fromUser ? {
            _id: fromUser._id,
            name: fromUser.name,
            avatarConfig: fromUser.avatarConfig,
          } : null,
        };
      })
    );

    return withUsers;
  },
});

/**
 * Mark guardian notification as read/actioned
 */
export const markNotificationActioned = mutation({
  args: {
    notificationId: v.id("guardianNotifications"),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      isActioned: true,
      actionTaken: args.actionTaken,
    });
    return { success: true };
  },
});

/**
 * Get suggested guardians based on mutual connections and activity
 */
export const getSuggestedGuardians = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const currentUser = await ctx.db.get(args.userId);
    if (!currentUser) return [];

    // Get existing guardian connections (to exclude)
    const existingConnections = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const excludeIds = new Set([
      args.userId,
      ...existingConnections.map(c => c.guardianId),
    ]);

    // Get user's matches (sister connections) as potential guardians
    const matchesFrom = await ctx.db
      .query("sisterConnections")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchesTo = await ctx.db
      .query("sisterConnections")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .filter((q) => q.eq(q.field("status"), "matched"))
      .collect();

    const matchedUserIds = new Set<string>();
    matchesFrom.forEach(m => matchedUserIds.add(m.toUserId));
    matchesTo.forEach(m => matchedUserIds.add(m.fromUserId));

    // Get active users with high trust scores
    const activeUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(50);

    // Score and rank potential guardians
    const candidates: Array<{
      user: typeof activeUsers[0];
      score: number;
      mutualConnections: number;
      isMatch: boolean;
    }> = [];

    for (const user of activeUsers) {
      if (excludeIds.has(user._id)) continue;

      let score = 0;
      const isMatch = matchedUserIds.has(user._id);

      // Prioritize matched users (already connected)
      if (isMatch) score += 50;

      // Trust score bonus
      score += (user.trustScore || 0) * 0.5;

      // Activity bonus (has credits = active user)
      if ((user.credits || 0) > 10) score += 10;

      // Same location bonus (if available)
      if (currentUser.location && user.location) {
        if (currentUser.location.includes(user.location.split(",")[0])) {
          score += 20;
        }
      }

      // Count mutual connections
      let mutualConnections = 0;
      const userMatches = await ctx.db
        .query("sisterConnections")
        .withIndex("by_from_user", (q) => q.eq("fromUserId", user._id))
        .filter((q) => q.eq(q.field("status"), "matched"))
        .take(20);
      
      for (const match of userMatches) {
        if (matchedUserIds.has(match.toUserId)) {
          mutualConnections++;
        }
      }
      score += mutualConnections * 5;

      candidates.push({
        user,
        score,
        mutualConnections,
        isMatch,
      });
    }

    // Sort by score and return top candidates
    candidates.sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit).map(c => ({
      _id: c.user._id,
      name: c.user.name,
      email: c.user.email,
      avatarConfig: c.user.avatarConfig,
      trustScore: c.user.trustScore,
      location: c.user.location,
      mutualConnections: c.mutualConnections,
      isMatch: c.isMatch,
    }));
  },
});
