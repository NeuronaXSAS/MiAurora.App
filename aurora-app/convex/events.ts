/**
 * Aurora Premium - Events Service
 * 
 * Handles paid and free events, RSVPs, and event calendar.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { REVENUE_SHARES } from "./premiumConfig";

// ============================================
// EVENT QUERIES
// ============================================

/**
 * Get events for a Circle
 */
export const getCircleEvents = query({
  args: {
    circleId: v.id("circles"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let events = await ctx.db
      .query("events")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .order("desc")
      .take(limit);
    
    if (args.status) {
      events = events.filter(e => e.status === args.status);
    }
    
    // Enrich with host info
    const enriched = await Promise.all(
      events.map(async (event) => {
        const host = await ctx.db.get(event.hostId);
        const rsvpCount = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();
        
        return {
          ...event,
          host: host ? {
            name: host.name,
            profileImage: host.profileImage,
          } : null,
          rsvpCount: rsvpCount.filter(r => r.status === "going").length,
          waitlistCount: rsvpCount.filter(r => r.status === "waitlist").length,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Get user's event calendar (all events from joined Circles)
 */
export const getUserEventCalendar = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = args.startDate || now;
    const endDate = args.endDate || now + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Get user's Circle memberships
    const memberships = await ctx.db
      .query("circleMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const circleIds = memberships.map(m => m.circleId);
    
    // Get events from all joined Circles
    const allEvents: any[] = [];
    
    for (const circleId of circleIds) {
      const circleEvents = await ctx.db
        .query("events")
        .withIndex("by_circle", (q) => q.eq("circleId", circleId))
        .collect();
      
      allEvents.push(...circleEvents);
    }
    
    // Also get events user is hosting
    const hostedEvents = await ctx.db
      .query("events")
      .withIndex("by_host", (q) => q.eq("hostId", args.userId))
      .collect();
    
    allEvents.push(...hostedEvents);
    
    // Filter by date range and deduplicate
    const uniqueEvents = Array.from(
      new Map(allEvents.map(e => [e._id, e])).values()
    ).filter(e => 
      e.startTime >= startDate && 
      e.startTime <= endDate &&
      e.status !== "cancelled"
    );
    
    // Sort by start time
    uniqueEvents.sort((a, b) => a.startTime - b.startTime);
    
    // Enrich with RSVP status
    const enriched = await Promise.all(
      uniqueEvents.map(async (event) => {
        const rsvp = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event_user", (q) => 
            q.eq("eventId", event._id).eq("userId", args.userId)
          )
          .first();
        
        const host = await ctx.db.get(event.hostId);
        const circle = event.circleId ? await ctx.db.get(event.circleId) : null;
        
        const hostData = host as { name?: string; profileImage?: string } | null;
        const circleData = circle as { name?: string; category?: string } | null;
        
        return {
          ...event,
          userRsvp: rsvp?.status || null,
          host: hostData ? { name: hostData.name, profileImage: hostData.profileImage } : null,
          circle: circleData ? { name: circleData.name, category: circleData.category } : null,
        };
      })
    );
    
    return enriched;
  },
});

/**
 * Get event details
 */
export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    
    const host = await ctx.db.get(event.hostId);
    const circle = event.circleId ? await ctx.db.get(event.circleId) : null;
    
    const rsvps = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    const reviews = await ctx.db
      .query("eventReviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    
    return {
      ...event,
      host: host ? {
        _id: host._id,
        name: host.name,
        profileImage: host.profileImage,
      } : null,
      circle: circle ? {
        _id: circle._id,
        name: circle.name,
        category: circle.category,
      } : null,
      attendees: {
        going: rsvps.filter(r => r.status === "going").length,
        maybe: rsvps.filter(r => r.status === "maybe").length,
        waitlist: rsvps.filter(r => r.status === "waitlist").length,
      },
      reviews: {
        count: reviews.length,
        averageRating: avgRating,
      },
    };
  },
});

// ============================================
// EVENT MUTATIONS
// ============================================

/**
 * Create a new event
 */
export const createEvent = mutation({
  args: {
    circleId: v.optional(v.id("circles")),
    hostId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("virtual"), v.literal("in-person"), v.literal("hybrid")),
    pricing: v.union(v.literal("free"), v.literal("paid"), v.literal("tier-exclusive")),
    price: v.optional(v.number()),
    priceType: v.optional(v.union(v.literal("credits"), v.literal("usd"))),
    requiredTier: v.optional(v.string()),
    capacity: v.number(),
    waitlistEnabled: v.boolean(),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.optional(v.string()),
    location: v.optional(v.object({
      name: v.string(),
      address: v.optional(v.string()),
      coordinates: v.optional(v.array(v.number())),
    })),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate host exists
    const host = await ctx.db.get(args.hostId);
    if (!host) {
      throw new Error("Host not found");
    }
    
    // Validate Circle if provided
    if (args.circleId) {
      const circle = await ctx.db.get(args.circleId);
      if (!circle) {
        throw new Error("Circle not found");
      }
    }
    
    const eventId = await ctx.db.insert("events", {
      ...args,
      status: "upcoming",
      attendeeCount: 0,
    });
    
    return { success: true, eventId };
  },
});

/**
 * RSVP to an event
 */
export const rsvpToEvent = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(v.literal("going"), v.literal("maybe")),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check for existing RSVP
    const existingRsvp = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", args.userId)
      )
      .first();
    
    if (existingRsvp) {
      // Update existing RSVP
      await ctx.db.patch(existingRsvp._id, { status: args.status });
      return { success: true, rsvpId: existingRsvp._id };
    }
    
    // Check capacity for "going" status
    if (args.status === "going") {
      const goingCount = await ctx.db
        .query("eventRsvps")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("status"), "going"))
        .collect();
      
      if (goingCount.length >= event.capacity) {
        if (event.waitlistEnabled) {
          // Add to waitlist
          const rsvpId = await ctx.db.insert("eventRsvps", {
            eventId: args.eventId,
            userId: args.userId,
            status: "waitlist",
            rsvpedAt: Date.now(),
          });
          return { success: true, rsvpId, waitlisted: true };
        } else {
          throw new Error("Event is at capacity");
        }
      }
    }
    
    // Handle paid events
    let paidAmount: number | undefined;
    let hostEarnings: number | undefined;
    
    if (event.pricing === "paid" && event.price && args.status === "going") {
      if (event.priceType === "credits") {
        // Deduct credits
        if (user.credits < event.price) {
          throw new Error("Insufficient credits");
        }
        
        await ctx.db.patch(args.userId, {
          credits: user.credits - event.price,
        });
        
        // Calculate host earnings (80%)
        hostEarnings = Math.floor(event.price * REVENUE_SHARES.EVENT_HOST_SHARE);
        
        // Add to host
        const host = await ctx.db.get(event.hostId);
        if (host) {
          await ctx.db.patch(event.hostId, {
            credits: host.credits + hostEarnings,
          });
        }
        
        paidAmount = event.price;
        
        // Log transactions
        await ctx.db.insert("transactions", {
          userId: args.userId,
          amount: -event.price,
          type: "event_ticket",
          relatedId: args.eventId,
        });
        
        await ctx.db.insert("transactions", {
          userId: event.hostId,
          amount: hostEarnings,
          type: "event_earnings",
          relatedId: args.eventId,
        });
      }
    }
    
    // Create RSVP
    const rsvpId = await ctx.db.insert("eventRsvps", {
      eventId: args.eventId,
      userId: args.userId,
      status: args.status,
      paidAmount,
      paymentType: event.priceType,
      hostEarnings,
      rsvpedAt: Date.now(),
    });
    
    // Update attendee count
    if (args.status === "going") {
      await ctx.db.patch(args.eventId, {
        attendeeCount: (event.attendeeCount || 0) + 1,
      });
    }
    
    return { success: true, rsvpId };
  },
});

