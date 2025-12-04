"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Radio, Eye, MapPin, AlertTriangle, Play } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface LivestreamFeedCardProps {
  livestream: {
    _id: Id<"livestreams">;
    _creationTime: number;
    title: string;
    description?: string;
    viewerCount: number;
    isEmergency?: boolean;
    location?: {
      name: string;
      coordinates: number[];
    };
    host: {
      _id: Id<"users">;
      name: string;
      profileImage?: string;
    } | null;
    channelName: string;
  };
  currentUserId?: Id<"users">;
}

export const LivestreamFeedCard = memo(function LivestreamFeedCard({
  livestream,
  currentUserId,
}: LivestreamFeedCardProps) {
  const hostInitials = livestream.host?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Card className={`overflow-hidden border ${
      livestream.isEmergency 
        ? "border-[var(--color-aurora-orange)] bg-[var(--color-aurora-orange)]/5" 
        : "border-[var(--border)] bg-[var(--card)]"
    }`}>
      <CardContent className="p-4">
        {/* Header with host info */}
        <div className="flex items-start gap-3 mb-3">
          <Link href={livestream.host ? `/profile/${livestream.host._id}` : "#"}>
            <Avatar className="w-10 h-10 border-2 border-[var(--color-aurora-purple)]">
              <AvatarImage src={livestream.host?.profileImage} />
              <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                {hostInitials}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link 
                href={livestream.host ? `/profile/${livestream.host._id}` : "#"}
                className="font-medium text-[var(--foreground)] hover:underline truncate"
              >
                {livestream.host?.name || "Anonymous"}
              </Link>
              
              {/* Live Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold animate-pulse">
                <Radio className="w-3 h-3" />
                LIVE
              </span>
              
              {/* Emergency Badge */}
              {livestream.isEmergency && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-aurora-orange)] text-white text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  SOS
                </span>
              )}
            </div>
            
            <p className="text-xs text-[var(--muted-foreground)]">
              is streaming now
            </p>
          </div>

          {/* Viewer count */}
          <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">{livestream.viewerCount}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-semibold mb-2 ${
          livestream.isEmergency 
            ? "text-[var(--color-aurora-orange)]" 
            : "text-[var(--foreground)]"
        }`}>
          {livestream.title}
        </h3>

        {/* Description */}
        {livestream.description && (
          <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
            {livestream.description}
          </p>
        )}

        {/* Location */}
        {livestream.location && (
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] mb-3">
            <MapPin className="w-3 h-3" />
            <span>{livestream.location.name}</span>
          </div>
        )}

        {/* Watch Button */}
        <Link href={`/live?channel=${livestream.channelName}`}>
          <Button 
            className={`w-full ${
              livestream.isEmergency
                ? "bg-[var(--color-aurora-orange)] hover:bg-[var(--color-aurora-orange)]/90"
                : "bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-blue)]/90"
            } text-white`}
          >
            <Play className="w-4 h-4 mr-2" />
            {livestream.isEmergency ? "Watch Emergency Stream" : "Watch Live"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
});
