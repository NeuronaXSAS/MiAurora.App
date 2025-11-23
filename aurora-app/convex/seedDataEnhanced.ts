import { mutation } from "./_generated/server";

/**
 * Enhanced seed data for production-ready demo
 * Creates 100+ users, 300+ posts, 75+ routes, 50+ opportunities
 * Run from Convex dashboard: npx convex run seedDataEnhanced:seedComprehensiveData
 */

const CITIES = [
  { name: "San Francisco, CA", coords: [-122.4194, 37.7749] },
  { name: "New York, NY", coords: [-74.0060, 40.7128] },
  { name: "Austin, TX", coords: [-97.7431, 30.2672] },
  { name: "Seattle, WA", coords: [-122.3321, 47.6062] },
  { name: "Chicago, IL", coords: [-87.6298, 41.8781] },
  { name: "Boston, MA", coords: [-71.0589, 42.3601] },
  { name: "Los Angeles, CA", coords: [-118.2437, 34.0522] },
  { name: "Denver, CO", coords: [-104.9903, 39.7392] },
  { name: "Portland, OR", coords: [-122.6765, 45.5231] },
  { name: "Miami, FL", coords: [-80.1918, 25.7617] },
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Education", "Marketing",
  "Legal", "Consulting", "Retail", "Manufacturing", "Non-Profit",
  "Media", "Real Estate", "Hospitality", "Government", "Engineering"
];

const FIRST_NAMES = [
  "Sarah", "Maria", "Aisha", "Jennifer", "Emily", "Jessica", "Ashley", "Michelle",
  "Amanda", "Melissa", "Stephanie", "Rebecca", "Laura", "Nicole", "Rachel",
  "Samantha", "Katherine", "Christina", "Amy", "Angela", "Brittany", "Lauren",
  "Megan", "Kimberly", "Victoria", "Olivia", "Emma", "Sophia", "Isabella", "Ava"
];

const LAST_NAMES = [
  "Chen", "Rodriguez", "Patel", "Johnson", "Williams", "Brown", "Jones", "Garcia",
  "Miller", "Davis", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
  "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Salesforce",
  "Adobe", "Oracle", "IBM", "Intel", "Cisco", "Tesla", "Uber", "Lyft",
  "Airbnb", "Stripe", "Square", "Shopify", "Zoom", "Slack", "Dropbox",
  "Twitter", "LinkedIn", "Pinterest", "Snap", "Reddit", "Discord", "Figma"
];

const POST_TEMPLATES = {
  professional: [
    {
      title: "Excellent Work-Life Balance at {company}",
      description: "Been working at {company} for {months} months. The flexible schedule and remote work options are amazing. Management truly respects personal time and family commitments. {rating_reason}",
      ratings: [4, 5]
    },
    {
      title: "Toxic Management at {company}",
      description: "Unfortunately, my experience at {company} has been disappointing. Micromanagement, unclear expectations, and lack of support for professional development. {rating_reason}",
      ratings: [1, 2]
    },
    {
      title: "Great Mentorship Program at {company}",
      description: "{company} has an incredible mentorship program. Senior leaders actively invest time in junior employees. Regular 1-on-1s, career development plans, and genuine support. {rating_reason}",
      ratings: [4, 5]
    },
    {
      title: "Diversity and Inclusion at {company}",
      description: "{company} is making real progress on D&I. Women in leadership, ERGs with actual budgets, and transparent pay equity reviews. Still work to do, but heading in the right direction. {rating_reason}",
      ratings: [3, 4, 5]
    }
  ],
  daily: [
    {
      title: "Safe Neighborhood - {location}",
      description: "Living in {location} for {months} months. Well-lit streets, active neighborhood watch, and friendly community. Feel safe walking at night. {rating_reason}",
      ratings: [4, 5]
    },
    {
      title: "Excellent Gym with Women-Only Hours",
      description: "This gym in {location} offers women-only hours 6-8am daily. Clean facilities, respectful staff, and great equipment. Never felt uncomfortable. {rating_reason}",
      ratings: [4, 5]
    },
    {
      title: "Unsafe Area - Avoid After Dark",
      description: "Area near {location} feels unsafe after sunset. Poor lighting, frequent catcalling, and uncomfortable encounters. Would not recommend walking alone. {rating_reason}",
      ratings: [1, 2]
    }
  ],
  social: [
    {
      title: "Welcoming Community Group",
      description: "Found an amazing women's networking group in {location}. Monthly meetups, supportive members, and great connections. Highly recommend! {rating_reason}",
      ratings: [4, 5]
    },
    {
      title: "Inclusive Social Club",
      description: "This social club in {location} is incredibly welcoming. Diverse membership, interesting events, and zero tolerance for harassment. {rating_reason}",
      ratings: [4, 5]
    }
  ]
};

