"use client";

import { usePathname, useRouter } from "next/navigation";
import { Heart, Map, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileAppShellProps {
  children: React.ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: "health",
      label: "Health",
      sublabel: "Sanctuary",
      icon: Heart,
      path: "/profile",
      color: "text-aurora-pink",
    },
    {
      id: "mobility",
      label: "Mobility",
      sublabel: "Guardian",
      icon: Map,
      path: "/map",
      color: "text-aurora-blue",
    },
    {
      id: "social",
      label: "Social",
      sublabel: "Village",
      icon: Users,
      path: "/feed",
      color: "text-aurora-lavender",
    },
  ];

  const handleTabClick = (path: string) => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    router.push(path);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Bottom Navigation - Trinity Pillars */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-aurora-violet border-t border-aurora-violet/20 safe-area-inset-bottom z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200",
                  "active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center transition-all duration-200",
                    active && "transform scale-110"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 mb-1 transition-colors duration-200",
                      active ? "text-aurora-blue" : "text-white/70"
                    )}
                  />
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-colors duration-200",
                        active ? "text-white" : "text-white/70"
                      )}
                    >
                      {tab.label}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] transition-colors duration-200",
                        active ? "text-aurora-blue" : "text-white/50"
                      )}
                    >
                      {tab.sublabel}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
