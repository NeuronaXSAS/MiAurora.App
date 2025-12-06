"use client";

/**
 * Aurora App - Global Women-First Search Engine
 * 
 * Powered by Brave Search API with unique Aurora App intelligence:
 * - AI content detection (% of AI-written content)
 * - Gender bias analysis for each result
 * - Source credibility scoring
 * - Women-safety indicators
 * - Privacy-first search (no tracking)
 * 
 * REDESIGNED: Premium, empowering, modern, futuristic UI
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, X, FileText, MapPin as Route, Users, Briefcase, Shield, 
  Lock, ArrowRight, TrendingUp, Globe,
  Info, ExternalLink, Brain, Heart, Eye, Zap, Scale,
  Bot, ShieldCheck, Loader2, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { LandingAd } from "@/components/ads/landing-ad";
import { AISearchSuggestions } from "@/components/ai-search-suggestions";
import { TrustScoreBadge, InlineTrustScore } from "@/components/search/trust-score-badge";
import { calculateTrustScore } from "@/lib/search/trust-score";
// Community voting removed per Task 5.3 - doesn't contribute to business model
// Enhanced bias visualization now shows metrics inline
import { DailyNewsPanel } from "@/components/search/daily-news-panel";
import { DailyDebatesPanel } from "@/components/search/daily-debates-panel";

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  age?: string;
  // Support both old flat structure and new nested structure
  aiContentScore?: number;
  biasScore?: number;
  biasLabel?: string;
  credibilityScore?: number;
  credibilityLabel?: string;
  // New nested structure
  biasAnalysis?: {
    genderBias: { score: number; label: string };
    politicalBias?: { indicator: string; confidence: number };
    commercialBias?: { score: number; hasAffiliateLinks: boolean; isSponsored: boolean };
    emotionalTone?: string;
  };
  credibilityScore2?: { score: number; label: string };
  aiContentDetection?: { percentage: number; label: string; color: string };
  isWomenFocused: boolean;
  safetyFlags: string[];
  source: "web" | "aurora";
}

interface AuroraInsights {
  // Support both old and new field names for compatibility
  overallBiasScore?: number;
  averageGenderBias?: number;
  overallBiasLabel?: string;
  averageGenderBiasLabel?: string;
  aiContentAverage?: number;
  averageAIContent?: number;
  aiContentLabel?: string;
  averageAIContentLabel?: string;
  credibilityAverage?: number;
  averageCredibility?: number;
  womenFocusedCount: number;
  womenFocusedPercentage: number;
  recommendation?: string;
  recommendations?: string[];
}

interface CommunityResult {
  type: string;
  previewTitle: string;
  previewSnippet: string;
  category?: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  post: FileText, route: Route, circle: Users, opportunity: Briefcase,
  resource: Shield, web: Globe,
};

const typeColors: Record<string, string> = {
  post: "#5537a7", route: "#22c55e", circle: "#f29de5",
  opportunity: "#e5e093", resource: "#d6f4ec", web: "#3d0d73",
};

const typeLabels: Record<string, string> = {
  post: "Community", route: "Safe Route", circle: "Circle",
  opportunity: "Opportunity", resource: "Resource", web: "Web",
};



export function LandingSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [insights, setInsights] = useState<AuroraInsights | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "web" | "community">("all");
  // Community voting state removed - using enhanced bias visualization instead
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Community search from Convex
  const communityData = useQuery(
    api.publicSearch.publicSearch,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 6 } : "skip"
  );
  const communityResults = communityData?.results || [];

  // Trending content
  const trendingContent = useQuery(api.publicSearch.getTrendingPreview, {});

  // Fetch web results from Brave Search
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setWebResults([]);
      setInsights(null);
      return;
    }

    const fetchWebResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/brave?q=${encodeURIComponent(debouncedQuery)}&count=8`);
        const data = await res.json();
        if (data.results) {
          setWebResults(data.results);
          setInsights(data.auroraInsights);
        }
      } catch (err) {
        console.error("Web search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchWebResults();
  }, [debouncedQuery]);

  // Get user's language preference
  const getUserLanguage = useCallback(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('aurora-locale') || navigator.language.split('-')[0] || 'en';
  }, []);

  // URL hash computation removed - community voting replaced with enhanced bias visualization

  // Fetch AI summary with language support
  useEffect(() => {
    if (webResults.length > 0 && debouncedQuery) {
      setIsLoadingSummary(true);
      const summaryResults = webResults.map(r => ({
        type: "web",
        previewTitle: r.title,
        previewSnippet: r.description,
        category: r.domain,
      }));
      
      const language = getUserLanguage();
      
      fetch("/api/ai/search-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: debouncedQuery, results: summaryResults, language }),
      })
        .then(res => res.json())
        .then(data => { setAiSummary(data.summary); setIsLoadingSummary(false); })
        .catch(() => setIsLoadingSummary(false));
    } else {
      setAiSummary(null);
    }
  }, [webResults, debouncedQuery, getUserLanguage]);

  // Convert citation numbers [1], [2] etc. to clickable links
  const renderSummaryWithCitations = useCallback((text: string) => {
    if (!text) return null;
    
    // Split by citation pattern [1], [2], etc.
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationNum = parseInt(match[1], 10) - 1;
        const result = webResults[citationNum];
        if (result) {
          return (
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] rounded hover:bg-[var(--color-aurora-purple)]/20 transition-colors"
              title={result.title}
            >
              {part}
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  }, [webResults]);

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setWebResults([]);
    setInsights(null);
    setAiSummary(null);
    inputRef.current?.focus();
  }, []);

  const hasWebResults = webResults.length > 0;
  const hasCommunityResults = communityResults.length > 0;
  const hasAnyResults = hasWebResults || hasCommunityResults;
  const showTrending = !query && trendingContent && trendingContent.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Premium Search Header - More Empowering */}
      <div className="text-center mb-8">
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 mb-4"
        >
          <Badge className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white border-0 px-4 py-1.5 shadow-lg shadow-[var(--color-aurora-purple)]/30">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            AI-Powered • Bias Detection • Privacy-First
          </Badge>
        </motion.div>
        
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--color-aurora-purple)] via-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] bg-clip-text text-transparent mb-3"
        >
          The World's First Women-First Search Engine
        </motion.h3>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base text-[var(--muted-foreground)] max-w-xl mx-auto"
        >
          Search smarter with AI content detection, gender bias analysis & source credibility scores
        </motion.p>
      </div>

      {/* Premium Search Input - Larger, More Prominent */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className={`relative flex items-center bg-[var(--card)] border-2 rounded-2xl transition-all duration-300 ${
          isFocused 
            ? "border-[var(--color-aurora-purple)] shadow-2xl shadow-[var(--color-aurora-purple)]/25 scale-[1.01]" 
            : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 shadow-xl"
        }`}>
          <div className="absolute left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setIsFocused(true); setShowResults(true); }}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search anything... safety tips, career advice, places, news"
            className="w-full h-16 md:h-[72px] pl-[72px] pr-14 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none text-base md:text-lg font-medium"
          />
          {isSearching && (
            <div className="absolute right-14 w-8 h-8 rounded-full bg-[var(--color-aurora-purple)]/10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-[var(--color-aurora-purple)] animate-spin" />
            </div>
          )}
          {query && (
            <button onClick={handleClear} className="absolute right-4 p-2.5 rounded-xl hover:bg-[var(--accent)] transition-colors">
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>

        {/* AI-Powered Search Suggestions */}
        {!query && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <AISearchSuggestions onSuggestionClick={(q) => setQuery(q)} />
          </motion.div>
        )}
      </motion.div>

      {/* Results Panel */}
      {showResults && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          
          {/* Compact Summary Bar - Only show recommendation if needed */}
          {insights && hasWebResults && (insights.recommendation || (insights.recommendations && insights.recommendations.length > 0)) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-aurora-purple)]/5 rounded-lg border border-[var(--color-aurora-purple)]/10">
                <Info className="w-4 h-4 text-[var(--color-aurora-purple)] flex-shrink-0" />
                <p className="text-xs text-[var(--muted-foreground)]">
                  {insights.recommendation || insights.recommendations?.[0]}
                </p>
              </div>
            </motion.div>
          )}

          {/* AI Summary */}
          {(isLoadingSummary || aiSummary) && hasWebResults && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card className="p-5 bg-[var(--card)] border-[var(--color-aurora-purple)]/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-[var(--foreground)]">AI Summary</h4>
                      <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 text-xs">Women-First Perspective</Badge>
                    </div>
                    {isLoadingSummary ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-[var(--accent)] rounded animate-pulse w-full" />
                        <div className="h-4 bg-[var(--accent)] rounded animate-pulse w-3/4" />
                      </div>
                    ) : (
                      <div className="text-[var(--foreground)]/80 text-sm leading-relaxed">
                        {renderSummaryWithCitations(aiSummary || '')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          {hasAnyResults && (
            <div className="flex gap-2 mb-4">
              {[
                { id: "all", label: "All Results", count: webResults.length + communityResults.length },
                { id: "web", label: "Web", count: webResults.length },
                { id: "community", label: "Aurora App", count: communityResults.length },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-[var(--color-aurora-purple)] text-white"
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/10"
                  }`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-[var(--border)]"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Web Results */}
          {(activeTab === "all" || activeTab === "web") && hasWebResults && (
            <div className="space-y-3 mb-6">
              <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
                <Globe className="w-4 h-4" /> Web Results
                <Badge className="text-xs bg-[var(--accent)] border-0">Powered by Brave Search</Badge>
              </p>
              
              {webResults.map((result, i) => {
                // Calculate Aurora Trust Score™ for this result
                const aiScore = result.aiContentScore ?? result.aiContentDetection?.percentage ?? 0;
                const biasScore = result.biasScore ?? result.biasAnalysis?.genderBias?.score ?? 50;
                const credScore = result.credibilityScore ?? result.credibilityScore2?.score ?? 50;
                
                const trustScore = calculateTrustScore({
                  genderBiasScore: biasScore,
                  credibilityScore: credScore,
                  aiContentPercentage: aiScore,
                  publishedDate: result.age,
                  isWomenFocused: result.isWomenFocused,
                  domain: result.domain,
                  contentType: result.biasAnalysis?.emotionalTone,
                  title: result.title, // For context-aware explanations
                });
                
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    {i === 3 && <LandingAd variant="search-results" className="mb-3" />}
                    <Card className="overflow-hidden hover:shadow-lg transition-all border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 bg-[var(--card)]">
                      {/* Main Content */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Aurora Trust Score™ - Prominent Left Side */}
                          <div className="flex-shrink-0 hidden sm:block">
                            <div 
                              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold shadow-lg cursor-help"
                              style={{ 
                                backgroundColor: `${trustScore.color}15`,
                                boxShadow: `0 0 20px ${trustScore.color}30`,
                                border: `2px solid ${trustScore.color}40`
                              }}
                              title={`Aurora Trust Score: ${trustScore.score}/100 - ${trustScore.label}`}
                            >
                              <span className="text-lg">{trustScore.emoji}</span>
                              <span 
                                className="text-sm font-black"
                                style={{ color: trustScore.color }}
                              >
                                {trustScore.score}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Domain & Badges */}
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs text-[var(--color-aurora-purple)] font-medium">{result.domain}</span>
                              {/* Mobile Trust Score */}
                              <div className="sm:hidden">
                                <InlineTrustScore score={trustScore.score} color={trustScore.color} emoji={trustScore.emoji} />
                              </div>
                              {result.isWomenFocused && (
                                <Badge className="text-[9px] bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 h-5">
                                  <Heart className="w-2.5 h-2.5 mr-0.5" /> Women-Focused
                                </Badge>
                              )}
                              {result.safetyFlags.slice(0, 2).map((flag, fi) => (
                                <span key={fi} className="text-[9px] px-1.5 py-0.5 bg-[var(--accent)] rounded text-[var(--muted-foreground)]">{flag}</span>
                              ))}
                            </div>
                            {/* Title */}
                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="group">
                              <h4 className="font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--color-aurora-purple)] transition-colors leading-tight">
                                {result.title}
                              </h4>
                            </a>
                            {/* Description */}
                            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1.5">{result.description}</p>
                          </div>
                          <a href={result.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-[var(--accent)] rounded-lg transition-colors flex-shrink-0">
                            <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
                          </a>
                        </div>
                      </div>
                      
                      {/* Aurora Trust Score™ Details - Enhanced Bias Visualization */}
                      <div className="px-4 py-3 bg-gradient-to-r from-[var(--color-aurora-purple)]/5 via-[var(--accent)]/50 to-[var(--color-aurora-pink)]/5 border-t border-[var(--color-aurora-purple)]/10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <TrustScoreBadge trustScore={trustScore} compact={false} />
                          
                          {/* Enhanced Bias Metrics */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Gender Bias Indicator */}
                            {biasScore > 60 && (
                              <Badge className="text-[9px] bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)] border-0">
                                ⚠️ Gender Bias {biasScore}%
                              </Badge>
                            )}
                            {biasScore <= 30 && (
                              <Badge className="text-[9px] bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-violet)] border-0">
                                💚 Low Bias
                              </Badge>
                            )}
                            {/* AI Content Indicator */}
                            {aiScore > 50 && (
                              <Badge className="text-[9px] bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] border-0">
                                🤖 {aiScore}% AI
                              </Badge>
                            )}
                            {/* Credibility */}
                            {credScore >= 70 && (
                              <Badge className="text-[9px] bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-violet)] border-0">
                                ✓ Credible
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Community Results */}
          {(activeTab === "all" || activeTab === "community") && hasCommunityResults && (
            <div className="space-y-3 mb-6">
              <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
                <Users className="w-4 h-4" /> Aurora App Community
                <Badge className="text-xs bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0">Verified by Women</Badge>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {communityResults.map((result: CommunityResult, i: number) => {
                  const IconComponent = typeIcons[result.type] || FileText;
                  const color = typeColors[result.type] || "#5537a7";
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Link href="/api/auth/login">
                        <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 bg-[var(--card)] h-full">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                              <span style={{ color }}><IconComponent className="w-5 h-5" /></span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="text-[9px] border-0" style={{ backgroundColor: `${color}20`, color }}>
                                  {typeLabels[result.type] || result.type}
                                </Badge>
                                <Lock className="w-3 h-3 text-[var(--muted-foreground)]" />
                              </div>
                              <h4 className="font-medium text-[var(--foreground)] line-clamp-1 text-sm">{result.previewTitle}</h4>
                              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-1">{result.previewSnippet}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {query && debouncedQuery && !hasAnyResults && !isSearching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Search className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
              <p className="text-[var(--foreground)] font-medium text-lg">No results found</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2 mb-6">Try different keywords</p>
            </motion.div>
          )}

          {/* CTA */}
          {hasAnyResults && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-center py-6 bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 rounded-2xl">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Join Aurora App for full access to community insights & verified content
                </p>
              </div>
              <Link href="/api/auth/login">
                <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[48px] px-8 rounded-xl font-semibold">
                  Join Aurora App Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <p className="text-xs text-[var(--muted-foreground)] mt-3">🔒 No ads • No data selling • 100% privacy-first</p>
            </motion.div>
          )}

          {/* Daily Debates - "What Sisters Think" */}
          {!query && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 space-y-6">
              {/* 6 Daily Debates - Main engagement feature */}
              <DailyDebatesPanel userId={null} />
              
              {/* Daily News - Secondary content */}
              <DailyNewsPanel variant="landing" />
            </motion.div>
          )}

          {/* Trending */}
          {showTrending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Trending searches by women</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trendingContent.map((item: CommunityResult, i: number) => {
                  const IconComponent = typeIcons[item.type] || FileText;
                  const color = typeColors[item.type] || "#5537a7";
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link href="/api/auth/login">
                        <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 bg-[var(--card)]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                              <span style={{ color }}><IconComponent className="w-5 h-5" /></span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge className="text-[9px] border-0 mb-1" style={{ backgroundColor: `${color}20`, color }}>
                                {typeLabels[item.type] || item.type}
                              </Badge>
                              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">{item.previewTitle}</p>
                            </div>
                            <TrendingUp className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Premium Value Props - More Empowering */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
        {[
          { icon: Bot, label: "AI Detection", desc: "Spot AI-generated content instantly", color: "from-blue-500 to-cyan-500" },
          { icon: Scale, label: "Bias Analysis", desc: "Gender & political bias scores", color: "from-purple-500 to-pink-500" },
          { icon: ShieldCheck, label: "Credibility", desc: "Source trust verification", color: "from-green-500 to-emerald-500" },
          { icon: Eye, label: "No Tracking", desc: "100% private searches", color: "from-orange-500 to-amber-500" },
        ].map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="text-center p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 hover:shadow-lg transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">{item.label}</p>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Empowering Footer Message */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
          <span>Designed by women, for women. Search with confidence.</span>
        </p>
      </motion.div>
    </div>
  );
}
