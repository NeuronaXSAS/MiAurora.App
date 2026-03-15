"use client";

// Aurora is intentionally English-only in production for now.

interface LanguageSwitcherProps {
  variant?: "compact" | "full";
  className?: string;
}

export function LanguageSwitcher({
  variant = "compact",
  className = "",
}: LanguageSwitcherProps) {
  void variant;
  void className;
  return null;
}
