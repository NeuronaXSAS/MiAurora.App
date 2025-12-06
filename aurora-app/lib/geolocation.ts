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
 * Uses ip-api.com free tier (45 req/min)
 */
export async function getGeolocation(): Promise<GeoLocation> {
  // Check cache first
  const cached = getCachedLocation();
  if (cached) return cached;
  
  try {
    const response = await fetch("http://ip-api.com/json/?fields=status,country,countryCode,city,regionName");
    
    if (!response.ok) {
      throw new Error("Geolocation API failed");
    }
    
    const data = await response.json();
    
    if (data.status !== "success") {
      throw new Error("Geolocation lookup failed");
    }
    
    const location: GeoLocation = {
      countryCode: data.countryCode || "XX",
      countryName: data.country || "Unknown",
      flag: countryCodeToFlag(data.countryCode || "XX"),
      city: data.city,
      region: data.regionName,
    };
    
    // Cache the result
    cacheLocation(location);
    
    return location;
  } catch (error) {
    console.error("Geolocation error:", error);
    
    // Return fallback
    return {
      countryCode: "XX",
      countryName: "Global",
      flag: "🌍",
    };
  }
}

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
