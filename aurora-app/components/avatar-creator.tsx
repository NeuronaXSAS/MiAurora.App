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
import { Sparkles, RefreshCw, Heart, MessageCircle, Shield, TrendingUp } from "lucide-react";
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

// Lorelei-compatible FEMININE hair styles only
const HAIR_STYLES = [
  { id: "variant14", name: "Elegant Waves", emoji: "💁‍♀️" },
  { id: "variant15", name: "Soft Curls", emoji: "👩‍🦱" },
  { id: "variant17", name: "Long & Flowing", emoji: "👱‍♀️" },
  { id: "variant20", name: "Romantic", emoji: "💕" },
  { id: "variant21", name: "Chic Bob", emoji: "✨" },
  { id: "variant23", name: "Natural", emoji: "🌸" },
  { id: "variant26", name: "Sleek Long", emoji: "🌺" },
  { id: "variant29", name: "Ponytail", emoji: "🎀" },
  { id: "variant32", name: "Braided", emoji: "🌷" },
  { id: "variant35", name: "Curly", emoji: "🌻" },
  { id: "variant41", name: "Afro", emoji: "👸" },
  { id: "variant44", name: "Elegant Bun", emoji: "🌙" },
];

// Hair colors
const HAIR_COLORS = [
  { id: "2c1b18", color: "#2C1B18", name: "Raven" },
  { id: "6f4e37", color: "#6F4E37", name: "Chestnut" },
  { id: "b5651d", color: "#B5651D", name: "Auburn" },
  { id: "f5deb3", color: "#F5DEB3", name: "Blonde" },
  { id: "e84d5f", color: "#E84D5F", name: "Rose" },
  { id: "8b5cf6", color: "#8B5CF6", name: "Lavender" },
];

// Eye styles
const EYE_STYLES = [
  { id: "variant01", name: "Dreamy", emoji: "✨" },
  { id: "variant02", name: "Confident", emoji: "💫" },
  { id: "variant03", name: "Gentle", emoji: "🌙" },
  { id: "variant04", name: "Playful", emoji: "⭐" },
];

// Mouth styles
const MOUTH_STYLES = [
  { id: "happy01", name: "Smile", emoji: "😊" },
  { id: "happy02", name: "Grin", emoji: "😄" },
  { id: "happy05", name: "Soft", emoji: "🙂" },
  { id: "happy11", name: "Sweet", emoji: "☺️" },
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
  { id: "fff0f5", color: "#FFF0F5", name: "Lavender" },
  { id: "ffefd9", color: "#FFEFD9", name: "Cream" },
  { id: "e8e4ff", color: "#E8E4FF", name: "Violet" },
  { id: "ffe4e6", color: "#FFE4E6", name: "Rose" },
  { id: "f0fdf4", color: "#F0FDF4", name: "Mint" },
];

