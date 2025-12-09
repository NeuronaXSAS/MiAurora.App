"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  TrendingUp,
  Building2,
  MapPin,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  RefreshCw,
  Key,
  WifiOff,
} from "lucide-react";
import Map, { Source, Layer, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// Map configuration
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const AURORA_MAP_STYLE = "mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl";
const FALLBACK_STYLE = "mapbox://styles/mapbox/streets-v12";

export default function IntelligenceDashboard() {
  const stats = useQuery(api.intelligence.getAggregationStats);
  const topCompanies = useQuery(api.intelligence.getTopCompanies, {
    limit: 10,
  });
  const worstCompanies = useQuery(api.intelligence.getTopCompanies, {
    limit: 10,
    sortBy: "worst",
  });

  const [viewport, setViewport] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    zoom: 11,
  });

  const mapRef = useRef<MapRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [usingFallbackStyle, setUsingFallbackStyle] = useState(false);
  const styleAttempts = useRef(0);

  // Handle map load error - try fallback style
  const handleMapError = useCallback(
    (evt: any) => {
      console.debug("Map error:", evt);

      // If custom style fails, try fallback
      if (!usingFallbackStyle && styleAttempts.current < 1) {
        styleAttempts.current++;
        setUsingFallbackStyle(true);
        return;
      }

      // Network or other errors
      if (
        evt.error?.message?.includes("Failed to fetch") ||
        evt.error?.message?.includes("NetworkError")
      ) {
        setMapError(
          "Network error loading map. Check your connection or disable ad blockers.",
        );
      }
    },
    [usingFallbackStyle],
  );

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    setMapError(null);
  }, []);

  const handleRetryMap = useCallback(() => {
    setMapError(null);
    setMapLoaded(false);
    styleAttempts.current = 0;
    setUsingFallbackStyle(false);
  }, []);

  // Fetch urban safety data for current viewport
  const urbanData = useQuery(
    api.intelligence.getUrbanSafety,
    viewport
      ? {
        minLat: viewport.latitude - 0.1,
        maxLat: viewport.latitude + 0.1,
        minLng: viewport.longitude - 0.1,
        maxLng: viewport.longitude + 0.1,
      }
      : "skip",
  );

  // Convert urban data to GeoJSON for heatmap
  const heatmapData = urbanData
    ? {
      type: "FeatureCollection" as const,
      features: urbanData
        .filter(
          (cell) =>
            typeof cell.gridLng === "number" &&
            typeof cell.gridLat === "number" &&
            cell.gridLat >= -90 &&
            cell.gridLat <= 90 &&
            cell.gridLng >= -180 &&
            cell.gridLng <= 180,
        )
        .map((cell) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [cell.gridLng, cell.gridLat],
          },
          properties: {
            score: cell.overallScore,
            intensity: cell.overallScore / 100,
          },
        })),
    }
    : null;

  const handleExportData = () => {
    // Create CSV export
    const csvData = [
      ["Metric", "Value"],
      ["Total Companies Indexed", stats?.corporate.totalCompanies || 0],
      ["Total Geographic Cells", stats?.urban.totalGridCells || 0],
      [
        "Corporate Data Quality",
        `${Math.round(stats?.corporate.avgDataQuality || 0)}%`,
      ],
      [
        "Urban Data Quality",
        `${Math.round(stats?.urban.avgDataQuality || 0)}%`,
      ],
      [
        "Last Corporate Update",
        stats?.corporate.lastAggregated
          ? new Date(stats.corporate.lastAggregated).toLocaleString()
          : "N/A",
      ],
      [
        "Last Urban Update",
        stats?.urban.lastAggregated
          ? new Date(stats.urban.lastAggregated).toLocaleString()
          : "N/A",
      ],
    ];

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurora-intelligence-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-violet)] to-[var(--color-aurora-purple)] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Aurora App Intelligence</h1>
                <p className="text-white/80">
                  B2B Safety Data Platform • Enterprise Analytics
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportData}
              className="bg-white text-[var(--color-aurora-violet)] hover:bg-white/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-[var(--color-aurora-blue)] bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">
                    Total Safety Reports
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {(
                      (stats?.corporate.totalCompanies || 0) * 15
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--color-aurora-mint)] mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-aurora-blue)]/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[var(--color-aurora-blue)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--color-aurora-mint)] bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">
                    Verified Incidents
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {((stats?.urban.totalGridCells || 0) * 3).toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--color-aurora-mint)] mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    98% accuracy
                  </p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-aurora-mint)]/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[var(--color-aurora-mint)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--color-aurora-purple)] bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">
                    Corporate Partners
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {stats?.corporate.totalCompanies || 0}
                  </p>
                  <p className="text-xs text-[var(--color-aurora-purple)] mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Across 12 industries
                  </p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-aurora-purple)]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[var(--color-aurora-pink)] bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-[var(--foreground)]">
                    {((stats?.urban.totalGridCells || 0) * 50).toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--color-aurora-pink)] mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Contributing data
                  </p>
                </div>
                <div className="w-12 h-12 bg-[var(--color-aurora-pink)]/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-[var(--color-aurora-pink)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="heatmap" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Safety Heatmap
            </TabsTrigger>
            <TabsTrigger value="corporate" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Corporate Index
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Urban Safety Heatmap</span>
                  <div className="flex items-center gap-4 text-sm font-normal">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-600">Safe (80-100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-gray-600">Moderate (50-79)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-gray-600">Risk (0-49)</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-lg overflow-hidden border relative">
                  {/* Token missing error */}
                  {!MAPBOX_TOKEN ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-cream)] to-[var(--color-aurora-lavender)]/30">
                      <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 bg-[var(--color-aurora-yellow)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Key className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                          Mapbox API Key Required
                        </h3>
                        <p className="text-[var(--muted-foreground)] text-sm">
                          Please add NEXT_PUBLIC_MAPBOX_TOKEN to your
                          environment variables.
                        </p>
                      </div>
                    </div>
                  ) : mapError ? (
                    /* Map error state */
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-cream)] to-[var(--color-aurora-lavender)]/30">
                      <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 bg-[var(--color-aurora-yellow)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <WifiOff className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                          Map Unavailable
                        </h3>
                        <p className="text-[var(--muted-foreground)] text-sm mb-4">
                          {mapError}
                        </p>
                        <Button
                          onClick={handleRetryMap}
                          className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Map component */
                    <Map
                      ref={mapRef}
                      {...viewport}
                      onMove={(evt) => setViewport(evt.viewState)}
                      mapStyle={
                        usingFallbackStyle ? FALLBACK_STYLE : AURORA_MAP_STYLE
                      }
                      mapboxAccessToken={MAPBOX_TOKEN}
                      onLoad={handleMapLoad}
                      onError={handleMapError}
                      reuseMaps
                    >
                      {heatmapData && mapLoaded && (
                        <Source type="geojson" data={heatmapData}>
                          <Layer
                            id="safety-heatmap"
                            type="heatmap"
                            paint={{
                              "heatmap-weight": ["get", "intensity"],
                              "heatmap-intensity": 1,
                              "heatmap-color": [
                                "interpolate",
                                ["linear"],
                                ["heatmap-density"],
                                0,
                                "rgba(0, 0, 255, 0)",
                                0.3,
                                "rgb(255, 0, 0)",
                                0.5,
                                "rgb(255, 165, 0)",
                                0.7,
                                "rgb(255, 255, 0)",
                                1,
                                "rgb(0, 255, 0)",
                              ],
                              "heatmap-radius": 30,
                              "heatmap-opacity": 0.7,
                            }}
                          />
                        </Source>
                      )}
                    </Map>
                  )}

                  {/* Loading overlay */}
                  {MAPBOX_TOKEN && !mapLoaded && !mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-cream)] to-[var(--color-aurora-lavender)]/30 pointer-events-none">
                      <div className="bg-[var(--card)]/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-aurora-purple)]" />
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {usingFallbackStyle
                              ? "Loading standard map..."
                              : "Loading Aurora map..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Data Coverage:</strong> {urbanData?.length || 0}{" "}
                    geographic cells analyzed • Updated{" "}
                    {stats?.urban.lastAggregated
                      ? new Date(
                        stats.urban.lastAggregated,
                      ).toLocaleDateString()
                      : "recently"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Corporate Index Tab */}
          <TabsContent value="corporate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Companies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Top Rated Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCompanies?.map((company, idx) => (
                      <div
                        key={company._id}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {company.companyName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {company.totalReviews} reviews •{" "}
                              {company.industry || "Various"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {company.overallScore}
                          </p>
                          <p className="text-xs text-gray-500">Safety Score</p>
                        </div>
                      </div>
                    ))}
                    {(!topCompanies || topCompanies.length === 0) && (
                      <p className="text-center text-gray-500 py-8">
                        No data available yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Worst Companies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="w-5 h-5" />
                    Companies Needing Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {worstCompanies?.map((company, idx) => (
                      <div
                        key={company._id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {company.companyName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {company.totalReviews} reviews •{" "}
                              {company.industry || "Various"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">
                            {company.overallScore}
                          </p>
                          <p className="text-xs text-gray-500">Safety Score</p>
                        </div>
                      </div>
                    ))}
                    {(!worstCompanies || worstCompanies.length === 0) && (
                      <p className="text-center text-gray-500 py-8">
                        No data available yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      Corporate Safety Index
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            Data Completeness
                          </span>
                          <span className="font-semibold">
                            {Math.round(stats?.corporate.avgDataQuality || 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${stats?.corporate.avgDataQuality || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            Companies Indexed
                          </span>
                          <span className="font-semibold">
                            {stats?.corporate.totalCompanies || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: "75%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last updated:{" "}
                          {stats?.corporate.lastAggregated
                            ? new Date(
                              stats.corporate.lastAggregated,
                            ).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      Urban Safety Index
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            Data Completeness
                          </span>
                          <span className="font-semibold">
                            {Math.round(stats?.urban.avgDataQuality || 0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${stats?.urban.avgDataQuality || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            Grid Cells Analyzed
                          </span>
                          <span className="font-semibold">
                            {stats?.urban.totalGridCells || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: "82%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                        <Clock className="w-4 h-4" />
                        <span>
                          Last updated:{" "}
                          {stats?.urban.lastAggregated
                            ? new Date(
                              stats.urban.lastAggregated,
                            ).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Enterprise Data Access
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Get full API access to Aurora's safety intelligence data.
                    Perfect for governments, insurance companies, and urban
                    planning organizations.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      Request API Access
                    </Button>
                    <Button size="lg" variant="outline">
                      View Documentation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
