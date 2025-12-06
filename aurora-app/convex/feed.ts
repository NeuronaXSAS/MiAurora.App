import { v } from "convex/values";
import { query } from "./_generated/server";

// Map user interests to content dimensions/categories
const INTEREST_TO_DIMENSION: Record<string, string[]> = {
  "Safe Commuting": ["daily", "travel"],
  "Nightlife Safety": ["social", "daily"],
  "Career Mentorship": ["professional"],
  "B2B Networking": ["professional", "financial"],
  "Workplace Safety": ["professional"],
  "Travel Safety": ["travel"],
  "Financial Opportunities": ["financial"],
  "Skill Development": ["professional"],
};

const ROLE_TO_OPPORTUNITY: Record<string, string[]> = {
  "Student": ["mentorship", "resource", "event"],
  "Professional": ["job", "mentorship", "event"],
  "Traveler": ["resource", "event"],
  "Entrepreneur": ["funding", "mentorship", "event"],
  "Job Seeker": ["job", "mentorship", "resource"],
};

/**
 * Get unified activity feed with posts, routes, and opportunities
 * Uses smart mixing algorithm to ensure content variety
 * Personalizes based on user onboarding data (interests, role, location)
 */
export const getUnifiedFeed = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    // Get user preferences if userId provided
    let userInterests: string[] = [];
    let userRole = "";
    let userLocation = "";
    let preferredDimensions: string[] = [];
    let preferredOpportunityTypes: string[] = [];
    
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        userInterests = user.interests || [];
        userRole = user.industry || "";
        userLocation = user.location || "";
        
        // Map interests to content dimensions
        for (const interest of userInterests) {
          const dims = INTEREST_TO_DIMENSION[interest];
          if (dims) preferredDimensions.push(...dims);
        }
        preferredDimensions = [...new Set(preferredDimensions)];
        
        // Map role to opportunity types
        preferredOpportunityTypes = ROLE_TO_OPPORTUNITY[userRole] || [];
      }
    }

    // Fetch MORE posts to ensure variety (get different types)
    const allPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(limit * 4); // Get more to filter by type and preferences

    // Also fetch reels directly to ensure they appear in feed
    // Filter out empty/low-engagement reels to avoid "fake" looking content
    const rawReels = await ctx.db
      .query("reels")
      .order("desc")
      .take(Math.ceil(limit * 0.6)); // Get more to filter
    
    // Task 14.3: Filter reels with actual engagement or content
    // Keep reels that have: views > 0, OR likes > 0, OR comments > 0, OR have a caption
    const allReels = rawReels.filter(reel => 
      (reel.views && reel.views > 0) || 
      (reel.likes && reel.likes > 0) || 
      (reel.comments && reel.comments > 0) ||
      (reel.caption && reel.caption.length > 10)
    ).slice(0, Math.ceil(limit * 0.4)); // 40% reels for variety

    // Score posts based on user preferences and engagement velocity
    const scorePost = (post: typeof allPosts[0]) => {
      let score = 0;
      
      // Boost posts matching user's preferred dimensions
      if (preferredDimensions.length > 0 && post.lifeDimension) {
        if (preferredDimensions.includes(post.lifeDimension)) {
          score += 50;
        }
      }
      
      // Boost posts from user's location
      if (userLocation && post.location?.name) {
        const postCity = post.location.name.split(",")[0].toLowerCase();
        const userCity = userLocation.split(",")[0].toLowerCase();
        if (postCity.includes(userCity) || userCity.includes(postCity)) {
          score += 30;
        }
      }
      
      // Engagement score
      const upvotes = post.upvotes || 0;
      const comments = post.commentCount || 0;
      const verifications = post.verificationCount || 0;
      
      score += upvotes * 2;
      score += comments * 3;
      score += verifications * 5;
      
      // TRENDING BOOST: Calculate engagement velocity (engagement per hour)
      const ageHours = Math.max(1, (Date.now() - post._creationTime) / (1000 * 60 * 60));
      const engagementVelocity = (upvotes + comments * 2 + verifications * 3) / ageHours;
      
      // Posts with high velocity are "trending" - big boost
      if (engagementVelocity > 5) score += 100; // Very trending
      else if (engagementVelocity > 2) score += 50; // Trending
      else if (engagementVelocity > 1) score += 25; // Rising
      
      // Recency bonus (posts from last 24h get boost)
      if (ageHours < 6) score += 40; // Very fresh
      else if (ageHours < 24) score += 20;
      else if (ageHours < 72) score += 10;
      
      // Diversity bonus: Boost different content types
      if (post.postType === "poll") score += 15;
      if (post.postType === "reel" || post.reelId) score += 20;
      if (post.routeId) score += 15;
      
      // Quality signals
      if (post.isVerified) score += 30;
      if (post.media && post.media.length > 0) score += 10;
      
      return score;
    };

    // Sort each category by personalized score
    const sortByScore = (posts: typeof allPosts) => 
      [...posts].sort((a, b) => scorePost(b) - scorePost(a));

    // INCLUDE ALL POSTS - no filtering, just sort by score
    // This ensures every post appears in the feed for maximum engagement
    const allSortedPosts = sortByScore(allPosts);
    
    // Take up to limit posts, prioritizing variety
    const balancedPosts = allSortedPosts.slice(0, limit);

    const postsWithAuthors = await Promise.all(
      balancedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        // Get route data if this post is linked to a route
        let routeData = null;
        if (post.routeId) {
          const route = await ctx.db.get(post.routeId);
          if (route) {
            routeData = {
              _id: route._id,
              title: route.title,
              routeType: route.routeType,
              distance: route.distance,
              duration: route.duration,
              rating: route.rating,
              tags: route.tags,
              coordinates: route.coordinates,
              startLocation: route.startLocation,
              endLocation: route.endLocation,
              completionCount: route.completionCount,
            };
          }
        }

        // Get reel data if this post is linked to a reel
        let reelData = null;
        if (post.reelId) {
          const reel = await ctx.db.get(post.reelId);
          if (reel) {
            // Get reel author info
            const reelAuthor = await ctx.db.get(reel.authorId);
            reelData = {
              _id: reel._id,
              _creationTime: reel._creationTime,
              authorId: reel.authorId,
              videoUrl: reel.videoUrl,
              thumbnailUrl: reel.thumbnailUrl,
              caption: reel.caption,
              hashtags: reel.hashtags,
              location: reel.location,
              duration: reel.duration,
              views: reel.views,
              likes: reel.likes,
              shares: reel.shares,
              comments: reel.comments,
              // Include author info for display
              author: reelAuthor ? {
                _id: reelAuthor._id,
                name: reelAuthor.name,
                profileImage: reelAuthor.profileImage,
              } : null,
            };
          }
        }
        
        return {
          ...post,
          author,
          route: routeData,
          reel: reelData,
          type: "post" as const,
          timestamp: post._creationTime,
        };
      })
    );

    // Fetch recent public routes with creator data (standalone routes)
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .order("desc")
      .take(Math.ceil(limit * 0.3)); // 30% routes

    const routesWithCreators = await Promise.all(
      routes.map(async (route) => {
        const creator = await ctx.db.get(route.creatorId);
        return {
          ...route,
          creator,
          type: "route" as const,
          timestamp: route._creationTime,
        };
      })
    );

    // Fetch active livestreams to show in feed
    // Task 14.3: Only show livestreams with actual viewers or emergency streams
    const rawLivestreams = await ctx.db
      .query("livestreams")
      .filter((q) => q.and(
        q.eq(q.field("status"), "live"),
        q.neq(q.field("isPrivate"), true)
      ))
      .order("desc")
      .take(Math.ceil(limit * 0.4)); // Get more to filter
    
    // Filter livestreams: show only those with viewers > 0 OR emergency streams
    const activeLivestreams = rawLivestreams.filter(stream =>
      (stream.viewerCount && stream.viewerCount > 0) ||
      stream.isEmergency === true
    ).slice(0, Math.ceil(limit * 0.2));

    const livestreamsWithHosts = await Promise.all(
      activeLivestreams.map(async (stream) => {
        const host = await ctx.db.get(stream.hostId);
        return {
          _id: stream._id,
          _creationTime: stream._creationTime,
          type: "livestream" as const,
          timestamp: stream._creationTime,
          title: stream.title,
          description: stream.description,
          viewerCount: stream.viewerCount,
          isEmergency: stream.isEmergency,
          location: stream.location,
          host: host ? {
            _id: host._id,
            name: host.name,
            profileImage: host.profileImage,
          } : null,
          channelName: stream.channelName,
        };
      })
    );

    // Fetch recent active opportunities with creator data
    const allOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(Math.ceil(limit * 0.5)); // Get more to filter

    // Score opportunities based on user preferences
    const scoreOpportunity = (opp: typeof allOpportunities[0]) => {
      let score = 0;
      
      // Boost opportunities matching user's role preferences
      if (preferredOpportunityTypes.length > 0) {
        if (preferredOpportunityTypes.includes(opp.category)) {
          score += 50;
        }
      }
      
      // Boost opportunities from user's location
      if (userLocation && opp.location) {
        const oppCity = opp.location.split(",")[0].toLowerCase();
        const userCity = userLocation.split(",")[0].toLowerCase();
        if (oppCity.includes(userCity) || userCity.includes(oppCity)) {
          score += 40;
        }
      }
      
      // Lower credit cost = more accessible
      score += Math.max(0, 50 - (opp.creditCost || 0));
      
      return score;
    };

    // Sort and take top opportunities
    const sortedOpportunities = [...allOpportunities]
      .sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a))
      .slice(0, Math.ceil(limit * 0.2));

    const opportunitiesWithCreators = await Promise.all(
      sortedOpportunities.map(async (opp) => {
        const creator = await ctx.db.get(opp.creatorId);
        return {
          ...opp,
          creator,
          type: "opportunity" as const,
          timestamp: opp._creationTime,
        };
      })
    );

    // Process reels directly (not just posts with reelId)
    const reelsWithAuthors = await Promise.all(
      allReels.map(async (reel) => {
        const author = await ctx.db.get(reel.authorId);
        return {
          _id: reel._id,
          _creationTime: reel._creationTime,
          authorId: reel.authorId,
          postType: "reel" as const,
          type: "post" as const,
          timestamp: reel._creationTime,
          author,
          reel: {
            _id: reel._id,
            _creationTime: reel._creationTime,
            authorId: reel.authorId,
            videoUrl: reel.videoUrl,
            thumbnailUrl: reel.thumbnailUrl,
            caption: reel.caption,
            hashtags: reel.hashtags,
            location: reel.location,
            duration: reel.duration,
            views: reel.views,
            likes: reel.likes,
            shares: reel.shares,
            comments: reel.comments,
            author: author ? {
              _id: author._id,
              name: author.name,
              profileImage: author.profileImage,
            } : null,
          },
          reelId: reel._id,
          // Required post fields with defaults
          title: reel.caption || "Reel",
          description: reel.caption || "",
          lifeDimension: "social" as const,
          rating: 5,
          isVerified: false,
          isAnonymous: reel.isAnonymous,
          verificationCount: 0,
          upvotes: reel.likes,
          commentCount: reel.comments,
        };
      })
    );

    // Combine all items - include reels and livestreams directly
    const allItems = [
      ...postsWithAuthors,
      ...reelsWithAuthors,
      ...routesWithCreators,
      ...opportunitiesWithCreators,
      ...livestreamsWithHosts,
    ];

    // Smart shuffle: Sort by timestamp but interleave content types
    // First sort by timestamp
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    // Then interleave to avoid clusters of same type
    const interleaved: typeof allItems = [];
    const byType: Record<string, typeof allItems> = {};
    
    for (const item of allItems) {
      // Categorize by content type for better interleaving
      let typeKey: string = item.type;
      if (item.type === "post") {
        const postItem = item as any;
        if (postItem.reel || postItem.reelId || postItem.postType === "reel") {
          typeKey = "reel";
        } else if (postItem.postType === "poll") {
          typeKey = "poll";
        } else if (postItem.route || postItem.routeId) {
          typeKey = "route_post";
        } else {
          typeKey = "post_standard";
        }
      }
      if (!byType[typeKey]) byType[typeKey] = [];
      byType[typeKey].push(item);
    }

    // Round-robin interleave
    let hasMore = true;
    let idx = 0;
    const typeKeys = Object.keys(byType);
    while (hasMore && interleaved.length < limit) {
      hasMore = false;
      for (const key of typeKeys) {
        if (byType[key].length > idx) {
          interleaved.push(byType[key][idx]);
          hasMore = true;
          if (interleaved.length >= limit) break;
        }
      }
      idx++;
    }

    return interleaved.slice(0, limit);
  },
});

