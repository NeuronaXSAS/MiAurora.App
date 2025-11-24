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
import { Sparkles, RefreshCw, Check } from "lucide-react";
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

interface AvatarCreatorProps {
  open: boolean;
  onComplete: (avatarConfig: AvatarConfig) => void;
  onSkip: () => void;
}

export interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  accessory: string;
}

const SKIN_TONES = [
  { id: "light", color: "#FFE0BD", name: "Light" },
  { id: "medium-light", color: "#F1C27D", name: "Medium Light" },
  { id: "medium", color: "#C68642", name: "Medium" },
  { id: "medium-dark", color: "#8D5524", name: "Medium Dark" },
  { id: "dark", color: "#5C3317", name: "Dark" },
];

const HAIR_STYLES = [
  { id: "long", name: "Long & Flowing", emoji: "💁‍♀️" },
  { id: "short", name: "Short & Chic", emoji: "👩‍🦱" },
  { id: "curly", name: "Curly", emoji: "👩‍🦱" },
  { id: "wavy", name: "Wavy", emoji: "👱‍♀️" },
  { id: "bun", name: "Bun", emoji: "👩" },
  { id: "braids", name: "Braids", emoji: "👩‍🦱" },
];

const HAIR_COLORS = [
  { id: "black", color: "#2C1B18", name: "Black" },
  { id: "brown", color: "#6F4E37", name: "Brown" },
  { id: "blonde", color: "#F5DEB3", name: "Blonde" },
  { id: "red", color: "#A52A2A", name: "Red" },
  { id: "purple", color: "#9B59B6", name: "Purple" },
  { id: "pink", color: "#FF69B4", name: "Pink" },
];

const EYE_COLORS = [
  { id: "brown", color: "#8B4513", name: "Brown" },
  { id: "blue", color: "#4169E1", name: "Blue" },
  { id: "green", color: "#228B22", name: "Green" },
  { id: "hazel", color: "#8E7618", name: "Hazel" },
  { id: "gray", color: "#708090", name: "Gray" },
];

const OUTFITS = [
  { id: "casual", name: "Casual", emoji: "👕" },
  { id: "professional", name: "Professional", emoji: "👔" },
  { id: "sporty", name: "Sporty", emoji: "🏃‍♀️" },
  { id: "elegant", name: "Elegant", emoji: "👗" },
];

const ACCESSORIES = [
  { id: "none", name: "None", emoji: "✨" },
  { id: "glasses", name: "Glasses", emoji: "👓" },
  { id: "earrings", name: "Earrings", emoji: "💎" },
  { id: "necklace", name: "Necklace", emoji: "📿" },
  { id: "headband", name: "Headband", emoji: "🎀" },
];

export function AvatarCreator({ open, onComplete, onSkip }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>({
    skinTone: "medium",
    hairStyle: "long",
    hairColor: "brown",
    eyeColor: "brown",
    outfit: "casual",
    accessory: "none",
  });

  const randomize = () => {
    setConfig({
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].id,
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].id,
      eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].id,
      outfit: OUTFITS[Math.floor(Math.random() * OUTFITS.length)].id,
      accessory: ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-3xl backdrop-blur-xl bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl text-white">Create Your Avatar</DialogTitle>
              <DialogDescription className="text-gray-300">
                Design your unique digital identity ✨
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          {/* Avatar Preview */}
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 border-2 border-purple-500/30 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
              <AvatarPreview config={config} />
            </div>
            <Button
              onClick={randomize}
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Randomize
            </Button>
          </div>

          {/* Customization Options */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {/* Skin Tone */}
            <div>
              <Label className="text-white font-semibold mb-3 block">Skin Tone</Label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setConfig({ ...config, skinTone: tone.id })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      config.skinTone === tone.id
                        ? "border-purple-400 scale-110 shadow-lg shadow-purple-500/50"
                        : "border-white/20 hover:border-white/40"
                    }`}
                    style={{ backgroundColor: tone.color }}
                    title={tone.name}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <Label className="text-white font-semibold mb-3 block">Hair Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {HAIR_STYLES.map((style) => (
                  <Badge
                    key={style.id}
                    onClick={() => setConfig({ ...config, hairStyle: style.id })}
                    className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                      config.hairStyle === style.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                        : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-1">{style.emoji}</span>
                    {style.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <Label className="text-white font-semibold mb-3 block">Hair Color</Label>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setConfig({ ...config, hairColor: color.id })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      config.hairColor === color.id
                        ? "border-purple-400 scale-110 shadow-lg shadow-purple-500/50"
                        : "border-white/20 hover:border-white/40"
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Eye Color */}
            <div>
              <Label className="text-white font-semibold mb-3 block">Eye Color</Label>
              <div className="flex flex-wrap gap-2">
                {EYE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setConfig({ ...config, eyeColor: color.id })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      config.eyeColor === color.id
                        ? "border-purple-400 scale-110 shadow-lg shadow-purple-500/50"
                        : "border-white/20 hover:border-white/40"
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div>
              <Label className="text-white font-semibold mb-3 block">Outfit Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {OUTFITS.map((outfit) => (
                  <Badge
                    key={outfit.id}
                    onClick={() => setConfig({ ...config, outfit: outfit.id })}
                    className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                      config.outfit === outfit.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                        : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-1">{outfit.emoji}</span>
                    {outfit.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div>
              <Label className="text-white font-semibold mb-3 block">Accessories</Label>
              <div className="grid grid-cols-3 gap-2">
                {ACCESSORIES.map((acc) => (
                  <Badge
                    key={acc.id}
                    onClick={() => setConfig({ ...config, accessory: acc.id })}
                    className={`cursor-pointer px-3 py-2 text-sm transition-all ${
                      config.accessory === acc.id
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                        : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-1">{acc.emoji}</span>
                    {acc.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onSkip}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Skip for now
          </Button>
          <Button
            onClick={() => onComplete(config)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50"
          >
            <Check className="w-4 h-4 mr-2" />
            Create Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Avatar Preview Component using DiceBear
function AvatarPreview({ config }: { config: AvatarConfig }) {
  const avatarSvg = useMemo(() => {
    const avatar = createAvatar(avataaars, {
      seed: JSON.stringify(config),
      skinColor: [config.skinTone] as any,
      hairColor: [config.hairColor] as any,
      top: [config.hairStyle] as any,
      accessories: [config.accessory === 'none' ? 'blank' : config.accessory] as any,
      clothingGraphic: ['none'] as any,
      size: 200,
    });

    return avatar.toString();
  }, [config]);

  return (
    <motion.div
      key={JSON.stringify(config)}
      initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="relative w-48 h-48 mx-auto"
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
}
