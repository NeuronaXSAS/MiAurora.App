// Aurora runtime localization policy
// Production is hard English-only until multilingual support is intentionally reintroduced.

import enTranslations from "./translations/en.json";

export type SupportedLocale = "en";

export const appTranslations: Record<SupportedLocale, Record<string, string>> = {
  en: enTranslations,
};

export const SUPPORTED_LOCALES: Record<
  SupportedLocale,
  { name: string; nativeName: string; rtl?: boolean }
> = {
  en: { name: "English", nativeName: "English" },
};

export const landingTranslations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    "landing.hero.badge": "AI-Powered • Non-Toxic Algorithm",
    "landing.hero.title1": "The",
    "landing.hero.title2": "Future",
    "landing.hero.title3": "of Social Networking",
    "landing.hero.subtitle":
      "The first non-toxic algorithm that cares for your wellbeing.",
    "landing.hero.subtitle2":
      "Built by women. Powered by ethical AI. Zero manipulation.",
    "landing.hero.joinInstantly": "Join instantly with your existing account",
    "landing.hero.noPassword": "No password needed — just one click",
    "landing.hero.continueGoogle": "Continue with Google",
    "landing.hero.continueMicrosoft": "Continue with Microsoft",
    "landing.hero.moreOptions": "More sign in options",
    "landing.hero.neverPost": "🔒 We never post without your permission",
    "landing.hero.freeFeatures": "Free Safety Features",
    "landing.hero.noPasswordNeeded": "No Password Needed",
    "landing.hero.joinSeconds": "Join in 10 Seconds",
    "landing.search.badge": "Explore Before You Join",
    "landing.search.title": "Discover What Women Are Sharing",
    "landing.search.subtitle":
      "Search our community for safety tips, career opportunities, support circles, and more.",
    "landing.search.engineTitle": "The World's First Women-First Search Engine",
    "landing.search.engineSubtitle":
      "Search smarter with AI content detection, gender bias analysis & source credibility scores",
    "landing.search.placeholder":
      "Search anything... safety tips, career advice, places, news",
    "landing.search.aiSummary": "AI Summary",
    "landing.search.womenFirst": "Women-First Perspective",
    "landing.search.webResults": "Web Results",
    "landing.search.community": "Aurora App Community",
    "landing.search.verifiedWomen": "Verified by Women",
    "landing.search.joinFree": "Join Aurora App Free",
    "landing.search.noTracking":
      "🔒 No ads • No data selling • 100% privacy-first",
    "landing.features.aiDetection": "AI Detection",
    "landing.features.aiDetectionDesc": "Spot AI-generated content instantly",
    "landing.features.biasAnalysis": "Bias Analysis",
    "landing.features.biasAnalysisDesc": "Gender & political bias scores",
    "landing.features.credibility": "Credibility",
    "landing.features.credibilityDesc": "Source trust verification",
    "landing.features.noTracking": "No Tracking",
    "landing.features.noTrackingDesc": "100% private searches",
    "landing.footer": "Designed by women, for women. Search with confidence.",
    "landing.why.title": "Why Women Choose",
    "landing.why.subtitle":
      "We built the opposite of toxic social media.",
    "landing.why.otherPlatforms": "Other Platforms",
    "landing.cta.joinFree": "Join Aurora App Free",
  },
};

export function tLanding(key: string, locale: SupportedLocale = "en"): string {
  return landingTranslations[locale]?.[key] || landingTranslations.en[key] || key;
}

export const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    "emergency.panic": "EMERGENCY",
    "emergency.imSafe": "I'm Safe",
    "emergency.help": "Help is on the way",
    "emergency.contacts": "Emergency Contacts",
    "emergency.addContact": "Add Contact",
    "safety.checkin": "Check In",
    "safety.imOk": "I'm OK",
    "safety.schedule": "Schedule Check-in",
    "safety.missed": "Missed Check-in",
    "nav.feed": "Feed",
    "nav.map": "Safety Map",
    "nav.routes": "Routes",
    "nav.emergency": "Emergency",
    "nav.resources": "Resources",
    "nav.circles": "Circles",
    "nav.health": "Health",
    "nav.profile": "Profile",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.share": "Share",
    "common.report": "Report",
    "common.loading": "Loading...",
    "credits.earned": "Credits Earned",
    "credits.balance": "Credit Balance",
  },
};

export function getBrowserLocale(): SupportedLocale {
  return "en";
}

export function t(key: string, locale: SupportedLocale = "en"): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

export function isRTL(locale: SupportedLocale): boolean {
  void locale;
  return false;
}

export function tApp(key: string, locale: SupportedLocale = "en"): string {
  const localeTranslations = appTranslations[locale];
  if (localeTranslations?.[key]) {
    return localeTranslations[key];
  }

  if (appTranslations.en[key]) {
    return appTranslations.en[key];
  }

  return translations.en[key] || key;
}
