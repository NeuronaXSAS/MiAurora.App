"use client";

/**
 * Admin Cleanup Page
 * 
 * Tools to clean up seeded/test data that causes issues:
 * - Broken reels with invalid URLs
 * - Posts without locations
 * - Data quality diagnostics
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Database,
  Video,
  MapPin,
  RefreshCw,
  Shield
} from "lucide-react";

export default function AdminCleanupPage() {
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  // Queries
  const stats = useQuery(api.cleanup.getDataQualityStats);
  const brokenReels = useQuery(api.cleanup.listBrokenReels, { limit: 10 });

  // Mutations
  const deleteBrokenReels = useMutation(api.cleanup.deleteBrokenReels);
  const approveValidReels = useMutation(api.cleanup.approveValidPendingReels);
  const deletePostsWithoutLocation = useMutation(api.cleanup.deletePostsWithoutLocation);

  const runAction = async (
    action: string,
    mutation: any,
    args: any
  ) => {
    setIsRunning(action);
    try {
      const result = await mutation(args);
      setResults(prev => ({ ...prev, [action]: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, [action]: { error: String(error) } }));
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Data Cleanup</h1>
            <p className="text-[var(--muted-foreground)]">Fix data quality issues</p>
          </div>
        </div>

        {/* Stats Overview */}
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
        <div className="grid gap-4">
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
                Reels with invalid video URLs (example.com, placeholder, etc.) that show blank content.
              </p>
              
              {brokenReels && brokenReels.length > 0 && (
                <div className="bg-[var(--accent)] rounded-lg p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                  {brokenReels.slice(0, 5).map((reel) => (
                    <div key={reel._id} className="flex items-center gap-2">
                      <span className="text-[var(--muted-foreground)]">•</span>
                      <span className="truncate text-[var(--foreground)]">{reel.caption || "No caption"}</span>
                      <Badge className="text-[8px] bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                        {reel.moderationStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => runAction("deleteBrokenReels_dry", deleteBrokenReels, { dryRun: true })}
                  disabled={isRunning !== null}
                  variant="outline"
                  className="flex-1"
                >
                  {isRunning === "deleteBrokenReels_dry" ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Preview
                </Button>
                <Button
                  onClick={() => runAction("deleteBrokenReels", deleteBrokenReels, { dryRun: false })}
                  disabled={isRunning !== null}
                  className="flex-1 bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Broken
                </Button>
              </div>

              {results.deleteBrokenReels_dry && (
                <div className="text-xs p-2 bg-[var(--accent)] rounded">
                  Would delete: {results.deleteBrokenReels_dry.wouldDelete} reels
                </div>
              )}
              {results.deleteBrokenReels && (
                <div className="text-xs p-2 bg-[var(--color-aurora-mint)]/20 rounded text-[var(--color-aurora-mint)]">
                  ✓ Deleted: {results.deleteBrokenReels.deleted} reels
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approve Valid Pending Reels */}
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
                Approve pending reels that have valid video URLs. This makes them visible in the feed.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => runAction("approveReels_dry", approveValidReels, { dryRun: true })}
                  disabled={isRunning !== null}
                  variant="outline"
                  className="flex-1"
                >
                  Preview
                </Button>
                <Button
                  onClick={() => runAction("approveReels", approveValidReels, { dryRun: false })}
                  disabled={isRunning !== null}
                  className="flex-1 bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/90 text-[var(--color-aurora-violet)]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Valid
                </Button>
              </div>

              {results.approveReels_dry && (
                <div className="text-xs p-2 bg-[var(--accent)] rounded">
                  Would approve: {results.approveReels_dry.wouldApprove} reels
                </div>
              )}
              {results.approveReels && (
                <div className="text-xs p-2 bg-[var(--color-aurora-mint)]/20 rounded text-[var(--color-aurora-mint)]">
                  ✓ Approved: {results.approveReels.approved} reels
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts Without Location */}
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
                Posts without geolocation don't appear on the map. For a map-centric platform, these add noise.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => runAction("deletePosts_dry", deletePostsWithoutLocation, { dryRun: true, keepReelPosts: true })}
                  disabled={isRunning !== null}
                  variant="outline"
                  className="flex-1"
                >
                  Preview
                </Button>
                <Button
                  onClick={() => runAction("deletePosts", deletePostsWithoutLocation, { dryRun: false, keepReelPosts: true })}
                  disabled={isRunning !== null}
                  variant="outline"
                  className="flex-1 border-[var(--color-aurora-salmon)] text-[var(--color-aurora-salmon)]"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete (Keep Reels)
                </Button>
              </div>

              {results.deletePosts_dry && (
                <div className="text-xs p-2 bg-[var(--accent)] rounded">
                  Would delete: {results.deletePosts_dry.wouldDelete} posts
                </div>
              )}
              {results.deletePosts && (
                <div className="text-xs p-2 bg-[var(--color-aurora-mint)]/20 rounded text-[var(--color-aurora-mint)]">
                  ✓ Deleted: {results.deletePosts.deleted} posts
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {stats && (
          <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
            <CardContent className="p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Data Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--muted-foreground)]">Total Posts</p>
                  <p className="font-bold text-[var(--foreground)]">{stats.posts.total}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Total Reels</p>
                  <p className="font-bold text-[var(--foreground)]">{stats.reels.total}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Total Routes</p>
                  <p className="font-bold text-[var(--foreground)]">{stats.routes.total}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Issues Found</p>
                  <p className="font-bold text-[var(--color-aurora-salmon)]">{stats.summary.totalIssues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
