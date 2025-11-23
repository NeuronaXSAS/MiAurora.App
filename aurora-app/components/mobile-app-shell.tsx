"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, User, Sparkles, Plus, Mail, Shield } from "lucide-react";
import { PanicButton } from "./panic-button";
import { CreateOptionsModal } from "./create-options-modal";
import { PostCreateDialog } from "./post-create-dialog";
import { PollCreateDialog } from "./poll-create-dialog";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

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

  const navItems = [
    { href: "/feed", icon: Home, label: "Home" },
    { href: "/map", icon: MapPin, label: "Map" },
    { href: "/reels", icon: Sparkles, label: "Reels" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Bar - Fixed */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg">Aurora</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/messages" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Mail className="w-5 h-5 text-gray-600" />
          </Link>
          <NotificationsDropdown />
        </div>
      </div>

      {/* Content - Scrollable area between top and bottom bars */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-4">
        {children}
      </div>

      {/* Panic Button - Always accessible (Top Right) */}
      <PanicButton />

      {/* Bottom Navigation - Fixed */}
      <nav className="bg-white border-t flex-shrink-0 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-2 safe-area-inset-bottom relative">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-purple-600"
                    : "text-gray-600"
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? "fill-purple-100" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Center Create Button - Elevated */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-1 px-4 py-2 -mt-8"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs font-medium text-purple-600 mt-1">Create</span>
          </button>

          {navItems.slice(2).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-purple-600"
                    : "text-gray-600"
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? "fill-purple-100" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
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
    </div>
  );
}
