"use client";

/**
 * BiasCard - Enhanced Bias Visualization Component
 * 
 * Displays all 5 metrics with emotional messaging:
 * - Gender Bias (with alert for high bias)
 * - Political Bias
 * - Fake News Risk
 * - AI Content Detection
 * - Source Intent
 * 
 * Uses Aurora App colors and supports all 6 languages
 */

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, Heart, Brain, Scale, Target, 
  ShieldCheck, ShieldAlert, Info
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";

// Translations for bias messages
const BIAS_MESSAGES: Record<string, Record<string, string>> = {
  en: {
    genderBias: "Gender Bias",
    politicalBias: "Political Bias",
    fakeNewsRisk: "Fake News Risk",
    aiContent: "AI Content",
    sourceIntent: "Source Intent",
    alertSister: "Sister, be aware",
    alertGenderBias: "This source shows signs of gender bias",
    safeSource: "Safe source for women",
    verifiedCommunity: "Verified by our community",
    lowBias: "Low Bias",
    moderateBias: "Moderate Bias",
    highBias: "High Bias",
    informational: "Informational",
    commercial: "Commercial",
    opinion: "Opinion",
    news: "News",
  },
  es: {
    genderBias: "Sesgo de Género",
    politicalBias: "Sesgo Político",
    fakeNewsRisk: "Riesgo de Fake News",
    aiContent: "Contenido IA",
    sourceIntent: "Intención de la Fuente",
    alertSister: "Hermana, ten cuidado",
    alertGenderBias: "Esta fuente muestra señales de sesgo de género",
    safeSource: "Fuente segura para mujeres",
    verifiedCommunity: "Verificado por nuestra comunidad",
    lowBias: "Bajo Sesgo",
    moderateBias: "Sesgo Moderado",
    highBias: "Alto Sesgo",
    informational: "Informativo",
    commercial: "Comercial",
    opinion: "Opinión",
    news: "Noticias",
  },
  fr: {
    genderBias: "Biais de Genre",
    politicalBias: "Biais Politique",
    fakeNewsRisk: "Risque de Fake News",
    aiContent: "Contenu IA",
    sourceIntent: "Intention de la Source",
    alertSister: "Sœur, sois prudente",
    alertGenderBias: "Cette source montre des signes de biais de genre",
    safeSource: "Source sûre pour les femmes",
    verifiedCommunity: "Vérifié par notre communauté",
    lowBias: "Faible Biais",
    moderateBias: "Biais Modéré",
    highBias: "Biais Élevé",
    informational: "Informatif",
    commercial: "Commercial",
    opinion: "Opinion",
    news: "Actualités",
  },
  pt: {
    genderBias: "Viés de Gênero",
    politicalBias: "Viés Político",
    fakeNewsRisk: "Risco de Fake News",
    aiContent: "Conteúdo IA",
    sourceIntent: "Intenção da Fonte",
    alertSister: "Irmã, tenha cuidado",
    alertGenderBias: "Esta fonte mostra sinais de viés de gênero",
    safeSource: "Fonte segura para mulheres",
    verifiedCommunity: "Verificado pela nossa comunidade",
    lowBias: "Baixo Viés",
    moderateBias: "Viés Moderado",
    highBias: "Alto Viés",
    informational: "Informativo",
    commercial: "Comercial",
    opinion: "Opinião",
    news: "Notícias",
  },
  de: {
    genderBias: "Geschlechter-Bias",
    politicalBias: "Politischer Bias",
    fakeNewsRisk: "Fake-News-Risiko",
    aiContent: "KI-Inhalt",
    sourceIntent: "Quellen-Absicht",
    alertSister: "Schwester, sei vorsichtig",
    alertGenderBias: "Diese Quelle zeigt Anzeichen von Geschlechter-Bias",
    safeSource: "Sichere Quelle für Frauen",
    verifiedCommunity: "Von unserer Gemeinschaft verifiziert",
    lowBias: "Niedriger Bias",
    moderateBias: "Moderater Bias",
    highBias: "Hoher Bias",
    informational: "Informativ",
    commercial: "Kommerziell",
    opinion: "Meinung",
    news: "Nachrichten",
  },
  ar: {
    genderBias: "تحيز جنسي",
    politicalBias: "تحيز سياسي",
    fakeNewsRisk: "خطر الأخبار الكاذبة",
    aiContent: "محتوى ذكاء اصطناعي",
    sourceIntent: "نية المصدر",
    alertSister: "أختي، كوني حذرة",
    alertGenderBias: "هذا المصدر يُظهر علامات تحيز جنسي",
    safeSource: "مصدر آمن للنساء",
    verifiedCommunity: "موثق من مجتمعنا",
    lowBias: "تحيز منخفض",
    moderateBias: "تحيز متوسط",
    highBias: "تحيز عالي",
    informational: "معلوماتي",
    commercial: "تجاري",
    opinion: "رأي",
    news: "أخبار",
  },
};

