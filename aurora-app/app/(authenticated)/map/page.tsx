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
import { MapPin, Plus } from "lucide-react";
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
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[var(--color-aurora-purple)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Safety Map</h1>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                  Click + to mark a location
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter */}
              <Select
                value={lifeDimension || "all"}
                onValueChange={(value) =>
                  setLifeDimension(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-[var(--background)] border-[var(--border)]">
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
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create Post</span>
                <span className="sm:hidden">New Post</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <SafetyMap 
          lifeDimension={lifeDimension}
          onLocationSelect={handleLocationSelect}
        />
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
