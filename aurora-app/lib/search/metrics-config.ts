/**
 * ============================================================================
 * AURORA METRICS CONFIGURATION
 * ============================================================================
 *
 * This module defines the configuration for all Aurora search metrics.
 * It provides a unified interface for switching between:
 *
 *   1. LOCAL HEURISTICS (Current) - Zero cost, pattern-based analysis
 *   2. AI-POWERED ANALYSIS (Future) - Higher quality, requires API budget
 *
 * ============================================================================
 * ARCHITECTURE OVERVIEW
 * ============================================================================
 *
 * Each metric has:
 *   - `enabled`: Whether the metric is active
 *   - `mode`: "local" (heuristics) or "ai" (API-powered)
 *   - `aiProvider`: Which AI service to use when mode is "ai"
 *   - `fallbackToLocal`: If AI fails, use local heuristics as backup
 *   - `cacheResults`: Cache AI results to reduce costs
 *   - `cacheTTL`: How long to cache results (in seconds)
 *
 * ============================================================================
 * FUTURE AI INTEGRATION GUIDE
 * ============================================================================
 *
 * When you have budget for AI-powered analysis:
 *
 * 1. Set the metric's `mode` to "ai"
 * 2. Configure the `aiProvider` (gemini, openai, anthropic, etc.)
 * 3. Add your API key to environment variables
 * 4. Implement the AI analyzer in the corresponding module
 *
 * Example for enabling AI-powered gender bias analysis:
 *
 *   GENDER_BIAS: {
 *     ...
 *     mode: "ai",                    // Changed from "local"
 *     aiProvider: "gemini",          // Free tier available!
 *     aiModel: "gemini-1.5-flash",   // Fast and cheap
 *     ...
 *   }
 *
 * ============================================================================
 * COST ESTIMATES (As of 2024)
 * ============================================================================
 *
 * | Provider    | Model              | Cost per 1K tokens | Notes           |
 * |-------------|--------------------|--------------------|-----------------|
 * | Google      | gemini-1.5-flash   | FREE (15 RPM)      | Best for $0     |
 * | Google      | gemini-1.5-pro     | $0.00125           | Better quality  |
 * | OpenAI      | gpt-4o-mini        | $0.00015           | Good balance    |
 * | OpenAI      | gpt-4o             | $0.005             | Highest quality |
 * | Anthropic   | claude-3-haiku     | $0.00025           | Fast & cheap    |
 * | Anthropic   | claude-3-sonnet    | $0.003             | Better quality  |
 *
 * RECOMMENDATION: Start with Gemini 1.5 Flash (free tier) for testing,
 * then upgrade to paid tiers as your user base grows.
 *
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type MetricMode = "local" | "ai";

export type AIProvider =
  | "gemini" // Google AI Studio (recommended - has free tier)
  | "openai" // OpenAI API
  | "anthropic" // Claude API
  | "groq" // Groq (fast, has free tier)
  | "together" // Together AI
  | "local-llm"; // Self-hosted (Ollama, etc.)

export type MetricName =
  | "VIBE"
  | "GENDER_BIAS"
  | "POLITICAL_BIAS"
  | "AI_DETECTION"
  | "SUSTAINABILITY"
  | "CREDIBILITY"
  | "COMMERCIAL_BIAS";

export interface MetricConfig {
  /** Display name for the metric */
  displayName: string;

  /** Short description for tooltips */
  description: string;

  /** Whether this metric is enabled */
  enabled: boolean;

  /** Analysis mode: "local" for heuristics, "ai" for API-powered */
  mode: MetricMode;

  /** Which AI provider to use when mode is "ai" */
  aiProvider: AIProvider;

  /** Specific model to use (provider-dependent) */
  aiModel: string;

  /** If AI fails, fall back to local heuristics */
  fallbackToLocal: boolean;

  /** Cache AI results to reduce API costs */
  cacheResults: boolean;

  /** Cache TTL in seconds (default: 1 hour) */
  cacheTTL: number;

  /** Maximum tokens for AI analysis (controls cost) */
  maxTokens: number;

  /** Priority order (lower = analyzed first) */
  priority: number;

  /** Environment variable name for API key */
  apiKeyEnvVar: string;

  /**
   * AI Prompt template for this metric
   * Use {content} as placeholder for the text to analyze
   * Use {domain} as placeholder for the source domain
   */
  aiPromptTemplate: string;
}

