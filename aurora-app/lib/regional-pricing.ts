"use client";

// Regional pricing configuration with PPP (Purchasing Power Parity)
export interface RegionalPricing {
  country: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  multiplier: number;
  subscriptions: {
    plus: { monthly: number; annual: number };
    pro: { monthly: number; annual: number };
    elite: { monthly: number; annual: number };
  };
  credits: {
    small: number;
    medium: number;
    large: number;
    xl: number;
  };
}

// PPP multipliers by region
const PPP_MULTIPLIERS: Record<string, { multiplier: number; currency: string; symbol: string; name: string }> = {
  // Full price regions
  US: { multiplier: 1.0, currency: "USD", symbol: "$", name: "United States" },
  CA: { multiplier: 1.0, currency: "CAD", symbol: "CA$", name: "Canada" },
  GB: { multiplier: 0.95, currency: "GBP", symbol: "£", name: "United Kingdom" },
  AU: { multiplier: 0.95, currency: "AUD", symbol: "A$", name: "Australia" },
  
  // European Union (slight discount)
  EU: { multiplier: 0.90, currency: "EUR", symbol: "€", name: "European Union" },
  DE: { multiplier: 0.90, currency: "EUR", symbol: "€", name: "Germany" },
  FR: { multiplier: 0.90, currency: "EUR", symbol: "€", name: "France" },
  ES: { multiplier: 0.85, currency: "EUR", symbol: "€", name: "Spain" },
  IT: { multiplier: 0.85, currency: "EUR", symbol: "€", name: "Italy" },
  NL: { multiplier: 0.90, currency: "EUR", symbol: "€", name: "Netherlands" },
  
  // Latin America (significant discount)
  MX: { multiplier: 0.50, currency: "MXN", symbol: "MX$", name: "Mexico" },
  BR: { multiplier: 0.45, currency: "BRL", symbol: "R$", name: "Brazil" },
  AR: { multiplier: 0.35, currency: "ARS", symbol: "AR$", name: "Argentina" },
  CO: { multiplier: 0.40, currency: "COP", symbol: "CO$", name: "Colombia" },
  CL: { multiplier: 0.55, currency: "CLP", symbol: "CL$", name: "Chile" },
  PE: { multiplier: 0.40, currency: "PEN", symbol: "S/", name: "Peru" },
  
  // Asia (varied discounts)
  IN: { multiplier: 0.35, currency: "INR", symbol: "₹", name: "India" },
  PH: { multiplier: 0.40, currency: "PHP", symbol: "₱", name: "Philippines" },
  ID: { multiplier: 0.35, currency: "IDR", symbol: "Rp", name: "Indonesia" },
  TH: { multiplier: 0.45, currency: "THB", symbol: "฿", name: "Thailand" },
  VN: { multiplier: 0.30, currency: "VND", symbol: "₫", name: "Vietnam" },
  MY: { multiplier: 0.50, currency: "MYR", symbol: "RM", name: "Malaysia" },
  JP: { multiplier: 0.85, currency: "JPY", symbol: "¥", name: "Japan" },
  KR: { multiplier: 0.80, currency: "KRW", symbol: "₩", name: "South Korea" },
  SG: { multiplier: 0.90, currency: "SGD", symbol: "S$", name: "Singapore" },
  
  // Africa (significant discount)
  NG: { multiplier: 0.30, currency: "NGN", symbol: "₦", name: "Nigeria" },
  KE: { multiplier: 0.35, currency: "KES", symbol: "KSh", name: "Kenya" },
  ZA: { multiplier: 0.45, currency: "ZAR", symbol: "R", name: "South Africa" },
  EG: { multiplier: 0.35, currency: "EGP", symbol: "E£", name: "Egypt" },
  GH: { multiplier: 0.35, currency: "GHS", symbol: "GH₵", name: "Ghana" },
  
  // Middle East
  AE: { multiplier: 0.90, currency: "AED", symbol: "د.إ", name: "UAE" },
  SA: { multiplier: 0.85, currency: "SAR", symbol: "﷼", name: "Saudi Arabia" },
  TR: { multiplier: 0.40, currency: "TRY", symbol: "₺", name: "Turkey" },
  
  // Eastern Europe
  PL: { multiplier: 0.55, currency: "PLN", symbol: "zł", name: "Poland" },
  UA: { multiplier: 0.30, currency: "UAH", symbol: "₴", name: "Ukraine" },
  RO: { multiplier: 0.50, currency: "RON", symbol: "lei", name: "Romania" },
  CZ: { multiplier: 0.60, currency: "CZK", symbol: "Kč", name: "Czech Republic" },
};

