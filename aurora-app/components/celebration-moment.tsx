"use client";

/**
 * CelebrationMoment Component - Aurora App Engagement System
 * 
 * Displays celebratory animations and messages for user achievements.
 * Triggers: First search, 5 searches, first vote, first comment, 7-day streak
 * 
 * Features:
 * - Confetti, hearts, sparkles animations
 * - Translated messages for 6 languages
 * - Credit award display
 * - Respects prefers-reduced-motion
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Heart, Star, Trophy, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

// Celebration types and their configurations
export type CelebrationType = 
  | 'first_search'
  | 'five_searches'
  | 'first_vote'
  | 'first_comment'
  | 'seven_day_streak'
  | 'first_debate'
  | 'credits_earned'
  | 'badge_earned'
  | 'welcome';

interface CelebrationConfig {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  particles: 'confetti' | 'hearts' | 'sparkles' | 'stars';
  credits?: number;
}

const CELEBRATION_CONFIGS: Record<CelebrationType, CelebrationConfig> = {
  first_search: { icon: Sparkles, color: '#5537a7', particles: 'sparkles', credits: 5 },
  five_searches: { icon: Star, color: '#e5e093', particles: 'stars', credits: 10 },
  first_vote: { icon: Heart, color: '#f29de5', particles: 'hearts', credits: 2 },
  first_comment: { icon: Zap, color: '#5537a7', particles: 'sparkles', credits: 3 },
  seven_day_streak: { icon: Trophy, color: '#e5e093', particles: 'confetti', credits: 50 },
  first_debate: { icon: Sparkles, color: '#5537a7', particles: 'sparkles', credits: 5 },
  credits_earned: { icon: Gift, color: '#e5e093', particles: 'stars' },
  badge_earned: { icon: Trophy, color: '#f29de5', particles: 'confetti' },
  welcome: { icon: Heart, color: '#f29de5', particles: 'hearts', credits: 10 },
};

// Translated celebration messages
const CELEBRATION_MESSAGES: Record<string, Record<CelebrationType, { title: string; message: string }>> = {
  en: {
    first_search: { title: "First Search! 🎉", message: "You've started your journey with Aurora App!" },
    five_searches: { title: "Power Searcher! ⭐", message: "5 searches completed! You're getting the hang of it!" },
    first_vote: { title: "Voice Heard! 💜", message: "Your first vote matters! Keep sharing your opinion." },
    first_comment: { title: "Conversation Starter! 💬", message: "Your voice adds value to our community!" },
    seven_day_streak: { title: "7-Day Streak! 🏆", message: "Amazing dedication! You're a true Aurora App sister!" },
    first_debate: { title: "Debate Champion! 🎯", message: "Your perspective enriches our discussions!" },
    credits_earned: { title: "Credits Earned! ✨", message: "Keep engaging to earn more!" },
    badge_earned: { title: "Badge Unlocked! 🏅", message: "You've earned a new achievement!" },
    welcome: { title: "Welcome to Aurora App! 💜", message: "Your safety, your community, your growth." },
  },
  es: {
    first_search: { title: "¡Primera Búsqueda! 🎉", message: "¡Has comenzado tu viaje con Aurora App!" },
    five_searches: { title: "¡Buscadora Experta! ⭐", message: "¡5 búsquedas completadas! ¡Lo estás dominando!" },
    first_vote: { title: "¡Voz Escuchada! 💜", message: "¡Tu primer voto importa! Sigue compartiendo tu opinión." },
    first_comment: { title: "¡Iniciadora de Conversación! 💬", message: "¡Tu voz añade valor a nuestra comunidad!" },
    seven_day_streak: { title: "¡Racha de 7 Días! 🏆", message: "¡Dedicación increíble! ¡Eres una verdadera hermana Aurora!" },
    first_debate: { title: "¡Campeona del Debate! 🎯", message: "¡Tu perspectiva enriquece nuestras discusiones!" },
    credits_earned: { title: "¡Créditos Ganados! ✨", message: "¡Sigue participando para ganar más!" },
    badge_earned: { title: "¡Insignia Desbloqueada! 🏅", message: "¡Has ganado un nuevo logro!" },
    welcome: { title: "¡Bienvenida a Aurora App! 💜", message: "Tu seguridad, tu comunidad, tu crecimiento." },
  },
  fr: {
    first_search: { title: "Première Recherche! 🎉", message: "Vous avez commencé votre voyage avec Aurora App!" },
    five_searches: { title: "Chercheuse Experte! ⭐", message: "5 recherches terminées! Vous maîtrisez!" },
    first_vote: { title: "Voix Entendue! 💜", message: "Votre premier vote compte! Continuez à partager." },
    first_comment: { title: "Initiatrice de Conversation! 💬", message: "Votre voix enrichit notre communauté!" },
    seven_day_streak: { title: "Série de 7 Jours! 🏆", message: "Dévouement incroyable! Vous êtes une vraie sœur Aurora!" },
    first_debate: { title: "Championne du Débat! 🎯", message: "Votre perspective enrichit nos discussions!" },
    credits_earned: { title: "Crédits Gagnés! ✨", message: "Continuez à participer pour en gagner plus!" },
    badge_earned: { title: "Badge Débloqué! 🏅", message: "Vous avez obtenu une nouvelle réussite!" },
    welcome: { title: "Bienvenue sur Aurora App! 💜", message: "Votre sécurité, votre communauté, votre croissance." },
  },
  pt: {
    first_search: { title: "Primeira Busca! 🎉", message: "Você começou sua jornada com Aurora App!" },
    five_searches: { title: "Buscadora Expert! ⭐", message: "5 buscas completadas! Você está dominando!" },
    first_vote: { title: "Voz Ouvida! 💜", message: "Seu primeiro voto importa! Continue compartilhando." },
    first_comment: { title: "Iniciadora de Conversa! 💬", message: "Sua voz adiciona valor à nossa comunidade!" },
    seven_day_streak: { title: "Sequência de 7 Dias! 🏆", message: "Dedicação incrível! Você é uma verdadeira irmã Aurora!" },
    first_debate: { title: "Campeã do Debate! 🎯", message: "Sua perspectiva enriquece nossas discussões!" },
    credits_earned: { title: "Créditos Ganhos! ✨", message: "Continue participando para ganhar mais!" },
    badge_earned: { title: "Distintivo Desbloqueado! 🏅", message: "Você ganhou uma nova conquista!" },
    welcome: { title: "Bem-vinda ao Aurora App! 💜", message: "Sua segurança, sua comunidade, seu crescimento." },
  },
  de: {
    first_search: { title: "Erste Suche! 🎉", message: "Du hast deine Reise mit Aurora App begonnen!" },
    five_searches: { title: "Power-Sucherin! ⭐", message: "5 Suchen abgeschlossen! Du hast den Dreh raus!" },
    first_vote: { title: "Stimme Gehört! 💜", message: "Deine erste Stimme zählt! Teile weiter deine Meinung." },
    first_comment: { title: "Gesprächsstarterin! 💬", message: "Deine Stimme bereichert unsere Gemeinschaft!" },
    seven_day_streak: { title: "7-Tage-Serie! 🏆", message: "Unglaubliche Hingabe! Du bist eine echte Aurora-Schwester!" },
    first_debate: { title: "Debattenchampion! 🎯", message: "Deine Perspektive bereichert unsere Diskussionen!" },
    credits_earned: { title: "Credits Verdient! ✨", message: "Mach weiter mit, um mehr zu verdienen!" },
    badge_earned: { title: "Abzeichen Freigeschaltet! 🏅", message: "Du hast eine neue Errungenschaft erhalten!" },
    welcome: { title: "Willkommen bei Aurora App! 💜", message: "Deine Sicherheit, deine Gemeinschaft, dein Wachstum." },
  },
  ar: {
    first_search: { title: "البحث الأول! 🎉", message: "لقد بدأت رحلتك مع Aurora App!" },
    five_searches: { title: "باحثة محترفة! ⭐", message: "5 عمليات بحث مكتملة! أنت تتقنين الأمر!" },
    first_vote: { title: "صوتك مسموع! 💜", message: "تصويتك الأول مهم! استمري في مشاركة رأيك." },
    first_comment: { title: "بادئة المحادثة! 💬", message: "صوتك يضيف قيمة لمجتمعنا!" },
    seven_day_streak: { title: "سلسلة 7 أيام! 🏆", message: "تفاني مذهل! أنت أخت Aurora حقيقية!" },
    first_debate: { title: "بطلة النقاش! 🎯", message: "وجهة نظرك تثري نقاشاتنا!" },
    credits_earned: { title: "رصيد مكتسب! ✨", message: "استمري في المشاركة لكسب المزيد!" },
    badge_earned: { title: "شارة مفتوحة! 🏅", message: "لقد حصلت على إنجاز جديد!" },
    welcome: { title: "مرحباً بك في Aurora App! 💜", message: "أمانك، مجتمعك، نموك." },
  },
};

// Get message for locale with fallback to English
function getCelebrationMessage(type: CelebrationType, locale: string) {
  const lang = locale.split('-')[0];
  return CELEBRATION_MESSAGES[lang]?.[type] || CELEBRATION_MESSAGES.en[type];
}

// Particle components
function Confetti({ count = 50 }: { count?: number }) {
  const colors = ['#5537a7', '#f29de5', '#e5e093', '#d6f4ec', '#c9cef4'];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: 400,
            rotate: Math.random() * 720 - 360,
            opacity: 0,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

function Hearts({ count = 20 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[var(--color-aurora-pink)]"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-20px',
            fontSize: `${12 + Math.random() * 16}px`,
          }}
          initial={{ y: 0, scale: 0, opacity: 1 }}
          animate={{
            y: -300 - Math.random() * 100,
            scale: 1,
            opacity: 0,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: Math.random() * 0.3,
            ease: 'easeOut',
          }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

function SparklesAnimation({ count = 30 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[var(--color-aurora-yellow)]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${10 + Math.random() * 14}px`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: Math.random() * 1,
            ease: 'easeInOut',
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}

function StarsAnimation({ count = 25 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${12 + Math.random() * 12}px`,
          }}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 0],
            rotate: 180,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 0.8,
            ease: 'easeInOut',
          }}
        >
          ⭐
        </motion.div>
      ))}
    </div>
  );
}

interface CelebrationMomentProps {
  type: CelebrationType;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  creditsEarned?: number;
}

export function CelebrationMoment({
  type,
  isOpen,
  onClose,
  locale = 'en',
  creditsEarned,
}: CelebrationMomentProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
    }
  }, []);

  // Auto-close after 4 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const config = CELEBRATION_CONFIGS[type];
  const message = getCelebrationMessage(type, locale);
  const credits = creditsEarned ?? config.credits;
  const IconComponent = config.icon;

  const ParticleComponent = {
    confetti: Confetti,
    hearts: Hearts,
    sparkles: SparklesAnimation,
    stars: StarsAnimation,
  }[config.particles];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Particles - only if reduced motion not preferred */}
          {!prefersReducedMotion && <ParticleComponent />}
          
          {/* Celebration Card */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative bg-[var(--card)] rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--accent)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <IconComponent className="w-10 h-10" style={{ color: config.color }} />
            </motion.div>
            
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center text-[var(--foreground)] mb-2"
            >
              {message.title}
            </motion.h2>
            
            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center text-[var(--muted-foreground)] mb-4"
            >
              {message.message}
            </motion.p>
            
            {/* Credits earned */}
            {credits && credits > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[var(--color-aurora-yellow)]/20 rounded-xl mb-4"
              >
                <span className="text-2xl">✨</span>
                <span className="text-lg font-bold text-[var(--color-aurora-violet)]">
                  +{credits} Credits
                </span>
              </motion.div>
            )}
            
            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-xl min-h-[48px]"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage celebration state
 */
export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    type: CelebrationType;
    credits?: number;
  } | null>(null);

  const triggerCelebration = useCallback((type: CelebrationType, credits?: number) => {
    setCelebration({ type, credits });
  }, []);

  const closeCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    celebration,
    triggerCelebration,
    closeCelebration,
    isOpen: celebration !== null,
  };
}

/**
 * Check and trigger milestone celebrations
 * Call this after user actions to check if they've hit a milestone
 */
export function checkMilestone(
  action: 'search' | 'vote' | 'comment' | 'debate',
  count: number,
  triggerCelebration: (type: CelebrationType, credits?: number) => void
) {
  switch (action) {
    case 'search':
      if (count === 1) triggerCelebration('first_search', 5);
      else if (count === 5) triggerCelebration('five_searches', 10);
      break;
    case 'vote':
      if (count === 1) triggerCelebration('first_vote', 2);
      break;
    case 'comment':
      if (count === 1) triggerCelebration('first_comment', 3);
      break;
    case 'debate':
      if (count === 1) triggerCelebration('first_debate', 5);
      break;
  }
}
