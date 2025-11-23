/**
 * User Profiling System
 * Tracks user behavior and preferences for personalization
 */

import { Id } from '../convex/_generated/dataModel';

export interface UserProfile {
  userId: Id<'users'>;
  
  // Demographics
  location?: string;
  industry?: string;
  careerGoals?: string[];
  interests?: string[];
  
  // Behavior Patterns
  contentConsumption: {
    lifeDimensions: Record<string, number>; // dimension -> view count
    postTypes: Record<string, number>; // type -> interaction count
    avgSessionDuration: number;
    peakActivityHours: number[];
    preferredContentLength: 'short' | 'medium' | 'long';
  };
  
  // Engagement Patterns
  engagement: {
    likesGiven: number;
    commentsGiven: number;
    sharesGiven: number;
    verificationsGiven: number;
    avgEngagementRate: number;
    topEngagedCreators: string[];
  };
  
  // Route Preferences
  routePreferences: {
    preferredDistance: number;
    preferredDuration: number;
    preferredTags: string[];
    safetyThreshold: number;
    completedRoutes: number;
    sharedRoutes: number;
  };
  
  // Credit Behavior
  creditBehavior: {
    totalEarned: number;
    totalSpent: number;
    avgMonthlyEarnings: number;
    spendingCategories: Record<string, number>;
    savingsRate: number;
  };
  
  // Social Graph
  socialGraph: {
    followersCount: number;
    followingCount: number;
    mutualConnections: number;
    messagesSent: number;
    messagesReceived: number;
    responseRate: number;
  };
  
  // Content Creation
  contentCreation: {
    postsCreated: number;
    routesShared: number;
    opportunitiesCreated: number;
    avgPostQuality: number;
    viralContentCount: number;
  };
  
  // Personalization Scores
  personalizationScores: {
    explorationScore: number; // 0-1: how much they explore new content
    engagementScore: number; // 0-1: how actively they engage
    creatorScore: number; // 0-1: how much they create vs consume
    communityScore: number; // 0-1: how connected they are
    safetyScore: number; // 0-1: how safety-conscious they are
  };
  
  // ML Features
  mlFeatures: {
    userEmbedding?: number[]; // Vector representation of user
    contentAffinityScores: Record<string, number>;
    similarUsers: string[];
  };
  
  lastUpdated: number;
}

/**
 * Calculate user profile from activity data
 */
export class UserProfiler {
  /**
   * Build comprehensive user profile
   */
  static buildProfile(
    userId: Id<'users'>,
    userData: any,
    activityData: {
      posts: any[];
      routes: any[];
      comments: any[];
      votes: any[];
      transactions: any[];
      messages: any[];
    }
  ): UserProfile {
    return {
      userId,
      location: userData.location,
      industry: userData.industry,
      careerGoals: userData.careerGoals || [],
      interests: userData.interests || [],
      
      contentConsumption: this.analyzeContentConsumption(activityData),
      engagement: this.analyzeEngagement(activityData),
      routePreferences: this.analyzeRoutePreferences(activityData),
      creditBehavior: this.analyzeCreditBehavior(activityData),
      socialGraph: this.analyzeSocialGraph(userData, activityData),
      contentCreation: this.analyzeContentCreation(activityData),
      personalizationScores: this.calculatePersonalizationScores(activityData),
      mlFeatures: this.extractMLFeatures(activityData),
      
      lastUpdated: Date.now(),
    };
  }

  /**
   * Analyze content consumption patterns
   */
  private static analyzeContentConsumption(activityData: any) {
    const lifeDimensions: Record<string, number> = {};
    const postTypes: Record<string, number> = {};
    
    // Count views by dimension
    activityData.posts.forEach((post: any) => {
      if (post.lifeDimension) {
        lifeDimensions[post.lifeDimension] = (lifeDimensions[post.lifeDimension] || 0) + 1;
      }
      
      const type = post.type || 'standard';
      postTypes[type] = (postTypes[type] || 0) + 1;
    });
    
    return {
      lifeDimensions,
      postTypes,
      avgSessionDuration: 0, // Would be calculated from session data
      peakActivityHours: this.calculatePeakHours(activityData),
      preferredContentLength: this.inferContentLengthPreference(activityData),
    };
  }

  /**
   * Analyze engagement patterns
   */
  private static analyzeEngagement(activityData: any) {
    const votes = activityData.votes || [];
    const comments = activityData.comments || [];
    
    const likesGiven = votes.filter((v: any) => v.value === 1).length;
    const commentsGiven = comments.length;
    
    // Calculate top engaged creators
    const creatorEngagement: Record<string, number> = {};
    [...votes, ...comments].forEach((item: any) => {
      if (item.targetAuthorId) {
        creatorEngagement[item.targetAuthorId] = (creatorEngagement[item.targetAuthorId] || 0) + 1;
      }
    });
    
    const topEngagedCreators = Object.entries(creatorEngagement)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);
    
