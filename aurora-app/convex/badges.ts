import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Aurora Badges - Empowering Achievement System
 * 
 * Badges celebrate women's achievements and encourage positive behaviors.
 * Each badge has a beautiful design and empowering message.
 */

// Badge definitions with empowering themes
export const BADGE_DEFINITIONS = {
  // Safety & Community
  guardian_angel: {
    id: "guardian_angel",
    name: "Guardian Angel",
    description: "Helped 5 women feel safer",
    emoji: "👼",
    color: "#d6f4ec", // Aurora Mint
    category: "safety",
    points: 50,
    requirement: { type: "safety_helps", count: 5 },
  },
  safety_champion: {
    id: "safety_champion",
    name: "Safety Champion",
    description: "Verified 10 safe routes",
    emoji: "🛡️",
    color: "#c9cef4", // Aurora Lavender
    category: "safety",
    points: 100,
    requirement: { type: "routes_verified", count: 10 },
  },
  sister_keeper: {
    id: "sister_keeper",
    name: "Sister's Keeper",
    description: "Accompanied 3 sisters safely",
    emoji: "🤝",
    color: "#f29de5", // Aurora Pink
    category: "community",
    points: 75,
    requirement: { type: "accompaniments", count: 3 },
  },
  
  // Wellness & Self-Care
  hydration_queen: {
    id: "hydration_queen",
    name: "Hydration Queen",
    description: "7-day hydration streak",
    emoji: "💧",
    color: "#2e2ad6", // Aurora Blue
    category: "wellness",
    points: 30,
    requirement: { type: "hydration_streak", count: 7 },
  },
  mindful_warrior: {
    id: "mindful_warrior",
    name: "Mindful Warrior",
    description: "Completed 10 meditation sessions",
    emoji: "🧘‍♀️",
    color: "#5537a7", // Aurora Purple
    category: "wellness",
    points: 50,
    requirement: { type: "meditations", count: 10 },
  },
  mood_tracker: {
    id: "mood_tracker",
    name: "Self-Aware Queen",
    description: "Logged mood for 14 days",
    emoji: "💜",
    color: "#f29de5", // Aurora Pink
    category: "wellness",
    points: 40,
    requirement: { type: "mood_logs", count: 14 },
  },
  
  // Content & Engagement
  storyteller: {
    id: "storyteller",
    name: "Storyteller",
    description: "Shared 5 inspiring posts",
    emoji: "✨",
    color: "#e5e093", // Aurora Yellow
    category: "content",
    points: 25,
    requirement: { type: "posts_created", count: 5 },
  },
  reel_star: {
    id: "reel_star",
    name: "Reel Star",
    description: "Created 3 reels",
    emoji: "🎬",
    color: "#f05a6b", // Aurora Salmon
    category: "content",
    points: 45,
    requirement: { type: "reels_created", count: 3 },
  },
  viral_queen: {
    id: "viral_queen",
    name: "Viral Queen",
    description: "Got 1000 views on a reel",
    emoji: "👑",
    color: "#e5e093", // Aurora Yellow
    category: "content",
    points: 100,
    requirement: { type: "viral_reel", count: 1000 },
  },
  
  // Career & Growth
  opportunity_seeker: {
    id: "opportunity_seeker",
    name: "Opportunity Seeker",
    description: "Unlocked 3 opportunities",
    emoji: "🚀",
    color: "#2e2ad6", // Aurora Blue
    category: "career",
    points: 35,
    requirement: { type: "opportunities_unlocked", count: 3 },
  },
  mentor_heart: {
    id: "mentor_heart",
    name: "Mentor Heart",
    description: "Helped 5 women with advice",
    emoji: "💝",
    color: "#f29de5", // Aurora Pink
    category: "career",
    points: 60,
    requirement: { type: "helpful_comments", count: 5 },
  },
  
  // Special & Milestones
  aurora_pioneer: {
    id: "aurora_pioneer",
    name: "Aurora Pioneer",
    description: "Early adopter of Aurora App",
    emoji: "🌟",
    color: "#5537a7", // Aurora Purple
    category: "special",
    points: 100,
    requirement: { type: "early_adopter", count: 1 },
  },
  credit_collector: {
    id: "credit_collector",
    name: "Credit Collector",
    description: "Earned 500 credits",
    emoji: "💰",
    color: "#e5e093", // Aurora Yellow
    category: "milestone",
    points: 50,
    requirement: { type: "credits_earned", count: 500 },
  },
  consistency_queen: {
    id: "consistency_queen",
    name: "Consistency Queen",
    description: "Active for 30 days",
    emoji: "🔥",
    color: "#ec4c28", // Aurora Orange (special use)
    category: "milestone",
    points: 150,
    requirement: { type: "active_days", count: 30 },
  },
} as const;

export type BadgeId = keyof typeof BADGE_DEFINITIONS;

/**
 * Get all badges for a user
 */
export const getUserBadges = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const badges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with badge definitions
    return badges.map((badge) => ({
      ...badge,
      definition: BADGE_DEFINITIONS[badge.badgeId as BadgeId],
    }));
  },
});

/**
 * Award a badge to a user
 */
