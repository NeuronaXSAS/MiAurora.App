/**
 * Aurora App — Shared Motion Tokens
 * Consistent animation language across the entire application.
 * Import these instead of defining ad-hoc variants in each component.
 */

import type { Variants, Transition } from "framer-motion";

// ============================================
// SPRINGS & EASINGS
// ============================================

/** Gentle spring for UI elements — buttons, toggles, small cards */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
  mass: 0.8,
};

/** Snappy spring for quick interactions — menus, tooltips */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.6,
};

/** Soft spring for large elements — modals, page sections */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 1,
};

/** Bouncy spring for celebratory/playful moments */
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 12,
  mass: 0.8,
};

/** Standard easing for non-spring animations */
export const easeOut: Transition = {
  duration: 0.3,
  ease: [0, 0, 0.2, 1],
};

export const easeInOut: Transition = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1],
};

// ============================================
// DURATIONS (in seconds)
// ============================================

export const duration = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  page: 0.4,
} as const;

// ============================================
// VARIANT PRESETS
// ============================================

/** Fade in from invisible */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

/** Fade in + slide up — the most common pattern */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springSoft, stiffness: 200, damping: 22 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast } },
};

/** Fade in + slide down — for dropdowns, notifications */
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast } },
};

/** Fade in from left — for sidebars, slide-ins */
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: -20, transition: { duration: duration.fast } },
};

/** Fade in from right */
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: 20, transition: { duration: duration.fast } },
};

/** Scale up from center — for modals, dialogs, toasts */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: springGentle },
  exit: { opacity: 0, scale: 0.95, transition: { duration: duration.fast } },
};

/** Scale up with bounce — for celebratory elements */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
  exit: { opacity: 0, scale: 0.8, transition: { duration: duration.fast } },
};

// ============================================
// PAGE TRANSITIONS
// ============================================

/** Standard page transition — subtle fade + slide */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.page, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: duration.fast },
  },
};

// ============================================
// STAGGER CONTAINERS
// ============================================

/** Container that staggers its children with short delay */
export const staggerContainer = (
  staggerDelay = 0.06,
  delayChildren = 0.1
): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

/** Container for fast stagger — feeds, lists */
export const staggerFast: Variants = staggerContainer(0.04, 0.05);

/** Container for medium stagger — cards, grid items */
export const staggerMedium: Variants = staggerContainer(0.08, 0.1);

/** Container for slow stagger — hero sections, feature grids */
export const staggerSlow: Variants = staggerContainer(0.12, 0.15);

// ============================================
// STAGGER CHILDREN ITEMS
// ============================================

/** Standard stagger child — fade + slide up */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springGentle },
  },
};

/** Stagger child with scale */
export const staggerChildScale: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springGentle },
  },
};

// ============================================
// HOVER / TAP MICRO-INTERACTIONS
// ============================================

/** Subtle lift on hover — for cards */
export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.2 } },
  whileTap: { y: 0, scale: 0.99, transition: { duration: 0.1 } },
};

/** Gentle scale on hover — for buttons, icons */
export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

/** Press effect — for interactive elements */
export const tapPress = {
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
};

// ============================================
// SCROLL-TRIGGERED ANIMATIONS
// ============================================

/** Viewport detection config for scroll animations */
export const scrollTrigger = {
  once: true,
  amount: 0.2 as const,
  margin: "-50px" as string,
};

/** For sections that fade in when scrolled into view */
export const scrollFadeIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ============================================
// NUMBER COUNTER (for stats)
// ============================================

/** 
 * Use with useMotionValue + useTransform + animate.
 * Example:
 *   const count = useMotionValue(0);
 *   const rounded = useTransform(count, v => Math.round(v));
 *   useEffect(() => { animate(count, targetValue, counterTransition); }, []);
 */
export const counterTransition: Transition = {
  duration: 1.5,
  ease: [0.25, 0.1, 0.25, 1],
};
