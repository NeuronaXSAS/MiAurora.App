/**
 * Aurora App - Brave Search API Integration
 * 
 * The world's first women-first search engine powered by Brave Search.
 * Provides unique value through:
 * - AI content detection (% of AI-written content)
 * - Gender bias analysis
 * - Source credibility scoring
 * - Women-safety indicators
 * - Privacy-first search (no tracking)
 */

import { NextRequest, NextResponse } from "next/server";

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

// AI content detection patterns (simplified - in production use ML model)
const AI_CONTENT_PATTERNS = [
  /as an ai/i,
  /i cannot/i,
  /it's important to note/i,
  /in conclusion/i,
  /firstly.*secondly.*thirdly/i,
  /comprehensive guide/i,
  /delve into/i,
  /it's worth noting/i,
  /in this article/i,
  /let's explore/i,
];

// Bias indicators
const BIAS_POSITIVE_KEYWORDS = [
  "women", "female", "inclusive", "equality", "diverse", "empower",
  "support", "safe space", "gender equality", "women-led", "female-founded",
  "maternity", "work-life balance", "flexible", "inclusive workplace"
];

const BIAS_NEGATIVE_KEYWORDS = [
  "boys club", "male-dominated", "aggressive culture", "hostile",
  "discrimination", "harassment", "toxic", "glass ceiling", "pay gap",
  "sexism", "misogyny", "bro culture"
];

// Source credibility database (simplified)
const TRUSTED_DOMAINS = [
  "gov", "edu", "org", "who.int", "un.org", "bbc.com", "reuters.com",
  "nytimes.com", "theguardian.com", "npr.org", "pbs.org", "nature.com",
  "sciencedirect.com", "pubmed.gov", "harvard.edu", "stanford.edu"
];

const WOMEN_FOCUSED_DOMAINS = [
  "womenshealth.gov", "unwomen.org", "catalyst.org", "leanin.org",
  "girlswhocode.com", "womenintechnology.org", "sheeo.world",
  "globalfundforwomen.org", "womendeliver.org"
];

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
  family_friendly?: boolean;
  extra_snippets?: string[];
}

interface BraveSearchResponse {
  query: {
    original: string;
  };
  web?: {
    results: BraveWebResult[];
  };
  locations?: {
    results: Array<{
      id: string;
      title: string;
    }>;
  };
}

interface AuroraSearchResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  age?: string;
  // Aurora App unique metrics
  aiContentScore: number; // 0-100, percentage likely AI-generated
  biasScore: number; // 0-100, women-positive score
  biasLabel: string;
  credibilityScore: number; // 0-100
  credibilityLabel: string;
  isWomenFocused: boolean;
  safetyFlags: string[];
  source: "web" | "aurora";
}

function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch {
    return url;
  }
}

function calculateAIContentScore(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();
  
  // Check for AI patterns
  AI_CONTENT_PATTERNS.forEach(pattern => {
    if (pattern.test(lowerText)) score += 12;
  });
  
  // Check for overly formal/structured language
  if (lowerText.includes("furthermore")) score += 5;
  if (lowerText.includes("moreover")) score += 5;
  if (lowerText.includes("subsequently")) score += 5;
  if (lowerText.includes("comprehensive")) score += 5;
  
  // Check for lack of personal voice
  const personalPronouns = (lowerText.match(/\b(i|my|me|we|our)\b/g) || []).length;
  if (personalPronouns < 2 && text.length > 200) score += 10;
  
  return Math.min(100, Math.max(0, score));
}

function calculateBiasScore(text: string): { score: number; label: string } {
  let score = 50; // Start neutral
  const lowerText = text.toLowerCase();
  
  BIAS_POSITIVE_KEYWORDS.forEach(kw => {
    if (lowerText.includes(kw)) score += 5;
  });
  
  BIAS_NEGATIVE_KEYWORDS.forEach(kw => {
    if (lowerText.includes(kw)) score -= 8;
  });
  
  score = Math.min(100, Math.max(0, score));
  
  let label = "Neutral";
  if (score >= 75) label = "Women-Positive";
  else if (score >= 60) label = "Balanced";
  else if (score >= 40) label = "Neutral";
  else if (score >= 25) label = "Caution";
  else label = "Potential Bias";
  
  return { score, label };
}

function calculateCredibilityScore(domain: string): { score: number; label: string } {
  let score = 50;
  
  // Check TLD
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) score += 30;
  else if (domain.endsWith(".org")) score += 15;
  
  // Check trusted domains
  if (TRUSTED_DOMAINS.some(d => domain.includes(d))) score += 25;
  
  // Check women-focused domains
  if (WOMEN_FOCUSED_DOMAINS.some(d => domain.includes(d))) score += 20;
  
  // Penalize suspicious patterns
  if (domain.includes("blog") && !domain.includes("official")) score -= 10;
  if (domain.match(/\d{4,}/)) score -= 15; // Random numbers in domain
  
  score = Math.min(100, Math.max(0, score));
  
  let label = "Unknown";
  if (score >= 80) label = "Highly Trusted";
  else if (score >= 60) label = "Trusted";
  else if (score >= 40) label = "Moderate";
  else label = "Verify Source";
  
  return { score, label };
}

