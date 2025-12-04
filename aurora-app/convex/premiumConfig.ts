/**
 * Aurora Premium Configuration
 * 
 * Defines subscription tiers, benefits, and pricing for the premium system.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// SUBSCRIPTION TIER DEFINITIONS
// ============================================

export interface TierBenefits {
  adFree: boolean;
  aiMessagesPerDay: number; // -1 for unlimited
  postsPerHour: number;
  reelsPerDay: number;
  livestreamsPerDay: number;
  monthlyCredits: number;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  exclusiveEvents: boolean;
  safetyConsultations: boolean;
  badge: "none" | "premium" | "pro" | "vip";
}

export interface SubscriptionTier {
  tierId: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  benefits: TierBenefits;
}

// Default tier configurations
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    tierId: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    benefits: {
      adFree: false,
      aiMessagesPerDay: 10,
      postsPerHour: 5,
      reelsPerDay: 3,
      livestreamsPerDay: 2,
      monthlyCredits: 0,
      prioritySupport: false,
      advancedAnalytics: false,
      exclusiveEvents: false,
      safetyConsultations: false,
      badge: "none",
    },
  },
  {
    tierId: "plus",
    name: "Aurora Plus",
    monthlyPrice: 5,
    annualPrice: 48, // 20% discount (5 * 12 * 0.8)
    benefits: {
      adFree: true,
      aiMessagesPerDay: 100,
      postsPerHour: 25,
      reelsPerDay: 10,
      livestreamsPerDay: 5,
      monthlyCredits: 100,
      prioritySupport: false,
      advancedAnalytics: false,
      exclusiveEvents: false,
      safetyConsultations: false,
      badge: "premium",
    },
  },
  {
    tierId: "pro",
    name: "Aurora Pro",
    monthlyPrice: 12,
    annualPrice: 115.20, // 20% discount (12 * 12 * 0.8)
    benefits: {
      adFree: true,
      aiMessagesPerDay: -1, // Unlimited
      postsPerHour: 50,
      reelsPerDay: 20,
      livestreamsPerDay: 10,
      monthlyCredits: 500,
      prioritySupport: true,
      advancedAnalytics: true,
      exclusiveEvents: false,
      safetyConsultations: false,
      badge: "pro",
    },
  },
  {
    tierId: "elite",
    name: "Aurora Elite",
    monthlyPrice: 25,
    annualPrice: 240, // 20% discount (25 * 12 * 0.8)
    benefits: {
      adFree: true,
      aiMessagesPerDay: -1, // Unlimited
      postsPerHour: 100,
      reelsPerDay: 50,
      livestreamsPerDay: 20,
      monthlyCredits: 1500,
      prioritySupport: true,
      advancedAnalytics: true,
      exclusiveEvents: true,
      safetyConsultations: true,
      badge: "vip",
    },
  },
];

// ============================================
// CREDIT PACKAGE DEFINITIONS
// ============================================

export interface CreditPackage {
  packageId: string;
  credits: number;
  priceUSD: number;
  bonus?: number;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { packageId: "small", credits: 100, priceUSD: 1 },
  { packageId: "medium", credits: 500, priceUSD: 4 },
  { packageId: "large", credits: 1000, priceUSD: 7 },
  { packageId: "xl", credits: 5000, priceUSD: 30, bonus: 500 },
];

// ============================================
// ENGAGEMENT REWARDS
// ============================================

export interface EngagementReward {
  action: string;
  credits: number;
  cooldownMs?: number; // Milliseconds between rewards
  dailyLimit?: number;
}

export const ENGAGEMENT_REWARDS: EngagementReward[] = [
  { action: "daily_login", credits: 5, cooldownMs: 86400000 }, // 24 hours
  { action: "post_created", credits: 10, dailyLimit: 5 },
  { action: "safety_verification", credits: 25, dailyLimit: 10 },
  { action: "checkin_completed", credits: 15, dailyLimit: 3 },
  { action: "referral_success", credits: 100 },
  { action: "route_shared", credits: 20, dailyLimit: 3 },
  { action: "reel_created", credits: 15, dailyLimit: 5 },
  { action: "livestream_completed", credits: 25, dailyLimit: 2 },
];

// ============================================
// GIFT CATEGORIES
// ============================================

export interface GiftDefinition {
  giftId: string;
  name: string;
  category: "hearts" | "sparkles" | "crowns" | "aurora_special";
  credits: number;
  animationUrl: string;
}

export const GIFT_CATALOG: GiftDefinition[] = [
  // Hearts (1-10 credits)
  { giftId: "heart_small", name: "Heart", category: "hearts", credits: 1, animationUrl: "/animations/heart-small.json" },
  { giftId: "heart_medium", name: "Big Heart", category: "hearts", credits: 5, animationUrl: "/animations/heart-medium.json" },
  { giftId: "heart_large", name: "Love Burst", category: "hearts", credits: 10, animationUrl: "/animations/heart-large.json" },
  
  // Sparkles (25-50 credits)
  { giftId: "sparkle_small", name: "Sparkle", category: "sparkles", credits: 25, animationUrl: "/animations/sparkle-small.json" },
  { giftId: "sparkle_medium", name: "Star Shower", category: "sparkles", credits: 35, animationUrl: "/animations/sparkle-medium.json" },
  { giftId: "sparkle_large", name: "Galaxy", category: "sparkles", credits: 50, animationUrl: "/animations/sparkle-large.json" },
  
  // Crowns (100-500 credits)
  { giftId: "crown_small", name: "Crown", category: "crowns", credits: 100, animationUrl: "/animations/crown-small.json" },
  { giftId: "crown_medium", name: "Royal Crown", category: "crowns", credits: 250, animationUrl: "/animations/crown-medium.json" },
  { giftId: "crown_large", name: "Diamond Crown", category: "crowns", credits: 500, animationUrl: "/animations/crown-large.json" },
  
  // Aurora Special (1000+ credits)
  { giftId: "aurora_special", name: "Aurora Blessing", category: "aurora_special", credits: 1000, animationUrl: "/animations/aurora-special.json" },
  { giftId: "aurora_legendary", name: "Aurora Legend", category: "aurora_special", credits: 2500, animationUrl: "/animations/aurora-legendary.json" },
  { giftId: "aurora_mythic", name: "Aurora Mythic", category: "aurora_special", credits: 5000, animationUrl: "/animations/aurora-mythic.json" },
];

// ============================================
// REVENUE SHARE CONSTANTS
// ============================================

export const REVENUE_SHARES = {
  // Gift transactions: 85% to creator, 15% platform
  GIFT_CREATOR_SHARE: 0.85,
  GIFT_PLATFORM_FEE: 0.15,
  
  // Event tickets: 80% to host, 20% platform
  EVENT_HOST_SHARE: 0.80,
  EVENT_PLATFORM_FEE: 0.20,
  
  // Creator subscriptions: 85% to creator, 15% platform (default)
  CREATOR_SUB_SHARE_DEFAULT: 0.85,
  CREATOR_SUB_SHARE_1000: 0.90, // 1000+ subscribers
  
  // Circle memberships: 80% to host, 20% platform (default)
  CIRCLE_HOST_SHARE_DEFAULT: 0.80,
  CIRCLE_HOST_SHARE_100: 0.85, // 100+ paying members
};

// ============================================
// ROOM LIMITS
// ============================================

export const ROOM_LIMITS = {
  VIDEO_MAX_PARTICIPANTS: 16,
  BROADCAST_MAX_HOSTS: 9,
  AUDIO_MAX_SPEAKERS: 50,
  SUPER_CHAT_MIN_CREDITS: 50,
  SUPER_CHAT_PIN_DURATION_MS: 60000, // 60 seconds
};

// ============================================
// SAFETY FEATURES (NEVER PAYWALLED)
// ============================================

export const SAFETY_FEATURES = [
  "panic_button",
  "emergency_contacts",
  "safety_checkins",
  "basic_routes",
  "safety_resources",
  "emergency_mode",
  "aurora_guardians",
  "location_sharing",
  "accompaniment_sessions",
];

// ============================================
// CONVEX QUERIES
// ============================================

/**
 * Get all subscription tiers
 */
