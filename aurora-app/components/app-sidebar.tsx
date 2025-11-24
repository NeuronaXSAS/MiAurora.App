"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  MapPin,
  Briefcase,
  MessageSquare,
  User,
  Sparkles,
  LogOut,
  Menu,
  X,
  Route,
  Settings,
  Mail,
  Coins,
  Play,
  Plus,
  FileText,
  Shield,
  Database,
  Heart,
  Users,
  ChevronDown,
  ChevronRight,
  Video,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { CreateOptionsModal } from "@/components/create-options-modal";
import { PostCreateDialog } from "@/components/post-create-dialog";
import { PollCreateDialog } from "@/components/poll-create-dialog";

export function AppSidebar() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    health: true,
    mobility: true,
    social: true,
  });

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log("🔍 AppSidebar: Fetching user ID...");
        const response = await fetch("/api/auth/me");
        
        if (!response.ok) {
          console.error("❌ AppSidebar: Auth API failed with status:", response.status);
          return;
        }
        
        const data = await response.json();
        console.log("📦 AppSidebar: Auth API response:", data);
        
        if (data.userId) {
          console.log("✅ AppSidebar: User ID found:", data.userId);
          setUserId(data.userId as Id<"users">);
        } else {
          console.warn("⚠️ AppSidebar: No userId in response, user may not be authenticated");
        }
      } catch (error) {
        console.error("❌ AppSidebar: Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Fetch user data - only if we have a valid userId
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Handle query errors - if user doesn't exist, force re-authentication
  useEffect(() => {
    if (userId && user === null) {
      console.error("❌ AppSidebar: User not found in Convex database");
      console.error("User ID:", userId);
      console.error("Solution: Logging out and re-authenticating...");
      
      // Force logout and redirect to login
      setTimeout(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/?error=user_not_found";
      }, 2000);
    }
  }, [userId, user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  // Trinity Architecture Navigation Structure
  const trinityPillars = [
    {
      id: "health",
      name: "HEALTH & SOUL",
      subtitle: "The Sanctuary",
      icon: Heart,
      color: "text-aurora-pink",
      bgColor: "bg-aurora-pink/10",
      borderColor: "border-aurora-pink/30",
      items: [
        { href: "/profile", icon: User, label: "Personal Dashboard", description: "Your wellness hub" },
        { href: "/assistant", icon: MessageSquare, label: "AI Therapist", description: "Digital companion" },
        { href: "/settings", icon: Settings, label: "Privacy & Settings", description: "Control your data" },
      ],
    },
    {
      id: "mobility",
      name: "MOBILITY & SAFETY",
      subtitle: "The Guardian",
      icon: Shield,
      color: "text-aurora-blue",
      bgColor: "bg-aurora-blue/10",
      borderColor: "border-aurora-blue/30",
      items: [
        { href: "/map", icon: MapPin, label: "Safety Map", description: "Navigate safely" },
        { href: "/routes", icon: Route, label: "Aurora Routes", description: "Track & share routes" },
      ],
    },
    {
      id: "social",
      name: "SOCIAL & OPPORTUNITY",
      subtitle: "The Village",
      icon: Users,
      color: "text-aurora-lavender",
      bgColor: "bg-aurora-lavender/10",
      borderColor: "border-aurora-lavender/30",
      items: [
        { href: "/feed", icon: Home, label: "Community Feed", description: "Your personalized feed" },
        { href: "/reels", icon: Play, label: "Aurora Reels", description: "Safety videos" },
        { href: "/live", icon: Video, label: "Aurora Live", description: "Livestreaming" },
        { href: "/opportunities", icon: Briefcase, label: "Opportunities", description: "Jobs & resources" },
        { href: "/messages", icon: Mail, label: "Messages", description: "Direct messages" },
      ],
    },
  ];

  const togglePillar = (pillarId: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [pillarId]: !prev[pillarId],
    }));
  };

  const getActivePillar = () => {
    for (const pillar of trinityPillars) {
      for (const item of pillar.items) {
        if (pathname === item.href || pathname.startsWith(item.href + "/")) {
          return pillar.id;
        }
      }
    }
    return null;
  };

  const activePillar = getActivePillar();

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg text-white">Aurora</h1>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="text-white hover:bg-white/10"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsMobileMenuOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          flex flex-col h-screen w-64 backdrop-blur-xl bg-slate-950/90 border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:block p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Link href="/feed" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Aurora App</h1>
                <p className="text-xs text-gray-400">For women to thrive</p>
              </div>
            </Link>
            <NotificationsDropdown />
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="border-2 border-purple-500/50">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                  {(user.name && user.name !== 'null' ? user.name : 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-white">
                  {user.name && user.name !== 'null' ? user.name : 'User'}
                </p>
                <p className="text-xs text-gray-400">Trust: {user.trustScore}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-2 mb-3">
              <span className="text-sm font-medium text-purple-200">Credits</span>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 shadow-lg shadow-purple-500/50">{user.credits}</Badge>
            </div>
            {/* HERO Create Button */}
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 text-white font-semibold"
              data-create-button
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        )}

        {/* Navigation - Trinity Architecture */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {trinityPillars.map((pillar) => {
            const isPillarActive = activePillar === pillar.id;
            const isExpanded = expandedPillars[pillar.id];
            const PillarIcon = pillar.icon;

            return (
              <div key={pillar.id} className="space-y-1">
                {/* Pillar Header */}
                <button
                  onClick={() => togglePillar(pillar.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    isPillarActive
                      ? `${pillar.bgColor} ${pillar.borderColor} border shadow-lg`
                      : "hover:bg-white/5"
                  }`}
                >
                  <PillarIcon className={`w-5 h-5 ${isPillarActive ? pillar.color : "text-slate-400"}`} />
                  <div className="flex-1 text-left">
                    <p className={`font-bold text-xs tracking-wide ${isPillarActive ? "text-white" : "text-slate-400"}`}>
                      {pillar.name}
                    </p>
                    <p className={`text-[10px] ${isPillarActive ? pillar.color : "text-slate-500"}`}>
                      {pillar.subtitle}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className={`w-4 h-4 ${isPillarActive ? pillar.color : "text-slate-400"}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isPillarActive ? pillar.color : "text-slate-400"}`} />
                  )}
                </button>

                {/* Pillar Items */}
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l-2 border-white/5 pl-2">
                    {pillar.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                              isActive
                                ? `${pillar.bgColor} ${pillar.color} shadow-md`
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className={`text-xs ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Additional Links (not in pillars) */}
          <div className="pt-3 border-t border-white/10">
            <Link href="/intelligence" onClick={() => setIsMobileMenuOpen(false)}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  pathname === "/intelligence"
                    ? "bg-white/10 text-white shadow-lg shadow-purple-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Database className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Intelligence</p>
                  <p className="text-xs text-slate-500">B2B data platform</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/credits" onClick={() => setIsMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
            >
              <Coins className="w-5 h-5 mr-3" />
              Credit Center
            </Button>
          </Link>
          <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Button>
          </Link>
          
          {/* Legal Links */}
          <div className="pt-2 border-t border-white/10">
            <Link href="/legal/terms" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-500 hover:text-gray-300 hover:bg-white/5 text-xs"
              >
                <FileText className="w-4 h-4 mr-3" />
                Terms of Service
              </Button>
            </Link>
            <Link href="/legal/privacy" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-500 hover:text-gray-300 hover:bg-white/5 text-xs"
              >
                <Shield className="w-4 h-4 mr-3" />
                Privacy Policy
              </Button>
            </Link>
          </div>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
            onClick={handleLogout}
            aria-label="Logout from your account"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Create Options Modal */}
      <CreateOptionsModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSelectPost={() => setShowPostDialog(true)}
        onSelectPoll={() => setShowPollDialog(true)}
      />

      {/* Post Create Dialog */}
      {userId && (
        <>
          <PostCreateDialog
            open={showPostDialog}
            onOpenChange={setShowPostDialog}
            userId={userId}
          />
          <PollCreateDialog
            open={showPollDialog}
            onOpenChange={setShowPollDialog}
            userId={userId}
          />
        </>
      )}
    </>
  );
}
