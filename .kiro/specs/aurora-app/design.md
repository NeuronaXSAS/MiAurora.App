# Design Document

## Mission Statement

**Aurora App empowers women to enjoy life and thrive through safety, community, and opportunity.**

Every feature, design decision, and interaction must serve one or more of these three pillars:
1. **SAFETY FIRST** 🛡️ - Protecting women's physical and emotional wellbeing
2. **COMMUNITY SUPPORT** 🤝 - Fostering genuine connections and mutual aid
3. **LIFE ADVANCEMENT** 💫 - Enabling professional, personal, and social growth

See `mission-alignment.md` for comprehensive feature purpose guidelines.

## Overview

Aurora App is built as a modern, real-time web application using Next.js 14 (App Router), Convex for backend and real-time database, WorkOS for authentication, Google Gemini AI for personalization, Mapbox for geographic visualization, and PostHog for analytics. The architecture prioritizes type safety (TypeScript end-to-end), real-time updates, scalability on free tiers, and rapid development velocity.

The application follows a component-based architecture with clear separation between presentation (React components), business logic (Convex functions), and external services (WorkOS, Google AI, Mapbox). All user interactions are optimistic, providing immediate feedback while background synchronization ensures data consistency.

**Design Philosophy:** Purpose over popularity. Every feature must demonstrably help women be safer, more connected, or more successful.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Pages (Global CDN)                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            Next.js 14 App (React 19)                      │ │
│  │  - App Router (Server + Client Components)                │ │
│  │  - Tailwind CSS + shadcn/ui                               │ │
│  │  - Mapbox GL JS + Agora Web SDK                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼─────────┐   ┌──────▼──────────┐
│    WorkOS      │   │     Convex       │   │   PostHog       │
│  (Auth/SSO)    │   │   (Backend)      │   │  (Analytics)    │
│                │   │                  │   │                 │
│ - Google SSO   │   │ - Database       │   │ - Events        │
│ - Microsoft    │   │ - Real-time      │   │ - Metrics       │
│ - User Mgmt    │   │ - Functions      │   │ - Insights      │
└────────────────┘   │ - File Store     │   └─────────────────┘
                     │ - Scheduling     │
                     └────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼─────────┐   ┌──────▼──────────┐
│  Cloudinary    │   │   Google AI      │   │     Agora       │
│ (Video CDN)    │   │   (Gemini)       │   │  (Live RTC)     │
│                │   │                  │   │                 │
│ - Reels        │   │ - Chat API       │   │ - Streaming     │
│ - Transcoding  │   │ - Vision API     │   │ - Recording     │
│ - AI Analysis  │   │ - NLP API        │   │ - Tokens        │
└────────────────┘   └──────────────────┘   └─────────────────┘
                              │
                     ┌────────▼─────────┐
                     │     Stripe       │
                     │   (Payments)     │
                     │                  │
                     │ - Subscriptions  │
                     │ - Marketplace    │
                     │ - Commissions    │
                     └──────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14.2+ (App Router with React Server Components)
- TypeScript 5.3+
- Tailwind CSS 3.4+
- shadcn/ui components
- Mapbox GL JS 3.0+
- Convex React client (real-time hooks)
- Agora Web SDK 4.x (live streaming)

**Backend:**
- Convex (serverless backend platform)
  - Database (document-based, real-time)
  - Server functions (queries, mutations, actions)
  - File storage (images, videos, documents)
  - Scheduled functions
  - Vector search (for AI features)

**File Storage & Media Processing:**
- Convex File Storage (primary for images/documents)
- Cloudinary (video processing, Reels hosting, CDN)
  - Video transcoding and optimization
  - Thumbnail generation
  - Adaptive bitrate streaming
  - AI-powered video analysis
- Cloudflare R2 (backup/CDN for large files)
- Supported formats: JPEG, PNG, WebP, MP4, MOV
- Max file size: 10MB per image, 100MB per Reel

**Live Streaming:**
- Agora RTC (Real-Time Communication)
  - Ultra-low latency (<500ms)
  - Adaptive bitrate
  - Screen sharing support
  - Recording capabilities

**Authentication:**
- WorkOS (SSO provider)
  - Google OAuth
  - Microsoft OAuth
  - Session management

**AI & Machine Learning:**
- Google AI Studio (Gemini 1.5 Flash)
  - Chat completions
  - Context-aware responses
  - Streaming support
  - Video content analysis
- Google Cloud Vision API
  - Image moderation
  - Object detection
  - Explicit content detection
- Google Cloud Natural Language API
  - Text toxicity analysis
  - Sentiment analysis
  - Entity extraction

**Payments & Monetization:**
- Stripe
  - Subscription management (Aurora Premium)
  - Marketplace payment processing
  - Commission handling
  - Affiliate tracking

**Analytics & Monitoring:**
- PostHog
  - Event tracking
  - User analytics
  - Feature flags
- Sentry
  - Error tracking
  - Performance monitoring
  - Real-time alerts

**Deployment:**
- Cloudflare Pages (frontend hosting)
- Convex Cloud (backend hosting)
- Environment variables for secrets

### Data Flow

**User Authentication Flow:**
```
User clicks "Sign In" 
  → Next.js redirects to WorkOS
  → User authenticates with Google/Microsoft
  → WorkOS returns to callback URL with code
  → Next.js exchanges code for session
  → Convex stores user profile
  → User redirected to home feed
```

**Real-time Feed Flow:**
```
User A creates post
  → Convex mutation saves to database
  → Convex broadcasts change to all subscribers
  → User B's feed updates automatically (no refresh)
  → PostHog tracks "post_created" event
```

**AI Assistant Flow:**
```
User sends message
  → Convex action receives message
  → Action fetches user context (profile, recent posts)
  → Action calls Google Gemini API with context
  → Gemini streams response
  → Convex returns response to client
  → UI displays message in chat
```

**Reel Upload & AI Analysis Flow:**
```
User uploads Reel video
  → Client uploads to Cloudinary via signed URL
  → Cloudinary processes video (transcode, thumbnail)
  → Cloudinary webhook triggers Convex action
  → Convex fetches video URL
  → Convex calls Gemini Vision API for content analysis
  → AI extracts safety tags, sentiment, location context
  → Convex saves Reel with metadata to database
  → User awarded 20 credits
  → Reel appears in feed with AI-generated insights
```

**Live Stream Flow:**
```
User starts live stream
  → Client requests Agora token from Convex
  → Convex generates token with channel permissions
  → Client initializes Agora SDK and joins channel
  → Stream location displayed on Safety Map (LIVE indicator)
  → Viewers join channel, send tips via Credits
  → Real-time chat messages via Convex subscriptions
  → User ends stream → Agora saves recording
  → Convex processes recording, extracts safety data
  → Stream saved as Post or Reel (user choice)
```

**Data Intelligence Aggregation Flow:**
```
User interactions logged as events
  → Convex stores raw events in analytics_events table
  → Scheduled function runs daily (3 AM UTC)
  → Aggregates workplace ratings → Corporate Safety Index
  → Aggregates route data → Urban Safety Index
  → Anonymizes and exports to Data Intelligence Lake
  → B2B API endpoints serve aggregated intelligence
  → Monthly reports generated for stakeholders
```

## Service Abstraction Layers (Provider-Agnostic Architecture)

To enable future migration from Cloudinary/Agora to AWS or other providers without refactoring the entire application, we implement abstraction layers that decouple business logic from specific vendor implementations.

### Video Provider Interface

**Design Rationale:** By defining a generic `VideoProvider` interface, we can swap Cloudinary for AWS MediaConvert or any other service by implementing the same interface. The application code remains unchanged.

```typescript
// lib/video-provider.ts

export interface VideoProvider {
  /**
   * Generate a signed upload URL for direct client uploads
   * @param userId - User ID for tracking
   * @param metadata - Optional metadata (tags, location)
   * @returns Signed URL and upload token
   */
  generateUploadUrl(
    userId: string,
    metadata?: Record<string, any>
  ): Promise<{
    uploadUrl: string;
    uploadToken: string;
    expiresAt: number;
  }>;

  /**
   * Get the CDN URL for a processed video
   * @param providerId - Generic provider-specific ID
   * @param transformations - Optional transformations (quality, format)
   * @returns CDN URL
   */
  getVideoUrl(
    providerId: string,
    transformations?: {
      quality?: 'auto' | 'low' | 'high';
      format?: 'mp4' | 'webm';
      width?: number;
    }
  ): string;

  /**
   * Get thumbnail URL for video
   * @param providerId - Generic provider-specific ID
   * @returns Thumbnail URL
   */
  getThumbnailUrl(providerId: string): string;

  /**
   * Delete video from provider
   * @param providerId - Generic provider-specific ID
   */
  deleteVideo(providerId: string): Promise<void>;

  /**
   * Get video metadata (duration, dimensions, size)
   * @param providerId - Generic provider-specific ID
   */
  getMetadata(providerId: string): Promise<{
    duration: number;
    width: number;
    height: number;
    sizeBytes: number;
  }>;
}
```

**Cloudinary Implementation:**

```typescript
// lib/video-providers/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryVideoProvider implements VideoProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async generateUploadUrl(userId: string, metadata?: Record<string, any>) {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: `aurora/reels/${userId}`,
        ...metadata,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
      uploadToken: signature,
      expiresAt: timestamp + 3600,
    };
  }

  getVideoUrl(providerId: string, transformations = {}) {
    return cloudinary.url(providerId, {
      resource_type: 'video',
      quality: transformations.quality || 'auto',
      format: transformations.format || 'mp4',
      width: transformations.width,
    });
  }

  getThumbnailUrl(providerId: string) {
    return cloudinary.url(providerId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 400, height: 400, crop: 'fill' }],
    });
  }

  async deleteVideo(providerId: string) {
    await cloudinary.uploader.destroy(providerId, { resource_type: 'video' });
  }

  async getMetadata(providerId: string) {
    const result = await cloudinary.api.resource(providerId, {
      resource_type: 'video',
    });
    return {
      duration: result.duration,
      width: result.width,
      height: result.height,
      sizeBytes: result.bytes,
    };
  }
}
```

