"use client";

/**
 * Locale Context Provider
 * 
 * Provides locale state management for the landing page
 * and other public-facing components.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SupportedLocale, getBrowserLocale, tLanding, tApp, SUPPORTED_LOCALES } from "./i18n";

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string) => string;        // Landing page translations
  tApp: (key: string) => string;     // Full app translations
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale from localStorage or browser
  useEffect(() => {
    const stored = localStorage.getItem('aurora-locale') as SupportedLocale;
    if (stored && SUPPORTED_LOCALES[stored]) {
      setLocaleState(stored);
    } else {
      const browserLocale = getBrowserLocale();
      setLocaleState(browserLocale);
    }
    setIsInitialized(true);
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('aurora-locale', newLocale);
  };

  const t = (key: string) => tLanding(key, locale);
  const tAppFn = (key: string) => tApp(key, locale);

  const isRTL = SUPPORTED_LOCALES[locale]?.rtl || false;

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tApp: tAppFn, isRTL }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      locale: 'en' as SupportedLocale,
      setLocale: () => {},
      t: (key: string) => tLanding(key, 'en'),
      tApp: (key: string) => tApp(key, 'en'),
      isRTL: false,
    };
  }
  return context;
}
