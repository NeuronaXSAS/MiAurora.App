"use client";

import { useState, useEffect, useCallback } from 'react';

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
export function generateAvatarUrl(config: AvatarConfig | null): string {
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

export function useAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load avatar on mount
  useEffect(() => {
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
  }, []);

  // Update avatar and persist to localStorage
  const updateAvatar = useCallback((config: AvatarConfig) => {
    setAvatarConfig(config);
    const url = generateAvatarUrl(config);
    setAvatarUrl(url);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  }, []);

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
