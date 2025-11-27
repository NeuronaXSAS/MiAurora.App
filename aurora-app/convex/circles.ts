import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new circle (support group)
export const createCircle = mutation({
  args: {
    creatorId: v.id("users"),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("career"),
      v.literal("motherhood"),
      v.literal("health"),
      v.literal("safety"),
      v.literal("relationships"),
      v.literal("finance"),
      v.literal("wellness"),
      v.literal("tech"),
      v.literal("entrepreneurship"),
      v.literal("general")
    ),
    isPrivate: v.boolean(),
    maxMembers: v.optional(v.number()),
    rules: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { creatorId, ...circleData } = args;

    const circleId = await ctx.db.insert("circles", {
      ...circleData,
      creatorId,
      memberCount: 1,
      postCount: 0,
      isActive: true,
    });

    // Add creator as admin member
    await ctx.db.insert("circleMembers", {
      circleId,
      userId: creatorId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Award credits for creating a circle
    const user = await ctx.db.get(creatorId);
    if (user) {
      await ctx.db.patch(creatorId, {
        credits: (user.credits || 0) + 20,
      });
    }

    return circleId;
  },
});

// Join a circle
export const joinCircle = mutation({
  args: {
    circleId: v.id("circles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const circle = await ctx.db.get(args.circleId);
    if (!circle) throw new Error("Circle not found");

    // Check if already a member
    const existing = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.userId)
      )
      .first();

    if (existing) throw new Error("Already a member");

    // Check max members
    if (circle.maxMembers && circle.memberCount >= circle.maxMembers) {
      throw new Error("Circle is full");
    }

    await ctx.db.insert("circleMembers", {
      circleId: args.circleId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });

    await ctx.db.patch(args.circleId, {
      memberCount: circle.memberCount + 1,
    });

    return { success: true };
  },
});

// Leave a circle
export const leaveCircle = mutation({
  args: {
    circleId: v.id("circles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.userId)
      )
      .first();

    if (!membership) throw new Error("Not a member");

    const circle = await ctx.db.get(args.circleId);
    if (!circle) throw new Error("Circle not found");

    // Can't leave if you're the only admin
    if (membership.role === "admin") {
      const admins = await ctx.db
        .query("circleMembers")
        .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      if (admins.length === 1) {
        throw new Error("Cannot leave - you are the only admin. Transfer ownership first.");
      }
    }

    await ctx.db.delete(membership._id);
    await ctx.db.patch(args.circleId, {
      memberCount: Math.max(0, circle.memberCount - 1),
    });

    return { success: true };
  },
});

// Get circles (discover)
export const getCircles = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let circles = await ctx.db
      .query("circles")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isPrivate"), false)
        )
      )
      .order("desc")
      .take(args.limit || 50);

    if (args.category) {
      circles = circles.filter(c => c.category === args.category);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      circles = circles.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Get creator info
    const circlesWithCreators = await Promise.all(
      circles.map(async (circle) => {
        const creator = await ctx.db.get(circle.creatorId);
        return {
          ...circle,
          creator: creator ? {
            name: creator.name,
            profileImage: creator.profileImage,
          } : null,
        };
      })
    );

    return circlesWithCreators;
  },
});

// Get user's circles
export const getMyCircles = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("circleMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const circles = await Promise.all(
      memberships.map(async (m) => {
        const circle = await ctx.db.get(m.circleId);
        return circle ? { ...circle, role: m.role, joinedAt: m.joinedAt } : null;
      })
    );

    return circles.filter(Boolean);
  },
});

// Get circle details
export const getCircle = query({
  args: { circleId: v.id("circles") },
  handler: async (ctx, args) => {
    const circle = await ctx.db.get(args.circleId);
    if (!circle) return null;

    const creator = await ctx.db.get(circle.creatorId);
    
    // Get recent members
    const members = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .order("desc")
      .take(10);

    const memberDetails = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return user ? {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage,
          role: m.role,
        } : null;
      })
    );

    return {
      ...circle,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        profileImage: creator.profileImage,
      } : null,
      recentMembers: memberDetails.filter(Boolean),
    };
  },
});

