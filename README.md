# Aurora App: The Future of Social Networks

## **The Front Page of the Internet for Women**

Aurora App is a global safety intelligence platform and the world's first non-toxic social network. We help women navigate relationships, conflicts, and life decisions with wisdom, empathy, and community support.

---

## 🌟 The Vision

Traditional therapy can be expensive and carries stigmas. General AI companions lack safety context. Aurora provides unbiased relationship guidance seamlessly integrated into a safety-first philosophy.

**Core Value Proposition:**
- **Aurora Counselor** - AI-powered guidance for "Who's Right?" scenarios.
- **Safety Map & Routes** - Community-verified safe locations and GPS-tracked walking paths.
- **Bias-Aware Search** - A proprietary search engine detecting gender bias, AI content, and ecosystem credibility.
- **Emergency System** - An offline-capable Panic Button ensuring safety is never compromised.
- **Community Hub** - Circles, debates, and opportunities to foster growth.

---

## 🚀 Quick Start & Setup Guide

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Convex account (free)
- WorkOS account (free)
- Google AI Studio API key (free tier used)
- Mapbox account (free)

### 2. Environment Variables (`aurora-app/.env.local`)
```env
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# WorkOS Authentication
WORKOS_API_KEY=sk_live_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google AI Studio (FREE)
GOOGLE_AI_API_KEY=AIza...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### 3. Running Locally
```bash
cd aurora-app
npm install

# Terminal 1: Start backend
npx convex dev

# Terminal 2: Start frontend
npm run dev
```

Visit `http://localhost:3000`

---

## 📚 Technical Architecture & AI Steering

For software engineers, complete documentation has been simplified into two files:
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Deep dive into our Convex schemas, Next.js App Router patterns, and search engine metrics.
- **[AGENTS.md](./AGENTS.md)**: The ultimate, LLM-agnostic steering document detailing our color palettes, safety-first rules, and mobile-first guidelines. **Any AI assistant contributing to this codebase MUST read this file.**

---

## 💼 Business & Sustainability

Aurora is built to be a self-sustaining ecosystem where **ALL safety features remain FREE forever**.

### Sustainable Scale
Aurora operates on a proprietary infrastructure built for scale and uncompromising safety.










---

## 🔒 License & Copyright

**Copyright (c) 2026 Aurora App. All rights reserved.**

This is a proprietary codebase. No part of this software may be copied, distributed, modified, or reproduced without explicit written consent from the owners of Aurora App. This project is closed-source.

**Built with love for women's safety worldwide**
[Website](https://miaurora.app) | [Connect](https://linktr.ee/auroraapp)
