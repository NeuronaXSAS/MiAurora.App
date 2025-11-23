/**
 * Mobile optimization utilities
 */

/**
 * Check if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get optimal touch target size (minimum 44x44px for accessibility)
 */
export function getTouchTargetSize(size: "sm" | "md" | "lg" = "md"): string {
  const sizes = {
    sm: "min-h-[44px] min-w-[44px]",
    md: "min-h-[48px] min-w-[48px]",
    lg: "min-h-[56px] min-w-[56px]",
  };
  return sizes[size];
}

/**
 * Prevent default touch behavior (useful for custom gestures)
 */
export function preventDefaultTouch(e: TouchEvent) {
  e.preventDefault();
}

/**
 * Enable smooth scrolling on mobile
 */
export function enableSmoothScroll() {
  if (typeof document === "undefined") return;
  document.documentElement.style.scrollBehavior = "smooth";
}

/**
 * Disable smooth scrolling (for performance)
 */
export function disableSmoothScroll() {
  if (typeof document === "undefined") return;
  document.documentElement.style.scrollBehavior = "auto";
}

/**
 * Add haptic feedback (vibration) on mobile
 */
export function hapticFeedback(
  pattern: number | number[] = 10
): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return Promise.resolve();
  }
  
  try {
    navigator.vibrate(pattern);
    return Promise.resolve();
  } catch (error) {
    console.warn("Haptic feedback not supported:", error);
    return Promise.resolve();
  }
}

/**
 * Detect if user is on iOS
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Detect if user is on Android
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Get safe area insets for notched devices
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") return { top: 0, bottom: 0, left: 0, right: 0 };
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue("--sat") || "0"),
    bottom: parseInt(style.getPropertyValue("--sab") || "0"),
    left: parseInt(style.getPropertyValue("--sal") || "0"),
    right: parseInt(style.getPropertyValue("--sar") || "0"),
  };
}

/**
 * Lock scroll (useful for modals on mobile)
 */
export function lockScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
}

/**
 * Unlock scroll
 */
export function unlockScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
}

/**
 * Optimize images for mobile (reduce quality/size)
 */
export function getMobileImageUrl(url: string, width: number = 800): string {
  // If using a CDN, append query params for optimization
  // This is a placeholder - adjust based on your CDN
  if (url.includes("convex")) {
    return url; // Convex handles optimization
  }
  return url;
}

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is in portrait mode
 */
export function isPortrait(): boolean {
  return !isLandscape();
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