**Usage in Application:**

```typescript
// convex/reels.ts
import { CloudinaryVideoProvider } from '../lib/video-providers/cloudinary';

const videoProvider = new CloudinaryVideoProvider();

export const generateReelUploadUrl = mutation({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await videoProvider.generateUploadUrl(user._id);
  },
});

export const getReelUrl = query({
  args: { reelId: v.id('reels') },
  handler: async (ctx, { reelId }) => {
    const reel = await ctx.db.get(reelId);
    // Note: We store provider_id (generic), not cloudinary_id
    return videoProvider.getVideoUrl(reel.provider_id, { quality: 'auto' });
  },
});
```

### Streaming Provider Interface

**Design Rationale:** Agora is used initially for live streaming, but this interface allows migration to AWS IVS, Twilio, or custom WebRTC infrastructure.

```typescript
// lib/streaming-provider.ts

export interface StreamingProvider {
  /**
   * Generate access token for streaming
   * @param channelId - Unique channel identifier
   * @param userId - User ID
   * @param role - 'broadcaster' or 'audience'
   * @returns Access token and channel info
   */
  generateToken(
    channelId: string,
    userId: string,
    role: 'broadcaster' | 'audience'
  ): Promise<{
    token: string;
    channelId: string;
    expiresAt: number;
  }>;

  /**
   * Start recording a live stream
   * @param channelId - Channel to record
   */
  startRecording(channelId: string): Promise<{ recordingId: string }>;

  /**
   * Stop recording and get recording URL
   * @param recordingId - Recording ID from startRecording
   */
  stopRecording(recordingId: string): Promise<{ recordingUrl: string }>;

  /**
   * Get current viewer count for a channel
   * @param channelId - Channel ID
   */
  getViewerCount(channelId: string): Promise<number>;

  /**
   * Terminate a stream (emergency/moderation)
   * @param channelId - Channel to terminate
   */
  terminateStream(channelId: string): Promise<void>;
}
```

**Agora Implementation:**

```typescript
// lib/streaming-providers/agora.ts
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export class AgoraStreamingProvider implements StreamingProvider {
  private appId: string;
  private appCertificate: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID!;
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  }

  async generateToken(
    channelId: string,
    userId: string,
    role: 'broadcaster' | 'audience'
  ) {
    const uid = parseInt(userId.slice(-8), 16); // Convert to number
    const agoraRole = role === 'broadcaster' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelId,
      uid,
      agoraRole,
      expiresAt
    );

    return { token, channelId, expiresAt };
  }

  async startRecording(channelId: string) {
    // Call Agora Cloud Recording API
    const response = await fetch(
      `https://api.agora.io/v1/apps/${this.appId}/cloud_recording/resourceid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${this.appId}:${this.appCertificate}`).toString('base64')}`,
        },
        body: JSON.stringify({
          cname: channelId,
          uid: '0',
          clientRequest: {},
        }),
      }
    );
    const data = await response.json();
    return { recordingId: data.resourceId };
  }

  async stopRecording(recordingId: string) {
    // Implementation for stopping recording
    return { recordingUrl: `https://agora-recordings.s3.amazonaws.com/${recordingId}.mp4` };
  }

  async getViewerCount(channelId: string) {
    // Call Agora RTM API to get channel user count
    return 0; // Placeholder
  }

  async terminateStream(channelId: string) {
    // Call Agora API to ban channel
  }
}
```

### React Hooks for Abstraction

```typescript
// hooks/useVideo.ts
import { CloudinaryVideoProvider } from '@/lib/video-providers/cloudinary';

const videoProvider = new CloudinaryVideoProvider();

export function useVideo() {
  const uploadReel = async (file: File, metadata: Record<string, any>) => {
    const { uploadUrl, uploadToken } = await videoProvider.generateUploadUrl(
      'user-id',
      metadata
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', uploadToken);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result.public_id; // This is our provider_id
  };

  return { uploadReel, videoProvider };
}
```

```typescript
// hooks/useLivestream.ts
import { AgoraStreamingProvider } from '@/lib/streaming-providers/agora';
import AgoraRTC from 'agora-rtc-sdk-ng';

const streamingProvider = new AgoraStreamingProvider();

export function useLivestream() {
  const startStream = async (channelId: string) => {
    const { token } = await streamingProvider.generateToken(
      channelId,
      'user-id',
      'broadcaster'
    );

    const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelId, token);

    const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

    await client.publish([localVideoTrack, localAudioTrack]);

    return { client, localVideoTrack, localAudioTrack };
  };

  return { startStream, streamingProvider };
}
```

### Database Schema Strategy

**Critical Design Decision:** Store `provider_id` (generic) instead of `cloudinary_id` or `agora_channel_id`. This allows seamless provider migration.

```typescript
// convex/schema.ts - Reels table
reels: defineTable({
  authorId: v.id('users'),
  provider_id: v.string(), // Generic! Works with any provider
  provider_type: v.union(v.literal('cloudinary'), v.literal('aws'), v.literal('custom')),
  caption: v.string(),
  hashtags: v.array(v.string()),
  location: v.optional(v.object({
    lat: v.number(),
    lng: v.number(),
    name: v.string(),
  })),
  // AI-extracted metadata
  aiMetadata: v.object({
    safetyCategory: v.union(
      v.literal('Harassment'),
      v.literal('Joy'),
      v.literal('Lighting Issue'),
      v.literal('Infrastructure Problem'),
      v.literal('Positive Experience'),
      v.literal('Warning')
    ),
    sentiment: v.number(), // -1 to 1
    detectedObjects: v.array(v.string()),
    transcription: v.optional(v.string()),
  }),
  engagementMetrics: v.object({
    views: v.number(),
    completionRate: v.number(),
    likes: v.number(),
    shares: v.number(),
    comments: v.number(),
  }),
})
```

## Components and Interfaces

### Frontend Components

**Page Components (App Router):**

1. **`app/page.tsx`** - Landing Page
   - Hero section with tagline
   - Live activity feed preview
   - Call-to-action buttons
   - Authentication trigger

2. **`app/(authenticated)/feed/page.tsx`** - Home Feed
   - Infinite scroll post list
   - Real-time updates
   - Filter by life dimension
   - Create post button

3. **`app/(authenticated)/map/page.tsx`** - Safety Map
   - Mapbox GL map with custom style
   - Post markers (color-coded by rating)
   - Marker popups with post previews
   - Route planning interface
   - Heat map overlay toggle

4. **`app/(authenticated)/opportunities/page.tsx`** - Opportunities Board
   - Grid of opportunity cards
   - Credit cost display
   - Unlock functionality
   - Filter by category

5. **`app/(authenticated)/assistant/page.tsx`** - AI Assistant
   - Chat interface
   - Message history
   - Streaming responses
   - Context indicators

6. **`app/(authenticated)/profile/page.tsx`** - User Profile
   - Credit balance
   - Trust score
   - Badges and achievements
   - Activity history
   - Impact metrics

**Shared Components:**

1. **`components/post-card.tsx`**
   - Props: `post: Post, showActions: boolean`
   - Displays post content, author, timestamp
   - Verification button
   - Upvote functionality
   - Life dimension badge

2. **`components/post-create-dialog.tsx`**
   - Modal form for creating posts
   - Life dimension selector
   - Location picker (integrates with Mapbox)
   - Rating input (1-5 stars)
   - Rich text editor
   - File upload component (drag-and-drop)
   - Image/video preview
   - Progress indicator for uploads

3. **`components/credit-display.tsx`**
   - Props: `credits: number, size: 'sm' | 'md' | 'lg'`
   - Animated credit counter
   - Sparkle effect on credit gain

4. **`components/map-marker.tsx`**
   - Custom Mapbox marker component
   - Color-coded by safety rating
   - Click handler for popup

5. **`components/opportunity-card.tsx`**
   - Props: `opportunity: Opportunity, isUnlocked: boolean`
   - Displays opportunity details
   - Unlock button with credit cost
   - Blur effect when locked

6. **`components/trust-score-badge.tsx`**
   - Props: `score: number, showLabel: boolean`
   - Visual representation of trust score
   - Color gradient based on score
   - Tooltip with percentile

### Backend Schema (Convex)

**Tables:**

```typescript
// users table
{
  _id: Id<"users">,
  _creationTime: number,
  workosId: string,           // WorkOS user ID
  email: string,
  name: string,
  profileImage?: string,
  credits: number,            // Default: 25 (signup bonus)
  trustScore: number,         // Default: 0, Max: 1000
  industry?: string,
  location?: string,
  careerGoals?: string,
  onboardingCompleted: boolean,
  isPremium: boolean,         // Aurora Premium subscriber
  premiumExpiresAt?: number,  // Subscription expiration timestamp
  monthlyCreditsEarned: number, // Reset monthly
  monthlyResetDate: number,   // Last reset timestamp
}

// posts table
{
  _id: Id<"posts">,
  _creationTime: number,
  authorId: Id<"users">,
  lifeDimension: "professional" | "social" | "daily" | "travel" | "financial",
  title: string,              // 10-200 chars
  description: string,        // 20-2000 chars
  rating: number,             // 1-5
  location?: {
    name: string,
    coordinates: [number, number], // [lng, lat]
  },
  media?: {
    type: "image" | "video",
    storageId: Id<"_storage">, // Convex file storage ID
    url: string,               // CDN URL for display
    thumbnailUrl?: string,     // For videos
  }[],                         // Array of media attachments
  verificationCount: number,  // Default: 0
  isVerified: boolean,        // True when verificationCount >= 5
  isAnonymous: boolean,
}