    return {
      likesGiven,
      commentsGiven,
      sharesGiven: 0, // Would track shares
      verificationsGiven: 0, // Would track verifications
      avgEngagementRate: this.calculateEngagementRate(activityData),
      topEngagedCreators,
    };
  }

  /**
   * Analyze route preferences
   */
  private static analyzeRoutePreferences(activityData: any) {
    const routes = activityData.routes || [];
    
    if (routes.length === 0) {
      return {
        preferredDistance: 5000, // Default 5km
        preferredDuration: 1800, // Default 30min
        preferredTags: [],
        safetyThreshold: 3.5,
        completedRoutes: 0,
        sharedRoutes: 0,
      };
    }
    
    const distances = routes.map((r: any) => r.distance || 0);
    const durations = routes.map((r: any) => r.duration || 0);
    const allTags = routes.flatMap((r: any) => r.tags || []);
    
    // Calculate tag frequencies
    const tagCounts: Record<string, number> = {};
    allTags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    const preferredTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
    
    return {
      preferredDistance: this.calculateMedian(distances),
      preferredDuration: this.calculateMedian(durations),
      preferredTags,
      safetyThreshold: 3.5,
      completedRoutes: routes.filter((r: any) => r.status === 'completed').length,
      sharedRoutes: routes.filter((r: any) => r.isPublic).length,
    };
  }

  /**
   * Analyze credit behavior
   */
  private static analyzeCreditBehavior(activityData: any) {
    const transactions = activityData.transactions || [];
    
    const earned = transactions.filter((t: any) => t.type === 'earn');
    const spent = transactions.filter((t: any) => t.type === 'spend');
    
    const totalEarned = earned.reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalSpent = spent.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    // Calculate spending by category
    const spendingCategories: Record<string, number> = {};
    spent.forEach((t: any) => {
      const category = t.category || 'other';
      spendingCategories[category] = (spendingCategories[category] || 0) + t.amount;
    });
    
    return {
      totalEarned,
      totalSpent,
      avgMonthlyEarnings: totalEarned / Math.max(1, this.getMonthsSinceSignup(activityData)),
      spendingCategories,
      savingsRate: totalEarned > 0 ? (totalEarned - totalSpent) / totalEarned : 0,
    };
  }

  /**
   * Analyze social graph
   */
  private static analyzeSocialGraph(userData: any, activityData: any) {
    const messages = activityData.messages || [];
    
    return {
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0,
      mutualConnections: 0, // Would calculate from follow graph
      messagesSent: messages.filter((m: any) => m.senderId === userData._id).length,
      messagesReceived: messages.filter((m: any) => m.receiverId === userData._id).length,
      responseRate: this.calculateResponseRate(messages, userData._id),
    };
  }

  /**
   * Analyze content creation
   */
  private static analyzeContentCreation(activityData: any) {
    const posts = activityData.posts || [];
    const routes = activityData.routes || [];
    
    return {
      postsCreated: posts.length,
      routesShared: routes.filter((r: any) => r.isPublic).length,
      opportunitiesCreated: 0, // Would track opportunities
      avgPostQuality: this.calculateAvgPostQuality(posts),
      viralContentCount: posts.filter((p: any) => (p.upvotes || 0) > 50).length,
    };
  }

  /**
   * Calculate personalization scores
   */
  private static calculatePersonalizationScores(activityData: any) {
    return {
      explorationScore: this.calculateExplorationScore(activityData),
      engagementScore: this.calculateEngagementScore(activityData),
      creatorScore: this.calculateCreatorScore(activityData),
      communityScore: this.calculateCommunityScore(activityData),
      safetyScore: this.calculateSafetyScore(activityData),
    };
  }

  /**
   * Extract ML features
   */
  private static extractMLFeatures(activityData: any) {
    // Calculate content affinity scores
    const contentAffinityScores: Record<string, number> = {};
    
    // This would use more sophisticated ML in production
    const posts = activityData.posts || [];
    posts.forEach((post: any) => {
      if (post.lifeDimension) {
        contentAffinityScores[post.lifeDimension] = 
          (contentAffinityScores[post.lifeDimension] || 0) + 1;
      }
    });
    
    // Normalize scores
    const total = Object.values(contentAffinityScores).reduce((sum: number, val: any) => sum + val, 0);
    Object.keys(contentAffinityScores).forEach(key => {
      contentAffinityScores[key] = contentAffinityScores[key] / Math.max(1, total);
    });
    
    return {
      contentAffinityScores,
      similarUsers: [], // Would be calculated using collaborative filtering
    };
  }

  // Helper methods
  private static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static calculatePeakHours(activityData: any): number[] {
    // Would analyze timestamps to find peak activity hours
    return [9, 12, 18, 21]; // Default peak hours
  }

  private static inferContentLengthPreference(activityData: any): 'short' | 'medium' | 'long' {
    // Would analyze engagement with different content lengths
    return 'medium';
  }

  private static calculateEngagementRate(activityData: any): number {
    const posts = activityData.posts || [];
    const interactions = (activityData.votes || []).length + (activityData.comments || []).length;
    return posts.length > 0 ? interactions / posts.length : 0;
  }

  private static getMonthsSinceSignup(activityData: any): number {
    // Would calculate from user signup date
    return 1;
  }

  private static calculateResponseRate(messages: any[], userId: string): number {
    // Would calculate how often user responds to messages
    return 0.8; // Default 80%
  }

  private static calculateAvgPostQuality(posts: any[]): number {
    if (posts.length === 0) return 0;
    const totalScore = posts.reduce((sum, p) => sum + (p.upvotes || 0) - (p.downvotes || 0), 0);
    return totalScore / posts.length;
  }

  private static calculateExplorationScore(activityData: any): number {
    // Measures how much user explores new content vs sticks to familiar
    const posts = activityData.posts || [];
    const uniqueDimensions = new Set(posts.map((p: any) => p.lifeDimension)).size;
    return Math.min(1, uniqueDimensions / 7); // 7 life dimensions
  }

  private static calculateEngagementScore(activityData: any): number {
    const interactions = (activityData.votes || []).length + (activityData.comments || []).length;
    const posts = (activityData.posts || []).length;
    return Math.min(1, interactions / Math.max(1, posts * 2));
  }

  private static calculateCreatorScore(activityData: any): number {
    const created = (activityData.posts || []).length + (activityData.routes || []).length;
    const consumed = (activityData.votes || []).length + (activityData.comments || []).length;
    const total = created + consumed;
    return total > 0 ? created / total : 0;
  }

  private static calculateCommunityScore(activityData: any): number {
    const social = (activityData.messages || []).length + (activityData.comments || []).length;
    return Math.min(1, social / 50); // Normalize to 50 interactions
  }

  private static calculateSafetyScore(activityData: any): number {
    const routes = activityData.routes || [];
    if (routes.length === 0) return 0.5;
    
    const avgSafety = routes.reduce((sum: number, r: any) => sum + (r.safetyRating || 3), 0) / routes.length;
    return avgSafety / 5; // Normalize to 0-1
  }
}

