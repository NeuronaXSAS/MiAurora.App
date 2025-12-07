import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// HABIT QUERIES
// ============================================

/**
 * Get all active habits for a user
 */
export const getHabits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

/**
 * Get habit completions for a date range (optimized for calendar view)
 */
export const getCompletions = query({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter by date range in memory (more efficient for small datasets)
    return completions.filter(
      (c) => c.date >= args.startDate && c.date <= args.endDate
    );
  },
});

/**
 * Get today's habit status for quick dashboard view
 */
export const getTodayStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];
    
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    const completions = await ctx.db
      .query("habitCompletions")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), today))
      .collect();

    const completionMap = new Map(completions.map((c) => [c.habitId, c]));

    return habits.map((habit) => ({
      ...habit,
      todayCompleted: completionMap.get(habit._id)?.completed || false,
      todayNote: completionMap.get(habit._id)?.note,
    }));
  },
});

/**
 * Get habit statistics for profile/dashboard
 */
export const getHabitStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeHabits = habits.filter((h) => h.isActive && !h.isArchived);
    const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
    const longestStreak = Math.max(...habits.map((h) => h.longestStreak), 0);
    const currentStreaks = activeHabits.filter((h) => h.currentStreak > 0).length;

    return {
      totalHabits: activeHabits.length,
      totalCompletions,
      longestStreak,
      activeStreaks: currentStreaks,
      habits: activeHabits,
    };
  },
});

// ============================================
// HABIT MUTATIONS
// ============================================

/**
 * Create a new habit
 */
export const createHabit = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
    type: v.union(v.literal("build"), v.literal("break")),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("custom")),
    targetDays: v.optional(v.array(v.number())),
    reminderTime: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const habitId = await ctx.db.insert("habits", {
      userId: args.userId,
      name: args.name,
      emoji: args.emoji,
      type: args.type,
      frequency: args.frequency,
      targetDays: args.targetDays,
      reminderTime: args.reminderTime,
      color: args.color,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      isActive: true,
      createdAt: Date.now(),
    });

    // Award credits for creating a habit (encourages engagement)
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + 5,
        monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 5,
      });
      await ctx.db.insert("transactions", {
        userId: args.userId,
        amount: 5,
        type: "habit_created",
        relatedId: habitId,
      });
    }

    return { habitId, creditsEarned: 5 };
  },
});

/**
 * Toggle habit completion for today
 */
export const toggleCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.optional(v.string()),
    note: v.optional(v.string()),
    difficulty: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = args.date || new Date().toISOString().split("T")[0];
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== args.userId) {
      throw new Error("Habit not found");
    }

    // Check if already completed today
    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) => 
        q.eq("habitId", args.habitId).eq("date", today)
      )
      .first();

    if (existing) {
      // Toggle off - remove completion
      await ctx.db.delete(existing._id);
      
      // Update streak (recalculate)
      const newStreak = await calculateStreak(ctx, args.habitId, today);
      await ctx.db.patch(args.habitId, {
        currentStreak: newStreak,
        totalCompletions: Math.max(0, habit.totalCompletions - 1),
      });

      return { completed: false, streak: newStreak };
    } else {
      // Complete the habit
      await ctx.db.insert("habitCompletions", {
        habitId: args.habitId,
        userId: args.userId,
        date: today,
        completed: true,
        note: args.note,
        difficulty: args.difficulty,
      });

      // Update streak
      const newStreak = await calculateStreak(ctx, args.habitId, today);
      const newLongest = Math.max(habit.longestStreak, newStreak);
      
      await ctx.db.patch(args.habitId, {
        currentStreak: newStreak,
        longestStreak: newLongest,
        totalCompletions: habit.totalCompletions + 1,
      });

      // Award credits for completion
      let creditsEarned = 2; // Base credits
      if (newStreak === 7) creditsEarned += 10; // Week streak bonus
      if (newStreak === 30) creditsEarned += 50; // Month streak bonus
      if (newStreak === 100) creditsEarned += 200; // 100 day bonus

      const user = await ctx.db.get(args.userId);
      if (user) {
        await ctx.db.patch(args.userId, {
          credits: user.credits + creditsEarned,
          monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + creditsEarned,
        });
        await ctx.db.insert("transactions", {
          userId: args.userId,
          amount: creditsEarned,
          type: "habit_completion",
          relatedId: args.habitId,
        });
      }

      return { 
        completed: true, 
        streak: newStreak, 
        isNewRecord: newStreak > habit.longestStreak,
        creditsEarned,
        milestone: newStreak === 7 || newStreak === 30 || newStreak === 100 ? newStreak : null,
      };
    }
  },
});

