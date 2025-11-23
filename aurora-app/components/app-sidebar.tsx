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

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const navItems = [
    { href: "/feed", icon: Home, label: "Feed", description: "Your personalized feed" },
    { href: "/reels", icon: Play, label: "Reels", description: "Safety videos" },
    { href: "/routes", icon: Route, label: "Routes", description: "Track your movement" },
    { href: "/map", icon: MapPin, label: "Safety Map", description: "Navigate safely" },
    { href: "/opportunities", icon: Briefcase, label: "Opportunities", description: "Jobs & resources" },
    { href: "/intelligence", icon: Database, label: "Intelligence", description: "B2B data platform" },
    { href: "/messages", icon: Mail, label: "Messages", description: "Direct messages" },
    { href: "/assistant", icon: MessageSquare, label: "AI Assistant", description: "Get personalized advice" },
    { href: "/profile", icon: User, label: "Profile", description: "Your stats & credits" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Link href="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">Aurora</h1>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
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
          flex flex-col h-screen w-64 bg-white border-r
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:block p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <Link href="/feed" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Aurora App</h1>
                <p className="text-xs text-gray-500">For women to thrive</p>
              </div>
            </Link>
            <NotificationsDropdown />
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage src={user.profileImage} />
                <AvatarFallback>
                  {(user.name && user.name !== 'null' ? user.name : 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {user.name && user.name !== 'null' ? user.name : 'User'}
                </p>
                <p className="text-xs text-gray-500">Trust: {user.trustScore}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 mb-3">
              <span className="text-sm font-medium text-purple-900">Credits</span>
              <Badge className="bg-purple-600">{user.credits}</Badge>
            </div>
            {/* Create Button */}
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-100 text-purple-900"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings & Logout */}
        <div className="p-4 border-t space-y-1">
          <Link href="/credits" onClick={() => setIsMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600"
            >
              <Coins className="w-5 h-5 mr-3" />
              Credit Center
            </Button>
          </Link>
          <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Button>
          </Link>
          
          {/* Legal Links */}
          <div className="pt-2 border-t">
            <Link href="/legal/terms" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-500 text-xs"
              >
                <FileText className="w-4 h-4 mr-3" />
                Terms of Service
              </Button>
            </Link>
            <Link href="/legal/privacy" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-500 text-xs"
              >
                <Shield className="w-4 h-4 mr-3" />
                Privacy Policy
              </Button>
            </Link>
          </div>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
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
