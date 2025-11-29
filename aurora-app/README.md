# Aurora App - Technical Documentation

**Global Safety Intelligence Platform for Women**

Aurora is a production-ready web application combining community engagement, safety intelligence, and opportunity marketplace. Built with Next.js 14, Convex real-time backend, and AI-powered personalization.

## 🌟 Features

### Core Features
- **Real-time Feed**: Reddit-style community feed with upvotes, comments, and live updates
- **Credit Economy**: Earn credits by contributing, spend them on opportunities
- **Safety Map**: Interactive Mapbox visualization of safe spaces and routes
- **AI Assistant**: Personalized career and safety guidance powered by Google Gemini
- **Opportunity Marketplace**: Create and unlock vetted jobs, mentorship, and resources
- **Trust Score System**: Build reputation through verified contributions
- **Media Support**: Share photos and videos with your posts

### Aurora Routes
- **GPS Route Tracking**: Track walking/running routes with real-time stats
- **Route Sharing**: Share safe routes with the community
- **Turn-by-Turn Navigation**: Navigate community-verified safe routes
- **Route Discovery**: Find safe routes near you
- **Privacy Controls**: Share routes anonymously or publicly

### Community Features
- **Polls**: Create and vote on community polls
- **Direct Messaging**: Private conversations with other users
- **AI Chat Sharing**: Share helpful AI conversations with the community
- **Emergency System**: Panic button with multi-channel alerts
- **Mobile PWA**: Install as app with offline support

### Advanced Features (Recently Added)
- **Analytics System**: Comprehensive event tracking with PostHog
- **Personalization Engine**: ML-powered content recommendations
- **User Profiling**: 8 user segments with behavioral analysis
- **Smart Notifications**: Intelligent notification timing and relevance
- **Privacy Controls**: GDPR-compliant data export and deletion

### 🌍 Elite Global Features (NEW)
- **Cycle/Period Tracker**: Complete menstrual health tracking with predictions
- **Safety Resources Directory**: Global database of hotlines, shelters, legal aid
- **Support Circles**: Community groups by topic (career, motherhood, health, etc.)
- **Safety Check-ins**: Scheduled "I'm OK" pings with auto-alerts
- **Sister Accompaniment**: Real-time location sharing for safe journeys
- **Workplace Reports**: Anonymous harassment/discrimination reporting
- **Multi-language Support**: 18 languages for global accessibility
- **Emergency Hotlines**: Country-specific emergency numbers

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: WorkOS (Google & Microsoft SSO)
- **AI**: Google AI Studio (Gemini 1.5 Flash)
- **Maps**: Mapbox GL JS
- **Analytics**: PostHog
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Convex account (free tier)
- WorkOS account (free tier)
- Google AI Studio API key
- Mapbox account (free tier)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/aurora-app.git
cd aurora-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.local.example` to `.env.local` and fill in your API keys:
```bash
cp .env.local.example .env.local
```

4. Start Convex development server:
```bash
npx convex dev
```

5. In another terminal, start Next.js development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
aurora-app/
├── app/                    # Next.js app router pages
│   ├── (authenticated)/    # Protected routes
│   │   ├── feed/          # Home feed
│   │   ├── map/           # Safety map
│   │   ├── opportunities/ # Opportunity marketplace
│   │   ├── assistant/     # AI chat
│   │   └── profile/       # User profile
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── users.ts          # User functions
│   ├── posts.ts          # Post functions
│   ├── opportunities.ts  # Opportunity functions
│   └── ai.ts            # AI functions
├── lib/                  # Utility functions
└── .kiro/               # Kiro specs and configuration
    └── specs/
        └── aurora-app/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## 🧪 Testing

### E2E Tests (Playwright)

```bash
# Run all tests
npm run test:e2e

# Run in UI mode (recommended)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/safety.spec.ts

