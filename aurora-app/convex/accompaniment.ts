import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create an accompaniment session
 */
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    routeId: v.optional(v.id("routes")),
    destination: v.string(),
    estimatedArrival: v.number(),
    companions: v.array(v.id("users")), // Users who will track
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("accompanimentSessions", {
      userId: args.userId,
      routeId: args.routeId,
      destination: args.destination,
      estimatedArrival: args.estimatedArrival,
      companions: args.companions,
      status: "active",
      startTime: Date.now(),
      lastUpdate: Date.now(),
    });

    // Notify companions
    const user = await ctx.db.get(args.userId);
    if (user) {
      for (const companionId of args.companions) {
        await ctx.db.insert("notifications", {
          userId: companionId,
          type: "accompaniment_request",
          title: "Accompaniment Request",
          message: `${user.name} wants you to track their journey to ${args.destination}`,
          isRead: false,
          actionUrl: `/accompaniment/${sessionId}`,
          fromUserId: args.userId,
          relatedId: sessionId,
        });
      }
    }

    return sessionId;
  },
});

/**
 * Update location during accompaniment
 */
export const updateLocation = mutation({
  args: {
    sessionId: v.id("accompanimentSessions"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      currentLocation: args.location,
      lastUpdate: Date.now(),
    });
  },
});

/**
 * End accompaniment session
 */
export const endSession = mutation({
  args: {
    sessionId: v.id("accompanimentSessions"),
    status: v.union(
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("emergency")
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    await ctx.db.patch(args.sessionId, {
      status: args.status,
      endTime: Date.now(),
    });

    // Notify companions
    const user = await ctx.db.get(session.userId);
    if (user) {
      for (const companionId of session.companions) {
        const message =
          args.status === "completed"
            ? `${user.name} has arrived safely`
            : args.status === "emergency"
            ? `🚨 EMERGENCY: ${user.name} needs help!`
            : `${user.name} cancelled their journey`;

        await ctx.db.insert("notifications", {
          userId: companionId,
          type: args.status === "emergency" ? "emergency" : "accompaniment_update",
          title: args.status === "emergency" ? "EMERGENCY ALERT" : "Journey Update",
          message,
          isRead: false,
          actionUrl: `/accompaniment/${args.sessionId}`,
          fromUserId: session.userId,
          relatedId: args.sessionId,
        });
      }
    }
  },
});

/**
 * Get active session for user
 */
export const getActiveSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("accompanimentSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!session) return null;

    // Get companion details
    const companions = await Promise.all(
      session.companions.map(async (id) => {
        const companion = await ctx.db.get(id);
        return companion
          ? {
              _id: companion._id,
              name: companion.name,
              profileImage: companion.profileImage,
            }
          : null;
      })
    );

    return {
      ...session,
      companionDetails: companions.filter((c) => c !== null),
    };
  },
});

/**
 * Get sessions where user is a companion
 */
export const getCompanionSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db
      .query("accompanimentSessions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const companionSessions = allSessions.filter((session) =>
      session.companions.includes(args.userId)
    );

    // Get user details for each session
    const sessionsWithDetails = await Promise.all(
      companionSessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          ...session,
          userDetails: user
            ? {
                name: user.name,
                profileImage: user.profileImage,
              }
            : null,
        };
      })
    );

    return sessionsWithDetails;
  },
});

/**
 * Send check-in message
 */
export const sendCheckIn = mutation({
  args: {
    sessionId: v.id("accompanimentSessions"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    const user = await ctx.db.get(session.userId);
    if (!user) return;

    // Notify all companions
    for (const companionId of session.companions) {
      await ctx.db.insert("notifications", {
        userId: companionId,
        type: "accompaniment_update",
        title: "Check-in from " + user.name,
        message: args.message,
        isRead: false,
        actionUrl: `/accompaniment/${args.sessionId}`,
        fromUserId: session.userId,
        relatedId: args.sessionId,
      });
    }
  },
});
