# Design Document: Aurora Global UX

## Overview

This design document outlines the technical approach for making Aurora App truly global while improving user experience. The implementation prioritizes zero-cost solutions, preserves existing branding, and enhances the search engine with meaningful insights.

Key components:
1. **Built-in i18n System** - JSON-based translations, no external providers
2. **Onboarding Optimization** - Streamlined flow with visual improvements
3. **Google AdSense Integration** - Non-intrusive monetization
4. **Desktop Feed Layout** - Three-column professional layout
5. **Enhanced AI Search** - Video support, Aurora personality, unified results
6. **Actionable Bias Metrics** - Human-readable explanations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Aurora App                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   i18n      │  │  Onboarding │  │     Search Engine       │  │
│  │   System    │  │   Wizard    │  │  (Web + Aurora + Video) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                      │                │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌───────────▼───────────┐   │
│  │ Translation │  │   Avatar    │  │    Bias Analyzer      │   │
│  │   Context   │  │   Creator   │  │  (Actionable Metrics) │   │
│  └─────────────┘  └─────────────┘  └───────────────────────┘   │
│         │                │                      │                │
│  ┌──────▼──────────────────────────────────────▼───────────┐   │
│  │              Convex Backend (User Preferences)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced i18n System

**File Structure:**
```
aurora-app/
├── lib/
│   ├── i18n.ts              # Core i18n utilities (existing, enhanced)
│   ├── locale-context.tsx   # React context (existing, enhanced)
│   └── translations/        # NEW: Translation JSON files
│       ├── en.json
│       ├── es.json
│       ├── pt.json
│       ├── fr.json
│       ├── de.json
│       ├── ar.json
│       ├── hi.json
│       └── zh.json
```

**Translation File Format:**
```typescript
// translations/es.json
{
  "nav.feed": "Inicio",
  "nav.safetyMap": "Mapa de Seguridad",
  "nav.routes": "Rutas",
  "onboarding.welcome.title": "¡Bienvenida a Aurora App!",
  "onboarding.welcome.subtitle": "Tu plataforma de seguridad, comunidad y crecimiento",
  // ... 200+ keys per language
}
```

**Enhanced LocaleContext Interface:**
```typescript
interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isRTL: boolean;
  formatDate: (date: Date) => string;
  formatNumber: (num: number) => string;
}
```

### 2. Onboarding Improvements

**Avatar Creator Changes:**
- Center avatar preview using `mx-auto` and proper flex alignment
- Remove freckles toggle (non-functional)
- Add example avatar gallery showing 4-6 pre-made avatars
- Reduce vertical space by combining options into rows

**Location Auto-Detect:**
```typescript
interface LocationDetectProps {
  onLocationDetected: (location: string) => void;
  onError: (error: string) => void;
}

// Uses browser Geolocation API + reverse geocoding
async function detectLocation(): Promise<string> {
  const position = await navigator.geolocation.getCurrentPosition();
  // Use free Nominatim API for reverse geocoding
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
  );
  const data = await response.json();
  return `${data.address.city || data.address.town}, ${data.address.country}`;
}
```

### 3. Google AdSense Integration

**Ad Component:**
```typescript
interface AdUnitProps {
  slot: string;           // AdSense ad slot ID
  format: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  fallback?: React.ReactNode;
}

// Placement locations:
// - Landing page: Below hero, between sections
// - Feed: Every 5th post
// - Search results: After 3rd result
```

**AdSense Script Loading:**
```typescript
// Load AdSense script once in layout.tsx
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
  crossOrigin="anonymous"
  data-ad-client="ca-pub-XXXXXXXX"
/>
```

### 4. Desktop Feed Layout

