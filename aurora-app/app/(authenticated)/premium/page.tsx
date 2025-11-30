"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Check,
  Crown,
  Zap,
  Shield,
  MessageSquare,
  TrendingUp,
  Star,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export default function PremiumPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const isPremium = user?.isPremium || false;

  const benefits = [
    {
      icon: Sparkles,
      title: "Ad-Free Experience",
      description: "Enjoy Aurora without any advertisements or sponsored content",
      color: "text-aurora-lavender",
    },
    {
      icon: MessageSquare,
      title: "Unlimited AI Companion",
      description: "1000 daily messages vs 10 for free users - talk to Aurora anytime",
      color: "text-aurora-pink",
    },
    {
      icon: Zap,
      title: "Higher Limits",
      description: "50 posts/hour, 20 reels/day, 10 livestreams/day vs free limits",
      color: "text-aurora-blue",
    },
    {
      icon: Crown,
      title: "Premium Badge",
      description: "Stand out with a verified Premium badge on your profile",
      color: "text-aurora-yellow",
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "Get faster response times and dedicated support",
      color: "text-aurora-mint",
    },
    {
      icon: TrendingUp,
      title: "Enhanced Analytics",
      description: "Get deeper insights into your wellness journey and mental health",
      color: "text-aurora-orange",
    },
  ];

  if (isPremium) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/30 to-[var(--color-aurora-orange)]/30 border-b border-[var(--border)]">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Aurora Premium</h1>
                <p className="text-sm text-[var(--muted-foreground)]">You're a Premium Member!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <Card className="bg-[var(--card)] border-[var(--border)] max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-[var(--foreground)] flex items-center gap-2">
                <Star className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
                Your Premium Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-orange)]/20 border border-[var(--color-aurora-yellow)]/30 rounded-lg p-4">
                <p className="text-[var(--foreground)] text-center font-semibold">
                  ✨ Thank you for being a Premium member! ✨
                </p>
                <p className="text-[var(--muted-foreground)] text-center text-sm mt-2">
                  You're helping us build a safer, more supportive community for women everywhere.
                </p>
              </div>

              <div className="grid gap-3">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-[var(--accent)]/50 rounded-lg border border-[var(--border)]"
                    >
                      <Icon className={`w-5 h-5 ${benefit.color} flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className="font-semibold text-[var(--foreground)] text-sm">{benefit.title}</p>
                        <p className="text-[var(--muted-foreground)] text-xs">{benefit.description}</p>
                      </div>
                      <Check className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <Link href="/profile">
                  <Button className="w-full bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] hover:opacity-90 text-slate-900 font-semibold">
                    View Your Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-orange)]/20 border-b border-[var(--border)]">
        <div className="container mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--color-aurora-yellow)]/20 border border-[var(--color-aurora-yellow)]/30 rounded-full px-4 py-2 mb-4">
            <Crown className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Limited Time Offer</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--foreground)] mb-4">
            Upgrade to Aurora Premium
          </h1>
          <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Unlock the full potential of Aurora with an ad-free experience, unlimited AI conversations, and exclusive features
          </p>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Main Pricing Card */}
          <Card className="bg-gradient-to-br from-[var(--color-aurora-yellow)]/10 to-[var(--color-aurora-orange)]/10 border-[var(--color-aurora-yellow)]/30 border-2 shadow-xl mb-8">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-[var(--foreground)] mb-2">
                Aurora Premium
              </CardTitle>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-[var(--color-aurora-yellow)]">$5</span>
                <span className="text-xl text-[var(--muted-foreground)]">/month</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">Cancel anytime • No commitments</p>
              <Badge className="mt-3 bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-[var(--color-aurora-mint)]/30">
                🌍 Affordable for women worldwide
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefits Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-[var(--accent)]/50 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
                    >
                      <Icon className={`w-6 h-6 ${benefit.color} flex-shrink-0`} />
                      <div>
                        <p className="font-semibold text-[var(--foreground)] text-sm mb-1">{benefit.title}</p>
                        <p className="text-[var(--muted-foreground)] text-xs">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-aurora-yellow to-aurora-orange hover:from-aurora-yellow/90 hover:to-aurora-orange/90 text-slate-900 font-bold text-lg h-14 shadow-lg shadow-aurora-yellow/30"
                  onClick={async () => {
                    if (!userId || !user?.email) return;
                    try {
                      const response = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, email: user.email }),
                      });
                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else if (data.message) {
                        alert(data.message);
                      }
                    } catch (error) {
                      console.error('Checkout error:', error);
                      alert('Unable to start checkout. Please try again.');
                    }
                  }}
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Subscribe for $5/month
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Secure payment via Stripe • Cancel anytime
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardHeader>
              <CardTitle className="text-[var(--foreground)] text-center">Free vs Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { feature: "Community Feed & Posts", free: "5/hour", premium: "50/hour" },
                  { feature: "Safety Map & Routes", free: "✓", premium: "✓" },
                  { feature: "AI Companion Messages", free: "10/day", premium: "1000/day" },
                  { feature: "Reel Uploads", free: "3/day", premium: "20/day" },
                  { feature: "Livestreams", free: "2/day", premium: "10/day" },
                  { feature: "Advertisements", free: "Yes", premium: "No ads ✨" },
                  { feature: "Premium Badge", free: "—", premium: "✓" },
                  { feature: "Priority Support", free: "—", premium: "✓" },
                  { feature: "Bonus Credits", free: "—", premium: "100 credits" },
                ].map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-4 p-3 bg-[var(--accent)]/50 rounded-lg border border-[var(--border)]"
                  >
                    <div className="col-span-1 text-[var(--foreground)] text-sm font-medium">
                      {row.feature}
                    </div>
                    <div className="text-center text-sm text-[var(--muted-foreground)]">
                      {row.free}
                    </div>
                    <div className="text-center text-sm text-[var(--color-aurora-yellow)] font-medium">
                      {row.premium}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