export const awardBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeId: v.string(),
  },
  handler: async (ctx, args) => {
    const badgeDef = BADGE_DEFINITIONS[args.badgeId as BadgeId];
    if (!badgeDef) {
      throw new Error("Invalid badge ID");
    }

    // Check if already has badge
    const existing = await ctx.db
      .query("userBadges")
      .withIndex("by_user_and_badge", (q) =>
        q.eq("userId", args.userId).eq("badgeId", args.badgeId)
      )
      .first();

    if (existing) {
      return { success: false, reason: "already_has_badge" };
    }

    // Award badge
    const badgeRecord = await ctx.db.insert("userBadges", {
      userId: args.userId,
      badgeId: args.badgeId,
      earnedAt: Date.now(),
      isNew: true,
    });

    // Award points
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + badgeDef.points,
      });

      // Log transaction
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: badgeDef.points,
        type: "badge_earned",
        relatedId: args.badgeId,
      });
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "verification", // Using existing type
      title: `🎉 New Badge: ${badgeDef.name}!`,
      message: `${badgeDef.emoji} ${badgeDef.description}. You earned ${badgeDef.points} credits!`,
      isRead: false,
      actionUrl: "/profile?tab=badges",
    });

    return { success: true, badgeId: badgeRecord, points: badgeDef.points };
  },
});

/**
 * Mark badge as seen (not new)
 */
export const markBadgeSeen = mutation({
  args: {
    badgeRecordId: v.id("userBadges"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.badgeRecordId, { isNew: false });
    return { success: true };
  },
});

/**
 * Check and award badges based on user activity
 */
export const checkBadgeProgress = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { awarded: [] };

    const awarded: string[] = [];

    // Get existing badges
    const existingBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const hasBadge = (id: string) => existingBadges.some((b) => b.badgeId === id);

    // Check hydration streak
    const hydrationLogs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(7);
    
    if (hydrationLogs.length >= 7 && hydrationLogs.every((h) => h.glasses >= 4)) {
      if (!hasBadge("hydration_queen")) {
        await ctx.db.insert("userBadges", {
          userId: args.userId,
          badgeId: "hydration_queen",
          earnedAt: Date.now(),
          isNew: true,
        });
        awarded.push("hydration_queen");
      }
    }

    // Check meditation sessions
    const meditations = await ctx.db
      .query("meditationSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    if (meditations.filter((m) => m.completed).length >= 10 && !hasBadge("mindful_warrior")) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: "mindful_warrior",
        earnedAt: Date.now(),
        isNew: true,
      });
      awarded.push("mindful_warrior");
    }

    // Check mood logs
    const moodLogs = await ctx.db
      .query("emotionalCheckins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    if (moodLogs.length >= 14 && !hasBadge("mood_tracker")) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: "mood_tracker",
        earnedAt: Date.now(),
        isNew: true,
      });
      awarded.push("mood_tracker");
    }

    // Check posts created
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    
    if (posts.length >= 5 && !hasBadge("storyteller")) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: "storyteller",
        earnedAt: Date.now(),
        isNew: true,
      });
      awarded.push("storyteller");
    }

    // Check reels created
    const reels = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    
    if (reels.length >= 3 && !hasBadge("reel_star")) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: "reel_star",
        earnedAt: Date.now(),
        isNew: true,
      });
      awarded.push("reel_star");
    }

    // Check viral reel
    const viralReel = reels.find((r) => r.views >= 1000);
    if (viralReel && !hasBadge("viral_queen")) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: "viral_queen",
        earnedAt: Date.now(),
        isNew: true,
      });
      awarded.push("viral_queen");
    }

    // Check credits earned
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const totalEarned = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (totalEarned >= 500 && !hasBadge("credit_collector")) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: "credit_collector",
        earnedAt: Date.now(),
        isNew: true,
      });
      awarded.push("credit_collector");
    }

    // Create notifications for awarded badges
    for (const badgeId of awarded) {
      const def = BADGE_DEFINITIONS[badgeId as BadgeId];
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "verification",
        title: `🎉 New Badge Earned!`,
        message: `${def.emoji} ${def.name}: ${def.description}. +${def.points} credits!`,
        isRead: false,
        actionUrl: "/profile?tab=badges",
      });

      // Award points
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + def.points,
      });
    }

    return { awarded };
  },
});

/**
 * Get badge progress for a user
 */
export const getBadgeProgress = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const earnedIds = new Set(existingBadges.map((b) => b.badgeId));

    // Calculate progress for each badge
    const progress: Record<string, { current: number; required: number; percentage: number }> = {};

    // Get counts for progress calculation
    const hydrationLogs = await ctx.db
      .query("hydrationLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(7);
    
    const consecutiveHydration = hydrationLogs.filter((h) => h.glasses >= 4).length;
    progress.hydration_queen = { current: consecutiveHydration, required: 7, percentage: Math.min(100, (consecutiveHydration / 7) * 100) };

    const meditations = await ctx.db
      .query("meditationSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const completedMeditations = meditations.filter((m) => m.completed).length;
    progress.mindful_warrior = { current: completedMeditations, required: 10, percentage: Math.min(100, (completedMeditations / 10) * 100) };

    const moodLogs = await ctx.db
      .query("emotionalCheckins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    progress.mood_tracker = { current: moodLogs.length, required: 14, percentage: Math.min(100, (moodLogs.length / 14) * 100) };

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    progress.storyteller = { current: posts.length, required: 5, percentage: Math.min(100, (posts.length / 5) * 100) };

    const reels = await ctx.db
      .query("reels")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect();
    progress.reel_star = { current: reels.length, required: 3, percentage: Math.min(100, (reels.length / 3) * 100) };

    const maxViews = reels.length > 0 ? Math.max(...reels.map((r) => r.views)) : 0;
    progress.viral_queen = { current: maxViews, required: 1000, percentage: Math.min(100, (maxViews / 1000) * 100) };

    return {
      earned: existingBadges.length,
      total: Object.keys(BADGE_DEFINITIONS).length,
      earnedIds: Array.from(earnedIds),
      progress,
    };
  },
});
