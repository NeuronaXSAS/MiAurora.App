# Aurora App - Technical Architecture

## Overview

Aurora App is a full-stack real-time application built with modern web technologies, optimized for women's safety and community engagement.

## Technology Stack

### Frontend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | App Router, SSR, API routes |
| React | 19+ | UI components |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 4+ | Utility-first styling |
| shadcn/ui | Latest | Accessible components |
| Framer Motion | Latest | Animations |
| Mapbox GL JS | Latest | Interactive maps |

### Backend Layer

| Technology | Purpose |
|------------|---------|
| Convex | Real-time database, serverless functions |
| WorkOS | Authentication (Google/Microsoft SSO) |
| Google Gemini | AI chat, analysis, moderation |
| Brave Search | Web search API |
| Twilio | SMS emergency alerts |
| Cloudinary | Video/image uploads |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting, edge functions |
| Convex Cloud | Backend hosting |
| GitHub | Source control, CI/CD |

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Next.js    │  │  React      │  │  Mapbox     │          │
│  │  App Router │  │  Components │  │  GL JS      │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  API Routes │  │  Middleware │  │  Static     │          │
│  │  /api/*     │  │  Auth Check │  │  Assets     │          │
│  └──────┬──────┘  └─────────────┘  └─────────────┘          │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Convex     │  │  WorkOS     │  │  Gemini AI  │          │
│  │  Database   │  │  Auth       │  │  API        │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Brave      │  │  Twilio     │  │  Cloudinary │          │
│  │  Search     │  │  SMS        │  │  Media      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema (Convex)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | trustScore, credits, preferences |
| `posts` | Community content | lifeDimension, rating, location |
| `comments` | Threaded discussions | parentId, depth |
| `routes` | GPS-tracked paths | polyline, safetyRating |
| `opportunities` | Jobs, mentorship | type, credits, deadline |

### Safety Tables

| Table | Purpose |
|-------|---------|
| `emergencyContacts` | User's emergency contacts |
| `emergencyAlerts` | Panic button activations |
| `safetyResources` | Global hotlines, shelters |
| `safetyCheckins` | Scheduled "I'm OK" pings |
| `guardians` | In-app trusted contacts |

### Engagement Tables

| Table | Purpose |
|-------|---------|
| `dailyDebates` | "Who's Right?" scenarios |
| `communityTruth` | Crowd-sourced verdicts |
| `habits` | Wellness tracking |
| `lifeCanvas` | Personal journaling |

## API Architecture

### Convex Functions

```typescript
// Queries - Real-time subscriptions
export const getPosts = query({...})
export const getUser = query({...})

// Mutations - Write operations
export const createPost = mutation({...})
export const updateProfile = mutation({...})

// Actions - External API calls
export const sendEmergencyAlert = action({...})
export const analyzeContent = action({...})
```

### Next.js API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/*` | WorkOS authentication callbacks |
| `/api/search/brave` | Web search with bias analysis |
| `/api/analyze/argument` | "Who's Right?" AI analysis |
| `/api/content/generate` | AI content generation |
| `/api/debates/generate` | Daily debate creation |

## Security Architecture

### Authentication Flow

```
User → WorkOS → OAuth Provider → Callback → Convex User Creation → Session
```

### Authorization

- **Row-Level Security:** Convex functions validate `userId` ownership
- **Role-Based Access:** Admin functions check user role
- **Rate Limiting:** `lib/resource-guard.ts` protects paid APIs

### Data Protection

- All data encrypted in transit (HTTPS)
- Convex encrypts data at rest
- PII never logged or exposed
- GDPR-compliant export/deletion

## Performance Optimization

### Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | ~2.0s |
| FID | < 100ms | ~50ms |
| CLS | < 0.1 | ~0.05 |
| Bundle | < 200KB | ~180KB |

### Strategies

- **Code Splitting:** Next.js automatic chunking
- **Image Optimization:** Cloudinary transformations
- **Caching:** Convex query caching, React memo
- **Lazy Loading:** Dynamic imports for heavy components

## Cost Optimization

### Free Tier Limits

| Service | Monthly Limit | Strategy |
|---------|---------------|----------|
| Gemini | ~200 req/day | Rate limit, cache responses |
| Brave Search | 2,000/month | Cache results, fallback |
| Mapbox | 50,000 loads | Lazy load, static images |
| Convex | Generous | Monitor usage |
| Vercel | 100GB bandwidth | Monitor |

### Resource Guard

```typescript
// lib/resource-guard.ts
const limits = {
  gemini: { daily: 200, monthly: 6000 },
  braveSearch: { daily: 100, monthly: 2000 },
  mapbox: { daily: 2000, monthly: 50000 }
};
```

## Deployment

### CI/CD Pipeline

```bash
# Pre-deployment checks
npm run type-check
npm run build

# Database sync (CRITICAL)
npx convex deploy

# Push triggers Vercel auto-deploy
git push origin main
```

### Environment Separation

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | miaurora.app | main |
| Preview | *.vercel.app | PR branches |
| Development | localhost:3000 | local |

## Monitoring

### Current

- Convex Dashboard: Database metrics
- Vercel Analytics: Performance
- Console logging: Debug info

### Recommended Additions

- Sentry: Error tracking
- PostHog: User analytics (partially implemented)
- UptimeRobot: Availability monitoring

## File Structure

```
aurora-app/
├── app/
│   ├── (authenticated)/     # Protected routes
│   │   ├── feed/           # Community feed
│   │   ├── map/            # Safety map
│   │   ├── opportunities/  # Job marketplace
│   │   └── profile/        # User dashboard
│   ├── api/                # API routes
│   │   ├── auth/          # WorkOS callbacks
│   │   ├── search/        # Brave Search
│   │   └── analyze/       # AI analysis
│   ├── legal/             # Legal pages
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui base
│   ├── search/            # Search components
│   ├── ads/               # Ad components
│   └── [feature]/         # Feature-specific
├── convex/
│   ├── schema.ts          # Database schema
│   └── [table].ts         # Table functions
├── lib/
│   ├── search/            # Search services
│   ├── translations/      # i18n files
│   └── [utility].ts       # Shared utilities
└── hooks/                 # Custom React hooks
```

## Key Design Decisions

### Why Convex?

- Real-time by default (no WebSocket setup)
- TypeScript-first with generated types
- Built-in file storage
- Generous free tier

### Why WorkOS?

- Enterprise-grade SSO
- Single integration for Google + Microsoft
- Professional onboarding experience

### Why Gemini over GPT?

- Generous free tier (200 req/day)
- Fast response times
- Good reasoning for relationship advice
- Cost-effective for startup

## Future Considerations

- **Scaling:** Convex auto-scales; monitor costs
- **CDN:** Already on Vercel Edge
- **Mobile:** PWA-ready, consider React Native later
- **Internationalization:** Basic i18n implemented, expand