export interface MetricsConfiguration {
  /** Global settings */
  global: {
    /** Default AI provider for all metrics */
    defaultProvider: AIProvider;

    /** Enable/disable all AI features globally */
    aiEnabled: boolean;

    /** Maximum concurrent AI requests */
    maxConcurrentRequests: number;

    /** Global rate limit (requests per minute) */
    rateLimitPerMinute: number;

    /** Enable debug logging for metrics */
    debug: boolean;
  };

  /** Individual metric configurations */
  metrics: Record<MetricName, MetricConfig>;
}

// ============================================================================
// DEFAULT CONFIGURATION (All Local - $0 Cost)
// ============================================================================

export const METRICS_CONFIG: MetricsConfiguration = {
  // ---------------------------------------------------------------------------
  // GLOBAL SETTINGS
  // ---------------------------------------------------------------------------
  global: {
    // Default AI provider when metrics are switched to AI mode
    // Gemini recommended because it has a generous free tier
    defaultProvider: "gemini",

    // Master switch for AI features
    // Set to true when you have budget and API keys configured
    aiEnabled: false,

    // Limit concurrent AI requests to avoid rate limits
    maxConcurrentRequests: 3,

    // Rate limit to stay within free tiers
    rateLimitPerMinute: 15, // Gemini free tier is 15 RPM

    // Enable for development/debugging
    // Set to true manually during development
    debug: false,
  },

  // ---------------------------------------------------------------------------
  // INDIVIDUAL METRICS
  // ---------------------------------------------------------------------------
  metrics: {
    // =========================================================================
    // VIBE (Emotional Tone Analysis)
    // =========================================================================
    VIBE: {
      displayName: "Vibe",
      description:
        "Emotional tone of the content (Inspiring, Toxic, Neutral, etc.)",
      enabled: true,
      mode: "local", // Currently using keyword matching

      // ----- FUTURE AI CONFIG -----
      // When ready for AI, change mode to "ai" and configure:
      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash", // Free tier!
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 3600, // 1 hour
      maxTokens: 100, // Keep responses short to minimize cost
      priority: 1,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Analyze the emotional tone of this content. Classify as ONE of: Inspiring, Toxic, Neutral, Calm, Urgent, Educational, Controversial.

Content: {content}
Source: {domain}

Return ONLY a JSON object: {"vibe": "Inspiring|Toxic|Neutral|Calm|Urgent|Educational|Controversial", "confidence": 0-100}`,
    },

    // =========================================================================
    // GENDER BIAS
    // =========================================================================
    GENDER_BIAS: {
      displayName: "Gender",
      description: "How women-friendly or potentially biased the content is",
      enabled: true,
      mode: "local", // Currently using keyword matching

      // ----- FUTURE AI CONFIG -----
      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash",
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 3600,
      maxTokens: 150,
      priority: 2,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Analyze this content for gender bias from a women's perspective.

Score from 0-100 where:
- 80-100: Women-Positive (actively supportive of women)
- 60-79: Balanced (fair representation)
- 40-59: Neutral (no clear signals)
- 20-39: Caution (some concerning patterns)
- 0-19: Potential Bias (problematic content)

Content: {content}
Source: {domain}

Return ONLY JSON: {"score": 0-100, "label": "Women-Positive|Balanced|Neutral|Caution|Potential Bias", "reason": "brief explanation"}`,
    },

    // =========================================================================
    // POLITICAL BIAS
    // =========================================================================
    POLITICAL_BIAS: {
      displayName: "Political",
      description: "Political leaning of the source (Left, Center, Right)",
      enabled: true,
      mode: "local", // Currently using domain database + keywords

      // ----- FUTURE AI CONFIG -----
      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash",
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 86400, // 24 hours (political bias is stable)
      maxTokens: 100,
      priority: 3,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Analyze the political bias of this content.

Classify as: Far Left, Left, Center-Left, Center, Center-Right, Right, Far Right

Content: {content}
Source: {domain}

Return ONLY JSON: {"indicator": "Center", "confidence": 0-100}`,
    },

    // =========================================================================
    // AI CONTENT DETECTION
    // =========================================================================
    AI_DETECTION: {
      displayName: "AI",
      description: "Percentage of content likely generated by AI",
      enabled: true,
      mode: "local", // Currently using pattern matching

      // ----- FUTURE AI CONFIG -----
      // Note: Ironically, AI is good at detecting AI!
      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash",
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 3600,
      maxTokens: 100,
      priority: 4,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Analyze if this content was written by AI (ChatGPT, Claude, etc.) or a human.

Look for:
- Overly formal language
- Common AI phrases ("It's important to note", "Let me explain")
- Lack of personal voice
- Uniform paragraph structure

Content: {content}

Return ONLY JSON: {"percentage": 0-100, "indicators": ["list", "of", "detected", "patterns"]}`,
    },

    // =========================================================================
    // SUSTAINABILITY (Eco Score)
    // =========================================================================
    SUSTAINABILITY: {
      displayName: "Eco",
      description: "Environmental and sustainability focus of the content",
      enabled: true,
      mode: "local", // Currently using keyword matching

      // ----- FUTURE AI CONFIG -----
      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash",
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 3600,
      maxTokens: 100,
      priority: 5,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Evaluate this content's environmental/sustainability focus.

Score 0-100 where:
- 80-100: Eco-Leader (actively promotes sustainability)
- 60-79: Eco-Aware (discusses environmental topics positively)
- 40-59: Neutral (no clear sustainability focus)
- 20-39: Caution (may promote harmful practices)
- 0-19: Concern (anti-environmental content)

Content: {content}
Source: {domain}

Return ONLY JSON: {"score": 0-100, "label": "Eco-Leader|Eco-Aware|Neutral|Caution|Concern"}`,
    },

    // =========================================================================
    // CREDIBILITY
    // =========================================================================
    CREDIBILITY: {
      displayName: "Credibility",
      description: "Trustworthiness of the source",
      enabled: true,
      mode: "local", // Currently using domain-based scoring

      // ----- FUTURE AI CONFIG -----
      // Note: AI can analyze writing quality, citations, etc.
      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash",
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 86400, // 24 hours (credibility is stable)
      maxTokens: 150,
      priority: 6,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Evaluate the credibility of this content and source.

Consider:
- Source reputation ({domain})
- Writing quality and professionalism
- Use of citations or evidence
- Balanced vs sensational language
- Factual accuracy signals

Content: {content}

Return ONLY JSON: {"score": 0-100, "label": "Highly Trusted|Trusted|Moderate|Verify Source", "factors": ["list", "of", "credibility", "factors"]}`,
    },

    // =========================================================================
    // COMMERCIAL BIAS (Hidden/Not shown in main UI currently)
    // =========================================================================
    COMMERCIAL_BIAS: {
      displayName: "Commercial",
      description: "Promotional content and affiliate link detection",
      enabled: false, // Not shown in UI yet, but ready for future
      mode: "local",

      aiProvider: "gemini",
      aiModel: "gemini-1.5-flash",
      fallbackToLocal: true,
      cacheResults: true,
      cacheTTL: 3600,
      maxTokens: 100,
      priority: 7,
      apiKeyEnvVar: "GOOGLE_AI_API_KEY",
      aiPromptTemplate: `Analyze this content for commercial bias.

Look for:
- Promotional language ("Buy now", "Limited time")
- Affiliate links or sponsored content
- Product placement
- Advertorial content disguised as articles

Content: {content}
URL: {domain}

Return ONLY JSON: {"score": 0-100, "hasAffiliateLinks": true|false, "isSponsored": true|false}`,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get configuration for a specific metric
 */
export function getMetricConfig(metric: MetricName): MetricConfig {
  return METRICS_CONFIG.metrics[metric];
}

/**
 * Check if a metric should use AI analysis
 *
 * NOTE: This function checks the configuration only.
 * Actual API key validation happens in the API routes (server-side).
 *
 * When implementing AI mode:
 * 1. Set METRICS_CONFIG.global.aiEnabled = true
 * 2. Set the metric's mode to "ai"
 * 3. Add the API key to your .env.local file
 * 4. The API route will validate the key at runtime
 */
export function shouldUseAI(metric: MetricName): boolean {
  const config = getMetricConfig(metric);

  // Currently, AI is disabled globally (aiEnabled = false)
  // When ready to enable:
  // 1. Set global.aiEnabled = true
  // 2. Set the specific metric's mode = "ai"
  // 3. API key validation will be done server-side in API routes

  return (
    METRICS_CONFIG.global.aiEnabled && config.enabled && config.mode === "ai"
  );
}

/**
 * Get all enabled metrics in priority order
 */
export function getEnabledMetrics(): MetricConfig[] {
  return Object.values(METRICS_CONFIG.metrics)
    .filter((m) => m.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get the AI prompt for a metric with placeholders replaced
 */
export function getAIPrompt(
  metric: MetricName,
  content: string,
  domain: string,
): string {
  const config = getMetricConfig(metric);
  return config.aiPromptTemplate
    .replace("{content}", content.slice(0, 2000)) // Limit content to reduce tokens
    .replace("{domain}", domain);
}

/**
 * Check if we're within rate limits
 * (Implement with your rate limiting library)
 */
export function canMakeAIRequest(): boolean {
  // TODO: Implement rate limiting when AI is enabled
  // For now, always return true for local mode
  return true;
}

// ============================================================================
// ENVIRONMENT VARIABLE REFERENCE
// ============================================================================
/**
 * Required environment variables for AI-powered metrics:
 *
 * # Google AI Studio (Gemini) - RECOMMENDED
 * # Get free API key at: https://makersuite.google.com/app/apikey
 * GOOGLE_AI_API_KEY=your_key_here
 *
 * # OpenAI (if you prefer GPT models)
 * # Get API key at: https://platform.openai.com/api-keys
 * OPENAI_API_KEY=your_key_here
 *
 * # Anthropic (if you prefer Claude)
 * # Get API key at: https://console.anthropic.com/
 * ANTHROPIC_API_KEY=your_key_here
 *
 * # Groq (fast inference, has free tier)
 * # Get API key at: https://console.groq.com/keys
 * GROQ_API_KEY=your_key_here
 */

// ============================================================================
// MIGRATION GUIDE: Local → AI
// ============================================================================
/**
 * Step-by-step guide to enable AI-powered metrics:
 *
 * 1. GET API KEY
 *    - Go to https://makersuite.google.com/app/apikey
 *    - Create a new API key (it's free!)
 *    - Add to .env.local: GOOGLE_AI_API_KEY=your_key
 *
 * 2. ENABLE AI GLOBALLY
 *    - In this file, set: global.aiEnabled = true
 *
 * 3. ENABLE AI FOR SPECIFIC METRIC
 *    - Change the metric's mode from "local" to "ai"
 *    - Example: GENDER_BIAS.mode = "ai"
 *
 * 4. TEST THOROUGHLY
 *    - Monitor API usage in Google AI Studio dashboard
 *    - Check logs for any errors
 *    - Compare AI results vs local heuristics
 *
 * 5. MONITOR COSTS
 *    - Set up billing alerts in Google Cloud Console
 *    - Start with free tier (15 requests/minute)
 *    - Upgrade as needed based on usage
 *
 * 6. OPTIMIZE
 *    - Enable caching to reduce duplicate API calls
 *    - Adjust maxTokens to control response length
 *    - Use batch processing for multiple results
 */

export default METRICS_CONFIG;
