"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  Gift, 
  ArrowUpRight, 
  ArrowDownLeft,
  Sparkles,
  Shield,
  Heart,
  Users,
  Zap,
  ChevronRight,
  Clock,
  Star,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

interface AuroraWalletProps {
  userId: Id<"users">;
  compact?: boolean;
}

export function AuroraWallet({ userId, compact = false }: AuroraWalletProps) {
  const [showEarnOptions, setShowEarnOptions] = useState(false);
  
  const user = useQuery(api.users.getUser, { userId });
  const creditStats = useQuery(api.credits.getCreditStats, { userId });
  const recentTransactions = useQuery(api.credits.getTransactionHistory, { userId, limit: 5 });

  const balance = user?.credits || 0;
  const monthlyEarned = creditStats?.monthlyEarned || 0;
  const monthlyLimit = creditStats?.monthlyLimit || 500;

  const quickEarnActions = [
    { 
      id: "daily-login", 
      title: "Daily Check-in", 
      credits: 5, 
      icon: Clock, 
      available: true,
      description: "Claim your daily reward"
    },
    { 
      id: "safety-rating", 
      title: "Rate a Location", 
      credits: 25, 
      icon: Shield, 
      available: true,
      description: "Help others stay safe",
      href: "/map"
    },
    { 
      id: "post", 
      title: "Share Experience", 
      credits: 10, 
      icon: Heart, 
      available: true,
      description: "Post about a place",
      href: "/feed"
    },
    { 
      id: "invite", 
      title: "Invite a Friend", 
      credits: 100, 
      icon: Users, 
      available: true,
      description: "Both get 100 credits!"
    },
  ];

  const getTransactionIcon = (type: string) => {
    if (type.includes('gift')) return Gift;
    if (type.includes('engagement')) return Sparkles;
    if (type.includes('safety')) return Shield;
    if (type.includes('referral')) return Users;
    return Coins;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-green-500" : "text-[var(--color-aurora-salmon)]";
  };

  if (compact) {
    return (
      <Link href="/wallet">
        <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-purple)]/30 hover:border-[var(--color-aurora-purple)]/50 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-yellow)] rounded-xl flex items-center justify-center">
                  <Coins className="w-5 h-5 text-[var(--color-aurora-violet)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Balance</p>
                  <p className="text-xl font-bold text-[var(--foreground)]">{balance}</p>
                </div>
              </div>
              <Button size="sm" className="bg-[var(--color-aurora-purple)] min-h-[36px]">
                <Zap className="w-4 h-4 mr-1" /> Earn
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)] text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm mb-1">Aurora Credits</p>
              <p className="text-4xl font-bold">{balance}</p>
            </div>
            <div className="w-12 h-12 bg-[var(--color-aurora-yellow)] rounded-2xl flex items-center justify-center">
              <Coins className="w-6 h-6 text-[var(--color-aurora-violet)]" />
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/80">Monthly Earnings</span>
              <span className="text-sm font-medium">{monthlyEarned}/{monthlyLimit}</span>
            </div>
            <Progress value={(monthlyEarned / monthlyLimit) * 100} className="h-2 bg-white/20" />
            <p className="text-xs text-white/60 mt-1">
              {monthlyLimit - monthlyEarned} credits available to earn this month
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => setShowEarnOptions(!showEarnOptions)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white min-h-[44px]"
            >
              <TrendingUp className="w-4 h-4 mr-2" /> Earn Credits
            </Button>
            <Link href="/premium" className="flex-1">
              <Button className="w-full bg-[var(--color-aurora-yellow)] hover:bg-[var(--color-aurora-yellow)]/90 text-[var(--color-aurora-violet)] min-h-[44px]">
                <Star className="w-4 h-4 mr-2" /> Get Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Earn Options */}
      <AnimatePresence>
        {showEarnOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  Quick Ways to Earn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickEarnActions.map((action) => (
                  <Link key={action.id} href={action.href || "#"}>
                    <div className="flex items-center justify-between p-3 bg-[var(--accent)] rounded-xl hover:bg-[var(--accent)]/80 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center">
                          <action.icon className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[var(--foreground)]">{action.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{action.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">
                        +{action.credits}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Transactions */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/wallet/history">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((tx: any) => {
                const Icon = getTransactionIcon(tx.type);
                return (
                  <div key={tx._id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.amount > 0 ? "bg-green-500/20" : "bg-[var(--color-aurora-salmon)]/20"
                      }`}>
                        {tx.amount > 0 ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)] capitalize">
                          {tx.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {new Date(tx._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${getTransactionColor(tx.amount)}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Coins className="w-10 h-10 text-[var(--muted-foreground)]/30 mx-auto mb-2" />
              <p className="text-sm text-[var(--muted-foreground)]">No transactions yet</p>
              <p className="text-xs text-[var(--muted-foreground)]">Start earning credits!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
