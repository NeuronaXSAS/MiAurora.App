/**
 * useVideoUpload Hook
 * 
 * Manages video upload to Cloudinary with progress tracking.
 * Uses unsigned uploads for client-side simplicity.
 */

import { useState } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseVideoUploadReturn {
  upload: (file: File, metadata: UploadMetadata, userId: Id<'users'>) => Promise<{ success: boolean; reelId?: Id<'reels'>; error?: string }>;
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

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'aurora_reels'; // Must be created as unsigned preset in Cloudinary dashboard

export function useVideoUpload(): UseVideoUploadReturn {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReel = useMutation(api.reels.createReel);
  const analyzeReel = useAction(api.actions.analyzeReel.analyzeReelContent);

  const upload = async (file: File, metadata: UploadMetadata, userId: Id<'users'>) => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Validate Cloudinary configuration
      if (!CLOUDINARY_CLOUD_NAME) {
        throw new Error('Cloudinary no está configurado. Contacta al administrador.');
      }

      // Validate file
      if (!file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser un video');
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error('El video debe ser menor a 100MB');
      }

      // Get video duration - no minimum, max 3 minutes (180 seconds)
      const duration = await getVideoDuration(file);
      console.log('Video duration:', duration, 'seconds');
      
      if (duration > 180) {
        throw new Error(`El video dura ${Math.round(duration)} segundos. El máximo es 3 minutos (180 segundos).`);
      }
      
      if (duration < 1) {
        throw new Error('El video es demasiado corto. Debe durar al menos 1 segundo.');
      }

      // Step 1: Upload to Cloudinary using unsigned upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'aurora/reels');

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

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
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error?.message || `Error al subir: ${xhr.status}`));
            } catch {
              reject(new Error(`Error al subir el video: ${xhr.statusText || xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error de conexión al subir el video'));
        });

        xhr.open('POST', uploadUrl);
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

      // Step 2: Save to Convex database
      const result = await createReel({
        authorId: userId,
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