// verifications table
{
  _id: Id<"verifications">,
  _creationTime: number,
  postId: Id<"posts">,
  userId: Id<"users">,
}

// opportunities table
{
  _id: Id<"opportunities">,
  _creationTime: number,
  title: string,
  description: string,
  category: "job" | "mentorship" | "resource" | "event" | "funding",
  creditCost: number,
  companyName?: string,
  salaryRange?: string,
  safetyRating?: number,
  externalUrl?: string,
  isActive: boolean,
}

// unlocks table
{
  _id: Id<"unlocks">,
  _creationTime: number,
  userId: Id<"users">,
  opportunityId: Id<"opportunities">,
}

// messages table (AI assistant)
{
  _id: Id<"messages">,
  _creationTime: number,
  userId: Id<"users">,
  role: "user" | "assistant",
  content: string,
}

// transactions table (credit history)
{
  _id: Id<"transactions">,
  _creationTime: number,
  userId: Id<"users">,
  amount: number,             // Positive for earn, negative for spend
  type: "post_created" | "verification" | "opportunity_unlock" | "signup_bonus" | "referral" | "reel_created" | "livestream_completed" | "tip_received" | "boost_post",
  relatedId?: string,         // ID of related post/opportunity
}

// reels table (short-form video content)
{
  _id: Id<"reels">,
  _creationTime: number,
  authorId: Id<"users">,
  provider_id: string,        // Generic provider ID (Cloudinary, AWS, etc.)
  provider_type: "cloudinary" | "aws" | "custom",
  caption: string,            // 0-500 chars
  hashtags: string[],         // Extracted from caption
  location?: {
    name: string,
    coordinates: [number, number], // [lng, lat]
  },
  duration: number,           // seconds (15-90)
  // AI-extracted metadata
  aiMetadata: {
    safetyCategory: "Harassment" | "Joy" | "Lighting Issue" | "Infrastructure Problem" | "Positive Experience" | "Warning",
    sentiment: number,        // -1 to 1
    detectedObjects: string[],
    transcription?: string,   // Voice-to-text
    visualTags: string[],     // "dark street", "crowded area", etc.
  },
  engagementMetrics: {
    views: number,
    completionRate: number,   // 0-1
    likes: number,
    shares: number,
    comments: number,
    avgWatchTime: number,     // seconds
  },
  isAnonymous: boolean,
  moderationStatus: "pending" | "approved" | "flagged" | "rejected",
}

// livestreams table (real-time video broadcasts)
{
  _id: Id<"livestreams">,
  _creationTime: number,
  streamerId: Id<"users">,
  channelId: string,          // Agora channel ID
  title: string,
  description?: string,
  location?: {
    name: string,
    coordinates: [number, number],
  },
  isLive: boolean,
  startedAt: number,
  endedAt?: number,
  privacyLevel: "public" | "followers" | "private",
  // Recording
  recordingId?: string,
  recordingUrl?: string,
  // Engagement
  peakViewers: number,
  totalWatchTime: number,     // seconds across all viewers
  tipsReceived: number,       // Credits
  chatMessageCount: number,
  // Safety
  safetyShieldActivated: boolean,
  safetyShieldTimestamp?: number,
  emergencyRecordingUrl?: string, // Last 30 seconds before shield
  // Moderation
  moderationFlags: string[],
  aiModerationScore: number,  // 0-1 (1 = highly inappropriate)
}

// products table (marketplace services)
{
  _id: Id<"products">,
  _creationTime: number,
  sellerId: Id<"users">,
  title: string,
  description: string,
  category: "coaching" | "consulting" | "freelance" | "mentorship" | "other",
  price: number,              // USD cents
  thumbnailUrl?: string,
  isActive: boolean,
  deliveryTime: string,       // "1 day", "1 week", etc.
  tags: string[],
}

// orders table (marketplace transactions)
{
  _id: Id<"orders">,
  _creationTime: number,
  productId: Id<"products">,
  buyerId: Id<"users">,
  sellerId: Id<"users">,
  amount: number,             // USD cents
  commission: number,         // 15% platform fee
  status: "pending" | "completed" | "cancelled" | "refunded",
  stripePaymentIntentId: string,
  completedAt?: number,
}

// subscriptions table (Aurora Premium)
{
  _id: Id<"subscriptions">,
  _creationTime: number,
  userId: Id<"users">,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: "active" | "cancelled" | "past_due" | "expired",
  currentPeriodStart: number,
  currentPeriodEnd: number,
  cancelAtPeriodEnd: boolean,
}

// analytics_events table (Data Intelligence Lake)
{
  _id: Id<"analytics_events">,
  _creationTime: number,
  eventType: "post_view" | "map_interaction" | "route_taken" | "reel_watched" | "livestream_joined" | "opportunity_viewed" | "search_performed",
  sessionId: string,          // Anonymous session tracking
  anonymizedUserHash: string, // SHA-256 hash of user ID
  // Geographic data
  geoLat?: number,
  geoLng?: number,
  geoAccuracy?: number,
  // Event-specific metadata (JSON)
  metadata: {
    [key: string]: any,       // Flexible schema for different event types
  },
  // Context
  deviceType: "mobile" | "tablet" | "desktop",
  platform: "ios" | "android" | "web",
  timestamp: number,
}

// moderation_queue table (AI-flagged content)
{
  _id: Id<"moderation_queue">,
  _creationTime: number,
  contentType: "post" | "reel" | "livestream" | "comment" | "message",
  contentId: string,
  authorId: Id<"users">,
  flagReason: "toxicity" | "explicit_content" | "violence" | "spam" | "harassment",
  aiConfidenceScore: number,  // 0-1
  status: "pending" | "approved" | "rejected" | "escalated",
  reviewedBy?: Id<"users">,
  reviewedAt?: number,
  reviewNotes?: string,
}

// corporate_safety_index table (B2B intelligence product)
{
  _id: Id<"corporate_safety_index">,
  _creationTime: number,
  companyName: string,
  industry: string,
  // Aggregated scores
  overallSafetyScore: number, // 0-100
  harassmentScore: number,
  inclusionScore: number,
  workLifeBalanceScore: number,
  // Statistics
  totalReviews: number,
  verifiedReviews: number,
  avgTrustScore: number,      // Avg trust score of reviewers
  // Trends
  monthlyTrend: number,       // -1 to 1 (improving/declining)
  lastUpdated: number,
}

// urban_safety_index table (B2B intelligence product)
{
  _id: Id<"urban_safety_index">,
  _creationTime: number,
  // Geographic area (neighborhood level)
  areaName: string,
  city: string,
  country: string,
  boundingBox: {
    north: number,
    south: number,
    east: number,
    west: number,
  },
  // Aggregated scores
  overallSafetyScore: number, // 0-100
  dayScore: number,           // Safety during day
  nightScore: number,         // Safety at night
  // Route data
  totalRoutes: number,
  avgRouteRating: number,
  // Time patterns
  safetyByHour: number[],     // 24-element array
  // Risk factors
  riskFactors: string[],      // ["poor lighting", "isolated", etc.]
  lastUpdated: number,
}
```

**Convex Functions:**

**Queries (read data, reactive):**
- `api.users.getCurrentUser()` - Get authenticated user profile
- `api.posts.getFeed(lifeDimension?, limit?)` - Get paginated feed
- `api.posts.getPostsForMap(bounds, lifeDimension?)` - Get posts within map bounds
- `api.opportunities.list(category?)` - Get available opportunities
- `api.messages.getHistory(limit?)` - Get AI chat history
- `api.users.getProfile(userId)` - Get user profile by ID

**Mutations (write data, transactional):**
- `api.users.completeOnboarding(data)` - Update user profile after onboarding
- `api.posts.create(data)` - Create new post, award credits
- `api.posts.verify(postId)` - Verify post, award credits, update trust score
- `api.opportunities.unlock(opportunityId)` - Unlock opportunity, deduct credits
- `api.messages.send(content)` - Save user message
- `api.files.generateUploadUrl()` - Generate signed URL for file upload
- `api.files.saveFileMetadata(storageId, postId)` - Link uploaded file to post

**Actions (external API calls):**
- `api.ai.chat(message)` - Call Google Gemini API with context
- `api.analytics.trackEvent(event, properties)` - Send event to PostHog

### External Service Interfaces

**WorkOS Integration:**

```typescript
// lib/workos.ts
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function getAuthorizationUrl(redirectUri: string) {
  return workos.userManagement.getAuthorizationUrl({
    provider: 'GoogleOAuth',
    redirectUri,
    clientId: process.env.WORKOS_CLIENT_ID!,
  });
}

