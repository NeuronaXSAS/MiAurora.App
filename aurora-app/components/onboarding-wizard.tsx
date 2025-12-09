"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sparkles,
  Briefcase,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Heart,
  MapPin,
  Users,
  Zap,
  Star,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { AvatarCreator, AvatarConfig } from "@/components/avatar-creator";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  userId: Id<"users">;
}

const ROLES = [
  { id: "Student", emoji: "📚", desc: "Learning & growing" },
  { id: "Professional", emoji: "💼", desc: "Building my career" },
  { id: "Traveler", emoji: "✈️", desc: "Exploring the world" },
  { id: "Entrepreneur", emoji: "🚀", desc: "Creating something new" },
  { id: "Job Seeker", emoji: "🎯", desc: "Finding opportunities" },
];

// Generate birth years (13-80 years old)
const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 68 }, (_, i) => currentYear - 13 - i);

// Inclusive gender identity options following best practices
const GENDER_OPTIONS = [
  {
    id: "woman",
    emoji: "👩",
    label: "Woman",
    desc: "Cisgender or transgender woman",
  },
  {
    id: "non-binary",
    emoji: "🌈",
    label: "Non-binary",
    desc: "Non-binary, genderqueer, genderfluid",
  },
  {
    id: "trans-woman",
    emoji: "🏳️‍⚧️",
    label: "Trans Woman",
    desc: "Transgender woman",
  },
  { id: "agender", emoji: "✨", label: "Agender", desc: "No gender identity" },
  {
    id: "two-spirit",
    emoji: "🪶",
    label: "Two-Spirit",
    desc: "Indigenous identity",
  },
  {
    id: "questioning",
    emoji: "💭",
    label: "Questioning",
    desc: "Exploring my identity",
  },
  { id: "custom", emoji: "💜", label: "Custom", desc: "I'll describe my own" },
  {
    id: "prefer-not-to-say",
    emoji: "🔒",
    label: "Prefer not to say",
    desc: "Keep private",
  },
] as const;

const PRONOUN_OPTIONS = [
  { id: "she/her", label: "She/Her" },
  { id: "they/them", label: "They/Them" },
  { id: "she/they", label: "She/They" },
  { id: "he/him", label: "He/Him" },
  { id: "any", label: "Any Pronouns" },
  { id: "custom", label: "Custom" },
] as const;

const INTERESTS = [
  { id: "Safe Commuting", emoji: "🚶‍♀️", color: "from-blue-500 to-cyan-500" },
  { id: "Nightlife Safety", emoji: "🌙", color: "from-purple-500 to-pink-500" },
  {
    id: "Career Mentorship",
    emoji: "👩‍🏫",
    color: "from-amber-500 to-orange-500",
  },
  { id: "B2B Networking", emoji: "🤝", color: "from-emerald-500 to-teal-500" },
  { id: "Workplace Safety", emoji: "🏢", color: "from-red-500 to-rose-500" },
  { id: "Travel Safety", emoji: "🗺️", color: "from-sky-500 to-blue-500" },
  {
    id: "Financial Growth",
    emoji: "💰",
    color: "from-yellow-500 to-amber-500",
  },
  { id: "Skill Building", emoji: "📈", color: "from-violet-500 to-purple-500" },
];

