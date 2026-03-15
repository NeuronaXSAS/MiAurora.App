import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { assertNonProductionSeeding } from "./seedGuard";

type LifeDimension =
  | "professional"
  | "social"
  | "daily"
  | "travel"
  | "financial";

type DemoUser = {
  email: string;
  workosId: string;
  name: string;
  location: string;
  industry: string;
  bio: string;
  interests: string[];
  trustScore: number;
  credits: number;
  languagePreference: "en";
};

type DemoPost = {
  title: string;
  description: string;
  authorEmail: string;
  lifeDimension: LifeDimension;
  rating: number;
  location?: {
    name: string;
    coordinates: [number, number];
  };
  postType?: "standard" | "poll";
  pollOptions?: string[];
};

type DemoReel = {
  caption: string;
  authorEmail: string;
  location?: {
    name: string;
    coordinates: [number, number];
  };
  hashtags: string[];
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  safetyCategory:
    | "Joy"
    | "Positive Experience"
    | "Warning"
    | "Lighting Issue";
};

type DemoRoute = {
  title: string;
  creatorEmail: string;
  routeType: "walking" | "running" | "commuting";
  start: { name: string; lat: number; lng: number };
  end: { name: string; lat: number; lng: number };
  rating: number;
  tags: string[];
  journalEntry: string;
};

type DemoOpportunity = {
  title: string;
  description: string;
  creatorEmail: string;
  category: "job" | "mentorship" | "resource" | "event" | "funding";
  location: string;
  creditCost: number;
  company?: string;
  salary?: string;
};

const USERS: DemoUser[] = [
  {
    email: "demo.alexa@aurora.app",
    workosId: "demo-investor-alexa",
    name: "Alexa Rivera",
    location: "Austin, TX",
    industry: "Technology",
    bio: "Product designer building calmer and safer digital spaces for women.",
    interests: ["Career Mentorship", "Safe Commuting", "Wellness"],
    trustScore: 640,
    credits: 180,
    languagePreference: "en",
  },
  {
    email: "demo.cami@aurora.app",
    workosId: "demo-investor-cami",
    name: "Camila Torres",
    location: "Bogota, Colombia",
    industry: "Marketing",
    bio: "Community builder sharing routes, support circles, and honest reviews.",
    interests: ["Safe Commuting", "Nightlife Safety", "Travel Safety"],
    trustScore: 720,
    credits: 210,
    languagePreference: "en",
  },
  {
    email: "demo.nora@aurora.app",
    workosId: "demo-investor-nora",
    name: "Nora Patel",
    location: "New York, NY",
    industry: "Finance",
    bio: "Helping women negotiate better pay and build emergency funds.",
    interests: ["Financial Opportunities", "Career Mentorship"],
    trustScore: 690,
    credits: 160,
    languagePreference: "en",
  },
  {
    email: "demo.lucia@aurora.app",
    workosId: "demo-investor-lucia",
    name: "Lucia Herrera",
    location: "Medellin, Colombia",
    industry: "Education",
    bio: "Teacher and runner documenting safe and social habits.",
    interests: ["Safe Commuting", "Wellness"],
    trustScore: 610,
    credits: 145,
    languagePreference: "en",
  },
  {
    email: "demo.maya@aurora.app",
    workosId: "demo-investor-maya",
    name: "Maya Johnson",
    location: "Seattle, WA",
    industry: "Healthcare",
    bio: "Night-shift nurse sharing practical safety tips that help.",
    interests: ["Safe Commuting", "Travel Safety"],
    trustScore: 670,
    credits: 175,
    languagePreference: "en",
  },
  {
    email: "demo.elena@aurora.app",
    workosId: "demo-investor-elena",
    name: "Elena Cruz",
    location: "Mexico City, Mexico",
    industry: "Media",
    bio: "Storyteller amplifying warnings, wins, and support networks.",
    interests: ["Nightlife Safety", "Travel Safety"],
    trustScore: 705,
    credits: 190,
    languagePreference: "en",
  },
];

