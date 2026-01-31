---
description: Aurora App Technical Architecture - Stack, patterns, and development standards
inclusion: always
---

# Aurora App - Technical Architecture

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS + CSS Variables (Aurora palette)
- **Components**: shadcn/ui + Custom Aurora Components
- **Animations**: Framer Motion + CSS animations
- **State**: React Context + Convex Queries
- **TypeScript**: Strict mode enabled (no `any` types)

### Backend
- **Database**: Convex (Real-time, serverless)
- **Authentication**: WorkOS (Google/Microsoft SSO only)
- **File Storage**: Convex File Storage
- **Real-time**: Convex Subscriptions

### Infrastructure
- **Hosting**: Vercel (primary) / Cloudflare (alternative)
- **CDN**: Vercel Edge Network
- **Offline**: Service Worker with critical feature caching

## 📁 File Organization

```
aurora-app/
├── app/                    # Next.js App Router
│   ├── (authenticated)/    # Protected routes (require login)
│   ├── api/               # API routes
│   └── globals.css        # Global styles + Aurora CSS variables
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   └── [feature]/        # Feature-specific components
├── convex/               # Backend functions & schema
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
└── public/               # Static assets (logo, icons)
```

## 🔧 Naming Conventions

- **Components**: PascalCase (`SafetyCheckin.tsx`)
- **Files**: kebab-case (`safety-checkin.tsx`)
- **Functions**: camelCase (`getTodayHydration`)
- **Constants**: UPPER_SNAKE_CASE (`AURORA_COLORS`)
- **Convex tables**: camelCase (`safetyCheckins`)
- **CSS classes**: Tailwind utilities + Aurora custom classes

## 📊 Database Schema Patterns

### Required Fields
```typescript
// User-scoped data MUST include userId
{
  userId: v.id("users"),
  // ... other fields
}

// Daily tracking uses string dates
{
  date: v.string(), // Format: "YYYY-MM-DD"
}

// Soft delete pattern
{
  isActive: v.optional(v.boolean()),
  isDeleted: v.optional(v.boolean()),
}
```

### Core Tables
- `users` - Central identity with WorkOS integration
- `safetyCheckins` - Scheduled wellness checks
- `workplaceReports` - Anonymous incident reporting
- `safetyResources` - Verified safety resources
- `circles` - Support groups/communities
- `circleMembers` - Circle membership
- `hydrationLogs` - Daily water tracking
- `cycleLogs` - Menstrual health tracking

## 🎨 Component Patterns

### Standard Component Structure
```typescript
interface ComponentProps {
  userId: Id<"users">;
  variant?: 'primary' | 'secondary';
  className?: string;
  onAction?: () => void;
}

export function Component({ 
  userId, 
  variant = 'primary', 
  className = '', 
  onAction 
}: ComponentProps) {
  // 1. Hooks at the top
  const data = useQuery(api.getData, { userId });
  const [state, setState] = useState();
  
  // 2. Event handlers
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);
  
  // 3. Early returns for loading/error
  if (!data) return <LoadingSkeleton />;
  
  // 4. Main render
  return (
    <div className={cn("base-styles", className)}>
      {/* Component content */}
    </div>
  );
}
```

### Styling Patterns
```typescript
// Use Aurora CSS variables
className="bg-[var(--color-aurora-cream)] text-[var(--color-aurora-violet)]"

// Consistent spacing
className="p-6 gap-4 rounded-2xl" // Cards
className="px-8 py-4 rounded-xl" // Buttons
className="h-12 px-4 rounded-xl" // Inputs

// Responsive patterns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## 🔐 Authentication Flow

1. User clicks "Sign in with Google/Microsoft"
2. WorkOS handles OAuth flow
3. Callback creates/updates user in Convex
4. JWT token stored for session
5. Protected routes check authentication

```typescript
// Check auth in Convex functions
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Unauthorized");
}
```

## 📱 Offline Support

### Service Worker Strategy
```javascript
// Cache critical assets
const CRITICAL_CACHE = [
  '/offline',
  '/emergency',
  '/api/emergency-contacts',
];

// Queue offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-sync') {
    event.waitUntil(syncEmergencyData());
  }
});
```

### Offline-First Features
- Panic button activation
- Emergency contact list
- Safety resources (cached)
- Queued check-ins

## 🚀 Deployment Checklist

### Before Every Deploy
```bash
# 1. Type check
npm run type-check

# 2. Build verification
npm run build

# 3. Sync Convex schema (CRITICAL!)
npx convex dev --once

# 4. Commit and push
git add .
git commit -m "feat: description"
git push
```

### Environment Variables Required
```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_WORKOS_CLIENT_ID=
WORKOS_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## 📈 Performance Targets

- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **CLS**: < 0.1
- **Initial bundle**: < 200KB gzipped
- **Route chunks**: < 100KB gzipped

## 🧪 Testing Strategy

### Critical Test Scenarios
- Authentication flow works
- Panic button functions offline
- Data persists correctly
- Responsive design on all devices
- Accessibility compliance

### Test Commands
```bash
# E2E tests with Playwright
npm run test:e2e

# Type checking
npm run type-check
```

