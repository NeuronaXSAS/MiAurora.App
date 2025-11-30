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

  const updateAvatar = useMutation(api.users.updateAvatar);

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

      // Save avatar to Convex if created
      if (avatarConfig && _userId) {
        try {
          await updateAvatar({
            userId: _userId,
            avatarConfig,
          });
          console.log("✅ Avatar saved to Convex");
        } catch (avatarError) {
          console.warn("⚠️ Avatar save failed (non-critical):", avatarError);
        }
      }

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
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[85vh] overflow-hidden backdrop-blur-xl bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#231E35] to-[var(--color-aurora-purple)] border-[var(--color-aurora-pink)]/30 shadow-2xl p-0 my-4">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center gap-3">
            {/* Aurora App Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-[var(--color-aurora-purple)]/50 flex-shrink-0">
              <img 
                src="/Au_Logo_1.png" 
                alt="Aurora App Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl text-white">Welcome to Aurora App!</DialogTitle>
              <DialogDescription className="text-[var(--color-aurora-cream)] text-sm">
                Step {step} of 3
              </DialogDescription>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)]/50 rounded-xl">
              <p className="text-sm text-[var(--color-aurora-cream)]">{error}</p>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-220px)] px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-6 py-4"
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-white">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-aurora-pink)]" />
                      What's your current role?
                    </Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {ROLES.map((r) => (
                        <Badge
                          key={r}
                          variant={role === r ? "default" : "outline"}
                          className={`cursor-pointer px-3 py-2 text-xs sm:text-sm transition-all min-h-[40px] ${
                            role === r
                              ? "bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white shadow-lg"
                              : "bg-white/5 border-white/20 text-[var(--color-aurora-cream)] hover:bg-white/10 hover:border-[var(--color-aurora-pink)]"
                          }`}
                          onClick={() => setRole(r)}
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block text-white">
                      📍 Where are you located?
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="min-h-[48px] bg-white/5 border-white/20 text-white placeholder:text-[var(--color-aurora-cream)]/50 rounded-xl"
                    />
                    <p className="text-xs text-[var(--color-aurora-cream)]/70 mt-1">
                      This helps you connect with local Aurora communities
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block text-white">
                      Tell us a bit about yourself (optional)
                    </Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="I'm passionate about..."
                      className="min-h-[80px] bg-white/5 border-white/20 text-white placeholder:text-[var(--color-aurora-cream)]/50 rounded-xl"
                    />
                  </div>
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
                className="space-y-4 sm:space-y-6 py-4"
              >
                <div>
                  <Label className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-white">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-aurora-yellow)]" />
                    What are you interested in?
                  </Label>
                  <p className="text-xs sm:text-sm text-[var(--color-aurora-cream)]/70 mb-3">
                    Select all that apply
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {INTERESTS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-2 text-xs sm:text-sm transition-all min-h-[40px] ${
                          selectedInterests.includes(interest)
                            ? "bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white shadow-lg shadow-[var(--color-aurora-purple)]/50"
                            : "bg-white/5 border-white/20 text-[var(--color-aurora-cream)] hover:bg-white/10 hover:border-[var(--color-aurora-pink)]"
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
              </motion.div>
            )}

            {/* Step 3: Privacy */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-6 py-4"
              >
                <div>
                  <Label className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-white">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-aurora-purple)]" />
                    How visible do you want to be?
                  </Label>
                  <div className="space-y-2 sm:space-y-3">
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
                        className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[60px] ${
                          visibility === option.value
                            ? "border-[var(--color-aurora-pink)] bg-[var(--color-aurora-purple)]/20 shadow-lg shadow-[var(--color-aurora-purple)]/30"
                            : "border-white/20 bg-white/5 hover:border-[var(--color-aurora-pink)]/50 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                              visibility === option.value
                                ? "border-[var(--color-aurora-pink)] bg-[var(--color-aurora-purple)]"
                                : "border-white/40"
                            }`}
                          >
                            {visibility === option.value && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-sm sm:text-base">{option.title}</p>
                            <p className="text-xs sm:text-sm text-[var(--color-aurora-cream)]/70">{option.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="p-4 sm:p-6 pt-4 border-t border-white/10 bg-[var(--color-aurora-violet)]/50">
          {/* Progress Indicator */}
          <div className="flex gap-2 justify-center mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? "w-8 bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
                    : s < step
                    ? "w-2 bg-[var(--color-aurora-purple)]"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
            {step > 1 ? (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)} 
                className="w-full sm:w-auto min-h-[48px] bg-white/5 border-white/20 text-white hover:bg-white/10 order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div className="hidden sm:block" />
            )}
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !role : selectedInterests.length === 0}
                className="w-full sm:w-auto min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg shadow-[var(--color-aurora-purple)]/50 order-1 sm:order-2"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg shadow-[var(--color-aurora-purple)]/50 disabled:opacity-50 order-1 sm:order-2"
              >
                {isSubmitting ? "Saving..." : "Complete Setup"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Avatar Preview (if created) */}
          {avatarConfig && (
            <div className="text-center mt-3">
              <p className="text-xs text-[var(--color-aurora-cream)]/70">
                ✨ Your avatar has been created! You can change it later in your profile.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
