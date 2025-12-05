"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  MapPin, 
  Video, 
  Radio, 
  Shield, 
  Briefcase, 
  MessageSquare,
  Coins,
  TrendingUp,
  AlertTriangle,
  Crown,
  Activity,
  Eye,
  Clock,
  UserPlus,
  Heart,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminDashboard() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Get user ID
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  // Check admin status
  const isAdmin = useQuery(api.admin.isAdmin, userId ? { userId } : "skip");
  
  // Get dashboard stats (only if admin)
  const stats = useQuery(
    api.admin.getDashboardStats, 
    userId && isAdmin ? { userId } : "skip"
  );
  
  // Get recent activity
  const recentActivity = useQuery(
    api.admin.getRecentActivity,
    userId && isAdmin ? { userId, limit: 15 } : "skip"
  );

  // Loading state
  if (isLoading || isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-[var(--card)] border-[var(--border)]">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-[var(--color-aurora-salmon)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[var(--color-aurora-salmon)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Access Denied</h2>
            <p className="text-[var(--muted-foreground)] mb-4">
              This page is restricted to Aurora App administrators only.
            </p>
            <button
              onClick={() => router.push("/feed")}
              className="px-6 py-3 bg-[var(--color-aurora-purple)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Return to Feed
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
              <Crown className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
              Admin Dashboard
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Real-time Aurora App analytics and monitoring
            </p>
          </div>
          <Badge className="bg-[var(--color-aurora-purple)] text-white px-3 py-1">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Users */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                  <Badge variant="secondary" className="text-xs">
                    +{stats.users.newToday} today
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.users.total.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total Users</p>
              </CardContent>
            </Card>

            {/* Premium Users */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] text-xs">
                    {stats.users.premiumRate}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.users.premium.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Premium Users</p>
              </CardContent>
            </Card>

            {/* Posts */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-[var(--color-aurora-blue)]" />
                  <Badge variant="secondary" className="text-xs">
                    +{stats.content.postsToday} today
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.content.posts.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total Posts</p>
              </CardContent>
            </Card>

            {/* Routes */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <MapPin className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                  <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] text-xs">
                    {stats.content.publicRoutes} public
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.content.routes.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Safety Routes</p>
              </CardContent>
            </Card>

            {/* Reels */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Video className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    {(stats.content.reelViews / 1000).toFixed(1)}k
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.content.reels.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Reels Created</p>
              </CardContent>
            </Card>

            {/* Live Streams */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Radio className="w-5 h-5 text-red-500" />
                  {stats.live.activeLivestreams > 0 && (
                    <Badge className="bg-red-500 text-white text-xs animate-pulse">
                      {stats.live.activeLivestreams} LIVE
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.live.totalLivestreams.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total Streams</p>
              </CardContent>
            </Card>

            {/* Emergency Alerts */}
            <Card className={`bg-[var(--card)] border-[var(--border)] ${stats.safety.activeEmergencies > 0 ? 'ring-2 ring-[var(--color-aurora-orange)]' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className={`w-5 h-5 ${stats.safety.activeEmergencies > 0 ? 'text-[var(--color-aurora-orange)] animate-pulse' : 'text-[var(--muted-foreground)]'}`} />
                  <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] text-xs">
                    {stats.safety.emergencyResponseRate}% resolved
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {stats.safety.activeEmergencies > 0 ? (
                    <span className="text-[var(--color-aurora-orange)]">{stats.safety.activeEmergencies}</span>
                  ) : (
                    stats.safety.totalEmergencies
                  )}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {stats.safety.activeEmergencies > 0 ? 'Active Emergencies!' : 'Total Alerts'}
                </p>
              </CardContent>
            </Card>

            {/* Credits Economy */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Coins className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  <Badge variant="secondary" className="text-xs">
                    Avg: {stats.economy.avgTrustScore}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stats.economy.totalCredits.toLocaleString()}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Credits in Circulation</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Community Stats Row */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-aurora-pink)]/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-[var(--color-aurora-pink)]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--foreground)]">{stats.community.circles}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Active Circles</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-aurora-blue)]/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[var(--color-aurora-blue)]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--foreground)]">{stats.community.opportunities}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Active Opportunities</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--foreground)]">{stats.community.messagesToday}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Messages Today</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity Feed */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-[var(--foreground)]">
              <TrendingUp className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentActivity?.map((activity: any, index: number) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent)]/50 hover:bg-[var(--accent)] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'user_joined' ? 'bg-[var(--color-aurora-purple)]/20' :
                    activity.type === 'post_created' ? 'bg-[var(--color-aurora-blue)]/20' :
                    activity.type === 'emergency_alert' ? 'bg-[var(--color-aurora-orange)]/20' :
                    activity.type === 'livestream' ? 'bg-red-500/20' :
                    'bg-[var(--muted)]/50'
                  }`}>
                    {activity.type === 'user_joined' && <UserPlus className="w-5 h-5 text-[var(--color-aurora-purple)]" />}
                    {activity.type === 'post_created' && <FileText className="w-5 h-5 text-[var(--color-aurora-blue)]" />}
                    {activity.type === 'emergency_alert' && <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-orange)]" />}
                    {activity.type === 'livestream' && <Radio className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {activity.type === 'user_joined' && `${activity.data.name} joined Aurora App`}
                      {activity.type === 'post_created' && `New ${activity.data.dimension} post: "${activity.data.title}"`}
                      {activity.type === 'emergency_alert' && `Emergency alert from ${activity.data.user}`}
                      {activity.type === 'livestream' && `${activity.data.host} ${activity.data.status === 'live' ? 'went live' : 'streamed'}: "${activity.data.title}"`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                      {activity.type === 'user_joined' && activity.data.isPremium && (
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] text-[10px]">
                          Premium
                        </Badge>
                      )}
                      {activity.type === 'emergency_alert' && (
                        <Badge className={`text-[10px] ${
                          activity.data.status === 'active' 
                            ? 'bg-[var(--color-aurora-orange)] text-white' 
                            : 'bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]'
                        }`}>
                          {activity.data.status}
                        </Badge>
                      )}
                      {activity.type === 'livestream' && activity.data.status === 'live' && (
                        <Badge className="bg-red-500 text-white text-[10px] animate-pulse">
                          LIVE • {activity.data.viewers} viewers
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!recentActivity || recentActivity.length === 0) && (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--muted-foreground)] py-4">
          Aurora App Admin Dashboard • Data refreshes in real-time via Convex
        </div>
      </div>
    </div>
  );
}
