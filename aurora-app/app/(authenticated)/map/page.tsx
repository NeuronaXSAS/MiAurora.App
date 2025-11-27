"use client";

import { useState, useEffect } from "react";
import { SafetyMap } from "@/components/safety-map";
import { PostCreateDialog } from "@/components/post-create-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Menu } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function MapPage() {
  const [lifeDimension, setLifeDimension] = useState<string | undefined>(
    undefined
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showControls, setShowControls] = useState(false);

  // Get user ID
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

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(location);
    setShowCreateDialog(true);
  };

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-[var(--background)]">
      {/* Full-screen Map */}
      <SafetyMap 
        lifeDimension={lifeDimension}
        onLocationSelect={handleLocationSelect}
      />

      {/* Floating Header Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Toggle Controls Button */}
        <Button
          onClick={() => setShowControls(!showControls)}
          className="bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] shadow-lg border border-[var(--border)] min-w-[44px] min-h-[44px]"
          size="icon"
          title="Toggle controls"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Title Badge */}
        <div className="bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[var(--color-aurora-purple)]" />
          <span className="font-semibold text-sm text-[var(--foreground)]">Safety Map</span>
        </div>
      </div>

      {/* Expandable Controls Panel */}
      {showControls && (
        <div className="absolute top-16 left-4 z-20 bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg p-3 flex flex-col gap-3 min-w-[200px]">
          {/* Filter */}
          <Select
            value={lifeDimension || "all"}
            onValueChange={(value) =>
              setLifeDimension(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full bg-[var(--background)] border-[var(--border)]">
              <SelectValue placeholder="All Dimensions" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
              <SelectItem value="all">All Dimensions</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="daily">Daily Life</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>

          {/* Create Post Button */}
          <Button 
            onClick={() => {
              setShowCreateDialog(true);
              setShowControls(false);
            }} 
            className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Mark Location
          </Button>
        </div>
      )}

      {/* Create Post Dialog */}
      {userId && (
        <PostCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={userId}
          prefilledLocation={selectedLocation?.address}
        />
      )}
    </div>
  );
}
