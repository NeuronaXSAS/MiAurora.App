"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Heart, 
  Map, 
  Users, 
  Sparkles,
  MessageCircle,
  Video,
  Calendar,
  Shield,
  Compass,
  Navigation,
  UserCircle,
  Settings,
  Bell,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavigationMenuProps {
  children: React.ReactNode;
}

export function MobileNavigationMenu({ children }: MobileNavigationMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = {
    health: [
      { icon: UserCircle, label: "Profile", path: "/profile" },
      { icon: Heart, label: "Wellness", path: "/profile#wellness" },
      { icon: Shield, label: "Emergency", path: "/emergency" },
      { icon: Bell, label: "Notifications", path: "/profile#notifications" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
    mobility: [
      { icon: Map, label: "Map View", path: "/map" },
      { icon: Compass, label: "Discover Routes", path: "/routes/discover" },
      { icon: Navigation, label: "Track Route", path: "/routes/track" },
      { icon: Calendar, label: "My Routes", path: "/routes" },
      { icon: Users, label: "Accompaniment", path: "/accompaniment" },
    ],
    social: [
      { icon: Sparkles, label: "Feed", path: "/feed" },
      { icon: Video, label: "Reels", path: "/reels" },
      { icon: MessageCircle, label: "Messages", path: "/messages" },
      { icon: Users, label: "Community", path: "/feed#community" },
      { icon: Bell, label: "Activity", path: "/feed#activity" },
    ],
  };

  const tabs = [
    {
      id: "health",
      label: "Health",
      sublabel: "Sanctuary",
      icon: Heart,
      mainPath: "/profile",
      color: "aurora-pink",
      gradient: "from-aurora-pink/20 to-aurora-violet/10",
    },
    {
      id: "mobility",
      label: "Mobility",
      sublabel: "Guardian",
      icon: Map,
      mainPath: "/map",
      color: "aurora-blue",
      gradient: "from-aurora-blue/20 to-aurora-violet/10",
    },
    {
      id: "social",
      label: "Social",
      sublabel: "Village",
      icon: Users,
      mainPath: "/feed",
      color: "aurora-lavender",
      gradient: "from-aurora-lavender/20 to-aurora-violet/10",
    },
  ];

  const handleTabClick = (tabId: string, mainPath: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (activeMenu === tabId) {
      // Si el menú ya está abierto, navegar a la ruta principal
      setActiveMenu(null);
      router.push(mainPath);
    } else {
      // Abrir el menú
      setActiveMenu(tabId);
    }
  };

  const handleMenuItemClick = (path: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setActiveMenu(null);
    router.push(path);
  };

  const isActive = (tabId: string, mainPath: string) => {
    const items = menuItems[tabId as keyof typeof menuItems];
    return items.some(item => pathname === item.path || pathname.startsWith(item.path + "/"));
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20">
        {children}
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setActiveMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Expandable Menu */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed bottom-16 left-0 right-0 z-50",
              "bg-gradient-to-b",
              tabs.find(t => t.id === activeMenu)?.gradient,
              "backdrop-blur-xl border-t border-white/10",
              "rounded-t-3xl shadow-2xl"
            )}
          >
            <div className="p-6 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {tabs.find(t => t.id === activeMenu)?.label}
                  </h3>
                  <p className="text-sm text-white/60">
                    {tabs.find(t => t.id === activeMenu)?.sublabel}
                  </p>
                </div>
                <button
                  onClick={() => setActiveMenu(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-2 gap-3">
                {menuItems[activeMenu as keyof typeof menuItems]?.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = pathname === item.path || pathname.startsWith(item.path + "/");

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleMenuItemClick(item.path)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl",
                        "transition-all duration-200 active:scale-95",
                        isItemActive
                          ? "bg-white/20 shadow-lg"
                          : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6 mb-2",
                          isItemActive ? "text-white" : "text-white/70"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium text-center",
                          isItemActive ? "text-white" : "text-white/70"
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Trinity Pillars */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-aurora-violet/95 backdrop-blur-lg border-t border-white/10 safe-area-inset-bottom z-50 shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        role="navigation"
        aria-label="Main navigation - Trinity Pillars"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.id, tab.mainPath);
            const menuOpen = activeMenu === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.mainPath)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  "transition-all duration-200 active:scale-95 relative"
                )}
              >
                {/* Active Indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      `bg-${tab.color}/20`
                    )}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  />
                )}

                {/* Menu Open Indicator */}
                {menuOpen && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}

                <div className="flex flex-col items-center justify-center relative z-10">
                  <Icon
                    className={cn(
                      "w-6 h-6 mb-1 transition-all duration-200",
                      active || menuOpen
                        ? `text-${tab.color} drop-shadow-glow`
                        : "text-white/60"
                    )}
                  />
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-colors duration-200",
                        active || menuOpen ? "text-white" : "text-white/60"
                      )}
                    >
                      {tab.label}
                    </span>
                    <span
                      className={cn(
                        "text-[8px] transition-colors duration-200",
                        active || menuOpen ? `text-${tab.color}` : "text-white/40"
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
