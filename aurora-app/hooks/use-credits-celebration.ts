"use client";

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useCelebration } from '@/lib/celebration-context';

/**
 * Hook that watches for credit changes and triggers celebrations
 */
export function useCreditsCelebration(userId: Id<"users"> | null) {
  const { celebrateCredits } = useCelebration();
  const previousCredits = useRef<number | null>(null);
  
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (!user?.credits) return;
    
    const currentCredits = user.credits;
    
    // Skip first render
    if (previousCredits.current === null) {
      previousCredits.current = currentCredits;
      return;
    }
    
    // Check if credits increased
    const creditDiff = currentCredits - previousCredits.current;
    
    if (creditDiff > 0) {
      // Determine celebration message based on amount
      let reason = 'your contribution';
      if (creditDiff >= 100) {
        reason = 'an amazing achievement!';
      } else if (creditDiff >= 50) {
        reason = 'great engagement!';
      } else if (creditDiff >= 25) {
        reason = 'helping the community';
      } else if (creditDiff >= 10) {
        reason = 'being active';
      }
      
      celebrateCredits(creditDiff, reason);
    }
    
    previousCredits.current = currentCredits;
  }, [user?.credits, celebrateCredits]);

  return {
    credits: user?.credits ?? 0,
  };
}
