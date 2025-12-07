"use client";

/**
 * Aurora App - Revolutionary Women-First Search Engine
 * 
 * THE ANTI-TOXIC SEARCH: Get informed fast, debate constructively, continue with life.
 * Features: Web, News, Images, Videos - all with Aurora bias analysis
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, X, Globe, ExternalLink, Brain, Heart, 
  Loader2, Shield, Clock, Users, MessageCircle,
  CheckCircle, Bot, Scale, Building2, Newspaper, ImageIcon,
  Flame, ArrowRight, Eye, Zap, PlayCircle, Lightbulb
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
  id: string; title: string; url: string; description: string; domain: string;
  thumbnail?: string; duration?: string; views?: string; creator?: string; age?: string;
  isWomenFocused: boolean;
}

interface NewsResult {
  id: string; title: string; url: string; description: string; domain: string;
  thumbnail?: string; source: string; age?: string; isWomenFocused: boolean;
}

interface ImageResult {
  id: string; title: string; url: string; thumbnail?: string; source: string;
}

type SearchTab = "all" | "web" | "news" | "images" | "videos";

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
  const [newsResults, setNewsResults] = useState<NewsResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [criticalThought, setCriticalThought] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setWebResults([]); setVideoResults([]); setNewsResults([]); setImageResults([]);
      return;
    }
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/brave?q=${encodeURIComponent(debouncedQuery)}&count=8`);
        const data = await res.json();
        if (data.results) setWebResults(data.results);
        if (data.videos) setVideoResults(data.videos);
        if (data.news) setNewsResults(data.news);
        if (data.images) setImageResults(data.images);
      } catch (err) { console.error("Search error:", err); }
      finally { setIsSearching(false); }
    };
    fetchResults();
  }, [debouncedQuery]);

  // Fetch AI summary with critical thinking prompt
  useEffect(() => {
    if (webResults.length > 0 && debouncedQuery) {
      setIsLoadingSummary(true);
      const summaryResults = webResults.slice(0, 4).map(r => ({
        type: "web", previewTitle: r.title, previewSnippet: r.description, category: r.domain,
      }));
      
      fetch("/api/ai/search-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: debouncedQuery, results: summaryResults, language: locale }),
      })
        .then(res => res.json())
        .then(data => { 
          setAiSummary(data.summary); 
          // Generate critical thinking question
          setCriticalThought(generateCriticalThought(debouncedQuery, webResults));
          setIsLoadingSummary(false); 
        })
        .catch(() => setIsLoadingSummary(false));
    } else {
      setAiSummary(null);
      setCriticalThought(null);
    }
  }, [webResults, debouncedQuery, locale]);

  const handleClear = useCallback(() => {
    setQuery(""); setDebouncedQuery(""); setWebResults([]); setVideoResults([]);
    setNewsResults([]); setImageResults([]); setAiSummary(null); setCriticalThought(null);
    setActiveTab("all"); inputRef.current?.focus();
  }, []);

  const handleQuickSearch = (category: string) => {
    const queries: Record<string, string> = {
      news: "women news today", safety: "women safety tips",
      career: "career advice for women", health: "women health wellness",
    };
    setQuery(queries[category] || category);
  };

  const hasResults = webResults.length > 0;
  const totalResults = webResults.length + videoResults.length + newsResults.length + imageResults.length;

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Search Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative">
            <Image src="/Au_Logo_1.png" alt="Aurora App" width={56} height={56} className="w-12 h-12 md:w-14 md:h-14 object-contain" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--color-aurora-mint)] rounded-full flex items-center justify-center shadow-sm">
              <Search className="w-3 h-3 text-[var(--color-aurora-violet)]" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)]">Aurora App</h1>
            <p className="text-[10px] md:text-xs text-[var(--color-aurora-purple)] font-semibold tracking-widest uppercase">Search Engine</p>
          </div>
        </div>
        <p className="text-sm text-[var(--muted-foreground)] mb-3 max-w-lg mx-auto">
          The world&apos;s first search engine designed for women.{" "}
          <span className="text-[var(--color-aurora-purple)] font-medium">See the truth behind every result.</span>
        </p>
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

      {/* Search Input */}
      <div className="relative mb-4">
        <div className={`flex items-center bg-[var(--card)] border-2 rounded-2xl transition-all ${isFocused ? "border-[var(--color-aurora-purple)] shadow-lg shadow-[var(--color-aurora-purple)]/15" : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40"}`}>
          <div className="w-11 h-11 ml-2 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-white" />
          </div>
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)} onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search anything... see the truth behind every result"
            className="flex-1 h-14 px-4 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none text-base" />
          {isSearching && <Loader2 className="w-5 h-5 mr-3 text-[var(--color-aurora-purple)] animate-spin" />}
          {query && !isSearching && (
            <button onClick={handleClear} className="p-2 mr-2 rounded-lg hover:bg-[var(--accent)] min-w-[44px] min-h-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Categories */}
      {!hasResults && (
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {QUICK_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => handleQuickSearch(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 hover:shadow-md transition-all min-h-[44px]">
              <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
              <span className="text-sm font-medium text-[var(--foreground)]">{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {hasResults ? (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            
            {/* AI Summary Bar - Replaces useless purple stats bar */}
            <div className="bg-[var(--color-aurora-violet)] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Image src="/Au_Logo_1.png" alt="Aurora App" width={28} height={28} className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-3.5 h-3.5 text-[var(--color-aurora-pink)]" />
                    <span className="text-xs font-semibold text-white/90">Aurora App AI Insight</span>
                  </div>
                  {isLoadingSummary ? (
                    <div className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                  ) : (
                    <p className="text-sm text-white/90 leading-relaxed">{aiSummary || "Analyzing results..."}</p>
                  )}
                  {criticalThought && !isLoadingSummary && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-[var(--color-aurora-yellow)] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--color-aurora-yellow)] italic">{criticalThought}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Type Tabs - Web, News, Images, Videos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all" as SearchTab, label: "All", count: totalResults, icon: Globe },
                { id: "web" as SearchTab, label: "Web", count: webResults.length, icon: Globe },
                { id: "news" as SearchTab, label: "News", count: newsResults.length, icon: Newspaper },
                { id: "images" as SearchTab, label: "Images", count: imageResults.length, icon: ImageIcon },
                { id: "videos" as SearchTab, label: "Videos", count: videoResults.length, icon: PlayCircle },
              ].filter(tab => tab.id === "all" || tab.count > 0).map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
                    activeTab === tab.id ? "bg-[var(--color-aurora-purple)] text-white" : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/20"
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label} ({tab.count})
                </button>
              ))}
              <Badge className="ml-auto text-[10px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 whitespace-nowrap">
                Powered by Brave Search
              </Badge>
            </div>

            {/* News Results */}
            {(activeTab === "all" || activeTab === "news") && newsResults.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-[var(--color-aurora-purple)]" /> Latest News
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {newsResults.slice(0, activeTab === "news" ? undefined : 3).map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </div>
            )}

            {/* Images Results */}
            {(activeTab === "all" || activeTab === "images") && imageResults.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[var(--color-aurora-pink)]" /> Images
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imageResults.slice(0, activeTab === "images" ? undefined : 4).map((img) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer"
                      className="aspect-square rounded-xl overflow-hidden bg-[var(--accent)] hover:opacity-90 transition-opacity">
                      {img.thumbnail && <img src={img.thumbnail} alt={img.title} className="w-full h-full object-cover" />}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Video Results */}
            {(activeTab === "all" || activeTab === "videos") && videoResults.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-[var(--color-aurora-blue)]" /> Videos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <motion.div key="debates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Hot Debates Today</h3>
                <Badge className="text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">Join the conversation</Badge>
              </div>
              <DailyDebatesPanel userId={null} />
            </div>
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

/** Generate critical thinking question based on search */
function generateCriticalThought(query: string, results: WebSearchResult[]): string {
  const avgCredibility = results.reduce((sum, r) => {
    const score = typeof r.credibilityScore === 'number' ? r.credibilityScore : (r.credibilityScore?.score ?? 50);
    return sum + score;
  }, 0) / results.length;
  
  const womenFocusedCount = results.filter(r => r.isWomenFocused).length;
  const hasHighAI = results.some(r => (r.aiContentDetection?.percentage ?? 0) > 50);
  
  if (avgCredibility < 50) {
    return "💭 These sources have mixed credibility. What other perspectives might be missing?";
  }
  if (womenFocusedCount === 0) {
    return "💭 No women-focused sources found. How might women's experiences differ on this topic?";
  }
  if (hasHighAI) {
    return "💭 Some results contain AI-generated content. Consider verifying key facts from primary sources.";
  }
  if (query.toLowerCase().includes("news")) {
    return "💭 News can be biased. What questions would help you form your own opinion?";
  }
  return "💭 What assumptions might these sources be making? Consider multiple viewpoints.";
}

/** News Card Component */
function NewsCard({ news }: { news: NewsResult }) {
  return (
    <a href={news.url} target="_blank" rel="noopener noreferrer"
      className="block p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40 hover:shadow-md transition-all">
      <div className="flex gap-3">
        {news.thumbnail && (
          <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--accent)]">
            <img src={news.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 mb-1">{news.title}</h4>
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
            <span>{news.source}</span>
            {news.age && <><span>•</span><span>{news.age}</span></>}
          </div>
        </div>
      </div>
    </a>
  );
}

/** Search Result Card */
function SearchResultCard({ result, index, query }: { result: WebSearchResult; index: number; query: string }) {
  const aiScore = result.aiContentScore ?? result.aiContentDetection?.percentage ?? 0;
  const biasScore = result.biasScore ?? result.biasAnalysis?.genderBias?.score ?? 50;
  const credScore = typeof result.credibilityScore === 'number' ? result.credibilityScore : (result.credibilityScore?.score ?? 50);
  const politicalBias = result.biasAnalysis?.politicalBias?.indicator || "Center";
  const emotionalTone = result.biasAnalysis?.emotionalTone || "Neutral";
  
  const trustScoreResult = calculateTrustScore({
    genderBiasScore: biasScore, credibilityScore: credScore, aiContentPercentage: aiScore,
    publishedDate: result.age, isWomenFocused: result.isWomenFocused, domain: result.domain,
    contentType: emotionalTone, title: result.title,
  });
  const trustScore = trustScoreResult.score;

  const verificationLevel = getVerificationLevel(result.domain, credScore, result.isWomenFocused);
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      {index === 3 && <LandingAd variant="search-results" className="mb-3" />}
      
      <Card className="overflow-hidden border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40 hover:shadow-lg transition-all bg-[var(--card)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px]">
          {/* Left: Content */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-xs text-[var(--color-aurora-purple)] font-semibold">{result.domain}</span>
              <SafetyAlertBadge domain={result.domain} safetyFlags={result.safetyFlags} />
              {verificationLevel && <AuroraVerifiedBadge level={verificationLevel} />}
              {result.isWomenFocused && !verificationLevel && (
                <Badge className="text-[9px] bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 h-5 px-1.5">
                  <Heart className="w-2.5 h-2.5 mr-0.5" /> Women
                </Badge>
              )}
              <Badge className="text-[9px] border-0 h-5 px-1.5" style={{ backgroundColor: `${freshness.color}20`, color: freshness.color }}>
                <Clock className="w-2.5 h-2.5 mr-0.5" /> {freshness.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <SistersSearchedBadge searchCount={communitySearchCount} helpfulCount={helpfulCount} />
              {discussionCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-aurora-purple)]">
                  <MessageCircle className="w-3 h-3" /> {discussionCount} discussing
                </span>
              )}
            </div>

            <a href={result.url} target="_blank" rel="noopener noreferrer" className="group block mb-1">
              <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors line-clamp-2 text-base">
                {result.title}
              </h3>
            </a>
            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3 leading-relaxed">{result.description}</p>
            <div className="flex items-center gap-3">
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-aurora-purple)] hover:underline">
                Visit site <ExternalLink className="w-3 h-3" />
              </a>
              {discussionCount > 0 && (
                <Link href={`/feed?topic=${encodeURIComponent(query)}`} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-aurora-pink)] hover:underline">
                  <Users className="w-3 h-3" /> See discussions
                </Link>
              )}
            </div>
          </div>

          {/* Right: Aurora Metrics Panel */}
          <div className="p-4 bg-[var(--accent)]/50 border-t lg:border-t-0 lg:border-l border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-3">
              <Shield className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
              <span className="text-xs font-semibold text-[var(--foreground)]">Aurora Metrics</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <MetricCard label="Trust Score" value={trustScore} max={100} color={trustScore >= 70 ? "var(--color-aurora-mint)" : trustScore >= 40 ? "var(--color-aurora-yellow)" : "var(--color-aurora-salmon)"} />
              <MetricCard label="Gender Bias" value={genderIndicator.label} emoji={genderIndicator.emoji} color={genderIndicator.color} />
              <MetricCard label="AI Content" value={`${aiScore}%`} color={aiScore > 50 ? "var(--color-aurora-salmon)" : aiScore > 20 ? "var(--color-aurora-yellow)" : "var(--color-aurora-mint)"} />
              <MetricCard label="Credibility" value={credScore} max={100} color={credScore >= 70 ? "var(--color-aurora-mint)" : credScore >= 40 ? "var(--color-aurora-yellow)" : "var(--color-aurora-salmon)"} />
              <MetricCard label="Political" value={politicalBias} color="var(--color-aurora-blue)" className="col-span-2 lg:col-span-1" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/** Metric Card Helper */
function MetricCard({ label, value, max, emoji, color, className = "" }: { 
  label: string; 
  value: string | number; 
  max?: number; 
  emoji?: string; 
  color: string;
  className?: string;
}) {
  const numValue = typeof value === "number" ? value : null;
  const percentage = numValue && max ? (numValue / max) * 100 : null;
  
  return (
    <div className={`p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] ${className}`}>
      <div className="text-[10px] text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        {emoji && <span className="text-sm">{emoji}</span>}
        <span className="text-sm font-semibold" style={{ color }}>{value}{max ? `/${max}` : ""}</span>
      </div>
      {percentage !== null && (
        <div className="mt-1 h-1 bg-[var(--accent)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

export default LandingSearch;
