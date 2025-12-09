/**
 * ============================================================================
 * AURORA AI SEARCH ENGINE - BIAS ANALYZER
 * ============================================================================
 *
 * Analyzes content for multiple bias dimensions:
 * - Gender bias (women-positive to potential bias)
 * - Political bias (Far Left to Far Right)
 * - Commercial bias (promotional content detection)
 * - Emotional tone (Factual to Sensational)
 *
 * This is what makes Aurora App different from Google/Bing!
 *
 * ============================================================================
 * CURRENT MODE: LOCAL HEURISTICS ($0 cost)
 * ============================================================================
 *
 * All analysis is done using keyword matching and pattern detection.
 * This is fast, free, and works offline.
 *
 * ============================================================================
 * FUTURE: AI-POWERED UPGRADE
 * ============================================================================
 *
 * When you have budget for higher quality analysis:
 *
 * 1. Configure in: lib/search/metrics-config.ts
 *    - Set GENDER_BIAS.mode = "ai"
 *    - Set POLITICAL_BIAS.mode = "ai"
 *    - etc.
 *
 * 2. Add API key to .env.local:
 *    GOOGLE_AI_API_KEY=your_key_here
 *
 * 3. The metrics-analyzer.ts will automatically use AI when configured
 *
 * COST ESTIMATE (Gemini 1.5 Flash):
 * - FREE tier: 15 requests/minute
 * - Paid: ~$0.00125 per 1K tokens
 * - Average analysis: ~200 tokens = ~$0.00025 per result
 *
 * ============================================================================
 */

import type {
  BiasAnalysis,
  GenderBiasAnalysis,
  GenderBiasLabel,
  PoliticalBiasAnalysis,
  PoliticalBiasIndicator,
  CommercialBiasAnalysis,
  EmotionalTone,
} from "./types";

// ============================================================================
// GENDER BIAS ANALYSIS
// ============================================================================
//
// LOCAL MODE: Uses keyword matching to detect women-positive or biased content
//
// AI MODE (Future): Would use LLM to understand context and nuance, detecting:
// - Subtle microaggressions
// - Contextual bias (e.g., "bossy" for women vs "assertive" for men)
// - Representation quality in images/media descriptions
// - Intersectional considerations
//
// See metrics-config.ts GENDER_BIAS.aiPromptTemplate for the AI prompt
// ============================================================================

const GENDER_POSITIVE_KEYWORDS = [
  "women",
  "woman",
  "female",
  "feminine",
  "inclusive",
  "equality",
  "diverse",
  "diversity",
  "empower",
  "empowerment",
  "support",
  "safe space",
  "gender equality",
  "women-led",
  "female-founded",
  "maternity",
  "work-life balance",
  "flexible",
  "inclusive workplace",
  "women in tech",
  "women in stem",
  "girl power",
  "sisterhood",
  "feminist",
  "feminism",
  "equal pay",
  "representation",
  "mentorship for women",
  "women entrepreneurs",
  "female leadership",
];

const GENDER_NEGATIVE_KEYWORDS = [
  "boys club",
  "male-dominated",
  "aggressive culture",
  "hostile",
  "discrimination",
  "harassment",
  "toxic",
  "glass ceiling",
  "pay gap",
  "sexism",
  "sexist",
  "misogyny",
  "misogynist",
  "bro culture",
  "old boys network",
  "mansplaining",
  "gender bias",
  "workplace harassment",
  "sexual harassment",
  "hostile work environment",
  "gender discrimination",
];

/**
 * Analyzes text for gender bias
 * Score: 0-100 (higher = more women-positive)
 */
export function analyzeGenderBias(text: string): GenderBiasAnalysis {
  if (!text || text.trim().length === 0) {
    return { score: 50, label: "Neutral" };
  }

  const lowerText = text.toLowerCase();
  let score = 50; // Start neutral

  // Count positive keywords
  GENDER_POSITIVE_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      score += 5;
    }
  });

  // Count negative keywords (stronger penalty)
  GENDER_NEGATIVE_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      score -= 8;
    }
  });

  // Clamp score to 0-100
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    label: getGenderBiasLabel(score),
  };
}

/**
 * Maps gender bias score to human-readable label
 * Property 4: Gender Bias Label Mapping
 */
export function getGenderBiasLabel(score: number): GenderBiasLabel {
  if (score >= 80) return "Women-Positive";
  if (score >= 60) return "Balanced";
  if (score >= 40) return "Neutral";
  if (score >= 20) return "Caution";
  return "Potential Bias";
}

// ============================================================================
// POLITICAL BIAS ANALYSIS
// ============================================================================
//
// LOCAL MODE: Uses domain database + keyword matching
// - Known news sources mapped to political leaning
// - Language patterns (progressive vs conservative terminology)
//
// AI MODE (Future): Would analyze:
// - Framing and word choice beyond keywords
// - Source selection and citation patterns
// - Omission of counter-perspectives
// - Emotional manipulation techniques
//
// See metrics-config.ts POLITICAL_BIAS.aiPromptTemplate for the AI prompt
// ============================================================================

