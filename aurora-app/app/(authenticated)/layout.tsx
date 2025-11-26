"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { PanicButton } from "@/components/panic-button";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useCreditsCelebration } from "@/hooks/use-credits-celebration";
import { Id } from "@/convex/_generated/dataModel";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get user ID for credit celebrations
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

  // Watch for credit changes and celebrate
  useCreditsCelebration(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Sidebar - Always visible, collapsible on mobile */}
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <main 
        id="main-content" 
        className="flex-1 overflow-auto transition-all duration-300"
      >
        {children}
      </main>
      
      {/* Global Panic Button - Always visible for safety (except on /emergency page which has its own) */}
      <PanicButton />
      <PWAInstallPrompt />
    </div>
  );
}
