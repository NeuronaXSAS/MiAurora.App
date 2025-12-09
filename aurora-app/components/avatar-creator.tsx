"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { RefreshCw, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";

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

const SKIN_TONES = [
  { id: "f5d0c5", color: "#F5D0C5" },
  { id: "edb98a", color: "#EDB98A" },
  { id: "d08b5b", color: "#D08B5B" },
  { id: "c68642", color: "#C68642" },
  { id: "8d5524", color: "#8D5524" },
  { id: "5c3836", color: "#5C3836" },
];

const HAIR_STYLES = [
  { id: "variant14", emoji: "💁‍♀️" },
  { id: "variant15", emoji: "👩‍🦱" },
  { id: "variant17", emoji: "👩" },
  { id: "variant20", emoji: "💇‍♀️" },
  { id: "variant21", emoji: "✨" },
  { id: "variant23", emoji: "🌸" },
  { id: "variant26", emoji: "🌺" },
  { id: "variant29", emoji: "🎀" },
  { id: "variant32", emoji: "🌷" },
  { id: "variant35", emoji: "🌻" },
  { id: "variant41", emoji: "👸" },
  { id: "variant44", emoji: "🌙" },
];

const HAIR_COLORS = [
  { id: "2c1b18", color: "#2C1B18" },
  { id: "6f4e37", color: "#6F4E37" },
  { id: "b5651d", color: "#B5651D" },
  { id: "f5deb3", color: "#F5DEB3" },
  { id: "ff6b6b", color: "#FF6B6B" },
  { id: "8b5cf6", color: "#8B5CF6" },
];

const BACKGROUNDS = [
  { id: "ffe8e8", color: "#FFE8E8" },
  { id: "fff0f5", color: "#FFF0F5" },
  { id: "ffefd9", color: "#FFEFD9" },
  { id: "e8e4ff", color: "#E8E4FF" },
  { id: "d6f4ec", color: "#D6F4EC" },
  { id: "c9cef4", color: "#C9CEF4" },
];

const EYES_OPTIONS = [
  { id: "variant01", emoji: "✨" },
  { id: "variant02", emoji: "💫" },
  { id: "variant03", emoji: "🌙" },
  { id: "variant04", emoji: "⭐" },
];

const MOUTH_OPTIONS = [
  { id: "happy01", emoji: "😊" },
  { id: "happy02", emoji: "😄" },
  { id: "happy03", emoji: "🙂" },
  { id: "happy04", emoji: "☺️" },
];

const EARRINGS_OPTIONS = [
  { id: "variant01", emoji: "💎" },
  { id: "variant02", emoji: "⭕" },
  { id: "variant03", emoji: "💧" },
];

