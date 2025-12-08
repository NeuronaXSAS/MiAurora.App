# Aurora App

**Global Safety Intelligence Platform for Women**

A production-ready platform combining community engagement, safety intelligence, and opportunity marketplace. Built with Next.js 14, Convex, and AI-powered personalization.

## Features

- **Search Engine** - Bias detection, AI content analysis, women-first results
- **Safety Map** - Community-verified locations and routes
- **Community Hub** - Circles, debates, opportunities
- **Emergency System** - Offline panic button, location sharing
- **Who's Right** - AI argument analyzer with certificates

## Tech Stack

- Next.js 14 (App Router)
- Convex (real-time backend)
- WorkOS (authentication)
- Google AI Studio (Gemini)
- Mapbox GL JS
- Tailwind CSS + shadcn/ui

## Quick Start

```bash
# Install
npm install

# Start Convex (terminal 1)
npx convex dev

# Start Next.js (terminal 2)
npm run dev
```

## Documentation

See [docs/](./docs/) for:
- [Setup Guide](./docs/SETUP.md) - Environment & deployment
- [Architecture](./docs/ARCHITECTURE.md) - Technical details
- [Business](./docs/BUSINESS.md) - Revenue & sustainability

## Environment

Required variables in `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
GOOGLE_AI_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## Deployment

```bash
npm run type-check
npm run build
npx convex deploy
```

## License

MIT

---

*Made with 💜 for women everywhere*
