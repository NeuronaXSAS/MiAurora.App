"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star,
  TrendingUp,
  Users,
  ArrowLeft,
  Play
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { formatDistance, formatDuration } from "@/lib/gps-tracker";

export default function DiscoverRoutesPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "walking" | "running" | "cycling" | "commuting">("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

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
    api.routes.getPublicRoutes,
    {
      limit: 50,
      routeType: filterType !== "all" ? filterType : undefined,
      minRating: minRating > 0 ? minRating : undefined,
    }
  );

  // Filter by search query and tags
  const filteredRoutes = routes?.filter(route => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = route.title.toLowerCase().includes(query);
      const matchesTags = route.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesLocation = 
        route.startLocation.name.toLowerCase().includes(query) ||
        route.endLocation.name.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesTags && !matchesLocation) {
        return false;
      }
    }

    // Tags filter
    if (selectedTags.length > 0) {
      const hasAllTags = selectedTags.every(tag => route.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    return true;
  }) || [];

  // Get all unique tags from routes
  const allTags = Array.from(new Set(routes?.flatMap(r => r.tags) || []));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-purple-600/90 to-pink-600/90 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/routes")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-100">
            Discover Routes
          </h1>
          <p className="text-sm sm:text-base text-purple-100">
            Find safe and inspiring routes shared by the community
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 backdrop-blur-xl bg-white/10 border-white/20">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                      <Filter className="w-4 h-4 text-purple-400" />
                      Filters
                    </h3>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-300">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search routes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Route Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-300">Activity Type</label>
                    <div className="space-y-2">
                      {(["all", "walking", "running", "cycling", "commuting"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                            filterType === type
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/30"
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-300">Minimum Rating</label>
                    <div className="space-y-2">
                      {[0, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            minRating === rating
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg shadow-purple-500/30"
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {rating === 0 ? "Any" : `${rating}+ stars`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {allTags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block text-gray-300">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedTags.includes(tag)
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                                : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {(filterType !== "all" || minRating > 0 || selectedTags.length > 0 || searchQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterType("all");
                        setMinRating(0);
                        setSelectedTags([]);
                        setSearchQuery("");
                      }}
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Routes Grid/List */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-300">
                  {filteredRoutes.length} {filteredRoutes.length === 1 ? "route" : "routes"} found
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
                  >
                    List
                  </Button>
                </div>
              </div>

              {!routes && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading routes...</p>
                </div>
              )}

              {filteredRoutes.length === 0 && routes && (
                <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                  <CardContent className="py-12 text-center">
                    <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No routes found</h3>
                    <p className="text-gray-300 mb-4">
                      Try adjusting your filters or search query
                    </p>
                  </CardContent>
                </Card>
              )}

              {filteredRoutes.length > 0 && (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                  {filteredRoutes.map((route) => (
                    <Card 
                      key={route._id} 
                      className="backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 hover:shadow-2xl hover:shadow-purple-500/20 transition-all cursor-pointer"
                      onClick={() => router.push(`/routes/discover/${route._id}`)}
                    >
                      <CardContent className="p-4">
                        {/* Route Preview Map Placeholder */}
                        <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg mb-3 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-purple-400" />
                        </div>

                        <h3 className="font-semibold text-lg mb-2 text-white">{route.title}</h3>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {route.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-purple-600/30 text-purple-200 text-xs rounded-full border border-purple-500/30"
                            >
                              {tag}
                            </span>
                          ))}
                          {route.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full border border-white/20">
                              +{route.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            <span className="font-medium text-white">{formatDistance(route.distance)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium text-white">{route.rating}/5</span>
                          </div>
                        </div>

                        {/* Creator and Completions */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                          <span>by {route.creator.name}</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{route.completionCount || 0} completed</span>
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
      </div>
    </div>
  );
}
