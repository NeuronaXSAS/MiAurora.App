// Internationalization support for Aurora App
// Making the platform accessible to women worldwide
// Zero-cost i18n - all translations are built-in JSON files
// Supported: Spanish (default) and English

// Import translation JSON files
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';

export type SupportedLocale = 'es' | 'en';

// Full app translations loaded from JSON files
export const appTranslations: Record<string, Record<string, string>> = {
  es: esTranslations,
  en: enTranslations,
};

export const SUPPORTED_LOCALES: Record<SupportedLocale, { name: string; nativeName: string; rtl?: boolean }> = {
  es: { name: 'Spanish', nativeName: 'Español' },
  en: { name: 'English', nativeName: 'English' },
};

// Landing page translations
export const landingTranslations: Record<SupportedLocale, Record<string, string>> = {
  es: {
    'landing.hero.badge': 'Impulsado por IA • Algoritmo No Tóxico',
    'landing.hero.title1': 'El',
    'landing.hero.title2': 'Futuro',
    'landing.hero.title3': 'de las Redes Sociales',
    'landing.hero.subtitle': 'El primer algoritmo no tóxico que cuida tu bienestar.',
    'landing.hero.subtitle2': 'Creado por mujeres. Impulsado por IA ética. Sin manipulación.',
    'landing.hero.joinInstantly': 'Únete al instante con tu cuenta existente',
    'landing.hero.noPassword': 'Sin contraseña — solo un clic',
    'landing.hero.continueGoogle': 'Continuar con Google',
    'landing.hero.continueMicrosoft': 'Continuar con Microsoft',
    'landing.hero.moreOptions': 'Más opciones de inicio',
    'landing.hero.neverPost': '🔒 Nunca publicamos sin tu permiso',
    'landing.hero.freeFeatures': 'Funciones de Seguridad Gratis',
    'landing.hero.noPasswordNeeded': 'Sin Contraseña',
    'landing.hero.joinSeconds': 'Únete en 10 Segundos',
    'landing.search.badge': 'Explora Antes de Unirte',
    'landing.search.title': 'Descubre lo que Comparten las Mujeres',
    'landing.search.subtitle': 'Busca consejos de seguridad, oportunidades laborales, círculos de apoyo y más.',
    'landing.search.engineTitle': 'El Primer Motor de Búsqueda para Mujeres',
    'landing.search.engineSubtitle': 'Busca de forma inteligente con detección de IA, análisis de sesgo y puntuación de credibilidad',
    'landing.search.placeholder': 'Busca cualquier cosa... seguridad, carrera, lugares, noticias',
    'landing.search.aiSummary': 'Resumen de IA',
    'landing.search.womenFirst': 'Perspectiva para Mujeres',
    'landing.search.webResults': 'Resultados Web',
    'landing.search.community': 'Comunidad Aurora App',
    'landing.search.verifiedWomen': 'Verificado por Mujeres',
    'landing.search.joinFree': 'Únete a Aurora App Gratis',
    'landing.search.noTracking': '🔒 Sin anuncios • Sin venta de datos • 100% privacidad',
    'landing.features.aiDetection': 'Detección de IA',
    'landing.features.aiDetectionDesc': 'Detecta contenido generado por IA',
    'landing.features.biasAnalysis': 'Análisis de Sesgo',
    'landing.features.biasAnalysisDesc': 'Puntuación de sesgo de género',
    'landing.features.credibility': 'Credibilidad',
    'landing.features.credibilityDesc': 'Verificación de fuentes',
    'landing.features.noTracking': 'Sin Rastreo',
    'landing.features.noTrackingDesc': 'Búsquedas 100% privadas',
    'landing.footer': 'Diseñado por mujeres, para mujeres. Busca con confianza.',
    'landing.why.title': 'Por qué las Mujeres Eligen',
    'landing.why.subtitle': 'Construimos lo opuesto a las redes sociales tóxicas.',
    'landing.why.otherPlatforms': 'Otras Plataformas',
    'landing.cta.joinFree': 'Únete a Aurora App Gratis',
  },
  en: {
    'landing.hero.badge': 'AI-Powered • Non-Toxic Algorithm',
    'landing.hero.title1': 'The',
    'landing.hero.title2': 'Future',
    'landing.hero.title3': 'of Social Networking',
    'landing.hero.subtitle': 'The first non-toxic algorithm that cares for your wellbeing.',
    'landing.hero.subtitle2': 'Built by women. Powered by ethical AI. Zero manipulation.',
    'landing.hero.joinInstantly': 'Join instantly with your existing account',
    'landing.hero.noPassword': 'No password needed — just one click',
    'landing.hero.continueGoogle': 'Continue with Google',
    'landing.hero.continueMicrosoft': 'Continue with Microsoft',
    'landing.hero.moreOptions': 'More sign in options',
    'landing.hero.neverPost': '🔒 We never post without your permission',
    'landing.hero.freeFeatures': 'Free Safety Features',
    'landing.hero.noPasswordNeeded': 'No Password Needed',
    'landing.hero.joinSeconds': 'Join in 10 Seconds',
    'landing.search.badge': 'Explore Before You Join',
    'landing.search.title': 'Discover What Women Are Sharing',
    'landing.search.subtitle': 'Search our community for safety tips, career opportunities, support circles, and more.',
    'landing.search.engineTitle': "The World's First Women-First Search Engine",
    'landing.search.engineSubtitle': 'Search smarter with AI content detection, gender bias analysis & source credibility scores',
    'landing.search.placeholder': 'Search anything... safety tips, career advice, places, news',
    'landing.search.aiSummary': 'AI Summary',
    'landing.search.womenFirst': 'Women-First Perspective',
    'landing.search.webResults': 'Web Results',
    'landing.search.community': 'Aurora App Community',
    'landing.search.verifiedWomen': 'Verified by Women',
    'landing.search.joinFree': 'Join Aurora App Free',
    'landing.search.noTracking': '🔒 No ads • No data selling • 100% privacy-first',
    'landing.features.aiDetection': 'AI Detection',
    'landing.features.aiDetectionDesc': 'Spot AI-generated content instantly',
    'landing.features.biasAnalysis': 'Bias Analysis',
    'landing.features.biasAnalysisDesc': 'Gender & political bias scores',
    'landing.features.credibility': 'Credibility',
    'landing.features.credibilityDesc': 'Source trust verification',
    'landing.features.noTracking': 'No Tracking',
    'landing.features.noTrackingDesc': '100% private searches',
    'landing.footer': 'Designed by women, for women. Search with confidence.',
    'landing.why.title': 'Why Women Choose',
    'landing.why.subtitle': 'We built the opposite of toxic social media.',
    'landing.why.otherPlatforms': 'Other Platforms',
    'landing.cta.joinFree': 'Join Aurora App Free',
  },
};

