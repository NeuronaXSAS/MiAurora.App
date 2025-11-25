"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CelebrationAnimation } from '@/components/celebration-animation';

type CelebrationType = 'credits' | 'achievement' | 'milestone' | 'welcome' | 'streak';

interface CelebrationOptions {
  amount?: number;
  message?: string;
}

interface CelebrationContextType {
  celebrate: (type: CelebrationType, options?: CelebrationOptions) => void;
  celebrateCredits: (amount: number, reason?: string) => void;
  celebrateAchievement: (title: string) => void;
  celebrateMilestone: (message: string) => void;
  celebrateWelcome: () => void;
  celebrateStreak: (days: number) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<{
    type: CelebrationType;
    amount?: number;
    message?: string;
  } | null>(null);

  const celebrate = useCallback((type: CelebrationType, options?: CelebrationOptions) => {
    setCelebration({ type, ...options });
  }, []);

  const celebrateCredits = useCallback((amount: number, reason?: string) => {
    celebrate('credits', { 
      amount, 
      message: reason || 'Keep up the great work!' 
    });
  }, [celebrate]);

  const celebrateAchievement = useCallback((title: string) => {
    celebrate('achievement', { message: title });
  }, [celebrate]);

  const celebrateMilestone = useCallback((message: string) => {
    celebrate('milestone', { message });
  }, [celebrate]);

  const celebrateWelcome = useCallback(() => {
    celebrate('welcome', { message: 'Your journey begins now!' });
  }, [celebrate]);

  const celebrateStreak = useCallback((days: number) => {
    celebrate('streak', { 
      amount: days, 
      message: `${days} day streak! Amazing!` 
    });
  }, [celebrate]);

  const clearCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{
      celebrate,
      celebrateCredits,
      celebrateAchievement,
      celebrateMilestone,
      celebrateWelcome,
      celebrateStreak,
    }}>
      {children}
      {celebration && (
        <CelebrationAnimation
          type={celebration.type}
          amount={celebration.amount}
          message={celebration.message}
          onComplete={clearCelebration}
        />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}
