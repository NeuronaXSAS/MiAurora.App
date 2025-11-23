/**
 * Recommendation Engine
 * Personalizes content feed based on user profile and behavior
 */

import { UserProfile, UserSegment, segmentUser } from './user-profiling';

export interface ContentItem {
  id: string;
  type: 'post' | 'route' | 'opportunity' | 'poll' | 'ai_chat' | 'reel';
  authorId: string;
  lifeDimension?: string;
  tags?: string[];
  createdAt: number;
  
  // Engagement metrics
  upvotes: number;
  downvotes: number;
  comments: number;
  shares: number;
  views: number;
  
  // Quality signals
  authorTrustScore: number;
  verificationCount?: number;
  isVerified?: boolean;
  
  // Content features
  hasMedia: boolean;
  textLength: number;
  safetyRating?: number;
}

export interface ScoredContent extends ContentItem {
  score: number;
  scoreBreakdown: {
    relevance: number;
    quality: number;
    freshness: number;
    diversity: number;
    engagement: number;
    social: number;
  };
}

/**
 * Recommendation Engine Class
 */
export class RecommendationEngine {
  private readonly RELEVANCE_WEIGHT = 0.30;
  private readonly QUALITY_WEIGHT = 0.25;
  private readonly FRESHNESS_WEIGHT = 0.15;
  private readonly DIVERSITY_WEIGHT = 0.10;
  private readonly ENGAGEMENT_WEIGHT = 0.15;
  private readonly SOCIAL_WEIGHT = 0.05;

  /**
   * Rank content items for a user
   */
  rankContent(
    content: ContentItem[],
    userProfile: UserProfile,
    recentlyViewed: Set<string> = new Set()
  ): ScoredContent[] {
    const segment = segmentUser(userProfile);
    
    // Score each content item
    const scoredContent = content.map(item => {
      // Skip recently viewed items
      if (recentlyViewed.has(item.id)) {
        return null;
      }
      
      const scoreBreakdown = {
        relevance: this.calculateRelevanceScore(item, userProfile),
        quality: this.calculateQualityScore(item),
        freshness: this.calculateFreshnessScore(item),
        diversity: this.calculateDiversityScore(item, userProfile),
        engagement: this.calculateEngagementScore(item),
        social: this.calculateSocialScore(item, userProfile),
      };
      
      // Adjust weights based on user segment
      const weights = this.getWeightsForSegment(segment);
      
      const score = 
        scoreBreakdown.relevance * weights.relevance +
        scoreBreakdown.quality * weights.quality +
        scoreBreakdown.freshness * weights.freshness +
        scoreBreakdown.diversity * weights.diversity +
        scoreBreakdown.engagement * weights.engagement +
        scoreBreakdown.social * weights.social;
      
      return {
        ...item,
        score,
        scoreBreakdown,
      };
    }).filter(Boolean) as ScoredContent[];
    
    // Sort by score descending
    scoredContent.sort((a, b) => b.score - a.score);
    
    // Apply diversity boost (prevent too much similar content)
    return this.applyDiversityBoost(scoredContent, userProfile);
  }

  /**
   * Calculate relevance score based on user interests
   */
  private calculateRelevanceScore(item: ContentItem, profile: UserProfile): number {
    let score = 0;
    
    // Life dimension affinity
    if (item.lifeDimension && profile.mlFeatures.contentAffinityScores[item.lifeDimension]) {
      score += profile.mlFeatures.contentAffinityScores[item.lifeDimension] * 0.4;
    }
    
    // Content type preference
    const typePreference = profile.contentConsumption.postTypes[item.type] || 0;
    const totalViews = Object.values(profile.contentConsumption.postTypes)
      .reduce((sum, count) => sum + count, 0);
    if (totalViews > 0) {
      score += (typePreference / totalViews) * 0.3;
    }
    
    // Tag matching
    if (item.tags && item.tags.length > 0) {
      const matchingTags = item.tags.filter(tag => 
        profile.routePreferences.preferredTags.includes(tag)
      ).length;
      score += (matchingTags / item.tags.length) * 0.2;
    }
    
    // Author affinity
    if (profile.engagement.topEngagedCreators.includes(item.authorId)) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }

