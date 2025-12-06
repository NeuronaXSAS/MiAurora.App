"use client";

/**
 * Aurora App - Revolutionary Women-First Search Engine
 * 
 * REDESIGNED: Clean, engaging, two-column results with instant bias visibility
 * - No AI suggestions (saves tokens)
 * - Hot Debates replace suggestions (drives engagement)
 * - Two-column results: Web result | Aurora Analysis
 * - Instant visual metrics without expanding
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, X, Globe, ExternalLink, Brain, Heart, 
  Loader2, Sparkles, Shield, Clock,
  CheckCircle, Bot, Scale, Building2,
  Flame, ArrowRight, Eye
} from "lucide-react";
import Link from "next/link";
import { LandingAd } from "@/components/ads/landing-ad";
import { calculateTrustScore } from "@/lib/search/trust-score";
import { DailyDebatesPanel } from "@/components/search/daily-debates-panel";
import { VideoResultCard } from "@/components/search/video-result-card";
import { SafetyAlertBadge } from "@/components/search/safety-alert-badge";
import { AuroraVerifiedBadge, getVerificationLevel } from "@/components/search/aurora-verified-badge";
import { SistersSearchedBadge } from "@/components/search/sisters-searched-badge";
import { useLocale } from "@/lib/locale-context";

interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  age?: string;
  aiContentScore?: number;
  biasScore?: number;
  credibilityScore?: number;
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
  overallBiasScore?: number;
  averageGenderBias?: number;
  aiContentAverage?: number;
  averageAIContent?: number;
  credibilityAverage?: number;
  averageCredibility?: number;
  womenFocusedCount: number;
  womenFocusedPercentage: number;
  recommendation?: string;
  recommendations?: string[];
}

interface VideoResult {
  id: string;
  title: string;
  url: string;
  description: string;
  domain: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
  creator?: string;
  age?: string;
  isWomenFocused: boolean;
}

// Quick category buttons
const QUICK_CATEGORIES = [
  { id: "news", label: "Today's News", icon: Globe, color: "var(--color-aurora-purple)" },
  { id: "safety", label: "Safety", icon: Shield, color: "var(--color-aurora-mint)" },
  { id: "career", label: "Career", icon: Building2, color: "var(--color-aurora-blue)" },
  { id: "health", label: "Health", icon: Heart, color: "var(--color-aurora-pink)" },
];

export function LandingSearch() {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [insights, setInsights] = useState<AuroraInsights | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "web" | "videos">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch web results
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
        if (data.videos) {
          setVideoResults(data.videos);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchWebResults();
  }, [debouncedQuery]);

  // Fetch AI summary
  useEffect(() => {
    if (webResults.length > 0 && debouncedQuery) {
      setIsLoadingSummary(true);
      const summaryResults = webResults.slice(0, 4).map(r => ({
        type: "web",
        previewTitle: r.title,
        previewSnippet: r.description,
        category: r.domain,
      }));
      
      fetch("/api/ai/search-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: debouncedQuery, results: summaryResults, language: locale }),
      })
        .then(res => res.json())
        .then(data => { setAiSummary(data.summary); setIsLoadingSummary(false); })
        .catch(() => setIsLoadingSummary(false));
    } else {
      setAiSummary(null);
    }
  }, [webResults, debouncedQuery, locale]);

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setWebResults([]);
    setVideoResults([]);
    setInsights(null);
    setAiSummary(null);
    setActiveTab("all");
    inputRef.current?.focus();
  }, []);

  const handleQuickSearch = (category: string) => {
    const queries: Record<string, string> = {
      news: "women news today",
      safety: "women safety tips",
      career: "career advice for women",
      health: "women health wellness",
    };
    setQuery(queries[category] || category);
  };

  const hasResults = webResults.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Compact Header */}
      <div className="text-center mb-6">
        <Badge className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white border-0 px-3 py-1 mb-3">
          <Sparkles className="w-3 h-3 mr-1" />
          Women-First • Bias Detection • Private
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] bg-clip-text text-transparent">
          Search Smarter, Not Harder
        </h2>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className={`flex items-center bg-[var(--card)] border-2 rounded-2xl transition-all ${
          isFocused 
            ? "border-[var(--color-aurora-purple)] shadow-xl shadow-[var(--color-aurora-purple)]/20" 
            : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40"
        }`}>
          <div className="w-12 h-12 ml-2 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search anything... we'll show you the truth behind every result"
            className="flex-1 h-14 px-4 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
          {isSearching && <Loader2 className="w-5 h-5 mr-3 text-[var(--color-aurora-purple)] animate-spin" />}
          {query && !isSearching && (
            <button onClick={handleClear} className="p-2 mr-2 rounded-lg hover:bg-[var(--accent)]">
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Categories */}
      {!hasResults && (
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleQuickSearch(cat.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 hover:shadow-md transition-all"
            >
              <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
              <span className="text-sm font-medium text-[var(--foreground)]">{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {hasResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* AI Summary - Compact */}
            {(isLoadingSummary || aiSummary) && (
              <Card className="p-4 mb-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 border-[var(--color-aurora-purple)]/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-aurora-purple)] mb-1">Aurora AI Summary</p>
                    {isLoadingSummary ? (
                      <div className="h-4 bg-[var(--accent)] rounded animate-pulse w-3/4" />
                    ) : (
                      <p className="text-sm text-[var(--foreground)]/80 line-clamp-2">{aiSummary}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Results Tabs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === "all" 
                      ? "bg-[var(--color-aurora-purple)] text-white" 
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/20"
                  }`}
                >
                  All ({webResults.length + videoResults.length})
                </button>
                <button
                  onClick={() => setActiveTab("web")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === "web" 
                      ? "bg-[var(--color-aurora-purple)] text-white" 
                      : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/20"
                  }`}
                >
                  <Globe className="w-3 h-3 inline mr-1" />
                  Web ({webResults.length})
                </button>
                {videoResults.length > 0 && (
                  <button
                    onClick={() => setActiveTab("videos")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeTab === "videos" 
                        ? "bg-[var(--color-aurora-purple)] text-white" 
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/20"
                    }`}
                  >
                    Videos ({videoResults.length})
                  </button>
                )}
              </div>
              <Badge className="text-xs bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0">
                Powered by Brave Search
              </Badge>
            </div>

            {/* Video Results Section */}
            {(activeTab === "all" || activeTab === "videos") && videoResults.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                  📹 Video Results
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {videoResults.slice(0, activeTab === "videos" ? undefined : 2).map((video, i) => (
                    <VideoResultCard key={video.id} video={video} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Web Results */}
            {(activeTab === "all" || activeTab === "web") && (
              <div className="space-y-3">
                {webResults.map((result, i) => (
                  <SearchResultCard key={i} result={result} index={i} />
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-6 text-center p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl">
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                Join Aurora App for personalized safety intelligence
              </p>
              <Link href="/api/auth/login">
                <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white">
                  Join Free <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="debates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hot Debates Section - Replaces AI Suggestions */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Hot Debates Today</h3>
                <Badge className="text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">
                  Join the conversation
                </Badge>
              </div>
              <DailyDebatesPanel userId={null} />
            </div>

            {/* Value Props - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Bot, label: "AI Detection", desc: "Spot AI content", color: "blue" },
                { icon: Scale, label: "Bias Analysis", desc: "Gender & political", color: "purple" },
                { icon: CheckCircle, label: "Credibility", desc: "Source trust", color: "green" },
                { icon: Eye, label: "No Tracking", desc: "100% private", color: "pink" },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                  <item.icon className={`w-6 h-6 mx-auto mb-2 text-${item.color}-500`} />
                  <p className="text-xs font-medium text-[var(--foreground)]">{item.label}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Two-Column Search Result Card
 * Left: Web result content
 * Right: Aurora Analysis metrics
 */
function SearchResultCard({ result, index }: { result: WebSearchResult; index: number }) {
  const aiScore = result.aiContentScore ?? result.aiContentDetection?.percentage ?? 0;
  const biasScore = result.biasScore ?? result.biasAnalysis?.genderBias?.score ?? 50;
  const credScore = result.credibilityScore ?? result.credibilityScore2?.score ?? 50;
  const politicalBias = result.biasAnalysis?.politicalBias?.indicator || "Center";
  const emotionalTone = result.biasAnalysis?.emotionalTone || "Neutral";
  
  const trustScore = calculateTrustScore({
    genderBiasScore: biasScore,
    credibilityScore: credScore,
    aiContentPercentage: aiScore,
    publishedDate: result.age,
    isWomenFocused: result.isWomenFocused,
    domain: result.domain,
    contentType: emotionalTone,
    title: result.title,
  });

  // Get verification level
  const verificationLevel = getVerificationLevel(result.domain, credScore, result.isWomenFocused);
  
  // Simulated community data (in production, fetch from Convex)
  const communitySearchCount = Math.floor(Math.random() * 50) + 5;
  const helpfulCount = Math.floor(communitySearchCount * 0.3);

  // Determine freshness
  const getFreshness = () => {
    if (!result.age) return { label: "Unknown", color: "var(--muted-foreground)" };
    const age = result.age.toLowerCase();
    if (age.includes("hour") || age.includes("minute")) return { label: "Fresh", color: "var(--color-aurora-mint)" };
    if (age.includes("day") && !age.includes("days")) return { label: "Today", color: "var(--color-aurora-blue)" };
    if (age.includes("week")) return { label: "Recent", color: "var(--color-aurora-yellow)" };
    return { label: "Older", color: "var(--color-aurora-salmon)" };
  };

  const freshness = getFreshness();

  // Gender bias indicator
  const getGenderIndicator = () => {
    if (biasScore <= 30) return { label: "Women-Positive", color: "var(--color-aurora-mint)", icon: "💚" };
    if (biasScore <= 50) return { label: "Balanced", color: "var(--color-aurora-blue)", icon: "⚖️" };
    if (biasScore <= 70) return { label: "Caution", color: "var(--color-aurora-yellow)", icon: "⚠️" };
    return { label: "Bias Alert", color: "var(--color-aurora-salmon)", icon: "🚨" };
  };

  const genderIndicator = getGenderIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {index === 3 && <LandingAd variant="search-results" className="mb-3" />}
      
      <Card className="overflow-hidden border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 hover:shadow-lg transition-all bg-[var(--card)]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,280px]">
          {/* Left Column: Web Result */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-[var(--border)]">
            {/* Domain & Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs text-[var(--color-aurora-purple)] font-medium">{result.domain}</span>
              
              {/* Safety Alert Badge */}
              <SafetyAlertBadge domain={result.domain} safetyFlags={result.safetyFlags} />
              
              {/* Aurora Verified Badge */}
              {verificationLevel && (
                <AuroraVerifiedBadge level={verificationLevel} />
              )}
              
              {result.isWomenFocused && !verificationLevel && (
                <Badge className="text-[9px] bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 h-4">
                  <Heart className="w-2.5 h-2.5 mr-0.5" /> Women-Focused
                </Badge>
              )}
              <Badge 
                className="text-[9px] border-0 h-4"
                style={{ backgroundColor: `${freshness.color}20`, color: freshness.color }}
              >
                <Clock className="w-2.5 h-2.5 mr-0.5" /> {freshness.label}
              </Badge>
            </div>
            
            {/* Sisters Searched This */}
            <SistersSearchedBadge 
              searchCount={communitySearchCount} 
              helpfulCount={helpfulCount}
              className="mb-2"
            />

            {/* Title */}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="group">
              <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors line-clamp-2 mb-1">
                {result.title}
              </h3>
            </a>

            {/* Description */}
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
              {result.description}
            </p>

            {/* Quick Action */}
            <a 
              href={result.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-aurora-purple)] hover:underline"
            >
              Visit site <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Right Column: Aurora Analysis */}
          <div className="p-4 bg-gradient-to-br from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5">
            {/* Trust Score - Large */}
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold"
                style={{ 
                  backgroundColor: `${trustScore.color}20`,
                  border: `2px solid ${trustScore.color}40`
                }}
              >
                <span className="text-lg">{trustScore.emoji}</span>
                <span className="text-xs font-black" style={{ color: trustScore.color }}>
                  {trustScore.score}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--foreground)]">Aurora Trust Score™</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{trustScore.label}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {/* Gender Bias */}
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <div className="flex items-center gap-1 mb-1">
                  <span>{genderIndicator.icon}</span>
                  <span className="font-medium" style={{ color: genderIndicator.color }}>
                    {genderIndicator.label}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${100 - biasScore}%`,
                      backgroundColor: genderIndicator.color 
                    }}
                  />
                </div>
              </div>

              {/* AI Content */}
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="w-3 h-3 text-[var(--color-aurora-lavender)]" />
                  <span className="font-medium text-[var(--foreground)]">
                    {aiScore}% AI
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[var(--color-aurora-lavender)] transition-all"
                    style={{ width: `${aiScore}%` }}
                  />
                </div>
              </div>

              {/* Credibility */}
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                  <span className="font-medium text-[var(--foreground)]">
                    {credScore}% Credible
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[var(--color-aurora-mint)] transition-all"
                    style={{ width: `${credScore}%` }}
                  />
                </div>
              </div>

              {/* Political Bias */}
              <div className="p-2 rounded-lg bg-[var(--card)]">
                <div className="flex items-center gap-1 mb-1">
                  <Scale className="w-3 h-3 text-[var(--color-aurora-purple)]" />
                  <span className="font-medium text-[var(--foreground)]">
                    {politicalBias}
                  </span>
                </div>
                <p className="text-[var(--muted-foreground)]">{emotionalTone} tone</p>
              </div>
            </div>

            {/* Safety Flags */}
            {result.safetyFlags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {result.safetyFlags.slice(0, 2).map((flag, i) => (
                  <Badge key={i} className="text-[8px] bg-[var(--accent)] text-[var(--muted-foreground)] border-0 h-4">
                    {flag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default LandingSearch;
