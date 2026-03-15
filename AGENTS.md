# Aurora App - AI-Assisted Development & Steering Guide

This document contains the strict steering guidelines, design identities, and development philosophies for **Aurora App**. Any AI assistant, LLM, or developer working on this codebase **MUST** adhere to these principles. This codebase is fully agent-agnostic.

---

## 1. Brand Identity & Visual System

### The Brand Voice
- **Supportive & Empowering:** Reassuring, empathetic tone. "You've got this", "We're here for you."
- **Language:** English is the default. Keep language accessible, avoiding overly complex technical jargon or slang.

### The Color Palette (STRICT ENFORCEMENT)
*Every UI component must strictly adhere to this exact palette.*

- **The Atmosphere (Backgrounds)**
  - `--aurora-cream` (`#fffaf1`): Primary light mode background.
  - `--aurora-violet` (`#3d0d73`): Primary dark mode background.
  - `--aurora-lavender` (`#c9cef4`): Secondary containers, form inputs.

- **The Actions (Interactions)**
  - `--aurora-blue` (`#2e2ad6`): Primary CTAs, login buttons, neutral actions.
  - `--aurora-orange` (`#ec4c28`): **EXCLUSIVE to the Panic Button** or extreme high-alert safety features. NEVER use for standard errors or general buttons.
  - `--aurora-salmon` (`#f05a6b`): Standard error states or destructive actions.

- **The Emotion (Wellness & Feedback)**
  - `--aurora-pink` (`#f29de5`): Health, cycle, and mood tracking.
  - `--aurora-mint` (`#d6f4ec`): Safety success states, safe routes, verified checks.
  - `--aurora-yellow` (`#e5e093`): Gamification, credits, rewards.

### UI Shape & Micro-interactions
- **Feminine-First Design:** Soft, rounded corners (`rounded-xl`, `rounded-2xl`, `rounded-full`).
- **Animations:** Gentle celebration animations (hearts, sparkles). Respect `prefers-reduced-motion`.

---

## 2. Safety-First Architecture

*Aurora App is a safety platform. Safety features trump all other considerations.*

1. **Accessibility is Mandatory:** WCAG 2.1 AA compliance. Provide clear ARIA labels. Focus indicators must visibly use the Aurora Purple outline.
2. **Offline Resilience:** The Panic Button and Emergency Contact systems must be functional offline. Utilize Service Workers to queue offline actions to sync upon connection.
3. **Privacy by Design:** Avoid logging PII. Anonymous reporting schemas must never attach user IDs to the payload. 
4. **Error Boundaries:** Every critical safety section must be wrapped in a `<ErrorBoundary>` fallbacks. Never let the UI crash entirely without presenting safety options.

---

## 3. Mobile-First Development Rules

*Aurora App's primary usage is on mobile devices in potentially stressful situations.*

- **Target Breakpoints:** Design strictly for `375px` (iPhone SE) first, then scale up explicitly (`sm:`, `md:`, `lg:`).
- **Touch Targets:**
  - Standard interactions must be minimum `44x44px`.
  - The **Panic Button** must be a minimum of `56x56px` and placed prominently.
- **Keyboard & Forms:** Ensure `h-12` minimum height for inputs. Use `pb-safe` classes on iOS to accommodate the home indicator and notch.

---

## 4. Technical Implementation Standards

- **TypeScript:** Strict mode is enforced. Do not use `any`. Define robust interfaces.
- **Convex Schemas:** Always add `userId` mapping for user-scoped data. Include soft-delete vectors (`isActive`, `isDeleted`) and timestamps (`_creationTime`).
- **Database Deployment:** **CRITICAL RULE:** Always sync the schema (`npx convex deploy`) before building or pushing code. 
- **Components:** Separate business logic into React Hooks. Fetch data at the top, handle offline conditions in the middle, and render clean JSX wrapped in `cn()` utility strings.