export async function authenticateWithCode(code: string) {
  return workos.userManagement.authenticateWithCode({
    code,
    clientId: process.env.WORKOS_CLIENT_ID!,
  });
}
```

**Google AI Integration:**

```typescript
// convex/ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { action } from './_generated/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const chat = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    // Fetch user context
    const user = await ctx.runQuery(api.users.getCurrentUser);
    const recentPosts = await ctx.runQuery(api.posts.getUserRecent, { limit: 5 });
    
    // Build context
    const context = `User profile: ${user.industry}, ${user.location}. Recent activity: ${recentPosts.length} posts.`;
    
    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([context, message]);
    
    return result.response.text();
  },
});
```

**Mapbox Integration:**

```typescript
// components/safety-map.tsx
'use client';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export function SafetyMap({ posts }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl',
      center: [-74.5, 40],
      zoom: 9,
    });
    
    // Add markers for posts
    posts.forEach(post => {
      const color = post.rating >= 4 ? '#22c55e' : post.rating >= 3 ? '#eab308' : '#ef4444';
      
      new mapboxgl.Marker({ color })
        .setLngLat(post.location.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <h3>${post.title}</h3>
          <p>Rating: ${post.rating}/5</p>
        `))
        .addTo(map);
    });
    
    return () => map.remove();
  }, [posts]);
  
  return <div ref={mapContainer} className="w-full h-full" />;
}
```

**File Upload Integration (Convex):**

```typescript
// convex/files.ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    // Generate a signed upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFileMetadata = mutation({
  args: {
    storageId: v.id('_storage'),
    postId: v.id('posts'),
    type: v.union(v.literal('image'), v.literal('video')),
  },
  handler: async (ctx, { storageId, postId, type }) => {
    // Get file URL
    const url = await ctx.storage.getUrl(storageId);
    
    // Update post with media
    const post = await ctx.db.get(postId);
    const media = post?.media || [];
    
    await ctx.db.patch(postId, {
      media: [...media, { type, storageId, url: url! }],
    });
    
    return { success: true, url };
  },
});

// Client-side upload component
// components/file-upload.tsx
'use client';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export function FileUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large');
      return;
    }
    
    setUploading(true);
    
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      // Notify parent component
      onUploadComplete(storageId, file.type.startsWith('video/') ? 'video' : 'image');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="border-2 border-dashed rounded-lg p-8">
      <input
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
      </label>
    </div>
  );
}
```

## AI Metadata Extraction Pipeline

The AI Metadata Extraction Pipeline is a critical component that automatically analyzes user-generated content (Reels, Live Streams, images) to extract safety-relevant information, categorize content, and populate the Data Intelligence Lake. This automation enables Aurora App to scale safety intelligence collection without manual tagging.

### Pipeline Architecture

```
User uploads Reel
  ↓
Cloudinary receives video
  ↓
Cloudinary processes (transcode, thumbnail, optimization)
  ↓
Cloudinary webhook → Convex Action
  ↓
Convex fetches video URL from Cloudinary
  ↓
Convex calls Google Gemini Vision API
  ↓
Gemini analyzes video frames + audio
  ↓
AI extracts:
  - Safety category (Harassment, Joy, Lighting Issue, etc.)
  - Sentiment score (-1 to 1)
  - Detected objects (people, vehicles, buildings)
  - Visual tags (dark street, crowded area, well-lit)
  - Transcription (voice-to-text)
  ↓
Convex saves Reel with aiMetadata to database
  ↓
Reel appears in feed with AI-generated insights
  ↓
Data aggregated into Safety Maps and Intelligence Products
```

### Implementation

**Cloudinary Webhook Handler:**

```typescript
// convex/webhooks.ts
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

export const cloudinaryWebhook = httpAction(async (ctx, request) => {
  const payload = await request.json();
  
  if (payload.notification_type === 'upload') {
    // Video upload completed
    const providerId = payload.public_id;
    const videoUrl = payload.secure_url;
    
    // Trigger AI analysis
    await ctx.runAction(api.ai.analyzeReel, {
      providerId,
      videoUrl,
    });
  }
  
  return new Response('OK', { status: 200 });
});
```

**AI Analysis Action:**

```typescript
// convex/ai.ts
import { action } from './_generated/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v } from 'convex/values';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const analyzeReel = action({
  args: {
    providerId: v.string(),
    videoUrl: v.string(),
  },
  handler: async (ctx, { providerId, videoUrl }) => {
    // Download video frames (sample 1 frame per second)
    const frames = await extractVideoFrames(videoUrl, { fps: 1 });
    
    // Analyze with Gemini Vision
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
      Analyze this video for safety intelligence. Provide:
      1. Safety category: Harassment, Joy, Lighting Issue, Infrastructure Problem, Positive Experience, or Warning
      2. Sentiment score: -1 (very negative) to 1 (very positive)
      3. Detected objects: List visible objects (people, vehicles, buildings, etc.)
      4. Visual tags: Describe the environment (dark street, crowded area, well-lit, isolated, etc.)
      5. Safety concerns: Any visible safety issues
      
      Respond in JSON format.
    `;
    
    const result = await model.generateContent([
      prompt,
      ...frames.map(frame => ({
        inlineData: {
          data: frame.base64,
          mimeType: 'image/jpeg',
        },
      })),
    ]);
    
    const analysis = JSON.parse(result.response.text());
    
    // Extract audio and transcribe
    const audioUrl = await extractAudio(videoUrl);
    const transcription = await transcribeAudio(audioUrl);
    
    // Save to database
    await ctx.runMutation(api.reels.updateMetadata, {
      providerId,
      aiMetadata: {
        safetyCategory: analysis.safetyCategory,
        sentiment: analysis.sentiment,
        detectedObjects: analysis.detectedObjects,
        visualTags: analysis.visualTags,
        transcription,
      },
    });
    
    return { success: true };
  },
});
```

**Content Moderation Integration:**

```typescript
// convex/moderation.ts
import { action } from './_generated/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import vision from '@google-cloud/vision';
import language from '@google-cloud/language';

const visionClient = new vision.ImageAnnotatorClient();
const languageClient = new language.LanguageServiceClient();

export const moderateContent = action({
  args: {
    contentType: v.union(v.literal('text'), v.literal('image'), v.literal('video')),
    content: v.string(), // Text content or URL
  },
  handler: async (ctx, { contentType, content }) => {
    let moderationResult = {
      isFlagged: false,
      flagReason: null,
      confidenceScore: 0,
    };
    
    if (contentType === 'text') {
      // Analyze text toxicity
      const [result] = await languageClient.moderateText({
        document: {
          content,
          type: 'PLAIN_TEXT',
        },
      });
      
      const toxicityScore = result.moderationCategories?.find(
        cat => cat.name === 'Toxic'
      )?.confidence || 0;
      
      if (toxicityScore > 0.7) {
        moderationResult = {
          isFlagged: true,
          flagReason: 'toxicity',
          confidenceScore: toxicityScore,
        };
      }
    } else if (contentType === 'image') {
      // Analyze image for explicit content
      const [result] = await visionClient.safeSearchDetection(content);
      const safeSearch = result.safeSearchAnnotation;
      
      if (
        safeSearch.adult === 'VERY_LIKELY' ||
        safeSearch.violence === 'VERY_LIKELY'
      ) {
        moderationResult = {
          isFlagged: true,
          flagReason: 'explicit_content',
          confidenceScore: 0.9,
        };
      }
    } else if (contentType === 'video') {
      // Sample frames and analyze
      const frames = await extractVideoFrames(content, { fps: 0.5 });
      
      for (const frame of frames) {
        const [result] = await visionClient.safeSearchDetection({
          image: { content: frame.base64 },
        });
        
        if (
          result.safeSearchAnnotation.adult === 'VERY_LIKELY' ||
          result.safeSearchAnnotation.violence === 'VERY_LIKELY'
        ) {
          moderationResult = {
            isFlagged: true,
            flagReason: 'explicit_content',
            confidenceScore: 0.9,
          };
          break;
        }
      }
    }
    
    // If flagged, add to moderation queue
    if (moderationResult.isFlagged) {
      await ctx.runMutation(api.moderation.addToQueue, {
        contentType,
        contentId: content,
        flagReason: moderationResult.flagReason,
        aiConfidenceScore: moderationResult.confidenceScore,
      });
    }
    
    return moderationResult;
  },
});
```

### Benefits

1. **Automatic Safety Categorization**: No manual tagging required
2. **Scalable Intelligence**: Processes thousands of videos per day
3. **Real-time Moderation**: Flags inappropriate content immediately
4. **Rich Metadata**: Enables powerful search and filtering
5. **Data Intelligence**: Feeds B2B/B2G intelligence products
6. **User Experience**: AI-generated insights enhance content discovery

## Data Intelligence Engine

The Data Intelligence Engine is Aurora App's core business asset, transforming raw user interactions into valuable B2B/B2G intelligence products. This system systematically collects, anonymizes, aggregates, and exports safety data for enterprise clients and government agencies.

### Architecture

**Data Collection Layer:**
- Every user interaction logged as an `analytics_event`
- Events include: post views, map interactions, route completions, Reel watches, Live Stream joins
- Geographic coordinates captured with user consent
- Session-based tracking with anonymized user hashes

**Aggregation Layer:**
- Convex Scheduled Functions run daily (3 AM UTC)
- Raw events aggregated into intelligence products
- Corporate Safety Index: Company-level workplace safety scores
- Urban Safety Index: Neighborhood-level geographic safety scores

**Export Layer:**
- RESTful API endpoints for enterprise clients
- Standardized formats: JSON, CSV, Parquet
- Rate limiting and authentication
- Real-time and batch export options

### Data Collection Schema

```typescript
// Example analytics events

// Map interaction event
{
  eventType: "map_interaction",
  sessionId: "abc123",
  anonymizedUserHash: "sha256_hash",
  geoLat: 40.7128,
  geoLng: -74.0060,
  metadata: {
    zoomLevel: 14,
    dwellTime: 45, // seconds
    markersViewed: ["marker_1", "marker_2"],
    interactionType: "marker_click",
  },
  deviceType: "mobile",
  platform: "ios",
  timestamp: 1704067200000,
}

// Route taken event
{
  eventType: "route_taken",
  sessionId: "abc123",
  anonymizedUserHash: "sha256_hash",
  geoLat: 40.7128,
  geoLng: -74.0060,
  metadata: {
    routeId: "route_xyz",
    distance: 5000, // meters
    duration: 1800, // seconds
    timeOfDay: "evening",
    rating: 4,
    tags: ["safe", "well-lit"],
  },
  deviceType: "mobile",
  platform: "ios",
  timestamp: 1704067200000,
}

