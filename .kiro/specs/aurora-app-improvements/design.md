# Design Document - Aurora App UI/UX & Functionality Improvements

## Overview

This design document outlines the technical approach to fix critical bugs, improve brand consistency, and enhance user experience across Aurora App. The improvements are organized into backend fixes, UI/UX enhancements, and feature completions.

## Architecture

### Current Issues Analysis

1. **Backend Errors**: Convex queries failing due to missing error handling
2. **Brand Inconsistency**: Pages using default Tailwind colors instead of Aurora palette
3. **Navigation Issues**: Mobile sidebar opening from wrong side, inconsistent across pages
4. **Mapbox Integration**: Route visualization not implemented in feed/discover views
5. **Avatar System**: Using childlike configurations instead of feminine adult styles

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Aurora App Frontend                       │
├─────────────────────────────────────────────────────────────┤
│  Global Theme Provider (Aurora Colors)                       │
│  ├── Light Mode: Aurora Cream (#fffaf1) background          │
│  └── Dark Mode: Aurora Violet (#3d0d73) background          │
├─────────────────────────────────────────────────────────────┤
│  Navigation System                                           │
│  ├── Desktop: Fixed Sidebar (left) with Aurora branding     │
│  ├── Mobile: Hamburger (LEFT) + Bottom Nav + FAB (+)        │
│  └── Panic Button: Always visible floating                   │
├─────────────────────────────────────────────────────────────┤
│  Shared Components                                           │
│  ├── RouteMapPreview (Mapbox with drawn route)              │
│  ├── AuroraCard (branded card component)                    │
│  ├── AuroraButton (branded button variants)                 │
│  └── ThemeToggle (sun/moon icons)                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Error Boundary Wrapper

```typescript
// components/error-boundary.tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Wraps Convex queries with graceful error handling
function SafeQueryWrapper<T>({
  query: QueryResult<T>,
  fallback: React.ReactNode,
  children: (data: T) => React.ReactNode
})
```

### 2. Route Map Preview Component

```typescript
// components/maps/route-map-preview.tsx
interface RouteMapPreviewProps {
  coordinates: Array<{ lat: number; lng: number }>;
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  distance: number; // meters
  duration: number; // seconds
  rating?: number;
  className?: string;
  interactive?: boolean;
}
```

### 3. Aurora Theme System

```typescript
// lib/aurora-theme.ts
const AURORA_COLORS = {
  cream: '#fffaf1',
  violet: '#3d0d73',
  lavender: '#c9cef4',
  blue: '#2e2ad6',
  orange: '#ec4c28', // PANIC ONLY
  pink: '#f29de5',
  mint: '#d6f4ec',
  yellow: '#e5e093',
  salmon: '#f05a6b',
};

// CSS class utilities
const auroraClasses = {
  lightBg: 'bg-[#fffaf1]',
  darkBg: 'bg-[#3d0d73]',
  lightText: 'text-[#3d0d73]',
  darkText: 'text-[#fffaf1]',
};
```

### 4. Mobile Navigation

```typescript
// components/mobile-navigation.tsx
interface MobileNavigationProps {
  userId: Id<"users">;
}

// Features:
// - Hamburger menu on LEFT side
// - Bottom navigation with Home, Search, +, Messages, Profile
// - FAB (+) for creating posts with beautiful modal
// - Panic button always visible
```

### 5. Avatar Configuration

```typescript
// lib/avatar-config.ts
const FEMININE_AVATAR_CONFIG = {
  style: 'lorelei',
  // Adult feminine options only
  hairStyles: ['long', 'wavy', 'curly', 'ponytail', 'bun', 'braids'],
  accessories: ['earrings', 'necklace', 'headband'],
  // Warm, feminine color palette
  hairColors: ['auburn', 'brunette', 'blonde', 'black', 'red'],
  skinTones: ['light', 'medium', 'tan', 'dark'],
  // NO childlike features
  excludeFeatures: ['childlike', 'cartoon', 'masculine'],
};
```

## Data Models

### No schema changes required

The existing Convex schema is sufficient. The issues are in the frontend query handling and UI implementation.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme Background Consistency
*For any* authenticated page in dark mode, the primary background color should be Aurora Violet (#3d0d73)
**Validates: Requirements 2.3**

### Property 2: Theme Background Consistency (Light)
*For any* authenticated page in light mode, the primary background color should be Aurora Cream (#fffaf1)
**Validates: Requirements 2.4**

### Property 3: Text Contrast Compliance
*For any* text element on any page, the contrast ratio between text and background should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
**Validates: Requirements 2.5**

### Property 4: Sidebar Consistency
*For any* authenticated page, the sidebar should be present with the Aurora App logo and consistent navigation items
**Validates: Requirements 3.4**

### Property 5: Route Metadata Display
*For any* shared route displayed in the feed or discover pages, the distance (in km) and duration (in minutes) should be visible
**Validates: Requirements 4.4**

### Property 6: Mapbox Style Consistency
*For any* map displayed in the application, the Mapbox style should be the configured Aurora App style
**Validates: Requirements 4.5**

## Error Handling

### Convex Query Error Handling

```typescript
// Pattern for all Convex queries
function useSafeQuery<T>(
  query: QueryReference<T>,
  args: QueryArgs<T>
): { data: T | null; isLoading: boolean; error: Error | null } {
  try {
    const result = useQuery(query, args);
    return { data: result, isLoading: result === undefined, error: null };
  } catch (error) {
    return { data: null, isLoading: false, error: error as Error };
  }
}
```

### Graceful Degradation

- **Agora not configured**: Show "Coming Soon" message instead of error
- **Upload credentials fail**: Show retry button with helpful message
- **Chat fails**: Show offline indicator and queue messages

## Testing Strategy

### Dual Testing Approach

We will use both unit tests and property-based tests:

1. **Unit Tests**: Verify specific examples and edge cases
2. **Property-Based Tests**: Verify universal properties across all inputs

### Property-Based Testing Library

We will use **fast-check** for TypeScript property-based testing.

### Test Structure

```typescript
// Example property test
import fc from 'fast-check';

describe('Theme System', () => {
  // **Feature: aurora-app-improvements, Property 1: Theme Background Consistency**
  it('should use Aurora Violet background in dark mode for any page', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AUTHENTICATED_PAGES),
        (page) => {
          // Render page in dark mode
          // Assert background color is #3d0d73
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

```typescript
describe('RouteMapPreview', () => {
  it('should display distance in kilometers', () => {
    render(<RouteMapPreview distance={5000} duration={1800} coordinates={[]} />);
    expect(screen.getByText('5.0 km')).toBeInTheDocument();
  });

  it('should display duration in minutes', () => {
    render(<RouteMapPreview distance={5000} duration={1800} coordinates={[]} />);
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });
});
```

## Geospatial Content System (Map Integration)

### Overview

All content with location data is georeferenced and displayed on the Aurora Map. Users can explore content by location, seeing photos, reels, routes, and opportunities on an interactive map.

### Map Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Aurora Map System                         │
├─────────────────────────────────────────────────────────────┤
│  Mapbox GL JS with Custom Aurora Style                      │
│  ├── Clustering: Supercluster algorithm                     │
│  ├── Progressive loading based on zoom level                │
│  └── Custom markers for each content type                   │
├─────────────────────────────────────────────────────────────┤
│  Content Types on Map                                        │
│  ├── 📍 Posts (photos, text with location)                  │
│  ├── 🎬 Reels (video content)                               │
│  ├── 🛤️ Routes (drawn paths with ratings)                  │
│  ├── 💼 Opportunities (jobs, events)                        │
│  ├── 🔴 Livestreams (active broadcasts)                     │
│  └── ⚠️ Safety alerts (community warnings)                  │
└─────────────────────────────────────────────────────────────┘
```

### Clustering Strategy (No Crowded Points)

```typescript
// lib/maps/clustering.ts
import Supercluster from 'supercluster';

const clusterConfig = {
  radius: 60,      // Cluster radius in pixels
  maxZoom: 16,     // Max zoom to cluster
  minZoom: 0,      // Min zoom to cluster
  minPoints: 2,    // Min points to form cluster
  
  // Progressive reveal based on zoom
  zoomLevels: {
    0-5: 'country_level',    // Show only major clusters
    6-10: 'city_level',      // Show city-level clusters
    11-14: 'neighborhood',   // Show neighborhood clusters
    15+: 'individual',       // Show individual points
  },
};

// Cluster appearance
const clusterStyle = {
  small: { size: 30, color: '#c9cef4' },   // 2-10 items
  medium: { size: 40, color: '#5537a7' },  // 11-50 items
  large: { size: 50, color: '#3d0d73' },   // 50+ items
};
```

### Custom Markers by Content Type

```typescript
// components/maps/content-markers.tsx
const CONTENT_MARKERS = {
  post: {
    icon: 'camera',
    color: '#f29de5', // Aurora Pink
    size: 32,
  },
  reel: {
    icon: 'video',
    color: '#2e2ad6', // Aurora Blue
    size: 32,
    pulse: true, // Animated for video content
  },
  route: {
    icon: 'route',
    color: '#d6f4ec', // Aurora Mint
    size: 36,
    showPath: true, // Draw route line on hover
  },
  opportunity: {
    icon: 'briefcase',
    color: '#e5e093', // Aurora Yellow
    size: 32,
  },
  livestream: {
    icon: 'radio',
    color: '#ec4c28', // Aurora Orange (live = urgent)
    size: 40,
    pulse: true,
    badge: 'LIVE',
  },
  safety_alert: {
    icon: 'alert-triangle',
    color: '#f05a6b', // Aurora Salmon
    size: 36,
    priority: 'high',
  },
};
```

### Map Interaction Flow

```typescript
// User taps on map point
// 1. If cluster: Zoom in to reveal individual points
// 2. If individual point: Show content preview popup

interface MapPopupContent {
  type: ContentType;
  preview: {
    thumbnail?: string;      // Image/video thumbnail
    title: string;
    author: UserPreview;
    rating?: number;         // For routes
    engagement: {
      likes: number;
      comments: number;
    };
  };
  actions: ['view', 'like', 'share', 'directions'];
}
```

### Progressive Content Loading

```typescript
// Load content based on visible map area
async function loadMapContent(bounds: MapBounds, zoom: number) {
  // 1. Get content within bounds
  const content = await fetchContentInBounds(bounds);
  
  // 2. Apply clustering based on zoom
  const clustered = cluster.getClusters(
    [bounds.west, bounds.south, bounds.east, bounds.north],
    Math.floor(zoom)
  );
  
  // 3. Load thumbnails only for visible clusters
  const visibleContent = clustered.slice(0, 100); // Limit for performance
  
  // 4. Lazy load full content on tap
  return visibleContent;
}
```

### Route Visualization on Map

```typescript
// When viewing a route on map
interface RouteMapView {
  // Draw the actual path
  path: {
    coordinates: [number, number][];
    color: '#2e2ad6'; // Aurora Blue
    width: 4;
    dashArray?: [2, 2]; // Dashed for planned routes
  };
  
  // Start/end markers
  markers: {
    start: { icon: 'play', color: '#d6f4ec' };
    end: { icon: 'flag', color: '#f29de5' };
  };
  
  // Safety annotations along route
  annotations: SafetyAnnotation[];
}
```

### Map Filter System

```typescript
// Users can filter what they see on map
const MAP_FILTERS = {
  contentTypes: ['posts', 'reels', 'routes', 'opportunities', 'livestreams'],
  timeRange: ['today', 'this_week', 'this_month', 'all_time'],
  rating: [1, 2, 3, 4, 5], // Minimum rating
  safety: ['verified_safe', 'caution', 'all'],
};
```

### Heatmap Layer (Safety Intelligence)

```typescript
// Optional heatmap showing safety density
const safetyHeatmap = {
  enabled: false, // Toggle by user
  colors: {
    safe: '#d6f4ec',    // Aurora Mint
    neutral: '#e5e093', // Aurora Yellow
    caution: '#f05a6b', // Aurora Salmon
  },
  data: urbanSafetyIndex, // From B2B intelligence
};
```

## Feed System (Reddit-Level Engagement)

### Feed Architecture

```typescript
// The feed should be as robust and scalable as Reddit
// with the beauty and engagement of TikTok

interface FeedPost {
  id: string;
  type: 'standard' | 'route' | 'poll' | 'reel' | 'livestream';
  author: User;
  content: PostContent;
  engagement: {
    upvotes: number;
    downvotes: number;
    comments: number;
    shares: number;
    gifts: Gift[]; // Virtual gifts received
  };
  createdAt: Date;
}
```

### Feed Features

1. **Infinite Scroll** with virtualization (handles 10,000+ posts)
2. **Pull to Refresh** with haptic feedback
3. **Quick Actions** - Upvote, comment, share, gift (swipe gestures)
4. **Rich Media** - Images, videos, maps, polls
5. **Threaded Comments** - Reddit-style nested discussions
6. **Real-time Updates** - New posts appear without refresh

### Feed Engagement Mechanics

```typescript
// Engagement actions available on every post
const FEED_ACTIONS = {
  vote: { upvote: '+1 trust', downvote: '-1 trust' },
  comment: { reward: '2 credits per quality comment' },
  share: { reward: '5 credits when shared post gets engagement' },
  gift: { options: VIRTUAL_GIFTS }, // See gift system below
  save: { bookmark for later },
  report: { community moderation },
};
```

## Virtual Gifts & Donations System (Stripe Integration)

### Gift Economy Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Aurora Gift Economy                       │
├─────────────────────────────────────────────────────────────┤
│  User buys Aurora Gems (virtual currency) via Stripe        │
│  ├── $0.99 = 100 Gems                                       │
│  ├── $4.99 = 550 Gems (10% bonus)                          │
│  ├── $9.99 = 1200 Gems (20% bonus)                         │
│  └── $49.99 = 7000 Gems (40% bonus)                        │
├─────────────────────────────────────────────────────────────┤
│  User sends Virtual Gift (costs Gems)                       │
│  ├── 💜 Purple Heart = 10 Gems ($0.10)                     │
│  ├── 🌸 Cherry Blossom = 50 Gems ($0.50)                   │
│  ├── 💎 Diamond = 100 Gems ($1.00)                         │
│  ├── 👑 Crown = 500 Gems ($5.00)                           │
│  ├── 🦋 Aurora Butterfly = 1000 Gems ($10.00)              │
│  └── 🌟 Supernova = 5000 Gems ($50.00)                     │
├─────────────────────────────────────────────────────────────┤
│  Creator receives gift value                                │
│  ├── Aurora App takes 20% platform fee                     │
│  ├── Creator receives 80% in Aurora Balance                │
│  └── Creator can withdraw to bank via Stripe Connect       │
└─────────────────────────────────────────────────────────────┘
```

### Virtual Gifts (Feminine Jewelry Theme)

```typescript
// lib/gifts/virtual-gifts.ts
const VIRTUAL_GIFTS = [
  // Tier 1: Micro gifts (casual appreciation)
  { id: 'purple_heart', name: 'Purple Heart', emoji: '💜', gems: 10, animation: 'float' },
  { id: 'cherry_blossom', name: 'Cherry Blossom', emoji: '🌸', gems: 25, animation: 'petals' },
  { id: 'sparkles', name: 'Sparkles', emoji: '✨', gems: 50, animation: 'shimmer' },
  
  // Tier 2: Standard gifts (meaningful support)
  { id: 'rose', name: 'Aurora Rose', emoji: '🌹', gems: 100, animation: 'bloom' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', gems: 200, animation: 'shine' },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', gems: 300, animation: 'flutter' },
  
  // Tier 3: Premium gifts (significant support)
  { id: 'crown', name: 'Queen Crown', emoji: '👑', gems: 500, animation: 'royal' },
  { id: 'aurora', name: 'Aurora Lights', emoji: '🌌', gems: 1000, animation: 'aurora' },
  { id: 'goddess', name: 'Goddess Tiara', emoji: '👸', gems: 2000, animation: 'goddess' },
  
  // Tier 4: Legendary gifts (major support)
  { id: 'supernova', name: 'Supernova', emoji: '🌟', gems: 5000, animation: 'explosion' },
  { id: 'universe', name: 'Universe', emoji: '🌌', gems: 10000, animation: 'cosmic' },
];
```

### Gift Animations

```typescript
// components/gifts/gift-animation.tsx
// Beautiful, feminine animations when gifts are sent
// - Hearts floating up
// - Petals falling
// - Sparkles bursting
// - Aurora lights dancing
// - Crown appearing with fanfare
```

### Stripe Integration

```typescript
// lib/stripe/gift-payments.ts
import Stripe from 'stripe';

// 1. User purchases Gems
async function purchaseGems(userId: string, packageId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: GEM_PACKAGES[packageId].stripePriceId, quantity: 1 }],
    success_url: `${BASE_URL}/gems/success`,
    cancel_url: `${BASE_URL}/gems/cancel`,
    metadata: { userId, packageId },
  });
  return session.url;
}

