/**
 * Aurora App - Engagement & Monetization Algorithm
 * 
 * Smart algorithms for:
 * 1. Content ranking for maximum engagement
 * 2. Credit rewards that drive positive behavior
 * 3. Monetization hooks that create value
 * 4. User retention mechanics
 */

// ============================================
// ENGAGEMENT SCORING
// ============================================

export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  timeSpent: number; // seconds
  completionRate: number; // 0-1 for videos
}

export interface ContentItem {
  id: string;
  type: 'post' | 'reel' | 'route' | 'opportunity' | 'poll' | 'livestream';
  createdAt: number;
  authorId: string;
  metrics: EngagementMetrics;
  category: string;
  hasMedia: boolean;
  isVerified: boolean;
  isPremium: boolean;
}

/**
 * Calculate engagement score for content ranking
 * Higher score = shown to more users
 */
export function calculateEngagementScore(item: ContentItem): number {
  const { metrics, createdAt, hasMedia, isVerified, isPremium } = item;
  
  // Base engagement score
  let score = 0;
  
  // Weighted engagement metrics
  score += metrics.likes * 2;
  score += metrics.comments * 5; // Comments are high-value engagement
  score += metrics.shares * 10; // Shares drive growth
  score += metrics.saves * 3; // Saves indicate quality
  
  // Time-based decay (fresher content ranks higher)
  const ageHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  const decayFactor = Math.pow(0.95, ageHours / 6); // 5% decay every 6 hours
  score *= decayFactor;
  
  // Engagement velocity (trending detection)
  const velocity = (metrics.likes + metrics.comments * 2) / Math.max(1, ageHours);
  if (velocity > 10) score *= 2.0; // Viral
  else if (velocity > 5) score *= 1.5; // Trending
  else if (velocity > 2) score *= 1.2; // Rising
  
  // Quality bonuses
  if (hasMedia) score *= 1.3; // Visual content performs better
  if (isVerified) score *= 1.5; // Verified content is trusted
  
  // Content type bonuses (encourage variety)
  const typeBonus: Record<string, number> = {
    reel: 1.4, // Short video is highly engaging
    poll: 1.3, // Polls drive interaction
    livestream: 1.5, // Live content is urgent
    route: 1.2, // Safety routes are valuable
    opportunity: 1.1, // Jobs help users
    post: 1.0,
  };
  score *= typeBonus[item.type] || 1.0;
  
  return Math.round(score);
}

/**
 * Calculate "For You" personalization score
 */
export function calculatePersonalizationScore(
  item: ContentItem,
  userPreferences: {
    interests: string[];
    followedAuthors: string[];
    engagedCategories: string[];
    location?: string;
  }
): number {
  let score = 0;
  
  // Interest match
  if (userPreferences.interests.includes(item.category)) {
    score += 50;
  }
  
  // Following bonus
  if (userPreferences.followedAuthors.includes(item.authorId)) {
    score += 100;
  }
  
  // Category engagement history
  if (userPreferences.engagedCategories.includes(item.category)) {
    score += 30;
  }
  
  return score;
}

// ============================================
// CREDIT REWARDS SYSTEM
// ============================================

export interface CreditAction {
  action: string;
  credits: number;
  dailyLimit?: number;
  description: string;
  positiveImpact: string;
}

/**
 * Credit rewards that drive positive behavior
 * Each action creates value for the community
 */