// Reel watched event
{
  eventType: "reel_watched",
  sessionId: "abc123",
  anonymizedUserHash: "sha256_hash",
  metadata: {
    reelId: "reel_abc",
    watchTime: 25, // seconds
    completionRate: 0.83,
    safetyCategory: "Lighting Issue",
    location: "Manhattan, NY",
  },
  deviceType: "mobile",
  platform: "ios",
  timestamp: 1704067200000,
}
```

### Aggregation Logic

**Corporate Safety Index Calculation:**

```typescript
// convex/scheduled/aggregateCorporateSafety.ts
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.daily(
  'aggregate-corporate-safety',
  { hourUTC: 3, minuteUTC: 0 },
  internal.intelligence.aggregateCorporateSafety
);

export default crons;

// convex/intelligence.ts
export const aggregateCorporateSafety = internalMutation({
  handler: async (ctx) => {
    // Get all workplace posts from last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const posts = await ctx.db
      .query('posts')
      .filter(q => 
        q.and(
          q.eq(q.field('lifeDimension'), 'professional'),
          q.gte(q.field('_creationTime'), thirtyDaysAgo)
        )
      )
      .collect();
    
    // Group by company
    const companiesMap = new Map();
    
    for (const post of posts) {
      const company = extractCompanyName(post.title, post.description);
      if (!company) continue;
      
      if (!companiesMap.has(company)) {
        companiesMap.set(company, {
          ratings: [],
          harassmentScores: [],
          inclusionScores: [],
          trustScores: [],
        });
      }
      
      const data = companiesMap.get(company);
      data.ratings.push(post.rating);
      
      // Extract specific scores from post metadata
      if (post.metadata?.harassmentScore) {
        data.harassmentScores.push(post.metadata.harassmentScore);
      }
      if (post.metadata?.inclusionScore) {
        data.inclusionScores.push(post.metadata.inclusionScore);
      }
      
      // Get author trust score
      const author = await ctx.db.get(post.authorId);
      if (author) {
        data.trustScores.push(author.trustScore);
      }
    }
    
    // Calculate and save indexes
    for (const [companyName, data] of companiesMap) {
      const overallSafetyScore = calculateWeightedAverage(data.ratings);
      const harassmentScore = calculateAverage(data.harassmentScores);
      const inclusionScore = calculateAverage(data.inclusionScores);
      const avgTrustScore = calculateAverage(data.trustScores);
      
      // Check for existing index
      const existing = await ctx.db
        .query('corporate_safety_index')
        .filter(q => q.eq(q.field('companyName'), companyName))
        .first();
      
      if (existing) {
        // Calculate trend
        const monthlyTrend = overallSafetyScore - existing.overallSafetyScore;
        
        await ctx.db.patch(existing._id, {
          overallSafetyScore,
          harassmentScore,
          inclusionScore,
          totalReviews: data.ratings.length,
          avgTrustScore,
          monthlyTrend,
          lastUpdated: Date.now(),
        });
      } else {
        await ctx.db.insert('corporate_safety_index', {
          companyName,
          industry: inferIndustry(companyName),
          overallSafetyScore,
          harassmentScore,
          inclusionScore,
          workLifeBalanceScore: 0, // TODO: Extract from posts
          totalReviews: data.ratings.length,
          verifiedReviews: data.ratings.filter((_, i) => data.trustScores[i] > 500).length,
          avgTrustScore,
          monthlyTrend: 0,
          lastUpdated: Date.now(),
        });
      }
    }
  },
});
```

**Urban Safety Index Calculation:**

```typescript
// convex/intelligence.ts
export const aggregateUrbanSafety = internalMutation({
  handler: async (ctx) => {
    // Define geographic grid (0.01 degree squares ≈ 1km)
    const grid = generateGeographicGrid({
      north: 40.9,
      south: 40.5,
      east: -73.7,
      west: -74.3,
      resolution: 0.01,
    });
    
    for (const cell of grid) {
      // Get all routes and posts in this cell
      const routes = await ctx.db
        .query('routes')
        .filter(q =>
          q.and(
            q.gte(q.field('startLocation.lat'), cell.south),
            q.lte(q.field('startLocation.lat'), cell.north),
            q.gte(q.field('startLocation.lng'), cell.west),
            q.lte(q.field('startLocation.lng'), cell.east)
          )
        )
        .collect();
      
      if (routes.length === 0) continue;
      
      // Calculate safety scores
      const dayRoutes = routes.filter(r => isDaytime(r._creationTime));
      const nightRoutes = routes.filter(r => !isDaytime(r._creationTime));
      
      const dayScore = calculateAverage(dayRoutes.map(r => r.rating)) * 20; // Scale to 0-100
      const nightScore = calculateAverage(nightRoutes.map(r => r.rating)) * 20;
      const overallScore = (dayScore + nightScore) / 2;
      
      // Extract risk factors from route tags
      const allTags = routes.flatMap(r => r.tags);
      const riskFactors = allTags.filter(tag =>
        ['dark', 'isolated', 'unsafe', 'avoid'].some(risk => tag.includes(risk))
      );
      
      // Calculate safety by hour
      const safetyByHour = Array(24).fill(0);
      for (const route of routes) {
        const hour = new Date(route._creationTime).getHours();
        safetyByHour[hour] += route.rating;
      }
      
      // Save index
      await ctx.db.insert('urban_safety_index', {
        areaName: await geocodeAreaName(cell.center),
        city: 'New York',
        country: 'USA',
        boundingBox: cell,
        overallSafetyScore: overallScore,
        dayScore,
        nightScore,
        totalRoutes: routes.length,
        avgRouteRating: calculateAverage(routes.map(r => r.rating)),
        safetyByHour,
        riskFactors: [...new Set(riskFactors)],
        lastUpdated: Date.now(),
      });
    }
  },
});
```

### B2B API Endpoints

```typescript
// convex/api/intelligence.ts
import { httpAction } from './_generated/server';