// 2. Creator connects Stripe account
async function connectCreatorAccount(userId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US', // Or user's country
    capabilities: { transfers: { requested: true } },
  });
  // Save account.id to user profile
}

// 3. Creator withdraws earnings
async function withdrawEarnings(userId: string, amount: number) {
  // Transfer from Aurora platform to creator's connected account
  const transfer = await stripe.transfers.create({
    amount: Math.floor(amount * 100), // cents
    currency: 'usd',
    destination: user.stripeAccountId,
  });
}
```

### Revenue Split

```typescript
const REVENUE_SPLIT = {
  creator: 0.80, // 80% to content creator
  platform: 0.20, // 20% to Aurora App
};

// Example: User sends 1000 Gems ($10 value)
// Creator receives: $8.00
// Aurora App receives: $2.00
```

### Gift Notifications

```typescript
// When someone receives a gift:
// 1. Real-time notification with animation
// 2. Push notification if not in app
// 3. Gift appears on their post/stream
// 4. Balance updates immediately
// 5. Option to thank the sender
```

### Creator Payout Flow

```typescript
// 1. Creator earns gifts
// 2. Gems convert to Aurora Balance (80% of value)
// 3. When balance >= $10, can request payout
// 4. First payout requires Stripe Connect setup
// 5. Payouts processed within 2-5 business days
// 6. Creator receives notification when paid
```

### Gift Leaderboards

```typescript
// Show top gifters and top earners
// - Weekly top gifters (recognition)
// - Monthly top creators (by gifts received)
// - All-time supporters
// Creates social proof and encourages gifting
```

## Advertising Strategy (Non-Disruptive)

### Ad Placement Guidelines

```typescript
// lib/ads/ad-placements.ts
const AD_PLACEMENTS = {
  // ALLOWED placements (non-disruptive)
  feedInterstitial: {
    position: 'every 5th post',
    type: 'native',
    style: 'matches feed card design',
    dismissible: true,
  },
  routeCompletion: {
    position: 'after completing a route',
    type: 'rewarded',
    reward: '5 credits',
    optional: true,
  },
  settingsFooter: {
    position: 'bottom of settings page',
    type: 'banner',
    size: 'small',
  },
  
  // NEVER show ads in:
  // - Emergency/panic features
  // - Safety check-ins
  // - Health tracking (cycle, hydration)
  // - During onboarding
  // - In messages/DMs
};
```

### Ad Loading Strategy

```typescript
// Lazy load ads to not block critical content
const AdComponent = dynamic(() => import('./ad-banner'), {
  ssr: false,
  loading: () => null, // No placeholder, seamless
});