interface BiasMetrics {
  genderBias: number; // 0-100
  politicalBias?: string; // "left" | "center" | "right"
  fakeNewsRisk: number; // 0-100
  aiContent: number; // 0-100
  sourceIntent?: string; // "informational" | "commercial" | "opinion" | "news"
  isWomenFocused?: boolean;
}

interface BiasCardProps {
  metrics: BiasMetrics;
  compact?: boolean;
  showAlert?: boolean;
}

export function BiasCard({ metrics, compact = false, showAlert = true }: BiasCardProps) {
  const { locale } = useLocale();
  const t = BIAS_MESSAGES[locale] || BIAS_MESSAGES.en;
  
  const hasHighGenderBias = metrics.genderBias > 60;
  const hasLowGenderBias = metrics.genderBias <= 30;
  const hasHighFakeNewsRisk = metrics.fakeNewsRisk > 60;
  const hasHighAIContent = metrics.aiContent > 50;

  // Get bias level label
  const getBiasLabel = (score: number) => {
    if (score <= 30) return t.lowBias;
    if (score <= 60) return t.moderateBias;
    return t.highBias;
  };

  // Get color based on score (inverted - low is good)
  const getScoreColor = (score: number, inverted = true) => {
    if (inverted) {
      if (score <= 30) return "var(--color-aurora-mint)";
      if (score <= 60) return "var(--color-aurora-yellow)";
      return "var(--color-aurora-salmon)";
    }
    // For credibility (high is good)
    if (score >= 70) return "var(--color-aurora-mint)";
    if (score >= 40) return "var(--color-aurora-yellow)";
    return "var(--color-aurora-salmon)";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {hasHighGenderBias && (
          <Badge className="text-[9px] bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)] border-0">
            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
            {t.genderBias} {metrics.genderBias}%
          </Badge>
        )}
        {hasLowGenderBias && (
          <Badge className="text-[9px] bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-violet)] border-0">
            <Heart className="w-2.5 h-2.5 mr-0.5" />
            {t.lowBias}
          </Badge>
        )}
        {hasHighAIContent && (
          <Badge className="text-[9px] bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)] border-0">
            <Brain className="w-2.5 h-2.5 mr-0.5" />
            {metrics.aiContent}% AI
          </Badge>
        )}
        {hasHighFakeNewsRisk && (
          <Badge className="text-[9px] bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)] border-0">
            <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
            {t.fakeNewsRisk}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Gender Bias Alert Banner */}
      {showAlert && hasHighGenderBias && (
        <GenderAlertBanner 
          type="warning" 
          message={t.alertGenderBias}
          title={t.alertSister}
        />
      )}
      
      {showAlert && hasLowGenderBias && metrics.isWomenFocused && (
        <GenderAlertBanner 
          type="safe" 
          message={t.verifiedCommunity}
          title={t.safeSource}
        />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Gender Bias */}
        <MetricPill
          icon={<Scale className="w-3 h-3" />}
          label={t.genderBias}
          value={`${metrics.genderBias}%`}
          color={getScoreColor(metrics.genderBias)}
        />
        
        {/* AI Content */}
        <MetricPill
          icon={<Brain className="w-3 h-3" />}
          label={t.aiContent}
          value={`${metrics.aiContent}%`}
          color={getScoreColor(metrics.aiContent)}
        />
        
        {/* Fake News Risk */}
        <MetricPill
          icon={<ShieldAlert className="w-3 h-3" />}
          label={t.fakeNewsRisk}
          value={`${metrics.fakeNewsRisk}%`}
          color={getScoreColor(metrics.fakeNewsRisk)}
        />
        
        {/* Source Intent */}
        {metrics.sourceIntent && (
          <MetricPill
            icon={<Target className="w-3 h-3" />}
            label={t.sourceIntent}
            value={t[metrics.sourceIntent as keyof typeof t] || metrics.sourceIntent}
            color="var(--color-aurora-lavender)"
          />
        )}
      </div>
    </div>
  );
}

// Metric Pill Component
function MetricPill({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
}) {
  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
      style={{ backgroundColor: `${color}20` }}
    >
      <span style={{ color }}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-[9px] text-[var(--muted-foreground)] leading-tight">{label}</span>
        <span className="font-medium text-[var(--foreground)]" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

// Gender Alert Banner Component
interface GenderAlertBannerProps {
  type: "warning" | "safe";
  title: string;
  message: string;
}

export function GenderAlertBanner({ type, title, message }: GenderAlertBannerProps) {
  const isWarning = type === "warning";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
        isWarning 
          ? "bg-[var(--color-aurora-salmon)]/10 border-[var(--color-aurora-salmon)]/30" 
          : "bg-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-mint)]/50"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isWarning 
          ? "bg-[var(--color-aurora-salmon)]/20" 
          : "bg-[var(--color-aurora-mint)]/30"
      }`}>
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-salmon)]" />
        ) : (
          <Heart className="w-5 h-5 text-[var(--color-aurora-purple)]" />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-semibold text-sm ${
          isWarning ? "text-[var(--color-aurora-salmon)]" : "text-[var(--color-aurora-purple)]"
        }`}>
          {title}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">{message}</p>
      </div>
    </motion.div>
  );
}

export default BiasCard;
