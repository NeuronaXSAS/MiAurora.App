"use client";

/**
 * Aurora App - Landing Page Search
 * 
 * A Google-competitor search experience that:
 * - Shows AI-generated summaries from real community content
 * - Provides honest, human-first results (no ads, no manipulation)
 * - Encourages sign-up to see full content
 * - Competes on algorithm quality, not engagement tricks
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  FileText, 
  MapPin as Route, 
  Users, 
  Briefcase, 
  Shield, 
  Lock, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface SearchResult {
  type: string;
  previewTitle: string;
  previewSnippet: string;
  category?: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  post: FileText,
  route: Route,
  circle: Users,
  opportunity: Briefcase,
  resource: Shield,
};

const typeColors: Record<string, string> = {
  post: "#5537a7",
  route: "#22c55e",
  circle: "#f29de5",
  opportunity: "#e5e093",
  resource: "#d6f4ec",
};

const typeLabels: Record<string, string> = {
  post: "Community Post",
  route: "Safe Route",
  circle: "Support Circle",
  opportunity: "Career Opportunity",
  resource: "Safety Resource",
};

const typeDescriptions: Record<string, string> = {
  post: "Shared by community members",
  route: "Verified safe path",
  circle: "Join the conversation",
  opportunity: "Career growth",
  resource: "Verified resource",
};

export function LandingSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search results from Convex
  const searchData = useQuery(
    api.publicSearch.publicSearch,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 6 } : "skip"
  );

  // Trending content for empty state
  const trendingContent = useQuery(api.publicSearch.getTrendingPreview, {});
  
  // Extract results array from search data
  const searchResults = searchData?.results;

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowResults(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay to allow click on results
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  }, []);

  const hasResults = searchResults && searchResults.length > 0;
  const showTrending = !query && trendingContent && trendingContent.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className={`relative flex items-center bg-[var(--card)] border-2 rounded-2xl transition-all duration-300 ${
          isFocused 
            ? "border-[var(--color-aurora-purple)] shadow-lg shadow-[var(--color-aurora-purple)]/20" 
            : "border-[var(--border)] hover:border-[var(--color-aurora-lavender)]"
        }`}>
          <Search className="absolute left-4 w-5 h-5 text-[var(--muted-foreground)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search community wisdom, safe routes, opportunities..."
            className="w-full h-14 pl-12 pr-12 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none text-lg"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 p-1 rounded-full hover:bg-[var(--accent)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </div>

      {/* Results Panel */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          {/* Search Results */}
          {hasResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Found {searchResults.length} results for "{query}"
                </p>
                <Link href="/" className="text-sm text-[var(--color-aurora-purple)] hover:underline flex items-center gap-1">
                  Sign up to see all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.map((result: SearchResult, i: number) => {
                    const IconComponent = typeIcons[result.type] || FileText;
                    const color = typeColors[result.type] || "#5537a7";

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href="/">
                          <Card className="p-4 hover:shadow-lg transition-all cursor-pointer border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 bg-[var(--card)]">
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${color}20` }}
                              >
                                <span style={{ color }}>
                                  <IconComponent className="w-5 h-5" />
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    className="text-[10px] border-0"
                                    style={{ backgroundColor: `${color}20`, color }}
                                  >
                                    {typeLabels[result.type] || result.type}
                                  </Badge>
                                  <Lock className="w-3 h-3 text-[var(--muted-foreground)]" />
                                </div>
                                <h4 className="font-medium text-[var(--foreground)] line-clamp-1">
                                  {result.previewTitle}
                                </h4>
                                <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1">
                                  {result.previewSnippet}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {typeDescriptions[result.type] || "Community content"}
                              </span>
                              <ArrowRight className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-4"
              >
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  <Sparkles className="w-4 h-4 inline mr-1 text-[var(--color-aurora-yellow)]" />
                  Join Aurora App to see full content and connect with the community
                </p>
                <Link href="/">
                  <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]">
                    Join Aurora App
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          )}

          {/* No Results */}
          {query && debouncedQuery && !hasResults && searchResults !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Search className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3" />
              <p className="text-[var(--foreground)] font-medium">No results found</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Try different keywords or join to explore more
              </p>
              <Link href="/">
                <Button className="mt-4 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white min-h-[44px]">
                  Join Aurora App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Trending Content (Empty State) */}
          {showTrending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">Trending in the community</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trendingContent.map((item: SearchResult, i: number) => {
                  const IconComponent = typeIcons[item.type] || FileText;
                  const color = typeColors[item.type] || "#5537a7";

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href="/">
                        <Card className="p-3 hover:shadow-md transition-all cursor-pointer border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 bg-[var(--card)]">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <span style={{ color }}>
                                <IconComponent className="w-4 h-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge 
                                className="text-[9px] border-0 mb-1"
                                style={{ backgroundColor: `${color}20`, color }}
                              >
                                {typeLabels[item.type] || item.type}
                              </Badge>
                              <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                                {item.previewTitle}
                              </p>
                            </div>
                            <Lock className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <TrendingUp className="w-3 h-3 text-[var(--color-aurora-pink)]" />
                            <ArrowRight className="w-3 h-3 text-[var(--color-aurora-purple)]" />
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <Link href="/">
                <Button variant="outline" className="w-full min-h-[44px] border-[var(--color-aurora-purple)]/30 text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10">
                  Explore more on Aurora App
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