// Only load ads after main content is interactive
useEffect(() => {
  if (isContentLoaded && !isPremiumUser) {
    loadAds();
  }
}, [isContentLoaded, isPremiumUser]);
```

### Premium Ad-Free Experience

- Premium users see NO ads
- Free users see non-disruptive native ads
- Safety features are ALWAYS ad-free

## Performance Optimization (Slow Connections & Old Devices)

### Target: YouTube Mobile Web Performance

Reference: YouTube mobile web works excellently on slow connections because of:
1. Progressive loading
2. Aggressive caching
3. Skeleton screens
4. Lazy loading
5. Optimized bundle sizes

### Bundle Optimization

```typescript
// next.config.ts
const config = {
  // Code splitting by route
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Compress images aggressively
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 750, 828, 1080],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};
```

### Progressive Loading Strategy

```typescript
// 1. Critical content first (< 50KB)
// 2. Above-the-fold images
// 3. Interactive elements
// 4. Below-the-fold content
// 5. Ads (last priority)

const LoadingPriority = {
  CRITICAL: 0,    // Navigation, panic button
  HIGH: 1,        // Main content skeleton
  MEDIUM: 2,      // Images, maps
  LOW: 3,         // Comments, suggestions
  DEFERRED: 4,    // Ads, analytics
};
```

### Skeleton Screens (Instant Feedback)

```typescript
// components/skeletons/feed-skeleton.tsx
// Show immediately while content loads
// Matches exact layout to prevent layout shift
// Uses Aurora brand colors for shimmer effect
```

### Offline-First with Service Worker

```typescript
// public/sw.js enhancements
const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: 'cache-first',
  
  // Network first for API, fallback to cache
  api: 'network-first',
  
  // Stale-while-revalidate for images
  images: 'stale-while-revalidate',
  
  // Cache only for critical safety features
  emergency: 'cache-only',
};
```

### Image Optimization

```typescript
// components/optimized-image.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  // Automatically:
  // - Uses WebP/AVIF
  // - Lazy loads below fold
  // - Shows blur placeholder
  // - Responsive sizes
}
```

### Connection-Aware Loading

```typescript
// hooks/use-connection.ts
function useConnection() {
  const [connectionType, setConnectionType] = useState<'fast' | 'slow' | 'offline'>('fast');
  
  useEffect(() => {
    const connection = navigator.connection;
    if (connection) {
      // Adjust quality based on connection
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        setConnectionType('slow');
      }
    }
  }, []);
  
  return connectionType;
}

