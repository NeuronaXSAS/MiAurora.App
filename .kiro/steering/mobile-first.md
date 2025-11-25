---
description: Mobile-first development guidelines for Aurora App
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# Aurora App - Mobile-First Development Guidelines

## Responsive Breakpoints
- Mobile: 375px - 639px (PRIMARY target - design here first)
- Tablet: 640px - 1023px
- Desktop: 1024px+

## Component Requirements

### Touch Targets (CRITICAL for Safety)
- Minimum size: 44x44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- **Panic button: 56x56px minimum** - larger for emergency access
- Bottom navigation items: 48x48px minimum

### Layout Patterns
```typescript
// Stack vertically on mobile, grid on larger screens
className="flex flex-col sm:flex-row"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Cards full-width on mobile
className="w-full md:w-auto"

// Safe area support for iOS
className="pb-safe" // Uses env(safe-area-inset-bottom)
```

### Typography
- Base font size: 16px minimum (prevents iOS zoom)
- Line height: 1.5 for readability
- Truncate long text with ellipsis
- Use Aurora font hierarchy

### Images & Media
- Use Next.js Image component for optimization
- Provide appropriate sizes for different viewports
- Lazy load below-the-fold content
- WebP format preferred

## Aurora App Specific Patterns

### Navigation
```typescript
// Desktop: Fixed sidebar
// Mobile: Collapsible sidebar + bottom navigation
// Emergency: Panic button ALWAYS visible (floating)
```

### Forms on Mobile
```typescript
// One question per screen for complex forms
// Large input fields (h-12 minimum)
// Clear validation messages
// Keyboard-aware scrolling
```

### Offline Indicators
```typescript
// Show offline status clearly
// Queue actions for sync
// Confirm offline emergency actions
```

## Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Bundle size: < 200KB gzipped (stricter for mobile)

## iOS/Android Specific

### iOS
- Safe area insets for notch/home indicator
- Haptic feedback for panic button
- Prevent rubber-banding on critical screens

### Android
- Material-style ripple effects
- Back button handling
- Notification channels for safety alerts

## Testing Checklist
- [ ] Works on 375px width (iPhone SE)
- [ ] Touch targets meet 44px minimum
- [ ] Panic button visible and accessible
- [ ] Forms usable with on-screen keyboard
- [ ] Offline mode functional
- [ ] Safe areas respected on iOS
