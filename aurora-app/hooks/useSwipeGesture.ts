import { useEffect, useRef, useState } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Horizontal swipe
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    // Vertical swipe
    else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

export function useSwipeableElement(
  ref: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions
) {
  const swipeHandlers = useSwipeGesture(options);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener("touchstart", swipeHandlers.onTouchStart);
    element.addEventListener("touchmove", swipeHandlers.onTouchMove);
    element.addEventListener("touchend", swipeHandlers.onTouchEnd);

    return () => {
      element.removeEventListener("touchstart", swipeHandlers.onTouchStart);
      element.removeEventListener("touchmove", swipeHandlers.onTouchMove);
      element.removeEventListener("touchend", swipeHandlers.onTouchEnd);
    };
  }, [ref, swipeHandlers]);
}
