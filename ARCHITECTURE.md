# Aurora App - Technical Architecture

## 🏗️ Technology Stack

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ (App Router) | SSR, API routes |
| React | 19+ | UI components |
| TypeScript | 5+ | Type safety (strict mode) |
| Tailwind CSS | 4+ | Utility-first styling with Aurora CSS variables |
| shadcn/ui | Latest | Accessible base components |
| Framer Motion | Latest | Micro-animations |
| Mapbox GL JS | Latest | Interactive safety maps |

### Backend Layer
| Technology | Purpose |
|------------|---------|
| Convex | Real-time database, serverless functions, file storage |
| WorkOS | Authentication (Google/Microsoft SSO) |
| Google Gemini | Core AI for "Who's Right?", analysis, moderation |
| Brave Search | Web search API with bias detection |
| Twilio | SMS emergency alerts |
| Cloudinary | Video/image uploads |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting, Edge Network |
| Convex Cloud | Backend database and functions hosting |

---

## 📊 Database Schema (Convex)

### Core User & Interaction Tables
- `users` - Profiles, trust scores, credits, and identities.
- `posts` - Community content linked to life dimensions.
- `comments` - Threaded discussions.
- `opportunities` - Jobs and mentorship.

### Safety Tables (Critical)
- `emergencyContacts` - User's trusted circle.
- `emergencyAlerts` - Panic button activations.
- `safetyResources` - Global hotlines and shelters.
- `safetyCheckins` - Scheduled wellness pings.
- `routes` - GPS-tracked safe paths.
- `workplaceReports` - Anonymized incident reporting.

### Engagement & Wellness
- `dailyDebates` - "Who's Right?" scenarios.
- `communityTruth` - Crowd-sourced verdicts.
- `hydrationLogs` - Daily water tracking.
- `cycleLogs` - Menstrual health tracking.

---

## 🔍 Aurora Search Engine Metrics System

The platform features a proprietary intelligence metric system designed to help women evaluate content safety, bias, and credibility.

### Current Metrics (Local Mode)
*All current metrics operate via local heuristics using keyword matching and pattern detection.*

- **Vibe** - Emotional tone (e.g., Inspiring, Toxic, Neutral).
- **Gender** - Women-friendliness and representation score.
- **Political** - Political bias indicator.
- **AI** - Detection of AI-generated content patterns.
- **Eco** - Sustainability/environmental focus score.
- **Credibility** - Trustworthiness based on domain authority (.gov, .edu, verified sources).

### AI Upgrade Path
The system (`lib/search/metrics-config.ts`) is designed to effortlessly switch to an AI-powered analyzer as needed. Each metric can be independently toggled to `mode: "ai"`.

---

## 🔐 Security & Auth Architecture

### Authentication Flow
1. User authenticates via **WorkOS** (Google/Microsoft OAuth).
2. The WorkOS callback provisions/updates the user identity in **Convex**.
3. All protected routes and mutations securely verify the session token.

### Security Principles
- **Row-Level Security:** Validated via Convex `userId`.
- **Data Protection:** PII is never exposed or logged.
- **Rate Limiting:** Managed by `lib/resource-guard.ts` for all 3rd party API calls (Gemini, Brave, Mapbox).

---

## 📱 Mobile & Offline Capabilities

### Offline-First Safety Features
- **Panic Button:** Triggers emergency protocols even offline via queued actions.
- **Service Worker Caching:** Caches critical assets (`/offline`, emergency contacts, basic resources).
- **Graceful Degradation:** If Twilio or Cloudinary APIs are unreachable, the app degrades visually but retains core local functions.

---

## 🚀 Deployment & Production Readiness

### Pre-Deployment Checklist
1. `npm run type-check`
2. `npm run build`
3. `npx convex deploy` *(CRITICAL: Schema must be synced before pushing code)*

### Performance Targets
- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Route Chunks:** < 100KB gzipped

### Monitoring
- **Analytics:** PostHog integration.
- **Error Tracking:** React ErrorBoundary implemented across all critical trees.
- **Feature Flags:** A custom feature flag system is active (`lib/feature-flags.ts`) to manage phased rollouts safely without downtime.
