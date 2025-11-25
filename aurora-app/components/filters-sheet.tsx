"use client";

import { useState } from "react";
import { BottomSheet } from "./ui/bottom-sheet";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface FiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters?: any;
}

export function FiltersSheet({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
}: FiltersSheetProps) {
  const [filters, setFilters] = useState({
    minRating: initialFilters.minRating || 0,
    maxDistance: initialFilters.maxDistance || 50,
    tags: initialFilters.tags || [],
    verifiedOnly: initialFilters.verifiedOnly || false,
  });

  const availableTags = [
    "Safe",
    "Scenic",
    "Urban",
    "Nature",
    "Historic",
    "Shopping",
    "Dining",
    "Nightlife",
    "Family-Friendly",
  ];

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t: string) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      minRating: 0,
      maxDistance: 50,
      tags: [],
      verifiedOnly: false,
    });
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      snapPoints={[60, 90]}
      defaultSnap={0}
    >
      <div className="space-y-6">
        {/* Minimum Rating */}
        <div className="space-y-2">
          <Label>Minimum Rating (stars)</Label>
          <Input
            type="number"
            value={filters.minRating}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, minRating: parseFloat(e.target.value) || 0 }))
            }
            min={0}
            max={5}
            step={0.5}
          />
        </div>

        {/* Max Distance */}
        <div className="space-y-2">
          <Label>Maximum Distance (km)</Label>
          <Input
            type="number"
            value={filters.maxDistance}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, maxDistance: parseInt(e.target.value) || 50 }))
            }
            min={1}
            max={100}
          />
        </div>

        {/* Verified Only */}
        <div className="flex items-center justify-between p-4 bg-aurora-lavender/10 rounded-xl">
          <div>
            <Label>Verified Routes Only</Label>
            <p className="text-xs text-gray-600 mt-1">
              Show only community-verified routes
            </p>
          </div>
          <Switch
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({ ...prev, verifiedOnly: checked }))
            }
          />
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={filters.tags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  filters.tags.includes(tag)
                    ? "bg-aurora-violet text-white"
                    : "hover:bg-aurora-lavender/20"
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
                {filters.tags.includes(tag) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl pb-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            className="flex-1 bg-aurora-violet hover:bg-aurora-violet/90"
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