// Known domain political leanings (simplified database)
const POLITICAL_DOMAIN_MAP: Record<string, PoliticalBiasIndicator> = {
  // Left-leaning
  "msnbc.com": "Left",
  "huffpost.com": "Left",
  "vox.com": "Center-Left",
  "nytimes.com": "Center-Left",
  "washingtonpost.com": "Center-Left",
  "theguardian.com": "Center-Left",
  "npr.org": "Center-Left",

  // Center
  "reuters.com": "Center",
  "apnews.com": "Center",
  "bbc.com": "Center",
  "pbs.org": "Center",
  "c-span.org": "Center",

  // Right-leaning
  "wsj.com": "Center-Right",
  "foxnews.com": "Right",
  "breitbart.com": "Far Right",
  "dailywire.com": "Right",
  "nationalreview.com": "Center-Right",
};

// Language patterns for political bias detection
const LEFT_LANGUAGE = [
  "progressive",
  "social justice",
  "systemic",
  "marginalized",
  "equity",
  "intersectional",
  "privilege",
  "oppression",
];

const RIGHT_LANGUAGE = [
  "traditional values",
  "free market",
  "limited government",
  "personal responsibility",
  "patriot",
  "liberty",
  "constitutional",
];

/**
 * Analyzes content for political bias
 */
export function analyzePoliticalBias(
  text: string,
  domain?: string,
): PoliticalBiasAnalysis {
  // Check domain first
  if (domain) {
    const cleanDomain = domain.replace("www.", "").toLowerCase();
    if (POLITICAL_DOMAIN_MAP[cleanDomain]) {
      return {
        indicator: POLITICAL_DOMAIN_MAP[cleanDomain],
        confidence: 80,
      };
    }
  }

  // Analyze language patterns
  const lowerText = text.toLowerCase();
  let leftScore = 0;
  let rightScore = 0;

  LEFT_LANGUAGE.forEach((term) => {
    if (lowerText.includes(term)) leftScore += 10;
  });

  RIGHT_LANGUAGE.forEach((term) => {
    if (lowerText.includes(term)) rightScore += 10;
  });

  // Determine indicator based on scores
  const diff = leftScore - rightScore;
  let indicator: PoliticalBiasIndicator;
  let confidence: number;

  if (Math.abs(diff) < 10) {
    indicator = "Center";
    confidence = 60;
  } else if (diff >= 30) {
    indicator = "Far Left";
    confidence = 70;
  } else if (diff >= 20) {
    indicator = "Left";
    confidence = 65;
  } else if (diff >= 10) {
    indicator = "Center-Left";
    confidence = 60;
  } else if (diff <= -30) {
    indicator = "Far Right";
    confidence = 70;
  } else if (diff <= -20) {
    indicator = "Right";
    confidence = 65;
  } else {
    indicator = "Center-Right";
    confidence = 60;
  }

  return { indicator, confidence };
}

// ============================================================================
// COMMERCIAL BIAS ANALYSIS
// ============================================================================
//
// LOCAL MODE: Detects promotional language and affiliate patterns
//
// AI MODE (Future): Would detect:
// - Native advertising disguised as content
// - Subtle product placement
// - Sponsored content without disclosure
// - Review manipulation patterns
//
// See metrics-config.ts COMMERCIAL_BIAS.aiPromptTemplate for the AI prompt
// ============================================================================

const COMMERCIAL_INDICATORS = [
  "buy now",
  "limited time",
  "exclusive offer",
  "discount",
  "sale",
  "promo",
  "coupon",
  "affiliate",
  "sponsored",
  "ad",
  "advertisement",
  "partner",
  "click here",
  "subscribe now",
  "free trial",
  "money back guarantee",
  "best price",
  "lowest price",
  "shop now",
  "order now",
];

const AFFILIATE_PATTERNS = [
  /\?ref=/i,
  /\?affiliate=/i,
  /\?partner=/i,
  /\?utm_/i,
  /amzn\.to/i,
  /bit\.ly/i,
  /tinyurl/i,
];

/**
 * Analyzes content for commercial bias
 */
export function analyzeCommercialBias(
  text: string,
  url?: string,
): CommercialBiasAnalysis {
  const lowerText = text.toLowerCase();
  let score = 0;

  // Check for commercial language
  COMMERCIAL_INDICATORS.forEach((indicator) => {
    if (lowerText.includes(indicator)) {
      score += 8;
    }
  });

  // Check for affiliate links
  let hasAffiliateLinks = false;
  if (url) {
    hasAffiliateLinks = AFFILIATE_PATTERNS.some((pattern) => pattern.test(url));
    if (hasAffiliateLinks) score += 20;
  }

  // Check for sponsored content markers
  const isSponsored =
    lowerText.includes("sponsored") ||
    lowerText.includes("paid partnership") ||
    lowerText.includes("advertisement");
  if (isSponsored) score += 30;

  return {
    score: Math.min(100, score),
    hasAffiliateLinks,
    isSponsored,
  };
}

