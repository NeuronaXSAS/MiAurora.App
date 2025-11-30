'use client';

/**
 * UploadForm Component
 * 
 * Form for adding caption, safety tags, and posting the reel.
 * Shows upload progress with a sleek progress bar.
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import type { Id } from '@/convex/_generated/dataModel';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

// Simple Location Picker Component
function LocationPicker({ 
  onLocationSelect, 
  selectedLocation 
}: { 
  onLocationSelect: (loc: LocationData | null) => void;
  selectedLocation: LocationData | null;
}) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationName, setLocationName] = useState(selectedLocation?.name || '');

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get location name
      let name = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
        );
        const data = await response.json();
        if (data.features?.[0]?.place_name) {
          name = data.features[0].place_name;
        }
      } catch (e) {
        console.warn('Geocoding failed:', e);
      }

      setLocationName(name);
      onLocationSelect({ name, lat: latitude, lng: longitude });
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Could not get your location. Please check permissions.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const clearLocation = () => {
    setLocationName('');
    onLocationSelect(null);
  };

  return (
    <div className="space-y-2">
      {selectedLocation ? (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-aurora-mint)]/10 border border-[var(--color-aurora-mint)]/30 rounded-xl">
          <MapPin className="h-5 w-5 text-[var(--color-aurora-mint)] flex-shrink-0" />
          <span className="text-sm text-[var(--foreground)] flex-1 truncate">{selectedLocation.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearLocation}
            className="text-[var(--muted-foreground)] hover:text-[var(--color-aurora-salmon)] min-h-[36px]"
          >
            ✕
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full min-h-[48px] border-[var(--border)] hover:border-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Add my current location
            </>
          )}
        </Button>
      )}
      <p className="text-xs text-[var(--muted-foreground)]">
        Adding location helps other women discover safe areas
      </p>
    </div>
  );
}

interface UploadFormProps {
  videoBlob: Blob;
  videoPreviewUrl: string;
  userId: Id<'users'>;
  onSuccess: () => void;
  onCancel: () => void;
}

const SAFETY_TAGS = [
  { id: 'safe', label: 'Safe Area', emoji: '✅' },
  { id: 'harassment', label: 'Harassment', emoji: '⚠️' },
  { id: 'dark', label: 'Dark/Poorly Lit', emoji: '🌙' },
  { id: 'inspiring', label: 'Inspiring', emoji: '✨' },
  { id: 'crowded', label: 'Crowded', emoji: '👥' },
  { id: 'isolated', label: 'Isolated', emoji: '🚶' },
];

export function UploadForm({
  videoBlob,
  videoPreviewUrl,
  userId,
  onSuccess,
  onCancel,
}: UploadFormProps) {
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const { upload, progress, isUploading, error } = useVideoUpload();

  const handleSubmit = async () => {
    // Convert Blob to File
    const file = new File([videoBlob], 'reel.webm', { type: 'video/webm' });

    // Extract hashtags from caption
    const hashtags = caption.match(/#\w+/g)?.map((tag) => tag.slice(1)) || [];

    const result = await upload(file, {
      caption,
      hashtags,
      isAnonymous,
      safetyTags: selectedTags,
      location: location ? {
        name: location.name,
        coordinates: [location.lng, location.lat],
      } : undefined,
    }, userId);

    if (result.success) {
      onSuccess();
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] flex flex-col">
      {/* Video Preview (Small) */}
      <div className="relative w-full h-64 bg-[var(--color-aurora-violet)]">
        <video
          src={videoPreviewUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--background)]/60" />
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto bg-[var(--background)] p-6 space-y-6">
        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption" className="text-[var(--foreground)] text-lg">
            Caption
          </Label>
          <Textarea
            id="caption"
            placeholder="Share your experience... Use #hashtags"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            rows={4}
            className="bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none rounded-xl"
          />
          <p className="text-sm text-[var(--muted-foreground)] text-right">
            {caption.length}/500
          </p>
        </div>

        {/* Safety Tags */}
        <div className="space-y-3">
          <Label className="text-[var(--foreground)] text-lg">Safety Tags</Label>
          <p className="text-sm text-[var(--muted-foreground)]">
            Help other women by tagging the safety aspects of this location
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SAFETY_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/20'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--color-aurora-lavender)]'
                }`}
              >
                <span className="text-2xl">{tag.emoji}</span>
                <span className="text-sm text-[var(--foreground)] font-medium">
                  {tag.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center space-x-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
          <Checkbox
            id="anonymous"
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            className="border-[var(--border)]"
          />
          <div className="flex-1">
            <Label
              htmlFor="anonymous"
              className="text-[var(--foreground)] font-medium cursor-pointer"
            >
              Post anonymously
            </Label>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your name won't be shown, but you'll still earn credits
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label className="text-[var(--foreground)] text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--color-aurora-purple)]" />
            Location
          </Label>
          <LocationPicker 
            onLocationSelect={(loc) => setLocation(loc)}
            selectedLocation={location}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)] rounded-xl">
            <p className="text-[var(--color-aurora-salmon)] text-sm">{error}</p>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Uploading...</span>
              <span className="text-[var(--color-aurora-purple)] font-semibold">
                {progress.percentage}%
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-6 bg-[var(--card)] border-t border-[var(--border)] space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={isUploading || caption.trim().length === 0}
          className="w-full h-14 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white font-semibold text-lg rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              Post Reel
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <Button
          onClick={onCancel}
          disabled={isUploading}
          variant="ghost"
          className="w-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
