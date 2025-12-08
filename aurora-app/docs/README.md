# Aurora App Documentation

## Quick Links

| Document | Description |
|----------|-------------|
| [Setup Guide](./SETUP.md) | Environment setup & deployment |
| [Architecture](./ARCHITECTURE.md) | Technical architecture & patterns |
| [Business](./BUSINESS.md) | Revenue, costs, sustainability |

## Project Overview

Aurora App is a global safety intelligence platform for women, featuring:
- **Search Engine** with bias detection & AI content analysis
- **Safety Map** with community-verified locations
- **Community Hub** with circles, debates, and opportunities
- **Emergency System** with offline panic button

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Convex (real-time database)
- **Auth:** WorkOS (Google/Microsoft SSO)
- **AI:** Google AI Studio (Gemini - FREE tier)
- **Maps:** Mapbox GL JS
- **Hosting:** Vercel
- **Content Seeding:** AWS Bedrock (optional)

## Getting Started

```bash
# Install dependencies
npm install

# Start Convex backend
npx convex dev

# Start Next.js (in another terminal)
npm run dev
```

## Environment Variables

See [SETUP.md](./SETUP.md) for complete list.

**Required:**
- `NEXT_PUBLIC_CONVEX_URL`
- `WORKOS_API_KEY` / `WORKOS_CLIENT_ID`
- `GOOGLE_AI_API_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

**Optional (graceful degradation):**
- `AWS_*` - Content seeding
- `BRAVE_SEARCH_API_KEY` - Search
- `TWILIO_*` - SMS alerts
- `CLOUDINARY_*` - Video uploads

## Deployment

```bash
# Type check
npm run type-check

# Build
npm run build

# Sync Convex schema
npx convex deploy
```

---

*Built with 💜 for women everywhere*
