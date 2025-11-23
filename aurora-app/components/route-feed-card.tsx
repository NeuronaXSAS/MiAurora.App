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
    <Card className="hover-lift animate-fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Route className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{route.title}</h3>
              <p className="text-sm text-gray-600">
                {formatDistanceToNow(route._creationTime, { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              {route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)}
            </Badge>
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
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
        {/* Route Details */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{distanceKm}</p>
            <p className="text-xs text-gray-600">km</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{durationMin}</p>
            <p className="text-xs text-gray-600">min</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{route.rating}</p>
            <p className="text-xs text-gray-600">rating</p>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">From:</span>
            <span className="font-medium truncate">{route.startLocation.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">To:</span>
            <span className="font-medium truncate">{route.endLocation.name}</span>
          </div>
        </div>

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {route.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{route.completionCount} completed</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{route.rating}/5</span>
            </div>
          </div>

          <Link href={`/routes/discover/${route._id}`}>
            <Button size="sm">View Route</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
