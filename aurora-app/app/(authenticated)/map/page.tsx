"use client";

import { useState, useEffect } from "react";
import { LazyMap } from "@/components/lazy-map";
import { PostCreateDialog } from "@/components/post-create-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <div className="h-[calc(100dvh-60px)] w-full relative overflow-hidden bg-[var(--background)]">
      {/* Full-screen Map - Lazy loaded for performance */}
      <LazyMap 
        lifeDimension={lifeDimension}
        onLocationSelect={handleLocationSelect}
      />

      {/* Bottom Controls - Clean and organized */}
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-lg p-3">
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <Select
              value={lifeDimension || "all"}
              onValueChange={(value) =>
                setLifeDimension(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="flex-1 bg-[var(--background)] border-[var(--border)] min-h-[44px] rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="professional">💼 Professional</SelectItem>
                <SelectItem value="social">👥 Social</SelectItem>
                <SelectItem value="daily">🏠 Daily Life</SelectItem>
                <SelectItem value="travel">✈️ Travel</SelectItem>
                <SelectItem value="financial">💰 Financial</SelectItem>
              </SelectContent>
            </Select>

            {/* Mark Location Button */}
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px] rounded-xl px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Mark</span>
            </Button>
          </div>
        </div>
      </div>

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