// Post to circle
export const createCirclePost = mutation({
  args: {
    circleId: v.id("circles"),
    userId: v.id("users"),
    content: v.string(),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify membership
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.userId)
      )
      .first();

    if (!membership) throw new Error("Must be a member to post");

    const postId = await ctx.db.insert("circlePosts", {
      circleId: args.circleId,
      authorId: args.userId,
      content: args.content,
      isAnonymous: args.isAnonymous || false,
      likes: 0,
      commentCount: 0,
    });

    // Update circle post count
    const circle = await ctx.db.get(args.circleId);
    if (circle) {
      await ctx.db.patch(args.circleId, {
        postCount: circle.postCount + 1,
      });
    }

    // Award credits
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: (user.credits || 0) + 5,
      });
    }

    return postId;
  },
});

// Get circle posts
export const getCirclePosts = query({
  args: {
    circleId: v.id("circles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("circlePosts")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .order("desc")
      .take(args.limit || 50);

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        if (post.isAnonymous) {
          return { ...post, author: { name: "Anonymous", avatarConfig: null } };
        }
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author ? {
            _id: author._id,
            name: author.name,
            profileImage: author.profileImage,
            avatarConfig: author.avatarConfig,
          } : null,
        };
      })
    );

    return postsWithAuthors;
  },
});

// Check membership
export const checkMembership = query({
  args: {
    circleId: v.id("circles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.userId)
      )
      .first();

    return membership ? { isMember: true, role: membership.role } : { isMember: false };
  },
});

// Get circle categories
export const getCircleCategories = query({
  args: {},
  handler: async () => {
    try {
      return [
        { id: "career", name: "Career & Work", icon: "briefcase", color: "blue" },
        { id: "motherhood", name: "Motherhood", icon: "heart", color: "pink" },
        { id: "health", name: "Health & Wellness", icon: "activity", color: "green" },
        { id: "safety", name: "Safety & Support", icon: "shield", color: "red" },
        { id: "relationships", name: "Relationships", icon: "users", color: "purple" },
        { id: "finance", name: "Finance & Money", icon: "dollar-sign", color: "yellow" },
        { id: "wellness", name: "Mental Wellness", icon: "sun", color: "orange" },
        { id: "tech", name: "Women in Tech", icon: "code", color: "cyan" },
        { id: "entrepreneurship", name: "Entrepreneurship", icon: "rocket", color: "indigo" },
        { id: "general", name: "General", icon: "message-circle", color: "gray" },
      ];
    } catch {
      return [];
    }
  },
});

// Get circle details with user's role
export const getCircleDetails = query({
  args: {
    circleId: v.id("circles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const circle = await ctx.db.get(args.circleId);
    if (!circle) return null;

    const membership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.userId)
      )
      .first();

    const creator = await ctx.db.get(circle.creatorId);

    return {
      ...circle,
      role: membership?.role || null,
      isMember: !!membership,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        profileImage: creator.profileImage,
      } : null,
    };
  },
});

// Get circle members
export const getCircleMembers = query({
  args: { circleId: v.id("circles") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          _id: m._id,
          role: m.role,
          joinedAt: m.joinedAt,
          user: user ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarConfig: user.avatarConfig,
            profileImage: user.profileImage,
          } : null,
        };
      })
    );

    return membersWithUsers.filter(m => m.user !== null);
  },
});

// Search users to invite to circle
export const searchUsersToInvite = query({
  args: {
    circleId: v.id("circles"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 2) return [];

    // Get current members
    const currentMembers = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle", (q) => q.eq("circleId", args.circleId))
      .collect();
    
    const memberIds = new Set(currentMembers.map(m => m.userId));

    // Search users
    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.searchTerm.toLowerCase();
    
    const results = allUsers
      .filter(user => 
        !memberIds.has(user._id) &&
        (user.name.toLowerCase().includes(searchLower) ||
         user.email.toLowerCase().includes(searchLower))
      )
      .slice(0, 10)
      .map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarConfig: user.avatarConfig,
        profileImage: user.profileImage,
      }));

    return results;
  },
});

