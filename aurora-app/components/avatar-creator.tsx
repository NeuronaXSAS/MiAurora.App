"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, RefreshCw, Check, Heart } from "lucide-react";
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

interface AvatarCreatorProps {
  open: boolean;
  onComplete: (avatarConfig: AvatarConfig) => void;
  onSkip: () => void;
}

export interface AvatarConfig {
  seed: string;
  backgroundColor: string;
  hairStyle: string;
  hairColor: string;
  skinColor: string;
  eyesStyle: string;
  mouthStyle: string;
  earrings: string;
  freckles: boolean;
}

// Feminine skin tones
const SKIN_TONES = [
  { id: "f5d0c5", color: "#F5D0C5", name: "Porcelain" },
  { id: "eac4a8", color: "#EAC4A8", name: "Fair" },
  { id: "d4a574", color: "#D4A574", name: "Warm Beige" },
  { id: "c68642", color: "#C68642", name: "Golden" },
  { id: "8d5524", color: "#8D5524", name: "Caramel" },
  { id: "5c3836", color: "#5C3836", name: "Deep" },
];

// Lorelei-compatible hair styles (feminine)
const HAIR_STYLES = [
  { id: "variant01", name: "Elegant Waves", emoji: "💁‍♀️" },
  { id: "variant02", name: "Soft Curls", emoji: "👩‍🦱" },
  { id: "variant03", name: "Long & Flowing", emoji: "👱‍♀️" },
  { id: "variant04", name: "Chic Bob", emoji: "💇‍♀️" },
  { id: "variant05", name: "Natural", emoji: "🌸" },
  { id: "variant06", name: "Romantic", emoji: "💕" },
];

// Hair colors
const HAIR_COLORS = [
  { id: "2c1b18", color: "#2C1B18", name: "Raven" },
  { id: "6f4e37", color: "#6F4E37", name: "Chestnut" },
  { id: "b5651d", color: "#B5651D", name: "Auburn" },
  { id: "f5deb3", color: "#F5DEB3", name: "Honey Blonde" },
  { id: "e84d5f", color: "#E84D5F", name: "Rose" },
  { id: "8b5cf6", color: "#8B5CF6", name: "Lavender" },
];

// Eye styles
const EYE_STYLES = [
  { id: "variant01", name: "Dreamy", emoji: "✨" },
  { id: "variant02", name: "Confident", emoji: "💫" },
  { id: "variant03", name: "Gentle", emoji: "🌙" },
  { id: "variant04", name: "Playful", emoji: "⭐" },
  { id: "variant05", name: "Wise", emoji: "🔮" },
];

// Mouth styles
const MOUTH_STYLES = [
  { id: "happy", name: "Happy", emoji: "😊" },
  { id: "sad", name: "Thoughtful", emoji: "🤔" },
  { id: "surprised", name: "Surprised", emoji: "😮" },
  { id: "serious", name: "Confident", emoji: "😌" },
];

// Earrings
const EARRINGS = [
  { id: "variant01", name: "Studs", emoji: "💎" },
  { id: "variant02", name: "Hoops", emoji: "⭕" },
  { id: "variant03", name: "Drops", emoji: "💧" },
];

// Background colors (warm, feminine)
const BACKGROUNDS = [
  { id: "ffe8e8", color: "#FFE8E8", name: "Blush" },
  { id: "fff0f5", color: "#FFF0F5", name: "Lavender Blush" },
  { id: "ffefd9", color: "#FFEFD9", name: "Cream" },
  { id: "e8e4ff", color: "#E8E4FF", name: "Soft Violet" },
  { id: "ffe4e6", color: "#FFE4E6", name: "Rose" },
  { id: "f0fdf4", color: "#F0FDF4", name: "Mint" },
];

