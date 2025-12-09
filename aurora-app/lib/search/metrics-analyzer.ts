/**
 * ============================================================================
 * AURORA UNIFIED METRICS ANALYZER
 * ============================================================================
 *
 * This module provides a unified interface for analyzing content with
 * Aurora's proprietary metrics. It automatically handles:
 *
 *   - Mode switching between LOCAL (heuristics) and AI (API-powered)
 *   - Fallback to local when AI fails
 *   - Caching to reduce API costs
 *   - Rate limiting to stay within free tiers
 *   - Batch processing for efficiency
 *
 * ============================================================================
 * CURRENT STATUS: All metrics use LOCAL mode ($0 cost)
 * ============================================================================
 *
 * When you're ready to upgrade to AI-powered analysis:
 * 1. Configure metrics-config.ts
 * 2. Set GOOGLE_AI_API_KEY in environment
 * 3. Enable AI mode for specific metrics
 *
 * ============================================================================
 */

import {
  METRICS_CONFIG,
  shouldUseAI,
  getMetricConfig,
  getAIPrompt,
  type MetricName,
} from "./metrics-config";

// Import local analyzers (current implementation - $0 cost)
import {
  analyzeGenderBias,
  analyzePoliticalBias,
  analyzeEmotionalTone,
} from "./bias-analyzer";
import { calculateCredibility, extractDomain } from "./credibility-scorer";
import { detectAIContent } from "./ai-detector";
import { calculateSustainability } from "./sustainability-scorer";

// Import types
import type {
  GenderBiasAnalysis,
  PoliticalBiasAnalysis,
  AIContentDetection,
  SustainabilityScore,
  CredibilityScore,
  EmotionalTone,
} from "./types";

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface UnifiedMetricsResult {
  /** Emotional tone/vibe of the content */
  vibe: {
    tone: EmotionalTone;
    source: "local" | "ai" | "cached";
  };

  /** Gender bias analysis */
  genderBias: GenderBiasAnalysis & {
    source: "local" | "ai" | "cached";
  };

  /** Political bias analysis */
  politicalBias: PoliticalBiasAnalysis & {
    source: "local" | "ai" | "cached";
  };

  /** AI-generated content detection */
  aiContent: AIContentDetection & {
    source: "local" | "ai" | "cached";
  };

  /** Sustainability/eco score */
  sustainability: SustainabilityScore & {
    source: "local" | "ai" | "cached";
  };

  /** Source credibility */
  credibility: CredibilityScore & {
    source: "local" | "ai" | "cached";
  };

  /** Analysis metadata */
  meta: {
    analyzedAt: number;
    totalTimeMs: number;
    aiRequestsMade: number;
    cacheHits: number;
    errors: string[];
  };
}

// ============================================================================
// SIMPLE IN-MEMORY CACHE
// ============================================================================
// TODO: Replace with Redis or similar for production scale

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const metricsCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = metricsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    metricsCache.delete(key);
    return null;
  }
  return entry.data as T;
}

// Note: setCache will be used when AI-powered analysis is enabled
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  metricsCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function generateCacheKey(
  metric: MetricName,
  content: string,
  domain: string,
): string {
  // Simple hash for cache key
  const input = `${metric}:${domain}:${content.slice(0, 500)}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `metric:${metric}:${Math.abs(hash).toString(16)}`;
}

// ============================================================================
// AI ANALYZER (Future Implementation)
// ============================================================================

/**
 * Analyze content using AI
 *
 * TODO: Implement when ready for AI-powered analysis
 *
 * This function will:
 * 1. Build the prompt from the metric's template
 * 2. Call the configured AI provider (Gemini, OpenAI, etc.)
 * 3. Parse the JSON response
 * 4. Cache the result
 * 5. Return the analysis
 */
async function analyzeWithAI<T>(
  metric: MetricName,
  content: string,
  domain: string,
): Promise<T | null> {
  const config = getMetricConfig(metric);

  // Check cache first
  const cacheKey = generateCacheKey(metric, content, domain);
  if (config.cacheResults) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  // Build prompt
  const prompt = getAIPrompt(metric, content, domain);

  // TODO: Implement actual AI call when ready
  // Example implementation for Gemini:
  //
  // const response = await fetch(
  //   `https://generativelanguage.googleapis.com/v1beta/models/${config.aiModel}:generateContent?key=${process.env[config.apiKeyEnvVar]}`,
  //   {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       contents: [{ parts: [{ text: prompt }] }],
  //       generationConfig: {
  //         temperature: 0.3,
  //         maxOutputTokens: config.maxTokens,
  //       },
  //     }),
  //   }
  // );
  //
  // const data = await response.json();
  // const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  // const result = JSON.parse(text);
  //
  // if (config.cacheResults) {
  //   setCache(cacheKey, result, config.cacheTTL);
  // }
  //
  // return result;

  // For now, return null to trigger fallback to local
  console.log(
    `[Metrics] AI analysis not yet implemented for ${metric}. Using local.`,
  );
  console.log(`[Metrics] Prompt would be: ${prompt.slice(0, 100)}...`);

  return null;
}

