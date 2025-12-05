"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, FileText, Route, Users, Briefcase, 
  Shield, Lock, ArrowRight, Sparkles, TrendingUp,
  Eye, MessageCircle, Star, MapPin, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const typeIcons = {
  post: FileText,
  route: Route,
  circle: Users,
  opportunity: Briefcase,
  resource: Shield,
};

const typeColors = {
  post: "#5537a7",
  route: "#22c55e",
  circle: "#f29de5",
  opportunity: "#e5e093",
  resource: "#d6f4ec",
};

const typeLabels = {
  post: "Community Post",
  route: "Safe Route",
  circle: "Support Circle",
  opportunity: "Career Opportunity",
  resource: "Safety Resource",
};

const typeDescriptions = {
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
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.length >= 2) {
        setHasSearched(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search results
  const searchResults = useQuery(
    api.publicSearch.publicSearch,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 12 } : "skip"
  );

  // Trending content for empty state
  const trending = useQuery(api.publicSearch.getTrendingPreview);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const showResults = debouncedQuery.length >= 2 && searchResults?.results && searchResults.results.length > 0;
  const showNoResults = debouncedQuery.length >= 2 && searchResults?.results && searchResults.results.length === 0;
  const showTrending = !hasSearched && trending && trending.length > 0;

  return (
    <div className="w-full">
      {/* Search Input - Prominent and centered */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className={`relative transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}>
          <div className={`
            relative flex items-center gap-4 
            bg-white backdrop-blur-xl 
            border-2 rounded-2xl px-6 py-5
            shadow-xl transition-all duration-300
            ${isFocused 
              ? "border-[#5537a7] shadow-2xl shadow-[#5537a7]/15" 
              : "border-[#3d0d73]/10 hover:border-[#5537a7]/30 hover:shadow-xl"
            }
          `}>
            <Search className={`w-6 h-6 transition-colors flex-shrink-0 ${isFocused ? "text-[#5537a7]" : "text-[#3d0d73]/40"}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Search safety tips, career opportunities, support circles..."
              className="flex-1 bg-transparent text-[#3d0d73] placeholder:text-[#3d0d73]/40 outline-none text-lg"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setHasSearched(false); inputRef.current?.focus(); }}
                className="p-2 hover:bg-[#3d0d73]/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#3d0d73]/40" />
              </button>
            )}
            <kbd className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-[#3d0d73]/5 rounded-lg text-sm text-[#3d0d73]/50 font-mono">
              /
            </kbd>
          </div>

          {/* Glow effect */}
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -inset-1 bg-gradient-to-r from-[#5537a7]/20 via-[#f29de5]/20 to-[#5537a7]/20 rounded-2xl blur-xl -z-10"
            />
          )}
        </div>

        {/* Quick search suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {["safety tips", "remote jobs", "walking routes", "support groups", "career advice", "wellness"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => { setQuery(suggestion); inputRef.current?.focus(); }}
              className="px-4 py-2 bg-white/60 hover:bg-white border border-[#3d0d73]/10 hover:border-[#5537a7]/30 text-[#3d0d73]/70 hover:text-[#5537a7] text-sm rounded-full transition-all hover:shadow-md"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section - Inline, not dropdown */}
      <AnimatePresence mode="wait">
        {/* Search Results Grid */}
        {showResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#5537a7]" />
                <span className="text-sm font-medium text-[#3d0d73]">
                  {searchResults.total} results for "{debouncedQuery}"
                </span>
              </div>
              {searchResults.hasMore && (
                <Link href="/api/auth/login">
                  <span className="text-sm text-[#5537a7] hover:underline cursor-pointer">
                    Sign up to see all results →
                  </span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.results.map((result, i) => {
                const Icon = typeIcons[result.type];
                const color = typeColors[result.type];
                
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href="/api/auth/login">
                      <Card className="group h-full bg-white hover:bg-[#5537a7]/5 border border-[#3d0d73]/10 hover:border-[#5537a7]/30 rounded-2xl p-5 transition-all cursor-pointer hover:shadow-lg">
                        {/* Header with type badge */}
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${color}15`, color }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {typeLabels[result.type]}
                          </div>
                          <Lock className="w-4 h-4 text-[#3d0d73]/20 group-hover:text-[#5537a7] transition-colors" />
                        </div>

                        {/* Content */}
                        <h4 className="font-semibold text-[#3d0d73] mb-2 group-hover:text-[#5537a7] transition-colors line-clamp-2">
                          {result.previewTitle}
                        </h4>
                        <p className="text-sm text-[#3d0d73]/60 mb-3 line-clamp-2">
                          {result.previewSnippet}
                        </p>

                        {/* Footer with stats */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#3d0d73]/5">
                          {result.stats ? (
                            <span className="text-xs text-[#3d0d73]/50">
                              {result.stats.value} {result.stats.label}
                            </span>
                          ) : (
                            <span className="text-xs text-[#3d0d73]/50">
                              {typeDescriptions[result.type]}
                            </span>
                          )}
                          <span className="text-xs text-[#5537a7] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 p-6 bg-gradient-to-r from-[#5537a7] to-[#3d0d73] rounded-2xl text-white"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Unlock Full Access</h3>
                    <p className="text-white/80 text-sm">
                      Sign up free to see complete content, join discussions, and connect with 10,000+ women
                    </p>
                  </div>
                </div>
                <Link href="/api/auth/login?provider=GoogleOAuth">
                  <Button size="lg" className="bg-white text-[#5537a7] hover:bg-white/90 rounded-xl min-h-[48px] px-6 font-semibold whitespace-nowrap">
                    Join Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* No Results */}
        {showNoResults && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto text-center py-8"
          >
            <div className="w-16 h-16 bg-[#3d0d73]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#3d0d73]/30" />
            </div>
            <h3 className="text-lg font-semibold text-[#3d0d73] mb-2">
              No results found for "{debouncedQuery}"
            </h3>
            <p className="text-[#3d0d73]/60 mb-6">
              Try different keywords or sign up to access our full community content
            </p>
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl min-h-[48px] px-6">
                Join Aurora App Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Trending Content - Before search */}
        {showTrending && (
          <motion.div
            key="trending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              <TrendingUp className="w-5 h-5 text-[#5537a7]" />
              <span className="text-sm font-semibold text-[#3d0d73]">
                Trending on Aurora App
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((item, i) => {
                const Icon = typeIcons[item.type];
                const color = typeColors[item.type];
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link href="/api/auth/login">
                      <Card className="group h-full bg-white/80 hover:bg-white border border-[#3d0d73]/10 hover:border-[#5537a7]/30 rounded-2xl p-5 transition-all cursor-pointer hover:shadow-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${color}15`, color }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {typeLabels[item.type]}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#3d0d73]/40">
                            <TrendingUp className="w-3 h-3" />
                            Trending
                          </div>
                        </div>

                        <h4 className="font-semibold text-[#3d0d73] mb-2 group-hover:text-[#5537a7] transition-colors">
                          {item.previewTitle}
                        </h4>
                        <p className="text-sm text-[#3d0d73]/60 mb-3 line-clamp-2">
                          {item.previewSnippet}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-[#3d0d73]/5">
                          <div className="flex items-center gap-1 text-xs text-[#3d0d73]/40">
                            <Lock className="w-3 h-3" />
                            Sign up to view
                          </div>
                          <span className="text-xs text-[#5537a7] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Unlock <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Subtle CTA */}
            <div className="text-center mt-6">
              <p className="text-sm text-[#3d0d73]/50 mb-3">
                🔒 Sign up free to unlock full content and join the conversation
              </p>
              <Link href="/api/auth/login?provider=GoogleOAuth">
                <Button variant="outline" className="border-[#5537a7]/30 text-[#5537a7] hover:bg-[#5537a7]/5 rounded-xl">
                  Join 10,000+ Women
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
