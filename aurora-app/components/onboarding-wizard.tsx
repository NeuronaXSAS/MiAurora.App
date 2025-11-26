"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Briefcase, Shield, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { AvatarCreator, AvatarConfig } from "@/components/avatar-creator";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  userId: Id<"users">;
}

const ROLES = ["Student", "Professional", "Traveler", "Entrepreneur", "Job Seeker"];
const INTERESTS = [
  "Safe Commuting",
  "Nightlife Safety",
  "Career Mentorship",
  "B2B Networking",
  "Workplace Safety",
  "Travel Safety",
  "Financial Opportunities",
  "Skill Development",
];

export function OnboardingWizard({ open, onComplete, userId: _userId }: OnboardingWizardProps) {
  const [step, setStep] = useState(0); // Start at 0 for avatar creation
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "anonymous" | "private">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workosId, setWorkosId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [showAvatarCreator, setShowAvatarCreator] = useState(true);
  const [location, setLocation] = useState("");

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const updatePrivacy = useMutation(api.privacy.updatePrivacySettings);

  // Get WorkOS ID from user
  useEffect(() => {
    const getWorkosId = async () => {
      try {
        console.log("🔍 Fetching user authentication data...");
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        console.log("📦 Auth API response:", data);
        
        // The API returns workosUserId, not workosId
        if (data.workosUserId) {
          console.log("✅ WorkOS ID found:", data.workosUserId);
          setWorkosId(data.workosUserId);
        } else if (data.workosId) {
          console.log("✅ WorkOS ID found (legacy):", data.workosId);
          setWorkosId(data.workosId);
        } else {
          console.error("❌ No workosId or workosUserId in response");
        }
      } catch (error) {
        console.error("❌ Error getting workosId:", error);
      }
    };
    getWorkosId();
  }, []);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (!workosId) {
      setError("Unable to save preferences. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      console.log("🚀 Starting onboarding with data:", {
        workosId,
        bio: bio || undefined,
        industry: role || undefined,
        careerGoals: selectedInterests.join(", ") || undefined,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
      });

      // Complete onboarding with profile data
      await completeOnboarding({
        workosId,
        bio: bio || undefined,
        location: location || undefined,
        industry: role || undefined,
        careerGoals: selectedInterests.join(", ") || undefined,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
      });

      console.log("✅ Onboarding mutation completed successfully");

      // Try to update privacy settings (non-blocking)
      try {
        console.log("🔒 Updating privacy settings:", {
          profileVisibility: visibility === 'anonymous' ? 'private' : visibility,
        });
        await updatePrivacy({
          profileVisibility: visibility === 'anonymous' ? 'private' : visibility,
        });
        console.log("✅ Privacy settings updated successfully");
      } catch (privacyError) {
        console.warn("⚠️ Privacy settings update failed (non-critical):", privacyError);
      }

      console.log("🎉 Onboarding complete! Calling onComplete()");
      onComplete();
    } catch (error) {
      console.error("❌ Onboarding error:", error);
      // Show the actual error message from the backend
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle avatar creation
  const handleAvatarComplete = (config: AvatarConfig) => {
    setAvatarConfig(config);
    // Save avatar to localStorage so it persists across the app
    try {
      localStorage.setItem('aurora-avatar-config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
    setShowAvatarCreator(false);
    setStep(1);
  };

  const handleAvatarSkip = () => {
    setShowAvatarCreator(false);
    setStep(1);
  };

  // Show avatar creator first
  if (showAvatarCreator) {
    return (
      <AvatarCreator
        open={open}
        onComplete={handleAvatarComplete}
        onSkip={handleAvatarSkip}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl backdrop-blur-xl bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#231E35] to-[var(--color-aurora-purple)] border-[var(--color-aurora-pink)]/30 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {/* Aurora App Logo */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-[var(--color-aurora-purple)]/50">
              <img 
                src="/Au_Logo_1.png" 
                alt="Aurora App Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <DialogTitle className="text-2xl text-white">Welcome to Aurora App!</DialogTitle>
              <DialogDescription className="text-[var(--color-aurora-cream)]">
                Let's personalize your experience (Step {step} of 3)
              </DialogDescription>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)]/50 rounded-lg">
              <p className="text-sm text-[var(--color-aurora-cream)]">{error}</p>
            </div>
          )}
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Profile */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2 mb-3 text-white">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                    What's your current role?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <Badge
                        key={r}
                        variant={role === r ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                          role === r
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50"
                            : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-purple-400"
                        }`}
                        onClick={() => setRole(r)}
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="location" className="text-base font-semibold mb-3 block text-white">
                    📍 Where are you located?
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This helps you connect with local Aurora communities
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-base font-semibold mb-3 block text-white">
                    Tell us a bit about yourself (optional)
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="I'm passionate about..."
                    className="min-h-[80px] bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!role}
                  className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg shadow-[var(--color-aurora-purple)]/50"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-3 text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  What are you interested in?
                </Label>
                <p className="text-sm text-gray-300 mb-4">
                  Select all that apply to personalize your feed
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                        selectedInterests.includes(interest)
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50"
                          : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-purple-400"
                      }`}
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {selectedInterests.includes(interest) && (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="min-h-[44px] bg-white/5 border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedInterests.length === 0}
                  className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg shadow-[var(--color-aurora-purple)]/50"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Privacy */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-3 text-white">
                  <Shield className="w-5 h-5 text-purple-400" />
                  How visible do you want to be?
                </Label>
                <div className="space-y-3">
                  {[
                    {
                      value: "public" as const,
                      title: "Public",
                      desc: "Your profile and activity are visible to everyone",
                    },
                    {
                      value: "anonymous" as const,
                      title: "Anonymous",
                      desc: "Share content without revealing your identity",
                    },
                    {
                      value: "private" as const,
                      title: "Private",
                      desc: "Only you can see your profile and activity",
                    },
                  ].map((option) => (
                    <div
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        visibility === option.value
                          ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30"
                          : "border-white/20 bg-white/5 hover:border-purple-400 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            visibility === option.value
                              ? "border-purple-400 bg-purple-600"
                              : "border-gray-500"
                          }`}
                        >
                          {visibility === option.value && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{option.title}</p>
                          <p className="text-sm text-gray-300">{option.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="min-h-[44px] bg-white/5 border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg shadow-[var(--color-aurora-purple)]/50 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Complete Setup"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? "w-8 bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
                  : s < step
                  ? "w-2 bg-[var(--color-aurora-purple)]"
                  : "w-2 bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Avatar Preview (if created) */}
        {avatarConfig && (
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              ✨ Your avatar has been created! You can change it later in your profile.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
