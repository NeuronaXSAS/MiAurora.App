"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface CreditCelebrationProps {
  amount: number;
  onComplete?: () => void;
}

export function CreditCelebration({ amount, onComplete }: CreditCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-bounce-in">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-8 py-4 shadow-2xl flex items-center gap-3">
          <Sparkles className="w-8 h-8 animate-spin" />
          <div>
            <p className="text-sm font-medium">Credits Earned!</p>
            <p className="text-2xl font-bold">+{amount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
