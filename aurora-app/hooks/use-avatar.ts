"use client";

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

// Simple avatar URL generator using DiceBear API
export function generateAvatarUrl(config: AvatarConfig | null | undefined): string {
  if (!config) return '';
  
  const baseUrl = 'https://api.dicebear.com/7.x/lorelei/svg';
  const params = new URLSearchParams();
  
  // Add all config options
  if (config.seed) params.set('seed', config.seed);
  if (config.skinColor) params.set('skinColor', config.skinColor.replace('#', ''));
  if (config.hairColor) params.set('hairColor', config.hairColor.replace('#', ''));
  if (config.backgroundColor) params.set('backgroundColor', config.backgroundColor.replace('#', ''));
  if (config.hairStyle) params.set('hair', config.hairStyle);
  if (config.eyesStyle) params.set('eyes', config.eyesStyle);
  if (config.mouthStyle) params.set('mouth', config.mouthStyle);
  if (config.earrings) params.set('earrings', config.earrings);
  if (config.freckles) params.set('freckles', 'variant01');
  
  return `${baseUrl}?${params.toString()}`;
}

const STORAGE_KEY = 'aurora-avatar-config';

/**
 * Hook to manage user avatar - uses Convex as primary source, localStorage as fallback
 */
export function useAvatar(userId?: Id<"users">) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user from Convex (includes avatarConfig)
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const updateAvatarMutation = useMutation(api.users.updateAvatar);

  // Load avatar from Convex or localStorage
  useEffect(() => {
    // If we have user data from Convex with avatar, use it
    if (user?.avatarConfig) {
      setAvatarConfig(user.avatarConfig as AvatarConfig);
      setAvatarUrl(generateAvatarUrl(user.avatarConfig as AvatarConfig));
      setIsLoading(false);
      return;
    }

    // Fallback to localStorage if no Convex data
    if (user === null || !userId) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const config = JSON.parse(stored) as AvatarConfig;
          setAvatarConfig(config);
          setAvatarUrl(generateAvatarUrl(config));
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, userId]);

  // Update avatar and persist to both Convex and localStorage
  const updateAvatar = useCallback(async (config: AvatarConfig) => {
    setAvatarConfig(config);
    const url = generateAvatarUrl(config);
    setAvatarUrl(url);
    
    // Save to localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving avatar to localStorage:', error);
    }

    // Save to Convex if we have userId
    if (userId) {
      try {
        await updateAvatarMutation({ userId, avatarConfig: config });
      } catch (error) {
        console.error('Error saving avatar to Convex:', error);
      }
    }
  }, [userId, updateAvatarMutation]);

  // Clear avatar
  const clearAvatar = useCallback(() => {
    setAvatarConfig(null);
    setAvatarUrl(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing avatar:', error);
    }
  }, []);

  return {
    avatarUrl,
    avatarConfig,
    isLoading,
    hasAvatar: !!avatarConfig,
    updateAvatar,
    clearAvatar,
  };
}
