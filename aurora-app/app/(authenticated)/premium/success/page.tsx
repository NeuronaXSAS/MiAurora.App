"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Check, PartyPopper } from "lucide-react";
import Link from "next/link";

export default function PremiumSuccessPage() {
  const searchParams = useSearchParams();
  const [showContent, setShowContent] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Show content after a brief delay for animation
    setTimeout(() => setShowContent(true), 300);
  }, []);

  const benefits = [
    "Ad-free experience across all of Aurora",
    "1000 AI companion messages per day",
    "50 posts per hour",
    "20 reels per day",
    "10 livestreams per day",
    "Premium badge on your profile",
    "100 bonus credits added to your account",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-pink-950/20 flex items-center justify-center p-4">
      <Card className={`max-w-lg w-full backdrop-blur-xl bg-white/10 border-[var(--color-aurora-yellow)]/30 transition-all duration-700 ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          {/* Success Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] rounded-full animate-pulse" />
            <div className="absolute inset-1 bg-slate-900 rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-[var(--color-aurora-yellow)]" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <PartyPopper className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
              Welcome to Premium!
              <PartyPopper className="w-8 h-8 text-[var(--color-aurora-yellow)] scale-x-[-1]" />
            </h1>
            <p className="text-gray-300">
              Thank you for supporting Aurora App! Your subscription is now active.
            </p>
          </div>

          {/* Benefits List */}
          <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
            <p className="text-sm font-semibold text-[var(--color-aurora-yellow)] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Your Premium Benefits:
            </p>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[var(--color-aurora-mint)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Impact Message */}
          <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 border border-[var(--color-aurora-purple)]/30 rounded-xl p-4">
            <p className="text-white text-sm">
              💜 Your subscription helps us keep Aurora App running and supports our mission to create safer communities for women worldwide.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Link href="/feed" className="block">
              <Button className="w-full bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] text-slate-900 font-semibold hover:opacity-90 min-h-[48px]">
                Start Exploring
              </Button>
            </Link>
            <Link href="/profile" className="block">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 min-h-[44px]">
                View Your Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