/**
 * Cancel RSVP
 */
export const cancelRsvp = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const rsvp = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", args.userId)
      )
      .first();
    
    if (!rsvp) {
      throw new Error("RSVP not found");
    }
    
    const event = await ctx.db.get(args.eventId);
    
    // Update RSVP status
    await ctx.db.patch(rsvp._id, { status: "cancelled" });
    
    // Update attendee count if was "going"
    if (rsvp.status === "going" && event) {
      await ctx.db.patch(args.eventId, {
        attendeeCount: Math.max(0, (event.attendeeCount || 0) - 1),
      });
      
      // Promote from waitlist if applicable
      if (event.waitlistEnabled) {
        const waitlisted = await ctx.db
          .query("eventRsvps")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
          .filter((q) => q.eq(q.field("status"), "waitlist"))
          .first();
        
        if (waitlisted) {
          await ctx.db.patch(waitlisted._id, { status: "going" });
          
          // Notify promoted user
          await ctx.db.insert("notifications", {
            userId: waitlisted.userId,
            type: "accompaniment_update",
            title: "You're in!",
            message: `A spot opened up for "${event.title}" - you've been moved from the waitlist!`,
            isRead: false,
            relatedId: args.eventId,
          });
        }
      }
    }
    
    // Note: No refunds for cancelled RSVPs (policy decision)
    
    return { success: true };
  },
});

/**
 * Submit event review
 */
export const submitEventReview = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    const event = await ctx.db.get(args.eventId);
    if (!event || event.status !== "ended") {
      throw new Error("Can only review ended events");
    }
    
    // Check user attended
    const rsvp = await ctx.db
      .query("eventRsvps")
      .withIndex("by_event_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", args.userId)
      )
      .first();
    
    if (!rsvp || rsvp.status !== "going") {
      throw new Error("Only attendees can review events");
    }
    
    // Check for existing review
    const existingReview = await ctx.db
      .query("eventReviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (existingReview) {
      throw new Error("You've already reviewed this event");
    }
    
    await ctx.db.insert("eventReviews", {
      eventId: args.eventId,
      userId: args.userId,
      rating: args.rating,
      review: args.review,
      isPublic: true,
    });
    
    // Update event average rating
    const allReviews = await ctx.db
      .query("eventReviews")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
    
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await ctx.db.patch(args.eventId, {
      averageRating: Math.round(avgRating * 10) / 10,
    });
    
    return { success: true };
  },
});

/**
 * Update event status
 */
export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    hostId: v.id("users"),
    status: v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("ended"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    if (event.hostId !== args.hostId) {
      throw new Error("Only the host can update event status");
    }
    
    await ctx.db.patch(args.eventId, { status: args.status });
    
    return { success: true };
  },
});
