# Aurora Search Engine - Metrics System

> The world's first women-first search engine with proprietary intelligence metrics.

## Overview

Aurora's search engine differentiates itself from Google/Bing by providing unique metrics that help women evaluate content:

| Metric | Description | Current Mode |
|--------|-------------|--------------|
| **Vibe** | Emotional tone (Inspiring, Toxic, Neutral, etc.) | Local |
| **Gender** | Women-friendliness score | Local |
| **Political** | Political bias indicator | Local |
| **AI** | AI-generated content detection | Local |
| **Eco** | Sustainability/environmental focus | Local |
| **Credibility** | Source trustworthiness | Local |

**Current Status: All metrics use LOCAL heuristics ($0 cost)**

---

## Architecture

```
lib/search/
├── index.ts                 # Main exports
├── metrics-config.ts        # Configuration (AI-ready)
├── metrics-analyzer.ts      # Unified analyzer (switches local/AI)
├── bias-analyzer.ts         # Gender, Political, Commercial, Vibe
├── credibility-scorer.ts    # Source trustworthiness
├── ai-detector.ts           # AI content detection
├── sustainability-scorer.ts # Eco/sustainability scoring
├── safety-analyzer.ts       # Safety flags for women
├── types.ts                 # TypeScript definitions
└── README.md               # This file
```

---

## How It Works

### Local Mode (Current - $0 Cost)

All metrics use **keyword matching** and **pattern detection**:

```typescript
// Example: Analyzing a search result
import { analyzeBias, calculateCredibility, detectAIContent } from '@/lib/search';

const text = "Article about women in tech...";
const url = "https://example.com/article";

const bias = analyzeBias(text);           // Gender & political bias
const cred = calculateCredibility(url);    // Source trustworthiness
const ai = detectAIContent(text);          // AI-generated content %
```

### Unified Analyzer (Recommended)

Use the unified analyzer for all new code:

```typescript
import { analyzeMetrics } from '@/lib/search';

const metrics = await analyzeMetrics(
  "Article content here...",
  "https://example.com/article"
);

console.log(metrics.vibe.tone);           // "Inspiring"
console.log(metrics.genderBias.score);    // 75
console.log(metrics.sustainability.label); // "Eco-Aware"
console.log(metrics.meta.source);          // "local" or "ai"
```

---

## Upgrading to AI-Powered Analysis

When you have budget for higher quality analysis, follow these steps:

### Step 1: Get an API Key (Free Tier Available!)

**Recommended: Google AI Studio (Gemini)**
- Go to: https://makersuite.google.com/app/apikey
- Create a new API key (FREE - 15 requests/minute)
- Add to `.env.local`:

```bash
GOOGLE_AI_API_KEY=your_api_key_here
```

### Step 2: Enable AI Globally

Edit `lib/search/metrics-config.ts`:

```typescript
global: {
  aiEnabled: true,  // Change from false to true
  // ...
}
```

### Step 3: Enable AI for Specific Metrics

Choose which metrics to upgrade:

```typescript
metrics: {
  GENDER_BIAS: {
    mode: "ai",  // Change from "local" to "ai"
    // ...
  },
  VIBE: {
    mode: "ai",  // Each metric can be upgraded independently
    // ...
  },
  // Keep others as "local" if you want to limit costs
}
```

### Step 4: Test & Monitor

```typescript
import { getMetricsStatus } from '@/lib/search';

const status = getMetricsStatus();
console.log(status.mode);              // "all-local", "mixed", or "all-ai"
console.log(status.aiEnabledMetrics);  // ["GENDER_BIAS", "VIBE"]
```

---

## Cost Estimates

### AI Provider Pricing (2024)

| Provider | Model | Cost per 1K tokens | Notes |
|----------|-------|-------------------|-------|
| **Google** | gemini-1.5-flash | **FREE** (15 RPM) | Best for $0 budget |
| Google | gemini-1.5-pro | $0.00125 | Better quality |
| OpenAI | gpt-4o-mini | $0.00015 | Good balance |
| OpenAI | gpt-4o | $0.005 | Highest quality |
| Anthropic | claude-3-haiku | $0.00025 | Fast & cheap |
| Anthropic | claude-3-sonnet | $0.003 | Better quality |

### Estimated Costs Per Search