// ============================================================================
// EMOTIONAL TONE ANALYSIS (Maps to "Vibe" in UI)
// ============================================================================
//
// LOCAL MODE: Keyword-based emotional classification
//
// AI MODE (Future): Would understand:
// - Sarcasm and irony
// - Cultural context
// - Emotional manipulation vs genuine expression
// - Clickbait vs legitimate urgency
//
// See metrics-config.ts VIBE.aiPromptTemplate for the AI prompt
// ============================================================================

const SENSATIONAL_WORDS = [
  "shocking",
  "unbelievable",
  "incredible",
  "amazing",
  "outrageous",
  "breaking",
  "urgent",
  "explosive",
  "bombshell",
  "devastating",
  "horrifying",
  "terrifying",
  "mind-blowing",
  "jaw-dropping",
];

const EMOTIONAL_WORDS = [
  "heartbreaking",
  "moving",
  "emotional",
  "passionate",
  "angry",
  "furious",
  "sad",
  "happy",
  "excited",
  "worried",
  "anxious",
  "disappointed",
];

const INSPIRING_WORDS = [
  "inspiring",
  "empowering",
  "empowerment",
  "uplifting",
  "hope",
  "hopeful",
  "strong",
  "courage",
  "resilient",
  "growth",
  "healing",
  "success",
  "triumph",
  "supportive",
  "inclusive",
  "community",
  "love",
  "kindness",
];

const TOXIC_WORDS = [
  "disgusting",
  "idiot",
  "stupid",
  "fake",
  "scam",
  "hate",
  "racist",
  "sexist",
  "ugly",
  "fat",
  "shame",
  "worst",
  "terrible",
  "horrible",
  "trash",
];

const FACTUAL_INDICATORS = [
  "according to",
  "research shows",
  "study finds",
  "data indicates",
  "statistics show",
  "evidence suggests",
  "experts say",
  "report states",
  "analysis reveals",
  "survey found",
  "university",
  "scientific",
];

const CONTROVERSIAL_WORDS = [
  "debate",
  "controversy",
  "polarizing",
  "argues",
  "claims",
  "denies",
  "alleged",
  "accused",
  "scandal",
  "conflict",
  "war",
  "fight",
];

/**
 * Analyzes emotional tone of content
 */
export function analyzeEmotionalTone(text: string): EmotionalTone {
  const lowerText = text.toLowerCase();

  // Helper to count matches
  const countMatches = (list: string[]) =>
    list.reduce(
      (count, word) => (lowerText.includes(word) ? count + 1 : count),
      0,
    );

  const sensationalCount = countMatches(SENSATIONAL_WORDS);
  const emotionalCount = countMatches(EMOTIONAL_WORDS);
  const factualCount = countMatches(FACTUAL_INDICATORS);
  const inspiringCount = countMatches(INSPIRING_WORDS);
  const toxicCount = countMatches(TOXIC_WORDS);
  const controversialCount = countMatches(CONTROVERSIAL_WORDS);

  // Priority detection (Toxic/Urgent usually override others)
  if (toxicCount >= 1) return "Toxic";
  if (sensationalCount >= 2 && sensationalCount > factualCount) return "Urgent"; // Using Urgent for Sensational in Vibe
  if (controversialCount >= 2) return "Controversial";

  // Positive vibes
  if (inspiringCount >= 1) return "Inspiring";

  // Intellectual vibes
  if (factualCount >= 2) return "Educational"; // Maps to "Smart" in UI

  // Fallbacks
  if (emotionalCount >= 2) return "Emotional";
  if (factualCount >= 1) return "Calm"; // Factual often feels Calm/Balanced

  return "Balanced"; // Default -> Chill/Neutral
}

// ============================================================================
// COMBINED ANALYSIS
// ============================================================================

/**
 * Performs complete bias analysis on content
 *
 * CURRENT: Uses local heuristics (keyword matching)
 * FUTURE: Can be upgraded to AI-powered analysis
 *
 * To upgrade to AI mode:
 * 1. Use analyzeMetrics() from metrics-analyzer.ts instead
 * 2. Configure metrics-config.ts with mode: "ai"
 * 3. Add GOOGLE_AI_API_KEY to environment
 *
 * @param text - The content to analyze
 * @param domain - Optional domain for political bias lookup
 * @param url - Optional URL for commercial bias detection
 * @returns BiasAnalysis object with all dimensions
 */
export function analyzeBias(
  text: string,
  domain?: string,
  url?: string,
): BiasAnalysis {
  return {
    genderBias: analyzeGenderBias(text),
    politicalBias: analyzePoliticalBias(text, domain),
    commercialBias: analyzeCommercialBias(text, url),
    emotionalTone: analyzeEmotionalTone(text),
  };
}