const POSTS: DemoPost[] = [
  {
    title: "Safe late-night pickup outside South Congress coworking",
    description:
      "Bright lighting, visible staff, and an easy rideshare stop made this pickup point feel calm after our evening workshop.",
    authorEmail: "demo.alexa@aurora.app",
    lifeDimension: "daily",
    rating: 5,
    location: {
      name: "South Congress, Austin, TX",
      coordinates: [-97.7495, 30.2448],
    },
  },
  {
    title: "Ruta segura para volver de Chapinero a casa",
    description:
      "La ruta evita una cuadra oscura y mantiene comercio abierto casi todo el trayecto. Me senti mucho mas tranquila.",
    authorEmail: "demo.cami@aurora.app",
    lifeDimension: "daily",
    rating: 4,
    location: {
      name: "Chapinero, Bogota, Colombia",
      coordinates: [-74.0628, 4.6486],
    },
  },
  {
    title: "How I reframed a raise conversation without sounding defensive",
    description:
      "I brought a one-page summary of outcomes, mentorship work, and retained clients. It kept the discussion factual and calm.",
    authorEmail: "demo.nora@aurora.app",
    lifeDimension: "professional",
    rating: 5,
    location: {
      name: "Midtown Manhattan, New York, NY",
      coordinates: [-73.9851, 40.7589],
    },
  },
  {
    title: "Grupo de caminata para mujeres en Laureles",
    description:
      "Nos reunimos dos veces por semana para volver juntas a casa. La meta es compania y tranquilidad, no velocidad.",
    authorEmail: "demo.lucia@aurora.app",
    lifeDimension: "social",
    rating: 5,
    location: {
      name: "Laureles, Medellin, Colombia",
      coordinates: [-75.5874, 6.2442],
    },
  },
  {
    title: "Night-shift safety habit that reduced my stress immediately",
    description:
      "I send one check-in, verify the plate out loud, and keep my headphones away until I am in the car. It lowers the mental load.",
    authorEmail: "demo.maya@aurora.app",
    lifeDimension: "daily",
    rating: 5,
    location: {
      name: "Capitol Hill, Seattle, WA",
      coordinates: [-122.3208, 47.6231],
    },
  },
  {
    title: "Cafe para trabajar sola sin sentirte expuesta en Roma Norte",
    description:
      "Buen movimiento, personal atento y una salida comoda para pedir taxi sin esperar sola en la calle.",
    authorEmail: "demo.elena@aurora.app",
    lifeDimension: "social",
    rating: 4,
    location: {
      name: "Roma Norte, Mexico City, Mexico",
      coordinates: [-99.1637, 19.4194],
    },
  },
  {
    title: "Would you use a weekly neighborhood safety digest?",
    description:
      "We want verified route updates and calm warning signals to feel useful, not fear-driven.",
    authorEmail: "demo.alexa@aurora.app",
    lifeDimension: "daily",
    rating: 5,
    postType: "poll",
    pollOptions: [
      "Yes, every week",
      "Only for my area",
      "Only when there is a warning",
      "I prefer browsing manually",
    ],
  },
  {
    title: "Que te ayuda mas cuando descubres un lugar nuevo?",
    description:
      "Queremos saber si prefieres videos cortos, rutas verificadas o comentarios recientes para sentir confianza.",
    authorEmail: "demo.cami@aurora.app",
    lifeDimension: "travel",
    rating: 4,
    postType: "poll",
    pollOptions: [
      "Videos cortos",
      "Rutas verificadas",
      "Comentarios recientes",
      "Recomendaciones de amigas",
    ],
  },
];

const REELS: DemoReel[] = [
  {
    caption:
      "Quick safety reset before heading home: pause, check the pickup plate, and send one calm message.",
    authorEmail: "demo.maya@aurora.app",
    location: {
      name: "First Hill, Seattle, WA",
      coordinates: [-122.3257, 47.6098],
    },
    hashtags: ["SafetyFirst", "NightShift", "AuroraApp"],
    videoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "https://picsum.photos/seed/aurora-reel-1/720/1280",
    duration: 18,
    safetyCategory: "Positive Experience",
  },
  {
    caption:
      "Tip rapido: si una calle te da mala espina, cambia la ruta y prioriza tranquilidad.",
    authorEmail: "demo.cami@aurora.app",
    location: {
      name: "Zona G, Bogota, Colombia",
      coordinates: [-74.0533, 4.6675],
    },
    hashtags: ["Seguridad", "Bogota", "Comunidad"],
    videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    thumbnailUrl: "https://picsum.photos/seed/aurora-reel-2/720/1280",
    duration: 12,
    safetyCategory: "Warning",
  },
  {
    caption:
      "Three things I look for before recommending a coworking spot: visible staff, good lighting, and easy pickup.",
    authorEmail: "demo.alexa@aurora.app",
    location: {
      name: "Downtown Austin, TX",
      coordinates: [-97.7431, 30.2672],
    },
    hashtags: ["Coworking", "SafeCommute", "WomenSupport"],
    videoUrl: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    thumbnailUrl: "https://picsum.photos/seed/aurora-reel-3/720/1280",
    duration: 16,
    safetyCategory: "Joy",
  },
  {
    caption:
      "Mini review of a women-friendly cafe in Roma Norte: visible staff, easy exit, and enough space to wait indoors.",
    authorEmail: "demo.elena@aurora.app",
    location: {
      name: "Roma Norte, Mexico City, Mexico",
      coordinates: [-99.1631, 19.4142],
    },
    hashtags: ["RomaNorte", "CafeSeguro", "AuroraApp"],
    videoUrl: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    thumbnailUrl: "https://picsum.photos/seed/aurora-reel-4/720/1280",
    duration: 20,
    safetyCategory: "Lighting Issue",
  },
];

