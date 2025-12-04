"use client";

/**
 * Financial Wellness Page
 * 
 * Helps women make better financial decisions through:
 * - Budget tracking insights
 * - Savings goals
 * - Financial literacy resources
 * - Community wisdom on money matters
 */

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  PiggyBank,
  BookOpen,
  Users,
  Sparkles,
  ArrowRight,
  DollarSign,
  Shield,
  Lightbulb,
  ChevronRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

// Financial wellness tips
const financialTips = [
  {
    title: "Emergency Fund First",
    description: "Aim for 3-6 months of expenses saved before investing",
    icon: Shield,
    color: "var(--color-aurora-mint)",
  },
  {
    title: "50/30/20 Rule",
    description: "50% needs, 30% wants, 20% savings & debt repayment",
    icon: PiggyBank,
    color: "var(--color-aurora-pink)",
  },
  {
    title: "Negotiate Your Salary",
    description: "Women who negotiate earn 7% more on average",
    icon: TrendingUp,
    color: "var(--color-aurora-purple)",
  },
  {
    title: "Start Investing Early",
    description: "Time in the market beats timing the market",
    icon: Sparkles,
    color: "var(--color-aurora-yellow)",
  },
];

// Power skills for financial growth
const powerSkills = [
  { name: "Salary Negotiation", level: "Essential", credits: 50 },
  { name: "Investment Basics", level: "Intermediate", credits: 75 },
  { name: "Tax Planning", level: "Advanced", credits: 100 },
  { name: "Side Income Strategies", level: "Essential", credits: 50 },
  { name: "Debt Management", level: "Essential", credits: 50 },
];

export default function FinancePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) setUserId(data.userId as Id<"users">);
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-mint)] to-[var(--color-aurora-blue)] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Financial Wellness</h1>
              <p className="text-white/80">Build wealth & make smarter decisions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-yellow)]/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{user?.credits || 0}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Aurora Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-mint)]/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">3</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Goals Set</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">12</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Lessons Done</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-pink)]/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">847</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Community Tips</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Wellness Score */}
        <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--border)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[var(--foreground)]">Your Financial Wellness Score</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Based on your activity & goals</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[var(--color-aurora-purple)]">72</p>
                <p className="text-xs text-[var(--muted-foreground)]">out of 100</p>
              </div>
            </div>
            <Progress value={72} className="h-3 mb-4" />
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">Tip:</span> Complete the "Salary Negotiation" course to boost your score by 10 points
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Power Skills Section */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Star className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
              Power Skills for Financial Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {powerSkills.map((skill, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{skill.name}</p>
                    <Badge variant="secondary" className="text-xs bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                      {skill.level}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                    +{skill.credits} credits
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Tips */}
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
            Smart Money Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {financialTips.map((tip, idx) => (
              <Card key={idx} className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tip.color}20` }}
                    >
                      <tip.icon className="w-5 h-5" style={{ color: tip.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--foreground)] mb-1">{tip.title}</h4>
                      <p className="text-sm text-[var(--muted-foreground)]">{tip.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Wisdom */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Users className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              Community Financial Wisdom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--accent)]">
                <p className="text-sm text-[var(--foreground)] mb-2">
                  "I negotiated a 15% raise by documenting all my achievements over the past year. The key was showing concrete numbers!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">— Sarah, Software Engineer</span>
                  <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                    234 found helpful
                  </Badge>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--accent)]">
                <p className="text-sm text-[var(--foreground)] mb-2">
                  "Started investing $50/month at 25. Now at 35, my portfolio has grown to $15k. Start small, but start now!"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">— Maria, Marketing Manager</span>
                  <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                    189 found helpful
                  </Badge>
                </div>
              </div>
            </div>
            <Link href="/circles">
              <Button variant="outline" className="w-full mt-4 border-[var(--color-aurora-purple)] text-[var(--color-aurora-purple)]">
                Join Finance Circle
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Premium CTA */}
        {user && !user.isPremium && (
          <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] border-0 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Star className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Unlock Premium Financial Tools</h3>
                  <p className="text-white/80 text-sm">Get personalized AI advice, advanced analytics & exclusive courses</p>
                </div>
                <Link href="/premium">
                  <Button className="bg-white text-[var(--color-aurora-purple)] hover:bg-white/90">
                    Upgrade
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
