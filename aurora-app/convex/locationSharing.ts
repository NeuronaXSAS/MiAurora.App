import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Start sharing location with Aurora Guardians
 */
export const startLocationShare = mutation({
  args: {
    userId: v.id("users"),
    destination: v.optional(v.string()),
    estimatedArrival: v.optional(v.number()),
    guardianIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    // Get guardians to share with
    let sharedWith: typeof args.guardianIds = args.guardianIds;
    
    if (!sharedWith || sharedWith.length === 0) {
      // Default to all guardians who can see location
      const guardianConnections = await ctx.db
        .query("auroraGuardians")
        .withIndex("by_user_status", (q) => 
          q.eq("userId", args.userId).eq("status", "accepted")
        )
        .filter((q) => q.eq(q.field("canSeeLocation"), true))
        .collect();
      
      sharedWith = guardianConnections.map(c => c.guardianId);
    }

    if (sharedWith.length === 0) {
      throw new Error("No guardians to share location with");
    }

    // Create location share session
    const sessionId = await ctx.db.insert("locationShares", {
      userId: args.userId,
      sharedWith,
      destination: args.destination,
      estimatedArrival: args.estimatedArrival,
      status: "active",
      startedAt: Date.now(),
    });

    // Notify guardians
    const user = await ctx.db.get(args.userId);
    for (const guardianId of sharedWith) {
      await ctx.db.insert("guardianNotifications", {
        guardianId,
        fromUserId: args.userId,
        type: "location_share",
        message: `${user?.name || "Someone"} started sharing their location with you${args.destination ? ` - heading to ${args.destination}` : ""}`,
        isRead: false,
        isActioned: false,
        relatedId: sessionId,
      });

      await ctx.db.insert("notifications", {
        userId: guardianId,
        type: "accompaniment_request",
        title: "📍 Location Sharing Started",
        message: `${user?.name || "Someone"} is sharing their location with you`,
        isRead: false,
        fromUserId: args.userId,
        relatedId: sessionId,
      });
    }

    return { sessionId, guardiansNotified: sharedWith.length };
  },
});

/**
 * Update current location during sharing
 */
export const updateLocation = mutation({
  args: {
    sessionId: v.id("locationShares"),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "active") {
      throw new Error("Session not found or inactive");
    }

    const now = Date.now();
    const newLocation = {
      ...args.location,
      timestamp: now,
    };

    // Add to history (keep last 50 points)
    const history = session.locationHistory || [];
    history.push({ lat: args.location.lat, lng: args.location.lng, timestamp: now });
    if (history.length > 50) history.shift();

    await ctx.db.patch(args.sessionId, {
      lastLocation: newLocation,
      locationHistory: history,
    });

    return { success: true };
  },
});

/**
 * End location sharing (arrived safely)
 */
export const endLocationShare = mutation({
  args: {
    sessionId: v.id("locationShares"),
    status: v.optional(v.union(
      v.literal("arrived"),
      v.literal("cancelled"),
      v.literal("emergency")
    )),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const finalStatus = args.status || "arrived";
    
    await ctx.db.patch(args.sessionId, {
      status: finalStatus,
      endedAt: Date.now(),
    });

    // Notify guardians
    const user = await ctx.db.get(session.userId);
    const notificationType = finalStatus === "arrived" ? "safe_arrival" : 
                            finalStatus === "emergency" ? "emergency_alert" : "location_share";
    
    const message = finalStatus === "arrived" 
      ? `${user?.name || "Someone"} arrived safely at their destination`
      : finalStatus === "emergency"
      ? `🚨 ${user?.name || "Someone"} triggered an emergency during their journey!`
      : `${user?.name || "Someone"} stopped sharing their location`;

    for (const guardianId of session.sharedWith) {
      await ctx.db.insert("guardianNotifications", {
        guardianId,
        fromUserId: session.userId,
        type: notificationType,
        message,
        location: session.lastLocation ? {
          lat: session.lastLocation.lat,
          lng: session.lastLocation.lng,
        } : undefined,
        isRead: false,
        isActioned: false,
        relatedId: args.sessionId,
      });

      if (finalStatus === "arrived") {
        await ctx.db.insert("notifications", {
          userId: guardianId,
          type: "accompaniment_update",
          title: "✅ Safe Arrival",
          message: `${user?.name || "Someone"} arrived safely`,
          isRead: false,
          fromUserId: session.userId,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Get active location share session for a user
 */
export const getActiveSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locationShares")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
  },
});

/**
 * Get location shares where user is a guardian (watching others)
 */
export const getWatchingSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activeSessions = await ctx.db
      .query("locationShares")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter to sessions where this user is a guardian
    const watchingSessions = activeSessions.filter(s => 
      s.sharedWith.includes(args.userId)
    );

    // Get user info for each session
    const sessionsWithUsers = await Promise.all(
      watchingSessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          ...session,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatarConfig: user.avatarConfig,
          } : null,
        };
      })
    );

    return sessionsWithUsers.filter(s => s.user !== null);
  },
});
