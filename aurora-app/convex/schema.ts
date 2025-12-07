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
    
    // Life Canvas - Life visualization
    birthYear: v.optional(v.number()), // Year of birth for life visualization
    lifeExpectancy: v.optional(v.number()), // Expected years to live (default: 80)
    gender: v.optional(v.union(
      v.literal("female"),
      v.literal("non-binary"),
      v.literal("prefer-not-to-say")
    )),
    
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
    reelId: v.optional(v.id("reels")), // Link to shared reel
    upvotes: v.optional(v.number()), // Default: 0
    downvotes: v.optional(v.number()), // Default: 0
    commentCount: v.optional(v.number()), // Default: 0
    postType: v.optional(v.union(
      v.literal("standard"),
      v.literal("poll"),
      v.literal("ai_chat"),
      v.literal("reel")
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
      type: v.union(v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("file")),
      storageId: v.id("_storage"),
      url: v.string(),
      fileName: v.optional(v.string()),
      fileSize: v.optional(v.number()),
    }))),
    // Reply functionality
    replyTo: v.optional(v.object({
      messageId: v.id("directMessages"),
      content: v.string(),
      senderId: v.id("users"),
    })),
    // Reactions (emoji)
    reactions: v.optional(v.array(v.object({
      userId: v.id("users"),
      emoji: v.string(),
      timestamp: v.number(),
    }))),
    // Edit tracking
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    // Delete tracking
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    hiddenBy: v.optional(v.array(v.id("users"))), // For "delete for me"
    // Forward tracking
    isForwarded: v.optional(v.boolean()),
    forwardedFrom: v.optional(v.id("directMessages")),
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
      v.literal("emergency"),
      v.literal("system") // Admin broadcasts
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
    // Location for safety map integration
    location: v.optional(v.object({
      name: v.string(),
      coordinates: v.array(v.number()), // [lng, lat]
    })),
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

  // User Badges - Achievement system for empowerment
  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.string(), // References BADGE_DEFINITIONS in badges.ts
    earnedAt: v.number(),
    isNew: v.boolean(), // For showing celebration animation
  })
    .index("by_user", ["userId"])
    .index("by_badge", ["badgeId"])
    .index("by_user_and_badge", ["userId", "badgeId"]),

  // AI Interaction Tracking - For dashboard analytics
  aiInteractions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("text_chat"),
      v.literal("voice_chat"),
      v.literal("shared_chat")
    ),
    messageCount: v.optional(v.number()),
    duration: v.optional(v.number()), // seconds for voice
    sentiment: v.optional(v.string()), // positive, neutral, negative
    topics: v.optional(v.array(v.string())), // detected topics
  })
    .index("by_user", ["userId"]),

  // Opportunity Comments - Credit-based interactions (2 credits per comment)
  opportunityComments: defineTable({
    opportunityId: v.id("opportunities"),
    authorId: v.id("users"),
    content: v.string(), // Max 500 chars
    parentId: v.optional(v.id("opportunityComments")), // For replies
    likes: v.number(), // Default: 0
    isDeleted: v.boolean(), // Soft delete
  })
    .index("by_opportunity", ["opportunityId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentId"]),

  // Opportunity Likes - Credit-based (1 credit, refundable on unlike)
  opportunityLikes: defineTable({
    opportunityId: v.id("opportunities"),
    userId: v.id("users"),
  })
    .index("by_opportunity", ["opportunityId"])
    .index("by_user_and_opportunity", ["userId", "opportunityId"]),

  // Opportunity Comment Likes
  opportunityCommentLikes: defineTable({
    commentId: v.id("opportunityComments"),
    userId: v.id("users"),
  })
    .index("by_comment", ["commentId"])
    .index("by_user_and_comment", ["userId", "commentId"]),

  // ============================================
  // AURORA PREMIUM EXPANSION - Monetization System
  // ============================================

  // Subscription Tiers Configuration
  subscriptionTiers: defineTable({
    tierId: v.string(), // "free", "plus", "pro", "elite"
    name: v.string(),
    monthlyPrice: v.number(), // USD
    annualPrice: v.number(), // USD (20% discount)
    benefits: v.object({
      adFree: v.boolean(),
      aiMessagesPerDay: v.number(), // -1 for unlimited
      postsPerHour: v.number(),
      reelsPerDay: v.number(),
      livestreamsPerDay: v.number(),
      monthlyCredits: v.number(),
      prioritySupport: v.boolean(),
      advancedAnalytics: v.boolean(),
      exclusiveEvents: v.boolean(),
      safetyConsultations: v.boolean(),
      badge: v.string(), // "none", "premium", "pro", "vip"
    }),
    isActive: v.boolean(),
  })
    .index("by_tier_id", ["tierId"]),

  // User Subscriptions (Premium)
  userSubscriptions: defineTable({
    userId: v.id("users"),
    tier: v.string(), // "free", "plus", "pro", "elite"
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_status", ["status"]),

  // Circle Premium Tiers (for Circle monetization)
  circleTiers: defineTable({
    circleId: v.id("circles"),
    tierId: v.string(), // "free", "supporter", "vip"
    name: v.string(),
    price: v.number(), // Monthly price in credits
    benefits: v.array(v.string()),
    roomAccess: v.optional(v.array(v.string())), // Room IDs that require this tier
    isActive: v.boolean(),
  })
    .index("by_circle", ["circleId"])
    .index("by_circle_tier", ["circleId", "tierId"]),

  // Circle Premium Memberships
  circleMemberships: defineTable({
    circleId: v.id("circles"),
    userId: v.id("users"),
    tier: v.string(), // "free", "supporter", "vip"
    subscribedAt: v.number(),
    renewsAt: v.number(),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("expired")),
    autoRenew: v.optional(v.boolean()),
  })
    .index("by_circle", ["circleId"])
    .index("by_user", ["userId"])
    .index("by_circle_user", ["circleId", "userId"])
    .index("by_status", ["status"]),

  // Rooms (for Circles - chat, audio, video, forum, broadcast)
  rooms: defineTable({
    circleId: v.id("circles"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("chat"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("forum"),
      v.literal("broadcast")
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("tier")
    ),
    requiredTier: v.optional(v.string()), // Required tier for access
    maxParticipants: v.optional(v.number()), // 16 for video, 9 hosts for broadcast
    createdBy: v.id("users"),
    isActive: v.boolean(),
    agoraChannel: v.optional(v.string()),
    // Chat room features
    features: v.optional(v.object({
      threads: v.optional(v.boolean()),
      reactions: v.optional(v.boolean()),
      gifs: v.optional(v.boolean()),
      polls: v.optional(v.boolean()),
      pins: v.optional(v.boolean()),
      mentions: v.optional(v.boolean()),
    })),
  })
    .index("by_circle", ["circleId"])
    .index("by_type", ["type"])
    .index("by_circle_type", ["circleId", "type"]),

  // Room Participants (for tracking who's in audio/video/broadcast rooms)
  roomParticipants: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.union(v.literal("host"), v.literal("speaker"), v.literal("listener")),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_active", ["roomId", "isActive"]),

  // Room Messages (for chat and forum rooms)
  roomMessages: defineTable({
    roomId: v.id("rooms"),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("roomMessages")), // For threads
    isPinned: v.optional(v.boolean()),
    reactions: v.optional(v.array(v.object({
      emoji: v.string(),
      count: v.number(),
      users: v.array(v.id("users")),
    }))),
    attachments: v.optional(v.array(v.object({
      type: v.string(),
      url: v.string(),
      name: v.optional(v.string()),
    }))),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_room", ["roomId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentId"]),

  // Gift Catalog
  giftCatalog: defineTable({
    giftId: v.string(),
    name: v.string(),
    category: v.union(
      v.literal("hearts"),
      v.literal("sparkles"),
      v.literal("crowns"),
      v.literal("aurora_special")
    ),
    credits: v.number(),
    animationUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.optional(v.number()),
  })
    .index("by_gift_id", ["giftId"])
    .index("by_category", ["category"]),

  // Gift Transactions
  giftTransactions: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    giftId: v.string(),
    credits: v.number(),
    creatorEarnings: v.number(), // 85% of credits
    platformFee: v.number(), // 15% of credits
    livestreamId: v.optional(v.id("livestreams")),
    message: v.optional(v.string()),
  })
    .index("by_sender", ["fromUserId"])
    .index("by_recipient", ["toUserId"])
    .index("by_livestream", ["livestreamId"]),

  // Super Chats (pinned messages during livestreams)
  superChats: defineTable({
    userId: v.id("users"),
    livestreamId: v.id("livestreams"),
    message: v.string(),
    credits: v.number(),
    pinnedUntil: v.number(), // Timestamp when pin expires
    creatorEarnings: v.number(),
  })
    .index("by_livestream", ["livestreamId"])
    .index("by_user", ["userId"])
    .index("by_pinned_until", ["pinnedUntil"]),

  // Events (paid and free)
  events: defineTable({
    circleId: v.optional(v.id("circles")),
    hostId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.union(v.literal("virtual"), v.literal("in-person"), v.literal("hybrid")),
    pricing: v.union(v.literal("free"), v.literal("paid"), v.literal("tier-exclusive")),
    price: v.optional(v.number()), // In credits or USD
    priceType: v.optional(v.union(v.literal("credits"), v.literal("usd"))),
    requiredTier: v.optional(v.string()),
    capacity: v.number(),
    waitlistEnabled: v.boolean(),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.optional(v.string()),
    location: v.optional(v.object({
      name: v.string(),
      address: v.optional(v.string()),
      coordinates: v.optional(v.array(v.number())),
    })),
    roomId: v.optional(v.id("rooms")), // For virtual events
    coverImage: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("ended"),
      v.literal("cancelled")
    ),
    attendeeCount: v.optional(v.number()),
    averageRating: v.optional(v.number()),
  })
    .index("by_circle", ["circleId"])
    .index("by_host", ["hostId"])
    .index("by_status", ["status"])
    .index("by_start_time", ["startTime"]),

  // Event RSVPs
  eventRsvps: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("waitlist"),
      v.literal("cancelled")
    ),
    paidAmount: v.optional(v.number()),
    paymentType: v.optional(v.union(v.literal("credits"), v.literal("usd"))),
    hostEarnings: v.optional(v.number()), // 80% of paid amount
    rsvpedAt: v.number(),
    checkedInAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"])
    .index("by_status", ["status"]),

  // Event Reviews
  eventReviews: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    rating: v.number(), // 1-5
    review: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"]),

  // Credit Packages (for purchase)
  creditPackages: defineTable({
    packageId: v.string(),
    credits: v.number(),
    priceUSD: v.number(),
    bonus: v.optional(v.number()), // Bonus credits for larger packages
    isActive: v.boolean(),
    sortOrder: v.optional(v.number()),
    // Regional pricing
    regionalPricing: v.optional(v.array(v.object({
      region: v.string(),
      currency: v.string(),
      price: v.number(),
    }))),
  })
    .index("by_package_id", ["packageId"]),

  // Credit Purchases
  creditPurchases: defineTable({
    userId: v.id("users"),
    packageId: v.string(),
    credits: v.number(),
    bonusCredits: v.optional(v.number()),
    amountPaid: v.number(),
    currency: v.string(),
    stripePaymentId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_payment", ["stripePaymentId"]),

  // Referrals
  referrals: defineTable({
    referrerId: v.id("users"),
    refereeId: v.id("users"),
    referralCode: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("expired")
    ),
    referrerCredited: v.boolean(),
    refereeCredited: v.boolean(),
    completedAt: v.optional(v.number()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referee", ["refereeId"])
    .index("by_code", ["referralCode"]),

  // Engagement Rewards Tracking (to prevent gaming)
  engagementRewards: defineTable({
    userId: v.id("users"),
    action: v.string(), // "daily_login", "post_created", etc.
    lastAwarded: v.number(),
    countToday: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_action", ["userId", "action"]),

  // Creator Subscription Tiers (for individual creators)
  creatorTiers: defineTable({
    creatorId: v.id("users"),
    tierId: v.string(), // "basic", "premium", "vip"
    name: v.string(),
    price: v.number(), // Monthly price in credits
    benefits: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_creator_tier", ["creatorId", "tierId"]),

  // Creator Subscribers (users subscribed to creators)
  creatorSubscribers: defineTable({
    creatorId: v.id("users"),
    subscriberId: v.id("users"),
    tier: v.string(),
    subscribedAt: v.number(),
    renewsAt: v.number(),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("expired")),
    autoRenew: v.optional(v.boolean()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_subscriber", ["subscriberId"])
    .index("by_creator_subscriber", ["creatorId", "subscriberId"]),

  // ============================================
  // FINANCIAL WELLNESS AI CHAT
  // ============================================

  // Financial Chat Messages - Conversation history with Aurora App AI
  financialChats: defineTable({
    userId: v.id("users"),
    userMessage: v.string(),
    aiResponse: v.string(),
    extractedData: v.optional(v.object({
      income: v.optional(v.number()),
      expenses: v.optional(v.number()),
      savingsGoal: v.optional(v.number()),
      currentSavings: v.optional(v.number()),
      debtAmount: v.optional(v.number()),
      budgetCategory: v.optional(v.string()),
      actionType: v.optional(v.string()),
    })),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Financial Profile - User's financial metrics (updated via chat)
  financialProfiles: defineTable({
    userId: v.id("users"),
    monthlyIncome: v.number(),
    monthlyExpenses: v.number(),
    savingsGoal: v.number(),
    currentSavings: v.number(),
    totalDebt: v.number(),
    wellnessScore: v.number(), // 0-100
    lastUpdated: v.number(),
  })
    .index("by_user", ["userId"]),

  // Financial Goals - Individual savings/investment goals
  financialGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.string()),
    category: v.string(), // "emergency", "savings", "investment", "debt", "purchase"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),

  // ============================================
  // SISTER CONNECTIONS (Matching System)
  // ============================================

  // Connection requests - Like Tinder, both users must like each other to match
  sisterConnections: defineTable({
    fromUserId: v.id("users"), // User who initiated the like
    toUserId: v.id("users"), // User who was liked
    status: v.union(
      v.literal("pending"), // One-sided like, waiting for other to like back
      v.literal("matched"), // Both users liked each other - can now chat!
      v.literal("declined"), // User explicitly declined
      v.literal("blocked") // User blocked
    ),
    createdAt: v.number(),
    matchedAt: v.optional(v.number()), // When mutual match happened
  })
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user", ["toUserId"])
    .index("by_from_to", ["fromUserId", "toUserId"])
    .index("by_status", ["status"]),

  // Skipped users - Users that were swiped left on (to not show again)
  sisterSkips: defineTable({
    userId: v.id("users"),
    skippedUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_skipped", ["userId", "skippedUserId"]),

  // ============================================
  // AURORA AI SEARCH ENGINE - Cache & API Usage
  // ============================================

  // Search Cache - 24-hour cache to minimize Brave API calls
  searchCache: defineTable({
    queryHash: v.string(), // MD5 hash of normalized query
    query: v.string(), // Original query
    results: v.any(), // SearchResult[] - cached results
    auroraInsights: v.any(), // AuroraInsights - cached insights
    cachedAt: v.number(), // Timestamp when cached
    expiresAt: v.number(), // 24 hours from cachedAt
    hitCount: v.number(), // Number of cache hits
  })
    .index("by_hash", ["queryHash"])
    .index("by_expiry", ["expiresAt"]),

  // API Usage Tracking - Monitor Brave API usage for Free tier (2,000/month)
  searchApiUsage: defineTable({
    month: v.string(), // "2024-12" format
    used: v.number(), // Number of API calls made
    limit: v.number(), // 2000 for free tier
    lastUpdated: v.number(), // Timestamp of last update
  })
    .index("by_month", ["month"]),

  // ============================================
  // COMMUNITY TRUTH SCORE™ - Crowdsourced Search Intelligence
  // ============================================

  // Anonymous votes on search results - NO PII stored
  searchVotes: defineTable({
    urlHash: v.string(), // SHA-256 hash of normalized URL
    sessionHash: v.string(), // One-way hash of session (not user ID)
    vote: v.union(v.literal("trust"), v.literal("flag")),
    timestamp: v.number(),
    // NO PII stored - completely anonymous
  })
    .index("by_url", ["urlHash"])
    .index("by_session_url", ["sessionHash", "urlHash"]),

  // Real-time vote aggregates for fast lookups
  searchVoteAggregates: defineTable({
    urlHash: v.string(), // SHA-256 hash of normalized URL
    trustCount: v.number(),
    flagCount: v.number(),
    totalVotes: v.number(),
    communityScore: v.number(), // 0-100 calculated score
    confidenceLevel: v.union(
      v.literal("building"), // < 5 votes
      v.literal("low"), // 5-14 votes
      v.literal("medium"), // 15-49 votes
      v.literal("high") // 50+ votes
    ),
    lastUpdated: v.number(),
  })
    .index("by_url", ["urlHash"])
    .index("by_score", ["communityScore"]),

  // Rate limiting for vote spam prevention
  searchVoteRateLimits: defineTable({
    sessionHash: v.string(),
    hourKey: v.string(), // "2024-12-05-14" format (date + hour)
    voteCount: v.number(),
  })
    .index("by_session_hour", ["sessionHash", "hourKey"]),

  // ============================================
  // DAILY NEWS PANELS - "What Sisters Think" 💜
  // 2 curated news stories daily for community discussion
  // ============================================

  // Daily curated news stories (admin-selected)
  dailyNewsStories: defineTable({
    date: v.string(), // "2024-12-05" format
    slot: v.union(v.literal(1), v.literal(2)), // 2 stories per day
    title: v.string(),
    summary: v.string(), // Brief summary for display
    sourceUrl: v.string(),
    sourceName: v.string(), // "BBC", "Reuters", etc.
    imageUrl: v.optional(v.string()),
    category: v.union(
      v.literal("safety"),
      v.literal("rights"),
      v.literal("health"),
      v.literal("career"),
      v.literal("finance"),
      v.literal("tech"),
      v.literal("world")
    ),
    // Voting stats (denormalized for fast display)
    agreeCount: v.number(),
    disagreeCount: v.number(),
    neutralCount: v.number(),
    totalVotes: v.number(),
    commentCount: v.number(),
    isActive: v.boolean(), // Can be deactivated
  })
    .index("by_date", ["date"])
    .index("by_date_slot", ["date", "slot"])
    .index("by_active", ["isActive"]),

  // User votes on daily news (one vote per user per story)
  dailyNewsVotes: defineTable({
    storyId: v.id("dailyNewsStories"),
    sessionHash: v.string(), // Anonymous voting supported
    userId: v.optional(v.id("users")), // Optional - logged in users
    vote: v.union(
      v.literal("agree"),
      v.literal("disagree"),
      v.literal("neutral")
    ),
    timestamp: v.number(),
  })
    .index("by_story", ["storyId"])
    .index("by_session_story", ["sessionHash", "storyId"])
    .index("by_user_story", ["userId", "storyId"]),

  // Comments on daily news stories
  dailyNewsComments: defineTable({
    storyId: v.id("dailyNewsStories"),
    authorId: v.optional(v.id("users")), // Optional for anonymous
    sessionHash: v.string(), // For anonymous tracking
    content: v.string(),
    isAnonymous: v.boolean(),
    upvotes: v.number(),
    downvotes: v.number(),
    replyCount: v.number(),
    parentCommentId: v.optional(v.id("dailyNewsComments")),
    isHidden: v.boolean(), // Moderation
  })
    .index("by_story", ["storyId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentCommentId"]),

  // ============================================
  // DAILY DEBATES SYSTEM - 6 debates per day
  // Bridges search engine and social network
  // ============================================

  // Daily Debates (6 per day, one per category)
  dailyDebates: defineTable({
    date: v.string(), // "2024-12-06" format
    slot: v.number(), // 1-6
    category: v.union(
      v.literal("safety"),
      v.literal("career"),
      v.literal("health"),
      v.literal("rights"),
      v.literal("tech"),
      v.literal("world")
    ),
    title: v.string(),
    summary: v.string(),
    sourceUrl: v.string(),
    sourceName: v.string(),
    imageUrl: v.optional(v.string()),
    // Vote counts (denormalized for fast display)
    agreeCount: v.number(),
    disagreeCount: v.number(),
    neutralCount: v.number(),
    commentCount: v.number(),
    // Source tracking
    isAutoGenerated: v.boolean(), // True if generated by Search API at midnight
    createdBy: v.optional(v.id("users")), // Admin who created (if manual)
    isActive: v.boolean(),
  })
    .index("by_date", ["date"])
    .index("by_date_slot", ["date", "slot"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Anonymous Debaters - Identity for anonymous participants
  anonymousDebaters: defineTable({
    sessionHash: v.string(), // SHA-256 of session ID
    pseudonym: v.string(), // User-chosen display name
    countryCode: v.string(), // ISO 3166-1 alpha-2 (e.g., "US", "CO", "FR")
    countryFlag: v.string(), // Emoji flag (e.g., "🇺🇸", "🇨🇴", "🇫🇷")
    interactionCount: v.number(), // Track for signup prompt at 10+
    firstSeen: v.number(),
    lastSeen: v.number(),
    // Migration tracking - when anonymous user signs up
    migratedToUserId: v.optional(v.id("users")),
  })
    .index("by_session", ["sessionHash"])
    .index("by_pseudonym", ["pseudonym"]),

  // Debate Votes
  debateVotes: defineTable({
    debateId: v.id("dailyDebates"),
    voterType: v.union(v.literal("anonymous"), v.literal("member")),
    anonymousId: v.optional(v.id("anonymousDebaters")),
    memberId: v.optional(v.id("users")),
    vote: v.union(v.literal("agree"), v.literal("disagree"), v.literal("neutral")),
    timestamp: v.number(),
  })
    .index("by_debate", ["debateId"])
    .index("by_anonymous_debate", ["anonymousId", "debateId"])
    .index("by_member_debate", ["memberId", "debateId"]),

  // Debate Comments - Threaded discussions
  debateComments: defineTable({
    debateId: v.id("dailyDebates"),
    authorType: v.union(v.literal("anonymous"), v.literal("member")),
    anonymousId: v.optional(v.id("anonymousDebaters")),
    memberId: v.optional(v.id("users")),
    content: v.string(),
    upvotes: v.number(),
    downvotes: v.number(),
    replyCount: v.number(),
    parentId: v.optional(v.id("debateComments")),
    isHidden: v.boolean(),
  })
    .index("by_debate", ["debateId"])
    .index("by_parent", ["parentId"])
    .index("by_anonymous", ["anonymousId"])
    .index("by_member", ["memberId"]),

  // ============================================
  // HABIT TRACKER - Build positive habits, break negative ones
  // ============================================

  // User Habits - Custom habits to track
  habits: defineTable({
    userId: v.id("users"),
    name: v.string(), // "No smoking", "Exercise", "Read 30min"
    emoji: v.string(), // Visual identifier
    type: v.union(v.literal("build"), v.literal("break")), // Build positive or break negative
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    targetDays: v.optional(v.array(v.number())), // 0-6 for custom (0=Sunday)
    reminderTime: v.optional(v.string()), // "09:00" format
    currentStreak: v.number(), // Current consecutive days
    longestStreak: v.number(), // Personal best
    totalCompletions: v.number(),
    color: v.optional(v.string()), // Custom color for visualization
    isActive: v.boolean(),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // Habit Completions - Daily check-ins for habits
  habitCompletions: defineTable({
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    completed: v.boolean(),
    note: v.optional(v.string()), // Optional reflection
    difficulty: v.optional(v.number()), // 1-5 how hard was it today
  })
    .index("by_habit", ["habitId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_habit_date", ["habitId", "date"]),

  // Personal Goals - Life goals with milestones
  personalGoals: defineTable({
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
    targetDate: v.optional(v.string()), // YYYY-MM-DD
    progress: v.number(), // 0-100
    milestones: v.optional(v.array(v.object({
      title: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    }))),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_category", ["category"]),

  // Daily Affirmations - Motivational messages
  dailyAffirmations: defineTable({
    category: v.union(
      v.literal("self-love"),
      v.literal("strength"),
      v.literal("growth"),
      v.literal("healing"),
      v.literal("success"),
      v.literal("peace")
    ),
    text: v.string(),
    author: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_category", ["category"]),

  // User Affirmation History - Track which affirmations shown
  userAffirmationHistory: defineTable({
    userId: v.id("users"),
    affirmationId: v.id("dailyAffirmations"),
    shownAt: v.number(),
    liked: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"]),

  // ============================================
  // LIFE CANVAS - Life Visualization & Daily Journal
  // GitHub-style contribution graph for life tracking
  // ============================================

  // Life Entries - Daily journal entries for life visualization
  lifeEntries: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    
    // Core journal entry
    journalText: v.optional(v.string()), // Main diary entry (max 2000 chars)
    
    // Quick wellness data (consolidated from other trackers)
    mood: v.optional(v.number()), // 1-5 scale
    energy: v.optional(v.number()), // 1-5 scale
    gratitude: v.optional(v.array(v.string())), // Up to 3 gratitude items
    
    // Health tracking
    hydrationGlasses: v.optional(v.number()),
    hasPeriod: v.optional(v.boolean()),
    sleepHours: v.optional(v.number()),
    exerciseMinutes: v.optional(v.number()),
    
    // Life dimensions (what areas did you focus on today?)
    dimensions: v.optional(v.array(v.union(
      v.literal("career"),
      v.literal("health"),
      v.literal("relationships"),
      v.literal("growth"),
      v.literal("creativity"),
      v.literal("adventure"),
      v.literal("rest")
    ))),
    
    // Tags for filtering/searching
    tags: v.optional(v.array(v.string())),
    
    // Media attachments
    photoStorageId: v.optional(v.id("_storage")),
    voiceNoteStorageId: v.optional(v.id("_storage")),
    
    // Intensity score (auto-calculated based on entry completeness)
    intensityScore: v.optional(v.number()), // 0-4 for GitHub-style coloring
    
    // Privacy
    isPrivate: v.boolean(), // Always true for now - personal journal
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_date", ["date"]),
});
