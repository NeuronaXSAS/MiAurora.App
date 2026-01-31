---
description: Aurora App Brand Identity - Official colors, visual system, and design guidelines that MUST be followed in all development
inclusion: always
---

# Aurora App - Brand Identity & Visual System

## 🎯 CRITICAL: Brand Name
**ALWAYS use "Aurora App"** - Never just "Aurora". This distinguishes us from other Aurora brands and maintains our unique identity.

## 🌈 Official Color Palette (STRICT ENFORCEMENT)

### Primary Brand Colors
```css
/* The Atmosphere (Backgrounds) */
--aurora-cream: #fffaf1;      /* Primary light backgrounds, forms, profiles */
--aurora-violet: #3d0d73;     /* Primary dark backgrounds, navigation (also called indigo) */
--aurora-lavender: #c9cef4;   /* Secondary containers, input fields */

/* The Actions (Interactions) */
--aurora-blue: #2e2ad6;       /* Primary CTAs, login buttons, "Next" actions */
--aurora-orange: #ec4c28;     /* ⚠️ PANIC BUTTON ONLY - High priority alerts */
--aurora-purple: #5537a7;     /* Hero gradients, social features */

/* The Emotion (Wellness & Feedback) */
--aurora-pink: #f29de5;       /* Health pillar, hydration, mood, feminine accents */
--aurora-mint: #d6f4ec;       /* Safety success, verified routes, "safe zone" */
--aurora-yellow: #e5e093;     /* Gamification, credits, coins, achievements */
--aurora-salmon: #f05a6b;     /* Error states, destructive actions */
```

### Color Usage Rules (MANDATORY)
1. **Aurora Orange (#ec4c28)** - EXCLUSIVELY for emergency/panic features. Never use for regular buttons or UI elements.
2. **Aurora Blue (#2e2ad6)** - Primary action color for all CTAs and interactive elements.
3. **Aurora Pink (#f29de5)** - Health & wellness features only (cycle tracking, hydration, mood).
4. **Aurora Cream (#fffaf1)** - Light mode primary background.
5. **Aurora Violet (#3d0d73)** - Dark mode primary background.
6. **Aurora Yellow (#e5e093)** - Credits, achievements, gamification elements only.
7. **Aurora Mint (#d6f4ec)** - Safety success states, verified content, safe zones.

### Tailwind Usage
```typescript
// Use CSS variables in Tailwind classes
className="bg-[var(--color-aurora-cream)] text-[var(--color-aurora-violet)]"
className="bg-aurora-cream text-aurora-violet" // If configured in theme
```

## 🎨 Visual Design Principles

### Feminine-First Design
- Every design decision considers women's preferences and needs
- Soft, rounded corners (rounded-xl, rounded-2xl)
- Warm, welcoming color combinations
- Elegant typography with clear hierarchy
- Supportive, empowering messaging

### Component Standards
```typescript
// Buttons
className="px-8 py-4 rounded-xl" // Standard buttons
className="min-h-[56px] min-w-[56px] rounded-full" // Panic button (larger)

// Cards
className="p-6 rounded-2xl shadow-lg" // Standard cards
className="backdrop-blur-sm bg-white/80" // Glass-morphism effect

// Inputs
className="h-12 px-4 rounded-xl border-aurora-lavender"

// Touch targets
className="min-h-[44px] min-w-[44px]" // Minimum for accessibility
```

### Avatar System
- **Style**: DiceBear "lorelei" (feminine-only)
- **Customization**: Feminine hairstyles, earrings, freckles
- **Colors**: Warm, feminine palette matching brand
- **NO masculine traits** - This is a women-focused platform

## 🖼️ Logo & Assets

### Logo Usage
- **File**: `/public/Au_Logo_1.png`
- **Always display with "Aurora App" text**
- **Minimum size**: 44x44px
- **Recommended size**: 60x60px
- **Placement**: Top-left in navigation, centered in auth flows

### Iconography
- Use Lucide React icons for consistency
- Prefer rounded/soft icon variants
- Match icon colors to Aurora palette

## 📱 Theme System

### Light Mode
- Background: Aurora Cream (#fffaf1)
- Text: Aurora Violet (#3d0d73)
- Cards: White with subtle shadows
- Accents: Aurora Blue, Pink, Lavender

### Dark Mode
- Background: Aurora Violet (#3d0d73)
- Text: Aurora Cream (#fffaf1)
- Cards: Darker violet with glass-morphism
- Accents: Aurora Blue, Pink (slightly brighter)

## 🎭 Brand Voice & Messaging

### Tone of Voice
- **Supportive**: "We're here for you"
- **Empowering**: "You've got this"
- **Trustworthy**: "Your safety is our priority"
- **Inclusive**: "Every woman belongs here"

### Key Messages
- "Your Safety. Your Community. Your Growth."
- "Navigate life safely with Aurora App"
- "Community-powered safety intelligence"
- "Made with 💜 for women everywhere"

### Never Say
- Generic safety terms without context
- Anything that could feel patronizing
- Technical jargon without explanation
- Promises we can't keep

## ✨ Animation Guidelines

### Celebration Animations
- Trigger on: Credit earning, achievements, milestones
- Style: Feminine, warm, encouraging
- Particles: Hearts, stars, sparkles in Aurora colors
- Duration: 2-3 seconds, non-intrusive

### Micro-interactions
- Smooth transitions (300ms default)
- Subtle hover effects (lift, glow)
- Loading states with Aurora colors
- Success feedback with Aurora Mint

### Reduced Motion
Always respect `prefers-reduced-motion` for accessibility.

## 🌍 Global Audience & Language

### Primary Language
- **English is the default language** for all UI text, labels, buttons, and content
- Aurora App targets a global audience of women worldwide
- All hardcoded strings must be in English

### Content Guidelines
- Use clear, simple English accessible to non-native speakers
- Avoid idioms, slang, or culturally-specific references
- Keep safety-critical messages short and universally understandable
- Use internationally recognized icons alongside text labels

### Future i18n Considerations
- Structure code to support future localization (avoid hardcoded strings in logic)
- Use consistent terminology across the app
- Consider RTL layout support for future Arabic/Hebrew localization

## 🔒 Brand Protection Checklist

Before shipping any UI:
- [ ] Using official Aurora color codes (no approximations)
- [ ] Logo displayed correctly with "Aurora App" text
- [ ] Feminine-first design principles followed
- [ ] Safety features prominently accessible
- [ ] Orange color ONLY used for emergency features
- [ ] Touch targets meet 44px minimum
- [ ] Accessible color contrast ratios
- [ ] Consistent with existing Aurora App UI
- [ ] All UI text is in English (global audience)

