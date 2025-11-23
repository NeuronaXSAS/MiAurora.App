"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { hapticFeedback } from "@/lib/mobile-utils";
import { forwardRef } from "react";
import { VariantProps } from "class-variance-authority";

interface MobileTouchButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  haptic?: boolean;
  hapticPattern?: number | number[];
  asChild?: boolean;
}

/**
 * Mobile-optimized button with touch-friendly size and haptic feedback
 */
export const MobileTouchButton = forwardRef<
  HTMLButtonElement,
  MobileTouchButtonProps
>(({ haptic = false, hapticPattern = 10, onClick, className, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic) {
      hapticFeedback(hapticPattern);
    }
    onClick?.(e);
  };

  return (
    <Button
      ref={ref}
      onClick={handleClick}
      className={`min-h-[44px] active:scale-95 transition-transform ${className || ""}`}
      {...props}
    />
  );
});

MobileTouchButton.displayName = "MobileTouchButton";
