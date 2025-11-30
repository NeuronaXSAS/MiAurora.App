"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Route, TrendingUp, Star, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import Map, { Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// Mini Route Map Preview with visible route line
function MiniRouteMap({ coordinates }: { coordinates: Array<{ lat: number; lng: number }> }) {
  if (!coordinates || coordinates.length < 2 || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return null;
  
  const lngs = coordinates.map(c => c.lng);
  const lats = coordinates.map(c => c.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  
  // Calculate zoom based on route extent
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  let zoom = 13;
  if (maxDiff > 0.1) zoom = 10;
  else if (maxDiff > 0.05) zoom = 11;
  else if (maxDiff > 0.02) zoom = 12;
  else if (maxDiff > 0.01) zoom = 13;
  else zoom = 14;
  
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: centerLng,
        latitude: centerLat,
        zoom: zoom,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl"
      interactive={false}
      attributionControl={false}
    >
      {/* Route glow effect */}
      <Source
        type="geojson"
        data={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates.map(c => [c.lng, c.lat]),
          },
        }}
      >
        <Layer
          id="route-glow"
          type="line"
          paint={{
            "line-color": "#5537a7",
            "line-width": 8,
            "line-opacity": 0.4,
            "line-blur": 4,
          }}
        />
        <Layer
          id="route-line"
          type="line"
          paint={{
            "line-color": "#f29de5",
            "line-width": 4,
            "line-opacity": 1,
          }}
        />
      </Source>
      
      {/* Start marker */}
      <Source
        type="geojson"
        data={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [coordinates[0].lng, coordinates[0].lat],
          },
        }}
      >
        <Layer
          id="start-point"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#22c55e",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>
      
      {/* End marker */}
      <Source
        type="geojson"
        data={{
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [coordinates[coordinates.length - 1].lng, coordinates[coordinates.length - 1].lat],
          },
        }}
      >
        <Layer
          id="end-point"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#ef4444",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>
    </Map>
  );
}

interface RouteFeedCardProps {
  route: {
    _id: string;
    _creationTime: number;
    creatorId: string;
    title: string;
    routeType: string;
    distance: number;
    duration: number;
    rating: number;
    tags: string[];
    startLocation: {
      name: string;
    };
    endLocation: {
      name: string;
    };
    completionCount: number;
    coordinates?: Array<{ lat: number; lng: number }>;
  };
  currentUserId?: Id<"users">;
  onDelete?: () => void;
}

export function RouteFeedCard({ route, currentUserId, onDelete }: RouteFeedCardProps) {
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.round(route.duration / 60);
  const isCreator = currentUserId === route.creatorId;

  const deleteRoute = useMutation(api.routes.deleteRoute);

  const handleDelete = async () => {
    if (!currentUserId || !isCreator) return;

    if (!confirm("Are you sure you want to delete this route? All GPS data, ratings, and reviews will be permanently removed.")) {
      return;
    }

    try {
      await deleteRoute({
        routeId: route._id as Id<"routes">,
        userId: currentUserId,
      });
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete route: " + (error as Error).message);
    }
  };

  return (
    <Card className="hover-lift animate-fade-in-up bg-[var(--card)] border-[var(--border)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-aurora-mint)]/20 flex items-center justify-center">
              <Route className="w-6 h-6 text-[var(--color-aurora-purple)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-[var(--foreground)]">{route.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {formatDistanceToNow(route._creationTime, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-purple)] border-0">
              {route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)}
            </Badge>
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px]">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-[var(--color-aurora-salmon)] focus:text-[var(--color-aurora-salmon)]"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Route
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Route Preview - Map or Visual representation */}
        <div className="w-full h-32 rounded-xl border border-[var(--border)] overflow-hidden relative">
          {route.coordinates && route.coordinates.length > 1 ? (
            <MiniRouteMap coordinates={route.coordinates} />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[var(--color-aurora-mint)]/10 via-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-between px-4">
                <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-mint)] shadow-lg" />
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[var(--color-aurora-mint)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] mx-2 rounded-full" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-pink)] shadow-lg" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 right-2 z-10">
            <Badge className="bg-[var(--color-aurora-purple)]/90 text-white text-[10px] shadow-lg">
              {distanceKm} km
            </Badge>
          </div>
        </div>

        {/* Route Details */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 rounded-lg bg-[var(--accent)]">
            <p className="text-xl font-bold text-[var(--color-aurora-purple)]">{distanceKm}</p>
            <p className="text-xs text-[var(--muted-foreground)]">km</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--accent)]">
            <p className="text-xl font-bold text-[var(--color-aurora-purple)]">{durationMin}</p>
            <p className="text-xs text-[var(--muted-foreground)]">min</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--accent)]">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-[var(--color-aurora-yellow)] fill-[var(--color-aurora-yellow)]" />
              <p className="text-xl font-bold text-[var(--color-aurora-purple)]">{route.rating}</p>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">rating</p>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-aurora-mint)]" />
            <span className="text-[var(--muted-foreground)]">From:</span>
            <span className="font-medium truncate text-[var(--foreground)]">{route.startLocation.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-aurora-pink)]" />
            <span className="text-[var(--muted-foreground)]">To:</span>
            <span className="font-medium truncate text-[var(--foreground)]">{route.endLocation.name}</span>
          </div>
        </div>

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {route.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-[var(--color-aurora-lavender)]/30 text-[var(--color-aurora-purple)]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{route.completionCount} completed</span>
            </div>
          </div>

          <Link href={`/routes/discover/${route._id}`}>
            <Button size="sm" className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white">
              View Route
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