const ROUTES: DemoRoute[] = [
  {
    title: "South Congress calm walk after events",
    creatorEmail: "demo.alexa@aurora.app",
    routeType: "walking",
    start: { name: "Music Lane", lat: 30.2484, lng: -97.7502 },
    end: { name: "Auditorium Shores Pickup Zone", lat: 30.2602, lng: -97.7518 },
    rating: 4.7,
    tags: ["well-lit", "rideshare-friendly", "busy-area"],
    journalEntry:
      "This route stays active after events and has several staffed stops if you need to wait inside.",
  },
  {
    title: "Ruta verificada entre Chapinero y Zona G",
    creatorEmail: "demo.cami@aurora.app",
    routeType: "walking",
    start: { name: "Universidad Javeriana", lat: 4.6282, lng: -74.0648 },
    end: { name: "Zona G", lat: 4.6675, lng: -74.0533 },
    rating: 4.5,
    tags: ["verificada", "comercio-abierto", "tranquila"],
    journalEntry:
      "Evita dos cuadras muy vacias y mantiene presencia comercial casi todo el trayecto.",
  },
  {
    title: "First Hill to Capitol Hill shift change route",
    creatorEmail: "demo.maya@aurora.app",
    routeType: "commuting",
    start: { name: "Swedish First Hill", lat: 47.6087, lng: -122.3238 },
    end: { name: "Capitol Hill Station", lat: 47.6231, lng: -122.3208 },
    rating: 4.6,
    tags: ["hospital-area", "late-hours", "well-populated"],
    journalEntry:
      "Good visibility, active sidewalks, and multiple places to pause if a pickup is running late.",
  },
];

const OPPORTUNITIES: DemoOpportunity[] = [
  {
    title: "Women in Product mentorship sprint",
    description:
      "Three-week mentorship sprint with structured office hours, portfolio review, and promotion prep.",
    creatorEmail: "demo.alexa@aurora.app",
    category: "mentorship",
    location: "Austin, TX",
    creditCost: 18,
  },
  {
    title: "Community Marketing Manager",
    description:
      "Remote-friendly role with flexible hours, clear pay band, and a protected learning budget.",
    creatorEmail: "demo.cami@aurora.app",
    category: "job",
    location: "Bogota, Colombia",
    creditCost: 20,
    company: "Aurora Circle Studio",
    salary: "$2,400 - $3,000 / month",
  },
  {
    title: "Beca para volver al mercado laboral",
    description:
      "Programa corto con acompanamiento, simulacion de entrevistas y red de apoyo para mujeres que retoman su carrera.",
    creatorEmail: "demo.elena@aurora.app",
    category: "resource",
    location: "Mexico City, Mexico",
    creditCost: 12,
  },
];

const COMMENTS = [
  ["Ruta segura para volver de Chapinero a casa", "demo.lucia@aurora.app", "Confirmo este trayecto. Se siente mucho mejor que la ruta que usabamos antes."],
  ["Ruta segura para volver de Chapinero a casa", "demo.alexa@aurora.app", "This is exactly the kind of practical detail that helps."],
  ["How I reframed a raise conversation without sounding defensive", "demo.alexa@aurora.app", "The one-page summary is such a good tactic."],
  ["How I reframed a raise conversation without sounding defensive", "demo.elena@aurora.app", "Gracias por compartir algo tan concreto y calmado."],
  ["Grupo de caminata para mujeres en Laureles", "demo.cami@aurora.app", "Me encanta que la meta sea compania y no rendimiento."],
  ["Cafe para trabajar sola sin sentirte expuesta en Roma Norte", "demo.maya@aurora.app", "Indoor waiting space is underrated. That changes whether I recommend a place."],
  ["Night-shift safety habit that reduced my stress immediately", "demo.elena@aurora.app", "La rutina calma mucho cuando una sale cansada."],
  ["Would you use a weekly neighborhood safety digest?", "demo.cami@aurora.app", "Me gusta cuando Aurora informa sin generar miedo innecesario."],
] as const;

