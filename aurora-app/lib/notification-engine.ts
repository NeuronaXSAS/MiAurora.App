/**
 * Personalized Notification System
 * Intelligent notification delivery based on user behavior
 */

import { UserProfile, UserSegment, segmentUser } from './user-profiling';

export interface NotificationTemplate {
  id: string;
  type: 'engagement' | 'content' | 'social' | 'achievement' | 'safety' | 'credit';
  title: string;
  body: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationContext {
  userId: string;
  profile: UserProfile;
  recentActivity: {
    lastActive: number;
    lastNotificationSent: number;
    notificationsSentToday: number;
    notificationsClickedToday: number;
  };
}

export interface ScoredNotification extends NotificationTemplate {
  relevanceScore: number;
  timingScore: number;
  frequencyScore: number;
  totalScore: number;
  shouldSend: boolean;
  optimalSendTime?: number;
}

/**
 * Notification Engine Class
 */
export class NotificationEngine {
  private readonly MAX_DAILY_NOTIFICATIONS = 10;
  private readonly MIN_NOTIFICATION_INTERVAL_HOURS = 2;

  /**
   * Score and rank notifications for a user
   */
  scoreNotifications(
    notifications: NotificationTemplate[],
    context: NotificationContext
  ): ScoredNotification[] {
    const segment = segmentUser(context.profile);
    
    return notifications.map(notification => {
      const relevanceScore = this.calculateRelevanceScore(notification, context.profile, segment);
      const timingScore = this.calculateTimingScore(notification, context);
      const frequencyScore = this.calculateFrequencyScore(notification, context);
      
      const totalScore = (
        relevanceScore * 0.5 +
        timingScore * 0.3 +
        frequencyScore * 0.2
      );
      
      const shouldSend = this.shouldSendNotification(
        notification,
        context,
        totalScore
      );
      
      const optimalSendTime = this.calculateOptimalSendTime(
        notification,
        context.profile
      );
      
      return {
        ...notification,
        relevanceScore,
        timingScore,
        frequencyScore,
        totalScore,
        shouldSend,
        optimalSendTime,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate relevance score based on user interests
   */
  private calculateRelevanceScore(
    notification: NotificationTemplate,
    profile: UserProfile,
    segment: UserSegment
  ): number {
    let score = 0;
    
    // Base score by notification type and user segment
    switch (notification.type) {
      case 'engagement':
        // Active users care more about engagement
        if (segment === UserSegment.ACTIVE_CONSUMER || segment === UserSegment.POWER_USER) {
          score += 0.8;
        } else {
          score += 0.4;
        }
        break;
      
      case 'content':
        // All users care about new content
        score += 0.7;
        break;
      
      case 'social':
        // Community-focused users care more
        if (segment === UserSegment.COMMUNITY_LEADER || profile.personalizationScores.communityScore > 0.6) {
          score += 0.9;
        } else {
          score += 0.5;
        }
        break;
      
      case 'achievement':
        // Creators and power users care more
        if (segment === UserSegment.ACTIVE_CREATOR || segment === UserSegment.POWER_USER) {
          score += 0.8;
        } else {
          score += 0.6;
        }
        break;
      
      case 'safety':
        // Safety advocates care most
        if (segment === UserSegment.SAFETY_ADVOCATE) {
          score += 1.0;
        } else {
          score += 0.7;
        }
        break;
      
      case 'credit':
        // Everyone cares about credits
        score += 0.8;
        break;
    }
    
    // Adjust based on priority
    if (notification.priority === 'urgent') {
      score = Math.min(1.0, score * 1.3);
    } else if (notification.priority === 'low') {
      score *= 0.7;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate timing score (is now a good time?)
   */
  private calculateTimingScore(
    notification: NotificationTemplate,
    context: NotificationContext
  ): number {
    const now = Date.now();
    const hourOfDay = new Date(now).getHours();
    
    // Check if user is typically active at this hour
    const peakHours = context.profile.contentConsumption.peakActivityHours;
    const isPeakHour = peakHours.includes(hourOfDay);
    
    let score = isPeakHour ? 0.8 : 0.4;
    
    // Avoid late night notifications (11 PM - 7 AM)
    if (hourOfDay >= 23 || hourOfDay < 7) {
      score *= 0.3;
    }
    
    // Check time since last notification
    const hoursSinceLastNotification = 
      (now - context.recentActivity.lastNotificationSent) / (1000 * 60 * 60);
    
    if (hoursSinceLastNotification < this.MIN_NOTIFICATION_INTERVAL_HOURS) {
      score *= 0.2; // Heavily penalize too-frequent notifications
    }
    
    // Urgent notifications override timing concerns
    if (notification.priority === 'urgent') {
      score = Math.max(score, 0.9);
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate frequency score (are we sending too many?)
   */
  private calculateFrequencyScore(
    notification: NotificationTemplate,
    context: NotificationContext
  ): number {
    const { notificationsSentToday, notificationsClickedToday } = context.recentActivity;
    
    // Calculate click-through rate
    const ctr = notificationsSentToday > 0 
      ? notificationsClickedToday / notificationsSentToday 
      : 0.5; // Assume 50% CTR for new users
    
    // If user is ignoring notifications, reduce frequency
    let score = ctr;
    
    // Penalize if approaching daily limit
    const utilizationRate = notificationsSentToday / this.MAX_DAILY_NOTIFICATIONS;
    if (utilizationRate > 0.7) {
      score *= (1 - utilizationRate);
    }
    
    // Urgent notifications override frequency concerns
    if (notification.priority === 'urgent') {
      score = Math.max(score, 0.9);
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Decide if notification should be sent
   */
  private shouldSendNotification(
    notification: NotificationTemplate,
    context: NotificationContext,
    totalScore: number
  ): boolean {
    // Always send urgent notifications
    if (notification.priority === 'urgent') {
      return true;
    }
    
    // Check daily limit
    if (context.recentActivity.notificationsSentToday >= this.MAX_DAILY_NOTIFICATIONS) {
      return false;
    }
    
    // Check minimum interval
    const hoursSinceLastNotification = 
      (Date.now() - context.recentActivity.lastNotificationSent) / (1000 * 60 * 60);
    
    if (hoursSinceLastNotification < this.MIN_NOTIFICATION_INTERVAL_HOURS) {
      return false;
    }
    
    // Send if score is above threshold
    const threshold = notification.priority === 'high' ? 0.5 : 0.6;
    return totalScore >= threshold;
  }

  /**
   * Calculate optimal send time for notification
   */
  private calculateOptimalSendTime(
    notification: NotificationTemplate,
    profile: UserProfile
  ): number {
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    
    // For urgent notifications, send immediately
    if (notification.priority === 'urgent') {
      return now;
    }
    
    // Find next peak activity hour
    const peakHours = profile.contentConsumption.peakActivityHours;
    const sortedPeakHours = [...peakHours].sort((a, b) => a - b);
    
    // Find next peak hour after current time
    let nextPeakHour = sortedPeakHours.find(hour => hour > currentHour);
    
    // If no peak hour today, use first peak hour tomorrow
    if (!nextPeakHour) {
      nextPeakHour = sortedPeakHours[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(nextPeakHour, 0, 0, 0);
      return tomorrow.getTime();
    }
    
    // Set to next peak hour today
    const optimalTime = new Date(now);
    optimalTime.setHours(nextPeakHour, 0, 0, 0);
    return optimalTime.getTime();
  }

  /**
   * Generate personalized notification content
   */
  generatePersonalizedContent(
    template: NotificationTemplate,
    profile: UserProfile,
    context: Record<string, any>
  ): NotificationTemplate {
    let title = template.title;
    let body = template.body;
    
    // Replace placeholders with personalized content
    const segment = segmentUser(profile);
    
    // Add user name if available
    if (context.userName) {
      title = title.replace('{userName}', context.userName);
      body = body.replace('{userName}', context.userName);
    }
    
    // Add segment-specific language
    if (segment === UserSegment.NEW_USER) {
      body = body.replace('{greeting}', 'Welcome to Aurora!');
    } else if (segment === UserSegment.POWER_USER) {
      body = body.replace('{greeting}', 'Hey superstar!');
    } else {
      body = body.replace('{greeting}', 'Hi there!');
    }
    
    // Add personalized stats
    if (context.stats) {
      Object.entries(context.stats).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, String(value));
        body = body.replace(`{${key}}`, String(value));
      });
    }
    
    return {
      ...template,
      title,
      body,
    };
  }

  /**
   * Create notification templates for common events
   */
  static createEngagementNotification(
    engagementType: 'like' | 'comment' | 'share' | 'verify',
    actorName: string,
    contentType: string
  ): NotificationTemplate {
    const actions = {
      like: 'liked',
      comment: 'commented on',
      share: 'shared',
      verify: 'verified',
    };
    
    return {
      id: `engagement_${engagementType}_${Date.now()}`,
      type: 'engagement',
      title: 'New engagement!',
      body: `${actorName} ${actions[engagementType]} your ${contentType}`,
      priority: 'medium',
    };
  }

  static createContentNotification(
    contentType: string,
    creatorName: string,
    lifeDimension?: string
  ): NotificationTemplate {
    return {
      id: `content_${contentType}_${Date.now()}`,
      type: 'content',
      title: 'New content you might like',
      body: `${creatorName} shared a new ${contentType}${lifeDimension ? ` in ${lifeDimension}` : ''}`,
      priority: 'low',
    };
  }

  static createAchievementNotification(
    achievement: string,
    reward?: string
  ): NotificationTemplate {
    return {
      id: `achievement_${Date.now()}`,
      type: 'achievement',
      title: 'Achievement unlocked! 🎉',
      body: `You earned: ${achievement}${reward ? `. Reward: ${reward}` : ''}`,
      priority: 'medium',
    };
  }

  static createSafetyNotification(
    message: string,
    isUrgent: boolean = false
  ): NotificationTemplate {
    return {
      id: `safety_${Date.now()}`,
      type: 'safety',
      title: isUrgent ? '⚠️ Safety Alert' : 'Safety Update',
      body: message,
      priority: isUrgent ? 'urgent' : 'high',
    };
  }

  static createCreditNotification(
    amount: number,
    source: string
  ): NotificationTemplate {
    return {
      id: `credit_${Date.now()}`,
      type: 'credit',
      title: 'Credits earned! 💰',
      body: `You earned ${amount} credits from ${source}`,
      priority: 'medium',
    };
  }

  static createSocialNotification(
    actorName: string,
    action: 'follow' | 'message' | 'mention'
  ): NotificationTemplate {
    const actions = {
      follow: 'started following you',
      message: 'sent you a message',
      mention: 'mentioned you',
    };
    
    return {
      id: `social_${action}_${Date.now()}`,
      type: 'social',
      title: 'New social activity',
      body: `${actorName} ${actions[action]}`,
      priority: action === 'message' ? 'high' : 'medium',
    };
  }
}

// Export singleton instance
export const notificationEngine = new NotificationEngine();

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  types: {
    engagement: boolean;
    content: boolean;
    social: boolean;
    achievement: boolean;
    safety: boolean;
    credit: boolean;
  };
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: number; // Hour (0-23)
    end: number; // Hour (0-23)
  };
  frequency: 'all' | 'important' | 'urgent_only';
}

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: true,
  types: {
    engagement: true,
    content: true,
    social: true,
    achievement: true,
    safety: true,
    credit: true,
  },
  channels: {
    push: true,
    email: false,
    inApp: true,
  },
  quietHours: {
    enabled: true,
    start: 22, // 10 PM
    end: 8, // 8 AM
  },
  frequency: 'all',
};