export const CREDIT_REWARDS: CreditAction[] = [
  // Content Creation (high value)
  { action: 'create_post', credits: 5, dailyLimit: 10, description: 'Share your experience', positiveImpact: 'Helps other women learn' },
  { action: 'create_reel', credits: 10, dailyLimit: 5, description: 'Create a short video', positiveImpact: 'Inspires the community' },
  { action: 'share_route', credits: 15, dailyLimit: 3, description: 'Share a safe route', positiveImpact: 'Keeps women safe' },
  { action: 'post_opportunity', credits: 20, dailyLimit: 2, description: 'Post a job/opportunity', positiveImpact: 'Helps women advance' },
  
  // Engagement (medium value)
  { action: 'like', credits: 1, dailyLimit: 50, description: 'Like content', positiveImpact: 'Encourages creators' },
  { action: 'comment', credits: 2, dailyLimit: 30, description: 'Leave a comment', positiveImpact: 'Builds community' },
  { action: 'share', credits: 3, dailyLimit: 20, description: 'Share with others', positiveImpact: 'Grows the network' },
  { action: 'save', credits: 1, dailyLimit: 30, description: 'Save for later', positiveImpact: 'Curates quality' },
  
  // Community Building (high value)
  { action: 'verify_content', credits: 5, dailyLimit: 10, description: 'Verify information', positiveImpact: 'Ensures accuracy' },
  { action: 'report_safety', credits: 10, dailyLimit: 5, description: 'Report safety concern', positiveImpact: 'Protects community' },
  { action: 'help_user', credits: 8, dailyLimit: 10, description: 'Help another user', positiveImpact: 'Supports sisters' },
  { action: 'invite_friend', credits: 25, dailyLimit: 5, description: 'Invite a friend', positiveImpact: 'Grows safe network' },
  
  // Daily Engagement (retention)
  { action: 'daily_login', credits: 5, dailyLimit: 1, description: 'Daily check-in', positiveImpact: 'Stays connected' },
  { action: 'streak_bonus', credits: 10, dailyLimit: 1, description: '7-day streak', positiveImpact: 'Consistent engagement' },
  { action: 'complete_profile', credits: 50, dailyLimit: 1, description: 'Complete profile', positiveImpact: 'Builds trust' },
  
  // Safety Actions (highest value)
  { action: 'safety_checkin', credits: 3, dailyLimit: 10, description: 'Safety check-in', positiveImpact: 'Ensures wellbeing' },
  { action: 'emergency_alert', credits: 0, dailyLimit: undefined, description: 'Emergency alert', positiveImpact: 'Gets help fast' },
];

/**
 * Calculate credits for an action
 */
export function getCreditsForAction(
  action: string,
  userDailyActions: Record<string, number> = {}
): { credits: number; canEarn: boolean; reason?: string } {
  const reward = CREDIT_REWARDS.find(r => r.action === action);
  
  if (!reward) {
    return { credits: 0, canEarn: false, reason: 'Unknown action' };
  }
  
  const dailyCount = userDailyActions[action] || 0;
  
  if (reward.dailyLimit && dailyCount >= reward.dailyLimit) {
    return { 
      credits: 0, 
      canEarn: false, 
      reason: `Daily limit reached (${reward.dailyLimit}/${reward.dailyLimit})` 
    };
  }
  
  return { credits: reward.credits, canEarn: true };
}

// ============================================
// MONETIZATION HOOKS
// ============================================

export interface MonetizationOpportunity {
  type: 'premium_feature' | 'credit_purchase' | 'boost' | 'gift' | 'subscription';
  trigger: string;
  message: string;
  ctaText: string;
  ctaLink: string;
  priority: number;
}

/**
 * Contextual monetization opportunities
 * Shown at the right moment to maximize conversion
 */
export const MONETIZATION_HOOKS: MonetizationOpportunity[] = [
  // Premium Features
  {
    type: 'premium_feature',
    trigger: 'ai_limit_reached',
    message: 'Unlock unlimited Aurora AI conversations',
    ctaText: 'Go Premium',
    ctaLink: '/premium',
    priority: 1,
  },
  {
    type: 'premium_feature',
    trigger: 'view_opportunity_locked',
    message: 'Get full access to this opportunity',
    ctaText: 'Unlock with Premium',
    ctaLink: '/premium',
    priority: 2,
  },
  
  // Credit Purchases
  {
    type: 'credit_purchase',
    trigger: 'low_credits',
    message: 'Running low on credits? Get more to unlock features',
    ctaText: 'Get Credits',
    ctaLink: '/wallet',
    priority: 3,
  },
  {
    type: 'credit_purchase',
    trigger: 'want_to_boost',
    message: 'Boost your post to reach more women',
    ctaText: 'Boost Post',
    ctaLink: '/wallet',
    priority: 2,
  },
  
  // Gifting
  {
    type: 'gift',
    trigger: 'viewing_helpful_content',
    message: 'Show appreciation with a gift',
    ctaText: 'Send Gift',
    ctaLink: '#gift',
    priority: 4,
  },
  
  // Subscription
  {
    type: 'subscription',
    trigger: 'frequent_user',
    message: 'Join Aurora Premium for the best experience',
    ctaText: 'Start Free Trial',
    ctaLink: '/premium',
    priority: 1,
  },
];

