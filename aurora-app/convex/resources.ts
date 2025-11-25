import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get resources by category and location
export const getResources = query({
  args: {
    category: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    isGlobal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let resources = await ctx.db
      .query("safetyResources")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.category) {
      resources = resources.filter(r => r.category === args.category);
    }

    if (args.isGlobal) {
      resources = resources.filter(r => r.isGlobal === true);
    } else if (args.country) {
      resources = resources.filter(r => 
        r.isGlobal || r.country?.toLowerCase() === args.country?.toLowerCase()
      );
    }

    if (args.city) {
      const cityLower = args.city.toLowerCase();
      resources = resources.filter(r => 
        r.isGlobal || !r.city || r.city.toLowerCase() === cityLower
      );
    }

    // Sort by priority and verification
    return resources.sort((a, b) => {
      if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
      return (a.priority || 5) - (b.priority || 5);
    });
  },
});

// Get emergency hotlines by country
export const getEmergencyHotlines = query({
  args: { country: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let hotlines = await ctx.db
      .query("safetyResources")
      .filter((q) => 
        q.and(
          q.eq(q.field("category"), "hotline"),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    if (args.country) {
      hotlines = hotlines.filter(h => 
        h.isGlobal || h.country?.toLowerCase() === args.country?.toLowerCase()
      );
    }

    return hotlines.sort((a, b) => (a.priority || 5) - (b.priority || 5));
  },
});

// Search resources
export const searchResources = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    
    const resources = await ctx.db
      .query("safetyResources")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return resources.filter(r => 
      r.name.toLowerCase().includes(searchTerm) ||
      r.description.toLowerCase().includes(searchTerm) ||
      r.services?.some(s => s.toLowerCase().includes(searchTerm))
    );
  },
});

// Submit a new resource (community contribution)
export const submitResource = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    category: v.union(
      v.literal("shelter"),
      v.literal("hotline"),
      v.literal("legal"),
      v.literal("medical"),
      v.literal("counseling"),
      v.literal("financial"),
      v.literal("employment"),
      v.literal("education"),
      v.literal("community")
    ),
    description: v.string(),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    country: v.string(),
    city: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
    hours: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...resourceData } = args;

    // Award credits for contribution
    const user = await ctx.db.get(userId);
    if (user) {
      await ctx.db.patch(userId, {
        credits: (user.credits || 0) + 15,
      });

      await ctx.db.insert("transactions", {
        userId,
        amount: 15,
        type: "resource_submission",
        relatedId: "pending",
      });
    }

    return await ctx.db.insert("safetyResources", {
      ...resourceData,
      submittedBy: userId,
      isVerified: false,
      isActive: false, // Requires moderation
      isGlobal: false,
      priority: 10,
      verificationCount: 0,
    });
  },
});

// Verify a resource (community verification)
export const verifyResource = mutation({
  args: {
    resourceId: v.id("safetyResources"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("Resource not found");

    // Check if user already verified
    const existing = await ctx.db
      .query("resourceVerifications")
      .withIndex("by_resource_and_user", (q) => 
        q.eq("resourceId", args.resourceId).eq("userId", args.userId)
      )
      .first();

    if (existing) throw new Error("Already verified");

    await ctx.db.insert("resourceVerifications", {
      resourceId: args.resourceId,
      userId: args.userId,
    });

    const newCount = (resource.verificationCount || 0) + 1;
    await ctx.db.patch(args.resourceId, {
      verificationCount: newCount,
      isVerified: newCount >= 5,
      isActive: newCount >= 3, // Activate after 3 verifications
    });

    // Award credits
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + 5,
      });
    }
  },
});

// Report a resource issue
export const reportResource = mutation({
  args: {
    resourceId: v.id("safetyResources"),
    userId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resourceReports", {
      resourceId: args.resourceId,
      userId: args.userId,
      reason: args.reason,
      details: args.details,
      status: "pending",
    });
  },
});

// Get resource categories with counts
export const getCategories = query({
  args: { country: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let resources = await ctx.db
      .query("safetyResources")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.country) {
      resources = resources.filter(r => 
        r.isGlobal || r.country?.toLowerCase() === args.country?.toLowerCase()
      );
    }

    const categories = [
      { id: "hotline", name: "Emergency Hotlines", icon: "phone", color: "red" },
      { id: "shelter", name: "Safe Shelters", icon: "home", color: "purple" },
      { id: "legal", name: "Legal Aid", icon: "scale", color: "blue" },
      { id: "medical", name: "Medical Services", icon: "heart", color: "pink" },
      { id: "counseling", name: "Counseling", icon: "message-circle", color: "green" },
      { id: "financial", name: "Financial Help", icon: "dollar-sign", color: "yellow" },
      { id: "employment", name: "Job Resources", icon: "briefcase", color: "indigo" },
      { id: "education", name: "Education", icon: "book", color: "cyan" },
      { id: "community", name: "Community Groups", icon: "users", color: "orange" },
    ];

    return categories.map(cat => ({
      ...cat,
      count: resources.filter(r => r.category === cat.id).length,
    }));
  },
});
