"use client";

/**
 * Global Header Component
 * 
 * Consistent navigation header across all authenticated pages.
 * Includes: Menu, AI Chat, Create, Emergency, Search, Notifications, Profile
 * 
 * POWERFUL SEARCH: The search is designed to be THE destination for women
 * looking for anything - safety, career, wellness, community, and more.
 */

import { useState, useEffect, useRef } from "react";
import { 
  Menu, Plus, Shield, Search, User, X, Loader2,
  MapPin, Users, Heart, Route, Briefcase, Play, FileText, MessageSquare,
  Sparkles, TrendingUp, Star, Wallet, Video, Zap, BookOpen,
  GraduationCap, Settings, LogOut, Crown, Award, Moon, Sun, Mail, ChevronRight,
  Send, UserPlus
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
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

// Comprehensive search categories for women
const SEARCH_CATEGORIES = {
  safety: {
    label: "Safety & Security",
    icon: Shield,
    color: "text-[var(--color-aurora-mint)]",
    bgColor: "bg-[var(--color-aurora-mint)]/10",
    items: [
      { label: "Safety Map", href: "/map", icon: MapPin, description: "Find safe places near you" },
      { label: "Emergency Help", href: "/emergency", icon: Shield, description: "Quick access to emergency services" },
      { label: "Safe Routes", href: "/routes", icon: Route, description: "Community-verified safe paths" },
      { label: "Report Incident", href: "/report", icon: FileText, description: "Report safety concerns anonymously" },
      { label: "Safety Resources", href: "/resources", icon: BookOpen, description: "Hotlines, shelters & support" },
    ]
  },
  career: {
    label: "Career & Opportunities",
    icon: Briefcase,
    color: "text-[var(--color-aurora-blue)]",
    bgColor: "bg-[var(--color-aurora-blue)]/10",
    items: [
      { label: "Job Opportunities", href: "/opportunities", icon: Briefcase, description: "Women-friendly job listings" },
      { label: "Creator Studio", href: "/creator", icon: Video, description: "Monetize your content" },
      { label: "Mentorship", href: "/circles?filter=mentorship", icon: GraduationCap, description: "Find mentors & guides" },
      { label: "Networking", href: "/circles?filter=professional", icon: Users, description: "Professional women circles" },
    ]
  },
  wellness: {
    label: "Health & Wellness",
    icon: Heart,
    color: "text-[var(--color-aurora-pink)]",
    bgColor: "bg-[var(--color-aurora-pink)]/10",
    items: [
      { label: "Health Tracker", href: "/health", icon: Heart, description: "Track cycle, mood & hydration" },
      { label: "Aurora AI", href: "/assistant", icon: MessageSquare, description: "Your wellness companion" },
      { label: "Mental Health", href: "/resources?category=mental-health", icon: Sparkles, description: "Support & resources" },
      { label: "Fitness Circles", href: "/circles?filter=fitness", icon: Zap, description: "Workout together" },
    ]
  },
  community: {
    label: "Community & Social",
    icon: Users,
    color: "text-[var(--color-aurora-purple)]",
    bgColor: "bg-[var(--color-aurora-purple)]/10",
    items: [
      { label: "Circles", href: "/circles", icon: Users, description: "Join supportive communities" },
      { label: "Reels", href: "/reels", icon: Play, description: "Watch & share stories" },
      { label: "Live Streams", href: "/live", icon: Video, description: "Connect in real-time" },
      { label: "Messages", href: "/messages", icon: MessageSquare, description: "Chat with sisters" },
    ]
  },
  finance: {
    label: "Finance & Money",
    icon: Wallet,
    color: "text-[var(--color-aurora-yellow)]",
    bgColor: "bg-[var(--color-aurora-yellow)]/10",
    items: [
      { label: "Aurora Wallet", href: "/wallet", icon: Wallet, description: "Manage your credits" },
      { label: "Premium", href: "/premium", icon: Star, description: "Unlock premium features" },
      { label: "Financial Tips", href: "/feed?filter=finance", icon: TrendingUp, description: "Money advice from women" },
    ]
  },
};

// Quick search suggestions (trending/popular)
const TRENDING_SEARCHES = [
  "safe walking routes",
  "work from home jobs",
  "mental health support",
  "women entrepreneurs",
  "self defense tips",
  "career advice",
  "wellness tips",
  "networking events",
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { resolvedTheme, setTheme } = useTheme();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const chatPopupRef = useRef<HTMLDivElement>(null);

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
      // Escape to close search or profile menu
      if (e.key === "Escape") {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery("");
        }
        if (showProfileMenu) {
          setShowProfileMenu(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, showProfileMenu]);

  // Close profile menu and chat popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (chatPopupRef.current && !chatPopupRef.current.contains(e.target as Node)) {
        setShowChatPopup(false);
      }
    };
    if (showProfileMenu || showChatPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu, showChatPopup]);

  // Get user data for profile menu
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 bg-[var(--card)] border-b border-[var(--border)] shadow-sm",
        className
      )}>
        <div className="flex items-center justify-between px-3 py-2 max-w-7xl mx-auto">
          {/* Left: Menu + Brand + AI Chat */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={sidebarCollapsed ? "Open menu" : "Close menu"}
            >
              <Menu className="w-5 h-5 text-[var(--foreground)]" />
            </button>
            
            {/* Brand - Show when sidebar is collapsed on desktop */}
            {sidebarCollapsed && (
              <Link href="/feed" className="hidden lg:flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={36} height={36} className="rounded-lg" />
                <span className="font-bold text-[var(--foreground)]">Aurora App</span>
              </Link>
            )}

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

          {/* Right: Emergency + Search + Messages + Notifications + Profile */}
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

            {/* Messages - Reddit-style popup */}
            <div className="relative" ref={chatPopupRef}>
              <button 
                onClick={() => setShowChatPopup(!showChatPopup)}
                className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center relative"
                aria-label="Messages"
              >
                <Mail className="w-5 h-5 text-[var(--muted-foreground)]" />
              </button>

              {/* Chat Popup - Reddit Style */}
              {showChatPopup && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                      <h3 className="font-semibold text-[var(--foreground)]">Chats</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setShowChatPopup(false);
                          router.push("/messages?new=true");
                        }}
                        className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
                        title="Start new chat"
                      >
                        <UserPlus className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                      <button 
                        onClick={() => setShowChatPopup(false)}
                        className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
                      >
                        <X className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                    </div>
                  </div>

                  {/* Chat List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {/* Welcome message when no chats */}
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 flex items-center justify-center mb-4">
                        <MessageSquare className="w-10 h-10 text-[var(--color-aurora-purple)]" />
                      </div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-2">Welcome to chat!</h4>
                      <p className="text-sm text-[var(--muted-foreground)] mb-4">
                        Start a direct or group chat with other Aurora App members.
                      </p>
                      <button
                        onClick={() => {
                          setShowChatPopup(false);
                          router.push("/messages?new=true");
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/90 text-white font-medium transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Start new chat
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-[var(--border)] bg-[var(--accent)]/30">
                    <Link
                      href="/messages"
                      onClick={() => setShowChatPopup(false)}
                      className="flex items-center justify-center gap-2 w-full py-2 text-sm text-[var(--color-aurora-purple)] hover:text-[var(--color-aurora-purple)]/80 font-medium transition-colors"
                    >
                      See all messages
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Notifications */}
            <NotificationsDropdown />
            
            {/* Profile with Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Profile menu"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center ring-2 ring-transparent hover:ring-[var(--color-aurora-purple)]/30 transition-all">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--foreground)] truncate">
                          {user?.name || "Aurora User"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-aurora-yellow)] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {user?.credits || 0} credits
                          </span>
                          {user?.isPremium && (
                            <span className="text-xs text-[var(--color-aurora-yellow)] flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link 
                      href="/profile" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                      <span className="text-[var(--foreground)]">View Profile</span>
                      <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] ml-auto" />
                    </Link>

                    <Link 
                      href="/wallet" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      <Wallet className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                      <span className="text-[var(--foreground)]">My Wallet</span>
                      <span className="text-xs text-[var(--color-aurora-yellow)] ml-auto">{user?.credits || 0}</span>
                    </Link>

                    <Link 
                      href="/premium" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      <Crown className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                      <span className="text-[var(--foreground)]">
                        {user?.isPremium ? "Manage Premium" : "Upgrade to Premium"}
                      </span>
                    </Link>

                    <Link 
                      href="/profile?tab=insights" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      <Award className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                      <span className="text-[var(--foreground)]">Achievements</span>
                    </Link>

                    <div className="border-t border-[var(--border)] my-2" />

                    {/* Aurora AI - Moved from floating button */}
                    <Link 
                      href="/assistant" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-[var(--color-aurora-purple)]/10 hover:to-[var(--color-aurora-pink)]/10 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[var(--foreground)]">Aurora AI Assistant</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-purple)]">
                        Chat
                      </span>
                    </Link>

                    <div className="border-t border-[var(--border)] my-2" />

                    {/* Theme Toggle */}
                    <button 
                      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      {resolvedTheme === "dark" ? (
                        <Sun className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                      ) : (
                        <Moon className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                      )}
                      <span className="text-[var(--foreground)]">
                        {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                      </span>
                    </button>

                    <Link 
                      href="/settings" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent)] transition-colors"
                    >
                      <Settings className="w-5 h-5 text-[var(--muted-foreground)]" />
                      <span className="text-[var(--foreground)]">Settings</span>
                    </Link>

                    <div className="border-t border-[var(--border)] my-2" />

                    <button 
                      onClick={async () => {
                        setShowProfileMenu(false);
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-aurora-salmon)]/10 transition-colors text-[var(--color-aurora-salmon)]"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal - Full Screen Powerful Search */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          onClick={() => {
            setShowSearch(false);
            setSearchQuery("");
          }}
        >
          <div 
            className="bg-[var(--card)] h-full sm:h-auto sm:max-h-[85vh] sm:mt-16 sm:mx-auto sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--color-aurora-purple)]/5 to-[var(--color-aurora-pink)]/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-aurora-purple)]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search anything for women..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--background)] border-2 border-[var(--color-aurora-purple)]/20 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--color-aurora-purple)]/50 text-lg font-medium"
                  />
                </div>
                <button 
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="p-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-[var(--foreground)]" />
                </button>
              </div>
              
              {/* Trending Searches - Quick chips */}
              {searchQuery.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Trending:
                  </span>
                  {TRENDING_SEARCHES.slice(0, 5).map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--color-aurora-purple)]/10 text-xs text-[var(--foreground)] transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {debouncedQuery.length >= 2 && searchResults === undefined && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center mb-3">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <span className="text-[var(--muted-foreground)]">Searching Aurora App...</span>
                </div>
              )}

              {/* Content Search Results */}
              {searchResults && searchResults.results.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Found {searchResults.total} results
                    </p>
                    <span className="text-xs text-[var(--muted-foreground)]">for "{debouncedQuery}"</span>
                  </div>
                  <div className="space-y-2">
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
                          className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-[var(--accent)] transition-all text-left group border border-transparent hover:border-[var(--color-aurora-purple)]/20"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 flex items-center justify-center group-hover:from-[var(--color-aurora-purple)]/20 group-hover:to-[var(--color-aurora-pink)]/20 transition-colors flex-shrink-0">
                            <Icon className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[var(--foreground)] font-semibold truncate">{result.title}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] capitalize flex-shrink-0">
                                {result.type}
                              </span>
                            </div>
                            {result.description && (
                              <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                                {result.description}
                              </p>
                            )}
                            {result.author && (
                              <p className="text-xs text-[var(--color-aurora-pink)] mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> {result.author.name}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No content results */}
              {searchResults && searchResults.results.length === 0 && debouncedQuery.length >= 2 && (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-[var(--foreground)] font-medium mb-1">No results for "{debouncedQuery}"</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Try different keywords or browse categories below</p>
                </div>
              )}

              {/* Browse Categories - Show when no query */}
              {searchQuery.length < 2 && (
                <div className="p-4 space-y-6">
                  <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    Browse by Category
                  </p>
                  
                  {Object.entries(SEARCH_CATEGORIES).map(([key, category]) => {
                    const CategoryIcon = category.icon;
                    return (
                      <div key={key} className="space-y-2">
                        <div className={cn("flex items-center gap-2 px-2", category.color)}>
                          <CategoryIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{category.label}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {category.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleSearchSelect(item.href)}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-xl transition-all text-left group border border-transparent",
                                  "hover:border-[var(--border)] hover:bg-[var(--accent)]",
                                  category.bgColor
                                )}
                              >
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                  "bg-white/50 dark:bg-white/10"
                                )}>
                                  <ItemIcon className={cn("w-5 h-5", category.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[var(--foreground)] font-medium text-sm block">{item.label}</span>
                                  <span className="text-xs text-[var(--muted-foreground)] line-clamp-1">{item.description}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/50">
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Aurora App - Your search destination</span>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] font-mono">⌘K</kbd>
                  <span>to search</span>
                  <kbd className="px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] font-mono">Esc</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
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
