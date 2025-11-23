/**
 * Intelligence aggregation and query functions
 * Builds Corporate Safety Index and Urban Safety Index from user-generated data
 */

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Internal mutation to aggregate Corporate Safety Index
 * Called by scheduled job
 */
export const aggregateCorporateSafety = internalMutation({
  handler: async (ctx) => {
    console.log("Starting Corporate Safety Index aggregation...");
    
    // Get all workplace posts (professional dimension)
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_dimension", (q) => q.eq("lifeDimension", "professional"))
      .collect();
    
    // Group posts by company name
    const companyData = new Map<string, {
      posts: typeof posts;
      totalRating: number;
      ratingCount: number;
      trustScoreSum: number;
    }>();
    
    for (const post of posts) {
      // Extract company name from title or description
      const companyName = extractCompanyName(post.title, post.description);
      if (!companyName) continue;
      
      const existing = companyData.get(companyName) || {
        posts: [],
        totalRating: 0,
        ratingCount: 0,
        trustScoreSum: 0,
      };
      
      existing.posts.push(post);
      existing.totalRating += post.rating;
      existing.ratingCount += 1;
      
      // Get author trust score
      const author = await ctx.db.get(post.authorId);
      if (author) {
        existing.trustScoreSum += author.trustScore;
      }
      
      companyData.set(companyName, existing);
    }
    
    // Aggregate data for each company
    let aggregatedCount = 0;
    for (const [companyName, data] of companyData.entries()) {
      if (data.posts.length < 3) continue; // Need at least 3 reviews
      
      const averageRating = data.totalRating / data.ratingCount;
      const avgTrustScore = data.trustScoreSum / data.posts.length;
      
      // Calculate dimension scores
      const scores = calculateCorporateScores(data.posts, averageRating);
      
      // Extract risk and positive factors
      const { riskFactors, positiveFactors } = extractFactors(data.posts);
      
      // Check if entry exists
      const existing = await ctx.db
        .query("corporateSafetyIndex")
        .withIndex("by_company", (q) => q.eq("companyName", companyName))
        .first();
      
      const indexData = {
        companyName,
        industry: extractIndustry(data.posts),
        overallScore: scores.overall,
        harassmentScore: scores.harassment,
        inclusionScore: scores.inclusion,
        workLifeBalanceScore: scores.workLifeBalance,
        careerGrowthScore: scores.careerGrowth,
        compensationScore: scores.compensationScore,
        totalReviews: data.posts.length,
        averageRating,
        monthlyTrend: {
          overallChange: 0, // TODO: Calculate from historical data
          reviewCountChange: 0,
          lastUpdated: Date.now(),
        },
        riskFactors,
        positiveFactors,
        dataQuality: {
          completeness: calculateCompleteness(data.posts),
          recency: calculateRecency(data.posts),
          trustScoreAvg: avgTrustScore,
        },
        lastAggregated: Date.now(),
      };
      
      if (existing) {
        await ctx.db.patch(existing._id, indexData);
      } else {
        await ctx.db.insert("corporateSafetyIndex", indexData);
      }
      
      aggregatedCount++;
    }
    
    console.log(`Corporate Safety Index: Aggregated ${aggregatedCount} companies`);
    return { success: true, companiesAggregated: aggregatedCount };
  },
});

/**
 * Internal mutation to aggregate Urban Safety Index
 * Called by scheduled job
 */
