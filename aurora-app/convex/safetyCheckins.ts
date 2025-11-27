import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Schedule a safety check-in
export const scheduleCheckin = mutation({
  args: {
    userId: v.id("users"),
    scheduledTime: v.number(), // Timestamp when check-in is expected
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user's emergency contacts
    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const contactIds = contacts.map(c => c._id);

    return await ctx.db.insert("safetyCheckins", {
      userId: args.userId,
      scheduledTime: args.scheduledTime,
      status: "pending",
      note: args.note,
      alertContacts: contactIds,
    });
  },
});

// Confirm a check-in (user is safe)
export const confirmCheckin = mutation({
  args: {
    checkinId: v.id("safetyCheckins"),
    userId: v.id("users"),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.userId !== args.userId) {
      throw new Error("Check-in not found");
    }

    await ctx.db.patch(args.checkinId, {
      status: "confirmed",
      confirmedAt: Date.now(),
      location: args.location,
    });

    // Award credits for checking in
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + 2,
      });
    }

    return { success: true };
  },
});

// Get pending check-ins for a user
export const getPendingCheckins = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      // Verify user exists
      const user = await ctx.db.get(args.userId);
      if (!user) {
        return [];
      }

      const checkins = await ctx.db
        .query("safetyCheckins")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .order("asc")
        .collect();

      return checkins;
    } catch (error) {
      console.error("Error fetching pending checkins:", error);
      return [];
    }
  },
});

// Get check-in history
export const getCheckinHistory = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("safetyCheckins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Cancel a scheduled check-in
export const cancelCheckin = mutation({
  args: {
    checkinId: v.id("safetyCheckins"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.userId !== args.userId) {
      throw new Error("Check-in not found");
    }

    await ctx.db.delete(args.checkinId);
    return { success: true };
  },
});

// Mark check-in as missed and notify Aurora Guardians
export const markMissedCheckin = mutation({
  args: { checkinId: v.id("safetyCheckins") },
  handler: async (ctx, args) => {
    const checkin = await ctx.db.get(args.checkinId);
    if (!checkin || checkin.status !== "pending") return;

    // Check if past due (15 min grace period)
    if (Date.now() < checkin.scheduledTime + 15 * 60 * 1000) {
      return;
    }

    await ctx.db.patch(args.checkinId, {
      status: "missed",
    });

    // Get user info
    const user = await ctx.db.get(checkin.userId);
    if (!user) return;

    // Create notification for user
    await ctx.db.insert("notifications", {
      userId: checkin.userId,
      type: "emergency",
      title: "⚠️ Missed Safety Check-in",
      message: "You missed your scheduled check-in. Your Aurora Guardians have been notified.",
      isRead: false,
    });

    // Notify Aurora Guardians
    const guardianConnections = await ctx.db
      .query("auroraGuardians")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", checkin.userId).eq("status", "accepted")
      )
      .filter((q) => q.eq(q.field("canReceiveCheckins"), true))
      .collect();

    for (const conn of guardianConnections) {
      // Create guardian notification
      await ctx.db.insert("guardianNotifications", {
        guardianId: conn.guardianId,
        fromUserId: checkin.userId,
        type: "checkin_missed",
        message: `${user.name} missed their scheduled check-in. Please check on them.`,
        location: checkin.location,
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
        fromUserId: checkin.userId,
        relatedId: args.checkinId,
      });
    }

    return { missed: true, guardiansNotified: guardianConnections.length };
  },
});

// Quick check-in (instant "I'm OK" without scheduling)
export const quickCheckin = mutation({
  args: {
    userId: v.id("users"),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checkinId = await ctx.db.insert("safetyCheckins", {
      userId: args.userId,
      scheduledTime: Date.now(),
      status: "confirmed",
      confirmedAt: Date.now(),
      location: args.location,
      note: args.note || "Quick check-in",
    });

    // Award credits
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + 1,
      });
    }

    return { checkinId, credits: 1 };
  },
});
