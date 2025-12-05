"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, BarChart3, MapPin, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface PollCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
}

export function PollCreateDialog({
  open,
  onOpenChange,
  userId,
}: PollCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [lifeDimension, setLifeDimension] = useState<string>("social");
  const [locationName, setLocationName] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPoll = useMutation(api.polls.createPoll);

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
          );
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            setLocationName(data.features[0].place_name);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        }
        setIsGettingLocation(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Could not get your location");
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (title.length < 10 || title.length > 200) {
      setError("Poll question must be 10-200 characters");
      return;
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      setError("Must have at least 2 options");
      return;
    }
    if (validOptions.length > 6) {
      setError("Maximum 6 options allowed");
      return;
    }

    for (const option of validOptions) {
      if (option.length > 100) {
        setError("Each option must be 100 characters or less");
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      const result = await createPoll({
        authorId: userId,
        title: title.trim(),
        description: description.trim() || undefined,
        options: validOptions.map(opt => opt.trim()),
        isAnonymous,
        lifeDimension: lifeDimension as any,
        location: locationName.trim() || undefined,
      });

      if (result.success) {
        // Reset form
        setTitle("");
        setDescription("");
        setOptions(["", ""]);
        setIsAnonymous(false);
        setLifeDimension("social");
        setLocationName("");
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Poll creation error:", err);
      setError(err.message || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Create a Poll
          </DialogTitle>
          <DialogDescription>
            Ask the community a question and get their opinions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Poll Question * (10-200 characters)
            </label>
            <Textarea
              placeholder="What would you like to ask the community?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Context (Optional)
            </label>
            <Textarea
              placeholder="Add more details about your poll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Poll Options (2-6 options)
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>

          {/* Life Dimension */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Category *
            </label>
            <Select value={lifeDimension} onValueChange={setLifeDimension}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="daily">Daily Life</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., San Francisco, CA"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                title="Use my current location"
                className="min-w-[44px] min-h-[44px]"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <label
              htmlFor="anonymous"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Post anonymously
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || title.length < 10}
            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
          >
            {loading ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
