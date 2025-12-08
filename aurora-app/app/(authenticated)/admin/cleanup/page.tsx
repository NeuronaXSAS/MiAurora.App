"use client";

/**
 * Admin Cleanup & Monitoring Page
 * 
 * Comprehensive dashboard for monitoring all content types:
 * - Posts (by type, dimension, moderation status)
 * - Reels (by provider, moderation status)
 * - Routes (by type, sharing level)
 * - Generated content (debates, tips)
 * - User statistics
 * - Data quality issues
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trash2, CheckCircle, AlertTriangle, Database, Video, MapPin,
  RefreshCw, Shield, FileText, Users, MessageSquare, Sparkles,
  Route, Eye, Heart, Globe, Zap, BarChart3
} from "lucide-react";

export default function AdminCleanupPage() {
  const [isRunning, setIsRunning] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Record<string, any>>({});
  const [selectedContentType, setSelectedContentType] = useState<"posts" | "reels" | "routes">("posts");

  // Queries
  const stats = useQuery(api.cleanup.getDataQualityStats);
  const inventory = useQuery(api.cleanup.getContentInventory);
  const brokenReels = useQuery(api.cleanup.listBrokenReels, { limit: 10 });
  const contentBySource = useQuery(api.cleanup.getContentBySource, { contentType: selectedContentType });

  // Mutations
  const deleteBrokenReels = useMutation(api.cleanup.deleteBrokenReels);
  const approveValidReels = useMutation(api.cleanup.approveValidPendingReels);
  const deletePostsWithoutLocation = useMutation(api.cleanup.deletePostsWithoutLocation);
  const deleteSeededContent = useMutation(api.cleanup.deleteSeededContent);

  const runAction = async (action: string, mutation: unknown, args: unknown) => {
    setIsRunning(action);
    try {
      const result = await (mutation as (args: unknown) => Promise<unknown>)(args);
      setResults(prev => ({ ...prev, [action]: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, [action]: { error: String(error) } }));
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Content Monitor</h1>
            <p className="text-[var(--muted-foreground)]">Real-time monitoring & cleanup tools</p>
          </div>
        </div>

        {/* Quick Stats Overview */}
        {inventory && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard icon={FileText} label="Posts" value={inventory.posts.total} color="purple" />
            <StatCard icon={Video} label="Reels" value={inventory.reels.total} color="pink" />
            <StatCard icon={Route} label="Routes" value={inventory.routes.total} color="mint" />
            <StatCard icon={Users} label="Users" value={inventory.users.total} color="blue" />
            <StatCard icon={Sparkles} label="AI Content" value={inventory.generatedContent.total} color="yellow" />
            <StatCard icon={MessageSquare} label="Comments" value={inventory.engagement.comments} color="lavender" />
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-[var(--accent)]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="generated">AI Content</TabsTrigger>
            <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
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
                    <MetricRow label="Standard" value={inventory.posts.byType.standard} />
                    <MetricRow label="Polls" value={inventory.posts.byType.poll} />
                    <MetricRow label="AI Chat" value={inventory.posts.byType.aiChat} />
                    <MetricRow label="Reels" value={inventory.posts.byType.reel} />
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
                    <MetricRow label="Professional" value={inventory.posts.byDimension.professional} />
                    <MetricRow label="Social" value={inventory.posts.byDimension.social} />
                    <MetricRow label="Daily" value={inventory.posts.byDimension.daily} />
                    <MetricRow label="Travel" value={inventory.posts.byDimension.travel} />
                    <MetricRow label="Financial" value={inventory.posts.byDimension.financial} />
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
                    <MetricRow label="Approved" value={inventory.posts.byModeration.approved} color="mint" />
                    <MetricRow label="Pending" value={inventory.posts.byModeration.pending} color="yellow" />
                    <MetricRow label="Flagged" value={inventory.posts.byModeration.flagged} color="salmon" />
                    <MetricRow label="No Status" value={inventory.posts.byModeration.noStatus} />
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
                    <MetricRow label="Total Views" value={inventory.reels.totalViews.toLocaleString()} />
                    <MetricRow label="Total Likes" value={inventory.reels.totalLikes.toLocaleString()} />
                    <MetricRow label="Approved" value={inventory.reels.byModeration.approved} color="mint" />
                    <MetricRow label="Pending" value={inventory.reels.byModeration.pending} color="yellow" />
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
                    <MetricRow label="Walking" value={inventory.routes.byType.walking} />
                    <MetricRow label="Running" value={inventory.routes.byType.running} />
                    <MetricRow label="Cycling" value={inventory.routes.byType.cycling} />
                    <MetricRow label="Commuting" value={inventory.routes.byType.commuting} />
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
                    <MetricRow label="Total Users" value={inventory.users.total} />
                    <MetricRow label="Onboarded" value={inventory.users.onboarded} color="mint" />
                    <MetricRow label="Premium" value={inventory.users.premium} color="yellow" />
                    <MetricRow label="With Credits" value={inventory.users.withCredits} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                    Posts Analysis
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContentType("posts")}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentBySource && selectedContentType === "posts" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-[var(--accent)] rounded-xl">
                        <p className="text-2xl font-bold text-[var(--foreground)]">{contentBySource.total}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Total Posts</p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-mint)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">{contentBySource.real}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Real Users</p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-yellow)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-yellow)]">{contentBySource.seeded}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Seeded/Test</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[var(--foreground)]">Sample Posts</h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {(contentBySource.sample as Array<{ _id: string; title?: string; authorName?: string; authorEmail?: string; isSeeded: boolean; postType?: string }>).map((item) => (
                          <div key={item._id} className="flex items-center justify-between p-2 bg-[var(--accent)] rounded-lg text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-[var(--foreground)]">{item.title || "Untitled"}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">by {item.authorName || "Unknown"}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={item.isSeeded ? "bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]" : "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"}>
                                {item.isSeeded ? "Seeded" : "Real"}
                              </Badge>
                              <Badge variant="outline">{item.postType || "standard"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reels Tab */}
          <TabsContent value="reels" className="space-y-4">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                  Reels Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContentType("reels")}
                  className="mb-4"
                >
                  Load Reels Data
                </Button>
                
                {contentBySource && selectedContentType === "reels" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-[var(--accent)] rounded-xl">
                        <p className="text-2xl font-bold">{contentBySource.total}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Total Reels</p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-mint)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">{contentBySource.real}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Real Users</p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-yellow)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-yellow)]">{contentBySource.seeded}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Seeded/Broken</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Broken Reels List */}
                {brokenReels && brokenReels.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                      Broken Reels ({brokenReels.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {brokenReels.map((reel) => (
                        <div key={reel._id} className="flex items-center justify-between p-2 bg-[var(--color-aurora-salmon)]/10 rounded-lg text-sm">
                          <span className="truncate flex-1 text-[var(--foreground)]">{reel.caption || "No caption"}</span>
                          <Badge className="bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]">
                            {reel.moderationStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                  Routes Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedContentType("routes")}
                  className="mb-4"
                >
                  Load Routes Data
                </Button>
                
                {contentBySource && selectedContentType === "routes" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-[var(--accent)] rounded-xl">
                        <p className="text-2xl font-bold">{contentBySource.total}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Total Routes</p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-mint)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-mint)]">{contentBySource.real}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Real Users</p>
                      </div>
                      <div className="text-center p-4 bg-[var(--color-aurora-yellow)]/10 rounded-xl">
                        <p className="text-2xl font-bold text-[var(--color-aurora-yellow)]">{contentBySource.seeded}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">Seeded/Test</p>
                      </div>
                    </div>
                  </div>
                )}

                {inventory && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--accent)] rounded-xl">
                      <h4 className="font-semibold mb-2">By Sharing Level</h4>
                      <MetricRow label="Public" value={inventory.routes.bySharing.public} />
                      <MetricRow label="Anonymous" value={inventory.routes.bySharing.anonymous} />
                      <MetricRow label="Private" value={inventory.routes.bySharing.private} />
                    </div>
                    <div className="p-4 bg-[var(--accent)] rounded-xl">
                      <h4 className="font-semibold mb-2">Total Distance</h4>
                      <p className="text-2xl font-bold text-[var(--color-aurora-purple)]">
                        {(inventory.routes.totalDistance / 1000).toFixed(1)} km
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generated Content Tab */}
          <TabsContent value="generated" className="space-y-4">
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  AI-Generated Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventory && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-6 bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-purple)]" />
                      <p className="text-3xl font-bold text-[var(--foreground)]">{inventory.generatedContent.debates}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Daily Debates</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-[var(--color-aurora-mint)]/10 to-[var(--color-aurora-blue)]/10 rounded-xl">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-mint)]" />
                      <p className="text-3xl font-bold text-[var(--foreground)]">{inventory.generatedContent.tips}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Safety Tips</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-[var(--color-aurora-yellow)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--color-aurora-yellow)]" />
                      <p className="text-3xl font-bold text-[var(--foreground)]">{inventory.engagement.dailyDebates}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Active Debates</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-[var(--accent)] rounded-xl">
                  <h4 className="font-semibold mb-2 text-[var(--foreground)]">AWS Credit Usage Strategy</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    AI content is generated in batches to maximize your $100 AWS credit. 
                    Each debate costs ~$0.50 for 6 languages. Current runway: ~7 months.
                  </p>
                </div>
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
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.reels.total}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Total Reels</p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-salmon)]" />
                    <p className="text-2xl font-bold text-[var(--color-aurora-salmon)]">{stats.reels.withBrokenVideo}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Broken Reels</p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-purple)]" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.posts.withLocation}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Posts with Location</p>
                  </CardContent>
                </Card>
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-4 text-center">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-[var(--color-aurora-mint)]" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.reels.approved}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Approved Reels</p>
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
                    Delete reels with invalid video URLs (example.com, placeholder).
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => runAction("deleteBrokenReels_dry", deleteBrokenReels, { dryRun: true })}
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isRunning === "deleteBrokenReels_dry" && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      Preview
                    </Button>
                    <Button
                      onClick={() => runAction("deleteBrokenReels", deleteBrokenReels, { dryRun: false })}
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
                      Would delete: {results.deleteBrokenReels_dry.wouldDelete} reels
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
                      onClick={() => runAction("approveReels_dry", approveValidReels, { dryRun: true })}
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      onClick={() => runAction("approveReels", approveValidReels, { dryRun: false })}
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
                      Would approve: {results.approveReels_dry.wouldApprove} reels
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
                    Remove posts without geolocation (won't appear on map).
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => runAction("deletePosts_dry", deletePostsWithoutLocation, { dryRun: true, keepReelPosts: true })}
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Preview
                    </Button>
                    <Button
                      onClick={() => runAction("deletePosts", deletePostsWithoutLocation, { dryRun: false, keepReelPosts: true })}
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
                      onClick={() => runAction("deleteSeeded_dry", deleteSeededContent, { contentType: "all", dryRun: true })}
                      disabled={isRunning !== null}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Preview All
                    </Button>
                    <Button
                      onClick={() => runAction("deleteSeeded", deleteSeededContent, { contentType: "all", dryRun: false })}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


// Helper Components
function StatCard({ icon: Icon, label, value, color = "purple" }: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string; 
  color?: string;
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
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const colorClass = color ? `text-[var(--color-aurora-${color})]` : "text-[var(--foreground)]";
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}