const ROUTE_TEMPLATES = [
  {
    title: "Morning Jog Route - Well Lit",
    description: "Safe 3-mile morning route through {location}. Well-lit streets, regular foot traffic, and beautiful scenery.",
    tags: ["safe", "scenic", "well-lit"],
    rating: 5
  },
  {
    title: "Commute to Work",
    description: "Daily commute route in {location}. Busy streets with good visibility. Feels safe during rush hour.",
    tags: ["safe", "busy", "commute"],
    rating: 4
  },
  {
    title: "Evening Walk - Avoid This Route",
    description: "This route through {location} feels unsafe after dark. Poor lighting and isolated areas.",
    tags: ["unsafe", "dark", "isolated"],
    rating: 2
  }
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): number {
  return Date.now() - (days * 24 * 60 * 60 * 1000);
}

export const seedComprehensiveData = mutation({
  handler: async (ctx) => {
    console.log("🌱 Starting comprehensive seed data generation...");

    // 1. Create 100 diverse users
    console.log("Creating 100 users...");
    const userIds = [];
    for (let i = 0; i < 100; i++) {
      const city = randomElement(CITIES);
      const user = await ctx.db.insert("users", {
        workosId: `demo_user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
        credits: randomInt(50, 500),
        trustScore: randomInt(100, 1000),
        industry: randomElement(INDUSTRIES),
        location: city.name,
        careerGoals: "Building a successful career while maintaining work-life balance",
        onboardingCompleted: true,
        bio: `Professional in ${randomElement(INDUSTRIES)} passionate about safety and community`,
        interests: ["networking", "safety", "career-growth"],
        monthlyCreditsEarned: randomInt(20, 200),
        lastCreditReset: daysAgo(randomInt(0, 30)),
      });
      userIds.push(user);
    }

    // 2. Create 300 posts across all dimensions
    console.log("Creating 300 posts...");
    const postIds = [];
    for (let i = 0; i < 300; i++) {
      const authorId = randomElement(userIds);
      const dimension = randomElement(["professional", "daily", "social"] as const);
      const template = randomElement(POST_TEMPLATES[dimension]);
      const city = randomElement(CITIES);
      const company = randomElement(COMPANIES);
      const rating = randomElement(template.ratings);
      
      const ratingReasons = {
        5: "Absolutely recommend to anyone!",
        4: "Definitely worth considering.",
        3: "Mixed experience, but overall okay.",
        2: "Would not recommend.",
        1: "Strongly advise against."
      };

      const post = await ctx.db.insert("posts", {
        authorId,
        lifeDimension: dimension,
        title: template.title.replace("{company}", company).replace("{location}", city.name),
        description: template.description
          .replace("{company}", company)
          .replace("{location}", city.name)
          .replace("{months}", String(randomInt(3, 24)))
          .replace("{rating_reason}", ratingReasons[rating as keyof typeof ratingReasons]),
        rating,
        location: {
          name: dimension === "professional" ? `${company} Office` : city.name,
          coordinates: [
            city.coords[0] + (Math.random() - 0.5) * 0.1,
            city.coords[1] + (Math.random() - 0.5) * 0.1
          ],
        },
        verificationCount: randomInt(0, 20),
        isVerified: randomInt(0, 20) >= 5,
        isAnonymous: Math.random() < 0.2,
        upvotes: randomInt(0, 100),
        downvotes: randomInt(0, 10),
        commentCount: randomInt(0, 15),
        postType: "standard" as const,
      });
      postIds.push(post);
    }

    // 3. Create 150 comments
    console.log("Creating 150 comments...");
    for (let i = 0; i < 150; i++) {
      const postId = randomElement(postIds);
      const authorId = randomElement(userIds);
      
      await ctx.db.insert("comments", {
        postId,
        authorId,
        content: randomElement([
          "Thanks for sharing this! Very helpful.",
          "I had a similar experience.",
          "This is really important information.",
          "Appreciate the honest review.",
          "Good to know, thanks!",
          "Can you share more details?",
          "This matches what I've heard from others.",
        ]),
        upvotes: randomInt(0, 20),
        downvotes: randomInt(0, 3),
        isDeleted: false,
      });
    }

    // 4. Create 75 routes
    console.log("Creating 75 routes...");
    for (let i = 0; i < 75; i++) {
      const userId = randomElement(userIds);
      const city = randomElement(CITIES);
      const template = randomElement(ROUTE_TEMPLATES);
      
      // Generate realistic route coordinates
      const startCoords = [
        city.coords[0] + (Math.random() - 0.5) * 0.05,
        city.coords[1] + (Math.random() - 0.5) * 0.05
      ];
      const rawCoordinates = [startCoords];
      for (let j = 0; j < randomInt(10, 30); j++) {
        const lastCoord = rawCoordinates[rawCoordinates.length - 1];
        rawCoordinates.push([
          lastCoord[0] + (Math.random() - 0.5) * 0.01,
          lastCoord[1] + (Math.random() - 0.5) * 0.01
        ]);
      }

      // Transform to schema format
      const baseTime = Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000;
      const coordinates = rawCoordinates.map((coord, idx) => ({
        lat: coord[0],
        lng: coord[1],
        timestamp: baseTime + idx * 60000, // 1 minute intervals
        elevation: randomInt(0, 500),
      }));

      await ctx.db.insert("routes", {
        creatorId: userId,
        title: template.title.replace("{location}", city.name),
        journalEntry: template.description.replace("{location}", city.name),
        routeType: randomElement(["walking", "running", "cycling", "commuting"] as const),
        coordinates,
        elevationGain: randomInt(0, 200),
        startLocation: {
          lat: startCoords[0],
          lng: startCoords[1],
          name: city.name,
        },
        endLocation: {
          lat: rawCoordinates[rawCoordinates.length - 1][0],
          lng: rawCoordinates[rawCoordinates.length - 1][1],
          name: city.name,
        },
        distance: randomInt(1000, 10000), // meters
        duration: randomInt(600, 3600), // seconds
        tags: template.tags,
        rating: template.rating,
        isPrivate: Math.random() < 0.2,
        isAnonymous: Math.random() < 0.15,
        sharingLevel: Math.random() < 0.2 ? "private" : (Math.random() < 0.5 ? "anonymous" : "public"),
        completionCount: randomInt(0, 50),
        totalRating: randomInt(0, 250),
        verificationCount: randomInt(0, 20),
        creditsEarned: randomInt(0, 100),
      });
    }

    // 5. Create 50 opportunities
    console.log("Creating 50 opportunities...");
    const opportunityCategories = [
      "job", "mentorship", "funding", "resource", "event"
    ];
    
    for (let i = 0; i < 50; i++) {
      const creatorId = randomElement(userIds);
      const city = randomElement(CITIES);
      const category = randomElement(opportunityCategories) as "job" | "mentorship" | "funding" | "resource" | "event";
      
      const titles = {
        job: "Software Engineer Position",
        mentorship: "Career Mentorship Program",
        funding: "Women in Tech Grant",
        resource: "Free Career Coaching Session",
        event: "Professional Development Workshop"
      };

      await ctx.db.insert("opportunities", {
        creatorId,
        title: titles[category],
        description: `Great opportunity in ${city.name}. ${category === "job" ? "Competitive salary and benefits." : "Free for community members."}`,
        category,
        company: category === "job" ? randomElement(COMPANIES) : undefined,
        location: city.name,
        creditCost: randomInt(10, 100),
        externalLink: "https://example.com",
        contactEmail: "contact@example.com",
        isActive: Math.random() < 0.8,
      });
    }

    // 6. Create engagement data (votes, verifications)
    console.log("Creating engagement data...");
    for (let i = 0; i < 200; i++) {
      const postId = randomElement(postIds);
      const userId = randomElement(userIds);
      
      // Random vote
      if (Math.random() < 0.7) {
        await ctx.db.insert("votes", {
          userId,
          targetId: postId,
          targetType: "post" as const,
          voteType: Math.random() < 0.9 ? "upvote" : "downvote",
        });
      }
    }

    // 7. Create some reels metadata (for future)
    console.log("Creating 30 reels...");
    for (let i = 0; i < 30; i++) {
      const authorId = randomElement(userIds);
      const city = randomElement(CITIES);
      
      await ctx.db.insert("reels", {
        authorId,
        provider: "cloudinary" as const,
        externalId: `reel_${i}_${Date.now()}`,
        videoUrl: "https://example.com/video.mp4",
        thumbnailUrl: "https://example.com/thumb.jpg",
        duration: randomInt(15, 60),
        metadata: {
          width: 1080,
          height: 1920,
          format: "mp4",
          sizeBytes: randomInt(1000000, 10000000),
        },
        caption: `Safety Tips for ${city.name}`,
        hashtags: ["safety", "travel", city.name.toLowerCase()],
        location: {
          name: city.name,
          coordinates: city.coords,
        },
        views: randomInt(100, 10000),
        likes: randomInt(10, 1000),
        comments: randomInt(5, 100),
        shares: randomInt(0, 50),
        isAnonymous: Math.random() < 0.2,
        moderationStatus: "approved" as const,
        moderationScore: randomInt(80, 100),
        aiMetadata: {
          safetyCategory: randomElement(["Joy", "Positive Experience", "Warning"] as const),
          sentiment: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
          visualTags: ["safety-tips", "urban-safety"],
        },
      });
    }

    // 8. Create transactions for credit history
    console.log("Creating transaction history...");
    for (let i = 0; i < 300; i++) {
      const userId = randomElement(userIds);
      const types = ["post_created", "route_shared", "verification", "tip_received", "opportunity_unlocked"];
      const type = randomElement(types);
      const amounts = {
        post_created: 10,
        route_shared: 15,
        verification: 5,
        tip_received: randomInt(5, 50),
        opportunity_unlocked: -randomInt(10, 100)
      };

      await ctx.db.insert("transactions", {
        userId,
        amount: amounts[type as keyof typeof amounts],
        type,
        relatedId: randomElement(postIds),
      });
    }

    console.log("✅ Seed data generation complete!");
    console.log("📊 Created:");
    console.log("  - 100 users");
    console.log("  - 300 posts");
    console.log("  - 150 comments");
    console.log("  - 75 routes");
    console.log("  - 50 opportunities");
    console.log("  - 30 reels");
    console.log("  - 200+ engagement actions");
    console.log("  - 300 transactions");

    return {
      success: true,
      stats: {
        users: 100,
        posts: 300,
        comments: 150,
        routes: 75,
        opportunities: 50,
        reels: 30,
        transactions: 300
      }
    };
  },
});

/**
 * Clear all demo data (use with caution!)
 */
export const clearAllData = mutation({
  handler: async (ctx) => {
    console.log("🗑️  Clearing all data...");
    
    const tables = [
      "users", "posts", "comments", "routes", "opportunities",
      "reels", "transactions", "votes", "verifications"
    ];

    for (const table of tables) {
      const items = await ctx.db.query(table as any).collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      console.log(`  Cleared ${items.length} items from ${table}`);
    }

    console.log("✅ All data cleared!");
    return { success: true };
  },
});