  /**
   * Calculate quality score based on content metrics
   */
  private calculateQualityScore(item: ContentItem): number {
    let score = 0;
    
    // Engagement rate
    const totalEngagement = item.upvotes + item.comments + item.shares;
    const engagementRate = item.views > 0 ? totalEngagement / item.views : 0;
    score += Math.min(0.3, engagementRate * 3); // Cap at 0.3
    
    // Net votes (upvotes - downvotes)
    const netVotes = item.upvotes - item.downvotes;
    const voteRatio = item.upvotes + item.downvotes > 0 
      ? netVotes / (item.upvotes + item.downvotes)
      : 0;
    score += Math.max(0, voteRatio) * 0.3;
    
    // Author trust score
    score += (item.authorTrustScore / 100) * 0.2;
    
    // Verification status
    if (item.isVerified || (item.verificationCount && item.verificationCount >= 5)) {
      score += 0.1;
    }
    
    // Content completeness
    if (item.hasMedia) score += 0.05;
    if (item.textLength > 100) score += 0.05;
    
    return Math.min(1, score);
  }

  /**
   * Calculate freshness score (newer content scores higher)
   */
  private calculateFreshnessScore(item: ContentItem): number {
    const now = Date.now();
    const ageInHours = (now - item.createdAt) / (1000 * 60 * 60);
    
    // Exponential decay: score = e^(-age/24)
    // Content loses half its freshness every 24 hours
    return Math.exp(-ageInHours / 24);
  }

  /**
   * Calculate diversity score (reward content different from recent views)
   */
  private calculateDiversityScore(item: ContentItem, profile: UserProfile): number {
    // Reward content from dimensions user hasn't seen much
    const dimensionViews = profile.contentConsumption.lifeDimensions[item.lifeDimension || ''] || 0;
    const totalViews = Object.values(profile.contentConsumption.lifeDimensions)
      .reduce((sum, count) => sum + count, 0);
    
    if (totalViews === 0) return 1;
    
    const dimensionRatio = dimensionViews / totalViews;
    
    // Inverse relationship: less viewed dimensions score higher
    return 1 - dimensionRatio;
  }

  /**
   * Calculate engagement prediction score
   */
  private calculateEngagementScore(item: ContentItem): number {
    // Predict likelihood of engagement based on historical performance
    const totalInteractions = item.upvotes + item.comments + item.shares;
    
    // Normalize by age (older content has had more time to accumulate engagement)
    const ageInDays = (Date.now() - item.createdAt) / (1000 * 60 * 60 * 24);
    const normalizedEngagement = ageInDays > 0 ? totalInteractions / ageInDays : totalInteractions;
    
    // Sigmoid function to normalize to 0-1
    return 1 / (1 + Math.exp(-normalizedEngagement / 10));
  }

  /**
   * Calculate social score (content from connections)
   */
  private calculateSocialScore(item: ContentItem, profile: UserProfile): number {
    // Boost content from users the person engages with
    if (profile.engagement.topEngagedCreators.includes(item.authorId)) {
      return 1.0;
    }
    
    // Boost content from similar users (would use collaborative filtering)
    if (profile.mlFeatures.similarUsers.includes(item.authorId)) {
      return 0.7;
    }
    
    return 0;
  }

  /**
   * Get scoring weights based on user segment
   */
  private getWeightsForSegment(segment: UserSegment) {
    switch (segment) {
      case UserSegment.NEW_USER:
        // New users: prioritize quality and freshness
        return {
          relevance: 0.20,
          quality: 0.35,
          freshness: 0.25,
          diversity: 0.15,
          engagement: 0.05,
          social: 0.00,
        };
      
      case UserSegment.CASUAL_CONSUMER:
        // Casual: balanced approach
        return {
          relevance: 0.30,
          quality: 0.25,
          freshness: 0.15,
          diversity: 0.10,
          engagement: 0.15,
          social: 0.05,
        };
      
      case UserSegment.ACTIVE_CONSUMER:
        // Active consumers: prioritize relevance and engagement
        return {
          relevance: 0.35,
          quality: 0.20,
          freshness: 0.10,
          diversity: 0.10,
          engagement: 0.20,
          social: 0.05,
        };
      
      case UserSegment.CASUAL_CREATOR:
      case UserSegment.ACTIVE_CREATOR:
        // Creators: show diverse, high-quality content for inspiration
        return {
          relevance: 0.25,
          quality: 0.30,
          freshness: 0.15,
          diversity: 0.20,
          engagement: 0.10,
          social: 0.00,
        };
      
      case UserSegment.POWER_USER:
        // Power users: balanced with social boost
        return {
          relevance: 0.30,
          quality: 0.25,
          freshness: 0.15,
          diversity: 0.10,
          engagement: 0.10,
          social: 0.10,
        };
      
      case UserSegment.COMMUNITY_LEADER:
        // Community leaders: prioritize social and engagement
        return {
          relevance: 0.25,
          quality: 0.20,
          freshness: 0.10,
          diversity: 0.10,
          engagement: 0.20,
          social: 0.15,
        };
      
      case UserSegment.SAFETY_ADVOCATE:
        // Safety advocates: prioritize safety-related content
        return {
          relevance: 0.40,
          quality: 0.30,
          freshness: 0.10,
          diversity: 0.05,
          engagement: 0.10,
          social: 0.05,
        };
      
      default:
        return {
          relevance: this.RELEVANCE_WEIGHT,
          quality: this.QUALITY_WEIGHT,
          freshness: this.FRESHNESS_WEIGHT,
          diversity: this.DIVERSITY_WEIGHT,
          engagement: this.ENGAGEMENT_WEIGHT,
          social: this.SOCIAL_WEIGHT,
        };
    }
  }

