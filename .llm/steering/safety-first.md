---
description: Core design principles for Aurora App - Safety-first development guidelines
inclusion: always
---

# Aurora App - Safety-First Design Principles

## Mission Alignment
Every feature in Aurora App must serve one of three core purposes:
1. **Safety** - Protect women from harm
2. **Community** - Connect women for mutual support
3. **Advancement** - Help women access opportunities

## Code Standards

### Security Requirements
- All user data must be encrypted at rest and in transit
- PII must never be logged or exposed in error messages
- Anonymous posting must truly anonymize (no IP tracking, no metadata)
- Emergency features must work offline when possible
- Use Convex authentication with WorkOS for secure SSO

### Accessibility Requirements
- WCAG 2.1 AA compliance required for all UI components
- Keyboard navigation must work for all interactive elements
- Screen reader support with proper ARIA labels
- Color contrast ratios must meet accessibility standards
- Focus indicators must be visible (3px solid, Aurora purple)

### Mobile-First Design
- All components must work on 375px screens minimum
- Touch targets must be at least 44x44px (56px for panic button)
- Critical safety features (panic button) must be always visible
- Offline support for emergency features via Service Worker
- Safe area insets for iOS notch/home indicator

### Privacy by Design
- Collect minimum necessary data
- Provide clear data export and deletion options
- Anonymous options for sensitive content (workplace reports)
- Location data only when explicitly needed and user-consented

## Emergency Feature Guidelines

### Panic Button
- Must be accessible within 1 tap from any screen
- 5-second countdown with cancel option
- Visual and haptic feedback
- Test mode for safe development/demo
- **Color**: Aurora Orange (#ec4c28) - EXCLUSIVE to this feature
- **Size**: Minimum 56x56px, always floating/visible
- **Offline**: Must work without internet connection

### Safety Check-ins
- Grace period before alerting contacts
- Clear confirmation UI with Aurora Mint success states
- Location sharing optional but encouraged
- Push notifications for reminders
- Offline queue for when connection restored

### Safety Resources
- Cached locally for offline access
- Community-verified with trust scores
- Country/city-specific resources
- Categories: Hotlines, Shelters, Legal, Medical, Counseling

## Credit Economy Rules
- Credits reward positive contributions
- No pay-to-win mechanics
- Free tier must include ALL safety features
- Premium features are convenience, not safety-critical
- **Color**: Aurora Yellow (#e5e093) for credit displays
- Celebration animations on credit earning

## Technical Implementation Rules

### Error Handling
```typescript
// Always wrap safety-critical components
<ErrorBoundary fallback={<SafetyFallback />}>
  <PanicButton />
</ErrorBoundary>
```

### Offline Support
```typescript
// Critical features must work offline
if (!navigator.onLine) {
  await queueOfflineAction({ type: 'emergency', data });
  showOfflineConfirmation();
}
```

### Loading States
Every async operation needs loading UI - never leave users wondering if safety features are working.

### TypeScript
- Strict mode enabled
- No `any` types in production code
- Proper typing for all Convex queries/mutations

## Convex Development Rules

### Before Any Deployment
```bash
# ALWAYS sync Convex schema before deploying
npx convex dev --once
```

### Schema Patterns
- Always include `userId` for user-scoped data
- Use string dates (YYYY-MM-DD) for daily tracking
- Include soft delete with `isActive`/`isDeleted` flags
- Add timestamps with `_creationTime`

### Query Patterns
- Use proper indexes for performance
- Implement pagination for large datasets
- Cache frequently accessed data
