"use client";

import { useState, useEffect } from "react";
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

export default function CreditsPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

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

  const stats = useQuery(
    api.credits.getCreditStats,
    userId ? { userId } : "skip"
  );

  const transactions = useQuery(
    api.credits.getTransactionHistory,
    userId ? { userId, limit: 100, type: filterType } : "skip"
  );

  const exportData = useQuery(
    api.credits.exportTransactions,
    userId ? { userId } : "skip"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-8 h-8" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Credit Center</h1>
              <p className="text-sm sm:text-base text-purple-100">
                Track your earnings and spending
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-purple-100">
                  Current Balance
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.currentBalance}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-purple-100">
                  Total Earned
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-300">
                  +{stats.totalEarned}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-purple-100">
                  Total Spent
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-300">
                  -{stats.totalSpent}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-purple-100">
                  This Month
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {stats.monthlyEarned}/{stats.monthlyLimit}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Monthly Limit Info */}
          {stats && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Monthly Credit Limit</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You can earn up to {stats.monthlyLimit} credits per month.
                      You have {stats.monthlyRemaining} credits remaining this
                      month.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          Resets in {stats.daysUntilReset} day
                          {stats.daysUntilReset !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (stats.monthlyEarned / stats.monthlyLimit) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Earning Breakdown */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  How You Earn Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(stats.earnedByType).map(([type, amount]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium capitalize">
                        {type.replace(/_/g, " ")}
                      </span>
                      <Badge className="bg-green-100 text-green-700">
                        +{amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!exportData}
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
                >
                  All
                </Button>
                <Button
                  variant={filterType === "earned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("earned")}
                >
                  Earned
                </Button>
                <Button
                  variant={filterType === "spent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("spent")}
                >
                  Spent
                </Button>
              </div>

              {/* Transactions List */}
              {!transactions && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading transactions...</p>
                </div>
              )}

              {transactions && transactions.length === 0 && (
                <div className="text-center py-8">
                  <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                </div>
              )}

              {transactions && transactions.length > 0 && (
                <div className="space-y-2">
                  {transactions.map((transaction: any) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            transaction.amount > 0
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {transaction.amount > 0 ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {transaction.formattedType}
                          </p>
                          <p className="text-xs text-gray-500">
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
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
