/**
 * ============================================================================
 * AURORA AI SEARCH ENGINE - MAIN EXPORT
 * ============================================================================
 *
 * The world's first women-first search engine.
 * Combines Brave Search with Aurora's proprietary intelligence layer.
 *
 * ============================================================================
 * ARCHITECTURE
 * ============================================================================
 *
 * CURRENT: All metrics use LOCAL heuristics ($0 cost)
 * FUTURE: Can upgrade to AI-powered analysis per-metric
 *
 * To upgrade to AI mode:
 * 1. Configure metrics-config.ts (set mode: "ai" for desired metrics)
 * 2. Add API key to .env.local (e.g., GOOGLE_AI_API_KEY)
 * 3. Use analyzeMetrics() from metrics-analyzer.ts
 *
 * See metrics-config.ts for detailed documentation on AI upgrade path.
 *
 * ============================================================================
 */

// Types
export * from "./types";

// ============================================================================
// LOCAL ANALYZERS (Current Implementation - $0 Cost)
// ============================================================================
// These modules use keyword matching and pattern detection.
// They work offline and have zero API cost.
// Each has documentation for future AI upgrade.

export * from "./bias-analyzer"; // Gender, Political, Commercial bias + Emotional tone
export * from "./credibility-scorer"; // Source trustworthiness
export * from "./ai-detector"; // AI-generated content detection
export * from "./safety-analyzer"; // Safety flags for women
export * from "./sustainability-scorer"; // Eco/sustainability scoring

// ============================================================================
// METRICS CONFIGURATION (AI-Ready Architecture)
// ============================================================================
// Configure which metrics use local vs AI analysis.
// When you have budget, enable AI mode per-metric here.

export * from "./metrics-config";

// ============================================================================
// UNIFIED METRICS ANALYZER (Recommended Entry Point)
// ============================================================================
// Use analyzeMetrics() for all new code.
// It automatically handles local/AI switching based on config.

export * from "./metrics-analyzer";

// ============================================================================
// AI SERVICES
// ============================================================================

export * from "./gemini-service";