export const aggregateUrbanSafety = internalMutation({
  handler: async (ctx) => {
    console.log("Starting Urban Safety Index aggregation...");
    
    // Get all public routes
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_sharing", (q) => q.eq("sharingLevel", "public"))
      .collect();
    
    // Group routes by geographic grid (0.01 degree ≈ 1km)
    type RouteType = typeof routes[number];
    const gridData = new Map<string, {
      routes: RouteType[];
      totalRating: number;
      ratingCount: number;
      trustScoreSum: number;
      hourlyRatings: number[]; // 24 hours
      hourlyCount: number[];
    }>();
    
    for (const route of routes) {
      if (!route.coordinates || route.coordinates.length === 0) continue;
      
      // Use midpoint of route for grid assignment
      const midpoint = route.coordinates[Math.floor(route.coordinates.length / 2)];
      const gridLat = Math.round(midpoint.lat * 100) / 100; // Round to 2 decimals
      const gridLng = Math.round(midpoint.lng * 100) / 100;
      const gridKey = `${gridLat},${gridLng}`;
      
      const existing = gridData.get(gridKey) || {
        routes: [] as RouteType[],
        totalRating: 0,
        ratingCount: 0,
        trustScoreSum: 0,
        hourlyRatings: new Array(24).fill(0),
        hourlyCount: new Array(24).fill(0),
      };
      
      existing.routes.push(route);
      existing.totalRating += route.rating;
      existing.ratingCount += 1;
      
      // Get creator trust score
      const creator = await ctx.db.get(route.creatorId);
      if (creator) {
        existing.trustScoreSum += creator.trustScore;
      }
      
      // Calculate hour of day from first coordinate timestamp
      if (route.coordinates[0]?.timestamp) {
        const hour = new Date(route.coordinates[0].timestamp).getHours();
        existing.hourlyRatings[hour] += route.rating;
        existing.hourlyCount[hour] += 1;
      }
      
      gridData.set(gridKey, existing);
    }
    
    // Aggregate data for each grid cell
    let aggregatedCount = 0;
    for (const [gridKey, data] of gridData.entries()) {
      if (data.routes.length < 5) continue; // Need at least 5 routes
      
      const [gridLat, gridLng] = gridKey.split(',').map(Number);
      const averageRating = data.totalRating / data.ratingCount;
      const avgTrustScore = data.trustScoreSum / data.routes.length;
      
      // Calculate safety by hour
      const safetyByHour = data.hourlyRatings.map((sum, hour) => {
        const count = data.hourlyCount[hour];
        if (count === 0) return 50; // Default neutral score
        const avgRating = sum / count;
        return ratingToScore(avgRating); // Convert 1-5 to 0-100
      });
      
      // Calculate day vs night scores
      const dayHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
      const nightHours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
      
      const dayScore = calculateAverageScore(safetyByHour, dayHours);
      const nightScore = calculateAverageScore(safetyByHour, nightHours);
      
      // Extract risk factors and safety features from tags
      const { riskFactors, safetyFeatures } = extractUrbanFactors(data.routes);
      
      // Count route types
      const routeTypes = {
        walking: data.routes.filter(r => r.routeType === "walking").length,
        running: data.routes.filter(r => r.routeType === "running").length,
        cycling: data.routes.filter(r => r.routeType === "cycling").length,
        commuting: data.routes.filter(r => r.routeType === "commuting").length,
      };
      
      // Check if entry exists
      const existing = await ctx.db
        .query("urbanSafetyIndex")
        .withIndex("by_grid", (q) => q.eq("gridLat", gridLat).eq("gridLng", gridLng))
        .first();
      
      const indexData = {
        gridLat,
        gridLng,
        city: await extractCity(data.routes[0].startLocation),
        neighborhood: undefined,
        country: undefined,
        overallScore: ratingToScore(averageRating),
        dayScore,
        nightScore,
        safetyByHour,
        totalRoutes: data.routes.length,
        averageRating,
        riskFactors,
        safetyFeatures,
        routeTypes,
        dataQuality: {
          completeness: calculateUrbanCompleteness(data.routes),
          recency: calculateRecency(data.routes),
          trustScoreAvg: avgTrustScore,
        },
        lastAggregated: Date.now(),
      };
      
      if (existing) {
        await ctx.db.patch(existing._id, indexData);
      } else {
        await ctx.db.insert("urbanSafetyIndex", indexData);
      }
      
      aggregatedCount++;
    }
    
    console.log(`Urban Safety Index: Aggregated ${aggregatedCount} grid cells`);
    return { success: true, gridCellsAggregated: aggregatedCount };
  },
});

