"use client";

/**
 * Aurora App - Admin Dashboard 2.0
 * 
 * Complete admin control center with:
 * - Real-time stats via Convex subscriptions
 * - Broadcast messaging to all users
 * - Daily News curation
 * - API resource monitoring
 * - User engagement analytics
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, FileText, MapPin, Video, Radio, Shield, Briefcase, MessageSquare,
  Coins, TrendingUp, AlertTriangle, Crown, Activity, Eye, Clock, UserPlus,
  Heart, Send, Newspaper, Bell, Megaphone, Settings, BarChart3, Zap,
  RefreshCw, Globe, Search, Sparkles, Target, Gift
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel";
import { ResourceMonitor } from "@/components/admin/resource-monitor";
import { DailyDebatesAdmin } from "@/components/admin/daily-debates-admin";
import { DebatesMonitor } from "@/components/admin/debates-monitor";

export default function AdminDashboard() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
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
  
  // Get dashboard stats (real-time via Convex)
  const stats = useQuery(
    api.admin.getDashboardStats, 
    userId && isAdmin ? { userId } : "skip"
  );
  
  // Get recent activity
  const recentActivity = useQuery(
    api.admin.getRecentActivity,
    userId && isAdmin ? { userId, limit: 20 } : "skip"
  );

  // Loading state
  if (isLoading || isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Verifying admin access...</p>
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

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
              <Crown className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
              Admin Command Center
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Real-time Aurora App control & analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] px-3 py-1">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Live Sync
            </Badge>
            <Badge className="bg-[var(--color-aurora-purple)] text-white px-3 py-1">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              {stats?.users?.total || 0} Users
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="debates" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Debates</span>
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Broadcast</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <OverviewStats stats={stats} />
          </TabsContent>

          {/* Debates Monitor Tab - Real-time analytics & archive */}
          <TabsContent value="debates" className="mt-6">
            <DebatesMonitor />
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="mt-6">
            <BroadcastCenter userId={userId} />
          </TabsContent>

          {/* Content Tab - Daily Debates Management */}
          <TabsContent value="news" className="mt-6">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-6">
                <DailyDebatesAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="mt-6">
            <ResourceMonitor />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <ActivityFeed activity={recentActivity} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--muted-foreground)] py-4">
          Aurora App Admin Dashboard • Data refreshes in real-time via Convex • 
          <span className="text-[var(--color-aurora-purple)]"> Made with 💜 for women everywhere</span>
        </div>
      </div>
    </div>
  );
}

