import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Add or update emergency contact
 */
export const saveEmergencyContact = mutation({
  args: {
    contactId: v.optional(v.id("emergencyContacts")),
    name: v.string(),
    phoneNumber: v.string(),
    relationship: v.optional(v.string()),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Check if user already has 5 contacts
    if (!args.contactId) {
      const existingContacts = await ctx.db
        .query("emergencyContacts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      if (existingContacts.length >= 5) {
        throw new Error("Maximum 5 emergency contacts allowed");
      }
    }

    if (args.contactId) {
      // Update existing contact
      await ctx.db.patch(args.contactId, {
        name: args.name,
        phoneNumber: args.phoneNumber,
        relationship: args.relationship,
        priority: args.priority,
      });
      return args.contactId;
    } else {
      // Create new contact
      const contactId = await ctx.db.insert("emergencyContacts", {
        userId: user._id,
        name: args.name,
        phoneNumber: args.phoneNumber,
        relationship: args.relationship,
        priority: args.priority,
      });
      return contactId;
    }
  },
});

/**
 * Get user's emergency contacts
 */
export const getEmergencyContacts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return [];

    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return contacts.sort((a, b) => a.priority - b.priority);
  },
});

/**
 * Delete emergency contact
 */
export const deleteEmergencyContact = mutation({
  args: {
    contactId: v.id("emergencyContacts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user || contact.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.contactId);
  },
});

/**
 * Trigger emergency alert
 */
export const triggerEmergencyAlert = mutation({
  args: {
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
      address: v.optional(v.string()),
    }),
    message: v.optional(v.string()),
    alertType: v.union(
      v.literal("panic"),
      v.literal("check_in_failed"),
      v.literal("journey_alert"),
      v.literal("manual")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get emergency contacts
    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Create emergency post
    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      lifeDimension: "daily",
      title: "🚨 EMERGENCY ALERT",
      description: args.message || "Emergency alert triggered. User needs immediate assistance.",
      rating: 1,
      location: {
        name: args.location.address || "Emergency Location",
        coordinates: [args.location.lng, args.location.lat],
      },
      verificationCount: 0,
      isVerified: false,
      isAnonymous: false,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      postType: "standard",
    });

    // Create emergency alert
    const alertId = await ctx.db.insert("emergencyAlerts", {
      userId: user._id,
      status: "active",
      location: args.location,
      message: args.message,
      alertType: args.alertType,
      notifiedContacts: contacts.map((c) => c._id),
      nearbyUsersNotified: 0, // Will be updated by notification system
      postId,
    });

    // Send SMS to emergency contacts via Twilio (async, non-blocking)
    if (contacts.length > 0) {
      const phoneNumbers = contacts
        .filter(c => c.phoneNumber) // Only contacts with phone numbers
        .map(c => c.phoneNumber);

      if (phoneNumbers.length > 0) {
        // Schedule SMS sending asynchronously (won't block alert creation)
        ctx.scheduler.runAfter(0, api.actions.twilio.sendEmergencySMS, {
          phoneNumbers,
          userName: user.name || 'Aurora User',
          location: {
            lat: args.location.lat,
            lng: args.location.lng,
            name: args.location.address,
          },
          message: args.message,
        });
      }
    }

    // Create notifications for nearby users (within 5km)
    // This is a simplified version - in production, use geospatial queries
    const allUsers = await ctx.db.query("users").collect();
    let nearbyCount = 0;

    for (const nearbyUser of allUsers) {
      if (nearbyUser._id === user._id) continue;

      // Create notification for nearby user
      await ctx.db.insert("notifications", {
        userId: nearbyUser._id,
        type: "mention", // Reusing existing type
        title: "🚨 Emergency Alert Nearby",
        message: `A user needs help near ${args.location.address || "your location"}`,
        isRead: false,
        actionUrl: `/emergency/${alertId}`,
        fromUserId: user._id,
        relatedId: alertId,
      });
      nearbyCount++;
    }

    // Update nearby users count
    await ctx.db.patch(alertId, {
      nearbyUsersNotified: nearbyCount,
    });

    return { alertId, postId };
  },
});

/**
 * Resolve emergency alert
 */
export const resolveEmergencyAlert = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
    status: v.union(
      v.literal("resolved"),
      v.literal("cancelled"),
      v.literal("false_alarm")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    if (alert.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.alertId, {
      status: args.status,
      resolvedAt: Date.now(),
      resolvedBy: user._id,
      notes: args.notes,
    });
  },
});

/**
 * Respond to emergency alert
 */
export const respondToEmergency = mutation({
  args: {
    alertId: v.id("emergencyAlerts"),
    responseType: v.union(
      v.literal("can_help"),
      v.literal("on_way"),
      v.literal("contacted_authorities"),
      v.literal("false_alarm_report")
    ),
    message: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    // Create response
    await ctx.db.insert("emergencyResponses", {
      alertId: args.alertId,
      responderId: user._id,
      responseType: args.responseType,
      message: args.message,
      location: args.location,
    });

    // Notify the user in distress
    await ctx.db.insert("notifications", {
      userId: alert.userId,
      type: "mention",
      title: "Emergency Response",
      message: `${user.name} is responding to your emergency alert`,
      isRead: false,
      actionUrl: `/emergency/${args.alertId}`,
      fromUserId: user._id,
      relatedId: args.alertId,
    });

    // Award credits to responder
    await ctx.db.patch(user._id, {
      credits: user.credits + 50, // Reward for helping in emergency
    });
  },
});

/**
 * Get active emergency alerts
 */
export const getActiveEmergencyAlerts = query({
  handler: async (ctx) => {
    const alerts = await ctx.db
      .query("emergencyAlerts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Get user details for each alert
    const alertsWithUsers = await Promise.all(
      alerts.map(async (alert) => {
        const user = await ctx.db.get(alert.userId);
        return {
          ...alert,
          user: user ? {
            name: user.name,
            profileImage: user.profileImage,
            trustScore: user.trustScore,
          } : null,
        };
      })
    );

    return alertsWithUsers;
  },
});

/**
 * Get user's emergency alert history
 */
export const getMyEmergencyAlerts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", identity.subject))
      .first();

    if (!user) return [];

    const alerts = await ctx.db
      .query("emergencyAlerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return alerts.sort((a, b) => b._creationTime - a._creationTime);
  },
});
