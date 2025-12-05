/**
 * Aurora AI Search Engine - Credibility Scorer
 * 
 * Evaluates source trustworthiness based on:
 * - Domain type (.gov, .edu, news, women-focused)
 * - Verified news status
 * - Women-focused domain bonus
 * 
 * This helps women identify trustworthy information sources.
 */

import type {
  CredibilityScore,
  CredibilityLabel,
  DomainType,
} from './types';

// ============================================
// DOMAIN DATABASES
// ============================================

// Highly trusted domains
const GOV_DOMAINS = ['.gov', '.gov.uk', '.gov.au', '.gov.ca', '.gob.mx'];
const EDU_DOMAINS = ['.edu', '.ac.uk', '.edu.au'];

// Verified news organizations
const VERIFIED_NEWS_DOMAINS = [
  'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk',
  'nytimes.com', 'washingtonpost.com', 'theguardian.com',
  'npr.org', 'pbs.org', 'cnn.com', 'nbcnews.com',
  'abcnews.go.com', 'cbsnews.com', 'usatoday.com',
  'wsj.com', 'ft.com', 'economist.com', 'bloomberg.com',
  'nature.com', 'sciencedirect.com', 'pubmed.gov',
  'who.int', 'un.org', 'worldbank.org',
];

// Women-focused domains (get bonus points!)
const WOMEN_FOCUSED_DOMAINS = [
  'womenshealth.gov', 'unwomen.org', 'catalyst.org', 'leanin.org',
  'girlswhocode.com', 'womenintechnology.org', 'sheeo.world',
  'globalfundforwomen.org', 'womendeliver.org', 'womensmedia.com',
  'womenshistory.org', 'aauw.org', 'now.org', 'feminist.org',
  'womensenews.org', 'msmagazine.com', 'bust.com', 'refinery29.com',
  'thecut.com', 'bustle.com', 'hellogiggles.com', 'sheknows.com',
  'womenshealthmag.com', 'self.com', 'glamour.com', 'cosmopolitan.com',
  'elle.com', 'marieclaire.com', 'harpersbazaar.com', 'vogue.com',
  'allure.com', 'instyle.com', 'realsimple.com', 'parents.com',
  'babycenter.com', 'whattoexpect.com', 'thebump.com',
];

// Suspicious patterns that reduce credibility
const SUSPICIOUS_PATTERNS = [
  /\d{4,}/, // Random numbers in domain
  /free.*download/i,
  /click.*bait/i,
  /fake.*news/i,
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extracts clean domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Determines domain type
 */
export function getDomainType(domain: string): DomainType {
  // Check government domains
  if (GOV_DOMAINS.some(ext => domain.endsWith(ext))) {
    return 'gov';
  }

  // Check educational domains
  if (EDU_DOMAINS.some(ext => domain.endsWith(ext))) {
    return 'edu';
  }

  // Check women-focused domains
  if (WOMEN_FOCUSED_DOMAINS.some(d => domain.includes(d))) {
    return 'women-focused';
  }

  // Check verified news
  if (VERIFIED_NEWS_DOMAINS.some(d => domain.includes(d))) {
    return 'news';
  }

  // Check if it's a commercial domain
  if (domain.endsWith('.com') || domain.endsWith('.net')) {
    return 'commercial';
  }

  return 'unknown';
}

/**
 * Checks if domain is a verified news source
 */
export function isVerifiedNews(domain: string): boolean {
  return VERIFIED_NEWS_DOMAINS.some(d => domain.includes(d));
}

/**
 * Checks if domain is women-focused
 */
export function isWomenFocused(domain: string): boolean {
  return WOMEN_FOCUSED_DOMAINS.some(d => domain.includes(d));
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

/**
 * Calculates credibility score for a domain/URL
 * Score: 0-100 (higher = more credible)
 * 
 * Property 7: Score must be 0-100
 * Property 8: .gov/.edu > unknown domains
 * Property 9: Women-focused domains get +10 bonus
 * Property 10: Label mapping
 */
export function calculateCredibility(url: string): CredibilityScore {
  const domain = extractDomain(url);
  const domainType = getDomainType(domain);
  const verifiedNews = isVerifiedNews(domain);
  const womenFocused = isWomenFocused(domain);

  let score = 50; // Start at moderate

  // Domain type bonuses
  switch (domainType) {
    case 'gov':
      score += 35; // Government sources are highly trusted
      break;
    case 'edu':
      score += 30; // Educational institutions
      break;
    case 'news':
      score += 25; // Verified news organizations
      break;
    case 'women-focused':
      score += 20; // Women-focused sources
      break;
    case 'commercial':
      score += 0; // No bonus for commercial
      break;
    case 'unknown':
      score -= 10; // Penalty for unknown
      break;
  }

  // Verified news bonus
  if (verifiedNews) {
    score += 10;
  }

  // Women-focused bonus (Property 9: at least 10 points)
  if (womenFocused) {
    score += 10;
  }

  // .org domains get a small bonus
  if (domain.endsWith('.org')) {
    score += 5;
  }

  // Suspicious pattern penalties
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(domain)) {
      score -= 15;
    }
  });

  // Blog penalty (unless official)
  if (domain.includes('blog') && !domain.includes('official')) {
    score -= 10;
  }

  // Clamp score to 0-100 (Property 7)
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    label: getCredibilityLabel(score),
    factors: {
      domainType,
      isVerifiedNews: verifiedNews,
      isWomenFocused: womenFocused,
    },
  };
}

/**
 * Maps credibility score to human-readable label
 * Property 10: Credibility Label Mapping
 */
export function getCredibilityLabel(score: number): CredibilityLabel {
  if (score >= 80) return 'Highly Trusted';
  if (score >= 60) return 'Trusted';
  if (score >= 40) return 'Moderate';
  return 'Verify Source';
}

/**
 * Batch calculate credibility for multiple URLs
 */
export function calculateCredibilityBatch(urls: string[]): CredibilityScore[] {
  return urls.map(url => calculateCredibility(url));
}

/**
 * Calculate average credibility score
 * Property 5: Average Calculation Correctness
 */
export function calculateAverageCredibility(scores: CredibilityScore[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round(sum / scores.length);
}