function detectSafetyFlags(text: string, url: string): string[] {
  const flags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Positive flags
  if (lowerText.includes("verified") || lowerText.includes("certified")) {
    flags.push("✓ Verified Content");
  }
  if (lowerText.includes("women-owned") || lowerText.includes("female-founded")) {
    flags.push("👩 Women-Led");
  }
  if (lowerText.includes("safe space") || lowerText.includes("inclusive")) {
    flags.push("🛡️ Safe Space");
  }
  
  // Warning flags
  if (lowerText.includes("scam") || lowerText.includes("fraud")) {
    flags.push("⚠️ Scam Warning");
  }
  if (lowerText.includes("harassment") || lowerText.includes("abuse")) {
    flags.push("⚠️ Safety Concern");
  }
  
  return flags;
}

function isWomenFocusedSource(domain: string, text: string): boolean {
  if (WOMEN_FOCUSED_DOMAINS.some(d => domain.includes(d))) return true;
  
  const lowerText = text.toLowerCase();
  const womenKeywords = ["women", "female", "girl", "mother", "sister", "feminine"];
  const matches = womenKeywords.filter(kw => lowerText.includes(kw)).length;
  
  return matches >= 2;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const count = parseInt(searchParams.get("count") || "10");
  const safesearch = searchParams.get("safesearch") || "moderate";

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  if (!BRAVE_API_KEY) {
    // Return mock data if no API key (for development)
    return NextResponse.json({
      query,
      results: [],
      auroraInsights: {
        overallBiasScore: 0,
        aiContentAverage: 0,
        womenFocusedCount: 0,
        message: "Brave Search API key not configured. Add BRAVE_SEARCH_API_KEY to environment variables."
      }
    });
  }

  try {
    // Call Brave Search API
    const braveUrl = new URL(BRAVE_SEARCH_URL);
    braveUrl.searchParams.set("q", query);
    braveUrl.searchParams.set("count", count.toString());
    braveUrl.searchParams.set("safesearch", safesearch);
    braveUrl.searchParams.set("text_decorations", "false");

    const response = await fetch(braveUrl.toString(), {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status}`);
    }

    const data: BraveSearchResponse = await response.json();
    const webResults = data.web?.results || [];

    // Process results with Aurora App intelligence
    const auroraResults: AuroraSearchResult[] = webResults.map((result) => {
      const domain = extractDomain(result.url);
      const fullText = `${result.title} ${result.description} ${(result.extra_snippets || []).join(" ")}`;
      
      const aiScore = calculateAIContentScore(fullText);
      const bias = calculateBiasScore(fullText);
      const credibility = calculateCredibilityScore(domain);
      const safetyFlags = detectSafetyFlags(fullText, result.url);
      const isWomenFocused = isWomenFocusedSource(domain, fullText);

      return {
        title: result.title,
        url: result.url,
        description: result.description,
        domain,
        age: result.age,
        aiContentScore: aiScore,
        biasScore: bias.score,
        biasLabel: bias.label,
        credibilityScore: credibility.score,
        credibilityLabel: credibility.label,
        isWomenFocused,
        safetyFlags,
        source: "web" as const,
      };
    });

    // Calculate aggregate insights
    const totalResults = auroraResults.length;
    const avgBiasScore = totalResults > 0 
      ? Math.round(auroraResults.reduce((sum, r) => sum + r.biasScore, 0) / totalResults)
      : 0;
    const avgAIScore = totalResults > 0
      ? Math.round(auroraResults.reduce((sum, r) => sum + r.aiContentScore, 0) / totalResults)
      : 0;
    const womenFocusedCount = auroraResults.filter(r => r.isWomenFocused).length;
    const avgCredibility = totalResults > 0
      ? Math.round(auroraResults.reduce((sum, r) => sum + r.credibilityScore, 0) / totalResults)
      : 0;

    return NextResponse.json({
      query: data.query?.original || query,
      totalResults,
      results: auroraResults,
      auroraInsights: {
        overallBiasScore: avgBiasScore,
        overallBiasLabel: avgBiasScore >= 60 ? "Women-Friendly Results" : avgBiasScore >= 40 ? "Mixed Results" : "Review Carefully",
        aiContentAverage: avgAIScore,
        aiContentLabel: avgAIScore >= 50 ? "High AI Content" : avgAIScore >= 25 ? "Some AI Content" : "Mostly Human",
        credibilityAverage: avgCredibility,
        womenFocusedCount,
        womenFocusedPercentage: totalResults > 0 ? Math.round((womenFocusedCount / totalResults) * 100) : 0,
        recommendation: avgBiasScore < 50 
          ? "These results may lack women's perspectives. Consider searching Aurora App community for women-first insights."
          : "Good representation of women-friendly content found.",
      },
      locations: data.locations?.results || [],
    });

  } catch (error) {
    console.error("Brave Search error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}
