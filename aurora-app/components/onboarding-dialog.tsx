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
import { Sparkles } from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  workosId: string;
  onComplete: () => void;
}

export function OnboardingDialog({
  open,
  workosId,
  onComplete,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(false);

  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        workosId,
        industry: industry || undefined,
        location: location || undefined,
        careerGoals: careerGoals || undefined,
        bio: bio || undefined,
        interests: interests.length > 0 ? interests : undefined,
        profileImage: profileImage || undefined,
      });
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Welcome to Aurora App!
          </DialogTitle>
          <DialogDescription>
            Let's personalize your experience. This will help us show you the most relevant opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What industry do you work in? (Optional)
                </label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Where are you located? (Optional)
                </label>
                <Input
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Skip
                </Button>
                <Button onClick={() => setStep(2)}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What are your career goals? (Optional)
                </label>
                <Textarea
                  placeholder="e.g., Find a senior engineering role at a safe, inclusive company"
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-2">
                  This helps our AI assistant provide personalized guidance
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tell us about yourself (Optional)
                </label>
                <Textarea
                  placeholder="Share a bit about your background, experience, or what you're passionate about..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bio.length}/500 characters
                </p>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    Skip
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  What are your interests? (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Career Growth",
                    "Networking",
                    "Mentorship",
                    "Work-Life Balance",
                    "Remote Work",
                    "Entrepreneurship",
                    "Leadership",
                    "Tech & Innovation",
                    "Diversity & Inclusion",
                    "Professional Development",
                    "Wellness",
                    "Community Building",
                  ].map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        interests.includes(interest)
                          ? "bg-purple-100 border-purple-600 text-purple-900"
                          : "bg-white border-gray-300 text-gray-700 hover:border-purple-300"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Profile Picture URL (Optional)
                </label>
                <Input
                  placeholder="https://example.com/your-photo.jpg"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL to your profile picture
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-purple-900">
                      You've earned 25 bonus credits!
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      Use them to unlock opportunities, or earn more by contributing to the community.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    Skip
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Saving..." : "Complete"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