export const getCorporateSafetyIndex = httpAction(async (ctx, request) => {
  // Authenticate API key
  const apiKey = request.headers.get('X-API-Key');
  if (!isValidApiKey(apiKey)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Parse query parameters
  const url = new URL(request.url);
  const companyName = url.searchParams.get('company');
  const industry = url.searchParams.get('industry');
  const format = url.searchParams.get('format') || 'json';
  
  // Query data
  let query = ctx.db.query('corporate_safety_index');
  
  if (companyName) {
    query = query.filter(q => q.eq(q.field('companyName'), companyName));
  }
  if (industry) {
    query = query.filter(q => q.eq(q.field('industry'), industry));
  }
  
  const results = await query.collect();
  
  // Format response
  if (format === 'csv') {
    const csv = convertToCSV(results);
    return new Response(csv, {
      headers: { 'Content-Type': 'text/csv' },
    });
  }
  
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export const getUrbanSafetyIndex = httpAction(async (ctx, request) => {
  // Similar implementation for urban safety data
});
```

### Privacy & Compliance

**Anonymization Strategy:**
- User IDs hashed with SHA-256 before storage
- No PII stored in analytics_events table
- Geographic coordinates rounded to 3 decimal places (≈100m accuracy)
- Session IDs rotated every 24 hours
- Opt-out mechanism removes user from all future aggregations

**Data Retention:**
- Raw events deleted after 24 months
- Aggregated indexes retained indefinitely
- User can request data deletion (GDPR compliance)

**Transparency:**
- Users see how their data contributes to safety intelligence
- Monthly transparency reports published
- Clear opt-in/opt-out controls in settings

## Data Models

### User Model

```typescript
interface User {
  _id: string;
  workosId: string;
  email: string;
  name: string;
  profileImage?: string;
  credits: number;
  trustScore: number;
  industry?: string;
  location?: string;
  careerGoals?: string;
  onboardingCompleted: boolean;
  createdAt: number;
}
```

**Business Rules:**
- New users start with 25 credits (signup bonus)
- Trust score ranges from 0-1000
- Trust score increases by 1 per verification
- Credits are earned through contributions (10 for post, 5 for verification)
- Credits are spent to unlock opportunities

### Post Model

```typescript
interface Post {
  _id: string;
  authorId: string;
  lifeDimension: 'professional' | 'social' | 'daily' | 'travel' | 'financial';
  title: string;
  description: string;
  rating: number; // 1-5
  location?: {
    name: string;
    coordinates: [number, number]; // [lng, lat]
  };
  media?: Array<{
    type: 'image' | 'video';
    storageId: string;
    url: string;
    thumbnailUrl?: string;
  }>;
  verificationCount: number;
  isVerified: boolean;
  isAnonymous: boolean;
  createdAt: number;
}
```

**Business Rules:**
- Posts become "verified" when verificationCount >= 5
- Users cannot verify their own posts
- Each user can only verify a post once
- Location is optional but required for map display
- Rating determines marker color on map (5-4: green, 3: yellow, 2-1: red)
- Media attachments are optional, max 5 per post
- Images: max 10MB, formats: JPEG, PNG, WebP
- Videos: max 50MB, formats: MP4, MOV
- Files stored in Convex file storage with CDN URLs

### Opportunity Model

```typescript
interface Opportunity {
  _id: string;
  title: string;
  description: string;
  category: 'job' | 'mentorship' | 'resource' | 'event' | 'funding';
  creditCost: number;
  companyName?: string;
  salaryRange?: string;
  safetyRating?: number;
  externalUrl?: string;
  isActive: boolean;
  createdAt: number;
}
```

**Business Rules:**
- Credit costs range from 50-500 based on opportunity value
- Users can only unlock each opportunity once
- Unlocking deducts credits immediately
- Inactive opportunities are hidden from listings

## Error Handling

### Client-Side Error Handling

**Network Errors:**
- Display toast notification with retry button
- Implement exponential backoff for retries
- Cache failed mutations for offline support

**Validation Errors:**
- Show inline error messages on form fields
- Prevent form submission until validation passes
- Provide helpful error messages (e.g., "Title must be at least 10 characters")

**Authentication Errors:**
- Redirect to login page with return URL
- Clear invalid session tokens
- Display user-friendly error message

**Example Error Boundary:**

```typescript
// components/error-boundary.tsx
'use client';
import { useEffect } from 'react';

export function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  );
}
```

### Server-Side Error Handling

**Convex Function Errors:**
- Wrap mutations in try-catch blocks
- Return structured error objects
- Log errors for debugging

**External API Errors:**
- Implement circuit breaker pattern for Google AI
- Fallback to cached responses when possible
- Rate limit protection (100 req/min per user)

**Example Mutation Error Handling:**

```typescript
// convex/posts.ts
export const create = mutation({
  args: { title: v.string(), description: v.string(), rating: v.number() },
  handler: async (ctx, args) => {
    try {
      // Validate
      if (args.title.length < 10 || args.title.length > 200) {
        throw new Error('Title must be 10-200 characters');
      }
      
      // Get user
      const user = await ctx.db.query('users').first();
      if (!user) throw new Error('User not found');
      
      // Create post
      const postId = await ctx.db.insert('posts', {
        ...args,
        authorId: user._id,
        verificationCount: 0,
        isVerified: false,
      });
      
      // Award credits
      await ctx.db.patch(user._id, { credits: user.credits + 10 });
      
      return { success: true, postId };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  },
});
```

## Testing Strategy

### Unit Testing

**Frontend Components:**
- Use Vitest + React Testing Library
- Test component rendering
- Test user interactions
- Mock Convex hooks

**Example:**
```typescript
// components/__tests__/post-card.test.tsx
import { render, screen } from '@testing-library/react';
import { PostCard } from '../post-card';

test('renders post title and description', () => {
  const post = {
    title: 'Great workplace',
    description: 'Very safe and supportive environment',
    rating: 5,
  };
  
  render(<PostCard post={post} />);
  expect(screen.getByText('Great workplace')).toBeInTheDocument();
});
```

**Convex Functions:**
- Use Convex testing utilities
- Test queries return correct data
- Test mutations update database correctly
- Test validation logic

### Integration Testing

**API Integration:**
- Test WorkOS authentication flow
- Test Google AI responses
- Test Mapbox marker rendering
- Mock external services in tests

**Database Integration:**
- Test Convex real-time updates
- Test transaction consistency
- Test query performance

### End-to-End Testing

**Critical User Flows:**
1. Sign up → Complete onboarding → Create first post → Earn credits
2. View feed → Verify post → See trust score increase
3. Browse opportunities → Unlock opportunity → View details
4. Open map → View markers → Click marker → See post details
5. Chat with AI → Receive personalized response

**Tools:**
- Playwright for E2E tests
- Run against staging environment
- Test on multiple browsers

### Performance Testing

**Metrics to Track:**
- Time to First Byte (TTFB) < 200ms
- First Contentful Paint (FCP) < 1s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3s

**Load Testing:**
- Simulate 100 concurrent users
- Test real-time update performance
- Monitor Convex function execution time

### Manual Testing Checklist

**Before Deployment:**
- [ ] Test authentication flow (Google + Microsoft)
- [ ] Create post with and without location
- [ ] Verify post and check credit increase
- [ ] Unlock opportunity and check credit decrease
- [ ] Test AI assistant with various queries
- [ ] Test map markers and popups
- [ ] Test responsive design on mobile
- [ ] Test real-time updates (open two browsers)
- [ ] Check PostHog events are firing
- [ ] Verify environment variables are set correctly

## Security Considerations

**Authentication:**
- Use WorkOS for secure OAuth flow
- Store session tokens in HTTP-only cookies
- Implement CSRF protection
- Validate user session on every request

**Data Protection:**
- Encrypt sensitive data at rest (Convex handles this)
- Use HTTPS for all connections (Cloudflare enforces)
- Sanitize user input to prevent XSS
- Implement rate limiting (100 req/min per user)

**API Security:**
- Store API keys in environment variables
- Never expose keys in client-side code
- Use server-side actions for external API calls
- Implement request signing for Convex functions

**Privacy:**
- Allow anonymous posting (hide author identity)
- Don't expose user email addresses publicly
- Implement data deletion on user request
- GDPR compliance for EU users

## Monetization Infrastructure

Aurora App implements multiple revenue streams to achieve financial sustainability while maintaining the mission of empowering women. The monetization strategy balances user value with business viability.

### Revenue Streams

1. **Aurora Premium Subscription** ($9.99/month)
2. **Marketplace Commissions** (15% of service transactions)
3. **Affiliate Partnerships** (Safety products, travel services)
4. **B2B Data Intelligence** (Corporate & Urban Safety Indexes)
5. **Advertising** (Non-intrusive, free-tier only)
6. **Post Boosting** (Credit-based visibility enhancement)

### Aurora Premium Implementation

**Stripe Integration:**

```typescript
// convex/subscriptions.ts
import { action } from './_generated/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createSubscription = action({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.runQuery(api.users.get, { userId });
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    // Save to database
    await ctx.runMutation(api.subscriptions.create, {
      userId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      status: 'active',
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
    });
    
    // Update user
    await ctx.runMutation(api.users.setPremium, {
      userId,
      isPremium: true,
      premiumExpiresAt: subscription.current_period_end * 1000,
    });
    
    return {
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    };
  },
});

export const handleWebhook = httpAction(async (ctx, request) => {
  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await ctx.runMutation(api.subscriptions.update, {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end * 1000,
      });
      break;
      
    case 'customer.subscription.deleted':
      await ctx.runMutation(api.subscriptions.cancel, {
        stripeSubscriptionId: event.data.object.id,
      });
      break;
  }
  
  return new Response('OK', { status: 200 });
});
```

**Premium Features:**

```typescript
// lib/premium.ts
export const PREMIUM_FEATURES = {
  adFree: true,
  unlimitedAI: true, // No rate limiting on AI assistant
  prioritySupport: true,
  exclusiveBadge: true,
  advancedAnalytics: true, // Personal safety analytics dashboard
  exportData: true, // Export all personal data
  customThemes: true,
};

export function isPremiumFeatureEnabled(user: User, feature: keyof typeof PREMIUM_FEATURES) {
  if (!user.isPremium) return false;
  if (user.premiumExpiresAt && user.premiumExpiresAt < Date.now()) return false;
  return PREMIUM_FEATURES[feature];
}
```

### Marketplace Implementation

**Service Listing:**

```typescript
// convex/marketplace.ts
export const createProduct = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal('coaching'),
      v.literal('consulting'),
      v.literal('freelance'),
      v.literal('mentorship'),
      v.literal('other')
    ),
    price: v.number(), // USD cents
    deliveryTime: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const productId = await ctx.db.insert('products', {
      ...args,
      sellerId: user._id,
      isActive: true,
      _creationTime: Date.now(),
    });
    
    return productId;
  },
});

export const purchaseProduct = mutation({
  args: {
    productId: v.id('products'),
    paymentIntentId: v.string(),
  },
  handler: async (ctx, { productId, paymentIntentId }) => {
    const user = await getCurrentUser(ctx);
    const product = await ctx.db.get(productId);
    
    if (!product) throw new Error('Product not found');
    
    // Calculate commission (15%)
    const commission = Math.floor(product.price * 0.15);
    const sellerAmount = product.price - commission;
    
    // Create order
    const orderId = await ctx.db.insert('orders', {
      productId,
      buyerId: user._id,
      sellerId: product.sellerId,
      amount: product.price,
      commission,
      status: 'pending',
      stripePaymentIntentId: paymentIntentId,
      _creationTime: Date.now(),
    });
    
    // Transfer funds to seller (via Stripe Connect)
    await ctx.scheduler.runAfter(0, api.payments.transferToSeller, {
      orderId,
      amount: sellerAmount,
    });
    
    return orderId;
  },
});
```

**Stripe Connect for Sellers:**

```typescript
// convex/payments.ts
export const transferToSeller = internalAction({
  args: { orderId: v.id('orders'), amount: v.number() },
  handler: async (ctx, { orderId, amount }) => {
    const order = await ctx.runQuery(api.orders.get, { orderId });
    const seller = await ctx.runQuery(api.users.get, { userId: order.sellerId });
    
    if (!seller.stripeConnectAccountId) {
      throw new Error('Seller has not connected Stripe account');
    }
    
    // Create transfer
    await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination: seller.stripeConnectAccountId,
      transfer_group: orderId,
    });
    
    // Update order status
    await ctx.runMutation(api.orders.complete, { orderId });
  },
});
```

### Affiliate Tracking

```typescript
// convex/affiliates.ts
export const trackAffiliateClick = mutation({
  args: {
    productUrl: v.string(),
    affiliateCode: v.string(),
  },
  handler: async (ctx, { productUrl, affiliateCode }) => {
    const user = await getCurrentUser(ctx);
    
    // Log click event
    await ctx.db.insert('affiliate_clicks', {
      userId: user._id,
      productUrl,
      affiliateCode,
      timestamp: Date.now(),
    });
    
    // Generate tracking URL
    return `${productUrl}?ref=${affiliateCode}&uid=${user._id}`;
  },
});

