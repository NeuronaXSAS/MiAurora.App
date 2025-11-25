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
  User,
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
  MessageSquare,
  Bell,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { CreateOptionsModal } from "@/components/create-options-modal";
import { PostCreateDialog } from "@/components/post-create-dialog";
import { PollCreateDialog } from "@/components/poll-create-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ collapsed = false, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    safety: true,
    social: true,
    wellness: false,
  });

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const data = await response.json();
        if (data.userId) setUserId(data.userId as Id<"users">);
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  useEffect(() => {
    if (userId && user === null) {
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

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");


  // Navigation items organized by category
  const mainNav = [
    { href: "/feed", icon: Home, label: "Feed", badge: null },
    { href: "/map", icon: MapPin, label: "Safety Map", badge: null },
    { href: "/routes", icon: Route, label: "Routes", badge: null },
  ];

  const safetyNav = [
    { href: "/emergency", icon: AlertTriangle, label: "Emergency", color: "text-[var(--color-aurora-orange)]" },
    { href: "/resources", icon: Shield, label: "Resources", color: null },
    { href: "/report", icon: FileText, label: "Report", color: null },
  ];

  const socialNav = [
    { href: "/circles", icon: Users, label: "Circles", badge: null },
    { href: "/reels", icon: Play, label: "Reels", badge: null },
    { href: "/live", icon: Video, label: "Live", badge: "NEW" },
    { href: "/opportunities", icon: Briefcase, label: "Opportunities", badge: null },
    { href: "/messages", icon: Mail, label: "Messages", badge: null },
  ];

  const wellnessNav = [
    { href: "/health", icon: Heart, label: "Health Tracker", color: "text-[var(--color-aurora-pink)]" },
    { href: "/assistant", icon: MessageSquare, label: "AI Companion", color: null },
  ];

  const NavItem = ({ href, icon: Icon, label, badge, color, compact = false }: {
    href: string;
    icon: React.ElementType;
    label: string;
    badge?: string | null;
    color?: string | null;
    compact?: boolean;
  }) => (
    <Link href={href} onClick={() => setMobileOpen(false)}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
        isActive(href) 
          ? "bg-[var(--color-aurora-purple)]/20 text-[var(--foreground)]" 
          : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]",
        compact && "justify-center px-2"
      )}>
        <Icon className={cn("w-5 h-5 flex-shrink-0", color, isActive(href) && "text-[var(--color-aurora-purple)]")} />
        {!compact && (
          <>
            <span className="flex-1 text-sm font-medium truncate">{label}</span>
            {badge && (
              <Badge className="bg-[var(--color-aurora-pink)] text-white text-[10px] px-1.5 py-0">
                {badge}
              </Badge>
            )}
          </>
        )}
      </div>
    </Link>
  );

  const SectionHeader = ({ id, label, icon: Icon, expanded }: {
    id: string;
    label: string;
    icon: React.ElementType;
    expanded: boolean;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );

  const sidebarContent = (
    <>
      {/* Logo & Brand */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-3">
            <img src="/Au_Logo_1.png" alt="Aurora App" className="w-10 h-10 rounded-xl" />
            <div className="hidden sm:block">
              <h1 className="font-bold text-[var(--foreground)]">Aurora App</h1>
              <p className="text-xs text-[var(--muted-foreground)]">For women to thrive</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-[var(--color-aurora-purple)]/50">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
                {(user.name && user.name !== "null" ? user.name : "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-[var(--foreground)]">
                {user.name && user.name !== "null" ? user.name : "User"}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[var(--color-aurora-yellow)]/50 text-[var(--color-aurora-yellow)]">
                  <Coins className="w-3 h-3 mr-1" />
                  {user.credits}
                </Badge>
                <span className="text-xs text-[var(--muted-foreground)]">Trust: {user.trustScore}</span>
              </div>
            </div>
          </div>
          
          {/* Create Button */}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 text-white font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Main Navigation */}
        {mainNav.map(item => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Safety Section */}
        <div className="pt-3">
          <SectionHeader id="safety" label="Safety" icon={Shield} expanded={expandedSections.safety} />
          {expandedSections.safety && (
            <div className="space-y-1 mt-1">
              {safetyNav.map(item => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          )}
        </div>

        {/* Social Section */}
        <div className="pt-2">
          <SectionHeader id="social" label="Community" icon={Users} expanded={expandedSections.social} />
          {expandedSections.social && (
            <div className="space-y-1 mt-1">
              {socialNav.map(item => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          )}
        </div>

        {/* Wellness Section */}
        <div className="pt-2">
          <SectionHeader id="wellness" label="Wellness" icon={Heart} expanded={expandedSections.wellness} />
          {expandedSections.wellness && (
            <div className="space-y-1 mt-1">
              {wellnessNav.map(item => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          )}
        </div>

        {/* Intelligence */}
        <div className="pt-3 border-t border-[var(--border)] mt-3">
          <NavItem href="/intelligence" icon={Database} label="Intelligence" badge="B2B" />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-[var(--muted-foreground)]">Theme</span>
          <ThemeToggle />
        </div>
        
        <NavItem href="/credits" icon={Coins} label="Credits" />
        <NavItem href="/settings" icon={Settings} label="Settings" />
        <NavItem href="/profile" icon={User} label="Profile" />
        
        <div className="pt-2 border-t border-[var(--border)]">
          <Link href="/legal/terms" className="block px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="block px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Privacy Policy
          </Link>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed top left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[var(--foreground)]" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-screen bg-[var(--card)] border-r border-[var(--border)]",
          "w-72 lg:w-64 xl:w-72",
          "transform transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Modals */}
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
