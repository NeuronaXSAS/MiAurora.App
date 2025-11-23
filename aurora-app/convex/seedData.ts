import { mutation } from "./_generated/server";

/**
 * Seed database with demo content for demonstrations
 * Run this manually from Convex dashboard
 */
export const seedDemoData = mutation({
  handler: async (ctx) => {
    // Create demo users
    const demoUsers = [
      {
        workosId: "demo_user_1",
        email: "sarah@example.com",
        name: "Sarah Chen",
        credits: 150,
        trustScore: 450,
        industry: "Technology",
        location: "San Francisco, CA",
        careerGoals: "Senior Software Engineer at a mission-driven company",
        onboardingCompleted: true,
        bio: "Tech lead passionate about building inclusive products",
        interests: ["coding", "mentorship", "hiking"],
        monthlyCreditsEarned: 75,
        lastCreditReset: Date.now(),
      },
      {
        workosId: "demo_user_2",
        email: "maria@example.com",
        name: "Maria Rodriguez",
        credits: 200,
        trustScore: 680,
        industry: "Healthcare",
        location: "Austin, TX",
        careerGoals: "Open my own wellness clinic",
        onboardingCompleted: true,
        bio: "Nurse practitioner and women's health advocate",
        interests: ["healthcare", "wellness", "community"],
        monthlyCreditsEarned: 120,
        lastCreditReset: Date.now(),
      },
      {
        workosId: "demo_user_3",
        email: "aisha@example.com",
        name: "Aisha Patel",
        credits: 95,
        trustScore: 320,
        industry: "Finance",
        location: "New York, NY",
        careerGoals: "VP of Finance at a Fortune 500",
        onboardingCompleted: true,
        bio: "Financial analyst breaking barriers in fintech",
        interests: ["investing", "networking", "travel"],
        monthlyCreditsEarned: 45,
        lastCreditReset: Date.now(),
      },
    ];

    const userIds = [];
    for (const user of demoUsers) {
      const userId = await ctx.db.insert("users", user);
      userIds.push(userId);
    }

    // Create demo posts across all life dimensions
    const demoPosts = [
      {
        authorId: userIds[0],
        lifeDimension: "professional" as const,
        title: "Amazing Tech Company Culture at Stripe",
        description: "Just completed my first year at Stripe and the culture is incredible. Flexible work hours, generous parental leave, and genuine commitment to diversity. The engineering team is 40% women and leadership actively mentors junior developers. Highly recommend for anyone in tech!",
        rating: 5,
        location: {
          name: "Stripe HQ, San Francisco",
          coordinates: [-122.3964, 37.7897],
        },
        verificationCount: 8,
        isVerified: true,
        isAnonymous: false,
        upvotes: 24,
        downvotes: 1,
        commentCount: 5,
        postType: "standard" as const,
      },
      {
        authorId: userIds[1],
        lifeDimension: "daily" as const,
        title: "Safe and Welcoming Gym - Women Only Hours",
        description: "Equinox Downtown Austin has women-only hours from 6-8am daily. Clean facilities, great equipment, and respectful staff. Never felt uncomfortable. They also have excellent childcare services.",
        rating: 5,
        location: {
          name: "Equinox, Austin",
          coordinates: [-97.7431, 30.2672],
        },
        verificationCount: 12,
        isVerified: true,
        isAnonymous: false,
        upvotes: 45,
        downvotes: 2,
        commentCount: 8,
        postType: "standard" as const,
      },
      {
        authorId: userIds[2],
        lifeDimension: "financial" as const,
        title: "Excellent Financial Advisor for Women",
        description: "Morgan Stanley advisor Lisa Thompson specializes in helping women build wealth. She understands the unique challenges we face and provides judgment-free advice. Helped me negotiate a 30% raise!",
        rating: 5,
        location: {
          name: "Morgan Stanley, NYC",
          coordinates: [-74.0060, 40.7128],
        },
        verificationCount: 6,
        isVerified: true,
        isAnonymous: false,
        upvotes: 18,
        downvotes: 0,
        commentCount: 3,
        postType: "standard" as const,
      },
      {
        authorId: userIds[0],
        lifeDimension: "social" as const,
        title: "Women in Tech Meetup - Highly Recommend",
        description: "Monthly meetup at Galvanize SF. Great for networking, finding mentors, and making friends. Everyone is supportive and welcoming. They also have a Slack channel for job postings.",
        rating: 5,
        location: {
          name: "Galvanize, San Francisco",
          coordinates: [-122.3988, 37.7897],
        },
        verificationCount: 15,
        isVerified: true,
        isAnonymous: false,
        upvotes: 67,
        downvotes: 1,
        commentCount: 12,
        postType: "standard" as const,
      },
      {
        authorId: userIds[1],
        lifeDimension: "travel" as const,
        title: "Solo Travel: Iceland is Incredibly Safe",
        description: "Just returned from 2 weeks solo traveling in Iceland. Felt completely safe everywhere I went. People are friendly and helpful. Highly recommend for first-time solo travelers. The Blue Lagoon and Golden Circle are must-sees!",
        rating: 5,
        location: {
          name: "Reykjavik, Iceland",
          coordinates: [-21.8174, 64.1265],
        },
        verificationCount: 9,
        isVerified: true,
        isAnonymous: false,
        upvotes: 89,
        downvotes: 3,
        commentCount: 15,
        postType: "standard" as const,
      },
      {
        authorId: userIds[2],
        lifeDimension: "professional" as const,
        title: "Avoid: Toxic Workplace Culture",
        description: "Worked at [Company] for 6 months. Constant microaggressions, pay gap issues, and zero work-life balance. Management doesn't listen to concerns. Left for my mental health. Interview carefully and ask about DEI initiatives.",
        rating: 1,
        verificationCount: 4,
        isVerified: false,
        isAnonymous: true,
        upvotes: 34,
        downvotes: 5,
        commentCount: 7,
        postType: "standard" as const,
      },
      {
        authorId: userIds[0],
        lifeDimension: "daily" as const,
        title: "Great Coffee Shop for Remote Work",
        description: "Sightglass Coffee in SF has excellent wifi, plenty of outlets, and comfortable seating. Staff is friendly and it's in a safe neighborhood. Perfect for remote work days. Gets busy around 10am so arrive early!",
        rating: 4,
        location: {
          name: "Sightglass Coffee, San Francisco",
          coordinates: [-122.4194, 37.7749],
        },
        verificationCount: 7,
        isVerified: true,
        isAnonymous: false,
        upvotes: 28,
        downvotes: 2,
        commentCount: 4,
        postType: "standard" as const,
      },
    ];

    const postIds = [];
    for (const post of demoPosts) {
      const postId = await ctx.db.insert("posts", post);
      postIds.push(postId);
    }

    // Create demo opportunities
    const demoOpportunities = [
      {
        creatorId: userIds[0],
        title: "Senior Software Engineer - Remote",
        description: "Join our mission-driven startup building tools for social good. Competitive salary ($150-200k), equity, unlimited PTO, and flexible remote work. We're looking for a senior engineer with React and Node.js experience.",
        category: "job" as const,
        creditCost: 25,
        company: "TechForGood Inc",
        location: "Remote (US)",
        salary: "$150,000 - $200,000",
        contactEmail: "hiring@techforgood.com",
        externalLink: "https://techforgood.com/careers",
        isActive: true,
      },
      {
        creatorId: userIds[1],
        title: "Free Career Mentorship - Healthcare",
        description: "Offering 1-hour mentorship sessions for women entering healthcare. I've been a nurse practitioner for 10 years and can help with career planning, interview prep, and navigating workplace challenges.",
        category: "mentorship" as const,
        creditCost: 10,
        company: "Independent",
        location: "Virtual",
        contactEmail: "maria.mentorship@example.com",
        isActive: true,
      },
      {
        creatorId: userIds[2],
        title: "Women in Finance Scholarship - $5000",
        description: "Annual scholarship for women pursuing finance careers. Covers tuition, books, and conference attendance. Open to undergrad and grad students. Application deadline: March 31st.",
        category: "funding" as const,
        creditCost: 15,
        company: "Women in Finance Foundation",
        location: "National",
        externalLink: "https://wif.org/scholarship",
        isActive: true,
      },
      {
        creatorId: userIds[0],
        title: "Product Manager Role - Series B Startup",
        description: "Fast-growing healthtech startup seeking PM with 3-5 years experience. Lead product strategy for our women's health platform. Salary $130-160k + equity. Hybrid in SF.",
        category: "job" as const,
        creditCost: 30,
        company: "HealthTech Innovations",
        location: "San Francisco, CA (Hybrid)",
        salary: "$130,000 - $160,000 + equity",
        contactEmail: "jobs@healthtech.com",
        isActive: true,
      },
      {
        creatorId: userIds[1],
        title: "Women's Leadership Conference - May 2026",
        description: "3-day conference featuring keynotes from Fortune 500 executives, networking sessions, and workshops. Early bird tickets available. Great for career growth and making connections.",
        category: "event" as const,
        creditCost: 20,
        company: "Leadership Summit",
        location: "Chicago, IL",
        externalLink: "https://womensleadership.com",
        isActive: true,
      },
    ];

    for (const opportunity of demoOpportunities) {
      await ctx.db.insert("opportunities", opportunity);
    }

    return {
      message: "Demo data seeded successfully!",
      usersCreated: userIds.length,
      postsCreated: postIds.length,
      opportunitiesCreated: demoOpportunities.length,
    };
  },
});

/**
 * Clear all demo data (use with caution!)
 */
export const clearDemoData = mutation({
  handler: async (ctx) => {
    // Delete demo users and their related data
    const demoUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "sarah@example.com"))
      .collect();

    for (const user of demoUsers) {
      // Delete user's posts
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .collect();
      for (const post of posts) {
        await ctx.db.delete(post._id);
      }

      // Delete user's opportunities
      const opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
        .collect();
      for (const opp of opportunities) {
        await ctx.db.delete(opp._id);
      }

      // Delete user
      await ctx.db.delete(user._id);
    }

    return { message: "Demo data cleared" };
  },
});
