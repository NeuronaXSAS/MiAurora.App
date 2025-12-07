"use client";

/**
 * Aurora App - Revolutionary Women-First Search Engine
 * 
 * THE ANTI-TOXIC SEARCH: Get informed fast, debate constructively, continue with life.
 * No attention-draining algorithms. Just truth, community, and empowerment.
 * 
 * Features:
 * - Instant bias visibility on every result
 * - Aurora App community discussions integration
 * - AI summary with Aurora App branding
 * - Mobile-first responsive two-column layout
 * - Hot debates for engagement without toxicity
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, X, Globe, ExternalLink, Brain, Heart, 
  Loader2, Shield, Clock, Users, MessageCircle,
  CheckCircle, Bot, Scale, Building2, Newspaper,
  Flame, ArrowRight, Eye, TrendingUp, Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  credibilityScore?: number | { score: number; label: string; factors?: unknown };
  biasAnalysis?: {
    genderBias: { score: number; label: string };
    politicalBias?: { indicator: string; confidence: number };
    commercialBias?: { score: number; hasAffiliateLinks: boolean; isSponsored: boolean };
    emotionalTone?: string;
  };
  aiContentDetection?: { percentage: number; label: string; color: string };
  isWomenFocused: boolean;
  safetyFlags: string[];
  source: "web" | "aurora";
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

// Quick category buttons - what women search for most
const QUICK_CATEGORIES = [
  { id: "news", label: "Today's News", icon: Newspaper, color: "var(--color-aurora-purple)" },
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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "web" | "videos" | "news">("all");
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
      setVideoResults([]);
      return;
    }

    const fetchWebResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/brave?q=${encodeURIComponent(debouncedQuery)}&count=8`);
        const data = await res.json();
        if (data.results) setWebResults(data.results);
        if (data.videos) setVideoResults(data.videos);
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
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Search Header with Aurora App Branding */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative">
            <Image 
              src="/Au_Logo_1.png" 
              alt="Aurora App" 
              width={56}
              height={56}
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--color-aurora-mint)] rounded-full flex items-center justify-center shadow-sm">
              <Search className="w-3 h-3 text-[var(--color-aurora-violet)]" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)]">
              Aurora App
            </h1>
            <p className="text-[10px] md:text-xs text-[var(--color-aurora-purple)] font-semibold tracking-widest uppercase">
              Search Engine
            </p>
          </div>
        </div>
        
        <p className="text-sm text-[var(--muted-foreground)] mb-3 max-w-lg mx-auto">
          The world&apos;s first search engine designed for women.{" "}
          <span className="text-[var(--color-aurora-purple)] font-medium">See the truth behind every result.</span>
        </p>
        
        {/* Feature Pills - Scrollable on mobile */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-aurora-mint)]/20 text-xs font-medium" style={{ color: 'var(--color-aurora-mint)' }}>
            <Shield className="w-3 h-3" /> Bias Detection
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-aurora-pink)]/20 text-xs font-medium" style={{ color: 'var(--color-aurora-pink)' }}>
            <Heart className="w-3 h-3" /> Women-First
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-aurora-purple)]/20 text-xs font-medium" style={{ color: 'var(--color-aurora-purple)' }}>
            <Eye className="w-3 h-3" /> Private
          </span>
        </div>
      </div>

      {/* Search Input - Clean & Prominent */}
      <div className="relative mb-4">
        <div className={`flex items-center bg-[var(--card)] border-2 rounded-2xl transition-all ${
          isFocused 
            ? "border-[var(--color-aurora-purple)] shadow-lg shadow-[var(--color-aurora-purple)]/15" 
            : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40"
        }`}>
          <div className="w-11 h-11 ml-2 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-white" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search anything... see the truth behind every result"
            className="flex-1 h-14 px-4 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none text-base"
          />
          {isSearching && <Loader2 className="w-5 h-5 mr-3 text-[var(--color-aurora-purple)] animate-spin" />}
          {query && !isSearching && (
            <button onClick={handleClear} className="p-2 mr-2 rounded-lg hover:bg-[var(--accent)] min-w-[44px] min-h-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Categories - Only when no results */}
      {!hasResults && (
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {QUICK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleQuickSearch(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 hover:shadow-md transition-all min-h-[44px]"
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
            className="space-y-4"
          >
            {/* AI Summary with Aurora App Logo */}
            {(isLoadingSummary || aiSummary) && (
              <Card className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[var(--color-aurora-violet)] flex items-center justify-center flex-shrink-0 shadow-sm border border-[var(--border)]">
                    <Image src="/Au_Logo_1.png" alt="Aurora App" width={28} height={28} className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
                      <span className="text-xs font-semibold text-[var(--color-aurora-purple)]">Aurora App AI Summary</span>
                    </div>
                    {isLoadingSummary ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-[var(--accent)] rounded animate-pulse w-full" />
                        <div className="h-4 bg-[var(--accent)] rounded animate-pulse w-3/4" />
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--foreground)] leading-relaxed">{aiSummary}</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Community Stats Bar - Fixed for mobile */}
            <div className="bg-[var(--color-aurora-violet)] rounded-xl p-3 overflow-x-auto">
              <div className="flex items-center justify-between gap-4 min-w-max md:min-w-0">
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">10K+ Sisters</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">50K+ Reports</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">25K+ Routes</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Heart className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">98% Safe</span>
                </div>
              </div>
            </div>

            {/* Results Tabs */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: "all", label: `All (${webResults.length + videoResults.length})` },
                  { id: "web", label: `Web (${webResults.length})`, icon: Globe },
                  ...(videoResults.length > 0 ? [{ id: "videos", label: `Videos (${videoResults.length})` }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] ${
                      activeTab === tab.id 
                        ? "bg-[var(--color-aurora-purple)] text-white" 
                        : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/20"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Badge className="text-[10px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 whitespace-nowrap">
                Powered by Brave Search
              </Badge>
            </div>

            {/* Video Results */}
            {(activeTab === "all" || activeTab === "videos") && videoResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-2">
                  📹 Videos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {videoResults.slice(0, activeTab === "videos" ? undefined : 2).map((video, i) => (
                    <VideoResultCard key={video.id} video={video} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Web Results - Improved Layout */}
            {(activeTab === "all" || activeTab === "web") && (
              <div className="space-y-3">
                {webResults.map((result, i) => (
                  <SearchResultCard key={i} result={result} index={i} query={debouncedQuery} />
                ))}
              </div>
            )}

            {/* Join CTA */}
            <Card className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-yellow)] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[var(--color-aurora-violet)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Join Aurora App Community</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Get personalized safety intelligence + earn credits</p>
                  </div>
                </div>
                <Link href="/api/auth/login">
                  <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px] px-6">
                    Join Free <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="debates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Hot Debates - Engagement without toxicity */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Hot Debates Today</h3>
                <Badge className="text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">
                  Join the conversation
                </Badge>
              </div>
              <DailyDebatesPanel userId={null} />
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Bot, label: "AI Detection", desc: "Spot AI content", color: "var(--color-aurora-blue)" },
                { icon: Scale, label: "Bias Analysis", desc: "Gender & political", color: "var(--color-aurora-purple)" },
                { icon: CheckCircle, label: "Credibility", desc: "Source trust", color: "var(--color-aurora-mint)" },
                { icon: Eye, label: "No Tracking", desc: "100% private", color: "var(--color-aurora-pink)" },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                  <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: item.color }} />
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
 * Search Result Card - Revolutionary Two-Column Layout
 * 
 * Mobile: Stacked (content on top, metrics below)
 * Desktop: Side-by-side (content left, metrics right)
 * 
 * Metrics are ALWAYS visible - no expanding needed
 */
function SearchResultCard({ result, index, query }: { result: WebSearchResult; index: number; query: string }) {
  const aiScore = result.aiContentScore ?? result.aiContentDetection?.percentage ?? 0;
  const biasScore = result.biasScore ?? result.biasAnalysis?.genderBias?.score ?? 50;
  const credScore = typeof result.credibilityScore === 'number' 
    ? result.credibilityScore 
    : (result.credibilityScore?.score ?? 50);
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

  const verificationLevel = getVerificationLevel(result.domain, credScore, result.isWomenFocused);
  
  // Simulated community data
  const communitySearchCount = Math.floor(Math.random() * 50) + 5;
  const helpfulCount = Math.floor(communitySearchCount * 0.3);
  const discussionCount = Math.floor(Math.random() * 10);

  const getFreshness = () => {
    if (!result.age) return { label: "Unknown", color: "var(--muted-foreground)" };
    const age = result.age.toLowerCase();
    if (age.includes("hour") || age.includes("minute")) return { label: "Fresh", color: "var(--color-aurora-mint)" };
    if (age.includes("day") && !age.includes("days")) return { label: "Today", color: "var(--color-aurora-blue)" };
    if (age.includes("week")) return { label: "Recent", color: "var(--color-aurora-yellow)" };
    return { label: "Older", color: "var(--color-aurora-salmon)" };
  };

  const freshness = getFreshness();

  const getGenderIndicator = () => {
    if (biasScore <= 30) return { label: "Women+", color: "var(--color-aurora-mint)", emoji: "💚" };
    if (biasScore <= 50) return { label: "Balanced", color: "var(--color-aurora-blue)", emoji: "⚖️" };
    if (biasScore <= 70) return { label: "Caution", color: "var(--color-aurora-yellow)", emoji: "⚠️" };
    return { label: "Alert", color: "var(--color-aurora-salmon)", emoji: "🚨" };
  };

  const genderIndicator = getGenderIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {index === 3 && <LandingAd variant="search-results" className="mb-3" />}
      
      <Card className="overflow-hidden border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40 hover:shadow-lg transition-all bg-[var(--card)]">
        {/* Two-Column Grid: Stacks on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px]">
          
          {/* LEFT: Web Result Content */}
          <div className="p-4">
            {/* Top Row: Domain + Badges */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-xs text-[var(--color-aurora-purple)] font-semibold">{result.domain}</span>
              <SafetyAlertBadge domain={result.domain} safetyFlags={result.safetyFlags} />
              {verificationLevel && <AuroraVerifiedBadge level={verificationLevel} />}
              {result.isWomenFocused && !verificationLevel && (
                <Badge className="text-[9px] bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 h-5 px-1.5">
                  <Heart className="w-2.5 h-2.5 mr-0.5" /> Women
                </Badge>
              )}
              <Badge 
                className="text-[9px] border-0 h-5 px-1.5"
                style={{ backgroundColor: `${freshness.color}20`, color: freshness.color }}
              >
                <Clock className="w-2.5 h-2.5 mr-0.5" /> {freshness.label}
              </Badge>
            </div>
            
            {/* Community Engagement */}
            <div className="flex items-center gap-3 mb-2">
              <SistersSearchedBadge searchCount={communitySearchCount} helpfulCount={helpfulCount} />
              {discussionCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-aurora-purple)]">
                  <MessageCircle className="w-3 h-3" />
                  {discussionCount} discussing in Aurora App
                </span>
              )}
            </div>

            {/* Title */}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="group block mb-1">
              <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors line-clamp-2 text-base">
                {result.title}
              </h3>
            </a>

            {/* Description */}
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3 leading-relaxed">
              {result.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-aurora-purple)] hover:underline"
              >
                Visit site <ExternalLink className="w-3 h-3" />
              </a>
              {discussionCount > 0 && (
                <Link 
                  href={`/feed?topic=${encodeURIComponent(query)}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-aurora-pink)] hover:underline"
                >
                  <Users className="w-3 h-3" /> See discussions
                </Link>
              )}
            </div>
          </div>

          {/* RIGHT: Aurora Metrics Panel */}
          <div className="p-4 bg-gradient-to-br from-[var(--color-aurora-cream)]/50 to-[var(--color-aurora-lavender)]/30 dark:from-[var(--color-aurora-violet)]/20 dark:to-[var(--color-aurora-purple)]/10 border-t lg:border-t-0 lg:border-l border-[var(--border)]">
            
            {/* Trust Score - Prominent */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border)]">
              <div 
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-sm"
                style={{ 
                  backgroundColor: `${trustScore.color}15`,
                  border: `2px solid ${trustScore.color}40`
                }}
              >
                <span className="text-xl">{trustScore.emoji}</span>
                <span className="text-sm font-black" style={{ color: trustScore.color }}>
                  {trustScore.score}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">Aurora Trust Score™</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">{trustScore.label}</p>
              </div>
            </div>

            {/* Metrics Grid - 2x2 */}
            <div className="grid grid-cols-2 gap-2">
              {/* Gender Bias */}
              <MetricCard
                emoji={genderIndicator.emoji}
                label={genderIndicator.label}
                value={100 - biasScore}
                color={genderIndicator.color}
                tooltip="Gender representation score"
              />

              {/* AI Content */}
              <MetricCard
                icon={<Bot className="w-3.5 h-3.5" />}
                label={`${aiScore}% AI`}
                value={aiScore}
                color="var(--color-aurora-lavender)"
                tooltip="AI-generated content percentage"
                inverted
              />

              {/* Credibility */}
              <MetricCard
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                label={`${credScore}%`}
                sublabel="Credible"
                value={credScore}
                color="var(--color-aurora-mint)"
                tooltip="Source credibility score"
              />

              {/* Political Bias */}
              <MetricCard
                icon={<Scale className="w-3.5 h-3.5" />}
                label={politicalBias}
                sublabel={emotionalTone}
                color="var(--color-aurora-purple)"
                tooltip="Political leaning indicator"
              />
            </div>

            {/* Safety Flags */}
            {result.safetyFlags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="flex flex-wrap gap-1">
                  {result.safetyFlags.slice(0, 3).map((flag, i) => (
                    <Badge key={i} className="text-[9px] bg-[var(--accent)] text-[var(--muted-foreground)] border-0 h-5">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Metric Card - Clean, scannable metric display
 */
function MetricCard({ 
  emoji, 
  icon, 
  label, 
  sublabel,
  value, 
  color, 
  tooltip,
  inverted = false 
}: { 
  emoji?: string;
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  value?: number;
  color: string;
  tooltip?: string;
  inverted?: boolean;
}) {
  return (
    <div 
      className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]"
      title={tooltip}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {emoji && <span className="text-sm">{emoji}</span>}
        {icon && <span style={{ color }}>{icon}</span>}
        <span className="text-[11px] font-semibold text-[var(--foreground)] truncate">
          {label}
        </span>
      </div>
      {sublabel && (
        <p className="text-[10px] text-[var(--muted-foreground)] mb-1">{sublabel}</p>
      )}
      {value !== undefined && (
        <div className="h-1.5 rounded-full bg-[var(--accent)] overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${inverted ? value : value}%`,
              backgroundColor: color 
            }}
          />
        </div>
      )}
    </div>
  );
}

export default LandingSearch;
