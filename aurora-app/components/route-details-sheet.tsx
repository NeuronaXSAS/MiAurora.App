"use client";

import { BottomSheet } from "./ui/bottom-sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Star, Clock, TrendingUp, Share2 } from "lucide-react";

interface RouteDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  route: any;
}

export function RouteDetailsSheet({
  isOpen,
  onClose,
  route,
}: RouteDetailsSheetProps) {
  if (!route) return null;

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km < 1 ? `${meters}m` : `${km.toFixed(1)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={route.name || "Route Details"}
      snapPoints={[40, 80]}
      defaultSnap={0}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-aurora-lavender/20 rounded-xl">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-aurora-violet" />
            <p className="text-2xl font-bold text-aurora-violet">
              {formatDistance(route.distance || 0)}
            </p>
            <p className="text-xs text-gray-600">Distance</p>
          </div>
          
          <div className="text-center p-4 bg-aurora-blue/10 rounded-xl">
            <Clock className="w-5 h-5 mx-auto mb-2 text-aurora-blue" />
            <p className="text-2xl font-bold text-aurora-blue">
              {formatDuration(route.duration || 0)}
            </p>
            <p className="text-xs text-gray-600">Duration</p>
          </div>
          
          <div className="text-center p-4 bg-aurora-orange/10 rounded-xl">
            <Star className="w-5 h-5 mx-auto mb-2 text-aurora-orange" />
            <p className="text-2xl font-bold text-aurora-orange">
              {route.rating || 0}/5
            </p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
        </div>

        {/* Description */}
        {route.description && (
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 text-sm">{route.description}</p>
          </div>
        )}

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="bg-aurora-lavender/30">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Start/End Points */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Start</p>
              <p className="text-sm font-medium">{route.startLocation || "Unknown"}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">End</p>
              <p className="text-sm font-medium">{route.endLocation || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button className="flex-1 bg-aurora-violet hover:bg-aurora-violet/90">
            Start Route
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
