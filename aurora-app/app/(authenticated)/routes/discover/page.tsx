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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Discover Routes</h1>
          <p className="text-sm sm:text-base text-blue-100">
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
              <Card className="sticky top-24">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filters
                    </h3>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search routes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Route Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Activity Type</label>
                    <div className="space-y-2">
                      {(["all", "walking", "running", "cycling", "commuting"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                            filterType === type
                              ? "bg-purple-100 text-purple-700 font-medium"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                    <div className="space-y-2">
                      {[0, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            minRating === rating
                              ? "bg-purple-100 text-purple-700 font-medium"
                              : "hover:bg-gray-100"
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
                      <label className="text-sm font-medium mb-2 block">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedTags.includes(tag)
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                      className="w-full"
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
                <p className="text-sm text-gray-600">
                  {filteredRoutes.length} {filteredRoutes.length === 1 ? "route" : "routes"} found
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </Button>
                </div>
              </div>

              {!routes && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading routes...</p>
                </div>
              )}

              {filteredRoutes.length === 0 && routes && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No routes found</h3>
                    <p className="text-gray-600 mb-4">
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
                      className="hover-lift cursor-pointer"
                      onClick={() => router.push(`/routes/discover/${route._id}`)}
                    >
                      <CardContent className="p-4">
                        {/* Route Preview Map Placeholder */}
                        <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-purple-600" />
                        </div>

                        <h3 className="font-semibold text-lg mb-2">{route.title}</h3>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {route.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {route.tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{route.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{formatDistance(route.distance)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{route.rating}/5</span>
                          </div>
                        </div>

                        {/* Creator and Completions */}
                        <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t">
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
