"use client";

/**
 * Daily Debates Panel - 6 debates per day
 * 
 * Features:
 * - 6 categorized debates (Safety, Career, Health, Rights, Tech, World)
 * - Anonymous participation with pseudonym + country flag
 * - Real-time vote distribution
 * - Threaded comments
 * - Credits for logged-in users
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, ThumbsUp, ThumbsDown, Minus, ExternalLink,
  Shield, Briefcase, Heart, Scale, Cpu, Globe, ChevronDown,
  ChevronUp, Send, Sparkles, Crown, Gavel, ChevronLeft, ChevronRight, Users
} from "lucide-react";
import { getGeolocation } from "@/lib/geolocation";
import { generateAnonymousSessionHash } from "@/lib/anonymous-session";
import type { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/lib/locale-context";

// Category icons and colors - supports all 6 languages
const CATEGORY_CONFIG = {
  safety: { icon: Shield, color: "var(--color-aurora-mint)", label: { en: "Safety", es: "Seguridad", fr: "Sécurité", pt: "Segurança", de: "Sicherheit", ar: "الأمان" } },
  career: { icon: Briefcase, color: "var(--color-aurora-blue)", label: { en: "Career", es: "Carrera", fr: "Carrière", pt: "Carreira", de: "Karriere", ar: "المهنة" } },
  health: { icon: Heart, color: "var(--color-aurora-pink)", label: { en: "Health", es: "Salud", fr: "Santé", pt: "Saúde", de: "Gesundheit", ar: "الصحة" } },
  rights: { icon: Scale, color: "var(--color-aurora-purple)", label: { en: "Rights", es: "Derechos", fr: "Droits", pt: "Direitos", de: "Rechte", ar: "الحقوق" } },
  tech: { icon: Cpu, color: "var(--color-aurora-yellow)", label: { en: "Tech", es: "Tech", fr: "Tech", pt: "Tech", de: "Tech", ar: "التقنية" } },
  world: { icon: Globe, color: "var(--color-aurora-lavender)", label: { en: "World", es: "Mundo", fr: "Monde", pt: "Mundo", de: "Welt", ar: "العالم" } },
} as const;

// Emotional messages by locale - all 6 languages
const MESSAGES: Record<string, Record<string, string>> = {
  en: {
    title: "What Sisters Think",
    subtitle: "6 daily debates • Share your voice",
    agree: "Agree",
    disagree: "Disagree",
    neutral: "Neutral",
    comments: "comments",
    joinDebate: "Join the debate",
    enterPseudonym: "Enter your name to participate",
    pseudonymPlaceholder: "Your name or pseudonym",
    yourCountry: "Your country",
    startDebating: "Start Debating",
    writeComment: "Share your thoughts...",
    signupPrompt: "You've been active! Join Aurora App to save your history",
    signupCTA: "Create Free Account",
    creditsEarned: "credits earned",
  },
  es: {
    title: "Lo Que Piensan Las Hermanas",
    subtitle: "6 debates diarios • Comparte tu voz",
    agree: "De acuerdo",
    disagree: "En desacuerdo",
    neutral: "Neutral",
    comments: "comentarios",
    joinDebate: "Únete al debate",
    enterPseudonym: "Ingresa tu nombre para participar",
    pseudonymPlaceholder: "Tu nombre o seudónimo",
    yourCountry: "Tu país",
    startDebating: "Comenzar a Debatir",
    writeComment: "Comparte tus pensamientos...",
    signupPrompt: "¡Has estado activa! Únete a Aurora App para guardar tu historial",
    signupCTA: "Crear Cuenta Gratis",
    creditsEarned: "créditos ganados",
  },
  fr: {
    title: "Ce Que Pensent Les Sœurs",
    subtitle: "6 débats quotidiens • Partagez votre voix",
    agree: "D'accord",
    disagree: "Pas d'accord",
    neutral: "Neutre",
    comments: "commentaires",
    joinDebate: "Rejoindre le débat",
    enterPseudonym: "Entrez votre nom pour participer",
    pseudonymPlaceholder: "Votre nom ou pseudonyme",
    yourCountry: "Votre pays",
    startDebating: "Commencer à Débattre",
    writeComment: "Partagez vos pensées...",
    signupPrompt: "Vous avez été active! Rejoignez Aurora App pour sauvegarder votre historique",
    signupCTA: "Créer un Compte Gratuit",
    creditsEarned: "crédits gagnés",
  },
  pt: {
    title: "O Que As Irmãs Pensam",
    subtitle: "6 debates diários • Compartilhe sua voz",
    agree: "Concordo",
    disagree: "Discordo",
    neutral: "Neutro",
    comments: "comentários",
    joinDebate: "Participe do debate",
    enterPseudonym: "Digite seu nome para participar",
    pseudonymPlaceholder: "Seu nome ou pseudônimo",
    yourCountry: "Seu país",
    startDebating: "Começar a Debater",
    writeComment: "Compartilhe seus pensamentos...",
    signupPrompt: "Você tem sido ativa! Junte-se ao Aurora App para salvar seu histórico",
    signupCTA: "Criar Conta Grátis",
    creditsEarned: "créditos ganhos",
  },
  de: {
    title: "Was Schwestern Denken",
    subtitle: "6 tägliche Debatten • Teile deine Stimme",
    agree: "Zustimmen",
    disagree: "Ablehnen",
    neutral: "Neutral",
    comments: "Kommentare",
    joinDebate: "An der Debatte teilnehmen",
    enterPseudonym: "Gib deinen Namen ein, um teilzunehmen",
    pseudonymPlaceholder: "Dein Name oder Pseudonym",
    yourCountry: "Dein Land",
    startDebating: "Debattieren Starten",
    writeComment: "Teile deine Gedanken...",
    signupPrompt: "Du warst aktiv! Tritt Aurora App bei, um deinen Verlauf zu speichern",
    signupCTA: "Kostenloses Konto Erstellen",
    creditsEarned: "Credits verdient",
  },
  ar: {
    title: "ما تفكر به الأخوات",
    subtitle: "6 نقاشات يومية • شاركي صوتك",
    agree: "موافقة",
    disagree: "غير موافقة",
    neutral: "محايدة",
    comments: "تعليقات",
    joinDebate: "انضمي للنقاش",
    enterPseudonym: "أدخلي اسمك للمشاركة",
    pseudonymPlaceholder: "اسمك أو اسم مستعار",
    yourCountry: "بلدك",
    startDebating: "ابدئي النقاش",
    writeComment: "شاركي أفكارك...",
    signupPrompt: "كنتِ نشطة! انضمي إلى Aurora App لحفظ سجلك",
    signupCTA: "إنشاء حساب مجاني",
    creditsEarned: "رصيد مكتسب",
  },
};

interface DailyDebatesPanelProps {
  userId?: Id<"users"> | null;
  variant?: "full" | "compact" | "landing";
}

export function DailyDebatesPanel({ userId }: DailyDebatesPanelProps) {
  const { locale } = useLocale();
  const t = MESSAGES[locale as keyof typeof MESSAGES] || MESSAGES.en;

  const [selectedDebate, setSelectedDebate] = useState<string | null>(null);
  const [showPseudonymPrompt, setShowPseudonymPrompt] = useState(false);
  const [pseudonym, setPseudonym] = useState("");
  const [countryFlag, setCountryFlag] = useState("🌍");
  const [countryCode, setCountryCode] = useState("XX");
  const [anonymousId, setAnonymousId] = useState<Id<"anonymousDebaters"> | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"debates" | "cases">("debates");

  // Ref for horizontal scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch today's debates
  const debates = useQuery(api.dailyDebates.getTodayDebates);

  // Fetch community Judge cases
  const judgeCases = useQuery(api.communityJudgeCases.getTrendingCases, { limit: 8 });

  // Get anonymous debater info
  const getOrCreateDebater = useMutation(api.anonymousDebaters.getOrCreateDebater);
  const voteOnDebate = useMutation(api.dailyDebates.voteOnDebate);
  const autoGenerateDebates = useMutation(api.dailyDebates.autoGenerateDebates);
  const voteOnCase = useMutation(api.communityJudgeCases.voteOnCase);

  // Auto-generate debates if none exist for today
  useEffect(() => {
    if (debates !== undefined && debates.length === 0) {
      autoGenerateDebates({}).catch(console.error);
    }
  }, [debates, autoGenerateDebates]);

  // Initialize geolocation
  useEffect(() => {
    const initGeo = async () => {
      const geo = await getGeolocation();
      setCountryFlag(geo.flag);
      setCountryCode(geo.countryCode);
    };
    initGeo();

    // Load saved pseudonym
    const saved = localStorage.getItem("aurora-debate-pseudonym");
    if (saved) {
      setPseudonym(saved);
    }
  }, []);

  // Handle pseudonym submission
  const handlePseudonymSubmit = async () => {
    if (!pseudonym.trim()) return;

    localStorage.setItem("aurora-debate-pseudonym", pseudonym);

    const sessionHash = await generateAnonymousSessionHash();
    const debater = await getOrCreateDebater({
      sessionHash,
      pseudonym: pseudonym.trim(),
      countryCode,
      countryFlag,
    });

    if (debater) {
      setAnonymousId(debater._id as Id<"anonymousDebaters">);
    }
    setShowPseudonymPrompt(false);
  };

  // Gamified messages for anonymous users
  const [showGamifiedMessage, setShowGamifiedMessage] = useState<string | null>(null);

  const GAMIFIED_MESSAGES = {
    en: [
      "Your voice matters! 💜 Join Aurora App to earn credits",
      "Great insight! Sign up to save your debate history",
      "You're on fire! 🔥 Create an account to unlock rewards",
      "Sisters are listening! Join to connect with them",
      "Your opinion counts! Sign up to earn 2 credits per vote",
    ],
    es: [
      "¡Tu voz importa! 💜 Únete a Aurora App para ganar créditos",
      "¡Gran perspectiva! Regístrate para guardar tu historial",
      "¡Estás en racha! 🔥 Crea una cuenta para desbloquear recompensas",
    ],
  };

  // Handle vote
  const handleVote = async (debateId: Id<"dailyDebates">, vote: "agree" | "disagree" | "neutral") => {
    if (!userId && !anonymousId) {
      setShowPseudonymPrompt(true);
      return;
    }

    const result = await voteOnDebate({
      debateId,
      vote,
      anonymousId: anonymousId || undefined,
      memberId: userId || undefined,
    });

    setInteractionCount((c) => c + 1);

    // Show gamified message for anonymous users (no real credits stored)
    if (!userId && result && !result.isRegistered) {
      const messages = GAMIFIED_MESSAGES[locale as keyof typeof GAMIFIED_MESSAGES] || GAMIFIED_MESSAGES.en;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setShowGamifiedMessage(randomMessage);
      setTimeout(() => setShowGamifiedMessage(null), 4000);
    }
  };

  if (!debates || debates.length === 0) {
    return (
      <Card className="bg-[var(--card)] border-[var(--border)] p-6">
        <div className="text-center text-[var(--muted-foreground)]">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Loading today's debates...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              {t.title}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
          </div>
          {interactionCount >= 10 && !userId && (
            <Badge className="bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)] animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              {interactionCount} interactions
            </Badge>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--accent)] border border-[var(--border)] w-fit">
          <button
            onClick={() => setActiveTab("debates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "debates"
              ? "bg-[var(--color-aurora-purple)] text-white shadow-md"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            <MessageSquare className="w-4 h-4" />
            Hot Debates
            {debates && <Badge className="ml-1 bg-white/20 text-current border-0 text-[10px]">{debates.length}</Badge>}
          </button>
          <button
            onClick={() => setActiveTab("cases")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "cases"
              ? "bg-[var(--color-aurora-purple)] text-white shadow-md"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            <Gavel className="w-4 h-4" />
            Who's Right?
            {judgeCases && judgeCases.length > 0 && (
              <Badge className="ml-1 bg-white/20 text-current border-0 text-[10px]">{judgeCases.length}</Badge>
            )}
          </button>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            className="p-2 rounded-full bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)] transition-colors border border-[var(--border)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">Scroll to see more →</span>
          <button
            onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            className="p-2 rounded-full bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)] transition-colors border border-[var(--border)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pseudonym prompt removed - now handled inline in each DebateCard */}

      {/* Gamified Message Toast for Anonymous Users */}
      <AnimatePresence>
        {showGamifiedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white shadow-xl"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <p className="font-medium text-sm">{showGamifiedMessage}</p>
              <a
                href="/api/auth/login"
                className="ml-2 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-medium transition-colors"
              >
                Join Free →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signup Prompt after 10+ interactions */}
      {interactionCount >= 10 && !userId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-mint)]/20 border border-[var(--color-aurora-yellow)]"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
              <div>
                <p className="font-medium text-[var(--foreground)]">{t.signupPrompt}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  You could have earned {interactionCount * 2} credits! Join to start earning.
                </p>
              </div>
            </div>
            <a href="/api/auth/login">
              <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
                {t.signupCTA}
              </Button>
            </a>
          </div>
        </motion.div>
      )}

      {/* Content Based on Active Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "debates" ? (
          <motion.div
            key="debates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Horizontal Scrolling Debates */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[var(--color-aurora-purple)]/20 scrollbar-track-transparent"
              style={{ scrollbarWidth: "thin" }}
            >
              {debates.map((debate) => (
                <div key={debate._id} className="flex-shrink-0 w-[320px] md:w-[360px] snap-start">
                  <DebateCard
                    debate={debate}
                    isExpanded={selectedDebate === debate._id}
                    onToggle={() => setSelectedDebate(selectedDebate === debate._id ? null : debate._id)}
                    onVote={(vote: "agree" | "disagree" | "neutral") => handleVote(debate._id as Id<"dailyDebates">, vote)}
                    userId={userId}
                    anonymousId={anonymousId}
                    locale={locale}
                    t={t}
                    countryFlag={countryFlag}
                    onCreateAnonymous={async (name: string) => {
                      const sessionHash = await generateAnonymousSessionHash();
                      const debater = await getOrCreateDebater({
                        sessionHash,
                        pseudonym: name.trim(),
                        countryCode,
                        countryFlag,
                      });
                      if (debater) {
                        setAnonymousId(debater._id as Id<"anonymousDebaters">);
                        localStorage.setItem("aurora-debate-pseudonym", name);
                        return debater._id as Id<"anonymousDebaters">;
                      }
                      return null;
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cases"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Horizontal Scrolling Judge Cases */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[var(--color-aurora-purple)]/20 scrollbar-track-transparent"
              style={{ scrollbarWidth: "thin" }}
            >
              {judgeCases && judgeCases.length > 0 ? (
                judgeCases.map((judgeCase) => (
                  <div key={judgeCase._id} className="flex-shrink-0 w-[320px] md:w-[360px] snap-start">
                    <JudgeCaseCard
                      judgeCase={judgeCase}
                      onVote={async (vote: "person1" | "person2" | "tie") => {
                        if (!userId && !anonymousId) {
                          // Show pseudonym prompt would go here
                          return;
                        }
                        await voteOnCase({
                          caseId: judgeCase._id,
                          vote,
                          anonymousId: anonymousId || undefined,
                          memberId: userId || undefined,
                        });
                      }}
                      userId={userId}
                      anonymousId={anonymousId}
                    />
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <Gavel className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)]/40" />
                  <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No Cases Yet</h3>
                  <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto">
                    Be the first to share your Aurora Judge case for the community to vote on!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// Individual Debate Card with inline pseudonym prompt
function DebateCard({
  debate,
  isExpanded,
  onToggle,
  onVote,
  userId,
  anonymousId,
  locale,
  t,
  countryFlag,
  onCreateAnonymous,
}: {
  debate: any;
  isExpanded: boolean;
  onToggle: () => void;
  onVote: (vote: "agree" | "disagree" | "neutral") => void;
  userId?: Id<"users"> | null;
  anonymousId: Id<"anonymousDebaters"> | null;
  locale: string;
  t: any;
  countryFlag?: string;
  onCreateAnonymous?: (name: string) => Promise<Id<"anonymousDebaters"> | null>;
}) {
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);
  const [pendingVote, setPendingVote] = useState<"agree" | "disagree" | "neutral" | null>(null);
  const [inlinePseudonym, setInlinePseudonym] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = CATEGORY_CONFIG[debate.category as keyof typeof CATEGORY_CONFIG];
  const Icon = config?.icon || Globe;
  const categoryLabel = config?.label[locale as keyof typeof config.label] || config?.label.en || debate.category;

  const total = debate.agreeCount + debate.disagreeCount + debate.neutralCount;
  const agreePercent = total > 0 ? Math.round((debate.agreeCount / total) * 100) : 0;
  const disagreePercent = total > 0 ? Math.round((debate.disagreeCount / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((debate.neutralCount / total) * 100) : 0;

  const handleVoteClick = (vote: "agree" | "disagree" | "neutral") => {
    if (!userId && !anonymousId) {
      setPendingVote(vote);
      setShowInlinePrompt(true);
    } else {
      onVote(vote);
    }
  };

  const handleInlineSubmit = async () => {
    if (!inlinePseudonym.trim() || !pendingVote || !onCreateAnonymous) return;

    setIsSubmitting(true);
    try {
      const newAnonymousId = await onCreateAnonymous(inlinePseudonym);
      if (newAnonymousId) {
        // Small delay to let state update
        setTimeout(() => {
          onVote(pendingVote);
          setShowInlinePrompt(false);
          setPendingVote(null);
          setInlinePseudonym("");
        }, 100);
      }
    } catch (err) {
      console.error("Failed to create anonymous debater:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Category Header */}
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: `${config?.color}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: config?.color }} />
          <span className="text-sm font-medium" style={{ color: config?.color }}>
            {categoryLabel}
          </span>
          {debate.isAutoGenerated && (
            <Badge variant="outline" className="ml-auto text-xs">Auto</Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-[var(--foreground)] line-clamp-2">
            {debate.title}
          </h3>

          {/* Source */}
          <a
            href={debate.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)] flex items-center gap-1"
          >
            {debate.sourceName}
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Vote Distribution Bar */}
          <div className="space-y-1">
            <div className="h-2 rounded-full overflow-hidden flex bg-[var(--accent)]">
              <div
                className="bg-[var(--color-aurora-mint)] transition-all"
                style={{ width: `${agreePercent}%` }}
              />
              <div
                className="bg-[var(--color-aurora-salmon)] transition-all"
                style={{ width: `${disagreePercent}%` }}
              />
              <div
                className="bg-[var(--color-aurora-lavender)] transition-all"
                style={{ width: `${neutralPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span className="text-[var(--color-aurora-mint)]">{agreePercent}% {t.agree}</span>
              <span className="text-[var(--color-aurora-salmon)]">{disagreePercent}% {t.disagree}</span>
              <span>{neutralPercent}% {t.neutral}</span>
            </div>
          </div>

          {/* Vote Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVoteClick("agree")}
              className="flex-1 border-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/20"
            >
              <ThumbsUp className="w-4 h-4 mr-1 text-[var(--color-aurora-mint)]" />
              {debate.agreeCount}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVoteClick("disagree")}
              className="flex-1 border-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/20"
            >
              <ThumbsDown className="w-4 h-4 mr-1 text-[var(--color-aurora-salmon)]" />
              {debate.disagreeCount}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleVoteClick("neutral")}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-1" />
              {debate.neutralCount}
            </Button>
          </div>

          {/* Inline Pseudonym Prompt - appears right after voting attempt */}
          <AnimatePresence>
            {showInlinePrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-purple)]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base flex-shrink-0">{countryFlag}</span>
                    <p className="text-xs font-medium text-[var(--foreground)]">
                      Quick! Enter a name to vote:
                    </p>
                  </div>
                  {/* Stack vertically on mobile for better fit */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={inlinePseudonym}
                      onChange={(e) => setInlinePseudonym(e.target.value)}
                      placeholder="Your name..."
                      className="flex-1 h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm min-w-0"
                      maxLength={20}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleInlineSubmit()}
                    />
                    <Button
                      size="sm"
                      onClick={handleInlineSubmit}
                      disabled={!inlinePseudonym.trim() || isSubmitting}
                      className="bg-[var(--color-aurora-purple)] h-10 px-4 w-full sm:w-auto min-h-[44px]"
                    >
                      {isSubmitting ? "..." : "Vote!"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand/Collapse Comments */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {debate.commentCount} {t.comments}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Comments Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--border)] overflow-hidden"
            >
              <DebateComments
                debateId={debate._id}
                userId={userId}
                anonymousId={anonymousId}
                t={t}
                countryFlag={countryFlag}
                onCreateAnonymous={onCreateAnonymous}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Comments Section - Unified UX for anonymous users
function DebateComments({
  debateId,
  userId,
  anonymousId,
  t,
  countryFlag,
  onCreateAnonymous,
}: {
  debateId: Id<"dailyDebates">;
  userId?: Id<"users"> | null;
  anonymousId: Id<"anonymousDebaters"> | null;
  t: any;
  countryFlag?: string;
  onCreateAnonymous?: (name: string) => Promise<Id<"anonymousDebaters"> | null>;
}) {
  const [newComment, setNewComment] = useState("");
  const [inlineName, setInlineName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = useQuery(api.dailyDebates.getDebateComments, { debateId });
  const addComment = useMutation(api.dailyDebates.addComment);

  // Check if user can comment directly (logged in or already has anonymous ID)
  const canCommentDirectly = userId || anonymousId;
  const needsName = !canCommentDirectly;

  // Handle submit for logged-in users or users with anonymous ID
  const handleDirectSubmit = async () => {
    if (!newComment.trim()) return;
    if (!userId && !anonymousId) return;

    await addComment({
      debateId,
      content: newComment.trim(),
      anonymousId: anonymousId || undefined,
      memberId: userId || undefined,
    });

    setNewComment("");
  };

  // Handle submit for anonymous users (creates identity + posts comment)
  const handleAnonymousSubmit = async () => {
    if (!inlineName.trim() || !newComment.trim() || !onCreateAnonymous) return;

    setIsSubmitting(true);
    try {
      const newAnonymousId = await onCreateAnonymous(inlineName);
      if (newAnonymousId) {
        await addComment({
          debateId,
          content: newComment.trim(),
          anonymousId: newAnonymousId,
          memberId: undefined,
        });
        setNewComment("");
        setInlineName("");
      }
    } catch (err) {
      console.error("Failed to create anonymous debater:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter top-level comments
  const topLevelComments = comments?.filter((c) => !c.parentId) || [];

  return (
    <div className="p-4 space-y-3 bg-[var(--accent)]/30">
      {/* Comment Form - Different layouts for anonymous vs logged-in */}
      {needsName ? (
        // Anonymous user: Show unified name + comment form
        <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-purple)]/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base flex-shrink-0">{countryFlag || "🌍"}</span>
            <p className="text-xs font-medium text-[var(--foreground)]">
              Share your thoughts:
            </p>
          </div>

          {/* Name input */}
          <input
            type="text"
            value={inlineName}
            onChange={(e) => setInlineName(e.target.value)}
            placeholder="Your name..."
            className="w-full h-10 px-3 mb-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm"
            maxLength={20}
          />

          {/* Comment input */}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.writeComment}
            className="w-full p-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm resize-none h-16 mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && inlineName.trim() && newComment.trim()) {
                e.preventDefault();
                handleAnonymousSubmit();
              }
            }}
          />

          {/* Submit button */}
          <Button
            onClick={handleAnonymousSubmit}
            disabled={!inlineName.trim() || !newComment.trim() || isSubmitting}
            className="w-full bg-[var(--color-aurora-purple)] min-h-[44px]"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      ) : (
        // Logged-in or has anonymous ID: Simple comment input
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.writeComment}
            className="flex-1 h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm min-w-0"
            onKeyDown={(e) => e.key === "Enter" && handleDirectSubmit()}
          />
          <Button
            size="sm"
            onClick={handleDirectSubmit}
            disabled={!newComment.trim()}
            className="bg-[var(--color-aurora-purple)] min-h-[44px] min-w-[44px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {topLevelComments.map((comment) => (
          <div
            key={comment._id}
            className={`p-3 rounded-lg border ${comment.authorType === "member"
              ? "bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 border-[var(--color-aurora-purple)]/20"
              : "bg-[var(--card)] border-[var(--border)]"
              }`}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {comment.authorFlag && (
                <span className="text-base flex-shrink-0">{comment.authorFlag}</span>
              )}
              <span className="font-medium text-sm text-[var(--foreground)]">
                {comment.authorName}
              </span>
              {/* Member badges visible to anonymous users */}
              {comment.authorType === "member" && (
                <Badge className="text-[9px] bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0 h-4">
                  Member
                </Badge>
              )}
              {comment.authorBadge === "premium" && (
                <Badge className="text-[9px] bg-[var(--color-aurora-yellow)]/30 text-[var(--color-aurora-violet)] border-0 h-4 flex items-center gap-0.5">
                  <Crown className="w-2.5 h-2.5" />
                  Premium
                </Badge>
              )}
              {comment.authorBadge === "verified" && (
                <Badge className="text-[9px] bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 h-4">
                  ✓ Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {comment.content}
            </p>
          </div>
        ))}

        {topLevelComments.length === 0 && (
          <p className="text-center text-sm text-[var(--muted-foreground)] py-4">
            Be the first to share your thoughts! 💜
          </p>
        )}
      </div>
    </div>
  );
}

// Judge Case Card - Display community-shared cases
function JudgeCaseCard({
  judgeCase,
  onVote,
  userId,
  anonymousId,
}: {
  judgeCase: any;
  onVote: (vote: "person1" | "person2" | "tie") => void;
  userId?: Id<"users"> | null;
  anonymousId: Id<"anonymousDebaters"> | null;
}) {
  const total = judgeCase.votePerson1 + judgeCase.votePerson2 + judgeCase.voteTie;
  const person1Percent = total > 0 ? Math.round((judgeCase.votePerson1 / total) * 100) : 33;
  const person2Percent = total > 0 ? Math.round((judgeCase.votePerson2 / total) * 100) : 33;
  const tiePercent = total > 0 ? Math.round((judgeCase.voteTie / total) * 100) : 34;

  const getWinnerColor = () => {
    switch (judgeCase.aiWinner) {
      case "person1": return "var(--color-aurora-mint)";
      case "person2": return "var(--color-aurora-pink)";
      case "tie": return "var(--color-aurora-yellow)";
      case "both_wrong": return "var(--color-aurora-salmon)";
      default: return "var(--color-aurora-purple)";
    }
  };

  const getWinnerLabel = () => {
    switch (judgeCase.aiWinner) {
      case "person1": return judgeCase.person1Label;
      case "person2": return judgeCase.person2Label;
      case "tie": return "It's a Tie";
      case "both_wrong": return "Both Wrong";
      default: return "Unknown";
    }
  };

  return (
    <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden hover:shadow-lg transition-shadow h-full">
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: `${getWinnerColor()}20` }}
        >
          <Gavel className="w-4 h-4" style={{ color: getWinnerColor() }} />
          <span className="text-sm font-medium" style={{ color: getWinnerColor() }}>
            Case #{judgeCase.caseNumber}
          </span>
          <Badge
            className="ml-auto text-[10px] border-0"
            style={{ backgroundColor: `${getWinnerColor()}30`, color: getWinnerColor() }}
          >
            {judgeCase.argumentType}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Situation */}
          <p className="text-sm text-[var(--foreground)] line-clamp-3">
            {judgeCase.situation}
          </p>

          {/* AI Verdict */}
          <div className="p-2 rounded-lg bg-[var(--accent)] border border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
              <span className="text-xs text-[var(--muted-foreground)]">Aurora says:</span>
              <span className="text-xs font-bold" style={{ color: getWinnerColor() }}>
                {getWinnerLabel()} won
              </span>
            </div>
          </div>

          {/* Vote Distribution */}
          {total > 0 && (
            <div className="space-y-1">
              <div className="h-2 rounded-full overflow-hidden flex bg-[var(--accent)]">
                <div
                  className="h-full bg-[var(--color-aurora-mint)] transition-all"
                  style={{ width: `${person1Percent}%` }}
                />
                <div
                  className="h-full bg-[var(--color-aurora-yellow)] transition-all"
                  style={{ width: `${tiePercent}%` }}
                />
                <div
                  className="h-full bg-[var(--color-aurora-pink)] transition-all"
                  style={{ width: `${person2Percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
                <span>{judgeCase.person1Label} {person1Percent}%</span>
                <span>Tie {tiePercent}%</span>
                <span>{judgeCase.person2Label} {person2Percent}%</span>
              </div>
            </div>
          )}

          {/* Vote Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onVote("person1")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--color-aurora-mint)]/30 bg-[var(--color-aurora-mint)]/10 hover:bg-[var(--color-aurora-mint)]/20 transition-colors"
            >
              <ThumbsUp className="w-4 h-4 text-[var(--color-aurora-mint)]" />
              <span className="text-[10px] font-medium text-[var(--foreground)] line-clamp-1">
                {judgeCase.person1Label}
              </span>
            </button>
            <button
              onClick={() => onVote("tie")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--color-aurora-yellow)]/30 bg-[var(--color-aurora-yellow)]/10 hover:bg-[var(--color-aurora-yellow)]/20 transition-colors"
            >
              <Minus className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
              <span className="text-[10px] font-medium text-[var(--foreground)]">Tie</span>
            </button>
            <button
              onClick={() => onVote("person2")}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--color-aurora-pink)]/30 bg-[var(--color-aurora-pink)]/10 hover:bg-[var(--color-aurora-pink)]/20 transition-colors"
            >
              <ThumbsUp className="w-4 h-4 text-[var(--color-aurora-pink)]" />
              <span className="text-[10px] font-medium text-[var(--foreground)] line-clamp-1">
                {judgeCase.person2Label}
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {judgeCase.voteCount} votes
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {judgeCase.commentCount} comments
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DailyDebatesPanel;

