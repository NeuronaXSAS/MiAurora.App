# Aurora App

**The Front Page of the Internet for Women**

A global safety intelligence platform featuring an AI Counselor that helps women navigate relationships, conflicts, and life decisions with wisdom and empathy.

## Live Demo

**Website:** [miaurora.app](https://miaurora.app)

## Quick Start

```bash
cd aurora-app
npm install
npx convex dev      # Terminal 1: Start backend
npm run dev         # Terminal 2: Start frontend
```

Visit `http://localhost:3000`

## Core Features

| Feature | Description |
|---------|-------------|
| **Aurora Counselor** | AI-powered guidance for "Who's Right?" scenarios |
| **Safety Map** | Community-verified safe locations and routes |
| **Search Engine** | Bias-aware search with AI content detection |
| **Community Hub** | Circles, debates, and opportunities |
| **Emergency System** | Offline-capable panic button |

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Convex (real-time database)
- **Auth:** WorkOS (Google/Microsoft SSO)
- **AI:** Google Gemini
- **Maps:** Mapbox GL JS
- **Hosting:** Vercel

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](./aurora-app/docs/SETUP.md) | Environment setup |
| [Architecture](./docs/ARCHITECTURE.md) | Technical deep-dive |
| [Product Spec](./docs/PRODUCT.md) | Features and roadmap |

## Project Structure

```
MiAurora.App/
├── aurora-app/          # Main application
│   ├── app/             # Next.js pages
│   ├── components/      # React components
│   ├── convex/          # Backend functions
│   └── docs/            # App-specific docs
├── docs/                # Project documentation
├── .llm/                # AI/LLM context files
│   ├── specs/           # Feature specifications
│   └── steering/        # AI behavior guidelines
└── archive/             # Historical files
```

## Environment Variables

**Required:**
- `NEXT_PUBLIC_CONVEX_URL`
- `WORKOS_API_KEY` / `WORKOS_CLIENT_ID`
- `GOOGLE_AI_API_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

See [Setup Guide](./aurora-app/docs/SETUP.md) for complete list.

## License

MIT License - See [LICENSE](./LICENSE)

---

**Built with love for women's safety worldwide**

[Website](https://miaurora.app) | [Connect](https://linktr.ee/auroraapp)
