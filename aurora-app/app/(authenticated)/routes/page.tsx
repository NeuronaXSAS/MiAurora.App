"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Route, Play, TrendingUp, Award, Calendar, Filter, Download, Trash2, MoreVertical } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { formatDistance, formatDuration } from "@/lib/gps-tracker";
import { formatDistanceToNow } from "date-fns";
import { RoutesCalendar } from "@/components/routes-calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RoutesPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterType, setFilterType] = useState<"all" | "walking" | "running" | "cycling" | "commuting">("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [deleteRouteId, setDeleteRouteId] = useState<Id<"routes"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const deleteRoute = useMutation(api.routes.deleteRoute);

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

  const routes = useQuery(
    api.routes.getUserRoutes,
    userId ? { userId, limit: 20 } : "skip"
  );

  // Filter routes
  const filteredRoutes = routes?.filter(route => {
    if (filterType !== "all" && route.routeType !== filterType) return false;
    if (filterTag && !route.tags.includes(filterTag)) return false;
    return true;
  }) || [];

  // Calculate stats
  const totalDistance = filteredRoutes.reduce((sum, r) => sum + r.distance, 0);
  const totalRoutes = filteredRoutes.length;
  const totalCredits = filteredRoutes.reduce((sum, r) => sum + r.creditsEarned, 0);

  // Get unique tags from all routes
  const allTags = Array.from(new Set(routes?.flatMap(r => r.tags) || []));

  // Export to GPX
  const exportToGPX = (route: any) => {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Aurora App">
  <metadata>
    <name>${route.title}</name>
    <desc>${route.journalEntry || ""}</desc>
  </metadata>
  <trk>
    <name>${route.title}</name>
    <type>${route.routeType}</type>
    <trkseg>
${route.coordinates.map((coord: any) => `      <trkpt lat="${coord.lat}" lon="${coord.lng}">
        ${coord.elevation ? `<ele>${coord.elevation}</ele>` : ""}
        <time>${new Date(coord.timestamp).toISOString()}</time>
      </trkpt>`).join("\n")}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${route.title.replace(/\s+/g, "_")}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-violet)] to-[var(--color-aurora-purple)] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Route className="w-8 h-8" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Aurora Routes</h1>
                <p className="text-sm sm:text-base text-white/80">
                  Track, share, and discover safe routes
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-white text-[var(--color-aurora-violet)] hover:bg-white/90 w-full sm:w-auto min-h-[52px] font-semibold text-base transition-all active:scale-95 shadow-lg"
              onClick={() => router.push("/routes/track")}
              aria-label="Start tracking a new route"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Tracking
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4 border border-white/20">
              <p className="text-xs sm:text-sm text-white/80">Total Distance</p>
              <p className="text-lg sm:text-2xl font-bold">{formatDistance(totalDistance)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4 border border-white/20">
              <p className="text-xs sm:text-sm text-white/80">Routes</p>
              <p className="text-lg sm:text-2xl font-bold">{totalRoutes}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 sm:p-4 border border-white/20">
              <p className="text-xs sm:text-sm text-white/80">Credits Earned</p>
              <p className="text-lg sm:text-2xl font-bold text-[var(--color-aurora-yellow)]">{totalCredits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Card 
              className="hover:shadow-lg cursor-pointer bg-[var(--card)] border-[var(--border)] transition-all active:scale-[0.98]" 
              onClick={() => router.push("/routes/track")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push("/routes/track")}
              aria-label="Start tracking a new route"
            >
              <CardContent className="p-6 min-h-[88px]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[var(--color-aurora-purple)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Play className="w-7 h-7 text-[var(--color-aurora-purple)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--foreground)]">Start New Route</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Track your movement safely</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg cursor-pointer bg-[var(--card)] border-[var(--border)] transition-all active:scale-[0.98]" 
              onClick={() => router.push("/routes/discover")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push("/routes/discover")}
              aria-label="Discover safe routes in your area"
            >
              <CardContent className="p-6 min-h-[88px]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[var(--color-aurora-blue)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-7 h-7 text-[var(--color-aurora-blue)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--foreground)]">Discover Routes</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">Find community-verified paths</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Routes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--foreground)]">My Routes</h2>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-[var(--color-aurora-purple)]" : ""}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={viewMode === "calendar" ? "bg-[var(--color-aurora-purple)]" : ""}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Calendar
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={filterType === "all" ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]" : "border-[var(--border)]"}
              >
                All
              </Button>
              {(["walking", "running", "cycling", "commuting"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={`capitalize ${filterType === type ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]" : "border-[var(--border)]"}`}
                >
                  {type}
                </Button>
              ))}
              
              {allTags.length > 0 && (
                <>
                  <div className="w-px bg-[var(--border)] mx-1" />
                  {allTags.slice(0, 5).map((tag) => (
                    <Button
                      key={tag}
                      variant={filterTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                      className={filterTag === tag ? "bg-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/80" : "border-[var(--border)]"}
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </>
              )}
            </div>
            
            {!routes && (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[var(--muted-foreground)]">Loading your routes...</p>
              </div>
            )}

            {filteredRoutes.length === 0 && routes && routes.length > 0 && (
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="py-12 text-center">
                  <Filter className="w-16 h-16 text-[var(--color-aurora-lavender)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No routes match your filters</h3>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    Try adjusting your filters to see more routes
                  </p>
                  <Button variant="outline" onClick={() => { setFilterType("all"); setFilterTag(null); }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {routes && routes.length === 0 && (
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="py-12 text-center">
                  <Route className="w-16 h-16 text-[var(--color-aurora-lavender)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No routes yet</h3>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    Start tracking your first route to see it here!
                  </p>
                  <Button onClick={() => router.push("/routes/track")} className="bg-[var(--color-aurora-purple)]">
                    <Play className="w-4 h-4 mr-2" />
                    Start First Route
                  </Button>
                </CardContent>
              </Card>
            )}

            {viewMode === "calendar" && routes && routes.length > 0 && (
              <RoutesCalendar routes={filteredRoutes} />
            )}

            {viewMode === "list" && filteredRoutes.length > 0 && (
              <div className="space-y-4">
                {filteredRoutes.map((route) => (
                  <Card key={route._id} className="hover:shadow-lg bg-[var(--card)] border-[var(--border)] transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/routes/${route._id}`)}>
                          <h3 className="font-semibold text-lg mb-2 text-[var(--foreground)]">{route.title}</h3>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {route.tags.slice(0, 3).map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-purple)] text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-[var(--muted-foreground)]">Distance</p>
                              <p className="font-semibold text-[var(--foreground)]">{formatDistance(route.distance)}</p>
                            </div>
                            <div>
                              <p className="text-[var(--muted-foreground)]">Duration</p>
                              <p className="font-semibold text-[var(--foreground)]">{formatDuration(route.duration)}</p>
                            </div>
                            <div>
                              <p className="text-[var(--muted-foreground)]">Rating</p>
                              <p className="font-semibold text-[var(--foreground)]">{"⭐".repeat(route.rating)}</p>
                            </div>
                            <div>
                              <p className="text-[var(--muted-foreground)]">Type</p>
                              <p className="font-semibold capitalize text-[var(--foreground)]">{route.routeType}</p>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--muted-foreground)] mt-3">
                            {formatDistanceToNow(route._creationTime, { addSuffix: true })}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {route.creditsEarned > 0 && (
                            <div className="flex items-center gap-1 bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] px-3 py-1 rounded-full">
                              <Award className="w-4 h-4" />
                              <span className="text-sm font-semibold">+{route.creditsEarned}</span>
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[var(--border)] min-w-[36px] min-h-[36px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportToGPX(route);
                                }}
                                className="cursor-pointer"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export GPX
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteRouteId(route._id);
                                }}
                                className="cursor-pointer text-[var(--color-aurora-salmon)] focus:text-[var(--color-aurora-salmon)]"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Route
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent className="bg-[var(--card)] border-[var(--border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--foreground)]">Delete Route?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--muted-foreground)]">
              This action cannot be undone. This will permanently delete your route and all associated data including journal entries and voice notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-[var(--border)]"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90 text-white"
              disabled={isDeleting}
              onClick={async () => {
                if (!deleteRouteId || !userId) return;
                setIsDeleting(true);
                try {
                  await deleteRoute({ routeId: deleteRouteId, userId });
                  setDeleteRouteId(null);
                } catch (error) {
                  console.error("Error deleting route:", error);
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