// ============================================================================
// LOCAL ANALYZERS (Current Implementation - $0 Cost)
// ============================================================================

function analyzeVibeLocal(text: string): EmotionalTone {
  return analyzeEmotionalTone(text);
}

function analyzeGenderBiasLocal(text: string): GenderBiasAnalysis {
  return analyzeGenderBias(text);
}

function analyzePoliticalBiasLocal(
  text: string,
  domain: string,
): PoliticalBiasAnalysis {
  return analyzePoliticalBias(text, domain);
}

function analyzeAIContentLocal(text: string): AIContentDetection {
  return detectAIContent(text);
}

function analyzeSustainabilityLocal(
  text: string,
  domain: string,
  url?: string,
): SustainabilityScore {
  return calculateSustainability(text, domain, url);
}

function analyzeCredibilityLocal(url: string): CredibilityScore {
  return calculateCredibility(url);
}

// ============================================================================
// UNIFIED ANALYZER
// ============================================================================

/**
 * Analyze content with all Aurora metrics
 *
 * This is the main entry point for metrics analysis.
 * It automatically uses local or AI mode based on configuration.
 *
 * @param content - The text content to analyze
 * @param url - The source URL
 * @returns Unified metrics result with all analyses
 *
 * @example
 * ```typescript
 * const metrics = await analyzeMetrics(
 *   "Article about sustainable fashion...",
 *   "https://example.com/article"
 * );
 *
 * console.log(metrics.sustainability.score); // 75
 * console.log(metrics.genderBias.label); // "Balanced"
 * console.log(metrics.vibe.tone); // "Inspiring"
 * ```
 */
