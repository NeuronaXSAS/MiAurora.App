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
    creditCost: v.number(),
    company: v.optional(v.string()),
    companyName: v.optional(v.string()), // Legacy field
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    salaryRange: v.optional(v.string()), // Legacy field
    safetyRating: v.optional(v.number()),
    contactEmail: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    externalUrl: v.optional(v.string()), // Legacy field
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

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")), // For nested replies
    upvotes: v.number(),
    downvotes: v.number(),
    isDeleted: v.boolean(),
    media: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("video")),
      storageId: v.id("_storage"),
      url: v.string(),
    }))),
    
    // Moderation
    moderationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("flagged")
    )),
    moderationScore: v.optional(v.number()),
    isHidden: v.optional(v.boolean()), // Auto-hide toxic comments
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentCommentId"]),

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
      v.literal("tip")
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
});
