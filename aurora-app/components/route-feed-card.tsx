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
import { Route, MapPin, Clock, TrendingUp, Star, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

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
        {/* Route Preview - Visual representation */}
        <div className="w-full h-24 bg-gradient-to-r from-[var(--color-aurora-mint)]/10 via-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl border border-[var(--border)] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-mint)] shadow-lg" />
            <div className="flex-1 h-0.5 bg-gradient-to-r from-[var(--color-aurora-mint)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] mx-2 rounded-full" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-aurora-pink)] shadow-lg" />
          </div>
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-[var(--color-aurora-purple)]/80 text-white text-[10px]">
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
