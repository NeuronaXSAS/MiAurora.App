"use client";

/**
 * SignupPrompt Component - Aurora App Conversion System
 * 
 * Shows personalized signup prompt after 10+ anonymous interactions.
 * Displays earned credits preview and engagement history.
 * 
 * Task 10.2: Implement signup prompt after 10+ interactions
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Heart, Users, Shield, ArrowRight, Gift, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Interaction tracking keys
const STORAGE_KEY = 'aurora-anonymous-interactions';
const PROMPT_DISMISSED_KEY = 'aurora-signup-prompt-dismissed';
const INTERACTION_THRESHOLD = 10;

// Translated messages for 6 priority languages
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title: "You're Part of the Community! 💜",
    subtitle: "Join to unlock your full potential",
    interactions: "interactions",
    creditsEarned: "Credits you've earned",
    creditsWaiting: "waiting for you!",
    benefit1: "Keep your debate history & votes",
    benefit2: "Earn credits for every contribution",
    benefit3: "Access exclusive safety features",
    benefit4: "Connect with sisters worldwide",
    joinFree: "Join Aurora App Free",
    maybeLater: "Maybe Later",
    noPassword: "No password needed — just one click",
    privacy: "🔒 We never post without your permission",
  },
  es: {
    title: "¡Eres Parte de la Comunidad! 💜",
    subtitle: "Únete para desbloquear tu potencial",
    interactions: "interacciones",
    creditsEarned: "Créditos que has ganado",
    creditsWaiting: "¡esperándote!",
    benefit1: "Conserva tu historial de debates y votos",
    benefit2: "Gana créditos por cada contribución",
    benefit3: "Accede a funciones de seguridad exclusivas",
    benefit4: "Conecta con hermanas de todo el mundo",
    joinFree: "Únete a Aurora App Gratis",
    maybeLater: "Quizás Después",
    noPassword: "Sin contraseña — solo un clic",
    privacy: "🔒 Nunca publicamos sin tu permiso",
  },
  fr: {
    title: "Vous Faites Partie de la Communauté! 💜",
    subtitle: "Rejoignez pour débloquer votre potentiel",
    interactions: "interactions",
    creditsEarned: "Crédits que vous avez gagnés",
    creditsWaiting: "vous attendent!",
    benefit1: "Gardez votre historique de débats et votes",
    benefit2: "Gagnez des crédits pour chaque contribution",
    benefit3: "Accédez aux fonctions de sécurité exclusives",
    benefit4: "Connectez-vous avec des sœurs du monde entier",
    joinFree: "Rejoignez Aurora App Gratuitement",
    maybeLater: "Peut-être Plus Tard",
    noPassword: "Pas de mot de passe — un seul clic",
    privacy: "🔒 Nous ne publions jamais sans votre permission",
  },
  pt: {
    title: "Você Faz Parte da Comunidade! 💜",
    subtitle: "Entre para desbloquear seu potencial",
    interactions: "interações",
    creditsEarned: "Créditos que você ganhou",
    creditsWaiting: "esperando por você!",
    benefit1: "Mantenha seu histórico de debates e votos",
    benefit2: "Ganhe créditos por cada contribuição",
    benefit3: "Acesse recursos de segurança exclusivos",
    benefit4: "Conecte-se com irmãs do mundo todo",
    joinFree: "Entre no Aurora App Grátis",
    maybeLater: "Talvez Depois",
    noPassword: "Sem senha — apenas um clique",
    privacy: "🔒 Nunca postamos sem sua permissão",
  },
  de: {
    title: "Du Bist Teil der Gemeinschaft! 💜",
    subtitle: "Tritt bei, um dein Potenzial freizuschalten",
    interactions: "Interaktionen",
    creditsEarned: "Credits, die du verdient hast",
    creditsWaiting: "warten auf dich!",
    benefit1: "Behalte deine Debattenhistorie & Stimmen",
    benefit2: "Verdiene Credits für jeden Beitrag",
    benefit3: "Zugang zu exklusiven Sicherheitsfunktionen",
    benefit4: "Verbinde dich mit Schwestern weltweit",
    joinFree: "Aurora App Kostenlos Beitreten",
    maybeLater: "Vielleicht Später",
    noPassword: "Kein Passwort nötig — nur ein Klick",
    privacy: "🔒 Wir posten nie ohne deine Erlaubnis",
  },
  ar: {
    title: "أنت جزء من المجتمع! 💜",
    subtitle: "انضمي لفتح إمكاناتك الكاملة",
    interactions: "تفاعلات",
    creditsEarned: "الرصيد الذي كسبته",
    creditsWaiting: "في انتظارك!",
    benefit1: "احتفظي بسجل نقاشاتك وأصواتك",
    benefit2: "اكسبي رصيداً لكل مساهمة",
    benefit3: "الوصول إلى ميزات الأمان الحصرية",
    benefit4: "تواصلي مع الأخوات حول العالم",
    joinFree: "انضمي إلى Aurora App مجاناً",
    maybeLater: "ربما لاحقاً",
    noPassword: "لا حاجة لكلمة مرور — نقرة واحدة فقط",
    privacy: "🔒 لن ننشر أبداً بدون إذنك",
  },
};

function t(key: string, locale: string): string {
  const lang = locale.split('-')[0];
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

// Track anonymous interactions
export interface InteractionData {
  searches: number;
  votes: number;
  comments: number;
  debateViews: number;
  totalCreditsEarned: number;
  firstInteraction: string;
  lastInteraction: string;
}

// Get interaction data from localStorage
export function getInteractionData(): InteractionData {
  if (typeof window === 'undefined') {
    return {
      searches: 0,
      votes: 0,
      comments: 0,
      debateViews: 0,
      totalCreditsEarned: 0,
      firstInteraction: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
    };
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid data, reset
    }
  }
  
  const initial: InteractionData = {
    searches: 0,
    votes: 0,
    comments: 0,
    debateViews: 0,
    totalCreditsEarned: 0,
    firstInteraction: new Date().toISOString(),
    lastInteraction: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

// Track an interaction
export function trackInteraction(type: 'search' | 'vote' | 'comment' | 'debateView'): InteractionData {
  if (typeof window === 'undefined') return getInteractionData();
  
  const data = getInteractionData();
  
  // Update counts
  switch (type) {
    case 'search':
      data.searches++;
      data.totalCreditsEarned += 1; // 1 credit per search
      break;
    case 'vote':
      data.votes++;
      data.totalCreditsEarned += 2; // 2 credits per vote
      break;
    case 'comment':
      data.comments++;
      data.totalCreditsEarned += 3; // 3 credits per comment
      break;
    case 'debateView':
      data.debateViews++;
      data.totalCreditsEarned += 1; // 1 credit per debate view
      break;
  }
  
  data.lastInteraction = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  return data;
}

// Get total interaction count
export function getTotalInteractions(): number {
  const data = getInteractionData();
  return data.searches + data.votes + data.comments + data.debateViews;
}

// Check if should show signup prompt
export function shouldShowSignupPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  
  const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
  if (dismissed) {
    // Check if dismissed more than 24 hours ago
    const dismissedDate = new Date(dismissed);
    const hoursSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) return false;
  }
  
  return getTotalInteractions() >= INTERACTION_THRESHOLD;
}

// Dismiss the prompt
export function dismissSignupPrompt(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROMPT_DISMISSED_KEY, new Date().toISOString());
}

interface SignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

export function SignupPrompt({
  isOpen,
  onClose,
  locale = 'en',
}: SignupPromptProps) {
  const [interactionData, setInteractionData] = useState<InteractionData | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInteractionData(getInteractionData());
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    dismissSignupPrompt();
    onClose();
  }, [onClose]);

  const totalInteractions = interactionData 
    ? interactionData.searches + interactionData.votes + interactionData.comments + interactionData.debateViews
    : 0;

  const benefits = [
    { icon: Star, text: t('benefit1', locale), color: '#e5e093' },
    { icon: Gift, text: t('benefit2', locale), color: '#5537a7' },
    { icon: Shield, text: t('benefit3', locale), color: '#22c55e' },
    { icon: Users, text: t('benefit4', locale), color: '#f29de5' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative bg-[var(--card)] rounded-t-3xl sm:rounded-3xl p-6 mx-0 sm:mx-4 max-w-md w-full shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--accent)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>

            {/* Header with animation */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center shadow-lg shadow-[var(--color-aurora-purple)]/30"
              >
                <Heart className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                {t('title', locale)}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t('subtitle', locale)}
              </p>
            </div>

            {/* Interaction Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                  <span className="font-semibold text-[var(--foreground)]">
                    {totalInteractions} {t('interactions', locale)}
                  </span>
                </div>
              </div>
              
              {/* Credits earned preview */}
              <div className="flex items-center justify-center gap-3 py-3 bg-[var(--color-aurora-yellow)]/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-[var(--color-aurora-violet)]" />
                <div className="text-center">
                  <p className="text-xs text-[var(--muted-foreground)]">{t('creditsEarned', locale)}</p>
                  <p className="text-2xl font-bold text-[var(--color-aurora-violet)]">
                    {interactionData?.totalCreditsEarned || 0} ✨
                  </p>
                  <p className="text-xs text-[var(--color-aurora-purple)]">{t('creditsWaiting', locale)}</p>
                </div>
              </div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 mb-6"
            >
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${benefit.color}20` }}
                  >
                    <benefit.icon className="w-4 h-4" style={{ color: benefit.color }} />
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{benefit.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Link href="/api/auth/login" className="block">
                <Button className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-xl min-h-[52px] font-semibold shadow-lg shadow-[var(--color-aurora-purple)]/30">
                  {t('joinFree', locale)}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="w-full rounded-xl min-h-[44px] text-[var(--muted-foreground)]"
              >
                {t('maybeLater', locale)}
              </Button>
              
              <p className="text-xs text-center text-[var(--muted-foreground)]">
                {t('noPassword', locale)}
              </p>
              <p className="text-xs text-center text-[var(--muted-foreground)]">
                {t('privacy', locale)}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage signup prompt state
 */
export function useSignupPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check on mount if should show prompt
  useEffect(() => {
    if (!hasChecked && typeof window !== 'undefined') {
      setHasChecked(true);
      // Delay check to not interrupt initial experience
      const timer = setTimeout(() => {
        if (shouldShowSignupPrompt()) {
          setIsOpen(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasChecked]);

  const close = useCallback(() => {
    setIsOpen(false);
    dismissSignupPrompt();
  }, []);

  const checkAndShow = useCallback(() => {
    if (shouldShowSignupPrompt()) {
      setIsOpen(true);
    }
  }, []);

  return {
    isOpen,
    close,
    checkAndShow,
  };
}
