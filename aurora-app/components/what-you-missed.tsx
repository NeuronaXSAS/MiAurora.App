"use client";

/**
 * WhatYouMissed Component - Aurora App Engagement System
 * 
 * Shows returning users (24+ hours absence) what they missed.
 * Highlights top debates, trending content, and community activity.
 * 
 * Task 12.3: Create "What you missed" summary for returning users
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, MessageCircle, Users, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Translated messages for 6 priority languages
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title: "Welcome Back! 💜",
    subtitle: "Here's what you missed",
    debates: "Hot Debates",
    trending: "Trending Now",
    community: "Community Activity",
    newMembers: "new sisters joined",
    newPosts: "new posts shared",
    activeDebates: "active debates",
    viewAll: "View All",
    dismiss: "Got it!",
    missedYou: "We missed you!",
  },
  es: {
    title: "¡Bienvenida de Vuelta! 💜",
    subtitle: "Esto es lo que te perdiste",
    debates: "Debates Populares",
    trending: "Tendencias",
    community: "Actividad de la Comunidad",
    newMembers: "nuevas hermanas se unieron",
    newPosts: "nuevas publicaciones",
    activeDebates: "debates activos",
    viewAll: "Ver Todo",
    dismiss: "¡Entendido!",
    missedYou: "¡Te extrañamos!",
  },
  fr: {
    title: "Bon Retour! 💜",
    subtitle: "Voici ce que vous avez manqué",
    debates: "Débats Populaires",
    trending: "Tendances",
    community: "Activité Communautaire",
    newMembers: "nouvelles sœurs ont rejoint",
    newPosts: "nouvelles publications",
    activeDebates: "débats actifs",
    viewAll: "Voir Tout",
    dismiss: "Compris!",
    missedYou: "Vous nous avez manqué!",
  },
  pt: {
    title: "Bem-vinda de Volta! 💜",
    subtitle: "Veja o que você perdeu",
    debates: "Debates Populares",
    trending: "Em Alta",
    community: "Atividade da Comunidade",
    newMembers: "novas irmãs se juntaram",
    newPosts: "novas publicações",
    activeDebates: "debates ativos",
    viewAll: "Ver Tudo",
    dismiss: "Entendi!",
    missedYou: "Sentimos sua falta!",
  },
  de: {
    title: "Willkommen Zurück! 💜",
    subtitle: "Das hast du verpasst",
    debates: "Beliebte Debatten",
    trending: "Im Trend",
    community: "Community-Aktivität",
    newMembers: "neue Schwestern beigetreten",
    newPosts: "neue Beiträge",
    activeDebates: "aktive Debatten",
    viewAll: "Alle Anzeigen",
    dismiss: "Verstanden!",
    missedYou: "Wir haben dich vermisst!",
  },
  ar: {
    title: "مرحباً بعودتك! 💜",
    subtitle: "إليك ما فاتك",
    debates: "نقاشات ساخنة",
    trending: "الأكثر رواجاً",
    community: "نشاط المجتمع",
    newMembers: "أخوات جدد انضممن",
    newPosts: "منشورات جديدة",
    activeDebates: "نقاشات نشطة",
    viewAll: "عرض الكل",
    dismiss: "فهمت!",
    missedYou: "افتقدناك!",
  },
};

function t(key: string, locale: string): string {
  const lang = locale.split('-')[0];
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}

interface MissedContent {
  topDebates: Array<{
    id: string;
    title: string;
    voteCount: number;
    category: string;
  }>;
  trendingTopics: string[];
  stats: {
    newMembers: number;
    newPosts: number;
    activeDebates: number;
  };
}

interface WhatYouMissedProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  content?: MissedContent;
  onViewDebates?: () => void;
  onViewFeed?: () => void;
}

export function WhatYouMissed({
  isOpen,
  onClose,
  locale = 'en',
  content,
  onViewDebates,
  onViewFeed,
}: WhatYouMissedProps) {
  // Default content if none provided
  const defaultContent: MissedContent = {
    topDebates: [
      { id: '1', title: 'Should remote work be the default?', voteCount: 234, category: 'Career' },
      { id: '2', title: 'Best cities for solo women travelers', voteCount: 189, category: 'Travel' },
    ],
    trendingTopics: ['#WomenInTech', '#SafetyFirst', '#CareerGrowth'],
    stats: {
      newMembers: 127,
      newPosts: 45,
      activeDebates: 6,
    },
  };

  const data = content || defaultContent;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative bg-[var(--card)] rounded-t-3xl sm:rounded-3xl p-6 mx-0 sm:mx-4 max-w-md w-full shadow-2xl border border-[var(--border)] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--accent)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {t('title', locale)}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t('subtitle', locale)}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-3 bg-[var(--color-aurora-pink)]/10 rounded-xl"
              >
                <Users className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-pink)]" />
                <p className="text-lg font-bold text-[var(--foreground)]">{data.stats.newMembers}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{t('newMembers', locale)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center p-3 bg-[var(--color-aurora-purple)]/10 rounded-xl"
              >
                <MessageCircle className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-purple)]" />
                <p className="text-lg font-bold text-[var(--foreground)]">{data.stats.newPosts}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{t('newPosts', locale)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center p-3 bg-[var(--color-aurora-yellow)]/20 rounded-xl"
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-violet)]" />
                <p className="text-lg font-bold text-[var(--foreground)]">{data.stats.activeDebates}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{t('activeDebates', locale)}</p>
              </motion.div>
            </div>

            {/* Top Debates */}
            {data.topDebates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    {t('debates', locale)}
                  </h3>
                  {onViewDebates && (
                    <button
                      onClick={onViewDebates}
                      className="text-xs text-[var(--color-aurora-purple)] hover:underline flex items-center gap-1"
                    >
                      {t('viewAll', locale)}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {data.topDebates.slice(0, 2).map((debate, i) => (
                    <Card
                      key={debate.id}
                      className="p-3 bg-[var(--accent)]/50 border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                            {debate.title}
                          </p>
                          <Badge className="mt-1 text-[9px] bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] border-0">
                            {debate.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                          <Heart className="w-3 h-3" />
                          <span className="text-xs">{debate.voteCount}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Trending Topics */}
            {data.trendingTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-6"
              >
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                  {t('trending', locale)}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.trendingTopics.map((topic, i) => (
                    <Badge
                      key={i}
                      className="bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] border-0 hover:bg-[var(--color-aurora-purple)]/20 cursor-pointer transition-colors"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-2"
            >
              {onViewFeed && (
                <Button
                  onClick={() => {
                    onViewFeed();
                    onClose();
                  }}
                  className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-xl min-h-[48px]"
                >
                  {t('viewAll', locale)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full rounded-xl min-h-[48px] border-[var(--border)]"
              >
                {t('dismiss', locale)}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to check if user should see "What you missed"
 * Shows after 24+ hours of absence
 */
export function useWhatYouMissed() {
  const [shouldShow, setShouldShow] = useState(false);
  const [lastVisit, setLastVisit] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastVisitStr = localStorage.getItem('aurora-last-visit');
    const dismissedStr = localStorage.getItem('aurora-missed-dismissed');
    
    if (lastVisitStr) {
      const lastVisitDate = new Date(lastVisitStr);
      const now = new Date();
      const hoursSinceVisit = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60);
      
      setLastVisit(lastVisitDate);
      
      // Show if 24+ hours since last visit AND not dismissed today
      if (hoursSinceVisit >= 24) {
        const dismissedDate = dismissedStr ? new Date(dismissedStr) : null;
        const today = new Date().toDateString();
        
        if (!dismissedDate || dismissedDate.toDateString() !== today) {
          setShouldShow(true);
        }
      }
    }

    // Update last visit time
    localStorage.setItem('aurora-last-visit', new Date().toISOString());
  }, []);

  const dismiss = () => {
    setShouldShow(false);
    localStorage.setItem('aurora-missed-dismissed', new Date().toISOString());
  };

  return {
    shouldShow,
    lastVisit,
    dismiss,
  };
}
