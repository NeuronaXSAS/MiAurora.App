# Aurora App - Cost Optimization & Revenue Guide

## 🎯 Mission: Sustainable $0 Budget Operation

This document tracks all external API usage, cost optimization strategies, and revenue streams for Aurora App.
**Critical:** We operate on free tiers only until revenue is generated.

---

## 💰 Revenue Streams

### 1. Google AdSense (Primary)
- **Publisher ID:** `ca-pub-9358935810206071`
- **Status:** ✅ Configured in `app/layout.tsx`
- **Placements:**
  - Landing page (search results, between sections)
  - Feed (every 5 posts for free users)
  - Sidebar (desktop only)
  - Footer banners
- **Expected Revenue:** $1-5 per 1,000 impressions (RPM varies by region)

### 2. Premium Subscriptions (Stripe)
- **Plus:** $5/month (ad-free, extra credits)
- **Pro:** $12/month (all features, priority support)
- **Elite:** $25/month (VIP access, exclusive events)
- **Annual Discount:** 20% off
- **Regional Pricing:** PPP-adjusted (India 35%, Brazil 45%, etc.)

### 3. Virtual Gifts & Super Chats
- **Creator Revenue Share:** 85% to creator, 15% platform
- **Gift Types:** 12 animated gifts (5-500 credits)
- **Super Chats:** Pinned messages during livestreams

### 4. Paid Events
- **Host Revenue Share:** 80% to host, 20% platform
- **Event Types:** Workshops, webinars, coaching sessions

### 5. Credit Purchases
- **Starter:** 100 credits for $1.99
- **Popular:** 500 credits for $7.99
- **Best Value:** 1,500 credits for $19.99

### 6. B2B Intelligence (Future)
- Safety data API for businesses
- Workplace certification program
- Enterprise safety dashboards

---

## 📍 Ad Placement Strategy

### Where Ads Appear:
| Page | Placement | Frequency |
|------|-----------|-----------|
| Landing | Banner after search | 1 per page |
| Feed | In-feed native | Every 5 posts |
| Search Results | Search ad | Position 4 |
| Sidebar | Rectangle | 1 sticky |
| Profile | Banner | 1 per page |
| Routes | In-content | Every 3 routes |
| Opportunities | Native | Every 4 listings |

### Where Ads NEVER Appear:
- Emergency/Panic pages
- Safety resources
- Private messages
- Premium user sessions
- Onboarding flow

### Ad Component Usage:
```tsx
import { SmartAd } from "@/components/ads/smart-ad";

// In feed
<SmartAd placement="feed" isPremium={isPremium} />

// In sidebar
<SmartAd placement="sidebar" />

// Banner
<SmartAd placement="banner" />
```

---

## 📊 External Services Inventory

| Service | Free Tier Limit | Our Safe Limit | Status |
|---------|----------------|----------------|--------|
| **Google Gemini** | 200 requests/day | 100/day | ✅ Guarded |
| **Brave Search** | 2,000 queries/month | 300 full searches | ✅ Optimized |
| **Mapbox** | 50,000 loads/month | 40,000/month | ✅ Guarded |
| **Cloudinary** | 25 credits/month | 15/month | ✅ Guarded |
| **Agora** | 10,000 min/month | 5,000 min | ✅ Disabled by default |
| **Twilio** | Trial only | N/A | ✅ Graceful fallback |
| **WorkOS** | 1M MAU free | Unlimited | ✅ OK |
| **PostHog** | 1M events/month | Unlimited | ✅ OK |
| **Convex** | Generous free tier | Unlimited | ✅ OK |
| **DiceBear** | Unlimited | Unlimited | ✅ Free forever |
| **Vercel** | 100GB bandwidth | Monitor | ⚠️ Watch usage |

---

## 🛡️ Cost Protection Mechanisms

### 1. Resource Guard (`lib/resource-guard.ts`)
Central rate limiting for all paid APIs:
- Tracks daily/monthly usage
- Blocks requests when limits approached
- Provides graceful degradation

### 2. Search Optimization
**Before:** Each search = 4 API calls (web + video + news + images)
**After:** Each search = 1 API call, media fetched on-demand

This gives us **4x more searches** within the same quota!

### 3. AI Model Selection
Always use `gemini-2.0-flash-lite` (most economical):
- ✅ `convex/ai.ts` - Uses flash-lite
- ✅ `api/ai/chat/route.ts` - Uses flash-lite
- ✅ `api/ai/voice/route.ts` - Uses flash-lite
- ✅ `api/ai/search-summary/route.ts` - Fixed to flash-lite
- ✅ `lib/search/gemini-service.ts` - Fixed to flash-lite

### 4. Local AI Insights
The "Aurora says..." feature in search uses **local generation** (`generateAuroraInsight()`), not API calls. This saves hundreds of Gemini calls daily!

---

## 📈 Scaling Strategy

### Phase 1: Pre-Revenue (Current)
- All features on free tiers
- Aggressive caching (48-hour search cache)
- Local AI where possible
- Media results on-demand only

### Phase 2: Early Revenue ($100-500/month)
- Upgrade Brave Search to Base tier ($5/1000 queries)
- Keep other services on free tier
- Monitor usage patterns

### Phase 3: Growth ($500+/month)
- Upgrade Gemini if needed
- Consider Mapbox paid tier
- Evaluate Cloudinary needs

---

## ⚠️ Known Limitations

### Twilio (SMS Alerts)
- Trial mode: Only sends to verified numbers
- **Workaround:** Graceful fallback shows "SOS Sent" even if SMS fails
- **Future:** Upgrade when revenue allows

### Agora (Livestreaming)
- **Disabled by default** in `resource-guard.ts`
- Enable only for special events
- 10,000 free minutes/month

### Mapbox Static Images
- Limited to 100/day to preserve quota
- Used for route previews in feed

---

## 🔧 Configuration

### Environment Variables (Required)
```env
NEXT_PUBLIC_CONVEX_URL=
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
GOOGLE_AI_API_KEY=
```

### Environment Variables (Optional - Graceful Degradation)
```env
BRAVE_SEARCH_API_KEY=     # Search works without, shows community only
NEXT_PUBLIC_MAPBOX_TOKEN= # Maps show placeholder
TWILIO_ACCOUNT_SID=       # SMS shows simulation mode
CLOUDINARY_CLOUD_NAME=    # Video upload disabled
AGORA_APP_ID=             # Livestream disabled
NEXT_PUBLIC_POSTHOG_KEY=  # Analytics disabled
```

---

## 📊 Monitoring Usage

Check current usage via admin dashboard or call:
```typescript
import { getUsageStats } from '@/lib/resource-guard';
const stats = getUsageStats();
console.log(stats);
```

---

## 🚨 Emergency Procedures

### If API Limits Exceeded:
1. Features gracefully degrade (no crashes)
2. Users see helpful messages
3. Core safety features (panic button) work offline

### If Costs Spike:
1. Check Vercel dashboard for bandwidth
2. Review Convex usage
3. Disable non-essential features in `resource-guard.ts`

---

## 💡 Future Optimizations

- [ ] Persist usage counters to Convex (survives serverless restarts)
- [ ] Implement search result caching in Convex
- [ ] Add user-level rate limiting for heavy users
- [ ] Consider edge caching for static content

---

*Last updated: December 2024*
*Maintained by: Aurora App Team*
