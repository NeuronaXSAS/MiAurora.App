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
    
    // Update CSS variables for Aurora theme
    if (resolved === 'light') {
      root.style.setProperty('--aurora-bg-primary', '#FFFBF5');
      root.style.setProperty('--aurora-bg-secondary', '#F8F4EF');
      root.style.setProperty('--aurora-bg-tertiary', '#F0EBE4');
      root.style.setProperty('--aurora-text-primary', '#2D1B4E');
      root.style.setProperty('--aurora-text-secondary', '#5A4478');
      root.style.setProperty('--aurora-text-muted', '#7B6B99');
      root.style.setProperty('--aurora-border', 'rgba(45, 27, 78, 0.08)');
      root.style.setProperty('--aurora-card-bg', 'rgba(255, 255, 255, 0.6)');
    } else {
      root.style.setProperty('--aurora-bg-primary', '#0F0B1A');
      root.style.setProperty('--aurora-bg-secondary', '#1A1428');
      root.style.setProperty('--aurora-bg-tertiary', '#241D36');
      root.style.setProperty('--aurora-text-primary', '#F0ECF6');
      root.style.setProperty('--aurora-text-secondary', '#D0C8E4');
      root.style.setProperty('--aurora-text-muted', '#A99CC8');
      root.style.setProperty('--aurora-border', 'rgba(160, 140, 200, 0.12)');
      root.style.setProperty('--aurora-card-bg', 'rgba(26, 20, 40, 0.6)');
    }
    
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
