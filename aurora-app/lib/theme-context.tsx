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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('aurora-theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Determine resolved theme
    let resolved: 'light' | 'dark' = 'dark';
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
      root.style.setProperty('--aurora-bg-primary', '#FFFDFB');
      root.style.setProperty('--aurora-bg-secondary', '#FFF8F0');
      root.style.setProperty('--aurora-bg-tertiary', '#FFEFD9');
      root.style.setProperty('--aurora-text-primary', '#150F22');
      root.style.setProperty('--aurora-text-secondary', '#4A3F6B');
      root.style.setProperty('--aurora-text-muted', '#6B5B95');
      root.style.setProperty('--aurora-border', 'rgba(21, 15, 34, 0.1)');
      root.style.setProperty('--aurora-card-bg', 'rgba(255, 255, 255, 0.8)');
    } else {
      root.style.setProperty('--aurora-bg-primary', '#150F22');
      root.style.setProperty('--aurora-bg-secondary', '#1E1535');
      root.style.setProperty('--aurora-bg-tertiary', '#231E35');
      root.style.setProperty('--aurora-text-primary', '#FFFFFF');
      root.style.setProperty('--aurora-text-secondary', '#E8E4F0');
      root.style.setProperty('--aurora-text-muted', '#B8B0D4');
      root.style.setProperty('--aurora-border', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--aurora-card-bg', 'rgba(255, 255, 255, 0.05)');
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
