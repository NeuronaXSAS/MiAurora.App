---
description: Core design principles for Aurora App - Safety-first development guidelines
inclusion: always
---

# Aurora App - Safety-First Design Principles

## Mission Alignment
Every feature in Aurora must serve one of three core purposes:
1. **Safety** - Protect women from harm
2. **Community** - Connect women for mutual support
3. **Advancement** - Help women access opportunities

## Code Standards

### Security Requirements
- All user data must be encrypted at rest and in transit
- PII must never be logged or exposed in error messages
- Anonymous posting must truly anonymize (no IP tracking, no metadata)
- Emergency features must work offline when possible

### Accessibility Requirements
- WCAG 2.1 AA compliance required for all UI components
- Keyboard navigation must work for all interactive elements
- Screen reader support with proper ARIA labels
- Color contrast ratios must meet accessibility standards

### Mobile-First Design
- All components must work on 375px screens minimum
- Touch targets must be at least 44x44px
- Critical safety features (panic button) must be always visible
- Offline support for emergency features

### Privacy by Design
- Collect minimum necessary data
- Provide clear data export and deletion options
- Anonymous options for sensitive content
- Location data only when explicitly needed

## Emergency Feature Guidelines

### Panic Button
- Must be accessible within 1 tap from any screen
- 5-second countdown with cancel option
- Visual and haptic feedback
- Test mode for safe development/demo

### Safety Check-ins
- Grace period before alerting contacts
- Clear confirmation UI
- Location sharing optional but encouraged

## Credit Economy Rules
- Credits reward positive contributions
- No pay-to-win mechanics
- Free tier must include all safety features
- Premium features are convenience, not safety-critical
