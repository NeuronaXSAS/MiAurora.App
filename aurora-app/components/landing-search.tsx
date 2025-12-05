"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, X, FileText, Route, Users, Briefcase, 
  Shield, Lock, ArrowRight, Sparkles, TrendingUp,
  MapPin, Heart, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function LandingSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search results
  const searchResults = useQuery(
    api.publicSearch.publicSearch,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 8 } : "skip"
  );

  // Trending content for empty state
  const trending = useQuery(api.publicSearch.getTrendingPreview);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const showResults = debouncedQuery.length >= 2 && searchResults?.results;
  const showTrending = !showResults && trending && trending.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${isFocused ? "scale-[1.02]" : ""}`}>
        <div className={`
          relative flex items-center gap-3 
          bg-white/80 backdrop-blur-xl 
          border-2 rounded-2xl px-5 py-4
          shadow-lg transition-all duration-300
          ${isFocused 
            ? "border-[#5537a7] shadow-xl shadow-[#5537a7]/10" 
            : "border-[#3d0d73]/10 hover:border-[#5537a7]/30"
          }
        `}>
          <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-[#5537a7]" : "text-[#3d0d73]/40"}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search safety tips, routes, communities, jobs..."
            className="flex-1 bg-transparent text-[#3d0d73] placeholder:text-[#3d0d73]/40 outline-none text-base"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="p-1 hover:bg-[#3d0d73]/5 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-[#3d0d73]/40" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#3d0d73]/5 rounded-lg text-xs text-[#3d0d73]/50 font-mono">
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

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (showResults || showTrending) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-[#3d0d73]/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Search Results */}
            {showResults && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2 mb-1">
                  <span className="text-xs font-medium text-[#3d0d73]/50 uppercase tracking-wider">
                    {searchResults.total} results found
                  </span>
                  {searchResults.hasMore && (
                    <span className="text-xs text-[#5537a7]">
                      + more inside
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {searchResults.results.map((result, i) => {
                    const Icon = typeIcons[result.type];
                    const color = typeColors[result.type];
                    
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href="/api/auth/login">
                          <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#5537a7]/5 transition-all cursor-pointer">
                            {/* Type Icon */}
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color }} />
                            </div>

                            {/* Content Preview */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                                  {typeLabels[result.type]}
                                </span>
                                {result.stats && (
                                  <span className="text-xs text-[#3d0d73]/40">
                                    {result.stats.value} {result.stats.label}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-[#3d0d73] truncate group-hover:text-[#5537a7] transition-colors">
                                {result.previewTitle}
                              </h4>
                              <p className="text-sm text-[#3d0d73]/60 truncate">
                                {result.previewSnippet}
                              </p>
                            </div>

                            {/* Lock indicator */}
                            <div className="flex items-center gap-1 text-[#3d0d73]/30 group-hover:text-[#5537a7] transition-colors">
                              <Lock className="w-4 h-4" />
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* CTA to sign up */}
                <div className="mt-3 p-4 bg-gradient-to-r from-[#5537a7]/5 to-[#f29de5]/5 rounded-xl border border-[#5537a7]/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#5537a7] to-[#f29de5] rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#3d0d73] text-sm">
                          Sign up to see full content
                        </p>
                        <p className="text-xs text-[#3d0d73]/60">
                          Join 10,000+ women • Free forever
                        </p>
                      </div>
                    </div>
                    <Link href="/api/auth/login?provider=GoogleOAuth">
                      <Button size="sm" className="bg-[#5537a7] hover:bg-[#3d0d73] text-white rounded-xl min-h-[40px] px-4 font-semibold">
                        Join Free
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Trending Content (Empty State) */}
            {showTrending && (
              <div className="p-4">
                <div className="flex items-center gap-2 px-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#5537a7]" />
                  <span className="text-sm font-semibold text-[#3d0d73]">
                    Trending on Aurora App
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trending.map((item, i) => {
                    const Icon = typeIcons[item.type];
                    const color = typeColors[item.type];
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href="/api/auth/login">
                          <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-[#5537a7]/5 transition-all cursor-pointer border border-transparent hover:border-[#5537a7]/10">
                            <div 
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-[#3d0d73] text-sm truncate group-hover:text-[#5537a7]">
                                {item.previewTitle}
                              </h4>
                              <p className="text-xs text-[#3d0d73]/50 truncate">
                                {item.previewSnippet}
                              </p>
                            </div>
                            <Lock className="w-3.5 h-3.5 text-[#3d0d73]/20 group-hover:text-[#5537a7] transition-colors" />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick search suggestions */}
                <div className="mt-4 pt-4 border-t border-[#3d0d73]/5">
                  <p className="text-xs text-[#3d0d73]/40 mb-2 px-2">Try searching for:</p>
                  <div className="flex flex-wrap gap-2">
                    {["safety tips", "remote jobs", "walking routes", "support groups", "career advice"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => { setQuery(suggestion); inputRef.current?.focus(); }}
                        className="px-3 py-1.5 bg-[#3d0d73]/5 hover:bg-[#5537a7]/10 text-[#3d0d73]/70 hover:text-[#5537a7] text-xs rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
