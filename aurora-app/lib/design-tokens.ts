/**
 * Aurora App Design Tokens
 * Warm, feminine, elegant color palette with dark undertones
 */

export const colors = {
  // Aurora Warm Blush (Primary)
  blush: {
    50: '#FFF5F5',
    100: '#FFE8E8',
    200: '#FFCCD2',
    300: '#FFB3BC',
    400: '#FF8A9B',
    500: '#FF6B7A',
    600: '#E84D5F',
    700: '#C73A4D',
    800: '#A62D3F',
    900: '#8B2335',
  },
  
  // Aurora Cream (Secondary)
  cream: {
    50: '#FFFDFB',
    100: '#FFF8F0',
    200: '#FFEFD9',
    300: '#FFE4C2',
    400: '#FFD4A3',
    500: '#FFC285',
    600: '#E5A66B',
    700: '#CC8B52',
    800: '#B3713C',
    900: '#995A2A',
  },
  
  // Aurora Violet (Accent)
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  
  // Aurora Night (Dark backgrounds)
  night: {
    50: '#F8F7FC',
    100: '#EFEDF5',
    200: '#D8D4E8',
    300: '#B8B0D4',
    400: '#8E82B8',
    500: '#6B5B95',
    600: '#4A3F6B',
    700: '#352D4D',
    800: '#231E35',
    900: '#150F22',
    950: '#0A0712',
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const gradients = {
  // Primary gradients
  auroraGlow: 'linear-gradient(135deg, #FF6B7A 0%, #6C5CE7 50%, #FF6B7A 100%)',
  warmSunset: 'linear-gradient(135deg, #FFE8E8 0%, #FFC285 50%, #FF8A9B 100%)',
  nightBloom: 'linear-gradient(135deg, #0F0B1A 0%, #1A1428 50%, #2A2142 100%)',
  softBlush: 'linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%)',
  
  // Button gradients
  primaryButton: 'linear-gradient(135deg, #6C5CE7 0%, #7C6BFF 100%)',
  secondaryButton: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  
  // Background gradients
  pageBackground: 'linear-gradient(180deg, #0F0B1A 0%, #1A1428 50%, #241D36 100%)',
  cardBackground: 'linear-gradient(135deg, rgba(160,140,200,0.06) 0%, rgba(160,140,200,0.02) 100%)',
  
  // Glass gradients
  glassLight: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
  glassDark: 'linear-gradient(135deg, rgba(26,20,40,0.7) 0%, rgba(26,20,40,0.4) 100%)',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(45, 27, 78, 0.04)',
  md: '0 4px 12px rgba(45, 27, 78, 0.06)',
  lg: '0 8px 24px rgba(45, 27, 78, 0.08)',
  xl: '0 16px 40px rgba(45, 27, 78, 0.12)',
  glow: '0 0 20px rgba(108, 92, 231, 0.2)',
  glowStrong: '0 0 40px rgba(108, 92, 231, 0.35)',
  // Dark mode variants
  darkSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  darkMd: '0 4px 12px rgba(0, 0, 0, 0.25)',
  darkLg: '0 8px 24px rgba(0, 0, 0, 0.3)',
  darkXl: '0 16px 40px rgba(0, 0, 0, 0.4)',
  darkGlow: '0 0 20px rgba(124, 107, 255, 0.2)',
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Cal Sans", "Inter", sans-serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
} as const;

export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;