export function AvatarCreator({ open, onComplete, onSkip }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>({
    seed: `aurora-${Date.now()}`,
    backgroundColor: "ffe8e8",
    hairStyle: "variant17",
    hairColor: "6f4e37",
    skinColor: "edb98a",
    eyesStyle: "variant01",
    mouthStyle: "happy01",
    earrings: "variant01",
    freckles: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const randomize = () => {
    setConfig({
      seed: `aurora-${Date.now()}-${Math.random()}`,
      backgroundColor: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)].id,
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].id,
      skinColor: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].id,
      eyesStyle: EYES_OPTIONS[Math.floor(Math.random() * EYES_OPTIONS.length)].id,
      mouthStyle: MOUTH_OPTIONS[Math.floor(Math.random() * MOUTH_OPTIONS.length)].id,
      earrings: EARRINGS_OPTIONS[Math.floor(Math.random() * EARRINGS_OPTIONS.length)].id,
      freckles: Math.random() > 0.7,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="max-w-2xl w-[95vw] h-[90vh] sm:h-auto sm:max-h-[85vh] p-0 bg-gradient-to-br from-[var(--color-aurora-violet)] to-[var(--color-aurora-purple)] border-0 flex flex-col mx-auto">
        {/* Header - Fixed */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-white/10 text-center">
          <h2 className="text-xl font-bold text-white">Meet Your Aurora Companion</h2>
          <p className="text-sm text-[var(--color-aurora-cream)]/80">She'll be your 24/7 guide, friend & wellness tracker 💜</p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
            {/* Avatar Preview - Properly Centered */}
            <div className="flex flex-col items-center justify-center gap-3 mx-auto">
              <div
                className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center mx-auto ring-4 ring-white/10"
                style={{ backgroundColor: `#${config.backgroundColor}` }}
              >
                <div className="w-full h-full flex items-center justify-center p-2">
                  <AvatarPreview config={config} />
                </div>
              </div>
              <Button
                onClick={randomize}
                variant="outline"
                size="sm"
                className="min-h-[40px] px-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Randomize ✨
              </Button>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Background & Skin in row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80 text-xs mb-2 block">Background</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setConfig({ ...config, backgroundColor: bg.id })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${config.backgroundColor === bg.id
                            ? "border-white shadow-lg scale-110"
                            : "border-white/20 hover:border-white/50"
                          }`}
                        style={{ backgroundColor: bg.color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-white/80 text-xs mb-2 block">Skin Tone</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setConfig({ ...config, skinColor: tone.id })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${config.skinColor === tone.id
                            ? "border-white shadow-lg scale-110"
                            : "border-white/20 hover:border-white/50"
                          }`}
                        style={{ backgroundColor: tone.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <Label className="text-white/80 text-xs mb-2 block">Hair Style</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ ...config, hairStyle: style.id })}
                      className={`h-10 rounded-lg text-lg transition-all flex items-center justify-center ${config.hairStyle === style.id
                          ? "bg-[var(--color-aurora-pink)] shadow-md"
                          : "bg-white/10 hover:bg-white/20"
                        }`}
                    >
                      {style.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <Label className="text-white/80 text-xs mb-2 block">Hair Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setConfig({ ...config, hairColor: color.id })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${config.hairColor === color.id
                          ? "border-white shadow-lg scale-110"
                          : "border-white/20 hover:border-white/50"
                        }`}
                      style={{ backgroundColor: color.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Eyes, Mouth, Earrings in row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-white/80 text-xs mb-2 block">Eyes</Label>
                  <div className="flex gap-1">
                    {EYES_OPTIONS.map((eye) => (
                      <button
                        key={eye.id}
                        onClick={() => setConfig({ ...config, eyesStyle: eye.id })}
                        className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all ${config.eyesStyle === eye.id
                            ? "bg-[var(--color-aurora-pink)]"
                            : "bg-white/10 hover:bg-white/20"
                          }`}
                      >
                        {eye.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-white/80 text-xs mb-2 block">Mouth</Label>
                  <div className="flex gap-1">
                    {MOUTH_OPTIONS.map((mouth) => (
                      <button
                        key={mouth.id}
                        onClick={() => setConfig({ ...config, mouthStyle: mouth.id })}
                        className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all ${config.mouthStyle === mouth.id
                            ? "bg-[var(--color-aurora-pink)]"
                            : "bg-white/10 hover:bg-white/20"
                          }`}
                      >
                        {mouth.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-white/80 text-xs mb-2 block">Earrings</Label>
                  <div className="flex gap-1">
                    {EARRINGS_OPTIONS.map((ear) => (
                      <button
                        key={ear.id}
                        onClick={() => setConfig({ ...config, earrings: ear.id })}
                        className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all ${config.earrings === ear.id
                            ? "bg-[var(--color-aurora-pink)]"
                            : "bg-white/10 hover:bg-white/20"
                          }`}
                      >
                        {ear.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Freckles option removed - was non-functional */}
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 bg-gradient-to-t from-[var(--color-aurora-violet)] to-[var(--color-aurora-violet)]/95 border-t border-white/10 p-4 pb-6 sm:pb-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSkip}
              className="min-h-[52px] px-6 bg-white/10 border-white/30 text-white hover:bg-white/20 font-medium"
            >
              Skip for now
            </Button>
            <Button
              onClick={() => onComplete(config)}
              className="flex-1 min-h-[52px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90 text-white font-semibold shadow-lg"
            >
              <Heart className="w-5 h-5 mr-2" />
              Create My Aurora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      freckles: config.freckles ? ["variant01"] as any : [] as any,
      size: 200,
    });
    return avatar.toString();
  }, [config]);

  return (
    <motion.div
      key={config.seed}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
}

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
    freckles: config.freckles ? ["variant01"] as any : [] as any,
    size: 128,
  });
  return avatar.toDataUri();
}
