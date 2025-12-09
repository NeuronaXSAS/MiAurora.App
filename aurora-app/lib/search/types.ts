/**
 * Aurora AI Search Engine - Core Types and Interfaces
 * 
 * The world's first women-first search engine.
 * These types define the Aurora Intelligence Layer that differentiates
 * Aurora App from Google, Bing, and other search engines.
 */

// ============================================
// SAFETY FLAGS
// ============================================

export type SafetyFlag =
  | 'Verified Content'
  | 'Women-Led'
  | 'Safe Space'
  | 'Scam Warning'
  | 'Safety Concern'
  | 'Women-Focused';

// ============================================
// BIAS ANALYSIS
// ============================================

export type GenderBiasLabel =
  | 'Women-Positive'
  | 'Balanced'
  | 'Neutral'
  | 'Caution'
  | 'Potential Bias';

export type PoliticalBiasIndicator =
  | 'Far Left'
  | 'Left'
  | 'Center-Left'
  | 'Center'
  | 'Center-Right'
  | 'Right'
  | 'Far Right';

export type EmotionalTone =
  | 'Factual'
  | 'Emotional'
  | 'Sensational'
  | 'Balanced'
  | 'Inspiring'
  | 'Toxic'
  | 'Urgent'
  | 'Controversial'
  | 'Calm'
  | 'Educational';

export interface GenderBiasAnalysis {
  score: number; // 0-100, higher = more women-positive
  label: GenderBiasLabel;
}

export interface PoliticalBiasAnalysis {
  indicator: PoliticalBiasIndicator;
  confidence: number; // 0-100
}

export interface CommercialBiasAnalysis {
  score: number; // 0-100
  hasAffiliateLinks: boolean;
  isSponsored: boolean;
}

export interface BiasAnalysis {
  genderBias: GenderBiasAnalysis;
  politicalBias: PoliticalBiasAnalysis;
  commercialBias: CommercialBiasAnalysis;
  emotionalTone: EmotionalTone;
}

// ============================================
// CREDIBILITY SCORING
// ============================================

export type CredibilityLabel =
  | 'Highly Trusted'
  | 'Trusted'
  | 'Moderate'
  | 'Verify Source';

export type DomainType =
  | 'gov'
  | 'edu'
  | 'news'
  | 'women-focused'
  | 'commercial'
  | 'unknown';

export interface CredibilityScore {
  score: number; // 0-100
  label: CredibilityLabel;
  factors: {
    domainType: DomainType;
    isVerifiedNews: boolean;
    isWomenFocused: boolean;
    domainAge?: number;
  };
}

// ============================================
// AI CONTENT DETECTION
// ============================================

export type AIContentLabel =
  | 'Mostly Human'
  | 'Some AI Content'
  | 'High AI Content';

export type AIContentColor = 'green' | 'yellow' | 'red';

export interface AIContentDetection {
  percentage: number; // 0-100
  label: AIContentLabel;
  color: AIContentColor;
  indicators: string[];
}

// ============================================
// SEARCH RESULTS
// ============================================

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon?: string;
  domain: string;
  age?: string;

  // Aurora Intelligence Layer
  biasAnalysis: BiasAnalysis;
  credibilityScore: CredibilityScore;
  aiContentDetection: AIContentDetection;
  safetyFlags: SafetyFlag[];

  // Metadata
  publishedDate?: string;
  isWomenFocused: boolean;
  source: 'web' | 'aurora';
}

// ============================================
// AURORA INSIGHTS (Aggregate Analysis)
// ============================================

export interface AuroraInsights {
  averageGenderBias: number;
  averageGenderBiasLabel: GenderBiasLabel;
  averageCredibility: number;
  averageCredibilityLabel: CredibilityLabel;
  averageAIContent: number;
  averageAIContentLabel: AIContentLabel;
  politicalDistribution: Record<PoliticalBiasIndicator, number>;
  womenFocusedCount: number;
  womenFocusedPercentage: number;
  recommendations: string[];
}

// ============================================
// API REQUEST/RESPONSE
// ============================================

export interface BraveSearchRequest {
  query: string;
  count?: number; // default: 10
  offset?: number; // for pagination
  freshness?: 'day' | 'week' | 'month' | 'year';
}

export interface BraveSearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  auroraInsights: AuroraInsights;
  cached: boolean;
  apiUsage: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface SummaryRequest {
  query: string;
  results: SearchResult[];
}

export interface SummaryResponse {
  summary: string;
  sources: string[];
  perspective: 'women-first' | 'balanced';
  generatedAt: string;
}

// ============================================
// ERROR HANDLING
// ============================================

export type SearchErrorCode =
  | 'INVALID_QUERY'
  | 'API_LIMIT'
  | 'API_ERROR'
  | 'NETWORK_ERROR';

export interface SearchError {
  code: SearchErrorCode;
  message: string;
  fallback: 'cached' | 'community' | 'none';
  retryAfter?: number; // seconds
}

// ============================================
// CACHE
// ============================================

export interface CachedSearch {
  queryHash: string;
  query: string;
  results: SearchResult[];
  auroraInsights: AuroraInsights;
  cachedAt: number;
  expiresAt: number;
  hitCount: number;
}

// ============================================
// API USAGE TRACKING
// ============================================

export interface APIUsage {
  month: string; // "2024-12"
  used: number;
  limit: number;
  lastUpdated: number;
}

// ============================================
// TRENDING & SUGGESTIONS
// ============================================

export type TrendingItemType = 'post' | 'route' | 'circle' | 'opportunity' | 'resource';

export interface TrendingItem {
  type: TrendingItemType;
  title: string;
  icon: string;
  id: string;
}

export interface SearchSuggestion {
  query: string;
  category: string;
  icon: string;
}
