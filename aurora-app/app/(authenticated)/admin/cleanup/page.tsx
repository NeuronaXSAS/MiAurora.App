"use client";

/**
 * Admin Cleanup & Monitoring Page - Enhanced Version
 *
 * Comprehensive dashboard for monitoring all content and user activity:
 * - Real-time content health monitoring
 * - User activity tracking from landing to deep features
 * - Moderation queue and audit log
 * - Safety metrics and risk assessment
 * - Data quality tools and cleanup actions
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  CheckCircle,
  AlertTriangle,
  Database,
  Video,
  MapPin,
  RefreshCw,
  Shield,
  FileText,
  Users,
  MessageSquare,
  Sparkles,
  Route,
  Eye,
  Heart,
  Globe,
  Zap,
  Activity,
  TrendingUp,
  Clock,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  HeartPulse,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminCleanupPage() {
  const [isRunning, setIsRunning] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any>>({});
  const [selectedContentType, setSelectedContentType] = useState<
    "posts" | "reels" | "routes"
  >("posts");
  const [timeRange, setTimeRange] = useState<number>(24);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["health", "activity"]),
  );

  // Core queries
  const stats = useQuery(api.cleanup.getDataQualityStats);
  const inventory = useQuery(api.cleanup.getContentInventory);
  const brokenReels = useQuery(api.cleanup.listBrokenReels, { limit: 10 });
  const contentBySource = useQuery(api.cleanup.getContentBySource, {
    contentType: selectedContentType,
  });

  // Enhanced monitoring queries
  const activityMetrics = useQuery(api.cleanup.getUserActivityMetrics, {
    timeRangeHours: timeRange,
  });
  const contentHealth = useQuery(api.cleanup.getContentHealthBreakdown);
  const safetyMetrics = useQuery(api.cleanup.getUserSafetyMetrics);
  const feedHealth = useQuery(api.cleanup.getFeedHealthMetrics);
  const moderationLog = useQuery(api.cleanup.getModerationAuditLog, {
    limit: 20,
  });

  // Mutations
  const deleteBrokenReels = useMutation(api.cleanup.deleteBrokenReels);
  const approveValidReels = useMutation(api.cleanup.approveValidPendingReels);
  const deletePostsWithoutLocation = useMutation(
    api.cleanup.deletePostsWithoutLocation,
  );
  const deleteSeededContent = useMutation(api.cleanup.deleteSeededContent);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Convex queries auto-refresh, but we can trigger UI updates here
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runAction = async (
    action: string,
    mutation: unknown,
    args: unknown,
  ) => {
    setIsRunning(action);
    try {
      const result = await (mutation as (args: unknown) => Promise<unknown>)(
        args,
      );
      setResults((prev) => ({ ...prev, [action]: result }));
    } catch (error) {
      setResults((prev) => ({ ...prev, [action]: { error: String(error) } }));
    } finally {
      setIsRunning(null);
    }
  };

  // Toggle section expansion (for future use with collapsible sections)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Aurora Control Center
              </h1>
              <p className="text-[var(--muted-foreground)]">
                Real-time monitoring, moderation & health dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={168}>Last 7 Days</option>
              <option value={720}>Last 30 Days</option>
            </select>

            {/* Auto-refresh Toggle */}
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-[var(--color-aurora-mint)]" : ""}
            >
              {autoRefresh ? (
                <Pause className="w-4 h-4 mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Live
            </Button>

            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Health Score Cards - Top Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Overall Health Score */}
          <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-purple)]/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                    Health Score
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {contentHealth?.scores?.overall ?? "--"}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--color-aurora-purple)]/20 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Badge
                  className={`text-xs ${
                    (contentHealth?.scores?.overall ?? 0) >= 80
                      ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                      : (contentHealth?.scores?.overall ?? 0) >= 60
                        ? "bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                        : "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
                  }`}
                >
                  {(contentHealth?.scores?.overall ?? 0) >= 80
                    ? "Excellent"
                    : (contentHealth?.scores?.overall ?? 0) >= 60
                      ? "Good"
                      : "Needs Attention"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {activityMetrics?.users?.activeInPeriod ?? "--"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--color-aurora-blue)]/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[var(--color-aurora-blue)]" />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                <span className="text-[var(--color-aurora-mint)]">
                  +{activityMetrics?.users?.newInPeriod ?? 0}
                </span>{" "}
                new in {timeRange}h
              </p>
            </CardContent>
          </Card>

          {/* Safety Score */}
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                    Safety Score
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {safetyMetrics?.safetyScore ?? "--"}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--color-aurora-mint)]/20 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-[var(--color-aurora-mint)]" />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                <span
                  className={
                    (safetyMetrics?.riskDistribution?.high ?? 0) > 0
                      ? "text-[var(--color-aurora-salmon)]"
                      : "text-[var(--color-aurora-mint)]"
                  }
                >
                  {safetyMetrics?.riskDistribution?.high ?? 0}
                </span>{" "}
                high risk users
              </p>
            </CardContent>
          </Card>

          {/* Moderation Queue */}
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                    Mod Queue
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {(activityMetrics?.safety?.moderationQueue?.pendingPosts ??
                      0) +
                      (activityMetrics?.safety?.moderationQueue?.pendingReels ??
                        0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[var(--color-aurora-yellow)]/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                <span className="text-[var(--color-aurora-salmon)]">
                  {activityMetrics?.safety?.totalFlagged ?? 0}
                </span>{" "}
                flagged items
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        {inventory && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <StatCard
              icon={FileText}
              label="Posts"
              value={inventory.posts.total}
              color="purple"
            />
            <StatCard
              icon={Video}
              label="Reels"
              value={inventory.reels.total}
              color="pink"
              subValue={`${feedHealth?.reels?.feedReady ?? 0} ready`}
            />
            <StatCard
              icon={Route}
              label="Routes"
              value={inventory.routes.total}
              color="mint"
            />
            <StatCard
              icon={Users}
              label="Users"
              value={inventory.users.total}
              color="blue"
              subValue={`${inventory.users.onboarded} onboarded`}
            />
            <StatCard
              icon={Sparkles}
              label="AI Content"
              value={inventory.generatedContent.total}
              color="yellow"
            />
            <StatCard
              icon={MessageSquare}
              label="Comments"
              value={inventory.engagement.comments}
              color="lavender"
            />
          </div>
        )}

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList className="bg-[var(--accent)] flex-wrap h-auto p-1">
            <TabsTrigger value="health" className="gap-1">
              <HeartPulse className="w-4 h-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="moderation" className="gap-1">
              <Shield className="w-4 h-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-1">
              <ShieldAlert className="w-4 h-4" />
              Safety
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1">
              <Database className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="cleanup" className="gap-1">
              <Trash2 className="w-4 h-4" />
              Cleanup
            </TabsTrigger>
          </TabsList>

          {/* Health Tab - Feed and Content Health */}
          <TabsContent value="health" className="space-y-4">
            {/* Feed Health Alert */}
            {feedHealth && feedHealth.reels.problematic > 0 && (
              <Card className="bg-[var(--color-aurora-salmon)]/10 border-[var(--color-aurora-salmon)]/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--color-aurora-salmon)] mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--foreground)]">
                        Feed Health Issues Detected
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        {feedHealth.reels.problematic} reels may appear as black
                        boxes in the immersive feed. This affects user
                        experience.
                      </p>
                      {feedHealth.recommendations.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {feedHealth.recommendations.map((rec, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-[var(--muted-foreground)] flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-salmon)]" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        runAction("deleteBrokenReels", deleteBrokenReels, {
                          dryRun: false,
                        })
                      }
                      className="bg-[var(--color-aurora-salmon)]"
                    >
                      Fix Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Reel Health Breakdown */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                    Reel Health
                    <Badge
                      className={`ml-auto ${
                        (contentHealth?.scores?.reels ?? 0) >= 80
                          ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                          : "bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                      }`}
                    >
                      {contentHealth?.scores?.reels ?? 0}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricBox
                      label="Valid Video"
                      value={contentHealth?.reels?.withValidVideo ?? 0}
                      total={contentHealth?.reels?.total ?? 0}
                      color="mint"
                    />
                    <MetricBox
                      label="With Thumbnail"
                      value={contentHealth?.reels?.withValidThumbnail ?? 0}
                      total={contentHealth?.reels?.total ?? 0}
                      color="blue"
                    />
                    <MetricBox
                      label="Has Caption"
                      value={contentHealth?.reels?.withCaption ?? 0}
                      total={contentHealth?.reels?.total ?? 0}
                      color="purple"
                    />
                    <MetricBox
                      label="Has Engagement"
                      value={contentHealth?.reels?.withEngagement ?? 0}
                      total={contentHealth?.reels?.total ?? 0}
                      color="pink"
                    />
                  </div>

                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                      Moderation Status
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                        ✓ Approved:{" "}
                        {contentHealth?.reels?.byModerationStatus?.approved ??
                          0}
                      </Badge>
                      <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                        ⏳ Pending:{" "}
                        {contentHealth?.reels?.byModerationStatus?.pending ?? 0}
                      </Badge>
                      <Badge className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]">
                        ⚠ Flagged:{" "}
                        {contentHealth?.reels?.byModerationStatus?.flagged ?? 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Post Health Breakdown */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    Post Health
                    <Badge
                      className={`ml-auto ${
                        (contentHealth?.scores?.posts ?? 0) >= 80
                          ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                          : "bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                      }`}
                    >
                      {contentHealth?.scores?.posts ?? 0}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricBox
                      label="With Location"
                      value={contentHealth?.posts?.withLocation ?? 0}
                      total={contentHealth?.posts?.total ?? 0}
                      color="mint"
                    />
                    <MetricBox
                      label="With Media"
                      value={contentHealth?.posts?.withMedia ?? 0}
                      total={contentHealth?.posts?.total ?? 0}
                      color="blue"
                    />
                    <MetricBox
                      label="Verified"
                      value={contentHealth?.posts?.verified ?? 0}
                      total={contentHealth?.posts?.total ?? 0}
                      color="purple"
                    />
                    <MetricBox
                      label="Has Engagement"
                      value={contentHealth?.posts?.withEngagement ?? 0}
                      total={contentHealth?.posts?.total ?? 0}
                      color="pink"
                    />
                  </div>

                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                      Content Types
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                        📝 Standard:{" "}
                        {contentHealth?.posts?.byType?.standard ?? 0}
                      </Badge>
                      <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]">
                        📊 Polls: {contentHealth?.posts?.byType?.poll ?? 0}
                      </Badge>
                      <Badge className="bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)]">
                        🎬 Reels: {contentHealth?.posts?.byType?.reel ?? 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feed Issues Breakdown */}
            {feedHealth && (
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                    Feed Issues Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <IssueCard
                      label="Missing Video URL"
                      count={feedHealth.issues.missingVideoUrl}
                      icon={Video}
                      severity={
                        feedHealth.issues.missingVideoUrl > 0 ? "high" : "none"
                      }
                    />
                    <IssueCard
                      label="Placeholder URLs"
                      count={feedHealth.issues.placeholderUrl}
                      icon={Globe}
                      severity={
                        feedHealth.issues.placeholderUrl > 0 ? "high" : "none"
                      }
                    />
                    <IssueCard
                      label="Not Approved"
                      count={feedHealth.issues.notApproved}
                      icon={Shield}
                      severity={
                        feedHealth.issues.notApproved > 0 ? "medium" : "none"
                      }
                    />
                    <IssueCard
                      label="No Thumbnail"
                      count={feedHealth.issues.noThumbnail}
                      icon={Eye}
                      severity={
                        feedHealth.issues.noThumbnail > 0 ? "low" : "none"
                      }
                    />
                    <IssueCard
                      label="No Engagement"
                      count={feedHealth.issues.noEngagement}
                      icon={Heart}
                      severity={
                        feedHealth.issues.noEngagement > 0 ? "low" : "none"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab - User Journey Tracking */}
          <TabsContent value="activity" className="space-y-4">
            {activityMetrics && (
              <>
                {/* Activity Overview */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-blue)]" />
                      <p className="text-2xl font-bold text-[var(--foreground)]">
                        {activityMetrics.users.total}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Total Users
                      </p>
                      <p className="text-xs mt-1 text-[var(--color-aurora-mint)]">
                        +{activityMetrics.users.newInPeriod} new
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardContent className="p-4 text-center">
                      <UserCheck className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-mint)]" />
                      <p className="text-2xl font-bold text-[var(--foreground)]">
                        {activityMetrics.users.onboardingRate}%
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Onboarding Rate
                      </p>
                      <p className="text-xs mt-1 text-[var(--muted-foreground)]">
                        {activityMetrics.users.onboarded} completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-purple)]" />
                      <p className="text-2xl font-bold text-[var(--foreground)]">
                        {activityMetrics.users.activeInPeriod}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Active in {timeRange}h
                      </p>
                      <p className="text-xs mt-1 text-[var(--muted-foreground)]">
                        {activityMetrics.users.total > 0
                          ? Math.round(
                              (activityMetrics.users.activeInPeriod /
                                activityMetrics.users.total) *
                                100,
                            )
                          : 0}
                        % of users
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-pink)]" />
                      <p className="text-2xl font-bold text-[var(--foreground)]">
                        {activityMetrics.content.posts.newInPeriod +
                          activityMetrics.content.reels.newInPeriod +
                          activityMetrics.content.comments.newInPeriod}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        New Content
                      </p>
                      <p className="text-xs mt-1 text-[var(--muted-foreground)]">
                        in last {timeRange}h
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Activity Breakdown */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                        Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <MetricRow
                          label="Total"
                          value={activityMetrics.content.posts.total}
                        />
                        <MetricRow
                          label={`New (${timeRange}h)`}
                          value={activityMetrics.content.posts.newInPeriod}
                          color="mint"
                        />
                        <MetricRow
                          label="Total Upvotes"
                          value={activityMetrics.content.posts.totalUpvotes}
                          color="purple"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Video className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                        Reels
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <MetricRow
                          label="Total"
                          value={activityMetrics.content.reels.total}
                        />
                        <MetricRow
                          label={`New (${timeRange}h)`}
                          value={activityMetrics.content.reels.newInPeriod}
                          color="mint"
                        />
                        <MetricRow
                          label="Total Views"
                          value={activityMetrics.content.reels.totalViews}
                          color="pink"
                        />
                        <MetricRow
                          label="Healthy"
                          value={activityMetrics.content.reels.healthy}
                          color="mint"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                        Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <MetricRow
                          label="Total"
                          value={activityMetrics.content.comments.total}
                        />
                        <MetricRow
                          label={`New (${timeRange}h)`}
                          value={activityMetrics.content.comments.newInPeriod}
                          color="mint"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Route className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        Routes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <MetricRow
                          label="Total"
                          value={activityMetrics.content.routes.total}
                        />
                        <MetricRow
                          label={`New (${timeRange}h)`}
                          value={activityMetrics.content.routes.newInPeriod}
                          color="mint"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Moderation Queue Summary */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                    Pending Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <MetricRow
                      label="Posts"
                      value={
                        activityMetrics?.safety?.moderationQueue
                          ?.pendingPosts ?? 0
                      }
                      color={
                        (activityMetrics?.safety?.moderationQueue
                          ?.pendingPosts ?? 0) > 0
                          ? "yellow"
                          : undefined
                      }
                    />
                    <MetricRow
                      label="Reels"
                      value={
                        activityMetrics?.safety?.moderationQueue
                          ?.pendingReels ?? 0
                      }
                      color={
                        (activityMetrics?.safety?.moderationQueue
                          ?.pendingReels ?? 0) > 0
                          ? "yellow"
                          : undefined
                      }
                    />
                    <MetricRow
                      label="Comments"
                      value={
                        activityMetrics?.safety?.moderationQueue
                          ?.pendingComments ?? 0
                      }
                      color={
                        (activityMetrics?.safety?.moderationQueue
                          ?.pendingComments ?? 0) > 0
                          ? "yellow"
                          : undefined
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      runAction("approveReels", approveValidReels, {
                        dryRun: false,
                      })
                    }
                    disabled={isRunning !== null}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Valid Reels
                  </Button>
                </CardContent>
              </Card>

              {/* Flagged Content */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                    Flagged Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <MetricRow
                      label="Posts"
                      value={
                        activityMetrics?.safety?.flaggedContent?.posts ?? 0
                      }
                      color={
                        (activityMetrics?.safety?.flaggedContent?.posts ?? 0) >
                        0
                          ? "salmon"
                          : undefined
                      }
                    />
                    <MetricRow
                      label="Reels"
                      value={
                        activityMetrics?.safety?.flaggedContent?.reels ?? 0
                      }
                      color={
                        (activityMetrics?.safety?.flaggedContent?.reels ?? 0) >
                        0
                          ? "salmon"
                          : undefined
                      }
                    />
                    <MetricRow
                      label="Comments"
                      value={
                        activityMetrics?.safety?.flaggedContent?.comments ?? 0
                      }
                      color={
                        (activityMetrics?.safety?.flaggedContent?.comments ??
                          0) > 0
                          ? "salmon"
                          : undefined
                      }
                    />
                  </div>
                  <div className="text-center py-2">
                    <p className="text-2xl font-bold text-[var(--color-aurora-salmon)]">
                      {activityMetrics?.safety?.totalFlagged ?? 0}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Total Flagged
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      runAction("deleteBrokenReels_dry", deleteBrokenReels, {
                        dryRun: true,
                      })
                    }
                    disabled={isRunning !== null}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Broken Reels
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      runAction("approveReels_dry", approveValidReels, {
                        dryRun: true,
                      })
                    }
                    disabled={isRunning !== null}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Valid Reels
                  </Button>
                  {results.deleteBrokenReels_dry && (
                    <p className="text-xs p-2 bg-[var(--accent)] rounded">
                      Would delete: {results.deleteBrokenReels_dry.wouldDelete}{" "}
                      reels
                    </p>
                  )}
                  {results.approveReels_dry && (
                    <p className="text-xs p-2 bg-[var(--accent)] rounded">
                      Would approve: {results.approveReels_dry.wouldApprove}{" "}
                      reels
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Moderation Audit Log */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recent Moderation Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moderationLog && moderationLog.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {moderationLog.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-[var(--accent)] rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${
                              item.type === "post"
                                ? "bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]"
                                : item.type === "reel"
                                  ? "bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]"
                                  : "bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)]"
                            }`}
                          >
                            {item.type}
                          </Badge>
                          <span className="truncate max-w-[200px] text-[var(--foreground)]">
                            {item.preview}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${
                              item.status === "flagged"
                                ? "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
                                : item.status === "pending"
                                  ? "bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                                  : "bg-[var(--accent)]"
                            }`}
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDistanceToNow(item.createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                    No moderation activity found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-4">
            {safetyMetrics && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Safety Overview */}
                  <Card className="bg-gradient-to-br from-[var(--color-aurora-mint)]/20 to-[var(--color-aurora-blue)]/20 border-[var(--color-aurora-mint)]/30">
                    <CardContent className="p-6 text-center">
                      <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-[var(--color-aurora-mint)]" />
                      <p className="text-4xl font-bold text-[var(--foreground)]">
                        {safetyMetrics.safetyScore}%
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Community Safety Score
                      </p>
                      <p className="text-xs mt-2 text-[var(--muted-foreground)]">
                        {safetyMetrics.totalUsers -
                          safetyMetrics.usersWithFlaggedContent}{" "}
                        of {safetyMetrics.totalUsers} users have clean records
                      </p>
                    </CardContent>
                  </Card>

                  {/* Risk Distribution */}
                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        User Risk Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          High Risk
                        </span>
                        <Badge className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]">
                          {safetyMetrics.riskDistribution.high}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          Medium Risk
                        </span>
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                          {safetyMetrics.riskDistribution.medium}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          Low Risk
                        </span>
                        <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                          {safetyMetrics.riskDistribution.low}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Score Distribution */}
                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Trust Score Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <MetricRow
                        label="Excellent (80+)"
                        value={safetyMetrics.trustScoreDistribution.excellent}
                        color="mint"
                      />
                      <MetricRow
                        label="Good (60-79)"
                        value={safetyMetrics.trustScoreDistribution.good}
                        color="blue"
                      />
                      <MetricRow
                        label="Moderate (40-59)"
                        value={safetyMetrics.trustScoreDistribution.moderate}
                        color="yellow"
                      />
                      <MetricRow
                        label="Low (20-39)"
                        value={safetyMetrics.trustScoreDistribution.low}
                        color="salmon"
                      />
                      <MetricRow
                        label="No Score"
                        value={safetyMetrics.trustScoreDistribution.noScore}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* High Risk Users */}
                {safetyMetrics.highRiskUsers.length > 0 && (
                  <Card className="bg-[var(--color-aurora-salmon)]/10 border-[var(--color-aurora-salmon)]/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 text-[var(--color-aurora-salmon)]">
                        <AlertTriangle className="w-4 h-4" />
                        High Risk Users Requiring Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {safetyMetrics.highRiskUsers.map((user, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-[var(--background)] rounded-lg"
                          >
                            <span className="text-sm font-mono text-[var(--foreground)]">
                              {user.userId.slice(0, 8)}...
                            </span>
                            <div className="flex gap-2">
                              <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                                {user.posts} posts
                              </Badge>
                              <Badge className="bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)]">
                                {user.reels} reels
                              </Badge>
                              <Badge className="bg-[var(--color-aurora-blue)]/20 text-[var(--color-aurora-blue)]">
                                {user.comments} comments
                              </Badge>
                              <Badge className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]">
                                {user.total} total flags
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            {inventory && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Posts Breakdown */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      Posts by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MetricRow
                      label="Standard"
                      value={inventory.posts.byType.standard}
                    />
                    <MetricRow
                      label="Polls"
                      value={inventory.posts.byType.poll}
                    />
                    <MetricRow
                      label="AI Chat"
                      value={inventory.posts.byType.aiChat}
                    />
                    <MetricRow
                      label="Reels"
                      value={inventory.posts.byType.reel}
                    />
                  </CardContent>
                </Card>

                {/* Posts by Dimension */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                      Posts by Dimension
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MetricRow
                      label="Professional"
                      value={inventory.posts.byDimension.professional}
                    />
                    <MetricRow
                      label="Social"
                      value={inventory.posts.byDimension.social}
                    />
                    <MetricRow
                      label="Daily"
                      value={inventory.posts.byDimension.daily}
                    />
                    <MetricRow
                      label="Travel"
                      value={inventory.posts.byDimension.travel}
                    />
                    <MetricRow
                      label="Financial"
                      value={inventory.posts.byDimension.financial}
                    />
                  </CardContent>
                </Card>

                {/* Moderation Status */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      Moderation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MetricRow
                      label="Approved"
                      value={inventory.posts.byModeration.approved}
                      color="mint"
                    />
                    <MetricRow
                      label="Pending"
                      value={inventory.posts.byModeration.pending}
                      color="yellow"
                    />
                    <MetricRow
                      label="Flagged"
                      value={inventory.posts.byModeration.flagged}
                      color="salmon"
                    />
                    <MetricRow
                      label="No Status"
                      value={inventory.posts.byModeration.noStatus}
                    />
                  </CardContent>
                </Card>

                {/* Reels Stats */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                      Reels Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MetricRow
                      label="Total Views"
                      value={inventory.reels.totalViews.toLocaleString()}
                    />
                    <MetricRow
                      label="Total Likes"
                      value={inventory.reels.totalLikes.toLocaleString()}
                    />
                    <MetricRow
                      label="Approved"
                      value={inventory.reels.byModeration.approved}
                      color="mint"
                    />
                    <MetricRow
                      label="Pending"
                      value={inventory.reels.byModeration.pending}
                      color="yellow"
                    />
                  </CardContent>
                </Card>

                {/* Routes Stats */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Route className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      Routes Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MetricRow
                      label="Walking"
                      value={inventory.routes.byType.walking}
                    />
                    <MetricRow
                      label="Running"
                      value={inventory.routes.byType.running}
                    />
                    <MetricRow
                      label="Cycling"
                      value={inventory.routes.byType.cycling}
                    />
                    <MetricRow
                      label="Commuting"
                      value={inventory.routes.byType.commuting}
                    />
                  </CardContent>
                </Card>

                {/* User Stats */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                      User Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <MetricRow
                      label="Total Users"
                      value={inventory.users.total}
                    />
                    <MetricRow
                      label="Onboarded"
                      value={inventory.users.onboarded}
                      color="mint"
                    />
                    <MetricRow
                      label="Premium"
                      value={inventory.users.premium}
                      color="yellow"
                    />
                    <MetricRow
                      label="With Credits"
                      value={inventory.users.withCredits}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Content Source Analysis */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                    Content Source Analysis
                  </span>
                  <div className="flex gap-2">
                    {(["posts", "reels", "routes"] as const).map((type) => (
                      <Button
                        key={type}
                        variant={
                          selectedContentType === type ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedContentType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentBySource && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-[var(--accent)] rounded-xl">
                        <p className="text-2xl font-bold text-[var(--foreground)]">
                          {contentBySource.total}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Total
                        </p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-mint)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">
                          {contentBySource.real}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Real Users
                        </p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-yellow)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-yellow)]">
                          {contentBySource.seeded}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          Seeded/Test
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cleanup Tab */}
          <TabsContent value="cleanup" className="space-y-4">
            {/* Data Quality Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <Video className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-pink)]" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.reels.total}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Total Reels
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-salmon)]" />
                    <p className="text-2xl font-bold text-[var(--color-aurora-salmon)]">
                      {stats.reels.withBrokenVideo}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Broken Reels
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-purple)]" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.posts.withLocation}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Posts with Location
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-mint)]" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {stats.reels.approved}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Approved Reels
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cleanup Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Delete Broken Reels */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
                    <Video className="w-5 h-5 text-[var(--color-aurora-salmon)]" />
                    Broken Reels
                    {stats && (
                      <Badge className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]">
                        {stats.reels.withBrokenVideo} found
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Delete reels with invalid video URLs (example.com,
                    placeholder).
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        runAction("deleteBrokenReels_dry", deleteBrokenReels, {
                          dryRun: true,
                        })
                      }
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isRunning === "deleteBrokenReels_dry" && (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Preview
                    </Button>
                    <Button
                      onClick={() =>
                        runAction("deleteBrokenReels", deleteBrokenReels, {
                          dryRun: false,
                        })
                      }
                      disabled={isRunning !== null}
                      size="sm"
                      className="flex-1 bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  {results.deleteBrokenReels_dry && (
                    <p className="text-xs p-2 bg-[var(--accent)] rounded">
                      Would delete: {results.deleteBrokenReels_dry.wouldDelete}{" "}
                      reels
                    </p>
                  )}
                  {results.deleteBrokenReels && (
                    <p className="text-xs p-2 bg-[var(--color-aurora-mint)]/20 rounded text-[var(--color-aurora-mint)]">
                      ✓ Deleted: {results.deleteBrokenReels.deleted} reels
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Approve Valid Reels */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
                    <CheckCircle className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                    Pending Reels
                    {stats && (
                      <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                        {stats.reels.pending} pending
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Approve pending reels with valid video URLs.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        runAction("approveReels_dry", approveValidReels, {
                          dryRun: true,
                        })
                      }
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      onClick={() =>
                        runAction("approveReels", approveValidReels, {
                          dryRun: false,
                        })
                      }
                      disabled={isRunning !== null}
                      size="sm"
                      className="flex-1 bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/90 text-[var(--color-aurora-violet)]"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                  {results.approveReels_dry && (
                    <p className="text-xs p-2 bg-[var(--accent)] rounded">
                      Would approve: {results.approveReels_dry.wouldApprove}{" "}
                      reels
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Delete Posts Without Location */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
                    <MapPin className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                    Posts Without Location
                    {stats && (
                      <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                        {stats.posts.withoutLocation} found
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Remove posts without geolocation (won&apos;t appear on map).
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        runAction(
                          "deletePosts_dry",
                          deletePostsWithoutLocation,
                          {
                            dryRun: true,
                            keepReelPosts: true,
                          },
                        )
                      }
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      onClick={() =>
                        runAction("deletePosts", deletePostsWithoutLocation, {
                          dryRun: false,
                          keepReelPosts: true,
                        })
                      }
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-[var(--color-aurora-salmon)] text-[var(--color-aurora-salmon)]"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Seeded Content */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-[var(--foreground)]">
                    <Trash2 className="w-5 h-5 text-[var(--color-aurora-salmon)]" />
                    Seeded/Test Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Remove all content from seed/test users.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        runAction("deleteSeeded_dry", deleteSeededContent, {
                          contentType: "all",
                          dryRun: true,
                        })
                      }
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Preview All
                    </Button>
                    <Button
                      onClick={() =>
                        runAction("deleteSeeded", deleteSeededContent, {
                          contentType: "all",
                          dryRun: false,
                        })
                      }
                      disabled={isRunning !== null}
                      size="sm"
                      className="flex-1 bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All
                    </Button>
                  </div>
                  {results.deleteSeeded_dry && (
                    <p className="text-xs p-2 bg-[var(--accent)] rounded">
                      Would delete seeded content (preview mode)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Broken Reels List */}
            {brokenReels && brokenReels.length > 0 && (
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                    Broken Reels List ({brokenReels.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {brokenReels.map((reel) => (
                      <div
                        key={reel._id}
                        className="flex items-center justify-between p-2 bg-[var(--color-aurora-salmon)]/10 rounded-lg text-sm"
                      >
                        <span className="truncate flex-1 text-[var(--foreground)]">
                          {reel.caption || "No caption"}
                        </span>
                        <Badge className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]">
                          {reel.moderationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  icon: Icon,
  label,
  value,
  color = "purple",
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color?: string;
  subValue?: string;
}) {
  const colorMap: Record<string, string> = {
    purple: "var(--color-aurora-purple)",
    pink: "var(--color-aurora-pink)",
    mint: "var(--color-aurora-mint)",
    blue: "var(--color-aurora-blue)",
    yellow: "var(--color-aurora-yellow)",
    lavender: "var(--color-aurora-lavender)",
  };

  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${colorMap[color]}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: colorMap[color] }} />
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--foreground)]">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
          {subValue && (
            <p className="text-xs text-[var(--color-aurora-mint)]">
              {subValue}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  const colorClass = color
    ? `text-[var(--color-aurora-${color})]`
    : "text-[var(--foreground)]";
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

function MetricBox({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorMap: Record<string, string> = {
    mint: "var(--color-aurora-mint)",
    blue: "var(--color-aurora-blue)",
    purple: "var(--color-aurora-purple)",
    pink: "var(--color-aurora-pink)",
  };

  return (
    <div className="p-3 bg-[var(--accent)] rounded-lg">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-lg font-bold" style={{ color: colorMap[color] }}>
        {value}
      </p>
      <div className="mt-1 h-1 bg-[var(--background)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: colorMap[color],
          }}
        />
      </div>
      <p className="text-xs text-[var(--muted-foreground)] mt-1">
        {percentage}%
      </p>
    </div>
  );
}

function IssueCard({
  label,
  count,
  icon: Icon,
  severity,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  severity: "high" | "medium" | "low" | "none";
}) {
  const severityColors = {
    high: "var(--color-aurora-salmon)",
    medium: "var(--color-aurora-yellow)",
    low: "var(--color-aurora-blue)",
    none: "var(--color-aurora-mint)",
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        severity === "none"
          ? "bg-[var(--color-aurora-mint)]/10 border-[var(--color-aurora-mint)]/30"
          : severity === "high"
            ? "bg-[var(--color-aurora-salmon)]/10 border-[var(--color-aurora-salmon)]/30"
            : severity === "medium"
              ? "bg-[var(--color-aurora-yellow)]/10 border-[var(--color-aurora-yellow)]/30"
              : "bg-[var(--color-aurora-blue)]/10 border-[var(--color-aurora-blue)]/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: severityColors[severity] }} />
        <span
          className="text-lg font-bold"
          style={{ color: severityColors[severity] }}
        >
          {count}
        </span>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