export function AvatarCreator({ open, onComplete, onSkip }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>({
    seed: `aurora-${Date.now()}`,
    backgroundColor: "ffe8e8",
    hairStyle: "variant17", // Long & Flowing - feminine default
    hairColor: "6f4e37",
    skinColor: "eac4a8",
    eyesStyle: "variant01",
    mouthStyle: "happy01",
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
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-xl lg:max-w-2xl bg-gradient-to-br from-[var(--color-aurora-violet)] via-[#231E35] to-[var(--color-aurora-purple)] border-[var(--color-aurora-pink)]/30 shadow-2xl max-h-[90vh] overflow-hidden p-0 my-2">
        {/* Header */}
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg text-white">Meet Your Aurora Companion</DialogTitle>
              <DialogDescription className="text-[var(--color-aurora-cream)]/80 text-xs">
                She'll be your 24/7 guide, friend & wellness tracker 💜
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-4">
          {/* Benefits Banner - Compact */}
          <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-white/5 rounded-xl border border-white/10">
            <div className="text-center p-2">
              <MessageCircle className="w-4 h-4 text-[var(--color-aurora-pink)] mx-auto mb-1" />
              <p className="text-[10px] text-white/80">AI Chat</p>
            </div>
            <div className="text-center p-2">
              <TrendingUp className="w-4 h-4 text-[var(--color-aurora-mint)] mx-auto mb-1" />
              <p className="text-[10px] text-white/80">Health Insights</p>
            </div>
            <div className="text-center p-2">
              <Shield className="w-4 h-4 text-[var(--color-aurora-yellow)] mx-auto mb-1" />
              <p className="text-[10px] text-white/80">Safety Buddy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 pb-4">
            {/* Avatar Preview - Compact */}
            <div className="flex flex-col items-center gap-2">
              <div 
                className="border-2 border-[var(--color-aurora-pink)]/30 rounded-2xl p-3 flex items-center justify-center w-full aspect-square max-w-[180px] mx-auto transition-colors"
                style={{ backgroundColor: `#${config.backgroundColor}` }}
              >
                <AvatarPreview config={config} />
              </div>
              <Button
                onClick={randomize}
                variant="outline"
                size="sm"
                className="w-full max-w-[180px] min-h-[36px] bg-white/5 border-[var(--color-aurora-pink)]/30 text-white hover:bg-[var(--color-aurora-pink)]/10 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Randomize ✨
              </Button>
            </div>

            {/* Customization Options - Compact Grid */}
            <div className="space-y-3">
              {/* Row 1: Background & Skin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[var(--color-aurora-cream)] font-medium mb-1.5 block text-xs">Background</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setConfig({ ...config, backgroundColor: bg.id })}
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${
                          config.backgroundColor === bg.id
                            ? "border-[var(--color-aurora-pink)] scale-110 shadow-md"
                            : "border-white/20 hover:border-[var(--color-aurora-pink)]/50"
                        }`}
                        style={{ backgroundColor: bg.color }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[var(--color-aurora-cream)] font-medium mb-1.5 block text-xs">Skin Tone</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setConfig({ ...config, skinColor: tone.id })}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          config.skinColor === tone.id
                            ? "border-[var(--color-aurora-pink)] scale-110 shadow-md"
                            : "border-white/20 hover:border-[var(--color-aurora-pink)]/50"
                        }`}
                        style={{ backgroundColor: tone.color }}
                        title={tone.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hair Style - Compact Grid */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-medium mb-1.5 block text-xs">Hair Style</Label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ ...config, hairStyle: style.id })}
                      className={`p-1.5 rounded-lg text-center transition-all min-h-[36px] ${
                        config.hairStyle === style.id
                          ? "bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white shadow-md"
                          : "bg-white/5 text-[var(--color-aurora-cream)] hover:bg-[var(--color-aurora-pink)]/10 border border-white/10"
                      }`}
                      title={style.name}
                    >
                      <span className="text-sm">{style.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <Label className="text-[var(--color-aurora-cream)] font-medium mb-1.5 block text-xs">Hair Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setConfig({ ...config, hairColor: color.id })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        config.hairColor === color.id
                          ? "border-[var(--color-aurora-pink)] scale-110 shadow-md"
                          : "border-white/20 hover:border-[var(--color-aurora-pink)]/50"
                      }`}
                      style={{ backgroundColor: color.color }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Row: Eyes, Mouth, Earrings - Compact */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[var(--color-aurora-cream)] font-medium mb-1 block text-xs">Eyes</Label>
                  <div className="flex flex-wrap gap-1">
                    {EYE_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setConfig({ ...config, eyesStyle: style.id })}
                        className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                          config.eyesStyle === style.id
                            ? "bg-[var(--color-aurora-pink)] text-white"
                            : "bg-white/5 text-[var(--color-aurora-cream)] hover:bg-white/10"
                        }`}
                        title={style.name}
                      >
                        {style.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[var(--color-aurora-cream)] font-medium mb-1 block text-xs">Mouth</Label>
                  <div className="flex flex-wrap gap-1">
                    {MOUTH_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setConfig({ ...config, mouthStyle: style.id })}
                        className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                          config.mouthStyle === style.id
                            ? "bg-[var(--color-aurora-pink)] text-white"
                            : "bg-white/5 text-[var(--color-aurora-cream)] hover:bg-white/10"
                        }`}
                        title={style.name}
                      >
                        {style.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[var(--color-aurora-cream)] font-medium mb-1 block text-xs">Earrings</Label>
                  <div className="flex flex-wrap gap-1">
                    {EARRINGS.map((earring) => (
                      <button
                        key={earring.id}
                        onClick={() => setConfig({ ...config, earrings: earring.id })}
                        className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                          config.earrings === earring.id
                            ? "bg-[var(--color-aurora-pink)] text-white"
                            : "bg-white/5 text-[var(--color-aurora-cream)] hover:bg-white/10"
                        }`}
                        title={earring.name}
                      >
                        {earring.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Freckles Toggle - Inline */}
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                <Label className="text-[var(--color-aurora-cream)] text-xs">Add Freckles</Label>
                <button
                  onClick={() => setConfig({ ...config, freckles: !config.freckles })}
                  className={`w-10 h-5 rounded-full transition-all ${
                    config.freckles ? "bg-[var(--color-aurora-pink)]" : "bg-white/20"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    config.freckles ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex justify-between gap-3 p-4 pt-3 border-t border-white/10 bg-[var(--color-aurora-violet)]/80">
          <Button
            variant="outline"
            onClick={onSkip}
            className="min-h-[44px] px-4 bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Skip for now
          </Button>
          <Button
            onClick={() => onComplete(config)}
            className="flex-1 min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90 shadow-lg"
          >
            <Heart className="w-4 h-4 mr-2" />
            Create My Aurora
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
      size: 200,
    });

    return avatar.toString();
  }, [config]);

  return (
    <motion.div
      key={config.seed}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
      className="relative w-full h-full max-w-[150px] max-h-[150px] mx-auto rounded-full shadow-xl shadow-[var(--color-aurora-pink)]/20 flex items-center justify-center"
      style={{ backgroundColor: `#${config.backgroundColor}` }}
    >
      <div 
        className="w-[95%] h-[95%] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
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