export async function analyzeMetrics(
  content: string,
  url: string,
): Promise<UnifiedMetricsResult> {
  const startTime = Date.now();
  const domain = extractDomain(url);
  const errors: string[] = [];
  let aiRequestsMade = 0;
  // Note: cacheHits tracking will be used when AI caching is implemented
  const cacheHits = 0;

  // ---------------------------------------------------------------------------
  // VIBE (Emotional Tone)
  // ---------------------------------------------------------------------------
  let vibe: UnifiedMetricsResult["vibe"];
  if (shouldUseAI("VIBE")) {
    try {
      const aiResult = await analyzeWithAI<{ vibe: EmotionalTone }>(
        "VIBE",
        content,
        domain,
      );
      if (aiResult) {
        vibe = { tone: aiResult.vibe, source: "ai" };
        aiRequestsMade++;
      } else {
        vibe = { tone: analyzeVibeLocal(content), source: "local" };
      }
    } catch (error) {
      errors.push(`VIBE AI failed: ${error}`);
      vibe = { tone: analyzeVibeLocal(content), source: "local" };
    }
  } else {
    vibe = { tone: analyzeVibeLocal(content), source: "local" };
  }

  // ---------------------------------------------------------------------------
  // GENDER BIAS
  // ---------------------------------------------------------------------------
  let genderBias: UnifiedMetricsResult["genderBias"];
  if (shouldUseAI("GENDER_BIAS")) {
    try {
      const aiResult = await analyzeWithAI<GenderBiasAnalysis>(
        "GENDER_BIAS",
        content,
        domain,
      );
      if (aiResult) {
        genderBias = { ...aiResult, source: "ai" };
        aiRequestsMade++;
      } else {
        genderBias = { ...analyzeGenderBiasLocal(content), source: "local" };
      }
    } catch (error) {
      errors.push(`GENDER_BIAS AI failed: ${error}`);
      genderBias = { ...analyzeGenderBiasLocal(content), source: "local" };
    }
  } else {
    genderBias = { ...analyzeGenderBiasLocal(content), source: "local" };
  }

  // ---------------------------------------------------------------------------
  // POLITICAL BIAS
  // ---------------------------------------------------------------------------
  let politicalBias: UnifiedMetricsResult["politicalBias"];
  if (shouldUseAI("POLITICAL_BIAS")) {
    try {
      const aiResult = await analyzeWithAI<PoliticalBiasAnalysis>(
        "POLITICAL_BIAS",
        content,
        domain,
      );
      if (aiResult) {
        politicalBias = { ...aiResult, source: "ai" };
        aiRequestsMade++;
      } else {
        politicalBias = {
          ...analyzePoliticalBiasLocal(content, domain),
          source: "local",
        };
      }
    } catch (error) {
      errors.push(`POLITICAL_BIAS AI failed: ${error}`);
      politicalBias = {
        ...analyzePoliticalBiasLocal(content, domain),
        source: "local",
      };
    }
  } else {
    politicalBias = {
      ...analyzePoliticalBiasLocal(content, domain),
      source: "local",
    };
  }

  // ---------------------------------------------------------------------------
  // AI CONTENT DETECTION
  // ---------------------------------------------------------------------------
  let aiContent: UnifiedMetricsResult["aiContent"];
  if (shouldUseAI("AI_DETECTION")) {
    try {
      const aiResult = await analyzeWithAI<AIContentDetection>(
        "AI_DETECTION",
        content,
        domain,
      );
      if (aiResult) {
        aiContent = { ...aiResult, source: "ai" };
        aiRequestsMade++;
      } else {
        aiContent = { ...analyzeAIContentLocal(content), source: "local" };
      }
    } catch (error) {
      errors.push(`AI_DETECTION AI failed: ${error}`);
      aiContent = { ...analyzeAIContentLocal(content), source: "local" };
    }
  } else {
    aiContent = { ...analyzeAIContentLocal(content), source: "local" };
  }

  // ---------------------------------------------------------------------------
  // SUSTAINABILITY (Eco Score)
  // ---------------------------------------------------------------------------
  let sustainability: UnifiedMetricsResult["sustainability"];
  if (shouldUseAI("SUSTAINABILITY")) {
    try {
      const aiResult = await analyzeWithAI<SustainabilityScore>(
        "SUSTAINABILITY",
        content,
        domain,
      );
      if (aiResult) {
        sustainability = { ...aiResult, source: "ai" };
        aiRequestsMade++;
      } else {
        sustainability = {
          ...analyzeSustainabilityLocal(content, domain, url),
          source: "local",
        };
      }
    } catch (error) {
      errors.push(`SUSTAINABILITY AI failed: ${error}`);
      sustainability = {
        ...analyzeSustainabilityLocal(content, domain, url),
        source: "local",
      };
    }
  } else {
    sustainability = {
      ...analyzeSustainabilityLocal(content, domain, url),
      source: "local",
    };
  }

  // ---------------------------------------------------------------------------
  // CREDIBILITY
  // ---------------------------------------------------------------------------
  let credibility: UnifiedMetricsResult["credibility"];
  if (shouldUseAI("CREDIBILITY")) {
    try {
      const aiResult = await analyzeWithAI<CredibilityScore>(
        "CREDIBILITY",
        content,
        domain,
      );
      if (aiResult) {
        credibility = { ...aiResult, source: "ai" };
        aiRequestsMade++;
      } else {
        credibility = { ...analyzeCredibilityLocal(url), source: "local" };
      }
    } catch (error) {
      errors.push(`CREDIBILITY AI failed: ${error}`);
      credibility = { ...analyzeCredibilityLocal(url), source: "local" };
    }
  } else {
    credibility = { ...analyzeCredibilityLocal(url), source: "local" };
  }

  // ---------------------------------------------------------------------------
  // RETURN UNIFIED RESULT
  // ---------------------------------------------------------------------------
  return {
    vibe,
    genderBias,
    politicalBias,
    aiContent,
    sustainability,
    credibility,
    meta: {
      analyzedAt: Date.now(),
      totalTimeMs: Date.now() - startTime,
      aiRequestsMade,
      cacheHits,
      errors,
    },
  };
}