const VOTES = [
  ["demo.nora@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.maya@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.alexa@aurora.app", "Ruta segura para volver de Chapinero a casa"],
  ["demo.lucia@aurora.app", "Ruta segura para volver de Chapinero a casa"],
  ["demo.elena@aurora.app", "How I reframed a raise conversation without sounding defensive"],
  ["demo.cami@aurora.app", "How I reframed a raise conversation without sounding defensive"],
  ["demo.alexa@aurora.app", "Night-shift safety habit that reduced my stress immediately"],
  ["demo.maya@aurora.app", "Cafe para trabajar sola sin sentirte expuesta en Roma Norte"],
] as const;

const VERIFICATIONS = [
  ["demo.nora@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.maya@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.cami@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.lucia@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.elena@aurora.app", "Safe late-night pickup outside South Congress coworking"],
  ["demo.alexa@aurora.app", "Ruta segura para volver de Chapinero a casa"],
] as const;

const REEL_COMMENTS = [
  ["Quick safety reset before heading home: pause, check the pickup plate, and send one calm message.", "demo.alexa@aurora.app", "Calm routines are easier to repeat. This is useful."],
  ["Tip rapido: si una calle te da mala espina, cambia la ruta y prioriza tranquilidad.", "demo.lucia@aurora.app", "Si. Confiar en esa senal evita mucho estres."],
  ["Mini review of a women-friendly cafe in Roma Norte: visible staff, easy exit, and enough space to wait indoors.", "demo.maya@aurora.app", "That waiting-space detail is exactly what I look for."],
] as const;

const REEL_LIKES = [
  ["demo.alexa@aurora.app", "Tip rapido: si una calle te da mala espina, cambia la ruta y prioriza tranquilidad."],
  ["demo.cami@aurora.app", "Three things I look for before recommending a coworking spot: visible staff, good lighting, and easy pickup."],
  ["demo.maya@aurora.app", "Mini review of a women-friendly cafe in Roma Norte: visible staff, easy exit, and enough space to wait indoors."],
  ["demo.elena@aurora.app", "Quick safety reset before heading home: pause, check the pickup plate, and send one calm message."],
] as const;

function buildRouteCoordinates(route: DemoRoute) {
  const points = 5;
  return Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1);
    return {
      lat: route.start.lat + (route.end.lat - route.start.lat) * progress,
      lng: route.start.lng + (route.end.lng - route.start.lng) * progress,
      timestamp: Date.now() + index * 60_000,
    };
  });
}

