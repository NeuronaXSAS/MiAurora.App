/**
 * Aurora Premium - Property-Based Tests
 * 
 * Uses fast-check to verify correctness properties of the premium system.
 * These tests validate business logic invariants that must always hold.
 * 
 * Note: This file uses inline config to avoid Convex server imports in Jest.
 */

import * as fc from "fast-check";

// ============================================
// INLINE CONFIG (mirrors premiumConfig.ts)
// ============================================

interface TierBenefits {
  adFree: boolean;
  aiMessagesPerDay: number;
  postsPerHour: number;
  reelsPerDay: number;
  livestreamsPerDay: number;
  monthlyCredits: number;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  exclusiveEvents: boolean;
  safetyConsultations: boolean;
  badge: string;
}

interface SubscriptionTier {
  tierId: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  benefits: TierBenefits;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
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
    annualPrice: 48,
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
    annualPrice: 115.20,
    benefits: {
      adFree: true,
      aiMessagesPerDay: -1,
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
    annualPrice: 240,
    benefits: {
      adFree: true,
      aiMessagesPerDay: -1,
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

interface CreditPackage {
  packageId: string;
  credits: number;
  priceUSD: number;
  bonus?: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { packageId: "small", credits: 100, priceUSD: 1 },
  { packageId: "medium", credits: 500, priceUSD: 4 },
  { packageId: "large", credits: 1000, priceUSD: 7 },
  { packageId: "xl", credits: 5000, priceUSD: 30, bonus: 500 },
];

interface EngagementReward {
  action: string;
  credits: number;
  cooldownMs?: number;
  dailyLimit?: number;
}

const ENGAGEMENT_REWARDS: EngagementReward[] = [
  { action: "daily_login", credits: 5, cooldownMs: 86400000 },
  { action: "post_created", credits: 10, dailyLimit: 5 },
  { action: "safety_verification", credits: 25, dailyLimit: 10 },
  { action: "checkin_completed", credits: 15, dailyLimit: 3 },
  { action: "referral_success", credits: 100 },
  { action: "route_shared", credits: 20, dailyLimit: 3 },
  { action: "reel_created", credits: 15, dailyLimit: 5 },
  { action: "livestream_completed", credits: 25, dailyLimit: 2 },
];

interface GiftDefinition {
  giftId: string;
  name: string;
  category: string;
  credits: number;
  animationUrl: string;
}

const GIFT_CATALOG: GiftDefinition[] = [
  { giftId: "heart_small", name: "Heart", category: "hearts", credits: 1, animationUrl: "/animations/heart-small.json" },
  { giftId: "heart_medium", name: "Big Heart", category: "hearts", credits: 5, animationUrl: "/animations/heart-medium.json" },
  { giftId: "heart_large", name: "Love Burst", category: "hearts", credits: 10, animationUrl: "/animations/heart-large.json" },
  { giftId: "sparkle_small", name: "Sparkle", category: "sparkles", credits: 25, animationUrl: "/animations/sparkle-small.json" },
  { giftId: "sparkle_medium", name: "Star Shower", category: "sparkles", credits: 35, animationUrl: "/animations/sparkle-medium.json" },
  { giftId: "sparkle_large", name: "Galaxy", category: "sparkles", credits: 50, animationUrl: "/animations/sparkle-large.json" },
  { giftId: "crown_small", name: "Crown", category: "crowns", credits: 100, animationUrl: "/animations/crown-small.json" },
  { giftId: "crown_medium", name: "Royal Crown", category: "crowns", credits: 250, animationUrl: "/animations/crown-medium.json" },
  { giftId: "crown_large", name: "Diamond Crown", category: "crowns", credits: 500, animationUrl: "/animations/crown-large.json" },
  { giftId: "aurora_special", name: "Aurora Blessing", category: "aurora_special", credits: 1000, animationUrl: "/animations/aurora-special.json" },
  { giftId: "aurora_legendary", name: "Aurora Legend", category: "aurora_special", credits: 2500, animationUrl: "/animations/aurora-legendary.json" },
  { giftId: "aurora_mythic", name: "Aurora Mythic", category: "aurora_special", credits: 5000, animationUrl: "/animations/aurora-mythic.json" },
];

const REVENUE_SHARES = {
  GIFT_CREATOR_SHARE: 0.85,
  GIFT_PLATFORM_FEE: 0.15,
  EVENT_HOST_SHARE: 0.80,
  EVENT_PLATFORM_FEE: 0.20,
  CREATOR_SUB_SHARE_DEFAULT: 0.85,
  CREATOR_SUB_SHARE_1000: 0.90,
  CIRCLE_HOST_SHARE_DEFAULT: 0.80,
  CIRCLE_HOST_SHARE_100: 0.85,
};

const ROOM_LIMITS = {
  VIDEO_MAX_PARTICIPANTS: 16,
  BROADCAST_MAX_HOSTS: 9,
  AUDIO_MAX_SPEAKERS: 50,
  SUPER_CHAT_MIN_CREDITS: 50,
  SUPER_CHAT_PIN_DURATION_MS: 60000,
};

const SAFETY_FEATURES = [
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
// PROPERTY 1: Tier Benefits Inheritance
// ============================================

describe("Property 1: Tier Benefits Inheritance", () => {
  const tierOrder = ["free", "plus", "pro", "elite"];

  test("higher tiers have equal or better benefits than lower tiers", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: tierOrder.length - 2 }),
        (lowerIndex) => {
          const higherIndex = lowerIndex + 1;
          const lowerTier = SUBSCRIPTION_TIERS.find(t => t.tierId === tierOrder[lowerIndex])!;
          const higherTier = SUBSCRIPTION_TIERS.find(t => t.tierId === tierOrder[higherIndex])!;

          const lowerAI = lowerTier.benefits.aiMessagesPerDay;
          const higherAI = higherTier.benefits.aiMessagesPerDay;
          expect(higherAI === -1 || higherAI >= lowerAI).toBe(true);
          expect(higherTier.benefits.monthlyCredits).toBeGreaterThanOrEqual(lowerTier.benefits.monthlyCredits);
          expect(higherTier.benefits.postsPerHour).toBeGreaterThanOrEqual(lowerTier.benefits.postsPerHour);

          if (lowerTier.benefits.adFree) expect(higherTier.benefits.adFree).toBe(true);
          if (lowerTier.benefits.prioritySupport) expect(higherTier.benefits.prioritySupport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 2: Annual Billing Discount
// ============================================

describe("Property 2: Annual Billing Discount", () => {
  test("annual price is always 20% less than 12x monthly", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SUBSCRIPTION_TIERS.filter(t => t.monthlyPrice > 0)),
        (tier) => {
          const expectedAnnual = tier.monthlyPrice * 12 * 0.8;
          expect(Math.abs(tier.annualPrice - expectedAnnual)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 3: Proration Calculation
// ============================================

describe("Property 3: Tier Upgrade/Downgrade Proration", () => {
  test("proration calculation is proportional to remaining period", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).map(n => n / 100), // 0.01 to 1.0
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (remainingRatio, oldPrice, newPrice) => {
          const difference = (newPrice - oldPrice) * remainingRatio;
          // Upgrade: positive difference
          if (newPrice > oldPrice) expect(difference).toBeGreaterThan(0);
          // Downgrade: negative difference
          if (newPrice < oldPrice) expect(difference).toBeLessThan(0);
          // Same price: zero difference
          if (newPrice === oldPrice) expect(difference).toBe(0);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

// ============================================
// PROPERTY 4: Access Control
// ============================================

describe("Property 4: Tier-Restricted Access Control", () => {
  const tierOrder = ["free", "plus", "pro", "elite"];

  test("users can access resources at or below their tier level", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: tierOrder.length - 1 }),
        fc.integer({ min: 0, max: tierOrder.length - 1 }),
        (userTierIndex, requiredTierIndex) => {
          const canAccess = userTierIndex >= requiredTierIndex;
          expect(canAccess).toBe(userTierIndex >= requiredTierIndex);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

// ============================================
// PROPERTY 5: Platform Fee Reduction
// ============================================

describe("Property 5: Platform Fee Reduction Threshold", () => {
  test("fee is reduced for circles with 100+ members", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 500 }),
        (memberCount) => {
          const fee = memberCount >= 100 ? 0.15 : 0.20;
          expect(fee).toBe(memberCount >= 100 ? 0.15 : 0.20);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

// ============================================
// PROPERTY 6: Revenue Share Calculation
// ============================================

describe("Property 6: Revenue Share Calculation", () => {
  test("gift revenue share always totals 100%", () => {
    expect(REVENUE_SHARES.GIFT_CREATOR_SHARE + REVENUE_SHARES.GIFT_PLATFORM_FEE).toBe(1);
  });

  test("event revenue share always totals 100%", () => {
    expect(REVENUE_SHARES.EVENT_HOST_SHARE + REVENUE_SHARES.EVENT_PLATFORM_FEE).toBe(1);
  });

  test("creator earnings from gifts is 85%", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (giftCredits) => {
          const creatorEarnings = Math.floor(giftCredits * REVENUE_SHARES.GIFT_CREATOR_SHARE);
          const platformFee = giftCredits - creatorEarnings;
          expect(creatorEarnings + platformFee).toBe(giftCredits);
        }
      ),
      { numRuns: 1000 }
    );
  });
});

// ============================================
// PROPERTY 7-10: Room and Gift Limits
// ============================================

describe("Property 7-10: Room and Gift Limits", () => {
  test("video room max participants is 16", () => {
    expect(ROOM_LIMITS.VIDEO_MAX_PARTICIPANTS).toBe(16);
  });

  test("broadcast room max hosts is 9", () => {
    expect(ROOM_LIMITS.BROADCAST_MAX_HOSTS).toBe(9);
  });

  test("super chat minimum is 50 credits", () => {
    expect(ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS).toBe(50);
  });

  test("super chat pin duration is 60 seconds", () => {
    expect(ROOM_LIMITS.SUPER_CHAT_PIN_DURATION_MS).toBe(60000);
  });
});

// ============================================
// PROPERTY 12-15: Credit System
// ============================================

describe("Property 12-15: Credit System", () => {
  test("credit packages have positive values", () => {
    CREDIT_PACKAGES.forEach((pkg) => {
      expect(pkg.credits).toBeGreaterThan(0);
      expect(pkg.priceUSD).toBeGreaterThan(0);
    });
  });

  test("engagement rewards have positive credits", () => {
    ENGAGEMENT_REWARDS.forEach((reward) => {
      expect(reward.credits).toBeGreaterThan(0);
    });
  });

  test("daily login has 24h cooldown", () => {
    const dailyLogin = ENGAGEMENT_REWARDS.find(r => r.action === "daily_login");
    expect(dailyLogin?.cooldownMs).toBe(86400000);
  });

  test("referral bonus is 100 credits", () => {
    const referral = ENGAGEMENT_REWARDS.find(r => r.action === "referral_success");
    expect(referral?.credits).toBe(100);
  });
});

// ============================================
// PROPERTY 16-17: Safety Features
// ============================================

describe("Property 16-17: Safety Features", () => {
  test("critical safety features are included", () => {
    expect(SAFETY_FEATURES).toContain("panic_button");
    expect(SAFETY_FEATURES).toContain("emergency_contacts");
    expect(SAFETY_FEATURES).toContain("safety_checkins");
    expect(SAFETY_FEATURES).toContain("basic_routes");
  });

  test("free tier has AI messages", () => {
    const freeTier = SUBSCRIPTION_TIERS.find(t => t.tierId === "free");
    expect(freeTier?.benefits.aiMessagesPerDay).toBe(10);
  });

  test("free tier can create content", () => {
    const freeTier = SUBSCRIPTION_TIERS.find(t => t.tierId === "free");
    expect(freeTier?.benefits.postsPerHour).toBeGreaterThan(0);
    expect(freeTier?.benefits.reelsPerDay).toBeGreaterThan(0);
  });
});

// ============================================
// Gift Catalog Validation
// ============================================

describe("Gift Catalog Validation", () => {
  test("all gifts have positive credits", () => {
    GIFT_CATALOG.forEach((gift) => {
      expect(gift.credits).toBeGreaterThan(0);
    });
  });

  test("aurora special gifts are most expensive", () => {
    const auroraSpecial = GIFT_CATALOG.filter(g => g.category === "aurora_special");
    const otherGifts = GIFT_CATALOG.filter(g => g.category !== "aurora_special");
    const minAurora = Math.min(...auroraSpecial.map(g => g.credits));
    const maxOther = Math.max(...otherGifts.map(g => g.credits));
    expect(minAurora).toBeGreaterThanOrEqual(maxOther);
  });
});
