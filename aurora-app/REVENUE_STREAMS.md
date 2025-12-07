# Aurora App - Revenue Streams Guide

## 🎯 Mission: Sustainable Platform for Women

Aurora App operates on a freemium model where **ALL safety features remain FREE forever**.
Revenue is generated through non-intrusive ads, premium subscriptions, and creator economy.

---

## 💰 Revenue Stream Overview

| Stream | Status | Expected Revenue |
|--------|--------|------------------|
| Google AdSense | ✅ Active | $1-5 RPM |
| Premium Subscriptions | ✅ Active | $5-25/user/month |
| Virtual Gifts | ✅ Active | 15% platform fee |
| Paid Events | ✅ Active | 20% platform fee |
| Credit Purchases | ✅ Active | Direct revenue |
| B2B Intelligence | 🔜 Future | Enterprise pricing |

---

## 1. 📺 Google AdSense

### Configuration
- **Publisher ID:** `ca-pub-9358935810206071`
- **Script Location:** `app/layout.tsx`
- **Component:** `components/ads/smart-ad.tsx`

### Ad Placements (✅ All Implemented)

| Page | Placement Type | Position | Frequency | Status |
|------|---------------|----------|-----------|--------|
| Landing (/) | Banner | After search section | 1x | ✅ |
| Feed | In-feed native | Every 5 posts | ~10x | ✅ |
| Search Results | Search ad | Position 4 | 1x | ✅ |
| Opportunities | In-feed | Every 4 listings | ~5x | ✅ |
| Routes | In-feed | Every 3 routes | ~5x | ✅ |
| Profile | Sidebar | Left column (desktop) | 1x | ✅ |
| Health | Banner | Bottom of page | 1x | ✅ |
| Reels | Full-screen reel | Every 4 reels | ~3x | ✅ |

### Pages WITHOUT Ads (Safety First)
- `/emergency` - Panic button & emergency contacts
- `/resources` - Safety resources
- `/messages` - Private conversations
- `/accompaniment` - Sister accompaniment
- Onboarding flow
- Premium user sessions

### Ad Component Usage
```tsx
import { SmartAd } from "@/components/ads/smart-ad";

// In-feed ad
<SmartAd placement="feed" isPremium={user?.isPremium} />

// Sidebar ad (desktop)
<SmartAd placement="sidebar" />

// Banner ad
<SmartAd placement="banner" />

// Search results ad
<SmartAd placement="search" />

// Footer ad
<SmartAd placement="footer" />
```

### Fallback Behavior
When AdSense is blocked or not configured, elegant placeholder sponsors are shown:
- Women in Tech Summit
- Safe Workspace Certification
- Women-Led Startups Fund
- Free Career Coaching
- Women's Health Initiative

---

## 2. 👑 Premium Subscriptions

### Tiers (Stripe Integration)

| Tier | Monthly | Annual | Features |
|------|---------|--------|----------|
| **Plus** | $5 | $48/yr (20% off) | Ad-free, +50 credits/mo |
| **Pro** | $12 | $115/yr (20% off) | All Plus + priority support, +150 credits/mo |
| **Elite** | $25 | $240/yr (20% off) | All Pro + VIP events, +500 credits/mo |

### Regional Pricing (PPP Adjusted)
- 🇮🇳 India: 35% of US price
- 🇧🇷 Brazil: 45% of US price
- 🇲🇽 Mexico: 50% of US price
- 🇵🇭 Philippines: 40% of US price
- 🇳🇬 Nigeria: 30% of US price

### Premium Benefits
- ✅ Ad-free experience
- ✅ Monthly credit bonus
- ✅ Priority customer support
- ✅ Exclusive badges
- ✅ Early access to features
- ✅ VIP community events

### Implementation
- **Checkout:** `/api/stripe/checkout`
- **Webhooks:** `/api/stripe/webhook`
- **Success Page:** `/premium/success`
- **Config:** `convex/premiumConfig.ts`

---

## 3. 🎁 Virtual Gifts & Super Chats

### Gift Catalog (12 Types)
| Gift | Credits | Animation |
|------|---------|-----------|
| Heart | 5 | Floating hearts |
| Flower | 10 | Blooming flower |
| Star | 25 | Shooting star |
| Crown | 50 | Royal crown |
| Diamond | 100 | Sparkling diamond |
| Rocket | 200 | Launching rocket |
| Rainbow | 300 | Rainbow arc |
| Aurora | 500 | Northern lights |

### Revenue Share
- **Creator:** 85%
- **Platform:** 15%

### Super Chats (Livestreams)
- Minimum: 50 credits
- Pinned for 30 seconds to 5 minutes based on amount
- Creator receives 85% of credit value

---

## 4. 🎪 Paid Events

### Event Types
- Workshops
- Webinars
- Coaching sessions
- Networking events
- Masterclasses

### Revenue Share
- **Host:** 80%
- **Platform:** 20%

### Pricing
- Hosts set their own prices (10-1000 credits)
- Platform handles payment processing
- Automatic payouts to creators

---

## 5. 💳 Credit Purchases

### Packages
| Package | Credits | Price | Bonus |
|---------|---------|-------|-------|
| Starter | 100 | $1.99 | - |
| Popular | 500 | $7.99 | +50 bonus |
| Best Value | 1,500 | $19.99 | +200 bonus |

### Credit Economy
- Earn credits: Posts (+10), Verifications (+5), Referrals (+15)
- Spend credits: Unlock opportunities, Send gifts, Join events

---

## 6. 🏢 B2B Intelligence (Future)

### Planned Products
1. **Safety Data API** - Anonymized safety intelligence for businesses
2. **Workplace Certification** - "Aurora Certified Safe Workplace" badge
3. **Enterprise Dashboard** - Safety analytics for HR teams
4. **Recruitment Tools** - Access to diverse talent pool

### Pricing Model (Planned)
- API: Usage-based ($0.01 per query)
- Certification: $500-5,000/year based on company size
- Enterprise: Custom pricing

---

## 📊 Revenue Optimization Tips

### Maximize Ad Revenue
1. Place ads in high-traffic areas (feed, search)
2. Use native ad formats that blend with content
3. Ensure ads load quickly (lazy loading)
4. A/B test ad placements

### Increase Premium Conversions
1. Show premium benefits prominently
2. Offer free trials
3. Use regional pricing for global reach
4. Highlight ad-free experience

### Grow Creator Economy
1. Promote top creators
2. Feature gift animations
3. Highlight successful events
4. Share creator success stories

---

## 🔒 Safety Promise

**ALL safety features remain FREE forever:**
- ✅ Panic button
- ✅ Emergency contacts
- ✅ Safety resources
- ✅ Sister accompaniment
- ✅ Safety map
- ✅ Route tracking
- ✅ Community support

Revenue is used to:
1. Keep safety features free
2. Improve platform security
3. Expand to more countries
4. Support women's causes

---

## 📈 Metrics to Track

### Ad Performance
- RPM (Revenue per 1,000 impressions)
- CTR (Click-through rate)
- Fill rate
- Viewability

### Subscription Metrics
- MRR (Monthly Recurring Revenue)
- Churn rate
- LTV (Lifetime Value)
- Conversion rate

### Creator Economy
- GMV (Gross Merchandise Value)
- Active creators
- Average gift value
- Event attendance

---

*Last updated: December 2024*
*Maintained by: Aurora App Team*
