"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'pill' | 'dropdown';
}

export function ThemeToggle({ className, showLabel = false, variant = 'icon' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <div className={cn(
        "flex items-center gap-1 p-1 rounded-full bg-white/10 border border-white/10",
        className
      )}>
        <button
          onClick={() => setTheme('light')}
          className={cn(
            "p-2 rounded-full transition-all",
            theme === 'light' 
              ? "bg-[#FFC285] text-[#150F22]" 
              : "text-white/60 hover:text-white"
          )}
          aria-label="Light mode"
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            "p-2 rounded-full transition-all",
            theme === 'dark' 
              ? "bg-[#8B5CF6] text-white" 
              : "text-white/60 hover:text-white"
          )}
          aria-label="Dark mode"
        >
          <Moon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={cn(
            "p-2 rounded-full transition-all",
            theme === 'system' 
              ? "bg-[#FF6B7A] text-white" 
              : "text-white/60 hover:text-white"
          )}
          aria-label="System theme"
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={toggleTheme}
      className={cn(
        "relative overflow-hidden",
        resolvedTheme === 'dark' 
          ? "text-white/80 hover:text-white hover:bg-white/10" 
          : "text-[#150F22]/80 hover:text-[#150F22] hover:bg-[#150F22]/10",
        className
      )}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait">
        {resolvedTheme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Moon className="w-5 h-5" />
            {showLabel && <span>Dark</span>}
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Sun className="w-5 h-5" />
            {showLabel && <span>Light</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
