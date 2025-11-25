"use client";

import { useState } from "react";
import { Plus, X, MessageCircle, Video, Map, Image, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function FloatingCreateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const createOptions = [
    {
      icon: MessageCircle,
      label: "Post",
      color: "from-aurora-lavender to-aurora-blue",
      action: () => router.push("/feed?create=post"),
    },
    {
      icon: Video,
      label: "Reel",
      color: "from-aurora-pink to-aurora-orange",
      action: () => router.push("/reels/create"),
    },
    {
      icon: Map,
      label: "Route",
      color: "from-aurora-blue to-aurora-violet",
      action: () => router.push("/routes/track"),
    },
    {
      icon: Image,
      label: "Story",
      color: "from-aurora-yellow to-aurora-orange",
      action: () => router.push("/feed?create=story"),
    },
  ];

  const handleToggle = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (action: () => void) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    action();
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={handleToggle}
          />
        )}
      </AnimatePresence>

      {/* Create Options */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div className="flex flex-col-reverse items-center gap-3">
              {createOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.label}
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: 20 }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    onClick={() => handleOptionClick(option.action)}
                    className="group flex items-center gap-3"
                  >
                    {/* Label */}
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className="px-4 py-2 rounded-full bg-white text-aurora-violet font-medium text-sm shadow-lg whitespace-nowrap"
                    >
                      {option.label}
                    </motion.span>

                    {/* Icon Button */}
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full",
                        "bg-gradient-to-br",
                        option.color,
                        "shadow-xl",
                        "flex items-center justify-center",
                        "transition-transform duration-200",
                        "group-active:scale-90"
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Create Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleToggle}
        className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
          "w-16 h-16 rounded-full",
          "bg-gradient-to-br from-aurora-pink via-aurora-lavender to-aurora-blue",
          "shadow-2xl shadow-aurora-pink/50",
          "flex items-center justify-center",
          "transition-all duration-300",
          "active:scale-90",
          "hover:shadow-aurora-pink/70",
          "border-4 border-white"
        )}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Create content"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white drop-shadow-lg" />
          ) : (
            <Plus className="w-8 h-8 text-white drop-shadow-lg" />
          )}
        </motion.div>
      </motion.button>
    </>
  );
}
