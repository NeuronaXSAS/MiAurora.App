"use client";

import { useState, useEffect } from 'react';

// Simple avatar URL generator using DiceBear API
export function generateAvatarUrl(config: any): string {
  if (!config) return '';
  
  const baseUrl = 'https://api.dicebear.com/7.x/lorelei/svg';
  const params = new URLSearchParams();
  
  if (config.skinColor) params.set('skinColor', config.skinColor.replace('#', ''));
  if (config.hairColor) params.set('hairColor', config.hairColor.replace('#', ''));
  if (config.backgroundColor) params.set('backgroundColor', config.backgroundColor.replace('#', ''));
  if (config.seed) params.set('seed', config.seed);
  
  return `${baseUrl}?${params.toString()}`;
}

export function useAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load avatar config from localStorage as fallback
    const stored = localStorage.getItem('aurora-avatar-config');
    if (stored) {
      try {
        const config = JSON.parse(stored);
        setAvatarConfig(config);
        setAvatarUrl(generateAvatarUrl(config));
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const updateAvatar = (config: any) => {
    setAvatarConfig(config);
    setAvatarUrl(generateAvatarUrl(config));
    localStorage.setItem('aurora-avatar-config', JSON.stringify(config));
  };

  return {
    avatarUrl,
    avatarConfig,
    isLoading,
    hasAvatar: !!avatarConfig,
    updateAvatar,
  };
}