export function AvatarCreator({ open, onComplete, onSkip }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>({
    seed: `aurora-${Date.now()}`,
    backgroundColor: "ffe8e8",
    hairStyle: "variant01",
    hairColor: "6f4e37",
    skinColor: "eac4a8",
    eyesStyle: "variant01",
    mouthStyle: "happy",
    earrings: "variant01",
    freckles: false,
  });

  const randomize = () => {
    setConfig({
      seed: `aurora-${Date.now()}-${Math.random()}`,
      backgroundColor: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].id,
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].id,
      skinColor: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].id,
      eyesStyle: EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)].id,
      mouthStyle: MOUTH_STYLES[Math.floor(Math.random() * MOUTH_STYLES.length)].id,
      earrings: EARRINGS[Math.floor(Math.random() * EARRINGS.length)].id,
      freckles: Math.random() > 0.7,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#231E35] to-[var(--color-aurora-purple)] border-[var(--color-aurora-pink)]/30 shadow-2xl max-h-[85vh] overflow-hidden p-0 my-4">
        {/* Header - Fixed */}
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--color-aurora-pink)]/30 flex-shrink-0">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl text-white truncate">Create Your Avatar</DialogTitle>
              <DialogDescription className="text-[var(--color-aurora-cream)] text-sm">
                Design your unique digital identity ✨
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-200px)] px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-4">
            {/* Avatar Preview - Sticky on mobile */}
            <div className="space-y-3 sm:space-y-4">
              <div 
                className="border-2 border-[var(--color-aurora-pink)]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center justify-center min-h-[220px] sm:min-h-[300px] transition-colors"
                style={{ backgroundColor: `#${config.backgroundColor}` }}
              >
                <AvatarPreview config={config} />
              </div>
              <Button
                onClick={randomize}
                variant="outline"
                className="w-full min-h-[44px] bg-white/5 border-[var(--color-aurora-pink)]/30 text-white hover:bg-[var(--color-aurora-pink)]/10 hover:border-[var(--color-aurora-pink)]/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Surprise Me ✨
              </Button>
            </div>

            {/* Customization Options */}
            <div className="space-y-4 sm:space-y-5">
              {/* Background */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-semibold mb-2 sm:mb-3 block text-sm">Background</Label>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setConfig({ ...config, backgroundColor: bg.id })}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 transition-all min-w-[36px] min-h-[36px] ${
                        config.backgroundColor === bg.id
                          ? "border-[var(--color-aurora-pink)] scale-110 shadow-lg shadow-[var(--color-aurora-pink)]/30"
                          : "border-white/20 hover:border-[var(--color-aurora-pink)]/50"
                      }`}
                      style={{ backgroundColor: bg.color }}
                      title={bg.name}
                    />
                  ))}
                </div>
              </div>

              {/* Skin Tone */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-semibold mb-2 sm:mb-3 block text-sm">Skin Tone</Label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setConfig({ ...config, skinColor: tone.id })}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all min-w-[36px] min-h-[36px] ${
                        config.skinColor === tone.id
                          ? "border-[var(--color-aurora-pink)] scale-110 shadow-lg shadow-[var(--color-aurora-pink)]/30"
                          : "border-white/20 hover:border-[var(--color-aurora-pink)]/50"
                      }`}
                      style={{ backgroundColor: tone.color }}
                      title={tone.name}
                    />
                  ))}
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-semibold mb-2 sm:mb-3 block text-sm">Hair Style</Label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {HAIR_STYLES.map((style) => (
                    <Badge
                      key={style.id}
                      onClick={() => setConfig({ ...config, hairStyle: style.id })}
                      className={`cursor-pointer px-2 sm:px-3 py-2 text-xs transition-all justify-center min-h-[40px] ${
                        config.hairStyle === style.id
                          ? "bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white shadow-lg shadow-[var(--color-aurora-pink)]/30 border-0"
                          : "bg-white/5 border-white/20 text-[var(--color-aurora-cream)] hover:bg-[var(--color-aurora-pink)]/10"
                      }`}
                    >
                      <span className="mr-1">{style.emoji}</span>
                      <span className="truncate">{style.name}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-semibold mb-2 sm:mb-3 block text-sm">Hair Color</Label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setConfig({ ...config, hairColor: color.id })}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all min-w-[36px] min-h-[36px] ${
                        config.hairColor === color.id
                          ? "border-[var(--color-aurora-pink)] scale-110 shadow-lg shadow-[var(--color-aurora-pink)]/30"
                          : "border-white/20 hover:border-[var(--color-aurora-pink)]/50"
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Eyes */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-semibold mb-2 sm:mb-3 block text-sm">Eyes</Label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {EYE_STYLES.map((style) => (
                    <Badge
                      key={style.id}
                      onClick={() => setConfig({ ...config, eyesStyle: style.id })}
                      className={`cursor-pointer px-1.5 sm:px-2 py-2 text-xs transition-all justify-center min-h-[40px] ${
                        config.eyesStyle === style.id
                          ? "bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white shadow-lg shadow-[var(--color-aurora-pink)]/30 border-0"
                          : "bg-white/5 border-white/20 text-[var(--color-aurora-cream)] hover:bg-[var(--color-aurora-pink)]/10"
                      }`}
                    >
                      {style.emoji} <span className="hidden sm:inline ml-1">{style.name}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Earrings */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-semibold mb-2 sm:mb-3 block text-sm">Earrings</Label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {EARRINGS.map((earring) => (
                    <Badge
                      key={earring.id}
                      onClick={() => setConfig({ ...config, earrings: earring.id })}
                      className={`cursor-pointer px-1.5 sm:px-2 py-2 text-xs transition-all justify-center min-h-[40px] ${
                        config.earrings === earring.id
                          ? "bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white shadow-lg shadow-[var(--color-aurora-pink)]/30 border-0"
                          : "bg-white/5 border-white/20 text-[var(--color-aurora-cream)] hover:bg-[var(--color-aurora-pink)]/10"
                      }`}
                    >
                      {earring.emoji} <span className="hidden sm:inline ml-1">{earring.name}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Freckles Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <Label className="text-[var(--color-aurora-cream)] text-sm">Add Freckles</Label>
                <button
                  onClick={() => setConfig({ ...config, freckles: !config.freckles })}
                  className={`w-12 h-6 rounded-full transition-all min-w-[48px] ${
                    config.freckles ? "bg-[var(--color-aurora-pink)]" : "bg-white/20"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    config.freckles ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 p-4 sm:p-6 pt-4 border-t border-white/10 bg-[var(--color-aurora-violet)]/50">
          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full sm:w-auto min-h-[48px] bg-white/5 border-white/20 text-white hover:bg-white/10 order-2 sm:order-1"
          >
            Skip for now
          </Button>
          <Button
            onClick={() => onComplete(config)}
            className="w-full sm:w-auto min-h-[48px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:from-[var(--color-aurora-purple)] hover:to-[var(--color-aurora-violet)] shadow-lg shadow-[var(--color-aurora-pink)]/30 order-1 sm:order-2"
          >
            <Heart className="w-4 h-4 mr-2" />
            Create Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Avatar Preview Component using DiceBear Lorelei (feminine style)
function AvatarPreview({ config }: { config: AvatarConfig }) {
  const avatarSvg = useMemo(() => {
    const avatar = createAvatar(lorelei, {
      seed: config.seed,
      backgroundColor: [config.backgroundColor] as any,
      hair: [config.hairStyle] as any,
      hairColor: [config.hairColor] as any,
      skinColor: [config.skinColor] as any,
      eyes: [config.eyesStyle] as any,
      mouth: [config.mouthStyle] as any,
      earrings: [config.earrings] as any,
      freckles: config.freckles ? ['variant01'] : [] as any,
      size: 256,
    });

    return avatar.toString();
  }, [config]);

  return (
    <motion.div
      key={config.seed}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 mx-auto rounded-full shadow-2xl shadow-[var(--color-aurora-pink)]/20 flex-shrink-0 flex items-center justify-center bg-white/10"
      style={{ backgroundColor: `#${config.backgroundColor}` }}
    >
      <div 
        className="w-[90%] h-[90%] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: avatarSvg }}
      />
    </motion.div>
  );
}

// Export function to generate avatar URL from config
export function generateAvatarUrl(config: AvatarConfig): string {
  const avatar = createAvatar(lorelei, {
    seed: config.seed,
    backgroundColor: [config.backgroundColor] as any,
    hair: [config.hairStyle] as any,
    hairColor: [config.hairColor] as any,
    skinColor: [config.skinColor] as any,
    eyes: [config.eyesStyle] as any,
    mouth: [config.mouthStyle] as any,
    earrings: [config.earrings] as any,
    freckles: config.freckles ? ['variant01'] : [] as any,
    size: 128,
  });

  return avatar.toDataUri();
}
