"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Plus, Minus, Sparkles } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface HydrationTrackerProps {
  userId: Id<"users">;
}

export function HydrationTracker({ userId }: HydrationTrackerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  
  const todayHydration = useQuery(
    (api as any).health?.getTodayHydration ? (api as any).health.getTodayHydration : "skip",
    userId ? { userId } : "skip"
  );
  const logWater = useMutation((api as any).health?.logWater || (() => Promise.resolve()));

  const glasses = todayHydration?.glasses || 0;
  const goal = todayHydration?.goal || 8;
  const completed = todayHydration?.completed || false;
  const percentage = Math.min((glasses / goal) * 100, 100);

  const handleAddGlass = async () => {
    const newGlasses = glasses + 1;
    await logWater({ userId, glasses: newGlasses });
    
    // Show celebration if goal reached
    if (newGlasses === goal) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const handleRemoveGlass = async () => {
    if (glasses > 0) {
      await logWater({ userId, glasses: glasses - 1 });
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/10 border-white/20 relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Droplet className="w-5 h-5 text-aurora-mint" />
          Hydration Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Water Bottle SVG */}
        <div className="relative w-32 h-48 mx-auto mb-6">
          {/* Bottle Outline */}
          <svg
            viewBox="0 0 100 150"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bottle Body */}
            <path
              d="M 30 20 L 30 130 Q 30 140 40 140 L 60 140 Q 70 140 70 130 L 70 20 Z"
              fill="none"
              stroke="rgba(214, 244, 236, 0.3)"
              strokeWidth="2"
            />
            
            {/* Bottle Cap */}
            <rect
              x="35"
              y="10"
              width="30"
              height="10"
              rx="2"
              fill="rgba(214, 244, 236, 0.3)"
            />
            
            {/* Water Fill */}
            <defs>
              <clipPath id="bottle-clip">
                <path d="M 30 20 L 30 130 Q 30 140 40 140 L 60 140 Q 70 140 70 130 L 70 20 Z" />
              </clipPath>
            </defs>
            
            <rect
              x="30"
              y={20 + (110 * (1 - percentage / 100))}
              width="40"
              height={110 * (percentage / 100)}
              fill="#d6f4ec"
              opacity="0.8"
              clipPath="url(#bottle-clip)"
              className="transition-all duration-500 ease-out"
            />
            
            {/* Water Wave Effect */}
            {percentage > 0 && (
              <path
                d={`M 30 ${20 + (110 * (1 - percentage / 100))} Q 40 ${18 + (110 * (1 - percentage / 100))} 50 ${20 + (110 * (1 - percentage / 100))} T 70 ${20 + (110 * (1 - percentage / 100))}`}
                fill="none"
                stroke="#d6f4ec"
                strokeWidth="2"
                opacity="0.6"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Progress Info */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-white">
            {glasses} / {goal} glasses
          </p>
          <p className="text-sm text-gray-300">
            {completed ? "🎉 Goal reached!" : `${goal - glasses} more to go`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleRemoveGlass}
            disabled={glasses === 0}
            variant="outline"
            size="icon"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleAddGlass}
            className="bg-gradient-to-r from-aurora-mint/80 to-aurora-mint hover:from-aurora-mint hover:to-aurora-mint/80 text-slate-900 font-semibold px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Glass
          </Button>
        </div>

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center bg-aurora-mint/20 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-aurora-mint mx-auto mb-2 animate-pulse" />
              <p className="text-2xl font-bold text-white">Goal Reached!</p>
              <p className="text-sm text-gray-200">Great job staying hydrated! 💧</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
