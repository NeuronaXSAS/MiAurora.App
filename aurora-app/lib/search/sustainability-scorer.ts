/**
 * ============================================================================
 * AURORA AI SEARCH ENGINE - SUSTAINABILITY SCORER (Eco Metric)
 * ============================================================================
 *
 * Evaluates content for environmental/sustainability focus:
 * - Green keywords and eco-friendly language
 * - Sustainability-focused domains
 * - Ethical business indicators
 * - Environmental awareness signals
 *
 * This helps Aurora users identify eco-conscious sources.
 *
 * ============================================================================
 * CURRENT MODE: LOCAL HEURISTICS ($0 cost)
 * ============================================================================
 *
 * All analysis is done using keyword matching and domain detection.
 * Returns null (N/A) when no sustainability signals are detected.
 *
 * ============================================================================
 * FUTURE: AI-POWERED UPGRADE
 * ============================================================================
 *
 * When you have budget for higher quality analysis:
 *
 * 1. Configure in: lib/search/metrics-config.ts
 *    - Set SUSTAINABILITY.mode = "ai"
 *
 * 2. Add API key to .env.local:
 *    GOOGLE_AI_API_KEY=your_key_here
 *
 * 3. The metrics-analyzer.ts will automatically use AI when configured
 *
 * AI MODE BENEFITS:
 * - Detect greenwashing (fake sustainability claims)
 * - Understand nuanced environmental discussions
 * - Evaluate supply chain sustainability mentions
 * - Identify corporate vs genuine activism
 * - Recognize regional environmental issues
 *
 * COST ESTIMATE (Gemini 1.5 Flash):
 * - FREE tier: 15 requests/minute
 * - Paid: ~$0.00125 per 1K tokens
 * - Average analysis: ~200 tokens = ~$0.00025 per result
 *
 * See metrics-config.ts SUSTAINABILITY.aiPromptTemplate for the AI prompt
 *
 * ============================================================================
 */

import type { SustainabilityScore, SustainabilityLabel } from "./types";

// ============================================================================
// SUSTAINABILITY KEYWORD DATABASES
// ============================================================================
//
// These keyword lists power the local heuristic analysis.
// They are designed to detect genuine sustainability content
// while flagging potential greenwashing.
//
// IMPROVEMENT IDEAS (for future):
// - Add industry-specific sustainability terms
// - Add regional environmental terms (Amazon, Great Barrier Reef, etc.)
// - Add UN SDG (Sustainable Development Goals) terminology
// - Weight keywords by importance/specificity
//
// ============================================================================

// Strong sustainability indicators
const SUSTAINABILITY_POSITIVE_KEYWORDS = [
  // Environmental
  "sustainable",
  "sustainability",
  "eco-friendly",
  "eco friendly",
  "environmentally friendly",
  "green",
  "renewable",
  "solar",
  "wind power",
  "clean energy",
  "carbon neutral",
  "carbon footprint",
  "zero waste",
  "plastic-free",
  "biodegradable",
  "compostable",
  "recyclable",
  "recycled",
  "upcycled",
  "organic",
  "natural",
  "plant-based",
  "vegan",
  "cruelty-free",
  "fair trade",
  "ethically sourced",
  "locally sourced",
  "farm to table",
  // Climate
  "climate action",
  "climate change",
  "global warming",
  "emissions reduction",
  "net zero",
  "carbon offset",
  "greenhouse gas",
  // Conservation
  "conservation",
  "wildlife protection",
  "endangered species",
  "biodiversity",
  "ecosystem",
  "reforestation",
  "ocean conservation",
  "marine protection",
  // Ethical business
  "b corp",
  "certified b corporation",
  "social enterprise",
  "ethical",
  "responsible",
  "conscious consumer",
  "slow fashion",
  "mindful",
];

// Negative sustainability indicators (greenwashing or anti-environment)
const SUSTAINABILITY_NEGATIVE_KEYWORDS = [
  "greenwashing",
  "fast fashion",
  "single-use plastic",
  "disposable",
  "throwaway culture",
  "oil drilling",
  "fracking",
  "coal mining",
  "deforestation",
  "pollution",
  "toxic waste",
  "climate denial",
  "climate hoax",
];

// Sustainability-focused domains
const SUSTAINABILITY_DOMAINS = [
  // News & Media
  "treehugger.com",
  "grist.org",
  "ecowatch.com",
  "greenbiz.com",
  "sustainablebrands.com",
  "theguardian.com/environment",
  "insideclimatenews.org",
  // Organizations
  "epa.gov",
  "unep.org",
  "worldwildlife.org",
  "wwf.org",
  "greenpeace.org",
  "sierraclub.org",
  "nrdc.org",
  "edf.org",
  "conservation.org",
  "nature.org",
  "rainforest-alliance.org",
  // Certifications
  "bcorporation.net",
  "fairtrade.net",
  "fsc.org",
  "rainforest-alliance.org",
  // Women + Sustainability
  "wedo.org",
  "womenenvironment.org",
  "globalfundforwomen.org",
];

