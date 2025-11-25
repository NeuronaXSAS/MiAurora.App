"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNavigationMenu } from "@/components/mobile-navigation-menu";
import { FloatingSOSButton } from "@/components/floating-sos-button";
import { FloatingCreateButton } from "@/components/floating-create-button";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useCreditsCelebration } from "@/hooks/use-credits-celebration";
import { Id } from "@/convex/_generated/dataModel";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

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

  if (isMobile) {
    return (
      <>
        <MobileNavigationMenu>{children}</MobileNavigationMenu>
        <FloatingSOSButton />
        <FloatingCreateButton />
        <PWAInstallPrompt />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <AppSidebar />
      <main id="main-content" className="flex-1 overflow-auto pt-16 lg:pt-0">
        {children}
      </main>
      <PWAInstallPrompt />
    </div>
  );
}
