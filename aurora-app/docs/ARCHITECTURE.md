# Aurora App - Technical Architecture

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework |
| Styling | Tailwind CSS + shadcn/ui | UI components |
| Backend | Convex | Real-time database |
| Auth | WorkOS | Google/Microsoft SSO |
| AI | Google AI Studio (Gemini) | Chat, analysis |
| Maps | Mapbox GL JS | Safety map |
| Hosting | Vercel | Deployment |
| Content | AWS Bedrock (optional) | Bulk content seeding |

## Project Structure

```
aurora-app/
├── app/                    # Next.js App Router
│   ├── (authenticated)/    # Protected routes
│   │   ├── feed/          # Community feed
│   │   ├── map/           # Safety map
│   │   ├── opportunities/ # Job marketplace
│   │   └── profile/       # User profile
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui base
│   ├── ads/              # Ad components
│   ├── search/           # Search features
│   └── ...               # Feature components
├── convex/               # Backend
│   ├── schema.ts         # Database schema
│   └── *.ts              # Functions
├── lib/                  # Utilities
│   ├── search/           # Search services
│   └── resource-guard.ts # Rate limiting
├── docs/                 # Documentation
└── .kiro/               # Kiro configuration
    └── steering/         # AI guidelines
```

## Database Schema (Convex)

### Core Tables
- `users` - Profiles with trust scores
- `posts` - Community content
- `routes` - GPS-tracked safe routes
- `opportunities` - Jobs, mentorship
- `comments` - Threaded discussions

### Safety Tables
- `emergencyContacts` - User's emergency contacts
- `emergencyAlerts` - Panic button activations
- `safetyResources` - Global hotlines, shelters
- `safetyCheckins` - Scheduled "I'm OK" pings

### Engagement Tables
- `loginStreaks` - Daily login tracking
- `dailyChallenges` - Gamification
- `seededContent` - AI-generated content

## API Architecture

### Convex Functions
- **Queries:** Real-time subscriptions
- **Mutations:** Write operations
- **Actions:** External API calls

### Next.js API Routes
- `/api/auth/*` - WorkOS authentication
- `/api/search/*` - Brave Search integration
- `/api/analyze/*` - AI analysis (Who's Right)
- `/api/content/*` - Content generation

## Cost Optimization

### Free Tier Services
| Service | Limit | Our Usage |
|---------|-------|-----------|
| Gemini | 200 req/day | ~100/day |
| Brave Search | 2,000/month | ~300/month |
| Mapbox | 50,000/month | ~40,000/month |
| Convex | Generous | Unlimited |
| Vercel | 100GB | Monitor |

### Resource Guard
All paid APIs are rate-limited via `lib/resource-guard.ts`:
- Daily/monthly limits
- Graceful degradation
- Usage tracking

## Security

- **Auth:** WorkOS SSO (OAuth 2.0)
- **Authorization:** Row-level security in Convex
- **Privacy:** GDPR-compliant export/deletion
- **Validation:** Zod schemas on mutations
- **XSS:** React automatic escaping

## Performance Targets

- LCP: < 2.5 seconds
- FID: < 100 milliseconds
- CLS: < 0.1
- Bundle: < 200KB gzipped
