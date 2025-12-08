"use client";

/**
 * Language Switcher Component
 * 
 * Non-disruptive language selector for the landing page.
 * Auto-detects user's browser language and allows manual override.
 * Uses LocaleContext for state management to ensure proper re-renders.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  SUPPORTED_LOCALES, 
  SupportedLocale, 
} from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

// Priority languages for the landing page (most common for women's safety)
// Full translations available for: EN, ES, FR, PT, DE, AR
const PRIORITY_LOCALES: SupportedLocale[] = ['en', 'es', 'pt', 'fr', 'de', 'ar'];

// Language flags/emojis for visual recognition
const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  en: '🇬🇧', es: '🇪🇸', pt: '🇧🇷', fr: '🇫🇷', de: '🇩🇪', ar: '🇸🇦',
  it: '🇮🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', hi: '🇮🇳', ru: '🇷🇺',
  tr: '🇹🇷', pl: '🇵🇱', nl: '🇳🇱', sv: '🇸🇪', th: '🇹🇭', vi: '🇻🇳',
};

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'compact',
  className = '' 
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  
  // Use the locale context for state management
  const { locale: currentLocale, setLocale } = useLocale();

  const handleLocaleChange = (locale: SupportedLocale) => {
    setLocale(locale);
    setIsOpen(false);
    setShowAllLanguages(false);
  };

  const displayLocales = showAllLanguages 
    ? Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]
    : PRIORITY_LOCALES;

  const currentLocaleInfo = SUPPORTED_LOCALES[currentLocale];

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 h-10 min-h-[44px] text-[var(--foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded-xl border border-[var(--border)]"
          aria-label={`Change language. Current: ${currentLocaleInfo.name}`}
        >
          <span className="text-base">{LOCALE_FLAGS[currentLocale]}</span>
          <span className="text-sm font-medium">{currentLocaleInfo.nativeName}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => { setIsOpen(false); setShowAllLanguages(false); }}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 min-w-[200px] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-2 border-b border-[var(--border)]">
                  <p className="px-3 py-2 text-xs font-bold text-[var(--color-aurora-purple)] uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Select Your Language
                  </p>
                </div>
                <div className="p-2 max-h-[350px] overflow-y-auto space-y-1">
                  {displayLocales.map((locale) => {
                    const info = SUPPORTED_LOCALES[locale];
                    const isSelected = locale === currentLocale;
                    
                    return (
                      <button
                        key={locale}
                        onClick={() => handleLocaleChange(locale)}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-base transition-colors min-h-[48px] ${
                          isSelected 
                            ? 'bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] border border-[var(--color-aurora-purple)]/30' 
                            : 'hover:bg-[var(--accent)] text-[var(--foreground)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{LOCALE_FLAGS[locale]}</span>
                          <div className="text-left">
                            <span className="font-semibold block">{info.nativeName}</span>
                            <span className="text-xs text-[var(--muted-foreground)]">{info.name}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>
                
                {!showAllLanguages && (
                  <div className="border-t border-[var(--border)] p-2">
                    <button
                      onClick={() => setShowAllLanguages(true)}
                      className="w-full px-3 py-2 text-xs text-[var(--color-aurora-purple)] hover:bg-[var(--accent)] rounded-lg transition-colors text-center font-medium"
                    >
                      Show all {Object.keys(SUPPORTED_LOCALES).length} languages
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant - for settings or dedicated language page
  return (
    <div className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--foreground)]">Language</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Currently: {currentLocaleInfo.nativeName}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {displayLocales.map((locale) => {
          const info = SUPPORTED_LOCALES[locale];
          const isSelected = locale === currentLocale;
          
          return (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isSelected 
                  ? 'bg-[var(--color-aurora-purple)] text-white shadow-lg' 
                  : 'bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 text-[var(--foreground)]'
              }`}
            >
              {isSelected && <Check className="w-4 h-4" />}
              <span className="font-medium">{info.nativeName}</span>
            </button>
          );
        })}
      </div>
      
      {!showAllLanguages && (
        <button
          onClick={() => setShowAllLanguages(true)}
          className="w-full mt-3 py-2 text-sm text-[var(--color-aurora-purple)] hover:underline"
        >
          Show all languages →
        </button>
      )}
    </div>
  );
}