export function OnboardingWizard({
  open,
  onComplete,
  userId: _userId,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<
    "public" | "anonymous" | "private"
  >("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workosId, setWorkosId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [location, setLocation] = useState("");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [gender, setGender] = useState<string>("");
  const [genderCustom, setGenderCustom] = useState("");
  const [pronouns, setPronouns] = useState<string>("");
  const [pronounsCustom, setPronounsCustom] = useState("");

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const updatePrivacy = useMutation(api.privacy.updatePrivacySettings);
  const updateAvatar = useMutation(api.users.updateAvatar);
  const updateLifeSettings = useMutation(api.lifeCanvas.updateLifeSettings);

  useEffect(() => {
    const getWorkosId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.workosUserId) {
          setWorkosId(data.workosUserId);
        } else if (data.workosId) {
          setWorkosId(data.workosId);
        }
      } catch (error) {
        console.error("Error getting workosId:", error);
      }
    };
    getWorkosId();
  }, []);

  // Helper to convert birth year to age range
  const getAgeRange = (
    year: number,
  ):
    | "13-17"
    | "18-24"
    | "25-34"
    | "35-44"
    | "45-54"
    | "55-64"
    | "65+"
    | "prefer-not-to-say" => {
    const age = currentYear - year;
    if (age < 18) return "13-17";
    if (age < 25) return "18-24";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    if (age < 55) return "45-54";
    if (age < 65) return "55-64";
    return "65+";
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
          ? [...prev, interest]
          : prev,
    );
  };

  const handleComplete = async () => {
    if (!workosId) {
      setError("Unable to save. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await completeOnboarding({
        workosId,
        bio: bio || undefined,
        location: location || undefined,
        industry: role || undefined,
        careerGoals: selectedInterests.join(", ") || undefined,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        // Demographics
        gender: gender
          ? (gender as
              | "woman"
              | "non-binary"
              | "trans-woman"
              | "agender"
              | "two-spirit"
              | "questioning"
              | "custom"
              | "prefer-not-to-say")
          : undefined,
        genderCustom: gender === "custom" ? genderCustom : undefined,
        pronouns: pronouns
          ? (pronouns as
              | "she/her"
              | "they/them"
              | "she/they"
              | "he/him"
              | "any"
              | "custom")
          : undefined,
        pronounsCustom: pronouns === "custom" ? pronounsCustom : undefined,
        ageRange: birthYear ? getAgeRange(birthYear) : undefined,
      });

      if (avatarConfig && _userId) {
        try {
          await updateAvatar({ userId: _userId, avatarConfig });
        } catch (e) {
          console.warn("Avatar save failed:", e);
        }
      }

      // Save birth year for Life Canvas
      if (birthYear && _userId) {
        try {
          await updateLifeSettings({
            userId: _userId,
            birthYear,
            lifeExpectancy: 80,
          });
        } catch (e) {
          console.warn("Life settings save failed:", e);
        }
      }

      try {
        await updatePrivacy({
          profileVisibility:
            visibility === "anonymous" ? "private" : visibility,
        });
      } catch (e) {
        console.warn("Privacy update failed:", e);
      }

      setShowTutorial(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarComplete = (config: AvatarConfig) => {
    setAvatarConfig(config);
    try {
      localStorage.setItem("aurora-avatar-config", JSON.stringify(config));
    } catch (e) {}
    setShowAvatarCreator(false);
    setStep(2);
  };

  if (showTutorial) {
    return <OnboardingTutorial open={open} onComplete={onComplete} />;
  }

  if (showAvatarCreator) {
    return (
      <AvatarCreator
        open={open}
        onComplete={handleAvatarComplete}
        onSkip={() => {
          setShowAvatarCreator(false);
          setStep(2);
        }}
      />
    );
  }

  const totalSteps = 4;
  const canProceed =
    step === 0 ||
    step === 1 ||
    (step === 2 && role) ||
    (step === 3 && selectedInterests.length > 0) ||
    step === 4;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#1a1625] to-[var(--color-aurora-purple)] border-0 sm:border sm:border-[var(--color-aurora-pink)]/20 shadow-2xl p-0 sm:rounded-3xl rounded-none overflow-hidden">
        {/* Progress Bar - Top */}
        <div className="h-1 bg-white/10 w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex flex-col h-[calc(100dvh-60px)] sm:h-auto sm:min-h-[500px] sm:max-h-[calc(90vh-60px)]">
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {step === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-[var(--color-aurora-purple)]/50">
                    <img
                      src="/Au_Logo_1.png"
                      alt="Aurora App"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Welcome to Aurora App! 💜
                    </h1>
                    <p className="text-[var(--color-aurora-cream)]/80 text-sm sm:text-base max-w-md mx-auto">
                      Your safety, community, and growth platform designed by
                      women, for women worldwide.
                    </p>
                  </div>

                  {/* Key Features */}
                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {[
                      {
                        icon: Shield,
                        label: "Safety First",
                        color: "text-[var(--color-aurora-mint)]",
                      },
                      {
                        icon: Users,
                        label: "Community",
                        color: "text-[var(--color-aurora-pink)]",
                      },
                      {
                        icon: Zap,
                        label: "Opportunities",
                        color: "text-[var(--color-aurora-yellow)]",
                      },
                      {
                        icon: Heart,
                        label: "Wellness",
                        color: "text-[var(--color-aurora-lavender)]",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-white/5 rounded-xl p-3 border border-white/10"
                      >
                        <item.icon
                          className={`w-6 h-6 ${item.color} mx-auto mb-1`}
                        />
                        <p className="text-xs text-white/80">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Language Notice */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-w-sm mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                      <span className="text-sm font-medium text-white">
                        Global Platform
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-aurora-cream)]/70 text-left">
                      Aurora App is in English to serve women worldwide. Need
                      another language? Use your browser&apos;s built-in
                      translator (right-click → Translate) for the best
                      experience.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Avatar & Birth Year */}
              {step === 1 && (
                <motion.div
                  key="avatar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-5"
                >
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      Create Your Aurora Companion ✨
                    </h2>
                    <p className="text-[var(--color-aurora-cream)]/80 text-sm">
                      She&apos;ll be your AI friend, wellness tracker, and
                      safety buddy
                    </p>
                  </div>

                  {/* Example Avatars Gallery */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-w-md mx-auto">
                    <p className="text-xs text-[var(--color-aurora-cream)]/60 mb-3">
                      See what other sisters created:
                    </p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[
                        { bg: "#FFE8E8", hair: "#6F4E37", skin: "#EDB98A" },
                        { bg: "#E8E4FF", hair: "#2C1B18", skin: "#D08B5B" },
                        { bg: "#D6F4EC", hair: "#B5651D", skin: "#F5D0C5" },
                        { bg: "#FFF0F5", hair: "#8B5CF6", skin: "#8D5524" },
                      ].map((example, i) => (
                        <div
                          key={i}
                          className="w-14 h-14 rounded-xl overflow-hidden shadow-md"
                          style={{ backgroundColor: example.bg }}
                        >
                          <img
                            src={`https://api.dicebear.com/7.x/lorelei/svg?seed=aurora-example-${i}&backgroundColor=${example.bg.slice(1)}&hairColor=${example.hair.slice(1)}&skinColor=${example.skin.slice(1)}`}
                            alt={`Example avatar ${i + 1}`}
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => setShowAvatarCreator(true)}
                      className="w-full min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Design My Companion
                    </Button>
                  </div>

                  {avatarConfig && (
                    <p className="text-sm text-[var(--color-aurora-mint)]">
                      ✓ Companion created! You can edit her anytime.
                    </p>
                  )}

                  {/* Birth Year - For Life Canvas */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-w-md mx-auto">
                    <Label className="text-white font-medium mb-2 flex items-center justify-center gap-2">
                      <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                      When were you born? (optional)
                    </Label>
                    <p className="text-xs text-[var(--color-aurora-cream)]/60 mb-3">
                      This unlocks your Life Canvas - a beautiful visualization
                      of your journey
                    </p>
                    <select
                      value={birthYear || ""}
                      onChange={(e) =>
                        setBirthYear(
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white appearance-none cursor-pointer"
                    >
                      <option
                        value=""
                        className="bg-[var(--color-aurora-violet)]"
                      >
                        Select year (optional)
                      </option>
                      {BIRTH_YEARS.map((year) => (
                        <option
                          key={year}
                          value={year}
                          className="bg-[var(--color-aurora-violet)]"
                        >
                          {year} ({currentYear - year} years old)
                        </option>
                      ))}
                    </select>
                    {birthYear && (
                      <p className="text-xs text-[var(--color-aurora-mint)] mt-2">
                        ✨ You&apos;ve lived ~
                        {Math.floor(
                          (currentYear - birthYear) * 365.25,
                        ).toLocaleString()}{" "}
                        amazing days!
                      </p>
                    )}
                  </div>

                  {/* Gender Identity - Inclusive options */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-w-md mx-auto">
                    <Label className="text-white font-medium mb-2 flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      How do you identify? (optional)
                    </Label>
                    <p className="text-xs text-[var(--color-aurora-cream)]/60 mb-3">
                      This helps us understand our community and serve you
                      better
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDER_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setGender(option.id)}
                          className={`p-2 rounded-xl text-left transition-all flex items-center gap-2 ${
                            gender === option.id
                              ? "bg-gradient-to-r from-[var(--color-aurora-pink)]/30 to-[var(--color-aurora-purple)]/30 border-2 border-[var(--color-aurora-pink)]"
                              : "bg-white/5 border border-white/10 hover:border-[var(--color-aurora-pink)]/50"
                          }`}
                        >
                          <span className="text-lg">{option.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-xs truncate">
                              {option.label}
                            </p>
                          </div>
                          {gender === option.id && (
                            <Check className="w-3 h-3 text-[var(--color-aurora-pink)] flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                    {gender === "custom" && (
                      <Input
                        value={genderCustom}
                        onChange={(e) => setGenderCustom(e.target.value)}
                        placeholder="Describe your identity..."
                        className="mt-3 bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                      />
                    )}
                  </div>

                  {/* Pronouns */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-w-md mx-auto">
                    <Label className="text-white font-medium mb-2 flex items-center justify-center gap-2">
                      💬 Your pronouns (optional)
                    </Label>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {PRONOUN_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setPronouns(option.id)}
                          className={`px-3 py-2 rounded-full text-sm transition-all ${
                            pronouns === option.id
                              ? "bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white"
                              : "bg-white/10 text-white/70 hover:bg-white/20"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {pronouns === "custom" && (
                      <Input
                        value={pronounsCustom}
                        onChange={(e) => setPronounsCustom(e.target.value)}
                        placeholder="e.g., xe/xem, ze/zir..."
                        className="mt-3 bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                      />
                    )}
                  </div>

                  <p className="text-center text-xs text-[var(--color-aurora-cream)]/50">
                    🔒 Your identity info is private and only used for
                    aggregated community insights
                  </p>
                </motion.div>
              )}

              {/* Step 2: About You */}
              {step === 2 && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      Tell us about yourself 👋
                    </h2>
                    <p className="text-[var(--color-aurora-cream)]/80 text-sm">
                      This helps us personalize your experience
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <Label className="text-white font-medium mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                      What describes you best?
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 min-h-[56px] ${
                            role === r.id
                              ? "bg-gradient-to-r from-[var(--color-aurora-pink)]/30 to-[var(--color-aurora-purple)]/30 border-2 border-[var(--color-aurora-pink)]"
                              : "bg-white/5 border border-white/10 hover:border-[var(--color-aurora-pink)]/50"
                          }`}
                        >
                          <span className="text-2xl">{r.emoji}</span>
                          <div>
                            <p className="font-medium text-white text-sm">
                              {r.id}
                            </p>
                            <p className="text-xs text-[var(--color-aurora-cream)]/60">
                              {r.desc}
                            </p>
                          </div>
                          {role === r.id && (
                            <Check className="w-5 h-5 text-[var(--color-aurora-pink)] ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <Label className="text-white font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      Where are you based? (optional)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., New York, Tokyo, London..."
                        className="flex-1 min-h-[48px] bg-white/5 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const pos = await new Promise<GeolocationPosition>(
                              (resolve, reject) => {
                                navigator.geolocation.getCurrentPosition(
                                  resolve,
                                  reject,
                                  { timeout: 10000 },
                                );
                              },
                            );
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
                            );
                            const data = await res.json();
                            const city =
                              data.address?.city ||
                              data.address?.town ||
                              data.address?.village ||
                              "";
                            const country = data.address?.country || "";
                            setLocation(city ? `${city}, ${country}` : country);
                          } catch {
                            // Silently fail - user can enter manually
                          }
                        }}
                        className="min-h-[48px] px-4 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
                        title="Auto-detect my location"
                      >
                        <MapPin className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-[var(--color-aurora-cream)]/50 mt-2">
                      💡 Sharing your location helps our safety intelligence
                      community warn others about unsafe areas
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Interests */}
              {step === 3 && (
                <motion.div
                  key="interests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      What matters to you? 💫
                    </h2>
                    <p className="text-[var(--color-aurora-cream)]/80 text-sm">
                      Select up to 5 interests to personalize your feed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(
                        interest.id,
                      );
                      return (
                        <button
                          key={interest.id}
                          onClick={() => handleInterestToggle(interest.id)}
                          disabled={
                            !isSelected && selectedInterests.length >= 5
                          }
                          className={`p-3 rounded-xl text-left transition-all min-h-[60px] ${
                            isSelected
                              ? `bg-gradient-to-r ${interest.color} text-white shadow-lg`
                              : "bg-white/5 border border-white/10 hover:border-white/30 disabled:opacity-40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{interest.emoji}</span>
                            <span
                              className={`text-xs sm:text-sm font-medium ${isSelected ? "text-white" : "text-[var(--color-aurora-cream)]"}`}
                            >
                              {interest.id}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 ml-auto" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-[var(--color-aurora-cream)]/60">
                    {selectedInterests.length}/5 selected
                  </p>
                </motion.div>
              )}

              {/* Step 4: Privacy */}
              {step === 4 && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      Your privacy matters 🔒
                    </h2>
                    <p className="text-[var(--color-aurora-cream)]/80 text-sm">
                      Choose how visible you want to be
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        value: "public" as const,
                        icon: Users,
                        title: "Public",
                        desc: "Connect openly with the community",
                        color: "text-[var(--color-aurora-mint)]",
                      },
                      {
                        value: "anonymous" as const,
                        icon: Shield,
                        title: "Anonymous",
                        desc: "Share without revealing identity",
                        color: "text-[var(--color-aurora-purple)]",
                      },
                      {
                        value: "private" as const,
                        icon: Star,
                        title: "Private",
                        desc: "Keep your activity to yourself",
                        color: "text-[var(--color-aurora-pink)]",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setVisibility(option.value)}
                        className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 min-h-[72px] ${
                          visibility === option.value
                            ? "bg-gradient-to-r from-[var(--color-aurora-pink)]/20 to-[var(--color-aurora-purple)]/20 border-2 border-[var(--color-aurora-pink)]"
                            : "bg-white/5 border border-white/10 hover:border-[var(--color-aurora-pink)]/50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${option.color}`}
                        >
                          <option.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {option.title}
                          </p>
                          <p className="text-xs text-[var(--color-aurora-cream)]/60">
                            {option.desc}
                          </p>
                        </div>
                        {visibility === option.value && (
                          <Check className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <p className="text-center text-xs text-[var(--color-aurora-cream)]/60">
                    You can change this anytime in Settings
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-5 sm:mx-8 mb-2 p-3 bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)]/50 rounded-xl">
              <p className="text-sm text-white">{error}</p>
            </div>
          )}

          {/* Footer - Fixed */}
          <div className="px-5 sm:px-8 py-4 border-t border-white/10 bg-[var(--color-aurora-violet)]/80 backdrop-blur-sm">
            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? "w-6 bg-[var(--color-aurora-pink)]"
                      : s < step
                        ? "w-1.5 bg-[var(--color-aurora-purple)]"
                        : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="min-h-[52px] px-6 bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              <Button
                onClick={() => {
                  if (step === 1 && !avatarConfig) {
                    setShowAvatarCreator(true);
                  } else if (step < 4) {
                    setStep(step + 1);
                  } else {
                    handleComplete();
                  }
                }}
                disabled={
                  (step === 2 && !role) ||
                  (step === 3 && selectedInterests.length === 0) ||
                  isSubmitting
                }
                className="flex-1 min-h-[52px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90 shadow-lg disabled:opacity-50 font-semibold text-base"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Saving...</span>
                ) : step === 4 ? (
                  <>
                    Let&apos;s Go!
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                ) : step === 1 && !avatarConfig ? (
                  <>
                    Create Companion
                    <Heart className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip option for avatar step */}
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="w-full mt-3 text-sm text-[var(--color-aurora-cream)]/60 hover:text-white transition-colors"
              >
                Skip for now →
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
