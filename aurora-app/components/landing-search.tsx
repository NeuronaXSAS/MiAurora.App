"use client";

/**
 * Aurora App - Revolutionary Women-First Search Engine
 * 
 * Landing page search experience with:
 * - Unified search bar with integrated results
 * - Judge mode results flow from within the search box
 * - Web search with bias detection and AI insights
 * - Community search via Convex API
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Globe, ExternalLink, Heart, Loader2, Shield, Bot, Scale,
  ArrowRight, Zap, Sparkles, Users, MessageSquare, MapPin, Briefcase, Flame
} from "lucide-react";
import { LandingAd } from "@/components/ads/landing-ad";
import { calculateTrustScore } from "@/lib/search/trust-score";
import { DailyDebatesPanel } from "@/components/search/daily-debates-panel";
import { SafetyAlertBadge } from "@/components/search/safety-alert-badge";
import { AuroraVerifiedBadge, getVerificationLevel } from "@/components/search/aurora-verified-badge";
import { useLocale } from "@/lib/locale-context";
import { AuroraSearchBox, type SearchMode, type SearchData } from "@/components/search/aurora-search-box";

// ==================== TYPES ====================

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
    emotionalTone?: string;
  };
  aiContentDetection?: { percentage: number; label: string; color: string };
  isWomenFocused: boolean;
  safetyFlags: string[];
}

interface CommunityResult {
  type: "post" | "route" | "circle" | "opportunity" | "resource";
  id: string;
  previewTitle: string;
  previewSnippet: string;
  category?: string;
  stats?: { label: string; value: string };
  createdAt: number;
}

// ==================== MAIN COMPONENT ====================

export function LandingSearch() {
  useLocale();

  // Core state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeMode, setActiveMode] = useState<SearchMode | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Web search results
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Community search via Convex
  const communityResults = useQuery(
    api.publicSearch.publicSearch,
    debouncedQuery.length >= 2 && activeMode === "community"
      ? { query: debouncedQuery, limit: 12 }
      : "skip"
  );

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch web results
  useEffect(() => {
    if (debouncedQuery.length < 2 || activeMode !== "web") {
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search/brave?q=${encodeURIComponent(debouncedQuery)}&count=8`);
        const data = await res.json();
        if (data.results) setWebResults(data.results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedQuery, activeMode]);

  // Generate AI insight
  useEffect(() => {
    if (webResults.length > 0 && debouncedQuery && activeMode === "web") {
      setIsLoadingAI(true);
      const insight = generateAuroraInsight(debouncedQuery, webResults);
      setTimeout(() => {
        setAiInsight(insight);
        setIsLoadingAI(false);
      }, 600);
    } else {
      setAiInsight(null);
    }
  }, [webResults, debouncedQuery, activeMode]);

  // Handle search from AuroraSearchBox
  const handleSearch = useCallback(async (searchQuery: string, mode: SearchMode, _data?: SearchData) => {
    // Judge mode is handled entirely within the AuroraSearchBox now
    if (mode === "judge") {
      setActiveMode(null); // Don't show external results for judge
      return;
    }

    setQuery(searchQuery);
    setActiveMode(mode);

    if (mode === "web") {
      setWebResults([]);
      setAiInsight(null);
    }
  }, []);

  // Reset to home
  const handleReset = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setWebResults([]);
    setAiInsight(null);
    setActiveMode(null);
  }, []);

  const hasWebResults = webResults.length > 0;
  const hasCommunityResults = communityResults?.results && communityResults.results.length > 0;
  const showExternalResults = activeMode === "web" || activeMode === "community";

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Search Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
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
        <p className="text-sm text-[var(--muted-foreground)] mb-2 max-w-lg mx-auto">
          The world&apos;s first search engine designed for women.{" "}
          <span className="text-[var(--color-aurora-purple)] font-medium">See the truth behind every result.</span>
        </p>
      </div>

      {/* Aurora Search Box - The Central Hub */}
      <div className="mb-8">
        <AuroraSearchBox
          onSearch={handleSearch}
          isLoading={isSearching}
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* External Results Area - Only for Web and Community modes */}
      <AnimatePresence mode="wait">
        {/* HOME STATE - When no external search active */}
        {!showExternalResults && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Hot Debates */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Hot Debates Today</h3>
                <Badge className="text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">Join the conversation</Badge>
              </div>
              <DailyDebatesPanel userId={null} />
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Bot, label: "AI Detection", desc: "Spot AI content", color: "var(--color-aurora-blue)" },
                { icon: Scale, label: "Bias Analysis", desc: "Gender & political", color: "var(--color-aurora-purple)" },
                { icon: Shield, label: "Credibility", desc: "Source trust", color: "var(--color-aurora-mint)" },
                { icon: Heart, label: "Women First", desc: "Your perspective", color: "var(--color-aurora-pink)" },
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

        {/* WEB SEARCH RESULTS */}
        {activeMode === "web" && (
          <motion.div
            key="web"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Back Button */}
            <button onClick={handleReset} className="flex items-center gap-2 text-sm text-[var(--color-aurora-purple)] hover:underline">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
            </button>

            {/* AI Insight */}
            {(hasWebResults || isLoadingAI) && (
              <div className="bg-[var(--color-aurora-violet)] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Image src="/Au_Logo_1.png" alt="Aurora" width={28} height={28} className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--color-aurora-pink)]" />
                      <span className="text-xs font-semibold text-white/90">Aurora says...</span>
                    </div>
                    {isLoadingAI ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-white/20 rounded animate-pulse w-full" />
                        <div className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                      </div>
                    ) : (
                      <p className="text-sm text-white leading-relaxed">{aiInsight}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isSearching && !hasWebResults && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[var(--color-aurora-purple)]" />
                <p className="text-sm text-[var(--muted-foreground)]">Searching with bias detection...</p>
              </div>
            )}

            {/* Web Results */}
            {hasWebResults && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Web Results ({webResults.length})</span>
                  <Badge className="ml-auto text-[10px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0">
                    Brave Search
                  </Badge>
                </div>
                {webResults.map((result, i) => (
                  <SearchResultCard key={i} result={result} index={i} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!isSearching && !hasWebResults && query && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">No results found. Try a different search.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* COMMUNITY SEARCH RESULTS */}
        {activeMode === "community" && (
          <motion.div
            key="community"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Back Button */}
            <button onClick={handleReset} className="flex items-center gap-2 text-sm text-[var(--color-aurora-purple)] hover:underline">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
            </button>

            {/* Community Header */}
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              <span className="font-medium text-[var(--foreground)]">Aurora App Community</span>
              {hasCommunityResults && (
                <Badge className="text-[10px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0">
                  {communityResults?.total || 0} results
                </Badge>
              )}
            </div>

            {/* Loading State */}
            {debouncedQuery.length >= 2 && !communityResults && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[var(--color-aurora-purple)]" />
                <p className="text-sm text-[var(--muted-foreground)]">Searching community...</p>
              </div>
            )}

            {/* Community Results */}
            {hasCommunityResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {communityResults?.results.map((result, i) => (
                  <CommunityResultCard key={i} result={result as unknown as CommunityResult} index={i} />
                ))}
              </div>
            )}

            {/* No Results */}
            {communityResults && communityResults.results.length === 0 && debouncedQuery.length >= 2 && (
              <div className="text-center py-12">
                <Users className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">No community content found for &quot;{debouncedQuery}&quot;</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Try a different search</p>
              </div>
            )}

            {/* Show debates when no search */}
            {(!debouncedQuery || debouncedQuery.length < 2) && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                  <h3 className="font-semibold text-[var(--foreground)]">Hot Debates Today</h3>
                </div>
                <DailyDebatesPanel userId={null} />
              </div>
            )}

            {/* Join CTA */}
            {hasCommunityResults && (
              <Card className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-aurora-yellow)] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[var(--color-aurora-violet)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">Join Aurora App Community</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Get full access + earn credits</p>
                    </div>
                  </div>
                  <Link href="/api/auth/login">
                    <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px] px-6">
                      Join Free <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== COMMUNITY RESULT CARD ====================

function CommunityResultCard({ result, index }: { result: CommunityResult; index: number }) {
  const getIcon = () => {
    switch (result.type) {
      case "post": return MessageSquare;
      case "route": return MapPin;
      case "circle": return Users;
      case "opportunity": return Briefcase;
      case "resource": return Shield;
      default: return MessageSquare;
    }
  };

  const getColor = () => {
    switch (result.type) {
      case "post": return "var(--color-aurora-purple)";
      case "route": return "var(--color-aurora-mint)";
      case "circle": return "var(--color-aurora-pink)";
      case "opportunity": return "var(--color-aurora-blue)";
      case "resource": return "var(--color-aurora-yellow)";
      default: return "var(--color-aurora-purple)";
    }
  };

  const Icon = getIcon();
  const color = getColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-purple)]/40 hover:shadow-md transition-all cursor-pointer">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-[9px] capitalize" style={{ backgroundColor: `${color}20`, color, border: 'none' }}>
                {result.type}
              </Badge>
              {result.category && (
                <span className="text-[10px] text-[var(--muted-foreground)]">{result.category}</span>
              )}
            </div>
            <h4 className="font-medium text-sm text-[var(--foreground)] line-clamp-1">{result.previewTitle}</h4>
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-0.5">{result.previewSnippet}</p>
            {result.stats && (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--muted-foreground)]">
                <span className="capitalize">{result.stats.label}:</span>
                <span className="font-medium">{result.stats.value}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ==================== WEB SEARCH RESULT CARD ====================

function SearchResultCard({ result, index }: { result: WebSearchResult; index: number }) {
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
          </div>

          <a href={result.url} target="_blank" rel="noopener noreferrer" className="group block mb-1">
            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors line-clamp-2 text-base">
              {result.title}
            </h3>
          </a>
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3 leading-relaxed">{result.description}</p>

          <div className="p-3 rounded-xl bg-[var(--accent)]/50 border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
              <span className="text-xs font-semibold text-[var(--foreground)]">Aurora Metrics</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Trust" value={trustScore} max={100} color={trustScore >= 70 ? "var(--color-aurora-mint)" : trustScore >= 40 ? "var(--color-aurora-yellow)" : "var(--color-aurora-salmon)"} />
              <MetricCard label="Gender" value={genderIndicator.label} emoji={genderIndicator.emoji} color={genderIndicator.color} />
              <MetricCard label="AI" value={`${aiScore}%`} color={aiScore > 50 ? "var(--color-aurora-salmon)" : aiScore > 20 ? "var(--color-aurora-yellow)" : "var(--color-aurora-mint)"} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-aurora-purple)] hover:underline">
              Visit site <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[10px] text-[var(--muted-foreground)]">{politicalBias}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ==================== METRIC CARD ====================

function MetricCard({ label, value, max, emoji, color }: {
  label: string; value: string | number; max?: number; emoji?: string; color: string;
}) {
  const numValue = typeof value === "number" ? value : null;
  const percentage = numValue && max ? (numValue / max) * 100 : null;

  return (
    <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
      <div className="text-[10px] font-medium text-[var(--foreground)]/70 mb-0.5">{label}</div>
      <div className="flex items-center gap-1">
        {emoji && <span className="text-sm">{emoji}</span>}
        <span className="text-sm font-bold text-[var(--foreground)]">{value}{max ? <span className="text-[var(--muted-foreground)] font-normal text-xs">/{max}</span> : ""}</span>
      </div>
      {percentage !== null && (
        <div className="mt-1.5 h-1.5 bg-[var(--accent)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

// ==================== AURORA INSIGHT GENERATOR ====================

function generateAuroraInsight(query: string, webResults: WebSearchResult[]): string {
  const q = query.toLowerCase();
  const avgCredibility = webResults.reduce((sum, r) => {
    const score = typeof r.credibilityScore === 'number' ? r.credibilityScore : (r.credibilityScore?.score ?? 50);
    return sum + score;
  }, 0) / webResults.length;

  const womenFocusedCount = webResults.filter(r => r.isWomenFocused).length;
  const hasHighAI = webResults.some(r => (r.aiContentDetection?.percentage ?? 0) > 50);
  const domains = [...new Set(webResults.map(r => r.domain))];

  const isSpanish = /[áéíóúñ¿¡]/.test(query) ||
    /\b(estoy|tengo|quiero|como|para|que|por|con|una|los|las)\b/i.test(query);

  const mentalHealthKeywords = ["depressed", "depression", "sad", "anxiety", "lonely", "hopeless", "deprimida", "triste", "ansiedad"];
  const isMentalHealthQuery = mentalHealthKeywords.some(kw => q.includes(kw));

  if (isMentalHealthQuery) {
    return isSpanish
      ? `💜 Gracias por compartir cómo te sientes. No estás sola. He encontrado ${webResults.length} recursos, pero lo más importante: si estás pasando por un momento difícil, considera hablar con alguien de confianza.`
      : `💜 Thank you for sharing how you're feeling. You're not alone. I found ${webResults.length} resources, but most importantly: if you're going through a difficult time, please consider reaching out to someone you trust.`;
  }

  const greetings = isSpanish ? ["¡Hola! 👋", "Veamos...", "¡Listo!"] : ["Hey! 👋", "Let's see...", "Got it!"];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  if (hasHighAI) {
    return isSpanish
      ? `${greeting} Aviso: algunos resultados parecen generados por IA. No es malo, ¡pero vale la pena saberlo!`
      : `${greeting} Heads up: some results look AI-generated. Not necessarily bad, but worth knowing!`;
  }

  if (avgCredibility < 40) {
    return isSpanish
      ? `${greeting} Estas fuentes son un poco dudosas. Te recomiendo investigar más.`
      : `${greeting} These sources are a bit sketchy. I'd dig deeper before taking anything as fact.`;
  }

  if (womenFocusedCount > 0) {
    return isSpanish
      ? `${greeting} ¡Encontré ${womenFocusedCount} recursos enfocados en mujeres de ${domains.length} fuentes!`
      : `${greeting} Found ${womenFocusedCount} women-focused resources from ${domains.length} sources!`;
  }

  return isSpanish
    ? `${greeting} Encontré ${webResults.length} resultados. Pregúntate: ¿quién se beneficia de que yo crea esto? 💪`
    : `${greeting} Found ${webResults.length} results. Ask yourself: who benefits from me believing this? Critical thinking is your superpower. 💪`;
}

export default LandingSearch;
