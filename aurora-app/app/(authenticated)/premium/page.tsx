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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-pink-950/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-aurora-yellow/40 to-aurora-orange/40 backdrop-blur-xl border-b border-aurora-yellow/20">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-aurora-yellow" />
              <div>
                <h1 className="text-3xl font-bold text-white">Aurora Premium</h1>
                <p className="text-sm text-gray-200">You're a Premium Member!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-aurora-yellow" />
                Your Premium Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-aurora-yellow/20 to-aurora-orange/20 border border-aurora-yellow/30 rounded-lg p-4">
                <p className="text-white text-center font-semibold">
                  ✨ Thank you for being a Premium member! ✨
                </p>
                <p className="text-gray-300 text-center text-sm mt-2">
                  You're helping us build a safer, more supportive community for women everywhere.
                </p>
              </div>

              <div className="grid gap-3">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <Icon className={`w-5 h-5 ${benefit.color} flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className="font-semibold text-white text-sm">{benefit.title}</p>
                        <p className="text-gray-400 text-xs">{benefit.description}</p>
                      </div>
                      <Check className="w-5 h-5 text-green-400 ml-auto flex-shrink-0" />
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link href="/profile">
                  <Button className="w-full bg-gradient-to-r from-aurora-yellow to-aurora-orange hover:from-aurora-yellow/90 hover:to-aurora-orange/90 text-slate-900 font-semibold">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-pink-950/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-aurora-yellow/40 to-aurora-orange/40 backdrop-blur-xl border-b border-aurora-yellow/20">
        <div className="container mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-aurora-yellow/20 border border-aurora-yellow/30 rounded-full px-4 py-2 mb-4">
            <Crown className="w-4 h-4 text-aurora-yellow" />
            <span className="text-sm font-semibold text-white">Limited Time Offer</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Upgrade to Aurora Premium
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Unlock the full potential of Aurora with an ad-free experience, unlimited AI conversations, and exclusive features
          </p>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Main Pricing Card */}
          <Card className="backdrop-blur-xl bg-gradient-to-br from-aurora-yellow/10 to-aurora-orange/10 border-aurora-yellow/30 border-2 shadow-2xl mb-8">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-aurora-yellow to-aurora-orange rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Aurora Premium
              </CardTitle>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-aurora-yellow">$5</span>
                <span className="text-xl text-gray-300">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Cancel anytime • No commitments</p>
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
                      className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <Icon className={`w-6 h-6 ${benefit.color} flex-shrink-0`} />
                      <div>
                        <p className="font-semibold text-white text-sm mb-1">{benefit.title}</p>
                        <p className="text-gray-400 text-xs">{benefit.description}</p>
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
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">Free vs Premium</CardTitle>
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
                    className="grid grid-cols-3 gap-4 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="col-span-1 text-white text-sm font-medium">
                      {row.feature}
                    </div>
                    <div className="text-center text-sm text-gray-400">
                      {row.free}
                    </div>
                    <div className="text-center text-sm text-aurora-yellow font-medium">
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