export const seedInvestorDemo = mutation({
  args: {},
  handler: async (ctx) => {
    assertNonProductionSeeding("demoSeed:seedInvestorDemo");
    const userIds = new Map<string, Id<"users">>();
    const postIds = new Map<string, Id<"posts">>();
    const reelIds = new Map<string, Id<"reels">>();

    for (const user of USERS) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .first();

      const userId =
        existing?._id ??
        (await ctx.db.insert("users", {
          workosId: user.workosId,
          email: user.email,
          name: user.name,
          credits: user.credits,
          trustScore: user.trustScore,
          industry: user.industry,
          location: user.location,
          onboardingCompleted: true,
          bio: user.bio,
          interests: user.interests,
          languagePreference: user.languagePreference,
          isPremium: false,
        }));

      userIds.set(user.email, userId);
    }

    for (const post of POSTS) {
      const authorId = userIds.get(post.authorEmail)!;
      const existingPostsByAuthor = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", authorId))
        .collect();
      const existing = existingPostsByAuthor.find(
        (candidate) => candidate.title === post.title,
      );

      const postId =
        existing?._id ??
        (await ctx.db.insert("posts", {
          authorId,
          lifeDimension: post.lifeDimension,
          title: post.title,
          description: post.description,
          rating: post.rating,
          location: post.location,
          verificationCount: 0,
          isVerified: false,
          isAnonymous: false,
          upvotes: 0,
          downvotes: 0,
          commentCount: 0,
          postType: post.postType ?? "standard",
          pollOptions: post.pollOptions?.map((option) => ({
            text: option,
            votes: 0,
          })),
          moderationStatus: "approved",
        }));

      postIds.set(post.title, postId);
    }

    for (const reel of REELS) {
      const authorId = userIds.get(reel.authorEmail)!;
      const existingReelsByAuthor = await ctx.db
        .query("reels")
        .withIndex("by_author", (q) => q.eq("authorId", authorId))
        .collect();
      const existing = existingReelsByAuthor.find(
        (candidate) => candidate.caption === reel.caption,
      );

      const reelId =
        existing?._id ??
        (await ctx.db.insert("reels", {
          authorId,
          provider: "custom",
          externalId: `investor-demo-${reel.duration}-${reel.authorEmail}`,
          videoUrl: reel.videoUrl,
          thumbnailUrl: reel.thumbnailUrl,
          duration: reel.duration,
          metadata: {
            width: 1080,
            height: 1920,
            format: "mp4",
            sizeBytes: 2_000_000,
          },
          caption: reel.caption,
          hashtags: reel.hashtags,
          location: reel.location,
          aiMetadata: {
            safetyCategory: reel.safetyCategory,
            sentiment: reel.safetyCategory === "Warning" ? 0.1 : 0.82,
            detectedObjects: ["street", "community"],
            visualTags: ["supportive", "safety"],
          },
          views: 180,
          likes: 0,
          comments: 0,
          shares: 14,
          completionRate: 0.78,
          avgWatchTime: Math.max(6, reel.duration - 3),
          isAnonymous: false,
          moderationStatus: "approved",
          moderationScore: 0,
          moderationReason: "Seeded investor demo content",
          moderationCategories: [],
        }));

      reelIds.set(reel.caption, reelId);

      const linkedPost = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", authorId))
        .collect();
      const existingLinkedPost = linkedPost.find(
        (candidate) => candidate.reelId === reelId,
      );

      if (!existingLinkedPost) {
        await ctx.db.insert("posts", {
          authorId,
          lifeDimension: "daily",
          title: reel.caption.slice(0, 110),
          description: reel.caption,
          rating: 5,
          location: reel.location,
          verificationCount: 0,
          isVerified: false,
          isAnonymous: false,
          reelId,
          upvotes: 0,
          downvotes: 0,
          commentCount: 0,
          postType: "reel",
          moderationStatus: "approved",
        });
      }
    }

    for (const route of ROUTES) {
      const creatorId = userIds.get(route.creatorEmail)!;
      const existingRoutesByCreator = await ctx.db
        .query("routes")
        .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
        .collect();
      const existing = existingRoutesByCreator.find(
        (candidate) => candidate.title === route.title,
      );

      if (!existing) {
        await ctx.db.insert("routes", {
          creatorId,
          title: route.title,
          routeType: route.routeType,
          coordinates: buildRouteCoordinates(route),
          distance: 1800,
          duration: 960,
          elevationGain: 24,
          startLocation: { ...route.start },
          endLocation: { ...route.end },
          tags: route.tags,
          rating: route.rating,
          journalEntry: route.journalEntry,
          isPrivate: false,
          isAnonymous: false,
          sharingLevel: "public",
          completionCount: 12,
          totalRating: Math.round(route.rating * 12),
          verificationCount: 6,
          creditsEarned: 30,
        });
      }
    }

    for (const opportunity of OPPORTUNITIES) {
      const creatorId = userIds.get(opportunity.creatorEmail)!;
      const existingOpportunitiesByCreator = await ctx.db
        .query("opportunities")
        .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
        .collect();
      const existing = existingOpportunitiesByCreator.find(
        (candidate) => candidate.title === opportunity.title,
      );

      if (!existing) {
        await ctx.db.insert("opportunities", {
          creatorId,
          title: opportunity.title,
          description: opportunity.description,
          category: opportunity.category,
          company: opportunity.company,
          salary: opportunity.salary,
          location: opportunity.location,
          creditCost: opportunity.creditCost,
          safetyRating: 5,
          isActive: true,
        });
      }
    }

    for (const [title, authorEmail, content] of COMMENTS) {
      const postId = postIds.get(title);
      const authorId = userIds.get(authorEmail);
      if (!postId || !authorId) continue;

      const existing = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .filter((q) =>
          q.and(
            q.eq(q.field("authorId"), authorId),
            q.eq(q.field("content"), content),
          ),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("comments", {
          postId,
          authorId,
          content,
          parentId: undefined,
          depth: 0,
          upvotes: 0,
          downvotes: 0,
          replyCount: 0,
          isDeleted: false,
          moderationStatus: "approved",
        });
      }
    }

    for (const [authorEmail, title] of VOTES) {
      const userId = userIds.get(authorEmail);
      const postId = postIds.get(title);
      if (!userId || !postId) continue;

      const existing = await ctx.db
        .query("votes")
        .withIndex("by_user_and_target", (q) =>
          q.eq("userId", userId).eq("targetId", postId),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("votes", {
          userId,
          targetId: postId,
          targetType: "post",
          voteType: "upvote",
        });
      }
    }

    for (const [authorEmail, title] of VERIFICATIONS) {
      const userId = userIds.get(authorEmail);
      const postId = postIds.get(title);
      if (!userId || !postId) continue;

      const existing = await ctx.db
        .query("verifications")
        .withIndex("by_post_and_user", (q) =>
          q.eq("postId", postId).eq("userId", userId),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("verifications", {
          postId,
          userId,
        });
      }
    }

    for (const [caption, authorEmail, content] of REEL_COMMENTS) {
      const reelId = reelIds.get(caption);
      const authorId = userIds.get(authorEmail);
      if (!reelId || !authorId) continue;

      const existing = await ctx.db
        .query("reelComments")
        .withIndex("by_reel", (q) => q.eq("reelId", reelId))
        .filter((q) =>
          q.and(
            q.eq(q.field("authorId"), authorId),
            q.eq(q.field("content"), content),
          ),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("reelComments", {
          reelId,
          authorId,
          content,
          parentId: undefined,
          likes: 0,
          isDeleted: false,
        });
      }
    }

    for (const [authorEmail, caption] of REEL_LIKES) {
      const userId = userIds.get(authorEmail);
      const reelId = reelIds.get(caption);
      if (!userId || !reelId) continue;

      const existing = await ctx.db
        .query("reelLikes")
        .withIndex("by_user_and_reel", (q) =>
          q.eq("userId", userId).eq("reelId", reelId),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("reelLikes", {
          userId,
          reelId,
        });
      }
    }

    for (const [, postId] of postIds) {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();

      const votes = await ctx.db
        .query("votes")
        .withIndex("by_target", (q) => q.eq("targetId", postId))
        .collect();

      const verifications = await ctx.db
        .query("verifications")
        .withIndex("by_post", (q) => q.eq("postId", postId))
        .collect();

      await ctx.db.patch(postId, {
        upvotes: votes.filter((vote) => vote.voteType === "upvote").length,
        downvotes: votes.filter((vote) => vote.voteType === "downvote").length,
        commentCount: comments.length,
        verificationCount: verifications.length,
        isVerified: verifications.length >= 5,
      });
    }

    for (const [, reelId] of reelIds) {
      const comments = await ctx.db
        .query("reelComments")
        .withIndex("by_reel", (q) => q.eq("reelId", reelId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();

      const likes = await ctx.db
        .query("reelLikes")
        .withIndex("by_reel", (q) => q.eq("reelId", reelId))
        .collect();

      await ctx.db.patch(reelId, {
        likes: likes.length,
        comments: comments.length,
      });
    }

    for (const reelSeed of REELS) {
      const authorId = userIds.get(reelSeed.authorEmail);
      const reelId = reelIds.get(reelSeed.caption);
      if (!authorId || !reelId) continue;

      const linkedPosts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", authorId))
        .collect();
      const linkedPost = linkedPosts.find((candidate) => candidate.reelId === reelId);
      if (!linkedPost) continue;

      const reel = await ctx.db.get(reelId);
      if (!reel) continue;

      await ctx.db.patch(linkedPost._id, {
        title: (reel.caption || "Shared a new reel").slice(0, 120),
        description: reel.caption || "Check out this reel!",
        location: reel.location,
        upvotes: reel.likes,
        commentCount: reel.comments,
      });
    }

    return {
      success: true,
      stats: {
        users: USERS.length,
        posts: POSTS.length,
        reels: REELS.length,
        routes: ROUTES.length,
        opportunities: OPPORTUNITIES.length,
        interactions:
          COMMENTS.length +
          VOTES.length +
          VERIFICATIONS.length +
          REEL_COMMENTS.length +
          REEL_LIKES.length,
      },
    };
  },
});
