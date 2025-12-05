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
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, TrendingUp, Shield, Briefcase, Heart, 
  MapPin, Users, Lightbulb, Clock, Star,
  ArrowRight, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AISuggestion {
  query: string;
  category: 'safety' | 'career' | 'health' | 'community' | 'travel' | 'trending';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  isHot?: boolean;
}

const SUGGESTIONS: AISuggestion[] = [
  { query: "Is this workplace safe for women?", category: 'safety', icon: Shield, color: '#22c55e', isHot: true },
  { query: "Best cities for women entrepreneurs", category: 'career', icon: Briefcase, color: '#5537a7' },
  { query: "Women's health clinics near me", category: 'health', icon: Heart, color: '#f29de5' },
  { query: "Safe travel tips for solo women", category: 'travel', icon: MapPin, color: '#e5e093' },
  { query: "Women in tech communities", category: 'community', icon: Users, color: '#5537a7' },
  { query: "Salary negotiation tips for women", category: 'career', icon: Briefcase, color: '#5537a7', isHot: true },
  { query: "Self-defense classes near me", category: 'safety', icon: Shield, color: '#22c55e' },
  { query: "Women-owned businesses to support", category: 'community', icon: Star, color: '#e5e093' },
];

const QUICK_ACTIONS = [
  { label: "Safety Tips", icon: Shield, query: "safety tips for women", color: '#22c55e' },
  { label: "Career Advice", icon: Briefcase, query: "career advice for women", color: '#5537a7' },
  { label: "Health & Wellness", icon: Heart, query: "women's health wellness", color: '#f29de5' },
  { label: "Community", icon: Users, query: "women's support communities", color: '#e5e093' },
];

interface AISearchSuggestionsProps {
  onSuggestionClick: (query: string) => void;
  className?: string;
}

export function AISearchSuggestions({ onSuggestionClick, className = '' }: AISearchSuggestionsProps) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<AISuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate suggestions every few seconds
  useEffect(() => {
    // Show 4 suggestions at a time
    const updateSuggestions = () => {
      const start = currentIndex % SUGGESTIONS.length;
      const suggestions = [];
      for (let i = 0; i < 4; i++) {
        suggestions.push(SUGGESTIONS[(start + i) % SUGGESTIONS.length]);
      }
      setVisibleSuggestions(suggestions);
    };

    updateSuggestions();
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.button
            key={action.label}
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
          <span>AI-powered suggestions for you</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {visibleSuggestions.map((suggestion, i) => (
              <motion.button
                key={`${suggestion.query}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSuggestionClick(suggestion.query)}
                className="flex items-center gap-3 p-3 bg-[var(--card)] hover:bg-[var(--accent)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 rounded-xl text-left transition-all group"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${suggestion.color}20` }}
                >
                  <suggestion.icon className="w-4 h-4" style={{ color: suggestion.color }} />
                </div>
                <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] flex-1 line-clamp-1">
                  {suggestion.query}
                </span>
                {suggestion.isHot && (
                  <Badge className="bg-[var(--color-aurora-orange)]/10 text-[var(--color-aurora-orange)] border-0 text-[10px] px-1.5">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    Hot
                  </Badge>
                )}
                <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--color-aurora-purple)] opacity-0 group-hover:opacity-100 transition-all" />
              </motion.button>
            ))}
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
          <span>Try asking about safety, career, health, or community topics</span>
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
  suggestions = SUGGESTIONS.slice(0, 4) 
}: { 
  onSuggestionClick: (query: string) => void;
  suggestions?: AISuggestion[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s, i) => (
        <motion.button
          key={s.query}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSuggestionClick(s.query)}
          className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 rounded-full text-xs text-[var(--foreground)] hover:text-[var(--color-aurora-purple)] transition-colors"
        >
          {s.query}
        </motion.button>
      ))}
    </div>
  );
}