  /**
   * Apply diversity boost to prevent filter bubbles
   */
  private applyDiversityBoost(content: ScoredContent[], profile: UserProfile): ScoredContent[] {
    const result: ScoredContent[] = [];
    const seenDimensions = new Set<string>();
    const seenAuthors = new Set<string>();
    
    // Exploration vs exploitation balance
    const explorationRate = profile.personalizationScores.explorationScore;
    
    for (const item of content) {
      let boostedScore = item.score;
      
      // Boost if from new dimension (encourage exploration)
      if (item.lifeDimension && !seenDimensions.has(item.lifeDimension)) {
        boostedScore *= (1 + explorationRate * 0.2);
        seenDimensions.add(item.lifeDimension);
      }
      
      // Slight penalty for same author appearing multiple times
      if (seenAuthors.has(item.authorId)) {
        boostedScore *= 0.9;
      } else {
        seenAuthors.add(item.authorId);
      }
      
      result.push({
        ...item,
        score: boostedScore,
      });
    }
    
    // Re-sort after diversity boost
    result.sort((a, b) => b.score - a.score);
    
    return result;
  }

  /**
   * Get trending content (high engagement in last 24h)
   */
  getTrendingContent(content: ContentItem[], timeWindowHours: number = 24): ContentItem[] {
    const cutoffTime = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    
    return content
      .filter(item => item.createdAt >= cutoffTime)
      .map(item => ({
        ...item,
        trendingScore: this.calculateTrendingScore(item),
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 20);
  }

  /**
   * Calculate trending score
   */
  private calculateTrendingScore(item: ContentItem): number {
    const ageInHours = (Date.now() - item.createdAt) / (1000 * 60 * 60);
    const engagementVelocity = (item.upvotes + item.comments * 2 + item.shares * 3) / Math.max(1, ageInHours);
    
    // Penalize older content
    const agePenalty = Math.exp(-ageInHours / 12);
    
    return engagementVelocity * agePenalty;
  }

  /**
   * Get personalized route recommendations
   */
  recommendRoutes(routes: ContentItem[], profile: UserProfile): ContentItem[] {
    return routes
      .filter(route => {
        // Filter by user preferences
        if (route.safetyRating && route.safetyRating < profile.routePreferences.safetyThreshold) {
          return false;
        }
        return true;
      })
      .map(route => ({
        ...route,
        score: this.calculateRouteScore(route, profile),
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate route recommendation score
   */
  private calculateRouteScore(route: ContentItem, profile: UserProfile): number {
    let score = 0;
    
    // Tag matching
    if (route.tags) {
      const matchingTags = route.tags.filter(tag =>
        profile.routePreferences.preferredTags.includes(tag)
      ).length;
      score += (matchingTags / Math.max(1, route.tags.length)) * 0.4;
    }
    
    // Safety score
    if (route.safetyRating) {
      score += (route.safetyRating / 5) * 0.3;
    }
    
    // Quality score
    score += this.calculateQualityScore(route) * 0.3;
    
    return score;
  }

  /**
   * Get personalized opportunity recommendations
   */
  recommendOpportunities(opportunities: ContentItem[], profile: UserProfile): ContentItem[] {
    return opportunities
      .map(opp => ({
        ...opp,
        score: this.calculateOpportunityScore(opp, profile),
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate opportunity recommendation score
   */
  private calculateOpportunityScore(opportunity: ContentItem, profile: UserProfile): number {
    let score = 0;
    
    // Match with user interests
    if (opportunity.lifeDimension && profile.mlFeatures.contentAffinityScores[opportunity.lifeDimension]) {
      score += profile.mlFeatures.contentAffinityScores[opportunity.lifeDimension] * 0.5;
    }
    
    // Match with career goals
    if (profile.careerGoals && opportunity.tags) {
      const matchingGoals = opportunity.tags.filter(tag =>
        profile.careerGoals?.some(goal => goal.toLowerCase().includes(tag.toLowerCase()))
      ).length;
      score += (matchingGoals / Math.max(1, opportunity.tags.length)) * 0.3;
    }
    
    // Quality score
    score += this.calculateQualityScore(opportunity) * 0.2;
    
    return score;
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();