/**
 * Update habit settings
 */
export const updateHabit = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    reminderTime: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== args.userId) {
      throw new Error("Habit not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.emoji !== undefined) updates.emoji = args.emoji;
    if (args.reminderTime !== undefined) updates.reminderTime = args.reminderTime;
    if (args.color !== undefined) updates.color = args.color;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.habitId, updates);
    return { success: true };
  },
});

/**
 * Archive a habit (soft delete)
 */
export const archiveHabit = mutation({
  args: {
    habitId: v.id("habits"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== args.userId) {
      throw new Error("Habit not found");
    }

    await ctx.db.patch(args.habitId, {
      isActive: false,
      isArchived: true,
    });

    return { success: true };
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function calculateStreak(
  ctx: { db: any },
  habitId: string,
  fromDate: string
): Promise<number> {
  const completions = await ctx.db
    .query("habitCompletions")
    .withIndex("by_habit", (q: any) => q.eq("habitId", habitId))
    .collect();

  const completedDates = new Set(
    completions.filter((c: any) => c.completed).map((c: any) => c.date)
  );

  let streak = 0;
  const date = new Date(fromDate);
  
  while (true) {
    const dateStr = date.toISOString().split("T")[0];
    if (completedDates.has(dateStr)) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============================================
// GOALS QUERIES & MUTATIONS
// ============================================

export const getGoals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personalGoals")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();
  },
});

export const createGoal = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("health"),
      v.literal("career"),
      v.literal("relationships"),
      v.literal("finance"),
      v.literal("education"),
      v.literal("creativity"),
      v.literal("mindfulness"),
      v.literal("fitness"),
      v.literal("other")
    ),
    targetDate: v.optional(v.string()),
    milestones: v.optional(v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
    }))),
  },
  handler: async (ctx, args) => {
    const goalId = await ctx.db.insert("personalGoals", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      category: args.category,
      targetDate: args.targetDate,
      progress: 0,
      milestones: args.milestones?.map((m) => ({ ...m, completedAt: undefined })),
      isCompleted: false,
      isActive: true,
      createdAt: Date.now(),
    });

    return { goalId };
  },
});

export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("personalGoals"),
    userId: v.id("users"),
    progress: v.optional(v.number()),
    milestoneIndex: v.optional(v.number()),
    milestoneCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== args.userId) {
      throw new Error("Goal not found");
    }

    const updates: Record<string, unknown> = {};

    if (args.progress !== undefined) {
      updates.progress = args.progress;
      if (args.progress >= 100) {
        updates.isCompleted = true;
        updates.completedAt = Date.now();
        
        // Award credits for completing a goal
        const user = await ctx.db.get(args.userId);
        if (user) {
          await ctx.db.patch(args.userId, {
            credits: user.credits + 25,
            monthlyCreditsEarned: (user.monthlyCreditsEarned || 0) + 25,
          });
          await ctx.db.insert("transactions", {
            userId: args.userId,
            amount: 25,
            type: "goal_completed",
            relatedId: args.goalId,
          });
        }
      }
    }

    if (args.milestoneIndex !== undefined && goal.milestones) {
      const milestones = [...goal.milestones];
      if (milestones[args.milestoneIndex]) {
        milestones[args.milestoneIndex] = {
          ...milestones[args.milestoneIndex],
          completed: args.milestoneCompleted ?? true,
          completedAt: args.milestoneCompleted ? Date.now() : undefined,
        };
        updates.milestones = milestones;
        
        // Auto-calculate progress based on milestones
        const completedCount = milestones.filter((m) => m.completed).length;
        updates.progress = Math.round((completedCount / milestones.length) * 100);
      }
    }

    await ctx.db.patch(args.goalId, updates);
    return { success: true };
  },
});