# Run with headed browser
npm run test:e2e:headed
```

**Test Coverage:**
- Safety features (panic button, emergency contacts)
- Critical user journeys (landing, auth, feed)
- Mobile responsiveness
- Accessibility compliance
- Performance benchmarks

### Manual Testing

1. **Authentication Flow:**
   - Visit `/` and click "Get Started"
   - Complete WorkOS SSO
   - Verify redirect to `/feed`

2. **Emergency System:**
   - Navigate to `/emergency`
   - Enable test mode
   - Hold panic button for 5 seconds
   - Verify alert screen appears

3. **Route Tracking:**
   - Go to `/routes/track`
   - Allow location permissions
   - Start tracking
   - Verify real-time GPS updates

## 🔧 Configuration

### Environment Variables

**Core (Required):**
```env
CONVEX_DEPLOYMENT=<your-deployment-url>
NEXT_PUBLIC_CONVEX_URL=<your-public-url>
WORKOS_API_KEY=<your-api-key>
WORKOS_CLIENT_ID=<your-client-id>
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>
```

**Optional (Graceful Degradation):**
```env
# SMS Alerts (shows trial mode if missing)
TWILIO_ACCOUNT_SID=<optional>
TWILIO_AUTH_TOKEN=<optional>
TWILIO_PHONE_NUMBER=<optional>

# Video Features (disabled if missing)
CLOUDINARY_CLOUD_NAME=<optional>
CLOUDINARY_API_KEY=<optional>
CLOUDINARY_API_SECRET=<optional>

# Livestreaming (disabled if missing)
AGORA_APP_ID=<optional>
AGORA_APP_CERTIFICATE=<optional>

# AI Features (limited if missing)
GEMINI_API_KEY=<optional>

# Analytics (disabled if missing)
NEXT_PUBLIC_POSTHOG_KEY=<optional>
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Monetization (disabled if missing)
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=<optional>
```

### Convex Setup

1. **Deploy Backend:**
```bash
npx convex deploy
```

2. **Seed Demo Data (Optional):**
```bash
npx convex run seedDataEnhanced:seedComprehensiveData
```

This creates:
- 100 diverse users
- 300 posts across all dimensions
- 75 routes with safety ratings
- 50 opportunities
- 30 reels
- Full engagement data

## 🏗️ Architecture

### Database Schema (Convex)

**Core Tables:**
- `users` - User profiles with trust scores
- `posts` - Community content with ratings
- `routes` - GPS-tracked safe routes
- `opportunities` - Jobs, mentorship, resources
- `comments` - Threaded discussions
- `votes` - Upvotes/downvotes
- `transactions` - Credit economy

**Advanced Tables:**
- `reels` - Short-form video metadata
- `livestreams` - Live broadcast sessions
- `emergencyAlerts` - Panic button activations
- `corporateSafetyIndex` - B2B workplace data
- `urbanSafetyIndex` - B2B geographic data
- `analytics` - Event tracking

### API Structure

**Convex Functions:**
- `queries` - Read operations (real-time subscriptions)
- `mutations` - Write operations (optimistic updates)
- `actions` - External API calls (Twilio, Gemini, etc.)

**Next.js API Routes:**
- `/api/auth/*` - WorkOS authentication
- `/api/files/*` - File upload URLs
- `/api/analytics/*` - Batch event processing

## 📊 Performance

- **Build Time:** ~20 seconds
- **Page Load:** <3 seconds (LCP)
- **Real-time Updates:** <100ms latency
- **Database Queries:** Indexed for O(log n)
- **Bundle Size:** ~250KB gzipped

## 🔒 Security

- **Authentication:** WorkOS SSO (OAuth 2.0)
- **Authorization:** Row-level security in Convex
- **Data Privacy:** GDPR-compliant export/deletion
- **Input Validation:** Zod schemas on all mutations
- **Rate Limiting:** Convex built-in protection
- **XSS Protection:** React automatic escaping
- **CSRF:** SameSite cookies

## 📄 License

MIT License - See LICENSE file

## 🙏 Built With

- [Kiro](https://kiro.dev) - AI-powered development
- [Convex](https://convex.dev) - Real-time backend
- [WorkOS](https://workos.com) - Enterprise auth
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - Component library

---

**Built for Kiroween Hackathon 2025**