/**
 * User Segmentation
 */
export enum UserSegment {
  NEW_USER = 'new_user',
  CASUAL_CONSUMER = 'casual_consumer',
  ACTIVE_CONSUMER = 'active_consumer',
  CASUAL_CREATOR = 'casual_creator',
  ACTIVE_CREATOR = 'active_creator',
  POWER_USER = 'power_user',
  COMMUNITY_LEADER = 'community_leader',
  SAFETY_ADVOCATE = 'safety_advocate',
}

export function segmentUser(profile: UserProfile): UserSegment {
  const { personalizationScores, contentCreation, engagement } = profile;
  
  // New user (< 5 posts viewed)
  const totalViews = Object.values(profile.contentConsumption.lifeDimensions)
    .reduce((sum, count) => sum + count, 0);
  if (totalViews < 5) {
    return UserSegment.NEW_USER;
  }
  
  // Power user (high on all metrics)
  if (
    personalizationScores.engagementScore > 0.7 &&
    personalizationScores.creatorScore > 0.5 &&
    personalizationScores.communityScore > 0.7
  ) {
    return UserSegment.POWER_USER;
  }
  
  // Community leader (high community score)
  if (personalizationScores.communityScore > 0.8) {
    return UserSegment.COMMUNITY_LEADER;
  }
  
  // Safety advocate (high safety score and route activity)
  if (personalizationScores.safetyScore > 0.8 && profile.routePreferences.sharedRoutes > 5) {
    return UserSegment.SAFETY_ADVOCATE;
  }
  
  // Active creator (high creator score)
  if (personalizationScores.creatorScore > 0.6 && contentCreation.postsCreated > 10) {
    return UserSegment.ACTIVE_CREATOR;
  }
  
  // Casual creator (some creation)
  if (personalizationScores.creatorScore > 0.3 && contentCreation.postsCreated > 3) {
    return UserSegment.CASUAL_CREATOR;
  }
  
  // Active consumer (high engagement, low creation)
  if (personalizationScores.engagementScore > 0.5 && engagement.likesGiven > 20) {
    return UserSegment.ACTIVE_CONSUMER;
  }
  
  // Default: casual consumer
  return UserSegment.CASUAL_CONSUMER;
}