// Get suggested members to connect with
export const getSuggestedMembers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get user's circles
    const userMemberships = await ctx.db
      .query("circleMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const userCircleIds = new Set(userMemberships.map(m => m.circleId));
    
    // Get members from same circles
    const potentialMembers: Map<string, { user: any; sharedCircles: number }> = new Map();
    
    for (const circleId of userCircleIds) {
      const circleMembers = await ctx.db
        .query("circleMembers")
        .withIndex("by_circle", (q) => q.eq("circleId", circleId))
        .collect();
      
      for (const member of circleMembers) {
        if (member.userId !== args.userId) {
          const existing = potentialMembers.get(member.userId);
          if (existing) {
            existing.sharedCircles++;
          } else {
            const user = await ctx.db.get(member.userId);
            if (user) {
              potentialMembers.set(member.userId, {
                user: {
                  _id: user._id,
                  name: user.name,
                  bio: user.bio,
                  industry: user.industry,
                  location: user.location,
                  interests: user.interests,
                  avatarConfig: user.avatarConfig,
                  profileImage: user.profileImage,
                  trustScore: user.trustScore,
                },
                sharedCircles: 1,
              });
            }
          }
        }
      }
    }
    
    // Sort by shared circles and return
    const sorted = Array.from(potentialMembers.values())
      .sort((a, b) => b.sharedCircles - a.sharedCircles)
      .slice(0, limit)
      .map(({ user, sharedCircles }) => ({ ...user, sharedCircles }));
    
    // If not enough from circles, add some random users
    if (sorted.length < limit) {
      const allUsers = await ctx.db.query("users").take(50);
      const existingIds = new Set(sorted.map(u => u._id));
      existingIds.add(args.userId);
      
      for (const user of allUsers) {
        if (!existingIds.has(user._id) && sorted.length < limit) {
          sorted.push({
            _id: user._id,
            name: user.name,
            bio: user.bio,
            industry: user.industry,
            location: user.location,
            interests: user.interests,
            avatarConfig: user.avatarConfig,
            profileImage: user.profileImage,
            trustScore: user.trustScore,
            sharedCircles: 0,
          });
        }
      }
    }
    
    return sorted;
  },
});

// Search members
export const searchMembers = query({
  args: {
    userId: v.id("users"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 2) return [];
    
    const searchLower = args.searchTerm.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();
    
    const results = allUsers
      .filter(user => 
        user._id !== args.userId &&
        (user.name.toLowerCase().includes(searchLower) ||
         user.industry?.toLowerCase().includes(searchLower) ||
         user.location?.toLowerCase().includes(searchLower) ||
         user.interests?.some(i => i.toLowerCase().includes(searchLower)))
      )
      .slice(0, 20)
      .map(user => ({
        _id: user._id,
        name: user.name,
        bio: user.bio,
        industry: user.industry,
        location: user.location,
        interests: user.interests,
        avatarConfig: user.avatarConfig,
        profileImage: user.profileImage,
        trustScore: user.trustScore,
        sharedCircles: 0,
      }));
    
    return results;
  },
});

// Invite user to circle
export const inviteToCircle = mutation({
  args: {
    circleId: v.id("circles"),
    inviterId: v.id("users"),
    inviteeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify inviter is admin
    const inviterMembership = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.inviterId)
      )
      .first();

    if (!inviterMembership || inviterMembership.role !== "admin") {
      throw new Error("Only admins can invite members");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("circleMembers")
      .withIndex("by_circle_and_user", (q) => 
        q.eq("circleId", args.circleId).eq("userId", args.inviteeId)
      )
      .first();

    if (existing) throw new Error("User is already a member");

    const circle = await ctx.db.get(args.circleId);
    if (!circle) throw new Error("Circle not found");

    // Add as member
    await ctx.db.insert("circleMembers", {
      circleId: args.circleId,
      userId: args.inviteeId,
      role: "member",
      joinedAt: Date.now(),
    });

    await ctx.db.patch(args.circleId, {
      memberCount: circle.memberCount + 1,
    });

    // Create notification
    const inviter = await ctx.db.get(args.inviterId);
    await ctx.db.insert("notifications", {
      userId: args.inviteeId,
      type: "accompaniment_update",
      title: "Circle Invitation",
      message: `${inviter?.name || "Someone"} added you to "${circle.name}"`,
      isRead: false,
      fromUserId: args.inviterId,
      relatedId: args.circleId,
    });

    return { success: true };
  },
});
