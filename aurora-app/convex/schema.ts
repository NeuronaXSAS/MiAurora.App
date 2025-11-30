import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    workosId: v.string(),
    email: v.string(),
    name: v.string(),
    profileImage: v.optional(v.string()),
    credits: v.number(), // Default: 25 (signup bonus)
    trustScore: v.number(), // Default: 0, Max: 1000
    industry: v.optional(v.string()),
    location: v.optional(v.string()),
    careerGoals: v.optional(v.string()),
    onboardingCompleted: v.boolean(),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    monthlyCreditsEarned: v.optional(v.number()), // Reset monthly
    lastCreditReset: v.optional(v.number()), // Timestamp
    
    // Avatar configuration (Lorelei style)
    avatarConfig: v.optional(v.object({
      seed: v.string(),
      backgroundColor: v.string(),
      hairStyle: v.string(),
      hairColor: v.string(),
      skinColor: v.string(),
      eyesStyle: v.string(),
      mouthStyle: v.string(),
      earrings: v.string(),
      freckles: v.boolean(),
    })),
    
    // Monetization
    isPremium: v.optional(v.boolean()), // Default: false - Premium users get ad-free experience
    
    // Privacy settings
    privacySettings: v.optional(v.object({
      dataSharing: v.boolean(),
      analyticsTracking: v.boolean(),
      personalizedAds: v.boolean(),
      locationSharing: v.boolean(),
      profileVisibility: v.union(v.literal('public'), v.literal('private'), v.literal('friends')),
      messagePrivacy: v.union(v.literal('everyone'), v.literal('friends'), v.literal('none')),
      activityStatus: v.boolean(),
    })),
    
    // Consent tracking
    consents: v.optional(v.object({
      termsAccepted: v.boolean(),
      termsAcceptedAt: v.optional(v.number()),
      privacyPolicyAccepted: v.boolean(),
      privacyPolicyAcceptedAt: v.optional(v.number()),
      marketingConsent: v.boolean(),
      marketingConsentAt: v.optional(v.number()),
      analyticsConsent: v.boolean(),
      analyticsConsentAt: v.optional(v.number()),
    })),
    
    // Account deletion
    deletionRequested: v.optional(v.boolean()),
    deletionRequestedAt: v.optional(v.number()),
    deletionReason: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_workos_id", ["workosId"])
    .index("by_email", ["email"]),

  posts: defineTable({
    authorId: v.id("users"),
    lifeDimension: v.union(
      v.literal("professional"),
      v.literal("social"),
      v.literal("daily"),
      v.literal("travel"),
      v.literal("financial")
    ),
    title: v.string(), // 10-200 chars
    description: v.string(), // 20-2000 chars
    rating: v.number(), // 1-5
    location: v.optional(
      v.object({
        name: v.string(),
        coordinates: v.array(v.number()), // [lng, lat]
      })
    ),
    media: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("video")),
          storageId: v.id("_storage"),
          url: v.string(),
          thumbnailUrl: v.optional(v.string()),
        })
      )
    ),
    verificationCount: v.number(), // Default: 0
    isVerified: v.boolean(), // True when verificationCount >= 5
    isAnonymous: v.boolean(),
    routeId: v.optional(v.id("routes")), // Link to shared route
    upvotes: v.optional(v.number()), // Default: 0
    downvotes: v.optional(v.number()), // Default: 0
    commentCount: v.optional(v.number()), // Default: 0
    postType: v.optional(v.union(
      v.literal("standard"),
      v.literal("poll"),
      v.literal("ai_chat")
    )),
    pollOptions: v.optional(v.array(v.object({
      text: v.string(),
      votes: v.number(),
    }))),
    aiChatId: v.optional(v.id("messages")), // Link to shared AI chat
    
    // Moderation
    moderationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("flagged")
    )),
    moderationScore: v.optional(v.number()),
    moderationReason: v.optional(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_dimension", ["lifeDimension"])
    .index("by_rating", ["rating"]) // For filtering by rating
    .index("by_verified", ["isVerified"]), // For verified content

  verifications: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  // Opportunities - Jobs, mentorship, resources for women
  opportunities: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("job"),
      v.literal("mentorship"),
      v.literal("resource"),
      v.literal("event"),
      v.literal("funding")
    ),
    creditCost: v.number(), // 5-100 credits to unlock
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    safetyRating: v.optional(v.number()), // 1-5 workplace safety
    contactEmail: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    requirements: v.optional(v.array(v.string())),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_creator", ["creatorId"]),

  unlocks: defineTable({
    userId: v.id("users"),
    opportunityId: v.id("opportunities"),
  })
    .index("by_user", ["userId"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_user_and_opportunity", ["userId", "opportunityId"]),

  messages: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    amount: v.number(), // Positive for earn, negative for spend
    type: v.string(), // Transaction type (flexible for future types)
    relatedId: v.optional(v.string()), // ID of related post/opportunity/route
  }).index("by_user", ["userId"]),

  routes: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    routeType: v.union(
      v.literal("walking"),
      v.literal("running"),
      v.literal("cycling"),
      v.literal("commuting")
    ),
    
    // GPS Data
    coordinates: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number(),
      elevation: v.optional(v.number()),
    })),
    
    // Route Metrics
    distance: v.number(), // meters
    duration: v.number(), // seconds
    elevationGain: v.number(), // meters
    startLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.string(),
    }),
    endLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.string(),
    }),
    
    // Evaluation
    tags: v.array(v.string()),
    rating: v.number(), // 1-5
    journalEntry: v.optional(v.string()),
    voiceNoteStorageId: v.optional(v.id("_storage")),
    
    // Privacy & Sharing
    isPrivate: v.boolean(),
    isAnonymous: v.boolean(),
    sharingLevel: v.union(
      v.literal("private"),
      v.literal("anonymous"),
      v.literal("public")
    ),
    
    // Community Engagement
    completionCount: v.number(),
    totalRating: v.number(),
    verificationCount: v.number(),
    
    // Credits
    creditsEarned: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_sharing", ["sharingLevel"])
    .index("by_rating", ["rating"])
    .index("by_type", ["routeType"]) // For filtering by route type
    .index("by_sharing_and_rating", ["sharingLevel", "rating"]), // Compound index for discovery

  routeCompletions: defineTable({
    routeId: v.id("routes"),
    userId: v.id("users"),
    completedAt: v.number(),
    userRating: v.number(), // 1-5
    userTags: v.array(v.string()),
    feedback: v.optional(v.string()),
    verified: v.boolean(),
  })
    .index("by_route", ["routeId"])
    .index("by_user", ["userId"])
    .index("by_route_and_user", ["routeId", "userId"]),

  routeFlags: defineTable({
    routeId: v.id("routes"),
    userId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_route", ["routeId"])
    .index("by_user", ["userId"])
    .index("by_route_and_user", ["routeId", "userId"])
    .index("by_status", ["status"]),

  votes: defineTable({
    userId: v.id("users"),
    targetId: v.string(), // Can be postId or commentId
    targetType: v.union(v.literal("post"), v.literal("comment")),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  })
    .index("by_user", ["userId"])
    .index("by_target", ["targetId"])
    .index("by_user_and_target", ["userId", "targetId"]),

  directMessages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    media: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("video")),
      storageId: v.id("_storage"),
      url: v.string(),
    }))),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["senderId", "receiverId"]),

  pollVotes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    optionIndex: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  notifications: defineTable({
    userId: v.id("users"), // Who receives the notification
    type: v.union(
      v.literal("message"),
      v.literal("comment"),
      v.literal("upvote"),
      v.literal("verification"),
      v.literal("route_completion"),
      v.literal("opportunity_unlock"),
      v.literal("mention"),
      v.literal("tip"),
      v.literal("accompaniment_request"),
      v.literal("accompaniment_update"),
      v.literal("emergency")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()), // Where to navigate when clicked
    fromUserId: v.optional(v.id("users")), // Who triggered the notification
    relatedId: v.optional(v.string()), // Related post/comment/message ID
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"]),

  emergencyContacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phoneNumber: v.string(), // WhatsApp number
    relationship: v.optional(v.string()),
    priority: v.number(), // 1-5, determines notification order
  })
    .index("by_user", ["userId"])
    .index("by_user_and_priority", ["userId", "priority"]),

  emergencyAlerts: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("active"),
      v.literal("resolved"),
      v.literal("cancelled"),
      v.literal("false_alarm")
    ),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
      address: v.optional(v.string()),
    }),
    message: v.optional(v.string()), // Custom emergency message
    alertType: v.union(
      v.literal("panic"),
      v.literal("check_in_failed"),
      v.literal("journey_alert"),
      v.literal("manual")
    ),
    notifiedContacts: v.array(v.id("emergencyContacts")),
    nearbyUsersNotified: v.number(), // Count of nearby users alerted
    postId: v.optional(v.id("posts")), // Auto-created emergency post
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  emergencyResponses: defineTable({
    alertId: v.id("emergencyAlerts"),
    responderId: v.id("users"),
    responseType: v.union(
      v.literal("can_help"),
      v.literal("on_way"),
      v.literal("contacted_authorities"),
      v.literal("false_alarm_report")
    ),
    message: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  })
    .index("by_alert", ["alertId"])
    .index("by_responder", ["responderId"]),

  reels: defineTable({
    authorId: v.id("users"),
    
    // Provider abstraction
    provider: v.union(
      v.literal("cloudinary"),
      v.literal("aws"),
      v.literal("custom")
    ),
    externalId: v.string(), // Provider-specific ID (e.g., Cloudinary public_id)
    
    // URLs
    videoUrl: v.string(), // Playback URL
    thumbnailUrl: v.string(), // Auto-generated thumbnail
    
    // Video metadata
    duration: v.number(), // seconds (15-90)
    metadata: v.object({
      width: v.number(),
      height: v.number(),
      format: v.string(),
      sizeBytes: v.number(),
      transformations: v.optional(v.any()), // Provider-specific data
    }),
    
    // Content
    caption: v.optional(v.string()), // 0-500 chars
    hashtags: v.optional(v.array(v.string())),
    location: v.optional(v.object({
      name: v.string(),
      coordinates: v.array(v.number()), // [lng, lat]
    })),
    
    // AI-extracted metadata (to be populated later by AI analysis)
    aiMetadata: v.optional(v.object({
      safetyCategory: v.optional(v.union(
        v.literal("Harassment"),
        v.literal("Joy"),
        v.literal("Lighting Issue"),
        v.literal("Infrastructure Problem"),
        v.literal("Positive Experience"),
        v.literal("Warning")
      )),
      sentiment: v.optional(v.number()), // -1 to 1
      detectedObjects: v.optional(v.array(v.string())),
      visualTags: v.optional(v.array(v.string())), // "dark street", "crowded area", etc.
      transcription: v.optional(v.string()), // Voice-to-text
    })),
    
    // Engagement metrics
    views: v.number(), // Default: 0
    likes: v.number(), // Default: 0
    comments: v.number(), // Default: 0
    shares: v.number(), // Default: 0
    completionRate: v.optional(v.number()), // 0-1
    avgWatchTime: v.optional(v.number()), // seconds
    
    // Privacy & moderation
    isAnonymous: v.boolean(),
    moderationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("flagged"),
      v.literal("rejected")
    ),
    moderationScore: v.optional(v.number()), // 0-100 AI confidence score
    moderationReason: v.optional(v.string()), // Why flagged
    moderationCategories: v.optional(v.array(v.string())), // Violation categories
  })
    .index("by_author", ["authorId"])
    .index("by_moderation", ["moderationStatus"])
    .index("by_engagement", ["views"]), // For trending algorithm

  reelLikes: defineTable({
    userId: v.id("users"),
    reelId: v.id("reels"),
  })
    .index("by_user_and_reel", ["userId", "reelId"])
    .index("by_reel", ["reelId"]),

  // Reel Comments - Nested threading support
  reelComments: defineTable({
    reelId: v.id("reels"),
    authorId: v.id("users"),
    content: v.string(), // Max 500 chars
    parentId: v.optional(v.id("reelComments")), // For replies
    likes: v.number(), // Default: 0
    isDeleted: v.boolean(), // Soft delete
  })
    .index("by_reel", ["reelId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentId"]),

  reelCommentLikes: defineTable({
    userId: v.id("users"),
    commentId: v.id("reelComments"),
  })
    .index("by_user_and_comment", ["userId", "commentId"])
    .index("by_comment", ["commentId"]),

  livestreams: defineTable({
    hostId: v.id("users"),
    channelName: v.string(), // Agora channel name
    title: v.string(),
    description: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal("live"),
      v.literal("ended"),
      v.literal("scheduled")
    ),
    
    // Metrics
    viewerCount: v.number(), // Current viewers
    peakViewerCount: v.number(), // Max concurrent viewers
    totalViews: v.number(), // Total unique viewers
    likes: v.number(),
    
    // Safety features
    safetyMode: v.boolean(), // Enable AI moderation
    isEmergency: v.boolean(), // Emergency broadcast
    location: v.optional(v.object({
      name: v.string(),
      coordinates: v.array(v.number()), // [lng, lat]
    })),
    
    // Timestamps
    scheduledFor: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    
    // Privacy
    isPrivate: v.boolean(),
    allowedViewers: v.optional(v.array(v.id("users"))),
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"])
    .index("by_status_and_time", ["status", "startedAt"]),

  livestreamViewers: defineTable({
    livestreamId: v.id("livestreams"),
    userId: v.id("users"),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_user", ["userId"])
    .index("by_livestream_and_active", ["livestreamId", "isActive"]),

  livestreamLikes: defineTable({
    livestreamId: v.id("livestreams"),
    userId: v.id("users"),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_user_and_livestream", ["userId", "livestreamId"]),

  analytics_events: defineTable({
    eventType: v.string(), // e.g., "page_view", "button_click", "video_play"
    sessionId: v.string(), // Unique session identifier
    userId: v.optional(v.id("users")), // Optional for anonymous events
    
    // Event metadata (flexible JSON)
    metadata: v.optional(v.any()), // Event-specific data
    
    // Geolocation (optional)
    geo: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
    
    // Device/Browser info
    device: v.optional(v.object({
      userAgent: v.optional(v.string()),
      platform: v.optional(v.string()),
      isMobile: v.optional(v.boolean()),
      screenWidth: v.optional(v.number()),
      screenHeight: v.optional(v.number()),
    })),
    
    // Performance metrics
    performance: v.optional(v.object({
      loadTime: v.optional(v.number()),
      renderTime: v.optional(v.number()),
      networkLatency: v.optional(v.number()),
    })),
    
    timestamp: v.number(), // Event timestamp
  })
    .index("by_event_and_time", ["eventType", "timestamp"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  moderationQueue: defineTable({
    contentType: v.union(
      v.literal("reel"),
      v.literal("post"),
      v.literal("comment"),
      v.literal("livestream_snapshot")
    ),
    contentId: v.string(), // ID of the flagged content
    authorId: v.id("users"),
    
    // Moderation result
    flagged: v.boolean(),
    score: v.number(), // 0-100
    reason: v.string(),
    categories: v.array(v.string()),
    confidence: v.number(), // 0-100
    
    // Content preview
    contentPreview: v.string(), // Text snippet or image URL
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("appealed")
    ),
    
    // Admin action
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_content", ["contentType", "contentId"])
    .index("by_author", ["authorId"])
    .index("by_score", ["score"]),

  userReports: defineTable({
    reporterId: v.id("users"),
    contentType: v.union(
      v.literal("reel"),
      v.literal("post"),
      v.literal("comment"),
      v.literal("livestream")
    ),
    contentId: v.string(),
    reason: v.string(),
    category: v.union(
      v.literal("harassment"),
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("misinformation"),
      v.literal("violence"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed")
    ),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_content", ["contentType", "contentId"])
    .index("by_reporter_content", ["reporterId", "contentType", "contentId"]),

  // Monetization tables
  subscriptions: defineTable({
    subscriberId: v.id("users"),
    creatorId: v.id("users"),
    tier: v.union(v.literal("basic"), v.literal("premium"), v.literal("vip")),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    renewsAt: v.number(),
  })
    .index("by_subscriber", ["subscriberId"])
    .index("by_creator", ["creatorId"])
    .index("by_subscriber_creator", ["subscriberId", "creatorId"]),

  tips: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amount: v.number(),
    contentId: v.optional(v.string()),
    message: v.optional(v.string()),
  })
    .index("by_sender", ["fromUserId"])
    .index("by_recipient", ["toUserId"]),

  payouts: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    paymentMethod: v.string(),
    paymentDetails: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // B2B Intelligence Products
  corporateSafetyIndex: defineTable({
    companyName: v.string(), // Normalized company name
    industry: v.optional(v.string()),
    
    // Overall Safety Score (0-100)
    overallScore: v.number(),
    
    // Dimension Scores (0-100)
    harassmentScore: v.number(), // Lower = more harassment reports
    inclusionScore: v.number(), // Higher = more inclusive
    workLifeBalanceScore: v.number(),
    careerGrowthScore: v.number(),
    compensationScore: v.number(),
    
    // Metrics
    totalReviews: v.number(),
    averageRating: v.number(), // 1-5 stars
    
    // Trends (month-over-month change)
    monthlyTrend: v.object({
      overallChange: v.number(), // +/- percentage
      reviewCountChange: v.number(),
      lastUpdated: v.number(),
    }),
    
    // Risk Factors (extracted from reviews)
    riskFactors: v.array(v.string()), // ["high turnover", "toxic culture", etc.]
    positiveFactors: v.array(v.string()), // ["flexible hours", "supportive", etc.]
    
    // Data Quality
    dataQuality: v.object({
      completeness: v.number(), // 0-100
      recency: v.number(), // Days since last review
      trustScoreAvg: v.number(), // Average trust score of reviewers
    }),
    
    lastAggregated: v.number(), // Timestamp of last aggregation
  })
    .index("by_company", ["companyName"])
    .index("by_score", ["overallScore"])
    .index("by_industry", ["industry"]),

  urbanSafetyIndex: defineTable({
    // Geographic Grid (0.01 degree squares ≈ 1km)
    gridLat: v.number(), // Rounded to 2 decimals
    gridLng: v.number(), // Rounded to 2 decimals
    
    // Location Info
    city: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    country: v.optional(v.string()),
    
    // Overall Safety Score (0-100)
    overallScore: v.number(),
    
    // Time-based Scores
    dayScore: v.number(), // 6am-6pm
    nightScore: v.number(), // 6pm-6am
    
    // Safety by Hour (24-element array, 0-100 for each hour)
    safetyByHour: v.array(v.number()),
    
    // Route Metrics
    totalRoutes: v.number(),
    averageRating: v.number(), // 1-5 stars
    
    // Risk Factors (extracted from route tags)
    riskFactors: v.array(v.string()), // ["poor lighting", "isolated", etc.]
    safetyFeatures: v.array(v.string()), // ["well-lit", "busy", "police presence", etc.]
    
    // Popular Route Types
    routeTypes: v.object({
      walking: v.number(),
      running: v.number(),
      cycling: v.number(),
      commuting: v.number(),
    }),
    
    // Data Quality
    dataQuality: v.object({
      completeness: v.number(), // 0-100
      recency: v.number(), // Days since last route
      trustScoreAvg: v.number(), // Average trust score of route creators
    }),
    
    lastAggregated: v.number(), // Timestamp of last aggregation
  })
    .index("by_grid", ["gridLat", "gridLng"])
    .index("by_score", ["overallScore"])
    .index("by_city", ["city"]),

  // Comments - Reddit-style nested threading (Task 58.1)
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(), // Comment text (max 2000 chars)
    
    // Nested threading support
    parentId: v.optional(v.id("comments")), // null for top-level, ID for replies
    depth: v.optional(v.number()), // 0 for top-level, increments for each nesting level
    
    // Engagement
    upvotes: v.number(), // Default: 0
    downvotes: v.number(), // Default: 0
    replyCount: v.optional(v.number()), // Number of direct replies
    
    // Moderation
    isDeleted: v.boolean(), // Soft delete
    deletedAt: v.optional(v.number()),
    moderationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("flagged")
    )),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentId"]) // For fetching replies
    .index("by_post_and_parent", ["postId", "parentId"]), // For efficient threading

  // Health & Soul Sanctuary - Wellness Tracking (Task 56)
  hydrationLogs: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format for daily tracking
    glasses: v.number(), // Number of glasses consumed
    goal: v.number(), // Daily goal (default: 8)
    completed: v.boolean(), // Whether goal was reached
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  emotionalCheckins: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    mood: v.number(), // 1-5 scale (1=😢, 2=😐, 3=😊, 4=😄, 5=🤩)
    journal: v.optional(v.string()), // Optional journal entry (max 500 chars)
    tags: v.optional(v.array(v.string())), // Mood tags (e.g., "stressed", "happy", "anxious")
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  meditationSessions: defineTable({
    userId: v.id("users"),
    duration: v.number(), // Duration in minutes (5, 10, 15)
    type: v.union(
      v.literal("breathing"),
      v.literal("guided"),
      v.literal("mindfulness")
    ),
    completed: v.boolean(),
    creditsEarned: v.number(), // 5 credits per session
  })
    .index("by_user", ["userId"]),

  // Sister Accompaniment - Real-time location sharing for safety (Task 57.5)
  accompanimentSessions: defineTable({
    userId: v.id("users"), // Person being tracked
    routeId: v.optional(v.id("routes")), // Optional linked route
    destination: v.string(), // Where they're going
    estimatedArrival: v.number(), // Timestamp
    companions: v.array(v.id("users")), // People tracking them
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("emergency")
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    lastUpdate: v.number(),
    currentLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.optional(v.number()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ============================================
  // ELITE FEATURES FOR GLOBAL WOMEN'S PLATFORM
  // ============================================

  // Cycle/Period Tracker - Essential women's health
  cycleLogs: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    type: v.union(v.literal("period"), v.literal("symptom"), v.literal("note")),
    flow: v.optional(v.union(
      v.literal("light"),
      v.literal("medium"),
      v.literal("heavy"),
      v.literal("spotting")
    )),
    symptoms: v.optional(v.array(v.string())), // cramps, headache, bloating, etc.
    mood: v.optional(v.number()), // 1-5
    energy: v.optional(v.number()), // 1-5
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Safety Resources Directory - Global hotlines, shelters, legal aid
  safetyResources: defineTable({
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
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    isGlobal: v.optional(v.boolean()), // Available worldwide
    services: v.optional(v.array(v.string())),
    hours: v.optional(v.string()), // "24/7" or "Mon-Fri 9-5"
    languages: v.optional(v.array(v.string())),
    isVerified: v.boolean(),
    isActive: v.boolean(),
    priority: v.optional(v.number()), // 1-10, lower = higher priority
    verificationCount: v.optional(v.number()),
    submittedBy: v.optional(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_country", ["country"])
    .index("by_active", ["isActive"]),

  resourceVerifications: defineTable({
    resourceId: v.id("safetyResources"),
    userId: v.id("users"),
  })
    .index("by_resource", ["resourceId"])
    .index("by_resource_and_user", ["resourceId", "userId"]),

  resourceReports: defineTable({
    resourceId: v.id("safetyResources"),
    userId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved")),
  })
    .index("by_resource", ["resourceId"])
    .index("by_status", ["status"]),

  // Support Circles - Community groups by topic
  circles: defineTable({
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
    creatorId: v.id("users"),
    isPrivate: v.boolean(),
    maxMembers: v.optional(v.number()),
    memberCount: v.number(),
    postCount: v.number(),
    rules: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_creator", ["creatorId"])
    .index("by_active", ["isActive"]),

  circleMembers: defineTable({
    circleId: v.id("circles"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("moderator"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_circle", ["circleId"])
    .index("by_user", ["userId"])
    .index("by_circle_and_user", ["circleId", "userId"]),

  circlePosts: defineTable({
    circleId: v.id("circles"),
    authorId: v.id("users"),
    content: v.string(),
    isAnonymous: v.boolean(),
    likes: v.number(),
    commentCount: v.number(),
  })
    .index("by_circle", ["circleId"])
    .index("by_author", ["authorId"]),

  // Safety Check-ins - Scheduled "I'm OK" pings
  safetyCheckins: defineTable({
    userId: v.id("users"),
    scheduledTime: v.number(), // When check-in is expected
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("missed"),
      v.literal("alert_sent")
    ),
    confirmedAt: v.optional(v.number()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    note: v.optional(v.string()),
    alertContacts: v.optional(v.array(v.id("emergencyContacts"))),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledTime"]),

  // Anonymous Workplace Reports - For harassment reporting
  workplaceReports: defineTable({
    reporterId: v.id("users"),
    companyName: v.string(),
    incidentType: v.union(
      v.literal("harassment"),
      v.literal("discrimination"),
      v.literal("pay_inequality"),
      v.literal("hostile_environment"),
      v.literal("retaliation"),
      v.literal("other")
    ),
    description: v.string(),
    date: v.optional(v.string()), // When incident occurred
    isAnonymous: v.boolean(),
    isPublic: v.boolean(), // Share with community or keep private
    supportNeeded: v.optional(v.array(v.string())), // legal, counseling, etc.
    status: v.union(
      v.literal("submitted"),
      v.literal("reviewed"),
      v.literal("verified"),
      v.literal("resolved")
    ),
    verificationCount: v.optional(v.number()),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_company", ["companyName"])
    .index("by_type", ["incidentType"])
    .index("by_status", ["status"]),

  // ============================================
  // AURORA GUARDIAN SYSTEM - In-Platform Contacts
  // ============================================

  // Aurora Guardian Connections (like friends)
  auroraGuardians: defineTable({
    userId: v.id("users"), // The user who has this guardian
    guardianId: v.id("users"), // The guardian user
    status: v.union(
      v.literal("pending"), // Request sent
      v.literal("accepted"), // Both connected
      v.literal("declined"), // Request declined
      v.literal("blocked") // Blocked
    ),
    requestedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    message: v.optional(v.string()), // Request message
    // Permissions
    canSeeLocation: v.boolean(), // Can see real-time location
    canReceiveAlerts: v.boolean(), // Receives emergency alerts
    canReceiveCheckins: v.boolean(), // Receives check-in notifications
  })
    .index("by_user", ["userId"])
    .index("by_guardian", ["guardianId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_guardian_status", ["guardianId", "status"]),

  // Guardian Notifications - For check-ins and alerts
  guardianNotifications: defineTable({
    guardianId: v.id("users"), // Who receives the notification
    fromUserId: v.id("users"), // Who triggered it
    type: v.union(
      v.literal("checkin_missed"), // User missed a check-in
      v.literal("emergency_alert"), // Panic button pressed
      v.literal("location_share"), // Started sharing location
      v.literal("accompaniment_request"), // Wants accompaniment
      v.literal("safe_arrival") // Arrived safely
    ),
    message: v.string(),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    })),
    isRead: v.boolean(),
    isActioned: v.boolean(), // Guardian took action
    actionTaken: v.optional(v.string()),
    relatedId: v.optional(v.string()), // Related checkin/alert ID
  })
    .index("by_guardian", ["guardianId"])
    .index("by_guardian_unread", ["guardianId", "isRead"])
    .index("by_from_user", ["fromUserId"]),

  // Location Sharing Sessions
  locationShares: defineTable({
    userId: v.id("users"), // Who is sharing
    sharedWith: v.array(v.id("users")), // Aurora Guardians receiving
    destination: v.optional(v.string()),
    estimatedArrival: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("arrived"),
      v.literal("cancelled"),
      v.literal("emergency")
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    lastLocation: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number()),
      timestamp: v.number(),
    })),
    locationHistory: v.optional(v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      timestamp: v.number(),
    }))),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // Saved Posts - Bookmarked content for users
  savedPosts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),
});