/**
 * Query Corporate Safety Index by company name
 */
export const getCorporateSafety = query({
  args: { companyName: v.string() },
  handler: async (ctx, args) => {
    const index = await ctx.db
      .query("corporateSafetyIndex")
      .withIndex("by_company", (q) => q.eq("companyName", args.companyName))
      .first();
    
    return index;
  },
});

/**
 * Query top/bottom companies by safety score
 */
export const getTopCompanies = query({
  args: { 
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("best"), v.literal("worst"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const companies = await ctx.db
      .query("corporateSafetyIndex")
      .withIndex("by_score")
      .order(args.sortBy === "worst" ? "asc" : "desc")
      .take(limit);
    
    return companies;
  },
});

/**
 * Query Urban Safety Index by geographic bounds
 */
export const getUrbanSafety = query({
  args: {
    minLat: v.number(),
    maxLat: v.number(),
    minLng: v.number(),
    maxLng: v.number(),
  },
  handler: async (ctx, args) => {
    // Query all grid cells within bounds
    const allCells = await ctx.db.query("urbanSafetyIndex").collect();
    
    const cellsInBounds = allCells.filter(cell => 
      cell.gridLat >= args.minLat &&
      cell.gridLat <= args.maxLat &&
      cell.gridLng >= args.minLng &&
      cell.gridLng <= args.maxLng
    );
    
    return cellsInBounds;
  },
});

/**
 * Query Urban Safety Index by city
 */
export const getUrbanSafetyByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    const cells = await ctx.db
      .query("urbanSafetyIndex")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
    
    return cells;
  },
});

// Helper functions

