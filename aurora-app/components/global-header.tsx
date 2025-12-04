"use client";

/**
 * Global Header Component
 * 
 * Consistent navigation header across all authenticated pages.
 * Includes: Menu, AI Chat, Create, Emergency, Search, Notifications, Profile
 */

import { useState, useEffect, useRef } from "react";
import { 
  Menu, Plus, Shield, Search, User, X, Loader2,
  MapPin, Users, Heart, Route, Briefcase, Play, FileText, MessageSquare
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { AIChatCompanion } from "@/components/ai-chat-companion";
import { CreateOptionsModal } from "@/components/create-options-modal";
import { PostCreateDialog } from "@/components/post-create-dialog";
import { PollCreateDialog } from "@/components/poll-create-dialog";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface GlobalHeaderProps {
  userId?: Id<"users"> | null;
  showCreateButton?: boolean;
  title?: string;
  className?: string;
  sidebarCollapsed?: boolean;
}

// Search suggestions with icons and routes
const SEARCH_SUGGESTIONS = [
  { label: "Safety Map", href: "/map", icon: MapPin, category: "Safety" },
  { label: "Emergency", href: "/emergency", icon: Shield, category: "Safety" },
  { label: "Safety Resources", href: "/resources", icon: Shield, category: "Safety" },
  { label: "Report Incident", href: "/report", icon: FileText, category: "Safety" },
  { label: "Routes", href: "/routes", icon: Route, category: "Navigation" },
  { label: "Circles", href: "/circles", icon: Users, category: "Community" },
  { label: "Reels", href: "/reels", icon: Play, category: "Community" },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase, category: "Career" },
  { label: "Health Tracker", href: "/health", icon: Heart, category: "Wellness" },
  { label: "AI Companion", href: "/assistant", icon: MessageSquare, category: "Wellness" },
];

