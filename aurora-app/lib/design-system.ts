/**
 * Aurora Design System
 * Consistent spacing, typography, and shadows across the app
 */

export const spacing = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "1rem",       // 16px
  lg: "1.5rem",     // 24px
  xl: "2rem",       // 32px
  "2xl": "3rem",    // 48px
  "3xl": "4rem",    // 64px
  "4xl": "6rem",    // 96px
} as const;

export const typography = {
  // Font Sizes
  fontSize: {
    xs: "0.75rem",      // 12px
    sm: "0.875rem",     // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",     // 18px
    xl: "1.25rem",      // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
    "4xl": "2.25rem",   // 36px
    "5xl": "3rem",      // 48px
    "6xl": "3.75rem",   // 60px
    "7xl": "4.5rem",    // 72px
    "8xl": "6rem",      // 96px
  },
  
  // Font Weights
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },
  
  // Line Heights
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
    loose: "2",
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

export const shadows = {
  // Elevation shadows
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  
  // Aurora brand shadows
  aurora: {
    violet: "0 10px 25px -5px rgba(61, 13, 115, 0.3)",
    pink: "0 10px 25px -5px rgba(242, 157, 229, 0.3)",
    blue: "0 10px 25px -5px rgba(46, 42, 214, 0.3)",
  },
  
  // Inner shadows
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  
  // No shadow
  none: "none",
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.125rem",    // 2px
  base: "0.25rem",   // 4px
  md: "0.375rem",    // 6px
  lg: "0.5rem",      // 8px
  xl: "0.75rem",     // 12px
  "2xl": "1rem",     // 16px
  "3xl": "1.5rem",   // 24px
  full: "9999px",
} as const;

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  
  // Easing functions
  easing: {
    linear: "cubic-bezier(0, 0, 1, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

/**
 * Utility function to get consistent spacing
 */
export function getSpacing(size: keyof typeof spacing): string {
  return spacing[size];
}

/**
 * Utility function to get consistent shadow
 */
export function getShadow(size: keyof typeof shadows): string {
  return shadows[size];
}

/**
 * Utility function to apply Aurora brand shadow
 */
export function getAuroraShadow(color: keyof typeof shadows.aurora): string {
  return shadows.aurora[color];
}
