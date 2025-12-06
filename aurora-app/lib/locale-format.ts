/**
 * Locale-Aware Formatting Utilities for Aurora App
 * 
 * Provides consistent date, time, and number formatting across all 6 priority languages.
 * Uses native Intl APIs for zero-cost internationalization.
 * 
 * Priority Languages: EN, ES, FR, PT, DE, AR
 */

import { SupportedLocale } from './i18n';

// Map our locale codes to BCP 47 language tags
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
  de: 'de-DE',
  ar: 'ar-SA',
  it: 'it-IT',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  hi: 'hi-IN',
  ru: 'ru-RU',
  tr: 'tr-TR',
  pl: 'pl-PL',
  nl: 'nl-NL',
  sv: 'sv-SE',
  th: 'th-TH',
  vi: 'vi-VN',
};

/**
 * Get BCP 47 locale tag from our locale code
 */
function getBCP47Locale(locale: string): string {
  const lang = locale.split('-')[0];
  return LOCALE_MAP[lang] || LOCALE_MAP.en;
}

/**
 * Format a date in the user's locale
 * 
 * @example
 * formatDate(new Date(), 'en') // "December 6, 2025"
 * formatDate(new Date(), 'es') // "6 de diciembre de 2025"
 * formatDate(new Date(), 'ar') // "٦ ديسمبر ٢٠٢٥"
 */
export function formatDate(
  date: Date | number | string,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  const bcp47 = getBCP47Locale(locale);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(bcp47, defaultOptions).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(d);
  }
}

/**
 * Format a date as short format (e.g., "Dec 6, 2025" or "6/12/2025")
 */
