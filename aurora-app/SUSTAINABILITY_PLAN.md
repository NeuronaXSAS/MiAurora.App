# Aurora App - Sustainability & Self-Sufficiency Plan

## 🎯 The Goal: A Self-Sustaining Ecosystem

**Problem:** Empty platforms don't attract users. Users don't create content on empty platforms.
**Solution:** Use AWS $100 to **bootstrap the flywheel**, then let organic growth take over.

```
AWS Seeds Content → Users Engage → Users Create Content → More Users Join → Self-Sustaining
     ↑                                                                              ↓
     └──────────────────── (AWS no longer needed) ←─────────────────────────────────┘
```

---

## 💡 The Strategy: Seed, Don't Sustain

### What AWS Should Do (Temporary)
- Generate **interactive content** that sparks discussion
- Create **daily debates** that users vote on and comment
- Produce **safety tips** that users can verify and localize
- Generate **discussion prompts** in multiple languages

### What AWS Should NOT Do (Wasteful)
- ❌ Generate static affirmations (use local fallbacks instead)
- ❌ Power real-time features (too expensive)
- ❌ Translate every piece of content (let community do it)
- ❌ Run continuously (batch generate, then cache)

---

## 🌍 Multilingual Strategy: Community-Powered Translation

### Phase 1: AI Seeds in English + 5 Languages
Use AWS Bedrock to generate content in 6 languages simultaneously:
- English (default)
- Spanish (500M speakers)
- Portuguese (250M speakers)
- French (300M speakers)
- Arabic (400M speakers)
- Hindi (600M speakers)

**Cost:** One API call generates all 6 versions = same cost as 1 language

### Phase 2: Community Translation Rewards
- Users earn **+20 credits** for translating content to their language
- Verified translations get **+50 credits**
- Creates organic multilingual content at zero AWS cost

### Phase 3: User-Generated Multilingual Content
- Users post in their native language
- Other users translate for credits
- AI only used for initial seed content

---

## 📅 The 90-Day Runway Plan

### Days 1-30: Heavy Seeding (~$40)
**Goal:** Create enough content to make the platform feel alive

| Content Type | Quantity | AWS Cost | Engagement Value |
|--------------|----------|----------|------------------|
| Daily Debates | 30 debates × 6 languages | $15 | High (voting, comments) |
| Safety Tips | 100 tips × 6 languages | $10 | Medium (verification) |
| Discussion Prompts | 50 prompts × 6 languages | $8 | High (posts, replies) |
| Welcome Messages | 20 variations × 6 languages | $2 | Medium (onboarding) |
| Weekly Challenges | 12 challenges × 6 languages | $5 | High (participation) |
| **Total** | | **$40** | |

**Output:** 1,200+ pieces of interactive content across 6 languages

### Days 31-60: Reduced Seeding (~$30)
**Goal:** Fill gaps, respond to user behavior

- Generate content for trending topics users discuss
- Create debates based on popular post themes
- Add safety tips for locations users are active in
- **Only generate what's needed based on analytics**

### Days 61-90: Minimal Seeding (~$20)
**Goal:** Transition to user-generated content

- Only generate content for new languages/regions
- Focus on special events (holidays, awareness days)
- Emergency safety alerts for global events

### Days 91+: Self-Sustaining (~$10/month or $0)
**Goal:** AWS becomes optional

- User-generated content dominates
- Community translations cover new languages
- AI only for moderation and special campaigns
- **Can operate at $0 if needed**

---

## 🔄 The Content Flywheel

### 1. Daily Debates (Highest Engagement)
```
AI generates debate → Users vote → Users comment → 
Comments become new posts → Posts get verified → 
Verified content attracts more users → More debates needed → 
Users suggest debates → AI generates less
```

**Example Debate:**
```json
{
  "topic": "Should companies be required to publish salary ranges?",
  "category": "career",
  "options": ["Yes, always", "Only for certain roles", "No, it's private"],
  "translations": {
    "es": "¿Deberían las empresas publicar rangos salariales?",
    "pt": "Empresas devem publicar faixas salariais?",
    "fr": "Les entreprises doivent-elles publier les salaires?",
    "ar": "هل يجب على الشركات نشر نطاقات الرواتب؟",
    "hi": "क्या कंपनियों को वेतन सीमा प्रकाशित करनी चाहिए?"
  },
  "creditsForVoting": 2,
  "creditsForCommenting": 5,
  "expiresIn": "24h"
}
```

### 2. Safety Tips (Community Verification)
```
AI generates tip → Users verify accuracy → 
Verified tips earn trust → Users add local context → 
Local tips help more users → Users submit their own tips → 
AI generates less
```

### 3. Discussion Prompts (Content Seeding)
```
AI posts prompt → Users respond with stories → 
Stories become posts → Posts get engagement → 
Users post without prompts → AI generates less
```

---

## 🛡️ Graceful Degradation: When AWS Runs Out

### What Continues Working (No AWS)
- ✅ All user-generated content
- ✅ Community translations
- ✅ Local fallback affirmations (already implemented)
- ✅ Cached debates and tips
- ✅ User-submitted debates
- ✅ All safety features
- ✅ Credit system and gamification

