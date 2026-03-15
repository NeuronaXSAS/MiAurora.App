"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Award,
  Info,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useAuthSession } from "@/hooks/use-auth-session";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import {
  fadeInUp,
  staggerFast,
  staggerMedium,
  staggerChild,
  staggerChildScale,
  hoverLift,
  scrollFadeIn,
  scrollTrigger,
} from "@/lib/motion";

export default function CreditsPage() {
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const { authToken, userId } = useAuthSession();

  const stats = useQuery(
    api.credits.getCreditStats,
    userId && authToken ? { authToken, userId } : "skip"
  );

  const transactions = useQuery(
    api.credits.getTransactionHistory,
    userId && authToken ? { authToken, userId, limit: 100, type: filterType } : "skip"
  );

  const exportData = useQuery(
    api.credits.exportTransactions,
    userId && authToken ? { authToken, userId } : "skip"
  );

  const handleExport = () => {
    if (!exportData) return;

    const csv = [
      ["Date", "Type", "Amount", "Description"],
      ...exportData.map((t: any) => [
        t.date,
        t.type,
        t.amount,
        t.description,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurora-credits-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header - Aurora Gradient */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-violet)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-blue)] text-white relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-aurora-pink)]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 bg-[var(--color-aurora-yellow)] rounded-full flex items-center justify-center shadow-lg">
              <Coins className="w-6 h-6 text-[var(--color-aurora-violet)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Credit Center</h1>
              <p className="text-sm sm:text-base text-white/80">
                Track your earnings and spending
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              variants={staggerFast}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              <motion.div variants={staggerChildScale} className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <p className="text-xs sm:text-sm text-white/80">
                  Current Balance
                </p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--color-aurora-yellow)]">
                  {stats.currentBalance}
                </p>
              </motion.div>
              <motion.div variants={staggerChildScale} className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <p className="text-xs sm:text-sm text-white/80">
                  Total Earned
                </p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--color-aurora-mint)]">
                  +{stats.totalEarned}
                </p>
              </motion.div>
              <motion.div variants={staggerChildScale} className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <p className="text-xs sm:text-sm text-white/80">
                  Total Spent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-[var(--color-aurora-pink)]">
                  -{stats.totalSpent}
                </p>
              </motion.div>
              <motion.div variants={staggerChildScale} className="bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                <p className="text-xs sm:text-sm text-white/80">
                  This Month
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.monthlyEarned}/{stats.monthlyLimit}
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Monthly Limit Info */}
          {stats && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Card className="glass-card shadow-premium">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--color-aurora-yellow)]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-[var(--foreground)]">Monthly Credit Limit</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">
                      You can earn up to {stats.monthlyLimit} credits per month.
                      You have {stats.monthlyRemaining} credits remaining this
                      month.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Resets in {stats.daysUntilReset} day
                            {stats.daysUntilReset !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-[var(--color-aurora-yellow)] font-semibold">
                          {Math.round((stats.monthlyEarned / stats.monthlyLimit) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--accent)] rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(5, (stats.monthlyEarned / stats.monthlyLimit) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* How to Earn Credits */}
          <motion.div variants={scrollFadeIn} initial="hidden" whileInView="visible" viewport={scrollTrigger}>
          <Card className="glass-card shadow-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                <TrendingUp className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                How to Earn Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Earn credits by contributing to the community. Your actions help other women stay safe!
              </p>
              <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={scrollTrigger} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { action: "Create a public post", credits: 10, icon: "📝" },
                  { action: "Share a safe route", credits: 50, icon: "🗺️" },
                  { action: "Verify another post", credits: 5, icon: "✅" },
                  { action: "Complete your profile", credits: 10, icon: "👤" },
                  { action: "Upload a reel", credits: 20, icon: "🎬" },
                  { action: "Daily check-in", credits: 5, icon: "📍" },
                  { action: "Invite a friend", credits: 15, icon: "👥" },
                  { action: "Report a workplace", credits: 25, icon: "🏢" },
                  { action: "Complete meditation", credits: 5, icon: "🧘" },
                  { action: "Viral reel (1000+ views)", credits: 50, icon: "🔥" },
                ].map((item) => (
                  <motion.div
                    key={item.action}
                    variants={staggerChild}
                    {...hoverLift}
                    className="flex items-center justify-between p-3 bg-[var(--accent)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/50 transition-colors hover:bg-[var(--accent)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {item.action}
                      </span>
                    </div>
                    <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">
                      +{item.credits}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
          </motion.div>

          {/* How to Spend Credits */}
          <motion.div variants={scrollFadeIn} initial="hidden" whileInView="visible" viewport={scrollTrigger}>
          <Card className="glass-card shadow-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                <TrendingDown className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                How to Spend Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Use your credits to unlock exclusive opportunities and features.
              </p>
              <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={scrollTrigger} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { action: "Unlock job opportunity", credits: "5-50", icon: "💼" },
                  { action: "Access mentorship", credits: "20-100", icon: "🎓" },
                  { action: "Premium AI features", credits: "10", icon: "🤖" },
                  { action: "Boost your post", credits: "25", icon: "🚀" },
                ].map((item) => (
                  <motion.div
                    key={item.action}
                    variants={staggerChild}
                    {...hoverLift}
                    className="flex items-center justify-between p-3 bg-[var(--accent)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/50 transition-colors hover:bg-[var(--accent)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {item.action}
                      </span>
                    </div>
                    <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0">
                      -{item.credits}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Your Earning Breakdown */}
          {stats && Object.keys(stats.earnedByType).length > 0 && (
            <motion.div variants={scrollFadeIn} initial="hidden" whileInView="visible" viewport={scrollTrigger}>
            <Card className="glass-card shadow-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                  <Award className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  Your Earnings Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={scrollTrigger} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(stats.earnedByType).map(([type, amount]) => (
                    <motion.div
                      key={type}
                      variants={staggerChild}
                      {...hoverLift}
                      className="flex items-center justify-between p-3 bg-[var(--accent)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)]/50"
                    >
                      <span className="text-sm font-medium capitalize text-[var(--foreground)]">
                        {type.replace(/_/g, " ")}
                      </span>
                      <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-[var(--color-aurora-mint)]/30">
                        +{amount as number}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Transaction History */}
          <motion.div variants={scrollFadeIn} initial="hidden" whileInView="visible" viewport={scrollTrigger}>
          <Card className="glass-card shadow-premium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[var(--foreground)]">Transaction History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!exportData}
                  className="border-[var(--border)]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <Button
                  variant={filterType === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(undefined)}
                  className={filterType === undefined ? "bg-[var(--color-aurora-purple)]" : ""}
                >
                  All
                </Button>
                <Button
                  variant={filterType === "earned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("earned")}
                  className={filterType === "earned" ? "bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]" : ""}
                >
                  Earned
                </Button>
                <Button
                  variant={filterType === "spent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("spent")}
                  className={filterType === "spent" ? "bg-[var(--color-aurora-pink)] text-[var(--color-aurora-violet)]" : ""}
                >
                  Spent
                </Button>
              </div>

              {/* Transactions List */}
              {!transactions && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[var(--muted-foreground)]">Loading transactions...</p>
                </div>
              )}

              {transactions && transactions.length === 0 && (
                <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center py-8">
                  <Coins className="w-16 h-16 text-[var(--color-aurora-yellow)]/30 mx-auto mb-4" />
                  <p className="text-[var(--muted-foreground)]">No transactions yet</p>
                </motion.div>
              )}

              {transactions && transactions.length > 0 && (
                <motion.div variants={staggerFast} initial="hidden" animate="visible" className="space-y-2">
                  {transactions.map((transaction: any) => (
                    <motion.div
                      key={transaction._id}
                      variants={staggerChild}
                      className="flex items-center justify-between p-3 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            transaction.amount > 0
                              ? "bg-[var(--color-aurora-mint)]/20"
                              : "bg-[var(--color-aurora-pink)]/20"
                          }`}
                        >
                          {transaction.amount > 0 ? (
                            <TrendingUp className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-[var(--foreground)]">
                            {transaction.formattedType}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {formatDistanceToNow(transaction._creationTime, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p
                          className={`font-bold ${
                            transaction.amount > 0
                              ? "text-[var(--color-aurora-mint)]"
                              : "text-[var(--color-aurora-pink)]"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
