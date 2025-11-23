"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileAppShell } from "@/components/mobile-app-shell";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useIsMobile } from "@/hooks/use-is-mobile";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <MobileAppShell>{children}</MobileAppShell>
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