| Metrics Mode | Cost per Search | Monthly (10K searches) |
|--------------|-----------------|------------------------|
| All Local | **$0** | **$0** |
| 1 AI Metric | ~$0.0005 | ~$5 |
| All AI (cached) | ~$0.003 | ~$30 |
| All AI (no cache) | ~$0.01 | ~$100 |

**Recommendation:** Start with Gemini free tier, enable caching, and upgrade gradually.

---

## AI Prompt Templates

Each metric has a pre-configured AI prompt in `metrics-config.ts`. Example:

```typescript
GENDER_BIAS: {
  aiPromptTemplate: `Analyze this content for gender bias from a women's perspective.

Score from 0-100 where:
- 80-100: Women-Positive (actively supportive of women)
- 60-79: Balanced (fair representation)
- 40-59: Neutral (no clear signals)
- 20-39: Caution (some concerning patterns)
- 0-19: Potential Bias (problematic content)

Content: {content}
Source: {domain}

Return ONLY JSON: {"score": 0-100, "label": "...", "reason": "..."}`,
}
```

You can customize these prompts to improve quality.

---

## Adding New Metrics

### 1. Define the Type

Edit `types.ts`:

```typescript
export interface NewMetricScore {
  score: number;
  label: NewMetricLabel;
  // ...
}
```

### 2. Create the Local Analyzer

Create `new-metric-scorer.ts`:

```typescript
export function calculateNewMetric(text: string): NewMetricScore {
  // Keyword matching logic
  // ...
}
```

### 3. Add Configuration

Edit `metrics-config.ts`:

```typescript
NEW_METRIC: {
  displayName: "New Metric",
  enabled: true,
  mode: "local",
  aiPromptTemplate: "...",
  // ...
}
```

### 4. Integrate into Unified Analyzer

Edit `metrics-analyzer.ts` to include the new metric.

### 5. Update the UI

Display the new metric in the Aurora Metrics card.

---

## Caching Strategy

When AI is enabled, results are cached to reduce costs:

```typescript
// In metrics-config.ts
GENDER_BIAS: {
  cacheResults: true,
  cacheTTL: 3600,  // 1 hour in seconds
}
```

**Cache key:** `metric:${METRIC_NAME}:${hash(domain + content)}`

**Current:** Simple in-memory cache (resets on server restart)
**Future:** Consider Redis for production scale

---

## Fallback Strategy

If AI analysis fails, the system automatically falls back to local heuristics:

```typescript
GENDER_BIAS: {
  mode: "ai",
  fallbackToLocal: true,  // Use local if AI fails
}
```

This ensures users always get results, even during API outages.

---

## Files Reference

### `metrics-config.ts`
Central configuration for all metrics. Edit this to enable AI mode.

### `metrics-analyzer.ts`
Unified entry point. Use `analyzeMetrics()` for all new code.

### `bias-analyzer.ts`
Local heuristics for:
- Gender bias (keyword matching)
- Political bias (domain database + keywords)
- Commercial bias (affiliate detection)
- Emotional tone (vibe classification)

### `credibility-scorer.ts`
Domain-based credibility scoring:
- .gov/.edu domains get bonuses
- Verified news sources get bonuses
- Women-focused domains get bonuses

### `ai-detector.ts`
Pattern-based AI content detection:
- Common AI phrases ("It's important to note...")
- Structural patterns (numbered lists, uniform paragraphs)
- Formal language markers

### `sustainability-scorer.ts`
Eco/sustainability focus detection:
- Green keywords (sustainable, renewable, etc.)
- Sustainability-focused domains (WWF, EPA, etc.)
- Greenwashing indicators

---

## Testing

Run the property-based tests:

```bash
npm test -- lib/search/__tests__/search.property.test.ts
```

Tests verify:
- Score ranges (0-100)
- Label mapping consistency
- Domain type ordering
- Average calculations

---

## Questions?

The metrics system is designed to grow with Aurora App. Start with local heuristics, then upgrade to AI as your budget and user base grow.

Key principles:
1. **Women-first** - All metrics prioritize women's safety and perspective
2. **Transparency** - Users see how content is evaluated
3. **Privacy** - Analysis happens server-side, no tracking
4. **Cost-effective** - Local mode is free, AI mode is optional

Happy building! 💜