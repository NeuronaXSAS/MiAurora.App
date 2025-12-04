/**
 * Aurora App - Safety Access Control
 * 
 * CRITICAL: This module ensures safety features are NEVER paywalled.
 * Safety is our priority, not a premium feature.
 * 
 * All safety features must remain free for all users regardless of subscription status.
 */

// Safety features that are ALWAYS free - NEVER add premium gates to these
export const SAFETY_FEATURES = [
  // Emergency Features
  'panic_button',
  'emergency_contacts',
  'emergency_alerts',
  'emergency_mode',
  
  // Safety Check-ins
  'safety_checkins',
  'checkin_reminders',
  'missed_checkin_alerts',
  
  // Location Safety
  'basic_routes',
  'route_safety_ratings',
  'safety_map',
  'location_sharing',
  
  // Guardian System
  'aurora_guardians',
  'guardian_notifications',
  'accompaniment_sessions',
  
  // Resources
  'safety_resources',
  'hotlines',
  'shelters',
  'legal_aid',
  
  // Reporting
  'workplace_reports',
  'incident_reporting',
  'anonymous_reporting',
] as const;

export type SafetyFeature = typeof SAFETY_FEATURES[number];

/**
 * Check if a feature is a safety feature (always free)
 */
export function isSafetyFeature(feature: string): boolean {
  return SAFETY_FEATURES.includes(feature as SafetyFeature);
}

/**
 * Validate that a feature can be accessed
 * Safety features always return true regardless of subscription
 */
export function canAccessFeature(
  feature: string,
  userTier: string = 'free'
): { allowed: boolean; reason?: string } {
  // Safety features are ALWAYS accessible
  if (isSafetyFeature(feature)) {
    return { allowed: true };
  }
  
  // For non-safety features, check tier
  // This is a client-side helper - actual enforcement is in Convex
  return { allowed: true }; // Default to allowed, let server decide
}

/**
 * Get the list of all safety features for display
 */
export function getSafetyFeaturesList(): { id: string; name: string; description: string }[] {
  return [
    {
      id: 'panic_button',
      name: 'Panic Button',
      description: 'One-tap emergency alert to contacts and nearby users',
    },
    {
      id: 'emergency_contacts',
      name: 'Emergency Contacts',
      description: 'Store and quickly reach your trusted contacts',
    },
    {
      id: 'safety_checkins',
      name: 'Safety Check-ins',
      description: 'Scheduled "I\'m OK" pings with automatic alerts',
    },
    {
      id: 'aurora_guardians',
      name: 'Aurora Guardians',
      description: 'Connect with trusted users for mutual safety',
    },
    {
      id: 'basic_routes',
      name: 'Safe Routes',
      description: 'Community-verified safe walking routes',
    },
    {
      id: 'safety_resources',
      name: 'Safety Resources',
      description: 'Verified hotlines, shelters, and support services',
    },
    {
      id: 'location_sharing',
      name: 'Location Sharing',
      description: 'Share your location with guardians during travel',
    },
    {
      id: 'workplace_reports',
      name: 'Workplace Reports',
      description: 'Anonymous reporting of workplace incidents',
    },
  ];
}

/**
 * Free tier features (non-safety) that are always available
 */
export const FREE_TIER_FEATURES = [
  // Community
  'public_circles',
  'basic_posts',
  'basic_comments',
  
  // Content
  'view_feed',
  'view_reels',
  'view_livestreams',
  
  // AI (limited)
  'ai_messages_10_per_day',
  
  // Profile
  'basic_profile',
  'avatar_customization',
] as const;

/**
 * Premium features by tier
 */
export const PREMIUM_FEATURES = {
  plus: [
    'ad_free',
    'ai_messages_100_per_day',
    'monthly_credits_100',
    'premium_badge',
  ],
  pro: [
    'ad_free',
    'ai_messages_unlimited',
    'monthly_credits_500',
    'priority_support',
    'advanced_analytics',
    'pro_badge',
  ],
  elite: [
    'ad_free',
    'ai_messages_unlimited',
    'monthly_credits_1500',
    'priority_support',
    'advanced_analytics',
    'exclusive_events',
    'safety_consultations',
    'vip_badge',
  ],
} as const;

/**
 * Safety Promise Banner Component Data
 */
export const SAFETY_PROMISE = {
  title: 'Safety Features Are Always Free',
  description: 'Panic button, emergency contacts, safety check-ins, and basic routes will always be free. Your safety is our priority, not a premium feature.',
  icon: 'Shield',
};