// Base prices in USD
const BASE_PRICES = {
  subscriptions: {
    plus: { monthly: 5, annual: 48 },
    pro: { monthly: 12, annual: 115 },
    elite: { monthly: 25, annual: 240 },
  },
  credits: {
    small: 1,    // 100 credits
    medium: 4,   // 500 credits
    large: 7,    // 1000 credits
    xl: 30,      // 5000 credits
  },
};

// Timezone to country mapping
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Americas
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Santiago': 'CL',
  
  // Europe
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Warsaw': 'PL',
  'Europe/Kiev': 'UA',
  'Europe/Bucharest': 'RO',
  'Europe/Prague': 'CZ',
  'Europe/Istanbul': 'TR',
  
  // Asia
  'Asia/Kolkata': 'IN',
  'Asia/Mumbai': 'IN',
  'Asia/Manila': 'PH',
  'Asia/Jakarta': 'ID',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Singapore': 'SG',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  
  // Africa
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo': 'EG',
  'Africa/Accra': 'GH',
  
  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'AU',
};

/**
 * Detect user's country from timezone
 */
export function detectUserCountry(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_COUNTRY[timezone] || 'US';
  } catch {
    return 'US';
  }
}

/**
 * Get regional pricing for a specific country
 */
export function getRegionalPricing(countryCode: string): RegionalPricing {
  const region = PPP_MULTIPLIERS[countryCode] || PPP_MULTIPLIERS['US'];
  const multiplier = region.multiplier;
  
  return {
    country: countryCode,
    countryName: region.name,
    currency: region.currency,
    currencySymbol: region.symbol,
    multiplier,
    subscriptions: {
      plus: {
        monthly: Math.round(BASE_PRICES.subscriptions.plus.monthly * multiplier * 100) / 100,
        annual: Math.round(BASE_PRICES.subscriptions.plus.annual * multiplier * 100) / 100,
      },
      pro: {
        monthly: Math.round(BASE_PRICES.subscriptions.pro.monthly * multiplier * 100) / 100,
        annual: Math.round(BASE_PRICES.subscriptions.pro.annual * multiplier * 100) / 100,
      },
      elite: {
        monthly: Math.round(BASE_PRICES.subscriptions.elite.monthly * multiplier * 100) / 100,
        annual: Math.round(BASE_PRICES.subscriptions.elite.annual * multiplier * 100) / 100,
      },
    },
    credits: {
      small: Math.round(BASE_PRICES.credits.small * multiplier * 100) / 100,
      medium: Math.round(BASE_PRICES.credits.medium * multiplier * 100) / 100,
      large: Math.round(BASE_PRICES.credits.large * multiplier * 100) / 100,
      xl: Math.round(BASE_PRICES.credits.xl * multiplier * 100) / 100,
    },
  };
}

/**
 * Format price with regional currency
 */
export function formatRegionalPrice(price: number, pricing: RegionalPricing): string {
  // For currencies that typically don't use decimals
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'COP'];
  
  if (noDecimalCurrencies.includes(pricing.currency)) {
    return `${pricing.currencySymbol}${Math.round(price).toLocaleString()}`;
  }
  
  return `${pricing.currencySymbol}${price.toFixed(2)}`;
}

/**
 * Get savings percentage for regional pricing
 */
export function getRegionalSavings(pricing: RegionalPricing): number {
  return Math.round((1 - pricing.multiplier) * 100);
}
