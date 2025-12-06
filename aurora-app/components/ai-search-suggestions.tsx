"use client";

/**
 * AI Search Suggestions Component
 * 
 * Provides intelligent, contextual search suggestions to improve engagement.
 * Features:
 * - Trending searches from the community
 * - Personalized suggestions based on context
 * - Quick action buttons for common queries
 * - Animated, engaging UI
 * - Full i18n support for 6 languages (EN, ES, FR, PT, DE, AR)
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, TrendingUp, Shield, Briefcase, Heart, 
  MapPin, Users, Lightbulb, Clock, Star,
  ArrowRight, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SupportedLocale } from "@/lib/i18n";

interface AISuggestion {
  queryKey: string; // Translation key
  category: 'safety' | 'career' | 'health' | 'community' | 'travel' | 'trending';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  isHot?: boolean;
}

// Translated suggestions for all 6 priority languages
const SUGGESTION_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'suggestion.workplace_safe': 'Is this workplace safe for women?',
    'suggestion.cities_entrepreneurs': 'Best cities for women entrepreneurs',
    'suggestion.health_clinics': "Women's health clinics near me",
    'suggestion.travel_tips': 'Safe travel tips for solo women',
    'suggestion.tech_communities': 'Women in tech communities',
    'suggestion.salary_negotiation': 'Salary negotiation tips for women',
    'suggestion.self_defense': 'Self-defense classes near me',
    'suggestion.women_businesses': 'Women-owned businesses to support',
    'action.safety': 'Safety Tips',
    'action.career': 'Career Advice',
    'action.health': 'Health & Wellness',
    'action.community': 'Community',
    'query.safety': 'safety tips for women',
    'query.career': 'career advice for women',
    'query.health': "women's health wellness",
    'query.community': "women's support communities",
    'label.ai_suggestions': 'AI-powered suggestions for you',
    'label.try_asking': 'Try asking about safety, career, health, or community topics',
  },
  es: {
    'suggestion.workplace_safe': '¿Es este lugar de trabajo seguro para mujeres?',
    'suggestion.cities_entrepreneurs': 'Mejores ciudades para mujeres emprendedoras',
    'suggestion.health_clinics': 'Clínicas de salud femenina cerca de mí',
    'suggestion.travel_tips': 'Consejos de viaje seguro para mujeres solas',
    'suggestion.tech_communities': 'Comunidades de mujeres en tecnología',
    'suggestion.salary_negotiation': 'Consejos de negociación salarial para mujeres',
    'suggestion.self_defense': 'Clases de defensa personal cerca de mí',
    'suggestion.women_businesses': 'Negocios de mujeres para apoyar',
    'action.safety': 'Seguridad',
    'action.career': 'Carrera',
    'action.health': 'Salud y Bienestar',
    'action.community': 'Comunidad',
    'query.safety': 'consejos de seguridad para mujeres',
    'query.career': 'consejos de carrera para mujeres',
    'query.health': 'salud y bienestar femenino',
    'query.community': 'comunidades de apoyo para mujeres',
    'label.ai_suggestions': 'Sugerencias inteligentes para ti',
    'label.try_asking': 'Pregunta sobre seguridad, carrera, salud o comunidad',
  },
  fr: {
    'suggestion.workplace_safe': 'Ce lieu de travail est-il sûr pour les femmes?',
    'suggestion.cities_entrepreneurs': 'Meilleures villes pour femmes entrepreneures',
    'suggestion.health_clinics': 'Cliniques de santé féminine près de moi',
    'suggestion.travel_tips': 'Conseils de voyage sûr pour femmes seules',
    'suggestion.tech_communities': 'Communautés de femmes dans la tech',
    'suggestion.salary_negotiation': 'Conseils de négociation salariale pour femmes',
    'suggestion.self_defense': 'Cours d\'autodéfense près de moi',
    'suggestion.women_businesses': 'Entreprises de femmes à soutenir',
    'action.safety': 'Sécurité',
    'action.career': 'Carrière',
    'action.health': 'Santé & Bien-être',
    'action.community': 'Communauté',
    'query.safety': 'conseils de sécurité pour femmes',
    'query.career': 'conseils de carrière pour femmes',
    'query.health': 'santé et bien-être féminin',
    'query.community': 'communautés de soutien pour femmes',
    'label.ai_suggestions': 'Suggestions intelligentes pour vous',
    'label.try_asking': 'Posez des questions sur la sécurité, la carrière, la santé ou la communauté',
  },
  pt: {
    'suggestion.workplace_safe': 'Este local de trabalho é seguro para mulheres?',
    'suggestion.cities_entrepreneurs': 'Melhores cidades para mulheres empreendedoras',
    'suggestion.health_clinics': 'Clínicas de saúde feminina perto de mim',
    'suggestion.travel_tips': 'Dicas de viagem segura para mulheres sozinhas',
    'suggestion.tech_communities': 'Comunidades de mulheres na tecnologia',
    'suggestion.salary_negotiation': 'Dicas de negociação salarial para mulheres',
    'suggestion.self_defense': 'Aulas de defesa pessoal perto de mim',
    'suggestion.women_businesses': 'Negócios de mulheres para apoiar',
    'action.safety': 'Segurança',
    'action.career': 'Carreira',
    'action.health': 'Saúde e Bem-estar',
    'action.community': 'Comunidade',
    'query.safety': 'dicas de segurança para mulheres',
    'query.career': 'conselhos de carreira para mulheres',
    'query.health': 'saúde e bem-estar feminino',
    'query.community': 'comunidades de apoio para mulheres',
    'label.ai_suggestions': 'Sugestões inteligentes para você',
    'label.try_asking': 'Pergunte sobre segurança, carreira, saúde ou comunidade',
  },
  de: {
    'suggestion.workplace_safe': 'Ist dieser Arbeitsplatz sicher für Frauen?',
    'suggestion.cities_entrepreneurs': 'Beste Städte für Unternehmerinnen',
    'suggestion.health_clinics': 'Frauengesundheitskliniken in meiner Nähe',
    'suggestion.travel_tips': 'Sichere Reisetipps für alleinreisende Frauen',
    'suggestion.tech_communities': 'Frauen in Tech-Communities',
    'suggestion.salary_negotiation': 'Gehaltsverhandlungstipps für Frauen',
    'suggestion.self_defense': 'Selbstverteidigungskurse in meiner Nähe',
    'suggestion.women_businesses': 'Von Frauen geführte Unternehmen unterstützen',
    'action.safety': 'Sicherheit',
    'action.career': 'Karriere',
    'action.health': 'Gesundheit',
    'action.community': 'Gemeinschaft',
    'query.safety': 'Sicherheitstipps für Frauen',
    'query.career': 'Karriereberatung für Frauen',
    'query.health': 'Frauengesundheit und Wohlbefinden',
    'query.community': 'Unterstützungsgemeinschaften für Frauen',
    'label.ai_suggestions': 'KI-gestützte Vorschläge für dich',
    'label.try_asking': 'Frage nach Sicherheit, Karriere, Gesundheit oder Gemeinschaft',
  },
  ar: {
    'suggestion.workplace_safe': 'هل مكان العمل هذا آمن للنساء؟',
    'suggestion.cities_entrepreneurs': 'أفضل المدن لرائدات الأعمال',
    'suggestion.health_clinics': 'عيادات صحة المرأة بالقرب مني',
    'suggestion.travel_tips': 'نصائح سفر آمنة للنساء المسافرات وحدهن',
    'suggestion.tech_communities': 'مجتمعات النساء في التكنولوجيا',
    'suggestion.salary_negotiation': 'نصائح التفاوض على الراتب للنساء',
    'suggestion.self_defense': 'دروس الدفاع عن النفس بالقرب مني',
    'suggestion.women_businesses': 'أعمال تملكها نساء لدعمها',
    'action.safety': 'الأمان',
    'action.career': 'المهنة',
    'action.health': 'الصحة والعافية',
    'action.community': 'المجتمع',
    'query.safety': 'نصائح أمان للنساء',
    'query.career': 'نصائح مهنية للنساء',
    'query.health': 'صحة المرأة والعافية',
    'query.community': 'مجتمعات دعم النساء',
    'label.ai_suggestions': 'اقتراحات ذكية لك',
    'label.try_asking': 'اسألي عن الأمان أو المهنة أو الصحة أو المجتمع',
  },
};

// Get translation for current locale
function getSuggestionText(key: string, locale: string): string {
  const lang = locale.split('-')[0]; // Handle 'en-US' -> 'en'
  return SUGGESTION_TRANSLATIONS[lang]?.[key] || SUGGESTION_TRANSLATIONS.en[key] || key;
}

const SUGGESTION_KEYS: AISuggestion[] = [
  { queryKey: 'suggestion.workplace_safe', category: 'safety', icon: Shield, color: '#22c55e', isHot: true },
  { queryKey: 'suggestion.cities_entrepreneurs', category: 'career', icon: Briefcase, color: '#5537a7' },
  { queryKey: 'suggestion.health_clinics', category: 'health', icon: Heart, color: '#f29de5' },
  { queryKey: 'suggestion.travel_tips', category: 'travel', icon: MapPin, color: '#e5e093' },
  { queryKey: 'suggestion.tech_communities', category: 'community', icon: Users, color: '#5537a7' },
  { queryKey: 'suggestion.salary_negotiation', category: 'career', icon: Briefcase, color: '#5537a7', isHot: true },
  { queryKey: 'suggestion.self_defense', category: 'safety', icon: Shield, color: '#22c55e' },
  { queryKey: 'suggestion.women_businesses', category: 'community', icon: Star, color: '#e5e093' },
];

const QUICK_ACTION_KEYS = [
  { labelKey: 'action.safety', icon: Shield, queryKey: 'query.safety', color: '#22c55e' },
  { labelKey: 'action.career', icon: Briefcase, queryKey: 'query.career', color: '#5537a7' },
  { labelKey: 'action.health', icon: Heart, queryKey: 'query.health', color: '#f29de5' },
  { labelKey: 'action.community', icon: Users, queryKey: 'query.community', color: '#e5e093' },
];

interface AISearchSuggestionsProps {
  onSuggestionClick: (query: string) => void;
  className?: string;
  locale?: string;
}

export function AISearchSuggestions({ onSuggestionClick, className = '', locale }: AISearchSuggestionsProps) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<AISuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userLocale, setUserLocale] = useState('en');

  // Detect user's locale
  useEffect(() => {
    if (locale) {
      setUserLocale(locale);
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('aurora-locale');
      const browser = navigator.language.split('-')[0];
      setUserLocale(stored || browser || 'en');
    }
  }, [locale]);

  // Rotate suggestions every few seconds
  useEffect(() => {
    // Show 4 suggestions at a time
    const updateSuggestions = () => {
      const start = currentIndex % SUGGESTION_KEYS.length;
      const suggestions = [];
      for (let i = 0; i < 4; i++) {
        suggestions.push(SUGGESTION_KEYS[(start + i) % SUGGESTION_KEYS.length]);
      }
      setVisibleSuggestions(suggestions);
    };

    updateSuggestions();
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Memoize translated quick actions
  const translatedQuickActions = useMemo(() => 
    QUICK_ACTION_KEYS.map(action => ({
      ...action,
      label: getSuggestionText(action.labelKey, userLocale),
      query: getSuggestionText(action.queryKey, userLocale),
    })), [userLocale]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {translatedQuickActions.map((action, i) => (
          <motion.button
            key={action.labelKey}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSuggestionClick(action.query)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card)] hover:bg-gradient-to-r hover:from-[var(--color-aurora-purple)]/10 hover:to-[var(--color-aurora-pink)]/10 border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 rounded-full text-sm transition-all shadow-sm hover:shadow-md group"
          >
            <action.icon className="w-4 h-4 transition-colors" style={{ color: action.color }} />
            <span className="text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] font-medium">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* AI-Powered Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
          <span>{getSuggestionText('label.ai_suggestions', userLocale)}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {visibleSuggestions.map((suggestion, i) => {
              const translatedQuery = getSuggestionText(suggestion.queryKey, userLocale);
              return (
                <motion.button
                  key={`${suggestion.queryKey}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSuggestionClick(translatedQuery)}
                  className="flex items-center gap-3 p-3 bg-[var(--card)] hover:bg-[var(--accent)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 rounded-xl text-left transition-all group"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${suggestion.color}20` }}
                  >
                    <suggestion.icon className="w-4 h-4" style={{ color: suggestion.color }} />
                  </div>
                  <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] flex-1 line-clamp-1">
                    {translatedQuery}
                  </span>
                  {suggestion.isHot && (
                    <Badge className="bg-[var(--color-aurora-orange)]/10 text-[var(--color-aurora-orange)] border-0 text-[10px] px-1.5">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      Hot
                    </Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--color-aurora-purple)] opacity-0 group-hover:opacity-100 transition-all" />
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Engagement Prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1">
          <Lightbulb className="w-3 h-3 text-[var(--color-aurora-yellow)]" />
          <span>{getSuggestionText('label.try_asking', userLocale)}</span>
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function AISearchSuggestionsCompact({ 
  onSuggestionClick, 
  suggestionKeys = SUGGESTION_KEYS.slice(0, 4),
  locale = 'en',
}: { 
  onSuggestionClick: (query: string) => void;
  suggestionKeys?: AISuggestion[];
  locale?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestionKeys.map((s, i) => {
        const translatedQuery = getSuggestionText(s.queryKey, locale);
        return (
          <motion.button
            key={s.queryKey}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSuggestionClick(translatedQuery)}
            className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 rounded-full text-xs text-[var(--foreground)] hover:text-[var(--color-aurora-purple)] transition-colors"
          >
            {translatedQuery}
          </motion.button>
        );
      })}
    </div>
  );
}

// Export for use in other components
export { getSuggestionText, SUGGESTION_TRANSLATIONS };
