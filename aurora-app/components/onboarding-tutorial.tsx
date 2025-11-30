"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  MapPin, Shield, Users, Briefcase, Heart, MessageSquare, 
  Video, Route, Sparkles, ArrowRight, ArrowLeft, Check,
  Bell, Coins
} from "lucide-react";

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  {
    icon: Shield,
    title: "Your Safety First",
    description: "Aurora App is your safety companion. The Panic Button works even offline and alerts your emergency contacts instantly.",
    color: "var(--color-aurora-orange)",
    bgColor: "var(--color-aurora-orange)",
    features: ["Panic Button", "Emergency Contacts", "Safety Check-ins"],
    tip: "💡 Set up your emergency contacts in Settings",
  },
  {
    icon: Users,
    title: "Aurora Guardians",
    description: "Connect with trusted women. Your Guardians can see your real-time location when you choose to share it.",
    color: "var(--color-aurora-purple)",
    bgColor: "var(--color-aurora-purple)",
    features: ["Virtual Accompaniment", "Emergency Alerts", "Real-time Location"],
    tip: "💡 Invite friends or family as your Guardians",
  },
  {
    icon: MapPin,
    title: "Safety Map",
    description: "Discover and share safe places. Report workplace incidents and help other women stay informed.",
    color: "var(--color-aurora-mint)",
    bgColor: "var(--color-aurora-mint)",
    features: ["Rate Places", "Workplace Reports", "Community Verified"],
    tip: "💡 Workplace reports appear on the safety map",
  },
  {
    icon: Route,
    title: "Safe Routes",
    description: "Track your journeys and share safe routes. Use Sister Accompaniment so your Guardians can virtually walk with you.",
    color: "var(--color-aurora-blue)",
    bgColor: "var(--color-aurora-blue)",
    features: ["Real-time GPS", "Share Routes", "Sister Accompaniment"],
    tip: "💡 Earn credits for every route you share",
  },
  {
    icon: Heart,
    title: "Soul Sanctuary",
    description: "Your wellness space. Hydration, mood tracking, menstrual cycle, and guided meditation - all in one place.",
    color: "var(--color-aurora-pink)",
    bgColor: "var(--color-aurora-pink)",
    features: ["Hydration", "Mood Journal", "Cycle Tracking", "Meditation"],
    tip: "💡 Complete your daily check-in to earn credits",
  },
  {
    icon: Briefcase,
    title: "Opportunities",
    description: "Discover jobs, mentorships, and community-verified resources. Use your credits to unlock opportunities.",
    color: "var(--color-aurora-yellow)",
    bgColor: "var(--color-aurora-yellow)",
    features: ["Jobs", "Mentorships", "Career Resources"],
    tip: "💡 Companies with good reports are highlighted",
  },
  {
    icon: Video,
    title: "Reels & Lives",
    description: "Share video experiences. Post safety reels or go live to connect with the community.",
    color: "var(--color-aurora-lavender)",
    bgColor: "var(--color-aurora-lavender)",
    features: ["Safety Reels", "Live Broadcasts", "Video Posts"],
    tip: "💡 Videos help other women discover safe places",
  },
  {
    icon: Coins,
    title: "Credit Economy",
    description: "Earn credits by helping others. Post, verify places, complete routes, and contribute to the community.",
    color: "var(--color-aurora-yellow)",
    bgColor: "var(--color-aurora-yellow)",
    features: ["Earn by Sharing", "Unlock Features", "Help Others"],
    tip: "💡 You start with 25 welcome credits 🎉",
  },
];

export function OnboardingTutorial({ open, onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-[95vw] max-w-md bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#231E35] to-[var(--color-aurora-purple)] border-[var(--color-aurora-pink)]/30 shadow-2xl p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {/* Icon with animation */}
            <div className="flex justify-center mb-5">
              <motion.div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${step.bgColor}20` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <step.icon 
                  className="w-10 h-10" 
                  style={{ color: step.color }}
                />
              </motion.div>
            </div>
            
            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              {step.title}
            </h2>
            
            {/* Description */}
            <p className="text-sm sm:text-base text-[var(--color-aurora-cream)]/80 text-center mb-4">
              {step.description}
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {step.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-[var(--color-aurora-cream)]"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Tip */}
            {step.tip && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-center text-[var(--color-aurora-cream)]/70">
                  {step.tip}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Progress & Navigation */}
        <div className="p-6 pt-0 space-y-4">
          {/* Progress Dots */}
          <div className="flex justify-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? "w-6 bg-[var(--color-aurora-pink)]" 
                    : idx < currentStep
                    ? "w-2 bg-[var(--color-aurora-purple)]"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 min-h-[48px] bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 min-h-[48px] bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Skip Tutorial
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="flex-1 min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg"
            >
              {isLastStep ? (
                <>
                  Get Started!
                  <Sparkles className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Step Counter */}
          <p className="text-center text-xs text-[var(--color-aurora-cream)]/50">
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
