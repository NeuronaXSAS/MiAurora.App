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

export function OnboardingWizard({ open, onComplete, userId }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "anonymous" | "private">("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workosId, setWorkosId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const updatePrivacy = useMutation(api.privacy.updatePrivacySettings);

  // Get WorkOS ID from user
  useEffect(() => {
    const getWorkosId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.workosId) {
          setWorkosId(data.workosId);
        }
      } catch (error) {
        console.error("Error getting workosId:", error);
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
      // Complete onboarding with profile data
      await completeOnboarding({
        workosId,
        bio: bio || undefined,
        industry: role || undefined,
        careerGoals: selectedInterests.join(", ") || undefined,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
      });

      // Try to update privacy settings (non-blocking)
      try {
        await updatePrivacy({
          profileVisibility: visibility === 'anonymous' ? 'private' : visibility,
        });
      } catch (privacyError) {
        console.warn("Privacy settings update failed (non-critical):", privacyError);
      }

      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
      setError("Failed to save your preferences. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl backdrop-blur-xl bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border-purple-500/30 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl text-white">Welcome to Aurora!</DialogTitle>
              <DialogDescription className="text-gray-300">
                Let's personalize your experience (Step {step} of 3)
              </DialogDescription>
            </div>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
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
                  <Label htmlFor="bio" className="text-base font-semibold mb-3 block text-white">
                    Tell us a bit about yourself (optional)
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="I'm passionate about..."
                    className="min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!role}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50"
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
                <Button variant="outline" onClick={() => setStep(1)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedInterests.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50"
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
                <Button variant="outline" onClick={() => setStep(2)} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 disabled:opacity-50"
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
                  ? "w-8 bg-gradient-to-r from-purple-600 to-pink-600"
                  : s < step
                  ? "w-2 bg-purple-600"
                  : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
