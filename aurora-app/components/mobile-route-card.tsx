"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, Shield, ThumbsUp, ThumbsDown, MessageCircle, Share2 } from "lucide-react";
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
    upvotes?: number;
    downvotes?: number;
    commentCount?: number;
    coordinates: Array<{
      lat: number;
      lng: number;
    }>;
  };
  safetyInsight?: string;
  onVote?: (voteType: "upvote" | "downvote") => void;
}

export function MobileRouteCard({ route, safetyInsight, onVote }: MobileRouteCardProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(route.upvotes || route.completionCount || 0);
  const [showCopied, setShowCopied] = useState(false);

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

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLocalUpvotes(prev => prev - 1);
    } else {
      setLiked(true);
      setDisliked(false);
      setLocalUpvotes(prev => prev + 1);
    }
    onVote?.("upvote");
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      if (liked) {
        setLiked(false);
        setLocalUpvotes(prev => prev - 1);
      }
    }
    onVote?.("downvote");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/routes/discover/${route._id}`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

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

          {/* Engagement Actions */}
          <div className="flex items-center justify-between pt-3 border-t mt-3">
            <div className="flex items-center gap-1">
              {/* Upvote */}
              <button
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all min-h-[44px] ${
                  liked 
                    ? 'bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-purple)]' 
                    : 'hover:bg-[var(--color-aurora-mint)]/10 text-gray-500'
                }`}
                onClick={handleUpvote}
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{localUpvotes}</span>
              </button>
              
              {/* Downvote */}
              <button
                className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-all min-h-[44px] ${
                  disliked 
                    ? 'bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]' 
                    : 'hover:bg-gray-100 text-gray-400'
                }`}
                onClick={handleDownvote}
              >
                <ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-current' : ''}`} />
              </button>
              
              {/* Comments */}
              <Link 
                href={`/routes/discover/${route._id}#comments`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[var(--color-aurora-lavender)]/20 transition-colors min-h-[44px] text-gray-500"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{route.commentCount || 0}</span>
              </Link>
              
              {/* Share */}
              <button
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[var(--color-aurora-pink)]/10 transition-colors min-h-[44px] text-gray-500 relative"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
                {showCopied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-aurora-violet)] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Link copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