// Usage: Load lower quality images on slow connections
const imageQuality = connectionType === 'slow' ? 50 : 85;
```

### Memory Management for Old Devices

```typescript
// Virtualize long lists (feed, messages)
import { useVirtualizer } from '@tanstack/react-virtual';

// Limit concurrent image loads
const MAX_CONCURRENT_IMAGES = 3;

// Cleanup unused resources
useEffect(() => {
  return () => {
    // Revoke object URLs
    // Clear cached data
    // Cancel pending requests
  };
}, []);
```

### Performance Targets

| Metric | Target (Fast) | Target (Slow 3G) |
|--------|---------------|------------------|
| FCP | < 1.5s | < 3s |
| LCP | < 2.5s | < 5s |
| TTI | < 3s | < 8s |
| Bundle (initial) | < 150KB | < 150KB |
| Images | WebP/AVIF | Low-quality placeholders |

## Implementation Priority

### Phase 1: Critical Fixes (Backend Errors)
1. Fix cycleTracker query error handling
2. Fix hydration query error handling
3. Fix assistant chat functionality
4. Add graceful Agora/upload error handling

### Phase 2: Brand Consistency
1. Update globals.css with Aurora theme variables
2. Update sidebar with Aurora branding and logo
3. Fix theme toggle icons (sun/moon)
4. Update all pages to use Aurora backgrounds

### Phase 3: Navigation
1. Move hamburger menu to LEFT side
2. Ensure sidebar consistency across pages
3. Fix /routes/track mobile responsiveness

### Phase 4: Mapbox Integration
1. Create RouteMapPreview component
2. Integrate into feed posts
3. Integrate into /routes/discover
4. Add distance/duration display

### Phase 5: Page Redesigns
1. /legal/privacy and /terms - fix contrast
2. /credits - Aurora branding
3. /settings - fix light mode contrast
4. /intelligence, /messages, /opportunities - redesign
5. /routes - improve design

### Phase 6: Avatar & Onboarding
1. Update avatar configuration for feminine adults
2. Add Aurora logo to onboarding
3. Apply Aurora colors to onboarding form

### Phase 7: Performance Optimization
1. Implement skeleton screens for all pages
2. Add connection-aware loading
3. Optimize bundle sizes (code splitting)
4. Implement image optimization pipeline
5. Add virtualization for long lists (feed, messages)
6. Enhance Service Worker caching strategies

### Phase 8: Non-Disruptive Ads
1. Create native ad component matching feed design
2. Implement ad placement strategy (every 5th post)
3. Add rewarded ads for route completion
4. Ensure premium users see no ads
5. Never show ads in safety/emergency features