export const recordAffiliatePurchase = action({
  args: {
    userId: v.id('users'),
    affiliateCode: v.string(),
    purchaseAmount: v.number(),
    commission: v.number(),
  },
  handler: async (ctx, args) => {
    // Award 10% of commission to referring user as Credits
    const creditReward = Math.floor(args.commission * 0.1);
    
    await ctx.runMutation(api.users.addCredits, {
      userId: args.userId,
      amount: creditReward,
      type: 'affiliate_commission',
    });
    
    // Log transaction
    await ctx.runMutation(api.transactions.create, {
      userId: args.userId,
      amount: creditReward,
      type: 'affiliate_commission',
      relatedId: args.affiliateCode,
    });
  },
});
```

### Post Boosting

```typescript
// convex/posts.ts
export const boostPost = mutation({
  args: {
    postId: v.id('posts'),
    duration: v.number(), // hours
  },
  handler: async (ctx, { postId, duration }) => {
    const user = await getCurrentUser(ctx);
    const cost = 50; // 50 credits per boost
    
    if (user.credits < cost) {
      throw new Error('Insufficient credits');
    }
    
    // Deduct credits
    await ctx.db.patch(user._id, {
      credits: user.credits - cost,
    });
    
    // Log transaction
    await ctx.db.insert('transactions', {
      userId: user._id,
      amount: -cost,
      type: 'boost_post',
      relatedId: postId,
      _creationTime: Date.now(),
    });
    
    // Set boost expiration
    const expiresAt = Date.now() + duration * 60 * 60 * 1000;
    await ctx.db.patch(postId, {
      isBoosted: true,
      boostExpiresAt: expiresAt,
    });
    
    return { success: true, expiresAt };
  },
});
```

### Advertising (Free Tier)

```typescript
// components/ad-banner.tsx
'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function AdBanner() {
  const user = useQuery(api.users.getCurrentUser);
  
  // Don't show ads to premium users
  if (user?.isPremium) return null;
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg my-4">
      <p className="text-xs text-gray-500 mb-2">Sponsored</p>
      <div className="flex items-center gap-4">
        <img src="/ad-placeholder.jpg" alt="Ad" className="w-20 h-20" />
        <div>
          <h4 className="font-semibold">Safety Product Name</h4>
          <p className="text-sm text-gray-600">Keep yourself safe with...</p>
          <a href="#" className="text-blue-600 text-sm">Learn more →</a>
        </div>
      </div>
    </div>
  );
}
```

### Revenue Tracking

```typescript
// convex/analytics/revenue.ts
export const trackRevenue = internalMutation({
  args: {
    source: v.union(
      v.literal('subscription'),
      v.literal('marketplace'),
      v.literal('affiliate'),
      v.literal('b2b_api'),
      v.literal('advertising')
    ),
    amount: v.number(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('revenue_events', {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getMonthlyRevenue = query({
  handler: async (ctx) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const events = await ctx.db
      .query('revenue_events')
      .filter(q => q.gte(q.field('timestamp'), startOfMonth.getTime()))
      .collect();
    
    const bySource = events.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + event.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: events.reduce((sum, e) => sum + e.amount, 0),
      bySource,
    };
  },
});
```

## Deployment Strategy

**Environment Setup:**

```bash
# .env.local (not committed to git)
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
CONVEX_DEPLOY_KEY=prod:...
GOOGLE_AI_API_KEY=AIzaSyDJGQjQ7r7N7iOw5hhbT48JZkfk199NKt8
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFsdW5hbyIsImEiOiJjbGNnZTBrd2EyYmRjM29uMndzZDZ2cWRxIn0.7ffmNPdwDu1nU-PkgFgEsw
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Deployment Steps:**

1. **Deploy Convex Backend:**
```bash
npx convex deploy --prod
```

2. **Deploy Next.js to Cloudflare Pages:**
```bash
npm run build
npx wrangler pages deploy .next
```

3. **Configure Environment Variables:**
- Add all secrets to Cloudflare Pages settings
- Add all secrets to Convex dashboard

4. **Verify Deployment:**
- Test authentication flow
- Test real-time updates
- Check analytics tracking
- Monitor error logs

**Rollback Strategy:**
- Keep previous Convex deployment available
- Cloudflare Pages maintains deployment history
- Can rollback with one click

**Monitoring:**
- PostHog for user analytics
- Convex dashboard for function logs
- Cloudflare analytics for traffic
- Set up alerts for error rates

## Performance Optimization & Reliability

Aurora App targets world-class performance metrics to ensure a fast, reliable experience for all users, especially in critical safety scenarios.

### Performance Targets

- **Time to Interactive (TTI)**: < 2 seconds on 4G mobile
- **Lighthouse Score**: 95+ on mobile and desktop
- **First Contentful Paint (FCP)**: < 800ms
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Uptime**: 99.9% monthly

### Frontend Optimization

**Image Optimization:**

```typescript
// components/optimized-image.tsx
'use client';
import Image from 'next/image';
import { useState } from 'react';

export function OptimizedImage({ src, alt, ...props }) {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // LQIP
        onLoadingComplete={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
}
```

**Code Splitting:**

```typescript
// app/(authenticated)/map/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy map component
const SafetyMap = dynamic(() => import('@/components/safety-map'), {
  loading: () => <MapSkeleton />,
  ssr: false, // Don't render on server
});

export default function MapPage() {
  return <SafetyMap />;
}
```

**Virtual Scrolling:**

```typescript
// components/virtual-feed.tsx
'use client';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualFeed({ posts }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated post height
    overscan: 5, // Render 5 extra items
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PostCard post={posts[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**React Performance:**

```typescript
// components/post-card.tsx
import { memo } from 'react';

export const PostCard = memo(function PostCard({ post }) {
  // Expensive rendering logic
  return <div>...</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.post._id === nextProps.post._id &&
         prevProps.post.verificationCount === nextProps.post.verificationCount;
});
```

### Backend Optimization

**Database Indexing:**

```typescript
// convex/schema.ts
export default defineSchema({
  posts: defineTable({
    // ... fields
  })
    .index('by_author', ['authorId'])
    .index('by_dimension', ['lifeDimension', '_creationTime'])
    .index('by_location', ['location.coordinates'])
    .index('by_verification', ['verificationCount'])
    .index('by_creation', ['_creationTime']),
  
  routes: defineTable({
    // ... fields
  })
    .index('by_creator', ['creatorId'])
    .index('by_sharing', ['sharingLevel', '_creationTime'])
    .index('by_location', ['startLocation.lat', 'startLocation.lng'])
    .index('by_rating', ['rating', '_creationTime']),
});
```

**Query Optimization:**

```typescript
// convex/posts.ts
export const getFeed = query({
  args: {
    lifeDimension: v.optional(v.string()),
    cursor: v.optional(v.number()),
    limit: v.number(),
  },
  handler: async (ctx, { lifeDimension, cursor, limit }) => {
    let query = ctx.db.query('posts');
    
    // Use index for filtering
    if (lifeDimension) {
      query = query.withIndex('by_dimension', q =>
        q.eq('lifeDimension', lifeDimension)
      );
    } else {
      query = query.withIndex('by_creation');
    }
    
    // Pagination
    if (cursor) {
      query = query.filter(q => q.lt(q.field('_creationTime'), cursor));
    }
    
    const posts = await query
      .order('desc')
      .take(limit);
    
    return {
      posts,
      nextCursor: posts.length === limit ? posts[posts.length - 1]._creationTime : null,
    };
  },
});
```

**Caching Strategy:**

```typescript
// convex/ai.ts
const responseCache = new Map<string, { response: string; timestamp: number }>();

export const chat = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    // Check cache (1 hour TTL)
    const cacheKey = `${message.toLowerCase().trim()}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return cached.response;
    }
    
    // Call AI
    const response = await callGeminiAPI(message);
    
    // Cache response
    responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });
    
    return response;
  },
});
```

### Network Optimization

**CDN Configuration:**

```typescript
// next.config.ts
export default {
  images: {
    domains: ['res.cloudinary.com', 'storage.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true, // Brotli compression
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

**Service Worker for Offline:**

```javascript
// public/sw.js
const CACHE_NAME = 'aurora-v1';
const OFFLINE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/offline');
      });
    })
  );
});
```

**Request Batching:**

```typescript
// lib/batch-requests.ts
class RequestBatcher {
  private queue: Array<{ id: string; resolve: Function }> = [];
  private timeout: NodeJS.Timeout | null = null;
  
  add(id: string): Promise<any> {
    return new Promise(resolve => {
      this.queue.push({ id, resolve });
      
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), 50); // 50ms batch window
      }
    });
  }
  
  private async flush() {
    const batch = this.queue.splice(0);
    this.timeout = null;
    
    // Fetch all IDs in one request
    const results = await fetchBatch(batch.map(item => item.id));
    
    // Resolve all promises
    batch.forEach((item, index) => {
      item.resolve(results[index]);
    });
  }
}
```

### Monitoring & Alerting

**Error Tracking with Sentry:**

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.level === 'warning') return null;
    return event;
  },
});

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}
```

**Performance Monitoring:**

```typescript
// lib/performance-monitor.ts
export class PerformanceMonitor {
  static measurePageLoad() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      // Send to analytics
      trackEvent('page_load', {
        duration: pageLoadTime,
        ttfb: perfData.responseStart - perfData.navigationStart,
        domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
      });
    });
  }
  
  static measureCoreWebVitals() {
    // LCP
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      trackEvent('lcp', { value: lastEntry.renderTime || lastEntry.loadTime });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // FID
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        trackEvent('fid', { value: entry.processingStart - entry.startTime });
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // CLS
    let clsValue = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      trackEvent('cls', { value: clsValue });
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
```

**Automated Performance Testing:**

```typescript
// tests/performance.test.ts
import { test, expect } from '@playwright/test';

test('homepage loads within 2 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(2000);
});

test('feed scrolling is smooth', async ({ page }) => {
  await page.goto('/feed');
  
  // Measure FPS during scroll
  const fps = await page.evaluate(() => {
    return new Promise(resolve => {
      let frameCount = 0;
      const startTime = performance.now();
      
      function countFrame() {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frameCount);
        }
      }
      
      requestAnimationFrame(countFrame);
      window.scrollBy(0, 1000);
    });
  });
  
  expect(fps).toBeGreaterThan(55); // Target 60 FPS
});
```

### Reliability & Uptime

**Health Checks:**

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    ai: await checkAI(),
    storage: await checkStorage(),
  };
  
  const isHealthy = Object.values(checks).every(check => check.status === 'ok');
  
  return Response.json(
    { status: isHealthy ? 'healthy' : 'degraded', checks },
    { status: isHealthy ? 200 : 503 }
  );
}