### What Stops (AWS Dependent)
- ❌ New AI-generated debates (users submit instead)
- ❌ Auto-translation (community translates instead)
- ❌ AI moderation (manual moderation instead)

### Fallback Content System
```typescript
// Already have local fallbacks - expand them
const FALLBACK_DEBATES = [
  // Pre-generated debates that rotate
  { topic: "Remote work vs office?", category: "career" },
  { topic: "Best self-defense tips?", category: "safety" },
  // ... 50+ debates
];

const FALLBACK_TIPS = [
  // Pre-generated safety tips
  { tip: "Always share your location with a trusted contact", category: "travel" },
  // ... 100+ tips
];
```

---

## 💰 Revised Budget Allocation

### Total: $100 over 6+ months

| Phase | Duration | Budget | Purpose |
|-------|----------|--------|---------|
| Heavy Seeding | Month 1 | $40 | Bootstrap content library |
| Moderate Seeding | Month 2 | $30 | Fill gaps, trending topics |
| Light Seeding | Month 3 | $20 | Special events, new regions |
| Maintenance | Month 4-6 | $10 | Emergency only |
| Self-Sustaining | Month 7+ | $0 | User-generated content |

### Cost Per Content Type
| Content | Cost per item | Items/month | Monthly cost |
|---------|---------------|-------------|--------------|
| Debate (6 langs) | $0.50 | 30 | $15 |
| Safety Tip (6 langs) | $0.10 | 100 | $10 |
| Discussion Prompt | $0.15 | 50 | $7.50 |
| Challenge | $0.40 | 4 | $1.60 |

---

## 🔧 Implementation: Batch Generation System

### The Smart Approach: Generate Once, Use Forever

```typescript
// aurora-app/lib/content-generator.ts

interface GeneratedContent {
  id: string;
  type: 'debate' | 'tip' | 'prompt' | 'challenge';
  content: Record<string, string>; // language -> text
  metadata: {
    category: string;
    generatedAt: number;
    usedAt?: number;
    engagement?: number;
  };
}

// Generate a week's worth of content in ONE batch
async function generateWeeklyContent(): Promise<GeneratedContent[]> {
  const prompt = `Generate 7 daily debates, 20 safety tips, and 10 discussion prompts.
  
  For each item, provide translations in: English, Spanish, Portuguese, French, Arabic, Hindi.
  
  Format as JSON array with structure:
  {
    "type": "debate|tip|prompt",
    "category": "career|safety|wellness|travel|finance",
    "content": {
      "en": "English text",
      "es": "Spanish text",
      "pt": "Portuguese text",
      "fr": "French text",
      "ar": "Arabic text",
      "hi": "Hindi text"
    }
  }
  
  Topics should be:
  - Relevant to women globally
  - Culturally sensitive
  - Encouraging discussion
  - Not controversial or divisive`;

  // ONE API call = 37 pieces of content × 6 languages = 222 content items
  // Cost: ~$2-3 for a week's worth of content
}
```

### Scheduled Generation (AWS Lambda)
```typescript
// Run once per week, not daily
// Generate 7 days of content in advance
// Store in Convex, serve from cache

export const weeklyContentGeneration = async () => {
  const content = await generateWeeklyContent();
  
  // Store in Convex
  for (const item of content) {
    await ctx.db.insert("generatedContent", {
      ...item,
      scheduledFor: getNextAvailableSlot(item.type),
      status: "pending",
    });
  }
};
```

---

## 📊 Success Metrics: When to Stop AWS

### Transition Indicators
| Metric | Target | Meaning |
|--------|--------|---------|
| User posts/day | 50+ | Users creating content |
| Debate suggestions/week | 10+ | Users proposing topics |
| Community translations/week | 20+ | Users localizing content |
| Organic engagement rate | 30%+ | Users engaging without prompts |

### When These Are Met:
1. Reduce AI generation by 50%
2. Monitor for 2 weeks
3. If engagement holds, reduce another 50%
4. Eventually: AI only for special events

---

## 🌱 The Virtuous Cycle

```
Week 1: AI generates 100% of debates
Week 4: AI generates 80%, users suggest 20%
Week 8: AI generates 50%, users suggest 50%
Week 12: AI generates 20%, users suggest 80%
Week 16+: AI generates 0-10%, users run the show
```

**This is how you build a self-sustaining ecosystem.**

---

## 🚨 Emergency Mode: $0 Operation

If AWS credits run out before self-sustainability:

1. **Activate Fallback Content**
   - 50 pre-generated debates (rotate weekly)
   - 100 pre-generated safety tips
   - 30 pre-generated discussion prompts

2. **Enable User Submissions**
   - "Suggest a Debate" feature (already planned)
   - "Submit a Safety Tip" feature
   - Community voting on suggestions

3. **Increase Credit Rewards**
   - Double credits for content creation
   - Triple credits for translations
   - Bonus for verified content

4. **Manual Curation**
   - Admin selects best user suggestions
   - Weekly "Community Picks" feature
   - Highlight top contributors

---

*Plan created: December 2024*
*Philosophy: Seed the ecosystem, don't sustain it artificially*
*Goal: Self-sufficiency within 90 days*