// Domains known for anti-sustainability content
const ANTI_SUSTAINABILITY_DOMAINS = [
  "wattsupwiththat.com",
  "climatedepot.com",
  "cfact.org",
];

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================
//
// LOCAL MODE: Pattern matching with weighted scoring
//
// AI MODE (Future): Would analyze:
// - Context of sustainability mentions (genuine vs marketing)
// - Greenwashing detection (vague claims without evidence)
// - Supply chain and lifecycle considerations
// - Comparative environmental impact
// - Credibility of environmental claims
//
// See metrics-config.ts SUSTAINABILITY.aiPromptTemplate for the AI prompt
// ============================================================================

/**
 * Counts keyword matches in text
 */
function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword)).length;
}

/**
 * Checks if domain is sustainability-focused
 */
function isSustainabilityDomain(domain: string): boolean {
  const cleanDomain = domain.toLowerCase().replace("www.", "");
  return SUSTAINABILITY_DOMAINS.some((d) => cleanDomain.includes(d));
}

/**
 * Checks if domain is anti-sustainability
 */
function isAntiSustainabilityDomain(domain: string): boolean {
  const cleanDomain = domain.toLowerCase().replace("www.", "");
  return ANTI_SUSTAINABILITY_DOMAINS.some((d) => cleanDomain.includes(d));
}

/**
 * Main sustainability scoring function
 * Score: 0-100 (higher = more sustainability-focused)
 *
 * Returns null if insufficient signals (not applicable)
 *
 * CURRENT: Uses local heuristics (keyword matching + domain detection)
 * FUTURE: Can be upgraded to AI-powered analysis
 *
 * To upgrade to AI mode:
 * 1. Use analyzeMetrics() from metrics-analyzer.ts instead
 * 2. Configure metrics-config.ts with SUSTAINABILITY.mode = "ai"
 * 3. Add GOOGLE_AI_API_KEY to environment
 *
 * @param text - The content to analyze
 * @param domain - Optional domain for source-based scoring
 * @param url - Optional URL for section detection (e.g., /sustainability/)
 * @returns SustainabilityScore with score, label, and indicators
 */
export function calculateSustainability(
  text: string,
  domain?: string,
  url?: string,
): SustainabilityScore {
  if (!text || text.trim().length === 0) {
    return {
      score: null,
      label: "Unknown",
      indicators: [],
    };
  }

  let score = 50; // Start neutral
  const indicators: string[] = [];

  // Check positive keywords
  const positiveCount = countKeywordMatches(
    text,
    SUSTAINABILITY_POSITIVE_KEYWORDS,
  );
  if (positiveCount > 0) {
    score += Math.min(positiveCount * 8, 40); // Cap at +40
    indicators.push(`${positiveCount} eco-positive term(s)`);
  }

  // Check negative keywords
  const negativeCount = countKeywordMatches(
    text,
    SUSTAINABILITY_NEGATIVE_KEYWORDS,
  );
  if (negativeCount > 0) {
    score -= negativeCount * 12;
    indicators.push(`${negativeCount} concerning term(s)`);
  }

  // Domain bonuses/penalties
  if (domain) {
    if (isSustainabilityDomain(domain)) {
      score += 25;
      indicators.push("Eco-focused source");
    }

    if (isAntiSustainabilityDomain(domain)) {
      score -= 30;
      indicators.push("Known anti-environment source");
    }

    // Small bonus for .org domains discussing sustainability
    if (domain.endsWith(".org") && positiveCount >= 2) {
      score += 5;
    }
  }

  // Check URL for sustainability sections
  if (url) {
    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes("/sustainability") ||
      lowerUrl.includes("/environment") ||
      lowerUrl.includes("/green") ||
      lowerUrl.includes("/eco")
    ) {
      score += 10;
      indicators.push("Dedicated sustainability section");
    }
  }

  // If no sustainability signals at all, return null (N/A)
  if (positiveCount === 0 && negativeCount === 0 && indicators.length === 0) {
    return {
      score: null,
      label: "N/A",
      indicators: [],
    };
  }

  // Clamp score to 0-100
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    label: getSustainabilityLabel(score),
    indicators,
  };
}

/**
 * Maps sustainability score to human-readable label
 */
export function getSustainabilityLabel(
  score: number | null,
): SustainabilityLabel {
  if (score === null) return "N/A";
  if (score >= 80) return "Eco-Leader";
  if (score >= 60) return "Eco-Aware";
  if (score >= 40) return "Neutral";
  if (score >= 20) return "Caution";
  return "Concern";
}

/**
 * Get emoji for sustainability score
 */
export function getSustainabilityEmoji(score: number | null): string {
  if (score === null) return "🌍";
  if (score >= 80) return "🌱";
  if (score >= 60) return "🍃";
  if (score >= 40) return "🌍";
  if (score >= 20) return "⚠️";
  return "🏭";
}

/**
 * Batch calculate sustainability for multiple items
 */
export function calculateSustainabilityBatch(
  items: Array<{ text: string; domain?: string; url?: string }>,
): SustainabilityScore[] {
  return items.map((item) =>
    calculateSustainability(item.text, item.domain, item.url),
  );
}