function extractCompanyName(title: string, description: string): string | null {
  // Simple extraction - look for company keywords
  const text = `${title} ${description}`.toLowerCase();
  
  // Common patterns: "at [Company]", "working at [Company]", "[Company] workplace"
  const patterns = [
    /(?:at|@)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s|$|,|\.|!)/,
    /([A-Z][a-zA-Z0-9\s&]+?)\s+(?:workplace|office|company)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function calculateCorporateScores(posts: any[], averageRating: number) {
  // Convert 1-5 rating to 0-100 score
  const baseScore = ratingToScore(averageRating);
  
  // Analyze descriptions for specific dimensions
  const allText = posts.map(p => `${p.title} ${p.description}`.toLowerCase()).join(' ');
  
  return {
    overall: baseScore,
    harassment: calculateDimensionScore(allText, ['harassment', 'toxic', 'hostile', 'discrimination'], true),
    inclusion: calculateDimensionScore(allText, ['inclusive', 'diverse', 'welcoming', 'supportive'], false),
    workLifeBalance: calculateDimensionScore(allText, ['balance', 'flexible', 'overtime', 'burnout'], false),
    careerGrowth: calculateDimensionScore(allText, ['growth', 'promotion', 'learning', 'development'], false),
    compensationScore: calculateDimensionScore(allText, ['salary', 'pay', 'compensation', 'benefits'], false),
  };
}

function calculateDimensionScore(text: string, keywords: string[], inverse: boolean): number {
  let score = 50; // Start neutral
  
  for (const keyword of keywords) {
    const count = (text.match(new RegExp(keyword, 'g')) || []).length;
    if (inverse) {
      score -= count * 5; // Negative keywords reduce score
    } else {
      score += count * 5; // Positive keywords increase score
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function extractFactors(posts: any[]) {
  const allText = posts.map(p => `${p.title} ${p.description}`.toLowerCase()).join(' ');
  
  const riskKeywords = ['toxic', 'harassment', 'discrimination', 'hostile', 'turnover', 'burnout'];
  const positiveKeywords = ['flexible', 'supportive', 'inclusive', 'growth', 'benefits', 'culture'];
  
  const riskFactors = riskKeywords.filter(k => allText.includes(k));
  const positiveFactors = positiveKeywords.filter(k => allText.includes(k));
  
  return { riskFactors, positiveFactors };
}

function extractUrbanFactors(routes: any[]) {
  const allTags = routes.flatMap(r => r.tags || []).map(t => t.toLowerCase());
  
  const riskKeywords = ['dark', 'isolated', 'unsafe', 'poorly lit', 'deserted', 'dangerous'];
  const safetyKeywords = ['well-lit', 'busy', 'safe', 'police', 'crowded', 'secure'];
  
  const riskFactors = [...new Set(allTags.filter(t => riskKeywords.some(k => t.includes(k))))];
  const safetyFeatures = [...new Set(allTags.filter(t => safetyKeywords.some(k => t.includes(k))))];
  
  return { riskFactors, safetyFeatures };
}

function extractIndustry(posts: any[]): string | undefined {
  // Simple industry extraction from text
  const allText = posts.map(p => `${p.title} ${p.description}`.toLowerCase()).join(' ');
  
  const industries = ['tech', 'finance', 'healthcare', 'retail', 'education', 'manufacturing'];
  for (const industry of industries) {
    if (allText.includes(industry)) {
      return industry;
    }
  }
  
  return undefined;
}

async function extractCity(location: any): Promise<string | undefined> {
  // In production, use reverse geocoding API
  // For now, return location name if available
  return location?.name?.split(',')[0];
}

function ratingToScore(rating: number): number {
  // Convert 1-5 rating to 0-100 score
  return Math.round(((rating - 1) / 4) * 100);
}

function calculateAverageScore(scores: number[], hours: number[]): number {
  const relevantScores = hours.map(h => scores[h]).filter(s => s > 0);
  if (relevantScores.length === 0) return 50;
  return Math.round(relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length);
}

function calculateCompleteness(posts: any[]): number {
  // Check how many posts have complete data
  let completeCount = 0;
  for (const post of posts) {
    if (post.title && post.description && post.rating && post.location) {
      completeCount++;
    }
  }
  return Math.round((completeCount / posts.length) * 100);
}

function calculateUrbanCompleteness(routes: any[]): number {
  // Check how many routes have complete data
  let completeCount = 0;
  for (const route of routes) {
    if (route.coordinates?.length > 0 && route.rating && route.tags?.length > 0) {
      completeCount++;
    }
  }
  return Math.round((completeCount / routes.length) * 100);
}

function calculateRecency(items: any[]): number {
  // Calculate days since most recent item
  const now = Date.now();
  const timestamps = items.map(i => i._creationTime);
  const mostRecent = Math.max(...timestamps);
  const daysSince = Math.floor((now - mostRecent) / (1000 * 60 * 60 * 24));
  return daysSince;
}


/**
 * Manual trigger for testing aggregation (admin only)
 * Note: This should be called as an action, not a mutation
 */
export const triggerAggregation = query({
  handler: async (ctx) => {
    // This is just a placeholder - actual aggregation should be triggered via cron or manual action
    return {
      message: "Use the cron job or call aggregateCorporateSafety/aggregateUrbanSafety directly",
    };
  },
});

/**
 * Get aggregation statistics
 */
export const getAggregationStats = query({
  handler: async (ctx) => {
    const corporateCount = await ctx.db.query("corporateSafetyIndex").collect();
    const urbanCount = await ctx.db.query("urbanSafetyIndex").collect();
    
    // Get most recent aggregation times
    const recentCorporate = corporateCount.sort((a, b) => b.lastAggregated - a.lastAggregated)[0];
    const recentUrban = urbanCount.sort((a, b) => b.lastAggregated - a.lastAggregated)[0];
    
    return {
      corporate: {
        totalCompanies: corporateCount.length,
        lastAggregated: recentCorporate?.lastAggregated,
        avgDataQuality: corporateCount.reduce((sum, c) => sum + c.dataQuality.completeness, 0) / corporateCount.length || 0,
      },
      urban: {
        totalGridCells: urbanCount.length,
        lastAggregated: recentUrban?.lastAggregated,
        avgDataQuality: urbanCount.reduce((sum, c) => sum + c.dataQuality.completeness, 0) / urbanCount.length || 0,
      },
    };
  },
});
