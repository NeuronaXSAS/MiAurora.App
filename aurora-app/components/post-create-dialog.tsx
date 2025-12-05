"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/file-upload";
import { Star, MapPin, Sparkles, Lock, Crown, Users } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

interface PostCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  prefilledLocation?: string;
}

export function PostCreateDialog({
  open,
  onOpenChange,
  userId,
  prefilledLocation,
}: PostCreateDialogProps) {
  const [lifeDimension, setLifeDimension] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [locationName, setLocationName] = useState(prefilledLocation || "");
  const [locationCoordinates, setLocationCoordinates] = useState<[number, number] | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [contentAccess, setContentAccess] = useState<"public" | "subscribers" | "premium">("public");
  const [requiredTier, setRequiredTier] = useState<string>("plus");

  // Enable subscriber-only content for all users (creator feature)
  const isCreator = true; // All users can create subscriber-only content

  // Update location when prefilled location changes
  useEffect(() => {
    if (prefilledLocation) {
      setLocationName(prefilledLocation);
    }
  }, [prefilledLocation]);

  const createPost = useMutation(api.posts.create);
  const addMedia = useMutation(api.posts.addMedia);

  // Geocode location using Mapbox
  const geocodeLocation = async (address: string): Promise<[number, number] | null> => {
    if (!address.trim()) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
      );
      
      if (!response.ok) {
        console.error("Geocoding failed:", response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
      
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Track event
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('post_created', {
        lifeDimension,
        hasLocation: !!locationName,
        hasMedia: uploadedFiles.length > 0,
        rating,
      });
    }
    // Validation
    if (!lifeDimension) {
      setError("Please select a life dimension");
      return;
    }
    if (title.length < 10 || title.length > 200) {
      setError("Title must be 10-200 characters");
      return;
    }
    if (description.length < 20 || description.length > 2000) {
      setError("Description must be 20-2000 characters");
      return;
    }
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Geocode location if provided
      let coordinates: [number, number] | undefined = undefined;
      if (locationName.trim()) {
        setIsGeocodingLocation(true);
        const coords = await geocodeLocation(locationName);
        setIsGeocodingLocation(false);
        
        if (coords) {
          coordinates = coords;
          setLocationCoordinates(coords);
        } else {
          setError("Could not find location. Please check the address and try again.");
          setLoading(false);
          return;
        }
      }

      // Create post
      const result = await createPost({
        authorId: userId,
        lifeDimension: lifeDimension as any,
        title,
        description,
        rating,
        location: locationName.trim() && coordinates
          ? {
              name: locationName,
              coordinates,
            }
          : undefined,
        isAnonymous,
      });

      if (result.success && result.postId) {
        // Add media if any
        if (uploadedFiles.length > 0) {
          await addMedia({
            postId: result.postId,
            media: uploadedFiles.map((file) => ({
              type: file.type,
              storageId: file.storageId,
              url: file.url,
            })),
          });
        }

        // Reset form
        setLifeDimension("");
        setTitle("");
        setDescription("");
        setRating(0);
        setLocationName("");
        setLocationCoordinates(null);
        setIsAnonymous(false);
        setUploadedFiles([]);
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Post creation error:", err);
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
          <DialogDescription>
            Share your experience and earn 10 credits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Life Dimension */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Life Dimension *
            </label>
            <Select value={lifeDimension} onValueChange={setLifeDimension}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dimension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">
                  Professional - Workplaces & Careers
                </SelectItem>
                <SelectItem value="social">
                  Social - Clubs, Bars & Events
                </SelectItem>
                <SelectItem value="daily">
                  Daily Life - Gyms, Shops & Services
                </SelectItem>
                <SelectItem value="travel">
                  Travel - Cities & Destinations
                </SelectItem>
                <SelectItem value="financial">
                  Financial - Banking & Investments
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Title * (10-200 characters)
            </label>
            <Input
              placeholder="e.g., Great workplace with supportive culture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Description * (20-2000 characters)
            </label>
            <Textarea
              placeholder="Share your detailed experience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/2000 characters
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Safety/Comfort Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      value <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Very Unsafe"}
              {rating === 2 && "Somewhat Unsafe"}
              {rating === 3 && "Neutral"}
              {rating === 4 && "Safe"}
              {rating === 5 && "Very Safe"}
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 123 Main St, San Francisco, CA"
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value);
                  setLocationCoordinates(null); // Reset coordinates when location changes
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (navigator.geolocation) {
                    setIsGeocodingLocation(true);
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocationCoordinates([longitude, latitude]);
                        
                        // Reverse geocode to get address
                        try {
                          const response = await fetch(
                            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
                          );
                          const data = await response.json();
                          if (data.features && data.features.length > 0) {
                            setLocationName(data.features[0].place_name);
                          }
                        } catch (error) {
                          console.error("Reverse geocoding error:", error);
                        }
                        setIsGeocodingLocation(false);
                      },
                      (error) => {
                        console.error("Geolocation error:", error);
                        setError("Could not get your location. Please enter it manually.");
                        setIsGeocodingLocation(false);
                      }
                    );
                  } else {
                    setError("Geolocation is not supported by your browser");
                  }
                }}
                disabled={isGeocodingLocation}
                title="Use my current location"
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </div>
            {isGeocodingLocation && (
              <p className="text-xs text-gray-500 mt-1">
                Finding location on map...
              </p>
            )}
            {locationCoordinates && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Location found and will be marked on map
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Photos & Videos (Optional)
            </label>
            <FileUpload
              onFilesChange={setUploadedFiles}
              maxFiles={5}
            />
          </div>

          {/* Content Access Control - Subscriber-Only Content */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Content Access
              <Badge className="bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)] border-0 text-xs">
                Creator Feature
              </Badge>
            </label>
            <Select value={contentAccess} onValueChange={(v) => setContentAccess(v as typeof contentAccess)}>
              <SelectTrigger>
                <SelectValue placeholder="Who can see this post?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span>Public - Everyone can see</span>
                  </div>
                </SelectItem>
                <SelectItem value="subscribers">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                    <span>Subscribers Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                    <span>Premium Subscribers</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {contentAccess !== "public" && (
              <p className="text-xs text-[var(--color-aurora-purple)] mt-1">
                💜 Only your {contentAccess === "premium" ? "premium " : ""}subscribers will see this content
              </p>
            )}
          </div>

          {/* Tier Selector for Subscriber Content */}
          {contentAccess !== "public" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Required Tier
              </label>
              <Select value={requiredTier} onValueChange={setRequiredTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plus">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-aurora-lavender)]" />
                      <span>Aurora Plus ($5/mo)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pro">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-aurora-purple)]" />
                      <span>Aurora Pro ($12/mo)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="elite">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-aurora-yellow)]" />
                      <span>Aurora Elite ($25/mo)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Anonymous Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous && contentAccess === "public"}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
              disabled={contentAccess !== "public"}
            />
            <label htmlFor="anonymous" className={`text-sm ${contentAccess !== "public" ? "text-gray-400" : ""}`}>
              Post anonymously
              {contentAccess !== "public" && (
                <span className="text-xs text-gray-400 ml-1">(Not available for subscriber content)</span>
              )}
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Reward Info */}
          <div className="bg-aurora-lavender/20 border border-aurora-lavender rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-aurora-violet mt-0.5" />
              <div>
                <p className="font-medium text-sm text-aurora-violet">
                  Earn 10 credits for posting!
                </p>
                <p className="text-xs text-aurora-violet/80 mt-1">
                  Help other women and unlock opportunities
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || isGeocodingLocation}>
              {isGeocodingLocation ? "Finding location..." : loading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
