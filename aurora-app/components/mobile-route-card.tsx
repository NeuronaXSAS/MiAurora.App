"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, MapPin, Shield, Users, Sun } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { generateRouteStaticImage, calculateOptimalZoom } from "@/lib/mapbox-static-images";

interface MobileRouteCardProps {
  route: {
    _id: string;
    _creationTime: number;
    title: string;
    routeType: string;
    distance: number;
    duration: number;
    rating: number;
    tags: string[];
    startLocation: {
      lat: number;
      lng: number;
      name: string;
    };
    endLocation: {
      lat: number;
      lng: number;
      name: string;
    };
    completionCount: number;
    coordinates: Array<{
      lat: number;
      lng: number;
    }>;
  };
  safetyInsight?: string;
}

export function MobileRouteCard({ route, safetyInsight }: MobileRouteCardProps) {
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.round(route.duration / 60);
  const safetyScore = Math.round(route.rating * 20); // Convert 1-5 to 0-100

  // Generate optimized static map image using utility library
  const staticMapUrl = generateRouteStaticImage(route.coordinates, {
    width: 600,
    height: 300,
    zoom: calculateOptimalZoom(route.coordinates, 600, 300),
    retina: true,
  });

  return (
    <Link href={`/routes/discover/${route._id}`}>
      <Card className="overflow-hidden mb-4 shadow-lg hover:shadow-xl transition-shadow">
        {/* Map Image - Static for Performance */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={staticMapUrl}
            alt={route.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Safety Score Overlay */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-1.5">
              <Shield className={`w-4 h-4 ${
                safetyScore >= 70 ? 'text-green-600' : 
                safetyScore >= 40 ? 'text-yellow-600' : 
                'text-red-600'
              }`} />
              <span className="font-bold text-sm">{safetyScore}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight mb-1">{route.title}</h3>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(route._creationTime, { addSuffix: true })}
              </p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 text-xs">
              {route.routeType}
            </Badge>
          </div>

          {/* Stats Grid - Strava Style */}
          <div className="grid grid-cols-3 gap-3 py-3 border-y">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Distance</div>
              <div className="font-bold text-lg">{distanceKm} km</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Time</div>
              <div className="font-bold text-lg">{durationMin} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Completed</div>
              <div className="font-bold text-lg">{route.completionCount}</div>
            </div>
          </div>

          {/* AI Safety Insight */}
          {safetyInsight && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{safetyInsight}</p>
              </div>
            </div>
          )}

          {/* Tags */}
          {route.tags && route.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {route.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{route.startLocation.name}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
