import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Start a new route tracking session
 */
export const startRoute = mutation({
  args: {
    userId: v.id("users"),
    routeType: v.union(
      v.literal("walking"),
      v.literal("running"),
      v.literal("cycling"),
      v.literal("commuting")
    ),
  },
  handler: async (ctx, args) => {
    // Create initial route with minimal data
    const routeId = await ctx.db.insert("routes", {
      creatorId: args.userId,
      title: `${args.routeType.charAt(0).toUpperCase() + args.routeType.slice(1)} Route`,
      routeType: args.routeType,
      coordinates: [],
      distance: 0,
      duration: 0,
      elevationGain: 0,
      startLocation: { lat: 0, lng: 0, name: "" },
      endLocation: { lat: 0, lng: 0, name: "" },
      tags: [],
      rating: 0,
      isPrivate: true,
      isAnonymous: false,
      sharingLevel: "private",
      completionCount: 0,
      totalRating: 0,
      verificationCount: 0,
      creditsEarned: 0,
    });

    return { success: true, routeId };
  },
});

/**
 * Save route coordinates during tracking
 */
export const saveCoordinates = mutation({
  args: {
    routeId: v.id("routes"),
    coordinates: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number(),
      elevation: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    // Append new coordinates
    await ctx.db.patch(args.routeId, {
      coordinates: [...route.coordinates, ...args.coordinates],
    });

    return { success: true };
  },
});

/**
 * Fuzz coordinates for privacy (±100m)
 */
function fuzzCoordinate(lat: number, lng: number): { lat: number; lng: number } {
  // Add random offset of ±0.001 degrees (approximately ±100m)
  const latOffset = (Math.random() - 0.5) * 0.002;
  const lngOffset = (Math.random() - 0.5) * 0.002;
  
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

/**
 * Blur start/end points by removing first/last 10% of coordinates
 */
function blurRouteEndpoints(coordinates: Array<{ lat: number; lng: number; timestamp: number; elevation?: number }>) {
  const totalPoints = coordinates.length;
  const pointsToRemove = Math.floor(totalPoints * 0.1);
  
  if (totalPoints <= 20) {
    // For short routes, just return middle 50%
    const start = Math.floor(totalPoints * 0.25);
    const end = Math.floor(totalPoints * 0.75);
    return coordinates.slice(start, end);
  }
  
  return coordinates.slice(pointsToRemove, totalPoints - pointsToRemove);
}

/**
 * Complete a route with evaluation
 */
export const completeRoute = mutation({
  args: {
    routeId: v.id("routes"),
    userId: v.id("users"),
    title: v.optional(v.string()),
    distance: v.number(),
    duration: v.number(),
    elevationGain: v.number(),
    startLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.string(),
    }),
    endLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.string(),
    }),
    tags: v.array(v.string()),
    rating: v.number(),
    journalEntry: v.optional(v.string()),
    voiceNoteStorageId: v.optional(v.id("_storage")),
    sharingLevel: v.union(
      v.literal("private"),
      v.literal("anonymous"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    if (route.creatorId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Apply privacy controls for anonymous routes
    let processedCoordinates = route.coordinates;
    let processedStartLocation = args.startLocation;
    let processedEndLocation = args.endLocation;

    if (args.sharingLevel === "anonymous") {
      // Blur endpoints by removing first/last 10% of route
      processedCoordinates = blurRouteEndpoints(route.coordinates);
      
      // Fuzz start and end locations
      const fuzzedStart = fuzzCoordinate(args.startLocation.lat, args.startLocation.lng);
      const fuzzedEnd = fuzzCoordinate(args.endLocation.lat, args.endLocation.lng);
      
      processedStartLocation = {
        ...args.startLocation,
        lat: fuzzedStart.lat,
        lng: fuzzedStart.lng,
        name: "Approximate location", // Generalize location name
      };
      
      processedEndLocation = {
        ...args.endLocation,
        lat: fuzzedEnd.lat,
        lng: fuzzedEnd.lng,
        name: "Approximate location",
      };
    }

    // Update route with completion data
    await ctx.db.patch(args.routeId, {
      title: args.title || route.title,
      distance: args.distance,
      duration: args.duration,
      elevationGain: args.elevationGain,
      startLocation: processedStartLocation,
      endLocation: processedEndLocation,
      coordinates: processedCoordinates,
      tags: args.tags,
      rating: args.rating,
      journalEntry: args.journalEntry,
      voiceNoteStorageId: args.voiceNoteStorageId,
      sharingLevel: args.sharingLevel,
      isPrivate: args.sharingLevel === "private",
      isAnonymous: args.sharingLevel === "anonymous",
    });

    // Award credits if shared publicly
    if (args.sharingLevel !== "private") {
      const user = await ctx.db.get(args.userId);
      if (user) {
        await ctx.db.patch(args.userId, {
          credits: user.credits + 15,
        });

        // Log transaction
        await ctx.db.insert("transactions", {
          userId: args.userId,
          amount: 15,
          type: "route_shared",
          relatedId: args.routeId,
        });

        // Award bonus for detailed journal
        if (args.journalEntry && args.journalEntry.length > 200) {
          await ctx.db.patch(args.userId, {
            credits: user.credits + 20, // 15 + 5 bonus
          });

          await ctx.db.insert("transactions", {
            userId: args.userId,
            amount: 5,
            type: "route_bonus",
            relatedId: args.routeId,
          });
        }
      }

      // Auto-publish to feed when sharing level is anonymous or public
      const distanceKm = (args.distance / 1000).toFixed(2);
      const durationMins = Math.floor(args.duration / 60);
      
      await ctx.db.insert("posts", {
        authorId: args.userId,
        title: `Shared a route: ${args.title || route.title}`,
        description: args.journalEntry || `Check out my ${route.routeType} route! ${distanceKm}km in ${durationMins} minutes.`,
        lifeDimension: "daily",
        rating: args.rating,
        location: {
          name: processedStartLocation.name,
          coordinates: [processedStartLocation.lng, processedStartLocation.lat],
        },
        verificationCount: 0,
        isVerified: false,
        isAnonymous: args.sharingLevel === "anonymous",
        routeId: args.routeId,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
      });
    }

    return { success: true, routeId: args.routeId };
  },
});

