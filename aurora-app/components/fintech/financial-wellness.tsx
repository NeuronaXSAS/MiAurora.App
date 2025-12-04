"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  Target,
  Sparkles,
  ChevronRight,
  Lock,
  Coins,
  BookOpen,
  Award,
  Calculator,
  Shield,
  DollarSign,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

interface FinancialWellnessProps {
  userId: Id<"users">;
  compact?: boolean;
}

interface FinancialGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  icon: string;
  color: string;
}

interface FinancialTip {
  id: string;
  title: string;
  description: string;
  category: string;
  credits: number;
}

export function FinancialWellness({ userId, compact = false }: FinancialWellnessProps) {
  const [activeGoal, setActiveGoal] = useState<string | null>(null);

  // Sample financial goals (would come from backend)
  const financialGoals: FinancialGoal[] = [
    { id: "emergency", title: "Emergency Fund", target: 1000, current: 350, icon: "🛡️", color: "from-[var(--color-aurora-mint)] to-emerald-400" },
    { id: "savings", title: "Savings Goal", target: 500, current: 125, icon: "💰", color: "from-[var(--color-aurora-yellow)] to-amber-400" },
    { id: "investment", title: "First Investment", target: 250, current: 50, icon: "📈", color: "from-[var(--color-aurora-purple)] to-indigo-400" },
  ];

  const financialTips: FinancialTip[] = [
    { id: "1", title: "50/30/20 Budget Rule", description: "Learn the basics of budgeting", category: "Budgeting", credits: 10 },
    { id: "2", title: "Emergency Fund Basics", description: "Why you need 3-6 months saved", category: "Savings", credits: 10 },
    { id: "3", title: "Investing 101", description: "Start your investment journey", category: "Investing", credits: 15 },
    { id: "4", title: "Negotiate Your Salary", description: "Tips for women in the workplace", category: "Career", credits: 20 },
  ];

  const financialResources = [
    { id: "calculator", title: "Budget Calculator", icon: Calculator, description: "Plan your monthly budget", href: "/finance/calculator" },
    { id: "courses", title: "Financial Courses", icon: BookOpen, description: "Learn money management", href: "/finance/courses" },
    { id: "community", title: "Money Circles", icon: PiggyBank, description: "Join savings groups", href: "/circles?category=financial" },
  ];

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/10 to-[var(--color-aurora-mint)]/10 border-[var(--color-aurora-yellow)]/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
              <span className="font-semibold text-[var(--foreground)]">Financial Wellness</span>
            </div>
            <Link href="/finance">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {/* Quick Goal Progress */}
          <div className="space-y-2">
            {financialGoals.slice(0, 2).map((goal) => (
              <div key={goal.id} className="bg-[var(--card)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--foreground)]">{goal.icon} {goal.title}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    ${goal.current}/${goal.target}
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Financial Wellness</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Build your financial future 💰</p>
        </div>
        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">
          <TrendingUp className="w-3 h-3 mr-1" /> Growing
        </Badge>
      </div>

      {/* Financial Score Card */}
      <Card className="bg-gradient-to-br from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-mint)]/20 border-[var(--color-aurora-yellow)]/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Financial Health Score</p>
              <p className="text-4xl font-bold text-[var(--foreground)]">72</p>
              <p className="text-xs text-[var(--color-aurora-mint)]">+5 from last month</p>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="35" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle 
                  cx="40" cy="40" r="35" 
                  fill="none" 
                  stroke="var(--color-aurora-yellow)" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${72 * 2.2} 220`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Savings", value: "Good", color: "text-green-500" },
              { label: "Budget", value: "Fair", color: "text-[var(--color-aurora-yellow)]" },
              { label: "Goals", value: "3 Active", color: "text-[var(--color-aurora-purple)]" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-2 bg-[var(--card)] rounded-lg">
                <p className={`font-semibold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Goals */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Your Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {financialGoals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.01 }}
                className="p-4 bg-[var(--accent)] rounded-xl cursor-pointer"
                onClick={() => setActiveGoal(activeGoal === goal.id ? null : goal.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${goal.color} flex items-center justify-center text-lg`}>
                      {goal.icon}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{goal.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        ${goal.current} of ${goal.target}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-[var(--foreground)]">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                
                {activeGoal === goal.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-[var(--border)]"
                  >
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-[var(--color-aurora-purple)]">
                        <DollarSign className="w-4 h-4 mr-1" /> Add Funds
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Edit Goal
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          
          <Button variant="outline" className="w-full min-h-[44px]">
            <Target className="w-4 h-4 mr-2" /> Create New Goal
          </Button>
        </CardContent>
      </Card>

      {/* Financial Education */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-aurora-blue)]" />
            Learn & Earn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {financialTips.map((tip) => (
            <Link key={tip.id} href={`/finance/learn/${tip.id}`}>
              <div className="flex items-center justify-between p-3 bg-[var(--accent)] rounded-xl hover:bg-[var(--accent)]/80 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--foreground)]">{tip.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{tip.description}</p>
                </div>
                <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 ml-2">
                  +{tip.credits}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Quick Resources */}
      <div className="grid grid-cols-3 gap-3">
        {financialResources.map((resource) => (
          <Link key={resource.id} href={resource.href}>
            <Card className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-yellow)]/50 transition-all h-full">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 bg-[var(--color-aurora-yellow)]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <resource.icon className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                </div>
                <p className="font-medium text-sm text-[var(--foreground)]">{resource.title}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{resource.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Safety Note */}
      <Card className="bg-[var(--color-aurora-mint)]/10 border-[var(--color-aurora-mint)]/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[var(--color-aurora-mint)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-[var(--foreground)]">Financial Safety</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Aurora App provides educational resources only. Always consult a financial advisor for personalized advice. 
                Your financial data stays private and secure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
