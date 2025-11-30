"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Globe, 
  Heart,
  CheckCircle,
  MapPin,
  Navigation,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";

interface WorkplaceReportFormProps {
  userId: Id<"users">;
  onSuccess?: () => void;
}

const INCIDENT_TYPES = [
  { value: "harassment", label: "Sexual Harassment", icon: "🚫" },
  { value: "discrimination", label: "Discrimination", icon: "⚖️" },
  { value: "pay_inequality", label: "Pay Inequality", icon: "💰" },
  { value: "hostile_environment", label: "Hostile Environment", icon: "😰" },
  { value: "retaliation", label: "Retaliation", icon: "🔄" },
  { value: "other", label: "Other", icon: "📝" },
];

const SUPPORT_OPTIONS = [
  { id: "legal", label: "Legal Advice" },
  { id: "counseling", label: "Counseling" },
  { id: "career", label: "Career Guidance" },
  { id: "community", label: "Community Support" },
  { id: "resources", label: "Educational Resources" },
];

export function WorkplaceReportForm({ userId, onSuccess }: WorkplaceReportFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [incidentType, setIncidentType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [showOnMap, setShowOnMap] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [supportNeeded, setSupportNeeded] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const submitReport = useMutation(api.workplaceReports.submitReport);

  const toggleSupport = (supportId: string) => {
    setSupportNeeded(prev => 
      prev.includes(supportId) 
        ? prev.filter(s => s !== supportId)
        : [...prev, supportId]
    );
  };

  const handleSubmit = async () => {
    if (!companyName || !incidentType || !description) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        reporterId: userId,
        companyName,
        incidentType: incidentType as any,
        description,
        date: date || undefined,
        isAnonymous,
        isPublic,
        shareToFeed,
        showOnMap,
        location: location ? {
          name: location.name,
          coordinates: [location.lng, location.lat],
        } : undefined,
        supportNeeded: supportNeeded.length > 0 ? supportNeeded : undefined,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-[var(--color-aurora-mint)]/30 border-[var(--color-aurora-mint)]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[var(--color-aurora-mint)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[var(--color-aurora-violet)]" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Thank You for Your Courage
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Your report has been submitted. You've earned 25 credits for helping protect other women.
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isPublic 
                ? "Your report will be visible to the community (anonymously if selected)."
                : "Your report is private and will only be used for aggregate safety data."
              }
            </p>
            <Button
              className="mt-6 min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
              onClick={() => {
                setSubmitted(false);
                setCompanyName("");
                setIncidentType("");
                setDescription("");
                setDate("");
                setSupportNeeded([]);
              }}
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="bg-[var(--card)] border-[var(--border)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
          <Shield className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          Report Workplace Incident
        </CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Your voice matters. Help protect other women by sharing your experience.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div>
          <Label htmlFor="company" className="text-[var(--foreground)]">Company Name *</Label>
          <Input
            id="company"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        {/* Incident Type */}
        <div>
          <Label className="text-[var(--foreground)]">Type of Incident *</Label>
          <Select value={incidentType} onValueChange={setIncidentType}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select incident type" />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="date" className="text-[var(--foreground)]">When did this happen? (optional)</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-[var(--foreground)]">Describe what happened *</Label>
          <Textarea
            id="description"
            placeholder="Share your experience. Be as detailed as you're comfortable with..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Your description helps others understand the situation and may help identify patterns.
          </p>
        </div>

        {/* Privacy Options */}
        <div className="space-y-4 p-4 bg-[var(--accent)] rounded-xl">
          <h4 className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
            <Lock className="w-4 h-4" />
            Privacy Settings
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="anonymous" className="text-[var(--foreground)]">Submit Anonymously</Label>
              <p className="text-xs text-[var(--muted-foreground)]">Your identity will never be revealed</p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public" className="text-[var(--foreground)]">Share with Community</Label>
              <p className="text-xs text-[var(--muted-foreground)]">Help warn others about this company</p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="shareToFeed" className="text-[var(--foreground)] flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share to Main Feed
              </Label>
              <p className="text-xs text-[var(--muted-foreground)]">Post this report to the main feed for visibility</p>
            </div>
            <Switch
              id="shareToFeed"
              checked={shareToFeed}
              onCheckedChange={setShareToFeed}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showOnMap" className="text-[var(--foreground)] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Show on Safety Map
              </Label>
              <p className="text-xs text-[var(--muted-foreground)]">Mark this location on the community safety map</p>
            </div>
            <Switch
              id="showOnMap"
              checked={showOnMap}
              onCheckedChange={setShowOnMap}
            />
          </div>

          {/* Location Picker (when showOnMap is enabled) */}
          {showOnMap && (
            <div className="p-3 bg-[var(--card)] rounded-lg space-y-2">
              {location ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                    <span className="text-sm text-[var(--foreground)]">{location.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(null)}
                    className="text-[var(--muted-foreground)]"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsGettingLocation(true);
                    try {
                      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                          enableHighAccuracy: true,
                          timeout: 10000,
                        });
                      });
                      const { latitude, longitude } = position.coords;
                      
                      // Reverse geocode
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
                      
                      setLocation({ lat: latitude, lng: longitude, name });
                    } catch (error) {
                      console.error('Error getting location:', error);
                      alert('Could not get your location. Please check permissions.');
                    } finally {
                      setIsGettingLocation(false);
                    }
                  }}
                  disabled={isGettingLocation}
                  className="w-full min-h-[44px]"
                >
                  {isGettingLocation ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Use Current Location
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Support Needed */}
        <div>
          <Label className="text-[var(--foreground)]">What support do you need? (optional)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SUPPORT_OPTIONS.map((option) => (
              <Badge
                key={option.id}
                variant={supportNeeded.includes(option.id) ? "default" : "outline"}
                className={`cursor-pointer min-h-[36px] px-3 ${
                  supportNeeded.includes(option.id) 
                    ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]" 
                    : "hover:bg-[var(--color-aurora-lavender)]/30"
                }`}
                onClick={() => toggleSupport(option.id)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-[var(--color-aurora-yellow)]/20 border border-[var(--color-aurora-yellow)]/50 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-yellow)] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--foreground)]">
              <p className="font-semibold mb-1">Important Notice</p>
              <p className="text-[var(--muted-foreground)]">
                This report is for community awareness and support. For legal action, 
                please consult with a qualified attorney. If you're in immediate danger, 
                contact emergency services.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !companyName || !incidentType || !description}
          className="w-full min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:from-[var(--color-aurora-violet)] hover:to-[var(--color-aurora-pink)]/90"
        >
          {isSubmitting ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              Submit Report (+25 credits)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
