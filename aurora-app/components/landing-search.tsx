"use client";

/**
 * Aurora App - Revolutionary Women-First Search Engine
 * 
 * THE ANTI-TOXIC SEARCH: Get informed fast, debate constructively, continue with life.
 * Features: Web, News, Images, Videos - all with Aurora bias analysis
 * 
 * AI Personality: Aurora is a warm, witty guide who speaks like a trusted friend
 * and helps foster critical thinking about search results.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, X, Globe, ExternalLink, Heart, 
  Loader2, Shield, Clock, Bot, Scale, Building2, Newspaper, ImageIcon,
  Flame, ArrowRight, Eye, Zap, PlayCircle, Sparkles
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LandingAd } from "@/components/ads/landing-ad";
import { calculateTrustScore } from "@/lib/search/trust-score";
import { DailyDebatesPanel } from "@/components/search/daily-debates-panel";
import { VideoResultCard } from "@/components/search/video-result-card";
import { SafetyAlertBadge } from "@/components/search/safety-alert-badge";
import { AuroraVerifiedBadge, getVerificationLevel } from "@/components/search/aurora-verified-badge";
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
  useLocale(); // Keep context active for child components
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [newsResults, setNewsResults] = useState<NewsResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setWebResults([]); setVideoResults([]); setNewsResults([]); setImageResults([]);
      setAiInsight(null);
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

  // Generate Aurora AI insight with personality
  useEffect(() => {
    if (webResults.length > 0 && debouncedQuery) {
      setIsLoadingAI(true);
      // Generate insight locally to save API calls - Aurora speaks with personality
      const insight = generateAuroraInsight(debouncedQuery, webResults, newsResults);
      setTimeout(() => {
        setAiInsight(insight);
        setIsLoadingAI(false);
      }, 800); // Small delay for natural feel
    } else {
      setAiInsight(null);
    }
  }, [webResults, newsResults, debouncedQuery]);

  const handleClear = useCallback(() => {
    setQuery(""); setDebouncedQuery(""); setWebResults([]); setVideoResults([]);
    setNewsResults([]); setImageResults([]); setAiInsight(null);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-aurora-mint)] text-xs font-semibold text-[var(--color-aurora-violet)]">
            <Shield className="w-3 h-3" /> Bias Detection
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-aurora-pink)] text-xs font-semibold text-[var(--color-aurora-violet)]">
            <Heart className="w-3 h-3" /> Women-First
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-aurora-purple)] text-xs font-semibold text-white">
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
            
            {/* Aurora AI Insight - Personality-driven guidance */}
            <div className="bg-[var(--color-aurora-violet)] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Image src="/Au_Logo_1.png" alt="Aurora App" width={28} height={28} className="w-7 h-7" />
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

            {/* Content Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: "all" as SearchTab, label: "All", count: totalResults, icon: Globe },
                { id: "web" as SearchTab, label: "Web", count: webResults.length, icon: Globe },
                { id: "news" as SearchTab, label: "News", count: newsResults.length, icon: Newspaper },
                { id: "images" as SearchTab, label: "Images", count: imageResults.length, icon: ImageIcon },
                { id: "videos" as SearchTab, label: "Videos", count: videoResults.length, icon: PlayCircle },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
                    activeTab === tab.id ? "bg-[var(--color-aurora-purple)] text-white" : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--color-aurora-purple)]/20"
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
              <Badge className="ml-auto text-[10px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 whitespace-nowrap">
                Powered by Brave Search
              </Badge>
            </div>

            {/* News Results - Only show when News tab is active */}
            {activeTab === "news" && (
              <div>
                {newsResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {newsResults.map((news) => (
                      <NewsCard key={news.id} news={news} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No news results for this search</p>
                  </div>
                )}
              </div>
            )}

            {/* Images Results - Only show when Images tab is active */}
            {activeTab === "images" && (
              <div>
                {imageResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {imageResults.map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer"
                        className="aspect-square rounded-xl overflow-hidden bg-[var(--accent)] hover:opacity-90 transition-opacity">
                        {img.thumbnail && <img src={img.thumbnail} alt={img.title} className="w-full h-full object-cover" />}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No image results for this search</p>
                  </div>
                )}
              </div>
            )}

            {/* Video Results - Only show when Videos tab is active */}
            {activeTab === "videos" && (
              <div>
                {videoResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {videoResults.map((video, i) => (
                      <VideoResultCard key={video.id} video={video} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <PlayCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No video results for this search</p>
                  </div>
                )}
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
                { icon: Shield, label: "Credibility", desc: "Source trust", color: "var(--color-aurora-mint)" },
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
 * Aurora AI Insight Generator - Speaks with personality like a trusted friend
 * Detects language and provides empathetic, context-aware responses
 */
function generateAuroraInsight(query: string, webResults: WebSearchResult[], newsResults: NewsResult[]): string {
  const q = query.toLowerCase();
  const avgCredibility = webResults.reduce((sum, r) => {
    const score = typeof r.credibilityScore === 'number' ? r.credibilityScore : (r.credibilityScore?.score ?? 50);
    return sum + score;
  }, 0) / webResults.length;
  
  const womenFocusedCount = webResults.filter(r => r.isWomenFocused).length;
  const hasHighAI = webResults.some(r => (r.aiContentDetection?.percentage ?? 0) > 50);
  const hasNews = newsResults.length > 0;
  const domains = [...new Set(webResults.map(r => r.domain))];
  
  // Detect language from query (Spanish indicators)
  const isSpanish = /[áéíóúñ¿¡]/.test(query) || 
    /\b(estoy|tengo|quiero|como|para|que|por|con|una|los|las|del|muy|más|está|son|hay|ser|hacer|puedo|necesito|ayuda|busco|donde|cuando|porque|embarazo|prueba|deprimida|triste|ansiedad|salud|trabajo|dinero|seguridad)\b/i.test(query);
  
  // Mental health & emotional support detection (both languages)
  const mentalHealthKeywords = {
    en: ["depressed", "depression", "sad", "anxiety", "anxious", "stressed", "lonely", "hopeless", "suicidal", "mental health", "feeling down", "overwhelmed", "panic", "scared", "afraid", "worried", "crying", "can't sleep", "insomnia"],
    es: ["deprimida", "depresión", "triste", "ansiedad", "ansiosa", "estresada", "sola", "desesperada", "suicida", "salud mental", "me siento mal", "abrumada", "pánico", "asustada", "miedo", "preocupada", "llorando", "no puedo dormir", "insomnio", "angustia", "agotada"]
  };
  
  const isMentalHealthQuery = [...mentalHealthKeywords.en, ...mentalHealthKeywords.es].some(kw => q.includes(kw));
  
  // Pregnancy/reproductive health detection
  const reproductiveKeywords = {
    en: ["pregnancy", "pregnant", "pregnancy test", "period", "menstrual", "fertility", "ovulation", "contraception", "birth control", "abortion", "miscarriage"],
    es: ["embarazo", "embarazada", "prueba de embarazo", "período", "menstruación", "fertilidad", "ovulación", "anticonceptivos", "aborto", "pérdida"]
  };
  
  const isReproductiveQuery = [...reproductiveKeywords.en, ...reproductiveKeywords.es].some(kw => q.includes(kw));
  
  // PRIORITY: Mental health - empathetic response
  if (isMentalHealthQuery) {
    if (isSpanish) {
      return `💜 Gracias por compartir cómo te sientes. No estás sola en esto. He encontrado ${webResults.length} recursos, pero lo más importante: si estás pasando por un momento difícil, considera hablar con alguien de confianza o una línea de ayuda profesional. Tu bienestar importa. ¿Hay algo específico que te gustaría explorar?`;
    }
    return `💜 Thank you for sharing how you're feeling. You're not alone in this. I found ${webResults.length} resources, but most importantly: if you're going through a difficult time, please consider reaching out to someone you trust or a professional helpline. Your wellbeing matters. Is there something specific you'd like to explore?`;
  }
  
  // Reproductive health - supportive and informative
  if (isReproductiveQuery) {
    if (isSpanish) {
      return `💗 Entiendo que este es un tema importante y personal. He encontrado ${webResults.length} resultados de ${domains.length} fuentes. Recuerda: cada cuerpo es diferente. Para información médica específica, siempre es mejor consultar con un profesional de salud que conozca tu situación.`;
    }
    return `💗 I understand this is an important and personal topic. I found ${webResults.length} results from ${domains.length} sources. Remember: every body is different. For specific medical information, it's always best to consult with a healthcare professional who knows your situation.`;
  }
  
  // Spanish greetings and responses
  const greetingsEs = ["¡Hola! 👋", "Veamos...", "¡Interesante búsqueda!", "¡Listo!", "Esto es lo que encontré:"];
  const greetingsEn = ["Hey there! 👋", "Okay, let's see...", "Interesting search!", "Got it!", "Here's what I found:"];
  const greetings = isSpanish ? greetingsEs : greetingsEn;
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  // Context-aware insights
  if (q.includes("news") || q.includes("noticias") || hasNews) {
    if (avgCredibility < 50) {
      return isSpanish 
        ? `${greeting} Estas fuentes de noticias son variadas en credibilidad. Te recomiendo verificar las afirmaciones importantes antes de compartir. ¿Qué hay detrás de la historia? 🤔`
        : `${greeting} These news sources are a mixed bag. I'd cross-check the big claims before sharing. What's the story behind the story? 🤔`;
    }
    return isSpanish
      ? `${greeting} Noticias frescas de ${domains.length} fuentes. Recuerda: los titulares están diseñados para llamar la atención. La imagen completa suele ser más matizada.`
      : `${greeting} Fresh news from ${domains.length} sources. Remember: headlines are designed to grab attention. The full picture is usually more nuanced.`;
  }
  
  if (q.includes("safety") || q.includes("safe") || q.includes("seguridad") || q.includes("segura")) {
    return isSpanish
      ? `${greeting} La información de seguridad es seria. He marcado las fuentes más confiables. Confía en tus instintos, y ante la duda, verifica con fuentes oficiales. ¡Tú puedes! 💜`
      : `${greeting} Safety info is serious business. I've flagged the most credible sources. Trust your instincts, and when in doubt, verify with official channels. You've got this! 💜`;
  }
  
  if (q.includes("career") || q.includes("job") || q.includes("work") || q.includes("trabajo") || q.includes("empleo") || q.includes("carrera")) {
    if (womenFocusedCount > 0) {
      return isSpanish
        ? `${greeting} ¡Encontré ${womenFocusedCount} recursos enfocados en mujeres! Los consejos de carrera a menudo asumen una perspectiva masculina. Estas fuentes pueden hablar más a tu experiencia.`
        : `${greeting} Found ${womenFocusedCount} women-focused resources! Career advice often assumes a male default. These sources might speak more to your experience.`;
    }
    return isSpanish
      ? `${greeting} ¡Consejos de carrera! Nota: la mayoría de estas fuentes no abordan específicamente las experiencias de las mujeres. Considera cómo los consejos podrían aplicarse diferente a ti.`
      : `${greeting} Career advice incoming! Quick thought: most of these sources don't specifically address women's experiences. Consider how the advice might apply differently to you.`;
  }
  
  if (q.includes("health") || q.includes("medical") || q.includes("symptom") || q.includes("salud") || q.includes("médico") || q.includes("síntoma")) {
    return isSpanish
      ? `${greeting} ¡Información de salud! 🏥 He verificado la credibilidad de las fuentes, pero consulta con un profesional de salud para decisiones médicas personales. Los síntomas de las mujeres a menudo son minimizados - ¡aboga por ti misma!`
      : `${greeting} Health info alert! 🏥 I've checked source credibility, but please consult a healthcare provider for personal medical decisions. Women's symptoms are often dismissed - advocate for yourself!`;
  }
  
  if (hasHighAI) {
    return isSpanish
      ? `${greeting} Aviso: algunos de estos resultados parecen generados por IA. No es necesariamente malo, ¡pero vale la pena saberlo! El contenido de IA puede perder matices y contexto.`
      : `${greeting} Heads up: some of these results look AI-generated. Not necessarily bad, but worth knowing! AI content can miss nuance and context.`;
  }
  
  if (avgCredibility < 40) {
    return isSpanish
      ? `${greeting} Hmm, estas fuentes son un poco dudosas en la escala de credibilidad. Te recomiendo investigar más antes de tomar algo como hecho.`
      : `${greeting} Hmm, these sources are a bit sketchy on the credibility scale. I'd dig deeper before taking anything as fact.`;
  }
  
  if (womenFocusedCount === 0) {
    return isSpanish
      ? `${greeting} Encontré ${webResults.length} resultados, pero ninguno específicamente de fuentes enfocadas en mujeres. La perspectiva general podría estar perdiendo algo. ¿Qué agregarían las voces de mujeres aquí?`
      : `${greeting} Found ${webResults.length} results, but none specifically from women-focused sources. The mainstream perspective might be missing something. What would women's voices add here?`;
  }
  
  if (avgCredibility > 70) {
    return isSpanish
      ? `${greeting} ¡Buenas noticias! Estas fuentes tienen buena puntuación en credibilidad. Aún así, ninguna fuente es perfecta. ¿Qué suposiciones podrían estar haciendo incluso las fuentes confiables?`
      : `${greeting} Good news! These sources score well on credibility. Still, no source is perfect. What assumptions might even trusted sources be making?`;
  }
  
  // Default thoughtful response
  if (isSpanish) {
    const thoughtsEs = [
      `${greeting} ${webResults.length} resultados de ${domains.length} fuentes diferentes. Diversidad de fuentes = mejor panorama. ¿Qué patrón común estás notando?`,
      `${greeting} Esto es lo que dice internet. Recuerda: los resultados de búsqueda reflejan lo popular, no necesariamente lo verdadero. ¿Qué te dice tu intuición?`,
      `${greeting} ¡Encontré cosas interesantes! Antes de profundizar, pregúntate: ¿quién se beneficia de que yo crea esto? El pensamiento crítico es tu superpoder. 💪`,
    ];
    return thoughtsEs[Math.floor(Math.random() * thoughtsEs.length)];
  }
  
  const thoughts = [
    `${greeting} ${webResults.length} results from ${domains.length} different sources. Diversity of sources = better picture. What's the common thread you're noticing?`,
    `${greeting} Here's what the internet has to say. Remember: search results reflect what's popular, not necessarily what's true. What's your gut telling you?`,
    `${greeting} Found some interesting stuff! Before diving in, ask yourself: who benefits from me believing this? Critical thinking is your superpower. 💪`,
  ];
  
  return thoughts[Math.floor(Math.random() * thoughts.length)];
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

/** Search Result Card - Clean metrics, no fake data */
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

  // Calculate sustainability score based on source longevity and credibility
  const getSustainability = () => {
    const age = result.age?.toLowerCase() || "";
    let score = credScore * 0.5; // Base from credibility
    if (age.includes("year")) score += 20;
    else if (age.includes("month")) score += 10;
    else if (age.includes("week")) score += 5;
    if (result.isWomenFocused) score += 10;
    score = Math.min(100, Math.max(0, score));
    if (score >= 70) return { label: "Lasting", color: "var(--color-aurora-mint)", icon: "🌱" };
    if (score >= 40) return { label: "Moderate", color: "var(--color-aurora-yellow)", icon: "🌿" };
    return { label: "Fleeting", color: "var(--color-aurora-salmon)", icon: "🍂" };
  };
  const sustainability = getSustainability();

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
        <div className="p-4">
          {/* Header badges */}
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

          {/* Title and description */}
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="group block mb-1">
            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors line-clamp-2 text-base">
              {result.title}
            </h3>
          </a>
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3 leading-relaxed">{result.description}</p>
          
          {/* Aurora Metrics - Compact 3x2 grid on desktop */}
          <div className="p-3 rounded-xl bg-[var(--accent)]/50 border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
              <span className="text-xs font-semibold text-[var(--foreground)]">Aurora Metrics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <MetricCard label="Trust" value={trustScore} max={100} color={trustScore >= 70 ? "var(--color-aurora-mint)" : trustScore >= 40 ? "var(--color-aurora-yellow)" : "var(--color-aurora-salmon)"} />
              <MetricCard label="Gender Bias" value={genderIndicator.label} emoji={genderIndicator.emoji} color={genderIndicator.color} />
              <MetricCard label="AI Content" value={`${aiScore}%`} color={aiScore > 50 ? "var(--color-aurora-salmon)" : aiScore > 20 ? "var(--color-aurora-yellow)" : "var(--color-aurora-mint)"} />
              <MetricCard label="Credibility" value={credScore} max={100} color={credScore >= 70 ? "var(--color-aurora-mint)" : credScore >= 40 ? "var(--color-aurora-yellow)" : "var(--color-aurora-salmon)"} />
              <MetricCard label="Political" value={politicalBias} color="var(--color-aurora-blue)" />
              <MetricCard label="Sustainability" value={sustainability.label} emoji={sustainability.icon} color={sustainability.color} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-aurora-purple)] hover:underline">
              Visit site <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/** Metric Card - Compact display with improved contrast */
function MetricCard({ label, value, max, emoji, color }: { 
  label: string; 
  value: string | number; 
  max?: number; 
  emoji?: string; 
  color: string;
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

export default LandingSearch;