export function GlobalHeader({ 
  userId, 
  showCreateButton = true,
  title,
  className,
  sidebarCollapsed = false
}: GlobalHeaderProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real search results from Convex
  const searchResults = useQuery(
    api.search.globalSearch,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: 15 } : "skip"
  );

  // Filter navigation suggestions based on search query
  const filteredSuggestions = searchQuery.trim() 
    ? SEARCH_SUGGESTIONS.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_SUGGESTIONS;

  // Group suggestions by category
  const groupedSuggestions = filteredSuggestions.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof SEARCH_SUGGESTIONS>);

  // Handle search navigation
  const handleSearchSelect = (href: string) => {
    setShowSearch(false);
    setSearchQuery("");
    router.push(href);
  };

  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case "post": return FileText;
      case "route": return Route;
      case "reel": return Play;
      case "opportunity": return Briefcase;
      case "resource": return Shield;
      case "circle": return Users;
      default: return FileText;
    }
  };

  // Get href for result
  const getResultHref = (type: string, id: string) => {
    switch (type) {
      case "post": return `/feed?post=${id}`;
      case "route": return `/routes/${id}`;
      case "reel": return `/reels/${id}`;
      case "opportunity": return `/opportunities?id=${id}`;
      case "resource": return `/resources`;
      case "circle": return `/circles/${id}`;
      default: return `/feed`;
    }
  };

  // Focus input when search opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape to close search
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 bg-[var(--card)] border-b border-[var(--border)] shadow-sm",
        className
      )}>
        <div className="flex items-center justify-between px-3 py-2 max-w-7xl mx-auto">
          {/* Left: Menu + AI Chat (Aurora Logo) */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            
            {/* AI Chat - Aurora Logo */}
            <button 
              onClick={() => setShowAIChat(true)}
              className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] p-0.5 hover:scale-105 transition-transform"
              aria-label="Aurora AI Chat"
            >
              <div className="w-full h-full rounded-[10px] bg-[var(--card)] flex items-center justify-center">
                <Image src="/Au_Logo_1.png" alt="Aurora AI" width={26} height={26} className="object-contain" />
              </div>
            </button>

            {/* Page Title (optional) */}
            {title && (
              <h1 className="ml-2 text-lg font-semibold text-[var(--foreground)] hidden sm:block">
                {title}
              </h1>
            )}
          </div>

          {/* Center: Create Button (optional) */}
          {showCreateButton && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 transition-all shadow-md flex items-center gap-1.5 min-h-[44px]"
              aria-label="Create"
            >
              <Plus className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium hidden xs:inline">Create</span>
            </button>
          )}

          {/* Right: Emergency + Search + Notifications + Profile */}
          <div className="flex items-center gap-1">
            {/* Emergency - Orange EXCLUSIVE */}
            <Link 
              href="/emergency"
              className="p-2 rounded-lg bg-[var(--color-aurora-orange)] hover:bg-[var(--color-aurora-orange)]/90 transition-colors shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Emergency"
            >
              <Shield className="w-5 h-5 text-white" />
            </Link>

            {/* Search */}
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="w-5 h-5 text-[var(--muted-foreground)]" />
            </button>
            
            {/* Notifications */}
            <NotificationsDropdown />
            
            {/* Profile */}
            <Link href="/profile" className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Modal - Full Screen on Mobile */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowSearch(false);
            setSearchQuery("");
          }}
        >
          <div 
            className="bg-[var(--card)] border-b border-[var(--border)] shadow-xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search Aurora App..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-purple)]/50 text-base"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="p-3 rounded-xl hover:bg-[var(--accent)] transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-[var(--muted-foreground)]" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Loading state */}
                {debouncedQuery.length >= 2 && searchResults === undefined && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[var(--color-aurora-purple)] animate-spin" />
                    <span className="ml-2 text-[var(--muted-foreground)]">Searching...</span>
                  </div>
                )}

                {/* Content Search Results */}
                {searchResults && searchResults.results.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider mb-2 px-2">
                      Content ({searchResults.total} results)
                    </p>
                    <div className="space-y-1">
                      {searchResults.results.map((result: {
                        type: string;
                        id: string;
                        title: string;
                        description?: string;
                        author?: { name: string; profileImage?: string };
                      }) => {
                        const Icon = getResultIcon(result.type);
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSearchSelect(getResultHref(result.type, result.id))}
                            className="w-full flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-[var(--accent)] transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-purple)]/10 flex items-center justify-center group-hover:bg-[var(--color-aurora-purple)]/20 transition-colors flex-shrink-0">
                              <Icon className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--foreground)] font-medium truncate">{result.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)] capitalize flex-shrink-0">
                                  {result.type}
                                </span>
                              </div>
                              {result.description && (
                                <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                                  {result.description}
                                </p>
                              )}
                              {result.author && (
                                <p className="text-xs text-[var(--color-aurora-purple)] mt-1">
                                  by {result.author.name}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No content results but has query */}
                {searchResults && searchResults.results.length === 0 && debouncedQuery.length >= 2 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-[var(--muted-foreground)]">No content found for "{debouncedQuery}"</p>
                  </div>
                )}

                {/* Navigation Suggestions - Show when no query or as quick access */}
                {(searchQuery.length < 2 || filteredSuggestions.length > 0) && (
                  <>
                    <div className="border-t border-[var(--border)] pt-4">
                      <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider mb-2 px-2">
                        {searchQuery.length >= 2 ? "Quick Navigation" : "Browse"}
                      </p>
                    </div>
                    {Object.entries(groupedSuggestions).map(([category, items]) => (
                      <div key={category}>
                        <p className="text-xs text-[var(--muted-foreground)] font-medium mb-2 px-2">
                          {category}
                        </p>
                        <div className="space-y-1">
                          {items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleSearchSelect(item.href)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[var(--accent)] transition-colors text-left group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-aurora-purple)]/10 flex items-center justify-center group-hover:bg-[var(--color-aurora-purple)]/20 transition-colors">
                                  <Icon className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                                </div>
                                <span className="text-[var(--foreground)] text-sm">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Keyboard shortcut hint */}
                <div className="text-center pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--foreground)] font-mono text-xs">Esc</kbd> to close
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Companion Modal */}
      {showAIChat && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" 
          onClick={() => setShowAIChat(false)}
        >
          <div className="w-full sm:max-w-lg sm:p-4" onClick={(e) => e.stopPropagation()}>
            <AIChatCompanion 
              className="h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-2xl" 
              onClose={() => setShowAIChat(false)}
            />
          </div>
        </div>
      )}

      {/* Create Modals */}
      <CreateOptionsModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSelectPost={() => setShowPostDialog(true)}
        onSelectPoll={() => setShowPollDialog(true)}
      />
      {userId && (
        <>
          <PostCreateDialog open={showPostDialog} onOpenChange={setShowPostDialog} userId={userId} />
          <PollCreateDialog open={showPollDialog} onOpenChange={setShowPollDialog} userId={userId} />
        </>
      )}
    </>
  );
}
