"use client";

import { createContext, useContext, ReactNode } from "react";
import { SupportedLocale, tLanding, tApp } from "./i18n";

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (_locale: SupportedLocale) => void;
  t: (key: string) => string;
  tApp: (key: string) => string;
  isRTL: boolean;
}

const ENGLISH_ONLY_CONTEXT: LocaleContextType = {
  locale: "en",
  setLocale: () => {
    // Aurora is intentionally English-only in production for now.
  },
  t: (key: string) => tLanding(key, "en"),
  tApp: (key: string) => tApp(key, "en"),
  isRTL: false,
};

const LocaleContext = createContext<LocaleContextType>(ENGLISH_ONLY_CONTEXT);

export function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <LocaleContext.Provider value={ENGLISH_ONLY_CONTEXT}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
