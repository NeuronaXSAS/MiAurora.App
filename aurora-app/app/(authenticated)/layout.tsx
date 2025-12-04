"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalHeader } from "@/components/global-header";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { NotificationPermissionPrompt } from "@/components/notification-permission-prompt";
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
    <div className="min-h-screen bg-[var(--background)]">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Sidebar - Fixed position, slides in/out */}
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content Area - Uses margin to account for sidebar */}
      <div 
        className={`
          min-h-screen flex flex-col
          transition-[margin] duration-300 ease-out
          ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64 xl:ml-72'}
        `}
      >
        {/* Global Header */}
        <GlobalHeader userId={userId} sidebarCollapsed={sidebarCollapsed} />
        
        <main 
          id="main-content" 
          className="flex-1 overflow-x-hidden"
        >
          {children}
        </main>
      </div>
      
      {/* PWA Install Banner */}
      <PWAInstallBanner variant="floating" />
      
      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt variant="modal" delay={8000} />
    </div>
  );
}
