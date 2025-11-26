"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu, X, Home, MapPin, Shield, Users, Heart, Briefcase, 
  MessageSquare, Settings, User, Route, Play, Video, Mail,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  userCredits?: number;
  userName?: string;
  userAvatar?: string;
}

const navigationItems = [
  {
    id: "health",
    name: "HEALTH & SOUL",
    subtitle: "The Sanctuary",
    icon: Heart,
    color: "text-[#FF6B7A]",
    bgColor: "bg-[#FF6B7A]/10",
    borderColor: "border-[#FF6B7A]/30",
    items: [
      { href: "/profile", icon: User, label: "Personal Dashboard", description: "Your wellness hub" },
      { href: "/health", icon: Heart, label: "Soul Sanctuary", description: "Cycle, mood & wellness" },
      { href: "/assistant", icon: MessageSquare, label: "AI Therapist", description: "Digital companion" },
      { href: "/settings", icon: Settings, label: "Privacy & Settings", description: "Control your data" },
    ],
  },
  {
    id: "mobility",
    name: "MOBILITY & SAFETY",
    subtitle: "The Guardian",
    icon: Shield,
    color: "text-[#8B5CF6]",
    bgColor: "bg-[#8B5CF6]/10",
    borderColor: "border-[#8B5CF6]/30",
    items: [
      { href: "/map", icon: MapPin, label: "Safety Map", description: "Navigate safely" },
      { href: "/routes", icon: Route, label: "Aurora Routes", description: "Track & share routes" },
      { href: "/emergency", icon: Shield, label: "Emergency", description: "Panic button & contacts" },
      { href: "/resources", icon: Shield, label: "Safety Resources", description: "Hotlines & shelters" },
      { href: "/report", icon: Shield, label: "Report Incident", description: "Workplace safety reports" },
    ],
  },

  {
    id: "social",
    name: "SOCIAL & OPPORTUNITY",
    subtitle: "The Village",
    icon: Users,
    color: "text-[#FFC285]",
    bgColor: "bg-[#FFC285]/10",
    borderColor: "border-[#FFC285]/30",
    items: [
      { href: "/feed", icon: Home, label: "Community Feed", description: "Your personalized feed" },
      { href: "/circles", icon: Users, label: "Support Circles", description: "Find your tribe" },
      { href: "/reels", icon: Play, label: "Aurora Reels", description: "Safety videos" },
      { href: "/live", icon: Video, label: "Aurora Live", description: "Livestreaming" },
      { href: "/opportunities", icon: Briefcase, label: "Opportunities", description: "Jobs & resources" },
      { href: "/messages", icon: Mail, label: "Messages", description: "Direct messages" },
    ],
  },
];

export function MobileSidebar({ userCredits = 0, userName, userAvatar }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <>
      {/* Menu Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden min-w-[44px] min-h-[44px] bg-[#150F22]/80 backdrop-blur-sm border border-white/10 text-white hover:bg-[#FF6B7A]/20"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>


      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-[#150F22] via-[#1E1535] to-[#231E35] border-r border-white/10 z-50 md:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                    <img 
                      src="/Au_Logo_1.png" 
                      alt="Aurora App Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xl font-bold text-white">Aurora App</span>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="min-w-[44px] min-h-[44px] text-white hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFE8E8] to-[#FFC285] flex items-center justify-center overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-6 h-6 text-[#150F22]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {userName || "Aurora User"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-[#FFC285]" />
                    <span className="text-[#FFC285] text-sm font-medium">
                      {userCredits} credits
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-2">
              {navigationItems.map((section) => {
                const isExpanded = expandedSection === section.id;
                const SectionIcon = section.icon;
                
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "w-full p-4 rounded-2xl border transition-all text-left",
                        section.bgColor,
                        section.borderColor,
                        "hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", section.bgColor)}>
                            <SectionIcon className={cn("w-5 h-5", section.color)} />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{section.name}</p>
                            <p className={cn("text-xs", section.color)}>{section.subtitle}</p>
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 ml-4 space-y-1">
                            {section.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isActive = pathname === item.href;
                              
                              return (
                                <Link key={item.href} href={item.href}>
                                  <motion.div
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                      "flex items-center gap-3 p-3 rounded-xl transition-all",
                                      isActive ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                                    )}
                                  >
                                    <ItemIcon className={cn("w-4 h-4", isActive ? "text-white" : "text-white/60")} />
                                    <div className="flex-1 min-w-0">
                                      <p className={cn("font-medium text-sm", isActive ? "text-white" : "text-white/80")}>{item.label}</p>
                                      <p className="text-white/40 text-xs truncate">{item.description}</p>
                                    </div>
                                    {isActive && <div className="w-2 h-2 bg-[#FF6B7A] rounded-full" />}
                                  </motion.div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer with Theme Toggle */}
            <div className="p-4 border-t border-white/10 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm">Theme</span>
                <ThemeToggle />
              </div>
              <div className="text-center">
                <p className="text-white/40 text-xs mb-2">
                  Made with <Heart className="w-3 h-3 inline text-[#FF6B7A]" /> for women everywhere
                </p>
                <Badge variant="outline" className="border-[#FF6B7A]/30 text-[#FF6B7A]">v1.0.0</Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
