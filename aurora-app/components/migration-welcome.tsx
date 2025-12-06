"use client";

/**
 * Task 10.3: Migration Welcome Component
 * 
 * Shows welcome message to users who had anonymous activity
 * and offers to migrate their debate history.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Vote, MessageCircle, CheckCircle2, 
  ArrowRight, X, Gift, Heart 
} from "lucide-react";
import { useAnonymousMigration } from "@/hooks/use-anonymous-migration";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/lib/locale-context";

interface MigrationWelcomeProps {
  userId: Id<"users">;
  onComplete?: () => void;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    welcomeBack: "Welcome to Aurora App!",
    foundHistory: "We found your anonymous activity",
    migrateQuestion: "Would you like to keep your debate history?",
    yourActivity: "Your activity",
    votes: "votes",
    comments: "comments",
    migrateNow: "Yes, keep my history",
    skipMigration: "Start fresh",
    migrating: "Migrating...",
    migrationSuccess: "History migrated successfully!",
    migratedItems: "migrated",
    bonusCredits: "Bonus: +10 credits for your contributions!",
    continue: "Continue to Aurora App",
  },
  es: {
    welcomeBack: "¡Bienvenida a Aurora App!",
    foundHistory: "Encontramos tu actividad anónima",
    migrateQuestion: "¿Te gustaría conservar tu historial de debates?",
    yourActivity: "Tu actividad",
    votes: "votos",
    comments: "comentarios",
    migrateNow: "Sí, conservar mi historial",
    skipMigration: "Empezar de nuevo",
    migrating: "Migrando...",
    migrationSuccess: "¡Historial migrado exitosamente!",
    migratedItems: "migrados",
    bonusCredits: "Bonus: +10 créditos por tus contribuciones!",
    continue: "Continuar a Aurora App",
  },
  fr: {
    welcomeBack: "Bienvenue sur Aurora App!",
    foundHistory: "Nous avons trouvé votre activité anonyme",
    migrateQuestion: "Souhaitez-vous conserver votre historique de débats?",
    yourActivity: "Votre activité",
    votes: "votes",
    comments: "commentaires",
    migrateNow: "Oui, garder mon historique",
    skipMigration: "Recommencer à zéro",
    migrating: "Migration...",
    migrationSuccess: "Historique migré avec succès!",
    migratedItems: "migrés",
    bonusCredits: "Bonus: +10 crédits pour vos contributions!",
    continue: "Continuer vers Aurora App",
  },
  pt: {
    welcomeBack: "Bem-vinda ao Aurora App!",
    foundHistory: "Encontramos sua atividade anônima",
    migrateQuestion: "Gostaria de manter seu histórico de debates?",
    yourActivity: "Sua atividade",
    votes: "votos",
    comments: "comentários",
    migrateNow: "Sim, manter meu histórico",
    skipMigration: "Começar do zero",
    migrating: "Migrando...",
    migrationSuccess: "Histórico migrado com sucesso!",
    migratedItems: "migrados",
    bonusCredits: "Bônus: +10 créditos pelas suas contribuições!",
    continue: "Continuar para Aurora App",
  },
  de: {
    welcomeBack: "Willkommen bei Aurora App!",
    foundHistory: "Wir haben Ihre anonyme Aktivität gefunden",
    migrateQuestion: "Möchten Sie Ihren Debattenverlauf behalten?",
    yourActivity: "Ihre Aktivität",
    votes: "Stimmen",
    comments: "Kommentare",
    migrateNow: "Ja, Verlauf behalten",
    skipMigration: "Neu anfangen",
    migrating: "Migrieren...",
    migrationSuccess: "Verlauf erfolgreich migriert!",
    migratedItems: "migriert",
    bonusCredits: "Bonus: +10 Credits für Ihre Beiträge!",
    continue: "Weiter zu Aurora App",
  },
  ar: {
    welcomeBack: "مرحباً بك في Aurora App!",
    foundHistory: "وجدنا نشاطك المجهول",
    migrateQuestion: "هل تريدين الاحتفاظ بسجل مناقشاتك؟",
    yourActivity: "نشاطك",
    votes: "أصوات",
    comments: "تعليقات",
    migrateNow: "نعم، احتفظي بسجلي",
    skipMigration: "ابدأي من جديد",
    migrating: "جاري النقل...",
    migrationSuccess: "تم نقل السجل بنجاح!",
    migratedItems: "تم نقلها",
    bonusCredits: "مكافأة: +10 رصيد لمساهماتك!",
    continue: "المتابعة إلى Aurora App",
  },
};

export function MigrationWelcome({ userId, onComplete }: MigrationWelcomeProps) {
  const { locale } = useLocale();
  const t = translations[locale] || translations.en;
  
  const {
    hasPendingMigration,
    migrationSummary,
    isMigrating,
    migrationResult,
    performMigration,
    dismissMigration,
  } = useAnonymousMigration();

  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-complete after success animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onComplete]);

  if (!hasPendingMigration && !showSuccess) {
    return null;
  }

  const handleMigrate = async () => {
    const result = await performMigration(userId);
    if (result.success) {
      setShowSuccess(true);
    }
  };

  const handleSkip = () => {
    dismissMigration();
    onComplete?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 bg-[var(--card)] border-[var(--color-aurora-purple)]/20 shadow-2xl">
            {!showSuccess ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                    {t.welcomeBack}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {t.foundHistory}
                  </p>
                </div>

                {/* Activity Summary */}
                <div className="bg-[var(--accent)]/50 rounded-xl p-4 mb-6">
                  <p className="text-xs text-[var(--muted-foreground)] mb-3 uppercase tracking-wide">
                    {t.yourActivity}
                  </p>
                  <div className="flex items-center justify-center gap-6">
                    {migrationSummary.pseudonym && (
                      <div className="text-center">
                        <Badge className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] border-0 mb-1">
                          {migrationSummary.countryFlag} {migrationSummary.pseudonym}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Vote className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                      <span className="font-bold text-[var(--foreground)]">
                        {migrationSummary.debateVotes}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {t.votes}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                      <span className="font-bold text-[var(--foreground)]">
                        {migrationSummary.debateComments}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {t.comments}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question */}
                <p className="text-center text-sm text-[var(--foreground)] mb-6">
                  {t.migrateQuestion}
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[48px] rounded-xl font-semibold"
                  >
                    {isMigrating ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        {t.migrating}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t.migrateNow}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className="w-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {t.skipMigration}
                  </Button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 rounded-full bg-[var(--color-aurora-mint)] flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-[var(--color-aurora-violet)]" />
                </motion.div>
                
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                  {t.migrationSuccess}
                </h2>
                
                {migrationResult && (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">
                      {migrationResult.migratedVotes} {t.votes} {t.migratedItems}
                    </Badge>
                    <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0">
                      {migrationResult.migratedComments} {t.comments} {t.migratedItems}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-2 text-[var(--color-aurora-yellow)] mb-6">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.bonusCredits}</span>
                </div>
                
                <Button
                  onClick={() => onComplete?.()}
                  className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[48px] px-8 rounded-xl font-semibold"
                >
                  {t.continue}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