// Overview Stats Component
function OverviewStats({ stats }: { stats: any }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-[var(--card)] border-[var(--border)] animate-pulse">
            <CardContent className="p-4 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconColor="text-[var(--color-aurora-purple)]"
          value={stats.users.total}
          label="Total Users"
          badge={`+${stats.users.newToday} today`}
          badgeColor="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
        />
        <StatCard
          icon={Crown}
          iconColor="text-[var(--color-aurora-yellow)]"
          value={stats.users.premium}
          label="Premium Users"
          badge={`${stats.users.premiumRate}%`}
          badgeColor="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
        />
        <StatCard
          icon={FileText}
          iconColor="text-[var(--color-aurora-blue)]"
          value={stats.content.posts}
          label="Total Posts"
          badge={`+${stats.content.postsToday} today`}
          badgeColor="bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)]"
        />
        <StatCard
          icon={MapPin}
          iconColor="text-[var(--color-aurora-mint)]"
          value={stats.content.routes}
          label="Safety Routes"
          badge={`${stats.content.publicRoutes} public`}
          badgeColor="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
        />
        <StatCard
          icon={Video}
          iconColor="text-[var(--color-aurora-pink)]"
          value={stats.content.reels}
          label="Reels Created"
          badge={`${(stats.content.reelViews / 1000).toFixed(1)}k views`}
          badgeColor="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]"
        />
        <StatCard
          icon={Radio}
          iconColor="text-red-500"
          value={stats.live.totalLivestreams}
          label="Total Streams"
          badge={stats.live.activeLivestreams > 0 ? `${stats.live.activeLivestreams} LIVE` : "None live"}
          badgeColor={stats.live.activeLivestreams > 0 ? "bg-red-500 text-white animate-pulse" : "bg-[var(--muted)]/50"}
        />
        <StatCard
          icon={AlertTriangle}
          iconColor={stats.safety.activeEmergencies > 0 ? "text-[var(--color-aurora-orange)]" : "text-[var(--muted-foreground)]"}
          value={stats.safety.activeEmergencies > 0 ? stats.safety.activeEmergencies : stats.safety.totalEmergencies}
          label={stats.safety.activeEmergencies > 0 ? "Active Emergencies!" : "Total Alerts"}
          badge={`${stats.safety.emergencyResponseRate}% resolved`}
          badgeColor="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
          highlight={stats.safety.activeEmergencies > 0}
        />
        <StatCard
          icon={Coins}
          iconColor="text-[var(--color-aurora-yellow)]"
          value={stats.economy.totalCredits.toLocaleString()}
          label="Credits in Circulation"
          badge={`Avg: ${stats.economy.avgTrustScore}`}
          badgeColor="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
        />
      </div>

      {/* Community Stats */}
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
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  iconColor, 
  value, 
  label, 
  badge, 
  badgeColor,
  highlight = false 
}: {
  icon: any;
  iconColor: string;
  value: number | string;
  label: string;
  badge: string;
  badgeColor: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`bg-[var(--card)] border-[var(--border)] ${highlight ? 'ring-2 ring-[var(--color-aurora-orange)]' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <Badge className={`text-xs ${badgeColor}`}>{badge}</Badge>
        </div>
        <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      </CardContent>
    </Card>
  );
}

// Broadcast Center Component
function BroadcastCenter({ userId }: { userId: Id<"users"> | null }) {
  const [broadcastType, setBroadcastType] = useState<"all" | "premium" | "new">("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const sendBroadcast = useMutation(api.admin.sendBroadcast);

  const handleSend = async () => {
    if (!title || !message || !userId) return;
    
    setIsSending(true);
    try {
      const result = await sendBroadcast({
        adminId: userId,
        targetAudience: broadcastType,
        title,
        message,
        actionUrl: actionUrl || undefined,
      });
      setSentCount(result.sentTo);
      setTitle("");
      setMessage("");
      setActionUrl("");
    } catch (error) {
      console.error("Broadcast error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const templates = [
    { 
      title: "Welcome to Aurora App! 💜", 
      message: "We're so glad you're here. Explore safety routes, connect with sisters, and discover opportunities. Your journey starts now!",
      icon: Sparkles
    },
    { 
      title: "New Feature Alert! 🚀", 
      message: "We just launched something amazing! Check out our latest feature designed just for you.",
      icon: Zap
    },
    { 
      title: "Safety Tip of the Day 🛡️", 
      message: "Remember to share your location with trusted contacts when traveling. Stay safe, sister!",
      icon: Shield
    },
    { 
      title: "Community Spotlight ✨", 
      message: "Our community is growing! Join a Circle today and connect with like-minded women.",
      icon: Heart
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Compose Broadcast */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Megaphone className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Send Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audience Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Target Audience
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "all", label: "All Users", icon: Users },
                { value: "premium", label: "Premium", icon: Crown },
                { value: "new", label: "New Users", icon: UserPlus },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBroadcastType(opt.value as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    broadcastType === opt.value
                      ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                      : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50"
                  }`}
                >
                  <opt.icon className={`w-5 h-5 ${broadcastType === opt.value ? "text-[var(--color-aurora-purple)]" : "text-[var(--muted-foreground)]"}`} />
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              className="w-full h-10 px-3 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message to the community..."
              className="w-full p-3 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)] resize-none h-24"
            />
          </div>

          {/* Action URL */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Action URL (optional)
            </label>
            <input
              type="url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/feed, /premium, /circles..."
              className="w-full h-10 px-3 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)]"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!title || !message || isSending}
            className="w-full bg-[var(--color-aurora-purple)] min-h-[48px]"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? "Sending..." : "Send Broadcast"}
          </Button>

          {sentCount > 0 && (
            <div className="p-3 rounded-lg bg-[var(--color-aurora-mint)]/20 text-center">
              <p className="text-sm text-[var(--color-aurora-mint)]">
                ✓ Sent to {sentCount} users!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Target className="w-5 h-5 text-[var(--color-aurora-pink)]" />
            Quick Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template, i) => (
            <button
              key={i}
              onClick={() => {
                setTitle(template.title);
                setMessage(template.message);
              }}
              className="w-full p-4 rounded-xl border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 hover:bg-[var(--accent)]/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-aurora-purple)]/10 flex items-center justify-center">
                  <template.icon className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--foreground)] text-sm">{template.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">{template.message}</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({ activity }: { activity: any[] | undefined }) {
  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-[var(--foreground)]">
          <TrendingUp className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          Recent Activity
          <Badge className="ml-auto bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {activity?.map((item: any, index: number) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--accent)]/50 hover:bg-[var(--accent)] transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                item.type === 'user_joined' ? 'bg-[var(--color-aurora-purple)]/20' :
                item.type === 'post_created' ? 'bg-[var(--color-aurora-blue)]/20' :
                item.type === 'emergency_alert' ? 'bg-[var(--color-aurora-orange)]/20' :
                item.type === 'livestream' ? 'bg-red-500/20' :
                'bg-[var(--muted)]/50'
              }`}>
                {item.type === 'user_joined' && <UserPlus className="w-5 h-5 text-[var(--color-aurora-purple)]" />}
                {item.type === 'post_created' && <FileText className="w-5 h-5 text-[var(--color-aurora-blue)]" />}
                {item.type === 'emergency_alert' && <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-orange)]" />}
                {item.type === 'livestream' && <Radio className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {item.type === 'user_joined' && `${item.data.name} joined Aurora App`}
                  {item.type === 'post_created' && `New ${item.data.dimension} post: "${item.data.title}"`}
                  {item.type === 'emergency_alert' && `Emergency alert from ${item.data.user}`}
                  {item.type === 'livestream' && `${item.data.host} ${item.data.status === 'live' ? 'went live' : 'streamed'}: "${item.data.title}"`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {(!activity || activity.length === 0) && (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