/**
 * Get filtered unified feed by content type
 */
export const getFilteredFeed = query({
  args: {
    contentType: v.optional(
      v.union(v.literal("post"), v.literal("route"), v.literal("opportunity"), v.literal("all"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const contentType = args.contentType ?? "all";

    if (contentType === "all") {
      // Return unified feed
      const allFeed = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit);
      
      return allFeed.map((post) => ({
        ...post,
        type: "post" as const,
        timestamp: post._creationTime,
      }));
    }

    if (contentType === "post") {
      const posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit);
      
      return posts.map((post) => ({
        ...post,
        type: "post" as const,
        timestamp: post._creationTime,
      }));
    }

    if (contentType === "route") {
      const routes = await ctx.db
        .query("routes")
        .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
        .order("desc")
        .take(limit);
      
      return routes.map((route) => ({
        ...route,
        type: "route" as const,
        timestamp: route._creationTime,
      }));
    }

    if (contentType === "opportunity") {
      const opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(limit);
      
      return opportunities.map((opp) => ({
        ...opp,
        type: "opportunity" as const,
        timestamp: opp._creationTime,
      }));
    }

    return [];
  },
});

/**
 * Get public recent activity for landing page (no auth required)
 * Returns anonymized activity data
 */
export const getPublicActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const activities: Array<{
      type: "post" | "route" | "opportunity";
      message: string;
      timestamp: number;
      color: string;
    }> = [];

    // Get recent posts
    const recentPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(3);

    for (const post of recentPosts) {
      const author = await ctx.db.get(post.authorId);
      const firstName = author?.name?.split(" ")[0] || "Someone";
      const locationName = post.location?.name ? ` in ${post.location.name.split(",")[0]}` : "";
      
      activities.push({
        type: "post",
        message: `${firstName} shared a ${post.lifeDimension} experience${locationName}`,
        timestamp: post._creationTime,
        color: "green",
      });
    }

    // Get recent routes
    const recentRoutes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .order("desc")
      .take(3);

    for (const route of recentRoutes) {
      const creator = await ctx.db.get(route.creatorId);
      const firstName = creator?.name?.split(" ")[0] || "Someone";
      const distance = route.distance ? `${(route.distance / 1000).toFixed(1)}km` : "";
      
      activities.push({
        type: "route",
        message: `${firstName} shared a ${distance} safe route${route.tags?.length ? ` (${route.tags[0]})` : ""}`,
        timestamp: route._creationTime,
        color: "blue",
      });
    }

    // Get recent opportunities
    const recentOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(3);

    for (const opp of recentOpportunities) {
      const creator = await ctx.db.get(opp.creatorId);
      const firstName = creator?.name?.split(" ")[0] || "Someone";
      
      activities.push({
        type: "opportunity",
        message: `${firstName} posted a ${opp.category} opportunity${opp.location ? ` in ${opp.location.split(",")[0]}` : ""}`,
        timestamp: opp._creationTime,
        color: "purple",
      });
    }

    // Sort by timestamp and take limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});


/**
 * Get public feed for landing page (no auth required)
 * Returns posts that are suitable for public viewing
 */
export const getPublicFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    try {
      // Get recent posts - prioritize those with good engagement
      const posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(limit * 2); // Get more to filter

      // If no posts, return empty array
      if (!posts || posts.length === 0) {
        return [];
      }

      const publicPosts = await Promise.all(
        posts.map(async (post) => {
          try {
            const author = post.authorId ? await ctx.db.get(post.authorId) : null;
            
            // Use stored commentCount instead of querying comments table
            const commentCount = post.commentCount ?? 0;

            return {
              _id: post._id,
              _creationTime: post._creationTime,
              title: post.title || "",
              content: post.description || "",
              category: post.lifeDimension || post.postType || "general",
              location: post.location?.name || null,
              rating: post.rating || 0,
              upvotes: post.upvotes || 0,
              commentCount: commentCount,
              isAnonymous: post.isAnonymous ?? false,
              authorName: post.isAnonymous ? null : (author?.name || null),
              type: "post" as const,
            };
          } catch {
            // Skip posts that fail to process
            return null;
          }
        })
      );

      // Filter out null entries and posts with very little content
      const filteredPosts = publicPosts.filter(
        (post): post is NonNullable<typeof post> => 
          post !== null && typeof post.content === 'string' && post.content.length > 20
      );

      return filteredPosts.slice(0, limit);
    } catch {
      // Return empty array on any error to prevent page crash
      return [];
    }
  },
});
