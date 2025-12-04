"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins,
  TrendingUp,
  Users,
  Gift,
  Calendar,
  Video,
  FileText,
  Crown,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface CreatorDashboardProps {
  userId: Id<"users">;
}

export function CreatorDashboard({ userId }: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const user = useQuery(api.users.getUser, { userId });
  const giftEarnings = useQuery(api.gifts.getCreatorGiftEarnings, { creatorId: userId });
  const creditStats = useQuery(api.credits.getCreditStats, { userId });
  const referralStats = useQuery(api.credits.getReferralStats, { userId });

  // Loading state
  if (!user || !creditStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
      </div>
    );
  }

  // Calculate total earnings
  const totalEarnings = useMemo(() => {
    const gifts = giftEarnings?.totalEarnings || 0;
    const referrals = referralStats?.totalCreditsEarned || 0;
    return gifts + referrals;
  }, [giftEarnings, referralStats]);

  // Calculate fee tier (10% for 1000+ subscribers, 15% default)
  const subscriberCount = 0; // TODO: Get from creatorSubscribers query
  const platformFeeRate = subscriberCount >= 1000 ? 0.10 : 0.15;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-yellow)]/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Balance</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {user.credits.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-mint)]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[var(--color-aurora-violet)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Total Earned</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-pink)]/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-[var(--color-aurora-pink)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Gifts Received</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {giftEarnings?.totalGifts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-aurora-purple)]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Referrals</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {referralStats?.totalReferrals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Fee Info */}
      <Card className="border-[var(--color-aurora-lavender)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              <div>
                <p className="font-medium text-[var(--foreground)]">
                  Platform Fee: {(platformFeeRate * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {subscriberCount >= 1000 
                    ? "Reduced rate for 1000+ subscribers" 
                    : `Get 1000+ subscribers to reduce to 10%`}
                </p>
              </div>
            </div>
            {subscriberCount < 1000 && (
              <Badge className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                {1000 - subscriberCount} to go
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {giftEarnings?.recentGifts && giftEarnings.recentGifts.length > 0 ? (
                  <div className="space-y-3">
                    {giftEarnings.recentGifts.slice(0, 5).map((gift, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-[var(--muted)]/50">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                          <span className="text-sm text-[var(--foreground)]">
                            Gift received
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--color-aurora-yellow)]">
                          +{gift.creatorEarnings}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Credits Earned</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                    <span className="font-medium text-[var(--foreground)]">
                      {creditStats.monthlyEarned}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Credits Spent</span>
                  <div className="flex items-center gap-1">
                    <ArrowDownRight className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                    <span className="font-medium text-[var(--foreground)]">
                      {creditStats.totalSpent}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Monthly Limit</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {creditStats.monthlyRemaining} / {creditStats.monthlyLimit}
                  </span>
                </div>
                <div className="w-full bg-[var(--muted)] rounded-full h-2">
                  <div 
                    className="bg-[var(--color-aurora-purple)] h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, (creditStats.monthlyEarned / creditStats.monthlyLimit) * 100)}%` 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(creditStats.earnedByType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-aurora-yellow)]/20 flex items-center justify-center">
                        {type.includes('gift') ? (
                          <Gift className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                        ) : type.includes('referral') ? (
                          <Users className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                        ) : (
                          <Coins className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                        )}
                      </div>
                      <span className="text-sm text-[var(--foreground)] capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="font-medium text-[var(--color-aurora-yellow)]">
                      +{(amount as number).toLocaleString()}
                    </span>
                  </div>
                ))}
                
                {Object.keys(creditStats.earnedByType).length === 0 && (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
                    Start creating content to earn credits!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--color-aurora-blue)]/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[var(--color-aurora-blue)]" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">Posts</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Share experiences and earn credits
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--color-aurora-purple)]/10 flex items-center justify-center">
                  <Video className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">Reels</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Create short videos for engagement
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--color-aurora-pink)]/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[var(--color-aurora-pink)]" />
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-1">Events</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Host paid or free events
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