/**
 * Get relevant monetization opportunity based on context
 */
export function getMonetizationHook(
  trigger: string,
  userState: { isPremium: boolean; credits: number; daysActive: number }
): MonetizationOpportunity | null {
  // Don't show to premium users (except gifts)
  if (userState.isPremium && !trigger.includes('gift')) {
    return null;
  }
  
  const hook = MONETIZATION_HOOKS.find(h => h.trigger === trigger);
  return hook || null;
}

// ============================================
// RETENTION MECHANICS
// ============================================

export interface RetentionEvent {
  type: 'streak' | 'milestone' | 'achievement' | 'comeback';
  title: string;
  description: string;
  reward: number;
  icon: string;
}

/**
 * Calculate user streak and rewards
 */
export function calculateStreak(
  lastActiveDate: Date,
  currentStreak: number
): { newStreak: number; reward: number; event?: RetentionEvent } {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastActive = new Date(lastActiveDate);
  const isConsecutive = lastActive.toDateString() === yesterday.toDateString();
  const isToday = lastActive.toDateString() === today.toDateString();
  
  if (isToday) {
    // Already logged in today
    return { newStreak: currentStreak, reward: 0 };
  }
  
  if (isConsecutive) {
    const newStreak = currentStreak + 1;
    let reward = 5; // Base daily reward
    let event: RetentionEvent | undefined;
    
    // Streak milestones
    if (newStreak === 7) {
      reward = 50;
      event = {
        type: 'streak',
        title: '7-Day Streak! 🔥',
        description: 'You\'ve been active for a week straight!',
        reward: 50,
        icon: '🔥',
      };
    } else if (newStreak === 30) {
      reward = 200;
      event = {
        type: 'streak',
        title: '30-Day Streak! 🏆',
        description: 'A whole month of staying connected!',
        reward: 200,
        icon: '🏆',
      };
    } else if (newStreak % 7 === 0) {
      reward = 25;
      event = {
        type: 'milestone',
        title: `${newStreak}-Day Streak!`,
        description: 'Keep the momentum going!',
        reward: 25,
        icon: '⭐',
      };
    }
    
    return { newStreak, reward, event };
  }
  
  // Streak broken - check for comeback
  const daysSinceActive = Math.floor(
    (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceActive > 7 && daysSinceActive < 30) {
    // Comeback bonus
    return {
      newStreak: 1,
      reward: 15,
      event: {
        type: 'comeback',
        title: 'Welcome Back! 💜',
        description: 'We missed you! Here\'s a comeback bonus.',
        reward: 15,
        icon: '💜',
      },
    };
  }
  
  // Reset streak
  return { newStreak: 1, reward: 5 };
}

// ============================================
// CONTENT DIVERSITY
// ============================================

/**
 * Ensure feed has diverse content types
 * Prevents monotony and increases engagement
 */
export function diversifyFeed<T extends { type: string }>(
  items: T[],
  maxConsecutiveSameType: number = 2
): T[] {
  const result: T[] = [];
  const byType: Record<string, T[]> = {};
  
  // Group by type
  for (const item of items) {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  }
  
  // Interleave types
  const types = Object.keys(byType);
  let typeIndex = 0;
  let consecutiveCount = 0;
  let lastType = '';
  
  while (result.length < items.length) {
    const currentType = types[typeIndex % types.length];
    const typeItems = byType[currentType];
    
    if (typeItems && typeItems.length > 0) {
      if (currentType === lastType) {
        consecutiveCount++;
        if (consecutiveCount >= maxConsecutiveSameType) {
          typeIndex++;
          consecutiveCount = 0;
          continue;
        }
      } else {
        consecutiveCount = 1;
        lastType = currentType;
      }
      
      result.push(typeItems.shift()!);
    }
    
    typeIndex++;
    
    // Safety check to prevent infinite loop
    if (typeIndex > items.length * 2) break;
  }
  
  return result;
}

// ============================================
// A/B TESTING HELPERS
// ============================================

/**
 * Simple A/B test assignment
 */
export function getABTestVariant(
  userId: string,
  testName: string,
  variants: string[]
): string {
  // Simple hash-based assignment for consistency
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const index = Math.abs(hash) % variants.length;
  return variants[index];
}
