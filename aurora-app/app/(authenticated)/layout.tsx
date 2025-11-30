"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalHeader } from "@/components/global-header";
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

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleToggle = () => {
      setSidebarCollapsed(prev => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  // Watch for credit changes and celebrate
  useCreditsCelebration(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Sidebar - Always visible on desktop, collapsible on mobile */}
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content Area - Expands when sidebar is collapsed */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-0' : ''}`}>
        {/* Global Header - Now shown on ALL pages for consistent navigation */}
        <GlobalHeader userId={userId} sidebarCollapsed={sidebarCollapsed} />
        
        <main 
          id="main-content" 
          className="flex-1 overflow-auto"
        >
          {children}
        </main>
      </div>
      
      <PWAInstallPrompt />
    </div>
  );
}
