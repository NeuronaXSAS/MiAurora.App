"use client";

import { lorelei } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

export interface AuroraAvatarConfig {
  seed: string;
  backgroundColor?: string;
  hairStyle?: string;
  hairColor?: string;
  skinColor?: string;
  eyesStyle?: string;
  mouthStyle?: string;
  earrings?: string;
  freckles?: boolean;
}

function normalizeColor(value: string | undefined, fallback: string) {
  return (value || fallback).replace("#", "");
}

export function createAuroraAvatarDataUri(
  config: AuroraAvatarConfig | null | undefined,
  size = 128,
): string {
  if (!config?.seed) {
    return "";
  }

  const avatar = createAvatar(lorelei, {
    seed: config.seed,
    size,
    backgroundColor: [normalizeColor(config.backgroundColor, "c9cef4")] as never,
    hair: config.hairStyle ? ([config.hairStyle] as never) : undefined,
    hairColor: config.hairColor
      ? ([normalizeColor(config.hairColor, "6f4e37")] as never)
      : undefined,
    skinColor: config.skinColor
      ? ([normalizeColor(config.skinColor, "edb98a")] as never)
      : undefined,
    eyes: config.eyesStyle ? ([config.eyesStyle] as never) : undefined,
    mouth: config.mouthStyle ? ([config.mouthStyle] as never) : undefined,
    earrings: config.earrings ? ([config.earrings] as never) : undefined,
    freckles: config.freckles ? (["variant01"] as never) : ([] as never),
  });

  return avatar.toDataUri();
}