export function formatDateShort(
  date: Date | number | string,
  locale: string = 'en'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date as numeric (e.g., "12/6/2025" or "6.12.2025")
 */
export function formatDateNumeric(
  date: Date | number | string,
  locale: string = 'en'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * Format time in the user's locale
 * 
 * @example
 * formatTime(new Date(), 'en') // "3:45 PM"
 * formatTime(new Date(), 'de') // "15:45"
 */
export function formatTime(
  date: Date | number | string,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  const bcp47 = getBCP47Locale(locale);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(bcp47, defaultOptions).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(d);
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | number | string,
  locale: string = 'en'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a number in the user's locale
 * 
 * @example
 * formatNumber(1234567.89, 'en') // "1,234,567.89"
 * formatNumber(1234567.89, 'de') // "1.234.567,89"
 * formatNumber(1234567.89, 'ar') // "١٬٢٣٤٬٥٦٧٫٨٩"
 */
export function formatNumber(
  value: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  const bcp47 = getBCP47Locale(locale);
  
  try {
    return new Intl.NumberFormat(bcp47, options).format(value);
  } catch {
    return new Intl.NumberFormat('en-US', options).format(value);
  }
}

/**
 * Format a number as compact (e.g., "1.2K", "3.4M")
 */
export function formatNumberCompact(
  value: number,
  locale: string = 'en'
): string {
  return formatNumber(value, locale, {
    notation: 'compact',
    compactDisplay: 'short',
  });
}

/**
 * Format a percentage
 * 
 * @example
 * formatPercent(0.75, 'en') // "75%"
 * formatPercent(0.75, 'de') // "75 %"
 */
export function formatPercent(
  value: number,
  locale: string = 'en',
  decimals: number = 0
): string {
  return formatNumber(value, locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency (for credits display)
 * Note: Aurora App uses credits, not real currency
 */
export function formatCredits(
  value: number,
  locale: string = 'en'
): string {
  // Format as integer with locale-specific grouping
  const formatted = formatNumber(value, locale, {
    maximumFractionDigits: 0,
  });
  
  // Add credit symbol based on locale
  const creditSymbols: Record<string, string> = {
    en: '✨',
    es: '✨',
    fr: '✨',
    pt: '✨',
    de: '✨',
    ar: '✨',
  };
  
  const symbol = creditSymbols[locale.split('-')[0]] || '✨';
  return `${formatted} ${symbol}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * 
 * @example
 * formatRelativeTime(-2, 'hour', 'en') // "2 hours ago"
 * formatRelativeTime(-2, 'hour', 'es') // "hace 2 horas"
 * formatRelativeTime(3, 'day', 'ar') // "خلال ٣ أيام"
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string = 'en'
): string {
  const bcp47 = getBCP47Locale(locale);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: 'auto' });
    return rtf.format(value, unit);
  } catch {
    const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
    return rtf.format(value, unit);
  }
}

/**
 * Format a timestamp as relative time from now
 * Automatically chooses the best unit (seconds, minutes, hours, days, etc.)
 */
export function formatTimeAgo(
  timestamp: Date | number | string,
  locale: string = 'en'
): string {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);
  
  if (Math.abs(diffSec) < 60) {
    return formatRelativeTime(diffSec, 'second', locale);
  } else if (Math.abs(diffMin) < 60) {
    return formatRelativeTime(diffMin, 'minute', locale);
  } else if (Math.abs(diffHour) < 24) {
    return formatRelativeTime(diffHour, 'hour', locale);
  } else if (Math.abs(diffDay) < 7) {
    return formatRelativeTime(diffDay, 'day', locale);
  } else if (Math.abs(diffWeek) < 4) {
    return formatRelativeTime(diffWeek, 'week', locale);
  } else if (Math.abs(diffMonth) < 12) {
    return formatRelativeTime(diffMonth, 'month', locale);
  } else {
    return formatRelativeTime(diffYear, 'year', locale);
  }
}

/**
 * Get the day name in the user's locale
 * 
 * @example
 * getDayName(new Date(), 'en') // "Saturday"
 * getDayName(new Date(), 'es') // "sábado"
 */
export function getDayName(
  date: Date | number | string,
  locale: string = 'en',
  format: 'long' | 'short' | 'narrow' = 'long'
): string {
  return formatDate(date, locale, { weekday: format });
}

/**
 * Get the month name in the user's locale
 */
export function getMonthName(
  date: Date | number | string,
  locale: string = 'en',
  format: 'long' | 'short' | 'narrow' = 'long'
): string {
  return formatDate(date, locale, { month: format });
}

/**
 * Format a list of items in the user's locale
 * 
 * @example
 * formatList(['Alice', 'Bob', 'Carol'], 'en') // "Alice, Bob, and Carol"
 * formatList(['Alice', 'Bob', 'Carol'], 'es') // "Alice, Bob y Carol"
 */
export function formatList(
  items: string[],
  locale: string = 'en',
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  const bcp47 = getBCP47Locale(locale);
  
  try {
    const lf = new Intl.ListFormat(bcp47, { style: 'long', type });
    return lf.format(items);
  } catch {
    // Fallback for older browsers
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(type === 'conjunction' ? ' and ' : ' or ');
    return items.slice(0, -1).join(', ') + (type === 'conjunction' ? ', and ' : ', or ') + items[items.length - 1];
  }
}

/**
 * Format ordinal numbers (1st, 2nd, 3rd, etc.)
 * Note: Not all locales support ordinals via Intl, so we have manual fallbacks
 */
export function formatOrdinal(
  value: number,
  locale: string = 'en'
): string {
  const lang = locale.split('-')[0];
  
  // Manual ordinal rules for priority languages
  switch (lang) {
    case 'en': {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = value % 100;
      return value + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    case 'es':
      return `${value}º`;
    case 'fr':
      return value === 1 ? '1er' : `${value}e`;
    case 'pt':
      return `${value}º`;
    case 'de':
      return `${value}.`;
    case 'ar':
      // Arabic uses different ordinal forms
      return formatNumber(value, locale);
    default:
      return `${value}`;
  }
}
