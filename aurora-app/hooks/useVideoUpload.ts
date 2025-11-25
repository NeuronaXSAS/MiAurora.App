/**
 * useVideoUpload Hook
 * 
 * Manages video upload to Cloudinary with progress tracking.
 * Provider-agnostic design allows easy migration to AWS or other services.
 */

import { useState } from 'react';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseVideoUploadReturn {
  upload: (file: File, metadata: UploadMetadata) => Promise<{ success: boolean; reelId?: Id<'reels'>; error?: string }>;
  progress: UploadProgress | null;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

interface UploadMetadata {
  caption?: string;
  hashtags?: string[];
  location?: {
    name: string;
    coordinates: [number, number];
  };
  isAnonymous?: boolean;
  safetyTags?: string[];
}

export function useVideoUpload(): UseVideoUploadReturn {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCredentials = useQuery(api.reels.generateUploadCredentials, {
    userId: 'temp' as Id<'users'>,
  }) as any;
  const createReel = useMutation(api.reels.createReel);
  const analyzeReel = useAction(api.actions.analyzeReel.analyzeReelContent);

  const upload = async (file: File, metadata: UploadMetadata) => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Validate file
      if (!file.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('Video must be less than 100MB');
      }

      // Get video duration
      const duration = await getVideoDuration(file);
      if (duration < 15 || duration > 90) {
        throw new Error('Video must be between 15 and 90 seconds');
      }

      // Step 1: Get Cloudinary configuration
      if (!generateCredentials || !generateCredentials.success) {
        throw new Error('Video upload is coming soon! We\'re working on bringing you this feature. 🚀');
      }

      const { credentials } = generateCredentials;

      // Step 2: Upload to Cloudinary using unsigned upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'aurora_reels'); // Must be created in Cloudinary dashboard
      formData.append('folder', `aurora/reels`);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', credentials.uploadUrl);
        xhr.send(formData);
      });

      const cloudinaryResponse = await uploadPromise;

      // Step 3: Get video metadata
      const videoUrl = cloudinaryResponse.secure_url;
      const thumbnailUrl = cloudinaryResponse.secure_url.replace(
        '/upload/',
        '/upload/w_400,h_400,c_fill,g_center,so_auto/'
      ).replace(/\.[^.]+$/, '.jpg');

      const dimensions = await getVideoDimensions(file);

      // Step 4: Save to Convex database
      const result = await createReel({
        authorId: 'temp' as Id<'users'>, // Will be replaced by actual user ID
        provider: 'cloudinary',
        externalId: cloudinaryResponse.public_id,
        videoUrl,
        thumbnailUrl,
        duration,
        metadata: {
          width: dimensions.width,
          height: dimensions.height,
          format: cloudinaryResponse.format,
          sizeBytes: cloudinaryResponse.bytes,
          transformations: {
            bitRate: cloudinaryResponse.bit_rate,
            frameRate: cloudinaryResponse.frame_rate,
          },
        },
        caption: metadata.caption,
        hashtags: metadata.hashtags,
        location: metadata.location,
        isAnonymous: metadata.isAnonymous,
      });

      setIsUploading(false);
      setProgress(null);

      // Trigger AI analysis in the background (don't wait for it)
      if (result.reelId) {
        analyzeReel({ reelId: result.reelId }).catch((err) => {
          console.error('AI analysis failed:', err);
          // Don't fail the upload if AI analysis fails
        });
      }

      return {
        success: true,
        reelId: result.reelId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);
      setProgress(null);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const reset = () => {
    setProgress(null);
    setIsUploading(false);
    setError(null);
  };

  return {
    upload,
    progress,
    isUploading,
    error,
    reset,
  };
}

// Helper: Get video duration
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

// Helper: Get video dimensions
function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}