/**
 * Get user's routes
 */
export const getUserRoutes = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);

    return routes;
  },
});

/**
 * Get public routes for discovery
 */
export const getPublicRoutes = query({
  args: {
    limit: v.optional(v.number()),
    routeType: v.optional(v.union(
      v.literal("walking"),
      v.literal("running"),
      v.literal("cycling"),
      v.literal("commuting")
    )),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public" as const));

    const routes = await query.order("desc").take(args.limit ?? 50);

    // Filter by route type and rating
    let filtered = routes;
    
    if (args.routeType) {
      filtered = filtered.filter(r => r.routeType === args.routeType);
    }
    
    if (args.minRating !== undefined) {
      filtered = filtered.filter(r => r.rating >= args.minRating!);
    }

    // Fetch creator info for non-anonymous routes
    const routesWithCreators = await Promise.all(
      filtered.map(async (route) => {
        if (route.isAnonymous) {
          return {
            ...route,
            creator: { name: "Anonymous", trustScore: 0 },
          };
        }
        
        const creator = await ctx.db.get(route.creatorId);
        return {
          ...route,
          creator: creator ? {
            name: creator.name,
            trustScore: creator.trustScore,
            profileImage: creator.profileImage,
          } : { name: "Unknown", trustScore: 0 },
        };
      })
    );

    return routesWithCreators;
  },
});

/**
 * Get route by ID
 */
