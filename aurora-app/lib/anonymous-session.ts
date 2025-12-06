/**
 * Aurora App - Anonymous Session Management
 * 
 * Generates anonymous session identifiers for Community Truth Score™ voting.
 * CRITICAL: No PII is stored or transmitted. Uses one-way SHA-256 hashing.
 * 
 * Privacy guarantees:
 * - Session ID stored only in sessionStorage (not cookies)
 * - Daily rotation for extra privacy
 * - Cannot be reversed to identify users
 */

// Session storage key
const SESSION_KEY = "aurora-anon-session";

/**
 * Generate a cryptographically secure random session ID
 */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create anonymous session ID
 * Stored in sessionStorage - cleared when browser closes
 */
function getSessionId(): string {
  if (typeof window === "undefined") {
    return generateSessionId(); // Server-side fallback
  }
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * SHA-256 hash function
 * Uses Web Crypto API for secure hashing
 */
async function sha256(message: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback: simple hash (less secure but works everywhere)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

/**
 * Generate anonymous session hash for voting
 * Combines session ID with day key for daily rotation
 * 
 * @returns One-way hash that cannot be reversed to identify user
 */
export async function generateAnonymousSessionHash(): Promise<string> {
  const sessionId = getSessionId();
  
  // Day key for daily rotation - extra privacy
  const dayKey = new Date().toISOString().split("T")[0];
  
  // Combine and hash
  return sha256(`aurora-truth-${sessionId}-${dayKey}`);
}

/**
 * Normalize URL for consistent hashing
 * Removes tracking params, normalizes protocol, lowercases
 * 
 * @param url - Raw URL from search result
 * @returns Normalized URL string
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Remove common tracking parameters
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid"
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    
    // Normalize: hostname + pathname, lowercase
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/\/$/, "");
  } catch {
    // If URL parsing fails, return as-is (lowercased)
    return url.toLowerCase();
  }
}

/**
 * Generate URL hash for vote storage
 * 
 * @param url - URL to hash
 * @returns SHA-256 hash of normalized URL
 */
export async function generateUrlHash(url: string): Promise<string> {
  const normalized = normalizeUrl(url);
  return sha256(`aurora-url-${normalized}`);
}

/**
 * Get current hour key for rate limiting
 * Format: "2024-12-05-14" (date + hour)
 */
export function getCurrentHourKey(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const hour = now.getUTCHours().toString().padStart(2, "0");
  return `${date}-${hour}`;
}

/**
 * Check if user has already voted on a URL (client-side cache)
 * Uses localStorage to remember votes across sessions
 */
const VOTES_CACHE_KEY = "aurora-truth-votes";

export function getLocalVote(urlHash: string): "trust" | "flag" | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cache = JSON.parse(localStorage.getItem(VOTES_CACHE_KEY) || "{}");
    return cache[urlHash] || null;
  } catch {
    return null;
  }
}

export function setLocalVote(urlHash: string, vote: "trust" | "flag"): void {
  if (typeof window === "undefined") return;
  
  try {
    const cache = JSON.parse(localStorage.getItem(VOTES_CACHE_KEY) || "{}");
    cache[urlHash] = vote;
    
    // Keep only last 500 votes to prevent localStorage bloat
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      const toRemove = keys.slice(0, keys.length - 500);
      toRemove.forEach((key) => delete cache[key]);
    }
    
    localStorage.setItem(VOTES_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
}
