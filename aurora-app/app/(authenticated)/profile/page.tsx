"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle2,
  Briefcase,
  Award,
  Calendar,
  MapPin,
  Target,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export default function ProfilePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  // Get user ID
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

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Fetch user stats
  const stats = useQuery(
    api.users.getUserStats,
    userId ? { userId } : "skip"
  );

  // Fetch transaction history
  const transactions = useQuery(
    api.users.getTransactionHistory,
    userId ? { userId, limit: 10 } : "skip"
  );

  // Fetch recent posts
  const recentPosts = useQuery(
    api.posts.getUserRecent,
    userId ? { userId, limit: 5 } : "skip"
  );

  // Calculate badges
  const badges = [];
  if (stats) {
    if (stats.totalPosts >= 1) badges.push({ name: "First Contributor", icon: "🎉" });
    if (stats.totalPosts >= 10) badges.push({ name: "Active Contributor", icon: "⭐" });
    if (stats.totalVerifications >= 10) badges.push({ name: "Top Verifier", icon: "✅" });
    if (stats.womenHelped >= 50) badges.push({ name: "Community Helper", icon: "💝" });
    if (user && user.trustScore >= 100) badges.push({ name: "Trusted Member", icon: "🏆" });
  }

  // Calculate rank percentile (simplified)
  const getRankPercentile = (trustScore: number) => {
    if (trustScore >= 500) return "Top 1%";
    if (trustScore >= 200) return "Top 5%";
    if (trustScore >= 100) return "Top 10%";
    if (trustScore >= 50) return "Top 25%";
    return "Top 50%";
  };

  if (!user || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border-4 border-white">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="text-2xl sm:text-3xl bg-white text-purple-600">
                {(user.name && user.name !== 'null' ? user.name : 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {user.name && user.name !== 'null' ? user.name : 'User'}
              </h1>
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                {user.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.industry}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Joined {formatDistanceToNow(user._creationTime, { addSuffix: true })}</span>
                  <span className="sm:hidden">Member</span>
                </div>
              </div>
              {user.bio && (
                <div className="bg-white/10 rounded-lg p-2 sm:p-3 mb-2">
                  <p className="text-xs sm:text-sm">{user.bio}</p>
                </div>
              )}
              {user.careerGoals && (
                <div className="flex items-start gap-2 bg-white/10 rounded-lg p-2 sm:p-3">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">{user.careerGoals}</p>
                </div>
              )}
              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.interests.map((interest: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{user.credits}</p>
                      <p className="text-sm text-gray-600">Available to spend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Monthly Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{user.monthlyCreditsEarned || 0}</p>
                      <p className="text-sm text-gray-600">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{user.trustScore}</p>
                      <p className="text-sm text-gray-600">{getRankPercentile(user.trustScore)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Posts Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totalPosts}</p>
                      <p className="text-sm text-gray-600">Contributions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{stats.totalVerifications}</p>
                      <p className="text-sm text-gray-600">Posts verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-white">{stats.womenHelped}</span>
                  </div>
                  <p className="text-2xl font-bold mb-2">Women Helped</p>
                  <p className="text-gray-600">
                    Your contributions have been verified {stats.womenHelped} times, helping other women make informed decisions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <span className={tx.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {tx.amount > 0 ? '+' : ''}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {tx.type === 'post_created' && 'Created a post'}
                              {tx.type === 'verification' && 'Verified a post'}
                              {tx.type === 'opportunity_unlock' && 'Unlocked opportunity'}
                              {tx.type === 'signup_bonus' && 'Signup bonus'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(tx._creationTime, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={tx.amount > 0 ? "default" : "secondary"}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Badges & Recent Posts */}
          <div className="space-y-6">
            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 text-center"
                      >
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <p className="text-xs font-medium">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Earn badges by contributing!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPosts && recentPosts.length > 0 ? (
                    recentPosts.map((post) => (
                      <div key={post._id} className="border-b last:border-0 pb-3 last:pb-0">
                        <p className="font-medium text-sm line-clamp-1">{post.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {post.rating}/5 ⭐
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {post.verificationCount} verifications
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No posts yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