async function checkDatabase() {
  try {
    await convex.query(api.health.ping);
    return { status: 'ok', latency: 50 };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

**Graceful Degradation:**

```typescript
// components/feed-with-fallback.tsx
'use client';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function FeedWithFallback() {
  const posts = useQuery(api.posts.getFeed, { limit: 20 });
  
  // Loading state
  if (posts === undefined) {
    return <FeedSkeleton />;
  }
  
  // Error state - show cached data
  if (posts === null) {
    const cachedPosts = getCachedPosts();
    return (
      <div>
        <Banner type="warning">
          Showing cached content. Reconnecting...
        </Banner>
        <Feed posts={cachedPosts} />
      </div>
    );
  }
  
  return <Feed posts={posts} />;
}
```

**Rate Limiting:**

```typescript
// convex/rateLimit.ts
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit || userLimit.resetAt < now) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}

// Usage in mutation
export const createPost = mutation({
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // 100 posts per hour
    if (!checkRateLimit(user._id, 100, 3600000)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Create post...
  },
});
```


## Aurora Routes Feature Design

### Overview

Aurora Routes transforms Aurora App into a daily-use platform by enabling women to track, evaluate, and share their movement journeys (walking, running, cycling, commuting). This feature combines Strava-like activity tracking with Aurora's safety intelligence and community trust system, creating a powerful tool for everyday movement that's specifically designed for women's safety and empowerment.

### Architecture

#### Route Tracking System
- **GPS Tracking Engine**: Real-time location tracking using browser Geolocation API
- **Offline Support**: IndexedDB for local route storage when offline, with background sync
- **Route Optimization**: Mapbox Directions API for turn-by-turn navigation
- **Privacy Layer**: Coordinate fuzzing for anonymous routes (±100m accuracy)

#### Data Flow
```
User starts route → GPS tracking begins → Coordinates stored locally
→ Route completed → User adds evaluation (tags, rating, journal)
→ User chooses sharing preference → Route saved to Convex
→ If shared: Route appears in community feed with privacy filters applied
→ Other users discover route → Complete route → Verify and rate
→ Original creator earns credits
```

### Components and Interfaces

#### 1. Route Tracking Interface

**Active Tracking View** (`/routes/track`)
- Live map showing current position and route path
- Real-time stats: distance, duration, pace, elevation
- Pause/Resume/Stop controls
- Emergency button (quick access to emergency contacts)
- Minimal UI to avoid distraction during movement

**Route Completion Dialog**
- Route summary: total distance, duration, average pace
- Tag selector: "safe", "inspiring", "challenging", "healing", "accessible", "beautiful"
- Star rating (1-5) for overall experience
- Optional journal entry (text or voice note)
- Sharing options: Private / Anonymous / Public with name
- Save button (awards 15 credits if shared publicly)

#### 2. Route Discovery Interface

**Routes Feed** (`/routes`)
- Grid/List view of community routes
- Filter sidebar:
  - Distance range slider
  - Route type (walking/running/cycling/commuting)
  - Tags (multi-select)
  - Minimum safety rating
  - Location radius
- Route cards showing:
  - Route preview map thumbnail
  - Distance, duration, elevation gain
  - Safety rating (aggregate from all completions)
  - Popular tags
  - Creator info (if not anonymous)
  - Number of completions

**Route Detail View** (`/routes/[id]`)
- Full-screen interactive map with route path
- Route statistics and metadata
- Creator's journal entry and voice note player
- Community feedback section:
  - Aggregate ratings
  - Recent completions with user ratings
  - Safety tips from community
- "Start This Route" button (launches navigation)
- "Save to My Routes" button

#### 3. Personal Routes Dashboard

**My Routes** (`/routes/my-routes`)
- Calendar view showing routes by date
- Statistics dashboard:
  - Total distance this week/month/year
  - Total routes completed
  - Credits earned from routes
  - Most used tags
- Route history list with filters
- Export data option (GPX format)

#### 4. Navigation Interface

**Active Navigation** (`/routes/navigate/[id]`)
- Turn-by-turn directions overlay on map
- Current position marker
- Distance to next turn
- Estimated time to destination
- "I feel unsafe" button (suggests nearby safe spaces)
- Background tracking continues if app is minimized

### Data Models

#### Route Schema
```typescript
routes: defineTable({
  creatorId: v.id("users"),
  title: v.string(), // Auto-generated or user-provided
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
    name: v.string(), // Geocoded address
  }),
  endLocation: v.object({
    lat: v.number(),
    lng: v.number(),
    name: v.string(),
  }),
  
  // Evaluation
  tags: v.array(v.string()), // ["safe", "inspiring", etc.]
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
  totalRating: v.number(), // Sum of all ratings
  verificationCount: v.number(),
  
  // Credits
  creditsEarned: v.number(),
})
.index("by_creator", ["creatorId"])
.index("by_sharing", ["sharingLevel"])
.index("by_location", ["startLocation.lat", "startLocation.lng"])
.index("by_rating", ["rating"])
```

#### Route Completion Schema
```typescript
routeCompletions: defineTable({
  routeId: v.id("routes"),
  userId: v.id("users"),
  completedAt: v.number(),
  userRating: v.number(), // 1-5
  userTags: v.array(v.string()),
  feedback: v.optional(v.string()),
  verified: v.boolean(), // Did they actually complete it?
})
.index("by_route", ["routeId"])
.index("by_user", ["userId"])
```

### Error Handling

#### GPS Tracking Errors
- **Permission Denied**: Show modal explaining why GPS is needed, link to browser settings
- **Position Unavailable**: Suggest moving to open area, offer offline mode
- **Timeout**: Retry with exponential backoff, save partial route data
- **Low Accuracy**: Warn user, offer to pause tracking until accuracy improves

#### Offline Scenarios
- Routes tracked offline stored in IndexedDB
- Background sync when connection restored
- Visual indicator showing offline status
- Queue system for pending uploads

#### Privacy Safeguards
- Confirm before sharing routes that start/end at home
- Blur exact start/end points for anonymous routes
- Strip EXIF data from any photos attached to routes
- Rate limiting on route queries to prevent scraping

### Integration with Existing Features

#### Safety Map Integration
- Routes displayed as paths on existing safety map
- Route safety ratings contribute to heat map
- Filter map to show only routes
- Click route path to see details

#### Credit System Integration
- 15 credits for sharing a route publicly
- 5 credits when someone completes your route
- 25 credit bonus when route gets 10+ positive ratings
- 5 credits for detailed journal entries

#### Feed Integration
- New route shares appear in main feed
- "Route of the Day" featured post
- Route milestones (100km, 50 routes, etc.) celebrated

#### AI Assistant Integration
- Ask Aurora for route recommendations
- "Find me a safe 5km running route near [location]"
- Get safety tips for specific routes
- Route planning assistance

### Performance Considerations

#### GPS Tracking Optimization
- Sample rate: 1 point per 10 meters or 5 seconds (whichever comes first)
- Compress coordinate arrays using polyline encoding
- Batch coordinate updates to reduce database writes
- Use Web Workers for coordinate processing

#### Map Rendering
- Lazy load route paths (only render visible routes)
- Cluster route markers when zoomed out
- Use Mapbox GL JS for hardware-accelerated rendering
- Cache route thumbnails in CDN

#### Offline Performance
- Service Worker for offline route tracking
- IndexedDB for local route storage (max 50MB)
- Background Sync API for automatic upload
- Compression for stored GPS data

### Security Considerations

#### Location Privacy
- Never store exact home/work addresses
- Fuzzing algorithm for anonymous routes
- Rate limiting on location queries
- No reverse geocoding for anonymous routes

#### Data Encryption
- GPS coordinates encrypted at rest
- Voice notes encrypted in Convex storage
- HTTPS for all API calls
- Secure token-based authentication

#### Content Moderation
- Flag inappropriate journal entries
- Community reporting for fake routes
- Automated detection of impossible routes (speed/distance)
- Manual review queue for flagged content

### Accessibility

- Voice commands for hands-free tracking
- High contrast mode for outdoor visibility
- Screen reader support for all interfaces
- Haptic feedback for navigation turns
- Large touch targets for on-the-move interaction

### Internationalization

- Distance units: km/miles toggle
- Multilingual tag translations
- RTL language support
- Local date/time formats
- Currency for credit display


## Aurora Algorithm - Smart Feed Ranking

The Aurora Algorithm is our proprietary content ranking system that ensures users see the most valuable and engaging content first. It combines multiple signals to create an optimal feed experience.

### Algorithm Components

**Engagement Score Formula:**
```
engagementScore = 
  (netVotes × 1.0) +
  (comments × 2.0) +
  (verifications × 3.0) +
  (authorTrustScore × 0.1) +
  (recencyBonus × 0.5)

where:
- netVotes = upvotes - downvotes
- recencyBonus = max(0, 48 - ageInHours)
```

### Weighting Rationale

1. **Net Votes (1.0x)**: Basic community sentiment
2. **Comments (2.0x)**: Discussions indicate valuable content
3. **Verifications (3.0x)**: Community trust is most important
4. **Author Trust (0.1x)**: Established contributors get slight boost
5. **Recency (0.5x/hour)**: Fresh content stays visible for 48 hours

### Benefits

- **Quality Over Virality**: Verified content ranks higher than just popular content
- **Encourages Discussion**: Comments weighted heavily to promote engagement
- **Trust-Based**: Community verification is the strongest signal
- **Balanced Recency**: New content gets visibility but doesn't dominate
- **Anti-Gaming**: Multiple signals make manipulation difficult

### Future Enhancements

- Personalization based on user interests
- Location-based boosting
- Time-of-day optimization
- Content diversity enforcement
- Spam and low-quality detection
