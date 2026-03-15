"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default theme is LIGHT - Aurora App is feminine and warm
const DEFAULT_THEME: Theme = 'light';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // Apply theme immediately on mount to prevent flash
  useEffect(() => {
    // Load saved theme from localStorage, default to light
    const savedTheme = localStorage.getItem('aurora-theme') as Theme | null;
    const themeToApply = savedTheme || DEFAULT_THEME;
    
    // Apply immediately
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let resolved: 'light' | 'dark' = 'light';
    if (themeToApply === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = themeToApply;
    }
    
    root.classList.add(resolved);
    setThemeState(themeToApply);
    setResolvedTheme(resolved);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Determine resolved theme
    let resolved: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }
    
    setResolvedTheme(resolved);
    
    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    
    // Aurora CSS variables are now defined in globals.css (:root and .dark)
    // No need to set them via JS — the .dark class toggle handles everything,
    // and .force-light-theme can properly override them with !important.
    // Clean up any stale inline styles from previous ThemeProvider versions
    const auroraVars = [
      '--aurora-bg-primary', '--aurora-bg-secondary', '--aurora-bg-tertiary',
      '--aurora-text-primary', '--aurora-text-secondary', '--aurora-text-muted',
      '--aurora-border', '--aurora-card-bg'
    ];
    auroraVars.forEach(v => root.style.removeProperty(v));
    
    // Save to localStorage
    localStorage.setItem('aurora-theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