export const getRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      return null;
    }

    // Fetch creator info
    let creator: { name: string; trustScore: number; profileImage?: string } = { 
      name: "Anonymous", 
      trustScore: 0 
    };
    if (!route.isAnonymous) {
      const creatorData = await ctx.db.get(route.creatorId);
      if (creatorData) {
        creator = {
          name: creatorData.name,
          trustScore: creatorData.trustScore,
          profileImage: creatorData.profileImage,
        };
      }
    }

    // Fetch completions
    const completions = await ctx.db
      .query("routeCompletions")
      .withIndex("by_route", (q) => q.eq("routeId", args.routeId))
      .collect();

    return {
      ...route,
      creator,
      completions: completions.length,
    };
  },
});

/**
 * Complete a community route
 */
export const completeCommunityRoute = mutation({
  args: {
    routeId: v.id("routes"),
    userId: v.id("users"),
    userRating: v.number(),
    userTags: v.array(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    // Check if user already completed this route
    const existing = await ctx.db
      .query("routeCompletions")
      .withIndex("by_route_and_user", (q) => 
        q.eq("routeId", args.routeId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("You have already completed this route");
    }

    // Create completion record
    await ctx.db.insert("routeCompletions", {
      routeId: args.routeId,
      userId: args.userId,
      completedAt: Date.now(),
      userRating: args.userRating,
      userTags: args.userTags,
      feedback: args.feedback,
      verified: true,
    });

    // Update route statistics
    await ctx.db.patch(args.routeId, {
      completionCount: route.completionCount + 1,
      totalRating: route.totalRating + args.userRating,
      verificationCount: route.verificationCount + 1,
    });

    // Award credits to route creator
    const creator = await ctx.db.get(route.creatorId);
    if (creator) {
      await ctx.db.patch(route.creatorId, {
        credits: creator.credits + 5,
      });

      await ctx.db.insert("transactions", {
        userId: route.creatorId,
        amount: 5,
        type: "route_completed",
        relatedId: args.routeId,
      });

      // Check for bonus (10+ completions)
      if (route.completionCount + 1 === 10) {
        await ctx.db.patch(route.creatorId, {
          credits: creator.credits + 30, // 5 + 25 bonus
        });

        await ctx.db.insert("transactions", {
          userId: route.creatorId,
          amount: 25,
          type: "route_bonus",
          relatedId: args.routeId,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Delete a route with complete data purge
 */
export const deleteRoute = mutation({
  args: {
    routeId: v.id("routes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    if (route.creatorId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // Delete voice note from storage if exists
    if (route.voiceNoteStorageId) {
      try {
        await ctx.storage.delete(route.voiceNoteStorageId);
      } catch (error) {
        console.error("Error deleting voice note:", error);
      }
    }

    // Delete all completions
    const completions = await ctx.db
      .query("routeCompletions")
      .withIndex("by_route", (q) => q.eq("routeId", args.routeId))
      .collect();

    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    // Delete all related transactions
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("relatedId"), args.routeId))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Finally, delete the route itself
    await ctx.db.delete(args.routeId);

    return { success: true };
  },
});

/**
 * Share route to main feed
 */
export const shareRouteToFeed = mutation({
  args: {
    routeId: v.id("routes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    if (route.creatorId !== args.userId) {
      throw new Error("Unauthorized");
    }

    if (route.isPrivate) {
      throw new Error("Cannot share private routes");
    }

    // Format distance and duration
    const distanceKm = (route.distance / 1000).toFixed(2);
    const durationMins = Math.floor(route.duration / 60);
    
    // Create a post for the route
    const postId = await ctx.db.insert("posts", {
      authorId: args.userId,
      title: `Shared a route: ${route.title}`,
      description: route.journalEntry || `Check out my ${route.routeType} route! ${distanceKm}km in ${durationMins} minutes.`,
      lifeDimension: "daily",
      rating: route.rating,
      location: {
        name: route.startLocation.name,
        coordinates: [route.startLocation.lng, route.startLocation.lat],
      },
      verificationCount: 0,
      isVerified: false,
      isAnonymous: route.isAnonymous,
      routeId: args.routeId, // Link to route
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
    });

    return { success: true, postId };
  },
});

/**
 * Update route privacy settings (retroactive)
 */
export const updateRoutePrivacy = mutation({
  args: {
    routeId: v.id("routes"),
    userId: v.id("users"),
    sharingLevel: v.union(
      v.literal("private"),
      v.literal("anonymous"),
      v.literal("public")
    ),
    originalCoordinates: v.optional(v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number(),
      elevation: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    if (route.creatorId !== args.userId) {
      throw new Error("Unauthorized");
    }

    // If changing from public/private to anonymous, apply privacy controls
    let processedCoordinates = route.coordinates;
    let processedStartLocation = route.startLocation;
    let processedEndLocation = route.endLocation;

    if (args.sharingLevel === "anonymous" && route.sharingLevel !== "anonymous") {
      // Use original coordinates if provided, otherwise use current
      const coordsToProcess = args.originalCoordinates || route.coordinates;
      
      // Blur endpoints
      processedCoordinates = blurRouteEndpoints(coordsToProcess);
      
      // Fuzz locations
      const fuzzedStart = fuzzCoordinate(route.startLocation.lat, route.startLocation.lng);
      const fuzzedEnd = fuzzCoordinate(route.endLocation.lat, route.endLocation.lng);
      
      processedStartLocation = {
        ...route.startLocation,
        lat: fuzzedStart.lat,
        lng: fuzzedStart.lng,
        name: "Approximate location",
      };
      
      processedEndLocation = {
        ...route.endLocation,
        lat: fuzzedEnd.lat,
        lng: fuzzedEnd.lng,
        name: "Approximate location",
      };
    } else if (args.sharingLevel !== "anonymous" && args.originalCoordinates) {
      // Restore original coordinates if moving away from anonymous
      processedCoordinates = args.originalCoordinates;
    }

    await ctx.db.patch(args.routeId, {
      sharingLevel: args.sharingLevel,
      isPrivate: args.sharingLevel === "private",
      isAnonymous: args.sharingLevel === "anonymous",
      coordinates: processedCoordinates,
      startLocation: processedStartLocation,
      endLocation: processedEndLocation,
    });

    return { success: true };
  },
});


/**
 * Flag a route for moderation
 */
export const flagRoute = mutation({
  args: {
    routeId: v.id("routes"),
    userId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      throw new Error("Route not found");
    }

    // Check if user already flagged this route
    const existing = await ctx.db
      .query("routeFlags")
      .withIndex("by_route_and_user", (q) => 
        q.eq("routeId", args.routeId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("You have already flagged this route");
    }

    // Create flag record
    await ctx.db.insert("routeFlags", {
      routeId: args.routeId,
      userId: args.userId,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Detect impossible routes (automated moderation)
 */
export const detectImpossibleRoute = query({
  args: { routeId: v.id("routes") },
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    
    if (!route) {
      return { isImpossible: false, reasons: [] };
    }

    const reasons: string[] = [];

    // Check for impossible speed
    if (route.duration > 0) {
      const speedKmh = (route.distance / 1000) / (route.duration / 3600);
      
      if (route.routeType === "walking" && speedKmh > 10) {
        reasons.push("Walking speed exceeds human capability");
      }
      if (route.routeType === "running" && speedKmh > 30) {
        reasons.push("Running speed exceeds human capability");
      }
      if (route.routeType === "cycling" && speedKmh > 60) {
        reasons.push("Cycling speed exceeds typical capability");
      }
    }

    // Check for impossible distance
    if (route.distance > 200000) { // 200km
      reasons.push("Distance exceeds reasonable single-session limit");
    }

    // Check for impossible duration
    if (route.duration > 86400) { // 24 hours
      reasons.push("Duration exceeds 24 hours");
    }

    // Check for too few coordinates
    if (route.coordinates.length < 10 && route.distance > 1000) {
      reasons.push("Insufficient GPS data for reported distance");
    }

    return {
      isImpossible: reasons.length > 0,
      reasons,
    };
  },
});

