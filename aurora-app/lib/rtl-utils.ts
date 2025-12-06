/**
 * Task 16.2: RTL (Right-to-Left) Layout Utilities
 * 
 * Provides utilities for Arabic and other RTL languages.
 * Aurora App supports: EN, ES, FR, PT, DE, AR (Arabic is RTL)
 */

// RTL languages supported by Aurora App
export const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: string): boolean {
  return RTL_LANGUAGES.includes(locale.toLowerCase().split("-")[0]);
}

/**
 * Get text direction for a locale
 */
export function getDirection(locale: string): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}

/**
 * Get CSS classes for RTL-aware layouts
 */
export function getRTLClasses(locale: string): string {
  if (!isRTL(locale)) return "";
  
  return "rtl";
}

/**
 * Flip horizontal values for RTL
 * Converts left/right to right/left
 */
export function flipHorizontal(value: "left" | "right", locale: string): "left" | "right" {
  if (!isRTL(locale)) return value;
  return value === "left" ? "right" : "left";
}

/**
 * Get flex direction for RTL
 */
export function getFlexDirection(locale: string): "row" | "row-reverse" {
  return isRTL(locale) ? "row-reverse" : "row";
}

/**
 * RTL-aware margin/padding classes
 * Converts ml-X to mr-X and vice versa for RTL
 */
export function rtlMargin(
  side: "left" | "right",
  size: string,
  locale: string
): string {
  const actualSide = flipHorizontal(side, locale);
  const prefix = actualSide === "left" ? "ml" : "mr";
  return `${prefix}-${size}`;
}

export function rtlPadding(
  side: "left" | "right",
  size: string,
  locale: string
): string {
  const actualSide = flipHorizontal(side, locale);
  const prefix = actualSide === "left" ? "pl" : "pr";
  return `${prefix}-${size}`;
}

/**
 * RTL-aware text alignment
 */
export function rtlTextAlign(
  align: "left" | "right" | "center",
  locale: string
): "left" | "right" | "center" {
  if (align === "center") return "center";
  return flipHorizontal(align, locale);
}

/**
 * RTL-aware icon rotation
 * Some icons (arrows, chevrons) need to be flipped for RTL
 */
export function rtlIconRotation(locale: string): string {
  return isRTL(locale) ? "rotate-180" : "";
}

/**
 * CSS custom properties for RTL
 * Can be applied to :root or specific containers
 */
export const RTL_CSS_VARS = {
  "--direction": "rtl",
  "--text-align": "right",
  "--float-start": "right",
  "--float-end": "left",
  "--margin-start": "margin-right",
  "--margin-end": "margin-left",
  "--padding-start": "padding-right",
  "--padding-end": "padding-left",
  "--border-start": "border-right",
  "--border-end": "border-left",
  "--inset-start": "right",
  "--inset-end": "left",
};

/**
 * Hook-friendly RTL context value
 */
export interface RTLContext {
  isRTL: boolean;
  direction: "ltr" | "rtl";
  flipHorizontal: (value: "left" | "right") => "left" | "right";
  textAlign: (align: "left" | "right" | "center") => "left" | "right" | "center";
  iconRotation: string;
}

export function createRTLContext(locale: string): RTLContext {
  const rtl = isRTL(locale);
  return {
    isRTL: rtl,
    direction: rtl ? "rtl" : "ltr",
    flipHorizontal: (value) => flipHorizontal(value, locale),
    textAlign: (align) => rtlTextAlign(align, locale),
    iconRotation: rtlIconRotation(locale),
  };
}
