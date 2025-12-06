"use client";

/**
 * Task 10.1: Related Aurora App Discussions
 * Shows "X members discussing this" badge in search results
 * Encourages anonymous users to join the community
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, MessageCircle, Vote, UsersRound, 
  ArrowRight, Sparkles, Lock 
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

interface RelatedDiscussionsProps {
  searchQuery: string;
  className?: string;
}

const typeIcons = {
  post: MessageCircle,
  debate: Vote,
  circle: UsersRound,
};

const typeColors = {
  post: "var(--color-aurora-purple)",
  debate: "var(--color-aurora-pink)",
  circle: "var(--color-aurora-blue)",
};

const typeLabels: Record<string, Record<string, string>> = {
  en: { post: "Discussion", debate: "Debate", circle: "Community" },
  es: { post: "Discusión", debate: "Debate", circle: "Comunidad" },
  fr: { post: "Discussion", debate: "Débat", circle: "Communauté" },
  pt: { post: "Discussão", debate: "Debate", circle: "Comunidade" },
  de: { post: "Diskussion", debate: "Debatte", circle: "Gemeinschaft" },
  ar: { post: "نقاش", debate: "مناظرة", circle: "مجتمع" },
};

const translations: Record<string, Record<string, string>> = {
  en: {
    membersDiscussing: "members discussing this topic",
    relatedDiscussions: "Related Aurora App Discussions",
    joinToParticipate: "Join to participate",
    viewAll: "View all discussions",
    noDiscussions: "Be the first to start a discussion!",
    participants: "participants",
  },
  es: {
    membersDiscussing: "miembros discutiendo este tema",
    relatedDiscussions: "Discusiones relacionadas en Aurora App",
    joinToParticipate: "Únete para participar",
    viewAll: "Ver todas las discusiones",
    noDiscussions: "¡Sé la primera en iniciar una discusión!",
    participants: "participantes",
  },
  fr: {
    membersDiscussing: "membres discutent de ce sujet",
    relatedDiscussions: "Discussions Aurora App connexes",
    joinToParticipate: "Rejoignez pour participer",
    viewAll: "Voir toutes les discussions",
    noDiscussions: "Soyez la première à lancer une discussion!",
    participants: "participants",
  },
  pt: {
    membersDiscussing: "membros discutindo este tópico",
    relatedDiscussions: "Discussões relacionadas no Aurora App",
    joinToParticipate: "Junte-se para participar",
    viewAll: "Ver todas as discussões",
    noDiscussions: "Seja a primeira a iniciar uma discussão!",
    participants: "participantes",
  },
  de: {
    membersDiscussing: "Mitglieder diskutieren dieses Thema",
    relatedDiscussions: "Verwandte Aurora App Diskussionen",
    joinToParticipate: "Mitmachen",
    viewAll: "Alle Diskussionen anzeigen",
    noDiscussions: "Sei die Erste, die eine Diskussion startet!",
    participants: "Teilnehmer",
  },
  ar: {
    membersDiscussing: "أعضاء يناقشون هذا الموضوع",
    relatedDiscussions: "مناقشات Aurora App ذات الصلة",
    joinToParticipate: "انضمي للمشاركة",
    viewAll: "عرض جميع المناقشات",
    noDiscussions: "كوني أول من يبدأ نقاشاً!",
    participants: "مشاركات",
  },
};

export function RelatedDiscussions({ searchQuery, className = "" }: RelatedDiscussionsProps) {
  const { locale } = useLocale();
  const t = translations[locale] || translations.en;
  const labels = typeLabels[locale] || typeLabels.en;

  const relatedData = useQuery(
    api.publicSearch.getRelatedDiscussions,
    searchQuery.length >= 2 ? { searchQuery, limit: 4 } : "skip"
  );

  if (!relatedData || relatedData.totalDiscussions === 0) {
    return null;
  }

  const { discussions, totalMembers, totalDiscussions } = relatedData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {/* Summary Badge - "X members discussing this" */}
      {totalMembers > 0 && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                <span className="text-[var(--color-aurora-purple)] font-bold">{totalMembers}</span>{" "}
                {t.membersDiscussing}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {totalDiscussions} {t.relatedDiscussions.toLowerCase()}
              </p>
            </div>
          </div>
          <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] border-0 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Aurora App
          </Badge>
        </div>
      )}

      {/* Discussion Cards */}
      <div className="space-y-2">
        {discussions.map((discussion, i) => {
          const Icon = typeIcons[discussion.type as keyof typeof typeIcons] || MessageCircle;
          const color = typeColors[discussion.type as keyof typeof typeColors] || "var(--color-aurora-purple)";
          const label = labels[discussion.type] || discussion.type;

          return (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href="/api/auth/login">
                <Card className="p-3 hover:shadow-md transition-all cursor-pointer border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 bg-[var(--card)]">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge 
                          className="text-[9px] border-0 h-4"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {label}
                        </Badge>
                        {discussion.participantCount > 0 && (
                          <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-0.5">
                            <Users className="w-2.5 h-2.5" />
                            {discussion.participantCount} {t.participants}
                          </span>
                        )}
                        <Lock className="w-2.5 h-2.5 text-[var(--muted-foreground)] ml-auto" />
                      </div>
                      <h4 className="font-medium text-[var(--foreground)] text-sm line-clamp-1">
                        {discussion.title}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                        {discussion.snippet}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* CTA to join */}
      {totalDiscussions > 0 && (
        <div className="mt-3 text-center">
          <Link href="/api/auth/login">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs border-[var(--color-aurora-purple)]/30 text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10"
            >
              {t.joinToParticipate}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Compact badge version for inline display in search results
 */
export function RelatedDiscussionsBadge({ searchQuery }: { searchQuery: string }) {
  const { locale } = useLocale();
  
  const relatedData = useQuery(
    api.publicSearch.getRelatedDiscussions,
    searchQuery.length >= 2 ? { searchQuery, limit: 1 } : "skip"
  );

  if (!relatedData || relatedData.totalMembers === 0) {
    return null;
  }

  const memberText: Record<string, string> = {
    en: "discussing",
    es: "discutiendo",
    fr: "discutent",
    pt: "discutindo",
    de: "diskutieren",
    ar: "يناقشون",
  };

  return (
    <Link href="/api/auth/login">
      <Badge className="bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] border-0 text-[10px] hover:bg-[var(--color-aurora-purple)]/20 transition-colors cursor-pointer">
        <Users className="w-2.5 h-2.5 mr-1" />
        {relatedData.totalMembers} {memberText[locale] || memberText.en}
      </Badge>
    </Link>
  );
}
