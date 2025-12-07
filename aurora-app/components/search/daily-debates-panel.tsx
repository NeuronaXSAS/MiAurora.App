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

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, ThumbsUp, ThumbsDown, Minus, ExternalLink,
  Shield, Briefcase, Heart, Scale, Cpu, Globe, ChevronDown,
  ChevronUp, Send, Sparkles, Crown
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

  // Fetch today's debates
  const debates = useQuery(api.dailyDebates.getTodayDebates);
  
  // Get anonymous debater info
  const getOrCreateDebater = useMutation(api.anonymousDebaters.getOrCreateDebater);
  const voteOnDebate = useMutation(api.dailyDebates.voteOnDebate);
  const autoGenerateDebates = useMutation(api.dailyDebates.autoGenerateDebates);
  
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
      {/* Header */}
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

      {/* Debates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debates.map((debate) => (
          <DebateCard
            key={debate._id}
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
        ))}
      </div>
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
                  <p className="text-xs font-medium text-[var(--foreground)] mb-2">
                    {countryFlag} Quick! Enter a name to vote:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inlinePseudonym}
                      onChange={(e) => setInlinePseudonym(e.target.value)}
                      placeholder="Your name..."
                      className="flex-1 h-9 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm"
                      maxLength={20}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleInlineSubmit()}
                    />
                    <Button
                      size="sm"
                      onClick={handleInlineSubmit}
                      disabled={!inlinePseudonym.trim() || isSubmitting}
                      className="bg-[var(--color-aurora-purple)] h-9 px-3"
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Comments Section
function DebateComments({
  debateId,
  userId,
  anonymousId,
  t,
}: {
  debateId: Id<"dailyDebates">;
  userId?: Id<"users"> | null;
  anonymousId: Id<"anonymousDebaters"> | null;
  t: any;
}) {
  const [newComment, setNewComment] = useState("");
  const comments = useQuery(api.dailyDebates.getDebateComments, { debateId });
  const addComment = useMutation(api.dailyDebates.addComment);

  const handleSubmit = async () => {
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

  // Filter top-level comments
  const topLevelComments = comments?.filter((c) => !c.parentId) || [];

  return (
    <div className="p-4 space-y-3 bg-[var(--accent)]/30">
      {/* Comment Input */}
      {(userId || anonymousId) && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.writeComment}
            className="flex-1 h-10 px-3 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="bg-[var(--color-aurora-purple)]"
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
            className={`p-3 rounded-lg border ${
              comment.authorType === "member" 
                ? "bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5 border-[var(--color-aurora-purple)]/20" 
                : "bg-[var(--card)] border-[var(--border)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {comment.authorFlag && (
                <span className="text-sm">{comment.authorFlag}</span>
              )}
              <span className="font-medium text-sm text-[var(--foreground)]">
                {comment.authorName}
              </span>
              {/* Task 11.2: Member badges visible to anonymous users */}
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
            {t.joinDebate}
          </p>
        )}
      </div>
    </div>
  );
}

export default DailyDebatesPanel;
