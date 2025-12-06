/**
 * Aurora AI Search Engine - Brave Search API Route
 * 
 * The world's first women-first search engine powered by Brave Search.
 * Provides unique value through:
 * - AI content detection (% of AI-written content)
 * - Gender bias analysis (multi-dimensional)
 * - Political bias analysis
 * - Commercial bias detection
 * - Source credibility scoring
 * - Women-safety indicators
 * - Privacy-first search (no tracking)
 * 
 * Requirements: 1.1, 2.1-2C, 3.1-3.5, 4.1-4.4, 7.1-7.4, 12.1-12.6
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeBias,
  calculateCredibility,
  detectAIContent,
  detectSafetyFlags,
  isContentWomenFocused,
  getGenderBiasLabel,
  getCredibilityLabel,
  getAIContentLabel,
} from "@/lib/search";
import { canUseBraveSearch, recordBraveSearchUsage } from "@/lib/resource-guard";
import type {
  SearchResult,
  AuroraInsights,
  BiasAnalysis,
  CredibilityScore,
  AIContentDetection,
  SafetyFlag,
  PoliticalBiasIndicator,
  GenderBiasLabel,
} from "@/lib/search/types";

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

// ============================================
// BRAVE API TYPES
// ============================================

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

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const count = parseInt(searchParams.get("count") || "10");
  const safesearch = searchParams.get("safesearch") || "moderate";

  // Property 1: Query Validation - minimum 2 characters
  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  // RESOURCE GUARD: Check if we have quota remaining
  const searchQuotaCheck = canUseBraveSearch();
  if (!searchQuotaCheck.allowed) {
    console.warn('⚠️ Brave Search limit reached:', searchQuotaCheck.reason);
    return NextResponse.json({
      query,
      totalResults: 0,
      results: [],
      cached: false,
      auroraInsights: {
        averageGenderBias: 0,
        averageGenderBiasLabel: "Neutral" as GenderBiasLabel,
        averageCredibility: 0,
        averageCredibilityLabel: "Verify Source",
        averageAIContent: 0,
        averageAIContentLabel: "Mostly Human",
        politicalDistribution: {},
        womenFocusedCount: 0,
        womenFocusedPercentage: 0,
        recommendations: ["Search limit reached. Please try again later."],
      },
      apiUsage: { used: searchQuotaCheck.remaining, limit: 1500, remaining: 0 },
      error: searchQuotaCheck.reason,
    });
  }

  // Check if API key is configured
  if (!BRAVE_API_KEY) {
    return NextResponse.json({
      query,
      totalResults: 0,
      results: [],
      cached: false,
      auroraInsights: {
        averageGenderBias: 0,
        averageGenderBiasLabel: "Neutral" as GenderBiasLabel,
        averageCredibility: 0,
        averageCredibilityLabel: "Verify Source",
        averageAIContent: 0,
        averageAIContentLabel: "Mostly Human",
        politicalDistribution: {},
        womenFocusedCount: 0,
        womenFocusedPercentage: 0,
        recommendations: ["Configure BRAVE_SEARCH_API_KEY in environment variables to enable web search."],
      },
      apiUsage: { used: 0, limit: 2000, remaining: 2000 },
      error: "Brave Search API key not configured",
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
      const errorText = await response.text();
      console.error("Brave API error:", response.status, errorText);
      throw new Error(`Brave Search API error: ${response.status}`);
    }

    const data: BraveSearchResponse = await response.json();
    const webResults = data.web?.results || [];

    // Process results with Aurora Intelligence Layer
    const auroraResults: SearchResult[] = webResults.map((result) => {
      const domain = extractDomain(result.url);
      const fullText = `${result.title} ${result.description} ${(result.extra_snippets || []).join(" ")}`;
      
      // Apply all analyzers
      const biasAnalysis: BiasAnalysis = analyzeBias(fullText, domain, result.url);
      const credibilityScore: CredibilityScore = calculateCredibility(result.url);
      const aiContentDetection: AIContentDetection = detectAIContent(fullText);
      const safetyFlags: SafetyFlag[] = detectSafetyFlags(fullText, result.url);
      const isWomenFocused = isContentWomenFocused(fullText, result.url);

      return {
        id: generateId(),
        title: result.title,
        url: result.url,
        description: result.description,
        domain,
        age: result.age,
        biasAnalysis,
        credibilityScore,
        aiContentDetection,
        safetyFlags,
        isWomenFocused,
        source: "web" as const,
      };
    });

    // Calculate Aurora Insights (aggregate analysis)
    const auroraInsights = calculateAuroraInsights(auroraResults);

    // RESOURCE GUARD: Record successful API usage
    recordBraveSearchUsage();

    return NextResponse.json({
      query: data.query?.original || query,
      totalResults: auroraResults.length,
      results: auroraResults,
      cached: false,
      auroraInsights,
      apiUsage: {
        used: 1,
        limit: 1500,
        remaining: searchQuotaCheck.remaining - 1,
      },
      locations: data.locations?.results || [],
    });

  } catch (error) {
    console.error("Brave Search error:", error);
    return NextResponse.json(
      { 
        error: "Search failed. Please try again.",
        fallback: "community",
      },
      { status: 500 }
    );
  }
}

// ============================================
// AURORA INSIGHTS CALCULATION
// ============================================

function calculateAuroraInsights(results: SearchResult[]): AuroraInsights {
  const totalResults = results.length;

  if (totalResults === 0) {
    return {
      averageGenderBias: 0,
      averageGenderBiasLabel: "Neutral",
      averageCredibility: 0,
      averageCredibilityLabel: "Verify Source",
      averageAIContent: 0,
      averageAIContentLabel: "Mostly Human",
      politicalDistribution: {} as Record<PoliticalBiasIndicator, number>,
      womenFocusedCount: 0,
      womenFocusedPercentage: 0,
      recommendations: [],
    };
  }

  // Calculate averages (Property 5: Average Calculation Correctness)
  const avgGenderBias = Math.round(
    results.reduce((sum, r) => sum + r.biasAnalysis.genderBias.score, 0) / totalResults
  );
  const avgCredibility = Math.round(
    results.reduce((sum, r) => sum + r.credibilityScore.score, 0) / totalResults
  );
  const avgAIContent = Math.round(
    results.reduce((sum, r) => sum + r.aiContentDetection.percentage, 0) / totalResults
  );

  // Calculate political distribution
  const politicalDistribution: Record<PoliticalBiasIndicator, number> = {
    "Far Left": 0,
    "Left": 0,
    "Center-Left": 0,
    "Center": 0,
    "Center-Right": 0,
    "Right": 0,
    "Far Right": 0,
  };
  results.forEach(r => {
    politicalDistribution[r.biasAnalysis.politicalBias.indicator]++;
  });

  // Count women-focused results
  const womenFocusedCount = results.filter(r => r.isWomenFocused).length;
  const womenFocusedPercentage = Math.round((womenFocusedCount / totalResults) * 100);

  // Generate recommendations
  const recommendations: string[] = [];
  
  // Requirement 2.5: Recommend community when bias < 50
  if (avgGenderBias < 50) {
    recommendations.push(
      "These results may lack women's perspectives. Explore Aurora App community for women-first insights."
    );
  }

  // Requirement 2B.5: Recommend alternatives when politically skewed
  const maxPolitical = Math.max(...Object.values(politicalDistribution));
  if (maxPolitical > totalResults * 0.6) {
    recommendations.push(
      "Results appear politically skewed. Consider viewing alternative perspectives for balanced information."
    );
  }

  // High AI content warning
  if (avgAIContent > 50) {
    recommendations.push(
      "High AI-generated content detected. Verify information from multiple sources."
    );
  }

  // Low credibility warning
  if (avgCredibility < 40) {
    recommendations.push(
      "Average source credibility is low. Consider verifying information from trusted sources."
    );
  }

  return {
    averageGenderBias: avgGenderBias,
    averageGenderBiasLabel: getGenderBiasLabel(avgGenderBias),
    averageCredibility: avgCredibility,
    averageCredibilityLabel: getCredibilityLabel(avgCredibility),
    averageAIContent: avgAIContent,
    averageAIContentLabel: getAIContentLabel(avgAIContent),
    politicalDistribution,
    womenFocusedCount,
    womenFocusedPercentage,
    recommendations,
  };
}