// ============================================
// AFFIRMATIONS
// ============================================

export const getDailyAffirmation = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all affirmations
    const affirmations = await ctx.db
      .query("dailyAffirmations")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (affirmations.length === 0) {
      // Return default affirmation if none in DB
      return {
        text: "You are capable of amazing things. Today is full of possibilities.",
        category: "strength",
        author: "Aurora App",
      };
    }

    // Get user's history to avoid repeats
    const history = await ctx.db
      .query("userAffirmationHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentIds = new Set(
      history
        .sort((a, b) => b.shownAt - a.shownAt)
        .slice(0, Math.min(10, affirmations.length - 1))
        .map((h) => h.affirmationId)
    );

    // Pick one not recently shown
    const available = affirmations.filter((a) => !recentIds.has(a._id));
    const selected = available.length > 0 
      ? available[Math.floor(Math.random() * available.length)]
      : affirmations[Math.floor(Math.random() * affirmations.length)];

    return selected;
  },
});


// ============================================
// SEED AFFIRMATIONS
// ============================================

export const seedAffirmations = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("dailyAffirmations").first();
    if (existing) {
      return { message: "Affirmations already seeded", count: 0 };
    }

    const affirmations = [
      // Self-love
      { category: "self-love" as const, text: "You are worthy of love exactly as you are.", author: "Aurora App" },
      { category: "self-love" as const, text: "Your imperfections make you beautifully unique.", author: "Aurora App" },
      { category: "self-love" as const, text: "You deserve kindness, especially from yourself.", author: "Aurora App" },
      { category: "self-love" as const, text: "Your body is your home. Treat it with love.", author: "Aurora App" },
      
      // Strength
      { category: "strength" as const, text: "You are stronger than you know and braver than you believe.", author: "Aurora App" },
      { category: "strength" as const, text: "Every challenge you've overcome has made you who you are.", author: "Aurora App" },
      { category: "strength" as const, text: "Your resilience is your superpower.", author: "Aurora App" },
      { category: "strength" as const, text: "You have survived 100% of your worst days.", author: "Aurora App" },
      
      // Growth
      { category: "growth" as const, text: "Every day is a new opportunity to grow.", author: "Aurora App" },
      { category: "growth" as const, text: "Progress, not perfection, is what matters.", author: "Aurora App" },
      { category: "growth" as const, text: "Your potential is limitless.", author: "Aurora App" },
      { category: "growth" as const, text: "Small steps lead to big transformations.", author: "Aurora App" },
      
      // Healing
      { category: "healing" as const, text: "Healing is not linear, and that's okay.", author: "Aurora App" },
      { category: "healing" as const, text: "You are allowed to take up space and time to heal.", author: "Aurora App" },
      { category: "healing" as const, text: "Your past does not define your future.", author: "Aurora App" },
      { category: "healing" as const, text: "It's okay to rest. You don't have to earn it.", author: "Aurora App" },
      
      // Success
      { category: "success" as const, text: "You are capable of achieving your dreams.", author: "Aurora App" },
      { category: "success" as const, text: "Success is built one small win at a time.", author: "Aurora App" },
      { category: "success" as const, text: "Your hard work will pay off.", author: "Aurora App" },
      { category: "success" as const, text: "You belong in every room you enter.", author: "Aurora App" },
      
      // Peace
      { category: "peace" as const, text: "You are allowed to choose peace over chaos.", author: "Aurora App" },
      { category: "peace" as const, text: "Breathe. This moment is enough.", author: "Aurora App" },
      { category: "peace" as const, text: "You don't have to have it all figured out.", author: "Aurora App" },
      { category: "peace" as const, text: "Let go of what you cannot control.", author: "Aurora App" },
    ];

    let count = 0;
    for (const aff of affirmations) {
      await ctx.db.insert("dailyAffirmations", {
        ...aff,
        isActive: true,
      });
      count++;
    }

    return { message: "Affirmations seeded successfully", count };
  },
});
