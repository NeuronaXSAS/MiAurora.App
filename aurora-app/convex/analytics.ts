/**
 * Analytics Backend
 * 
 * Handles batch event logging for the Data Intelligence Lake.
 * Optimized for high-volume event ingestion.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Log a batch of analytics events
 * Accepts multiple events to reduce API calls
 */
export const logBatch = mutation({
  args: {
    events: v.array(
      v.object({
        eventType: v.string(),
        sessionId: v.string(),
        userId: v.optional(v.id('users')),
        metadata: v.optional(v.any()),
        geo: v.optional(
          v.object({
            lat: v.number(),
            lng: v.number(),
            accuracy: v.optional(v.number()),
            city: v.optional(v.string()),
            country: v.optional(v.string()),
          })
        ),
        device: v.optional(
          v.object({
            userAgent: v.optional(v.string()),
            platform: v.optional(v.string()),
            isMobile: v.optional(v.boolean()),
            screenWidth: v.optional(v.number()),
            screenHeight: v.optional(v.number()),
          })
        ),
        performance: v.optional(
          v.object({
            loadTime: v.optional(v.number()),
            renderTime: v.optional(v.number()),
            networkLatency: v.optional(v.number()),
          })
        ),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Insert all events in batch
    const insertPromises = args.events.map((event) =>
      ctx.db.insert('analytics_events', event)
    );

    await Promise.all(insertPromises);

    return {
      success: true,
      count: args.events.length,
    };
  },
});

/**
 * Get analytics events by type
 */
export const getEventsByType = query({
  args: {
    eventType: v.string(),
    limit: v.optional(v.number()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    let query = ctx.db
      .query('analytics_events')
      .withIndex('by_event_and_time', (q) => q.eq('eventType', args.eventType));

    if (args.startTime) {
      query = query.filter((q) => q.gte(q.field('timestamp'), args.startTime!));
    }

    if (args.endTime) {
      query = query.filter((q) => q.lte(q.field('timestamp'), args.endTime!));
    }

    const events = await query.order('desc').take(limit);

    return events;
  },
});

/**
 * Get analytics events by user
 */
export const getEventsByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const events = await ctx.db
      .query('analytics_events')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);

    return events;
  },
});

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all events in time range
    const events = await ctx.db
      .query('analytics_events')
      .filter((q) =>
        q.and(
          q.gte(q.field('timestamp'), args.startTime),
          q.lte(q.field('timestamp'), args.endTime)
        )
      )
      .collect();

    // Calculate summary statistics
    const eventTypeCounts: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const uniqueSessions = new Set<string>();

    events.forEach((event) => {
      // Count by event type
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;

      // Track unique users
      if (event.userId) {
        uniqueUsers.add(event.userId);
      }

      // Track unique sessions
      uniqueSessions.add(event.sessionId);
    });

    return {
      totalEvents: events.length,
      uniqueUsers: uniqueUsers.size,
      uniqueSessions: uniqueSessions.size,
      eventTypeCounts,
      timeRange: {
        start: args.startTime,
        end: args.endTime,
      },
    };
  },
});

/**
 * Get geographic event distribution (for Urban Safety Index)
 */
export const getGeographicDistribution = query({
  args: {
    eventType: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('analytics_events')
      .filter((q) =>
        q.and(
          q.gte(q.field('timestamp'), args.startTime),
          q.lte(q.field('timestamp'), args.endTime)
        )
      );

    if (args.eventType) {
      query = query.filter((q) => q.eq(q.field('eventType'), args.eventType));
    }

    const events = await query.collect();

    // Group by rounded coordinates (0.01 degree grid ≈ 1km squares)
    const locationCounts: Record<string, number> = {};
    
    events.forEach((event) => {
      if (event.geo) {
        // Round to 2 decimals for 1km grid
        const lat = Math.round(event.geo.lat * 100) / 100;
        const lng = Math.round(event.geo.lng * 100) / 100;
        const key = `${lat},${lng}`;
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const distribution = Object.entries(locationCounts)
      .map(([coords, count]) => {
        const [lat, lng] = coords.split(',').map(Number);
        return { lat, lng, count };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents: events.length,
      eventsWithGeo: distribution.reduce((sum, item) => sum + item.count, 0),
      distribution: distribution.slice(0, 100), // Top 100 locations
    };
  },
});

/**
 * Get device/platform statistics
 */
export const getDeviceStats = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('analytics_events')
      .filter((q) =>
        q.and(
          q.gte(q.field('timestamp'), args.startTime),
          q.lte(q.field('timestamp'), args.endTime)
        )
      )
      .collect();

    const platformCounts: Record<string, number> = {};
    const mobileCounts = { mobile: 0, desktop: 0, unknown: 0 };
    const screenSizes: { width: number; height: number }[] = [];

    events.forEach((event) => {
      if (event.device) {
        // Platform distribution
        if (event.device.platform) {
          platformCounts[event.device.platform] = 
            (platformCounts[event.device.platform] || 0) + 1;
        }

        // Mobile vs desktop
        if (event.device.isMobile !== undefined) {
          if (event.device.isMobile) {
            mobileCounts.mobile++;
          } else {
            mobileCounts.desktop++;
          }
        } else {
          mobileCounts.unknown++;
        }

        // Screen sizes
        if (event.device.screenWidth && event.device.screenHeight) {
          screenSizes.push({
            width: event.device.screenWidth,
            height: event.device.screenHeight,
          });
        }
      }
    });

    return {
      totalEvents: events.length,
      platformCounts,
      mobileCounts,
      avgScreenSize: screenSizes.length > 0 ? {
        width: Math.round(screenSizes.reduce((sum, s) => sum + s.width, 0) / screenSizes.length),
        height: Math.round(screenSizes.reduce((sum, s) => sum + s.height, 0) / screenSizes.length),
      } : null,
    };
  },
});

/**
 * Get engagement funnel (for conversion analysis)
 */
export const getEngagementFunnel = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('analytics_events')
      .filter((q) =>
        q.and(
          q.gte(q.field('timestamp'), args.startTime),
          q.lte(q.field('timestamp'), args.endTime)
        )
      )
      .collect();

    // Count key funnel events
    const funnel = {
      page_view: 0,
      map_interaction: 0,
      post_view: 0,
      route_taken: 0,
      reel_watched: 0,
      livestream_joined: 0,
    };

    events.forEach((event) => {
      if (event.eventType in funnel) {
        funnel[event.eventType as keyof typeof funnel]++;
      }
    });

    return funnel;
  },
});
