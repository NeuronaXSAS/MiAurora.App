"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCelebration } from "@/lib/celebration-context";
import { Sparkles, Trophy, Star, Heart, Coins } from "lucide-react";

/**
 * Demo component to test celebration animations
 * Can be removed in production or kept for testing
 */
export function CelebrationDemo() {
  const { 
    celebrateCredits, 
    celebrateAchievement, 
    celebrateMilestone, 
    celebrateWelcome,
    celebrateStreak 
  } = useCelebration();

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#FFC285]" />
        Celebration Animations Demo
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={() => celebrateCredits(50, "testing the system")}
          className="border-[#FFC285]/30 text-[#FFC285] hover:bg-[#FFC285]/10"
        >
          <Coins className="w-4 h-4 mr-2" />
          +50 Credits
        </Button>
        <Button
          variant="outline"
          onClick={() => celebrateAchievement("First Post!")}
          className="border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Achievement
        </Button>
        <Button
          variant="outline"
          onClick={() => celebrateMilestone("100 Community Members!")}
          className="border-[#FF6B7A]/30 text-[#FF6B7A] hover:bg-[#FF6B7A]/10"
        >
          <Star className="w-4 h-4 mr-2" />
          Milestone
        </Button>
        <Button
          variant="outline"
          onClick={() => celebrateWelcome()}
          className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
        >
          <Heart className="w-4 h-4 mr-2" />
          Welcome
        </Button>
        <Button
          variant="outline"
          onClick={() => celebrateStreak(7)}
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          7-Day Streak
        </Button>
      </div>
    </Card>
  );
}