export const getSubscriptionTiers = query({
  args: {},
  handler: async () => {
    return SUBSCRIPTION_TIERS;
  },
});

/**
 * Get benefits for a specific tier
 */
export const getTierBenefits = query({
  args: { tier: v.string() },
  handler: async (ctx, args) => {
    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tierId === args.tier);
    if (!tierConfig) {
      return SUBSCRIPTION_TIERS[0].benefits; // Return free tier benefits
    }
    return tierConfig.benefits;
  },
});

/**
 * Get all credit packages
 */
export const getCreditPackages = query({
  args: {},
  handler: async () => {
    return CREDIT_PACKAGES;
  },
});

/**
 * Get gift catalog
 */
export const getGiftCatalog = query({
  args: {},
  handler: async () => {
    return GIFT_CATALOG;
  },
});

/**
 * Get gifts by category
 */
export const getGiftsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return GIFT_CATALOG.filter(g => g.category === args.category);
  },
});

/**
 * Check if a feature is a safety feature (never paywalled)
 */
export const isSafetyFeature = query({
  args: { feature: v.string() },
  handler: async (ctx, args) => {
    return SAFETY_FEATURES.includes(args.feature);
  },
});

/**
 * Calculate annual price with 20% discount
 */
export const calculateAnnualPrice = query({
  args: { monthlyPrice: v.number() },
  handler: async (ctx, args) => {
    return Math.round(args.monthlyPrice * 12 * 0.8 * 100) / 100;
  },
});

/**
 * Calculate creator earnings from gift
 */
export const calculateGiftEarnings = query({
  args: { giftCredits: v.number() },
  handler: async (ctx, args) => {
    const creatorEarnings = Math.floor(args.giftCredits * REVENUE_SHARES.GIFT_CREATOR_SHARE);
    const platformFee = args.giftCredits - creatorEarnings;
    return { creatorEarnings, platformFee };
  },
});

/**
 * Calculate host earnings from event
 */
export const calculateEventEarnings = query({
  args: { ticketPrice: v.number() },
  handler: async (ctx, args) => {
    const hostEarnings = Math.floor(args.ticketPrice * REVENUE_SHARES.EVENT_HOST_SHARE);
    const platformFee = args.ticketPrice - hostEarnings;
    return { hostEarnings, platformFee };
  },
});