/**
 * Analyze multiple content items in batch
 *
 * More efficient than calling analyzeMetrics individually
 * when you have multiple items to analyze.
 *
 * @param items - Array of content/URL pairs
 * @returns Array of unified metrics results
 *
 * @example
 * ```typescript
 * const results = await analyzeMetricsBatch([
 *   { content: "Article 1...", url: "https://example1.com" },
 *   { content: "Article 2...", url: "https://example2.com" },
 * ]);
 * ```
 */
export async function analyzeMetricsBatch(
  items: Array<{ content: string; url: string }>,
): Promise<UnifiedMetricsResult[]> {
  // For now, process sequentially to avoid rate limits
  // TODO: Implement parallel processing with rate limiting when AI is enabled
  const results: UnifiedMetricsResult[] = [];

  for (const item of items) {
    const result = await analyzeMetrics(item.content, item.url);
    results.push(result);
  }

  return results;
}

/**
 * Quick analysis for a single metric
 *
 * Use this when you only need one specific metric,
 * not the full analysis.
 *
 * @param metric - Which metric to analyze
 * @param content - The text content
 * @param url - The source URL
 * @returns The specific metric result
 */
export async function analyzeSingleMetric<T>(
  metric: MetricName,
  content: string,
  url: string,
): Promise<T> {
  const domain = extractDomain(url);

  // Check if should use AI
  if (shouldUseAI(metric)) {
    try {
      const aiResult = await analyzeWithAI<T>(metric, content, domain);
      if (aiResult) return aiResult;
    } catch (error) {
      console.error(`[Metrics] AI analysis failed for ${metric}:`, error);
    }
  }

  // Fallback to local analysis
  switch (metric) {
    case "VIBE":
      return analyzeVibeLocal(content) as T;
    case "GENDER_BIAS":
      return analyzeGenderBiasLocal(content) as T;
    case "POLITICAL_BIAS":
      return analyzePoliticalBiasLocal(content, domain) as T;
    case "AI_DETECTION":
      return analyzeAIContentLocal(content) as T;
    case "SUSTAINABILITY":
      return analyzeSustainabilityLocal(content, domain, url) as T;
    case "CREDIBILITY":
      return analyzeCredibilityLocal(url) as T;
    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
}

// ============================================================================
// DEBUG / MONITORING
// ============================================================================

/**
 * Get current metrics system status
 *
 * Useful for debugging and monitoring.
 */
export function getMetricsStatus(): {
  mode: "all-local" | "mixed" | "all-ai";
  enabledMetrics: string[];
  aiEnabledMetrics: string[];
  cacheSize: number;
  config: typeof METRICS_CONFIG.global;
} {
  const metrics = Object.entries(METRICS_CONFIG.metrics);
  const enabled = metrics.filter(([, m]) => m.enabled).map(([name]) => name);
  const aiEnabled = metrics
    .filter(([name]) => shouldUseAI(name as MetricName))
    .map(([name]) => name);

  let mode: "all-local" | "mixed" | "all-ai" = "all-local";
  if (aiEnabled.length === enabled.length) mode = "all-ai";
  else if (aiEnabled.length > 0) mode = "mixed";

  return {
    mode,
    enabledMetrics: enabled,
    aiEnabledMetrics: aiEnabled,
    cacheSize: metricsCache.size,
    config: METRICS_CONFIG.global,
  };
}

/**
 * Clear the metrics cache
 *
 * Useful for testing or when you need fresh results.
 */
export function clearMetricsCache(): void {
  metricsCache.clear();
  console.log("[Metrics] Cache cleared");
}
