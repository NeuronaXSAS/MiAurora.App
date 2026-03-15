"use client";

/**
 * Language Switcher Component
 * 
 * Simple ES/EN pill toggle for the landing page and app.
 * Uses LocaleContext for state management to ensure proper re-renders.
 */

import { motion } from "framer-motion";
import { SupportedLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

const LANGUAGES: { locale: SupportedLocale; label: string; flag: string }[] = [
  { locale: 'es', label: 'ES', flag: '🇪🇸' },
  { locale: 'en', label: 'EN', flag: '🇬🇧' },
];

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'compact',
  className = '' 
}: LanguageSwitcherProps) {
  const { locale: currentLocale, setLocale } = useLocale();

  const handleLocaleChange = (locale: SupportedLocale) => {
    setLocale(locale);
  };

  // Both variants now use the same pill toggle — compact is inline, full has a label
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {variant === 'full' && (
        <span className="text-sm text-[var(--muted-foreground)] mr-1">Idioma / Language</span>
      )}
      <div className="relative flex items-center bg-[var(--accent)] rounded-full p-0.5 border border-[var(--border)]">
        {LANGUAGES.map((lang) => {
          const isSelected = lang.locale === currentLocale;
          return (
            <button
              key={lang.locale}
              onClick={() => handleLocaleChange(lang.locale)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] z-10 ${
                isSelected
                  ? 'text-white'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
              aria-label={`Switch to ${lang.label}`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <motion.div
                  layoutId="lang-pill"
                  className="absolute inset-0 bg-[var(--color-aurora-purple)] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative text-base leading-none">{lang.flag}</span>
              <span className="relative leading-none">{lang.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
