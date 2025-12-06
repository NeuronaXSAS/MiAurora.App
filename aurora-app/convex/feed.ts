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

    // IMPROVED FEED ALGORITHM v2.0
    // Prioritizes: Fresh content > Engagement velocity > Accumulated engagement
    // Goal: Let new genuine posts shine while keeping engaging content visible
    
    const scorePost = (post: typeof allPosts[0]) => {
      const ageHours = Math.max(0.1, (Date.now() - post._creationTime) / (1000 * 60 * 60));
      const ageDays = ageHours / 24;
      
      // === FRESHNESS SCORE (Primary factor) ===
      // New posts get massive initial boost that decays over time
      let freshnessScore = 0;
      if (ageHours < 1) freshnessScore = 200;        // Brand new (< 1 hour)
      else if (ageHours < 3) freshnessScore = 150;   // Very fresh (1-3 hours)
      else if (ageHours < 6) freshnessScore = 100;   // Fresh (3-6 hours)
      else if (ageHours < 12) freshnessScore = 70;   // Recent (6-12 hours)
      else if (ageHours < 24) freshnessScore = 50;   // Today (12-24 hours)
      else if (ageDays < 3) freshnessScore = 30;     // This week
      else if (ageDays < 7) freshnessScore = 15;     // Last week
      else freshnessScore = 5;                        // Older content
      
      // === ENGAGEMENT VELOCITY (Secondary factor) ===
      // Rewards posts that are gaining traction quickly
      const upvotes = post.upvotes || 0;
      const comments = post.commentCount || 0;
      const verifications = post.verificationCount || 0;
      
      const totalEngagement = upvotes + comments * 2 + verifications * 3;
      const engagementVelocity = totalEngagement / ageHours;
      
      let velocityScore = 0;
      if (engagementVelocity > 10) velocityScore = 150;  // Viral
      else if (engagementVelocity > 5) velocityScore = 100;  // Hot
      else if (engagementVelocity > 2) velocityScore = 60;   // Trending
      else if (engagementVelocity > 1) velocityScore = 30;   // Rising
      else if (engagementVelocity > 0.5) velocityScore = 15; // Active
      
      // === ACCUMULATED ENGAGEMENT (Tertiary factor) ===
      // Still matters but with diminishing returns and time decay
      const engagementDecay = Math.pow(0.85, ageDays); // 15% decay per day
      const rawEngagementScore = Math.min(100, upvotes * 1.5 + comments * 2 + verifications * 3);
      const engagementScore = rawEngagementScore * engagementDecay;
      
      // === PERSONALIZATION BONUS ===
      let personalizationScore = 0;
      
      // Match user's preferred dimensions
      if (preferredDimensions.length > 0 && post.lifeDimension) {
        if (preferredDimensions.includes(post.lifeDimension)) {
          personalizationScore += 40;
        }
      }
      
      // Location relevance
      if (userLocation && post.location?.name) {
        const postCity = post.location.name.split(",")[0].toLowerCase();
        const userCity = userLocation.split(",")[0].toLowerCase();
        if (postCity.includes(userCity) || userCity.includes(postCity)) {
          personalizationScore += 25;
        }
      }
      
      // === CONTENT TYPE DIVERSITY BONUS ===
      let diversityScore = 0;
      if (post.postType === "poll") diversityScore = 20;
      else if (post.postType === "reel" || post.reelId) diversityScore = 25;
      else if (post.routeId) diversityScore = 20;
      
      // === QUALITY SIGNALS ===
      let qualityScore = 0;
      if (post.isVerified) qualityScore += 25;
      if (post.media && post.media.length > 0) qualityScore += 15;
      if (post.description && post.description.length > 100) qualityScore += 10; // Thoughtful content
      
      // === NEW USER BOOST ===
      // Give new users' first posts extra visibility to encourage participation
      // (This would need author creation time, approximating with low engagement + fresh)
      let newUserBoost = 0;
      if (ageHours < 24 && totalEngagement < 5) {
        newUserBoost = 30; // Help new genuine posts get discovered
      }
      
      // === FINAL SCORE CALCULATION ===
      // Weighted combination prioritizing freshness and velocity
      const finalScore = 
        freshnessScore * 1.5 +      // Freshness is king
        velocityScore * 1.2 +        // Velocity shows quality
        engagementScore * 0.8 +      // Engagement matters but less
        personalizationScore * 1.0 + // Personalization is important
        diversityScore * 0.8 +       // Encourage variety
        qualityScore * 0.6 +         // Quality signals
        newUserBoost;                // Help newcomers
      
      return Math.round(finalScore);
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

    // Task 11.1: Fetch trending debates to include in feed
    const today = new Date().toISOString().split('T')[0];
    const trendingDebates = await ctx.db
      .query("dailyDebates")
      .withIndex("by_date", (q) => q.eq("date", today))
      .take(6);
    
    // Filter debates with high engagement
    const hotDebates = trendingDebates
      .filter(d => {
        const totalVotes = (d.agreeCount || 0) + (d.disagreeCount || 0) + (d.neutralCount || 0);
        return totalVotes >= 5; // Only show debates with 5+ votes
      })
      .slice(0, 2); // Max 2 debates in feed

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

    // Task 11.1: Process trending debates for feed
    const debatesForFeed = hotDebates.map((debate) => ({
      _id: debate._id,
      _creationTime: debate._creationTime,
      type: "debate" as const,
      timestamp: debate._creationTime,
      title: debate.title,
      summary: debate.summary,
      category: debate.category,
      sourceUrl: debate.sourceUrl,
      sourceName: debate.sourceName,
      imageUrl: debate.imageUrl,
      agreeCount: debate.agreeCount || 0,
      disagreeCount: debate.disagreeCount || 0,
      neutralCount: debate.neutralCount || 0,
      totalVotes: (debate.agreeCount || 0) + (debate.disagreeCount || 0) + (debate.neutralCount || 0),
    }));

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

    // Combine all items - include reels, livestreams, and debates
    const allItems = [
      ...postsWithAuthors,
      ...reelsWithAuthors,
      ...routesWithCreators,
      ...opportunitiesWithCreators,
      ...livestreamsWithHosts,
      ...debatesForFeed, // Task 11.1: Include trending debates
    ];

    // IMPROVED FEED MIXING ALGORITHM v2.0
    // Goals: 
    // 1. Show variety of content types
    // 2. Mix fresh content with trending content
    // 3. Ensure new genuine posts get visibility
    // 4. Keep the feed feeling alive and dynamic
    
    // Categorize items by type and freshness
    const categorizeItem = (item: typeof allItems[0]) => {
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
      } else if (item.type === "debate") {
        typeKey = "debate"; // Task 11.1: Debates as separate category
      }
      
      // Also categorize by freshness
      const ageHours = (Date.now() - item.timestamp) / (1000 * 60 * 60);
      const freshnessKey = ageHours < 6 ? "fresh" : ageHours < 24 ? "recent" : "older";
      
      return { typeKey, freshnessKey };
    };
    
    // Separate items into buckets
    const freshItems: typeof allItems = [];
    const recentItems: typeof allItems = [];
    const olderItems: typeof allItems = [];
    
    for (const item of allItems) {
      const { freshnessKey } = categorizeItem(item);
      if (freshnessKey === "fresh") freshItems.push(item);
      else if (freshnessKey === "recent") recentItems.push(item);
      else olderItems.push(item);
    }
    
    // Sort each bucket by score (already calculated in posts)
    // For non-posts, sort by timestamp
    const sortBucket = (bucket: typeof allItems) => {
      return bucket.sort((a, b) => {
        // Posts have scores, others use timestamp
        const scoreA = (a as any).score ?? b.timestamp;
        const scoreB = (b as any).score ?? a.timestamp;
        return scoreB - scoreA;
      });
    };
    
    sortBucket(freshItems);
    sortBucket(recentItems);
    sortBucket(olderItems);
    
    // Build final feed with smart mixing
    // Pattern: Fresh, Fresh, Recent, Fresh, Older, Fresh, Recent, Recent, Older...
    // This ensures new content dominates but older quality content still appears
    const interleaved: typeof allItems = [];
    const pattern = ["fresh", "fresh", "recent", "fresh", "older", "fresh", "recent", "recent", "older", "fresh"];
    
    const buckets = {
      fresh: [...freshItems],
      recent: [...recentItems],
      older: [...olderItems],
    };
    
    let patternIndex = 0;
    let consecutiveSameType = 0;
    let lastTypeKey = "";
    
    while (interleaved.length < limit) {
      const bucketKey = pattern[patternIndex % pattern.length] as keyof typeof buckets;
      let bucket = buckets[bucketKey];
      
      // If preferred bucket is empty, try others
      if (bucket.length === 0) {
        const fallbackOrder = ["fresh", "recent", "older"];
        for (const fallback of fallbackOrder) {
          if (buckets[fallback as keyof typeof buckets].length > 0) {
            bucket = buckets[fallback as keyof typeof buckets];
            break;
          }
        }
      }
      
      // If all buckets empty, we're done
      if (bucket.length === 0) break;
      
      // Find an item that doesn't create too many consecutive same-type items
      let selectedIndex = 0;
      for (let i = 0; i < Math.min(5, bucket.length); i++) {
        const { typeKey } = categorizeItem(bucket[i]);
        if (typeKey !== lastTypeKey || consecutiveSameType < 2) {
          selectedIndex = i;
          break;
        }
      }
      
      const selectedItem = bucket.splice(selectedIndex, 1)[0];
      const { typeKey } = categorizeItem(selectedItem);
      
      // Track consecutive same-type items
      if (typeKey === lastTypeKey) {
        consecutiveSameType++;
      } else {
        consecutiveSameType = 1;
        lastTypeKey = typeKey;
      }
      
      interleaved.push(selectedItem);
      patternIndex++;
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