**Three-Column Layout:**
```
┌────────────────────────────────────────────────────────────┐
│                      Global Header                          │
├──────────┬─────────────────────────────────┬───────────────┤
│          │                                 │               │
│  Left    │         Main Feed               │    Right      │
│  Sidebar │    (Posts, Reels, Polls)        │   Sidebar     │
│  (Nav)   │                                 │  (Widgets)    │
│          │  ┌─────────────────────────┐    │               │
│  - Feed  │  │ Post Card (Reddit-style)│    │ Safety Pulse  │
│  - Map   │  │ ┌─────┬───────────────┐ │    │               │
│  - Routes│  │ │Vote │ Title         │ │    │ Communities   │
│  - Safety│  │ │ ▲   │ Content...    │ │    │               │
│  - etc   │  │ │ 92  │ 💬 97  📤 9   │ │    │ Trending      │
│          │  │ │ ▼   │               │ │    │               │
│          │  │ └─────┴───────────────┘ │    │               │
│          │  └─────────────────────────┘    │               │
│          │                                 │               │
└──────────┴─────────────────────────────────┴───────────────┘
```

**CSS Grid Implementation:**
```css
.feed-layout {
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .feed-layout {
    grid-template-columns: 1fr;
  }
}
```

### 5. Enhanced AI Search

**Video Results Interface:**
```typescript
interface VideoSearchResult {
  type: 'video';
  title: string;
  url: string;
  thumbnail: string;
  duration: string;        // "5:32"
  channel: string;
  viewCount: number;
  publishedAt: string;
  platform: 'youtube' | 'vimeo' | 'other';
  // Aurora analysis
  isWomenFocused: boolean;
  contentRating: 'safe' | 'caution' | 'unknown';
}
```

**Aurora AI Personality Prompt:**
```typescript
const AURORA_PERSONALITY_PROMPT = `
You are Aurora, the AI assistant for Aurora App - the world's first women-first search engine.

Your personality:
- Supportive and empowering, like a wise older sister
- Insightful and specific, never generic
- Safety-conscious, always considering women's wellbeing
- Encouraging action and confidence

Response format:
1. Direct answer to the query (2-3 sentences)
2. Specific insight relevant to women (1 sentence)
3. Empowering closing note (1 sentence)

Always cite sources with [1], [2], etc.
Respond in the user's language: {language}
`;
```

### 6. Aurora Trust Score™ - Visual Bias Metrics

**Product Name: Aurora Search** - The women-first search engine that shows you what's really behind every link.

**Design Philosophy:** In the attention economy, users need instant visual cues. The Aurora Trust Score™ is a single, prominent visual indicator that users will instinctively check before clicking any link - like a "Rotten Tomatoes score" for web content trustworthiness.

**Aurora Trust Score Visual Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Search Result Card                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  Title of the Article                         │
│  │   🛡️    │  source.com • 2 days ago                       │
│  │   92    │  Description text here...                      │
│  │  TRUST  │                                                │
│  └──────────┘                                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 💜 Women-Positive  │  📰 News  │  ✨ Fresh  │  🤖 5% AI ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Click to expand: Why Aurora trusts this source →]         │
└─────────────────────────────────────────────────────────────┘
```

**Trust Score Color Coding (Instant Recognition):**
```typescript
const TRUST_SCORE_COLORS = {
  excellent: { range: [85, 100], color: '#22c55e', emoji: '🛡️', label: 'Highly Trusted' },
  good:      { range: [70, 84],  color: '#84cc16', emoji: '✅', label: 'Trusted' },
  moderate:  { range: [50, 69],  color: '#eab308', emoji: '⚠️', label: 'Verify' },
  caution:   { range: [30, 49],  color: '#f97316', emoji: '🔶', label: 'Caution' },
  warning:   { range: [0, 29],   color: '#ef4444', emoji: '🚨', label: 'Warning' },
};
```

**Aurora Trust Score Interface:**
```typescript
interface AuroraTrustScore {
  // The main score - prominently displayed
  score: number;                 // 0-100
  label: string;                 // "Highly Trusted", "Verify", etc.
  color: string;                 // Hex color for visual
  emoji: string;                 // Quick visual indicator
  
  // Quick badges (horizontal row under title)
  badges: {
    genderBadge: {
      type: 'women-positive' | 'neutral' | 'male-dominated';
      emoji: '💜' | '⚪' | '🔵';
      label: string;
    };
    contentType: {
      type: 'news' | 'opinion' | 'promotional' | 'educational' | 'entertainment';
      emoji: '📰' | '💭' | '💰' | '📚' | '🎬';
      label: string;
    };
    freshness: {
      type: 'fresh' | 'recent' | 'dated' | 'outdated';
      emoji: '✨' | '📅' | '📆' | '⏰';
      label: string;
    };
    aiContent: {
      percentage: number;
      emoji: '🤖';
      label: string;             // "5% AI", "80% AI"
    };
  };
  
