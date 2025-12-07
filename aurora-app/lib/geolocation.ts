/**
 * IP Geolocation Service for Aurora App
 * Uses free ip-api.com (45 requests/minute)
 * Caches results in localStorage for 24 hours
 */

interface GeoLocation {
  countryCode: string;
  countryName: string;
  flag: string;
  city?: string;
  region?: string;
}

const CACHE_KEY = "aurora-geolocation";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Convert ISO 3166-1 alpha-2 country code to emoji flag
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}

/**
 * Get cached geolocation from localStorage
 */
function getCachedLocation(): GeoLocation | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Cache geolocation in localStorage
 */
function cacheLocation(data: GeoLocation): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetch geolocation from IP
 * Tries multiple endpoints with fallbacks for ad-blocker resilience
 */
export async function getGeolocation(): Promise<GeoLocation> {
  // Check cache first
  const cached = getCachedLocation();
  if (cached) return cached;
  
  // Default fallback - always return something valid
  const fallback: GeoLocation = {
    countryCode: "XX",
    countryName: "Global",
    flag: "🌍",
  };
  
  // Try to detect timezone-based country as a fallback
  const timezoneFallback = getCountryFromTimezone();
  if (timezoneFallback) {
    cacheLocation(timezoneFallback);
    return timezoneFallback;
  }
  
  // Try API endpoints (may be blocked by ad blockers)
  const endpoints = [
    { url: "https://ipapi.co/json/", parser: parseIpapiCo },
    { url: "https://api.country.is/", parser: parseCountryIs },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(endpoint.url, { 
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const location = endpoint.parser(data);
      
      if (location && location.countryCode !== "XX") {
        cacheLocation(location);
        return location;
      }
    } catch {
      // Silently continue to next endpoint or fallback
      continue;
    }
  }
  
  // Cache and return fallback
  cacheLocation(fallback);
  return fallback;
}

/**
 * Parse ipapi.co response
 */
function parseIpapiCo(data: Record<string, unknown>): GeoLocation | null {
  if (data.error) return null;
  const code = (data.country_code || data.countryCode || "XX") as string;
  return {
    countryCode: code,
    countryName: (data.country_name || data.country || "Unknown") as string,
    flag: countryCodeToFlag(code),
    city: data.city as string | undefined,
    region: (data.region || data.regionName) as string | undefined,
  };
}

/**
 * Parse country.is response
 */
function parseCountryIs(data: Record<string, unknown>): GeoLocation | null {
  const code = (data.country || "XX") as string;
  if (code === "XX") return null;
  return {
    countryCode: code,
    countryName: COUNTRY_NAMES[code] || "Unknown",
    flag: countryCodeToFlag(code),
  };
}

/**
 * Try to detect country from browser timezone
 * This works even when API calls are blocked
 */
function getCountryFromTimezone(): GeoLocation | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = TIMEZONE_TO_COUNTRY[timezone];
    if (countryCode) {
      return {
        countryCode,
        countryName: COUNTRY_NAMES[countryCode] || "Unknown",
        flag: countryCodeToFlag(countryCode),
      };
    }
  } catch {
    // Timezone detection failed
  }
  return null;
}

/**
 * Common timezone to country mappings
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Montreal": "CA",
  "America/Mexico_City": "MX", "America/Bogota": "CO", "America/Lima": "PE",
  "America/Santiago": "CL", "America/Buenos_Aires": "AR", "America/Sao_Paulo": "BR",
  "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE",
  "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE", "Europe/Vienna": "AT", "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI", "Europe/Warsaw": "PL", "Europe/Prague": "CZ",
  "Europe/Athens": "GR", "Europe/Istanbul": "TR", "Europe/Moscow": "RU",
  "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK", "Asia/Singapore": "SG", "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID", "Asia/Manila": "PH", "Asia/Kolkata": "IN",
  "Asia/Dubai": "AE", "Asia/Riyadh": "SA", "Asia/Jerusalem": "IL",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ", "Africa/Cairo": "EG", "Africa/Lagos": "NG",
  "Africa/Johannesburg": "ZA", "Africa/Nairobi": "KE",
};

/**
 * Country code to name mappings
 */
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil",
  AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru",
  GB: "United Kingdom", FR: "France", DE: "Germany", ES: "Spain",
  IT: "Italy", NL: "Netherlands", BE: "Belgium", AT: "Austria",
  CH: "Switzerland", SE: "Sweden", NO: "Norway", DK: "Denmark",
  FI: "Finland", PL: "Poland", CZ: "Czech Republic", GR: "Greece",
  TR: "Turkey", RU: "Russia", JP: "Japan", KR: "South Korea",
  CN: "China", HK: "Hong Kong", SG: "Singapore", TH: "Thailand",
  ID: "Indonesia", PH: "Philippines", IN: "India", AE: "UAE",
  SA: "Saudi Arabia", IL: "Israel", AU: "Australia", NZ: "New Zealand",
  EG: "Egypt", NG: "Nigeria", ZA: "South Africa", KE: "Kenya",
};

/**
 * Get country flag for display
 * Returns cached flag or fetches new one
 */
export async function getCountryFlag(): Promise<string> {
  const location = await getGeolocation();
  return location.flag;
}

/**
 * Common country codes and their flags for reference
 */
export const COMMON_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  GB: "🇬🇧",
  CA: "🇨🇦",
  AU: "🇦🇺",
  DE: "🇩🇪",
  FR: "🇫🇷",
  ES: "🇪🇸",
  IT: "🇮🇹",
  BR: "🇧🇷",
  MX: "🇲🇽",
  CO: "🇨🇴",
  AR: "🇦🇷",
  CL: "🇨🇱",
  PE: "🇵🇪",
  JP: "🇯🇵",
  KR: "🇰🇷",
  CN: "🇨🇳",
  IN: "🇮🇳",
  RU: "🇷🇺",
  ZA: "🇿🇦",
  EG: "🇪🇬",
  NG: "🇳🇬",
  KE: "🇰🇪",
  SA: "🇸🇦",
  AE: "🇦🇪",
  IL: "🇮🇱",
  TR: "🇹🇷",
  PL: "🇵🇱",
  NL: "🇳🇱",
  SE: "🇸🇪",
  NO: "🇳🇴",
  DK: "🇩🇰",
  FI: "🇫🇮",
  PT: "🇵🇹",
  GR: "🇬🇷",
  XX: "🌍", // Global/Unknown
};