// Get landing translation with fallback to Spanish (default)
export function tLanding(key: string, locale: SupportedLocale = 'es'): string {
  return landingTranslations[locale]?.[key] || landingTranslations.es[key] || key;
}

// Core translations for critical safety features
export const translations: Record<SupportedLocale, Record<string, string>> = {
  es: {
    'emergency.panic': 'EMERGENCIA',
    'emergency.imSafe': 'Estoy a salvo',
    'emergency.help': 'La ayuda está en camino',
    'emergency.contacts': 'Contactos de Emergencia',
    'emergency.addContact': 'Agregar Contacto',
    'safety.checkin': 'Registrarse',
    'safety.imOk': 'Estoy bien',
    'safety.schedule': 'Programar registro',
    'safety.missed': 'Registro perdido',
    'nav.feed': 'Inicio',
    'nav.map': 'Mapa de Seguridad',
    'nav.routes': 'Rutas',
    'nav.emergency': 'Emergencia',
    'nav.resources': 'Recursos',
    'nav.circles': 'Círculos',
    'nav.health': 'Salud',
    'nav.profile': 'Perfil',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.submit': 'Enviar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.share': 'Compartir',
    'common.report': 'Reportar',
    'common.loading': 'Cargando...',
    'credits.earned': 'Créditos Ganados',
    'credits.balance': 'Saldo de Créditos',
  },
  en: {
    // Emergency
    'emergency.panic': 'EMERGENCY',
    'emergency.imSafe': "I'm Safe",
    'emergency.help': 'Help is on the way',
    'emergency.contacts': 'Emergency Contacts',
    'emergency.addContact': 'Add Contact',
    
    // Safety
    'safety.checkin': 'Check In',
    'safety.imOk': "I'm OK",
    'safety.schedule': 'Schedule Check-in',
    'safety.missed': 'Missed Check-in',
    
    // Navigation
    'nav.feed': 'Feed',
    'nav.map': 'Safety Map',
    'nav.routes': 'Routes',
    'nav.emergency': 'Emergency',
    'nav.resources': 'Resources',
    'nav.circles': 'Circles',
    'nav.health': 'Health',
    'nav.profile': 'Profile',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.report': 'Report',
    'common.loading': 'Loading...',
    
    // Credits
    'credits.earned': 'Credits Earned',
    'credits.balance': 'Credit Balance',
  },
};

// Get browser locale - defaults to Spanish
export function getBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'es';
  
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'en') return 'en';
  // Default to Spanish for all other languages
  return 'es';
}

// Translation function
export function t(key: string, locale: SupportedLocale = 'es'): string {
  return translations[locale]?.[key] || translations.es[key] || key;
}

// Check if locale is RTL (no RTL languages supported anymore)
export function isRTL(locale: SupportedLocale): boolean {
  return false;
}

/**
 * Get app translation - uses JSON translation files
 * Falls back to Spanish (default) if key not found in selected locale
 */
export function tApp(key: string, locale: SupportedLocale = 'es'): string {
  // First try the JSON translations
  const localeTranslations = appTranslations[locale];
  if (localeTranslations?.[key]) {
    return localeTranslations[key];
  }
  
  // Fall back to Spanish JSON (default language)
  if (appTranslations.es?.[key]) {
    return appTranslations.es[key];
  }
  
  // Fall back to English JSON
  if (appTranslations.en?.[key]) {
    return appTranslations.en[key];
  }
  
  // Fall back to legacy translations
  return translations[locale]?.[key] || translations.es?.[key] || key;
}