  // Expandable details (click to see)
  details: {
    whyThisScore: string;        // "Aurora trusts this because..."
    keyFactors: string[];        // ["Established news source", "Diverse authorship"]
    concerns: string[];          // ["Contains affiliate links", "Opinion piece"]
    betterAlternatives?: {
      title: string;
      url: string;
      score: number;
      reason: string;
    }[];
  };
}
```

**Addictive UX Patterns:**

1. **Score Curiosity**: Users will want to see the score before clicking - creates a habit
2. **Badge Collection**: Quick visual badges make scanning results satisfying
3. **Expand for Details**: Gamifies learning about source quality
4. **Better Alternatives**: Shows users they're getting smarter recommendations
5. **Score Comparison**: Users can compare scores across results

**Trust Score Calculation:**
```typescript
function calculateAuroraTrustScore(result: WebSearchResult): number {
  let score = 50; // Base score
  
  // Gender representation (+/- 20 points)
  score += (result.genderBias.score - 50) * 0.4;
  
  // Source credibility (+/- 25 points)
  score += (result.credibilityScore - 50) * 0.5;
  
  // AI content penalty (up to -15 points)
  score -= result.aiContentPercentage * 0.15;
  
  // Freshness bonus (+10 for recent content)
  if (isRecent(result.publishedDate)) score += 10;
  
  // Women-focused bonus (+10)
  if (result.isWomenFocused) score += 10;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

**Mobile-First Badge Design:**
```css
.aurora-trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--badge-bg);
  color: var(--badge-text);
  transition: transform 0.15s ease;
}

.aurora-trust-badge:hover {
  transform: scale(1.05);
}

.aurora-trust-score {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
  box-shadow: 0 0 20px var(--score-color);
}
```

### 7. Additional Differentiating Features

**7.1 Safety Alerts on Search Results**
When a search result contains potential safety concerns for women (e.g., known scam sites, harassment-prone platforms, unsafe locations), Aurora Search shows a prominent safety alert:

```typescript
interface SafetyAlert {
  type: 'scam' | 'harassment' | 'unsafe-location' | 'misinformation' | 'privacy-risk';
  severity: 'warning' | 'danger';
  message: string;           // "This site has been reported for harassment"
  reportCount?: number;      // "47 women reported issues"
  source: 'community' | 'verified' | 'ai-detected';
}
```

**7.2 "Sisters Searched This" - Community Insights**
Show what other Aurora App users searched for and found helpful:

```
┌─────────────────────────────────────────────────────────────┐
│  👯‍♀️ 234 sisters searched this topic                        │
│  Most helpful result: [Article Title] - 89% found useful    │
│  Related searches: "safe hotels in X", "women-only spaces"  │
└─────────────────────────────────────────────────────────────┘
```

**7.3 Search History Privacy**
Unlike Google, Aurora Search offers:
- **Incognito by default** - No search history stored unless opted in
- **Local-only history** - Stored in browser, never on servers
- **One-tap clear** - Instantly delete all search data

**7.4 "Aurora Verified" Badge**
Sources that have been verified by the Aurora community as women-friendly get a special badge:

```typescript
interface AuroraVerified {
  isVerified: boolean;
  verifiedBy: 'community' | 'editorial' | 'partner';
  verificationDate: Date;
  trustLevel: 'gold' | 'silver' | 'bronze';
  reason: string;            // "Verified women-owned business"
}
```

**7.5 Quick Actions Based on Search Intent**
Detect search intent and offer relevant Aurora App features:

```typescript
const INTENT_ACTIONS = {
  'safety': {
    action: 'Check Safety Map',
    icon: '🗺️',
    route: '/safety-map?location={query}'
  },
  'job': {
    action: 'Browse Opportunities',
    icon: '💼',
    route: '/opportunities?search={query}'
  },
  'community': {
    action: 'Find a Circle',
    icon: '👯‍♀️',
    route: '/circles?topic={query}'
  },
  'health': {
    action: 'Wellness Resources',
    icon: '💜',
    route: '/wellness?topic={query}'
  }
};
```

**7.6 Voice Search with Safety Mode**
Voice search that:
- Works offline for emergency queries
- Has a "whisper mode" for discreet searching
- Can trigger panic button with voice command

**7.7 Search Streaks & Rewards**
Gamification to encourage Aurora Search usage:
- Daily search streak (use Aurora Search 7 days = badge)
- "Informed Sister" badge for checking Trust Scores
- Credits for reporting inaccurate bias scores
- Leaderboard for community contributors

## Data Models

### User Preferences (Convex Schema Addition)
```typescript
// Add to existing users table
{
  // ... existing fields
  preferredLocale: v.optional(v.string()),
  defaultPrivacy: v.optional(v.union(
    v.literal("public"),
    v.literal("anonymous"),
    v.literal("private")
  )),
  locationSharing: v.optional(v.boolean()),
}
```

### Translation Cache
```typescript
// Client-side only - no database needed
interface TranslationCache {
  [locale: string]: {
    [key: string]: string;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Translation System Consistency
*For any* supported locale and any translation key, the t() function should return either the translated string for that locale or the English fallback, never undefined or empty string.
**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: RTL Detection Accuracy
*For any* locale marked as RTL in SUPPORTED_LOCALES, the isRTL function should return true, and for all other locales it should return false.
**Validates: Requirements 1.6**

### Property 3: Privacy Defaults Consistency
*For any* user who completed onboarding with a privacy setting, when creating a new post, the default privacy should match their onboarding selection unless they changed it in settings.
**Validates: Requirements 5.1, 5.2, 5.3, 2.7**

### Property 4: Video Result Rendering Completeness
*For any* video search result returned by the API, the rendered component should display all required fields: title, thumbnail, duration, channel, and view count.
**Validates: Requirements 7.1, 7.2**

### Property 5: Unified Search Result Presence
*For any* search query in the authenticated portal, the results should include both web results (if available) and Aurora App community content (if matching), with clear visual distinction.
**Validates: Requirements 8.1, 8.3, 8.4**

### Property 6: Bias Explanation Completeness
*For any* web search result with bias analysis, the displayed metrics should include: gender representation with explanation, source intent indicator, and a "why this matters" tooltip.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 7: Language Detection for AI Summary
*For any* search performed by a user with a locale preference, the AI summary API should receive the user's language and respond in that language.
**Validates: Requirements 6.1, 6.5**

### Property 8: Alternative Source Suggestion
*For any* search result with a gender bias score below 50, the system should suggest at least one alternative source with better representation.
**Validates: Requirements 9.5**

## Error Handling

### Translation Errors
- Missing key: Return English fallback, log warning in development
- Invalid locale: Default to 'en'
- Failed to load translation file: Use cached/bundled translations

### Geolocation Errors
- Permission denied: Show manual input field, explain benefits
- Position unavailable: Suggest entering location manually
- Timeout: Retry once, then show manual input

### AdSense Errors
- Ad blocked: Hide container gracefully
- Network error: Show nothing (no broken UI)
- Invalid slot: Log error, hide container

### Search API Errors
- Video API unavailable: Show web results only
- Bias analysis failed: Show results without bias metrics
- AI summary failed: Show results without summary

## Testing Strategy

### Unit Tests
- Translation function returns correct values for all supported locales
- RTL detection works for Arabic and other RTL languages
- Bias explanation generator produces human-readable output
- Video result parser handles all expected fields

### Property-Based Tests (fast-check)
- Translation consistency across random keys and locales
- Privacy defaults persist correctly across user sessions
- Bias metrics always include required fields
- Language detection passes correct locale to API

### Integration Tests
- Full onboarding flow with location detection
- Search with video results rendering
- AdSense loading and error handling
- Unified search showing both web and Aurora content

### E2E Tests (Playwright)
- Language switching updates all UI text
- Onboarding completes successfully with all options
- Feed layout displays correctly on desktop
- Search results show bias explanations

