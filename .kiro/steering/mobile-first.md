---
description: Mobile-first development guidelines for Aurora App
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# Mobile-First Development Guidelines

## Responsive Breakpoints
- Mobile: 375px - 639px (primary target)
- Tablet: 640px - 1023px
- Desktop: 1024px+

## Component Requirements

### Touch Targets
- Minimum size: 44x44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- Larger targets for critical actions (panic button: 56x56px)

### Layout Patterns
- Stack vertically on mobile, grid on larger screens
- Use `flex-col sm:flex-row` pattern
- Cards should be full-width on mobile

### Typography
- Base font size: 16px minimum (prevents iOS zoom)
- Line height: 1.5 for readability
- Truncate long text with ellipsis

### Images & Media
- Use Next.js Image component for optimization
- Provide appropriate sizes for different viewports
- Lazy load below-the-fold content

## Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Bundle size: < 300KB gzipped
