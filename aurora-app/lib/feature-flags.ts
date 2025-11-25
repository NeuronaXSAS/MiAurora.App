/**
 * Feature Flags System
 * Allows enabling/disabling features without deployment
 * Critical for production safety and phased rollouts
 */

export type FeatureFlag = 
  | "nested_comments"
  | "sister_accompaniment"
  | "health_sanctuary"
  | "adsense_integration"
  | "ai_moderation"
  | "livestreaming"
  | "reels"
  | "premium_tier"
  | "panic_button_v2";

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  allowedUserIds?: string[]; // Whitelist specific users
  description: string;
}

const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  nested_comments: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Reddit-style nested comment threading",
  },
  sister_accompaniment: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Real-time location sharing for safety",
  },
  health_sanctuary: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Health & Soul wellness features",
  },
  adsense_integration: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Google AdSense monetization",
  },
  ai_moderation: {
    enabled: true,
    rolloutPercentage: 100,
    description: "AI-powered content moderation",
  },
  livestreaming: {
    enabled: true,
    rolloutPercentage: 50, // Phased rollout
    description: "Aurora Live streaming feature",
  },
  reels: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Short-form video content",
  },
  premium_tier: {
    enabled: true,
    rolloutPercentage: 100,
    description: "Premium subscription features",
  },
  panic_button_v2: {
    enabled: false, // Not yet ready
    rolloutPercentage: 0,
    description: "Enhanced panic button with multi-channel alerts",
  },
};

/**
 * Check if a feature is enabled for a user
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  userId?: string
): boolean {
  const config = FEATURE_FLAGS[flag];
  
  if (!config.enabled) {
    return false;
  }

  // Check whitelist
  if (config.allowedUserIds && userId) {
    return config.allowedUserIds.includes(userId);
  }

  // Check rollout percentage
  if (config.rolloutPercentage !== undefined && config.rolloutPercentage < 100) {
    if (!userId) return false;
    
    // Deterministic hash-based rollout
    const hash = hashString(userId);
    const bucket = hash % 100;
    return bucket < config.rolloutPercentage;
  }

  return true;
}

/**
 * Simple string hash function for consistent user bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get all feature flags and their status
 */
export function getAllFeatureFlags(): Record<FeatureFlag, FeatureFlagConfig> {
  return FEATURE_FLAGS;
}

/**
 * Override feature flag (for testing/admin)
 */
export function setFeatureFlag(
  flag: FeatureFlag,
  enabled: boolean
): void {
  if (typeof window !== "undefined") {
    const overrides = JSON.parse(
      localStorage.getItem("feature_flag_overrides") || "{}"
    );
    overrides[flag] = enabled;
    localStorage.setItem("feature_flag_overrides", JSON.stringify(overrides));
  }
}

/**
 * Check for local overrides (for testing)
 */
export function getFeatureFlagOverride(flag: FeatureFlag): boolean | null {
  if (typeof window !== "undefined") {
    const overrides = JSON.parse(
      localStorage.getItem("feature_flag_overrides") || "{}"
    );
    return overrides[flag] ?? null;
  }
  return null;
}
