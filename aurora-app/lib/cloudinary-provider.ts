/**
 * Cloudinary Video Provider Implementation
 * 
 * Implements the VideoProvider interface for Cloudinary.
 * Can be easily swapped with AWS MediaConvert or other providers.
 */

import { v2 as cloudinary } from 'cloudinary';
import { CONFIG, isConfigured } from './config';
import type {
  VideoProvider,
  UploadCredentials,
  VideoMetadata,
} from './video-provider';

export class CloudinaryProvider implements VideoProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private uploadPreset: string;

  constructor() {
    // Load credentials from centralized config
    this.cloudName = CONFIG.cloudinary.cloudName;
    this.apiKey = CONFIG.cloudinary.apiKey;
    this.apiSecret = CONFIG.cloudinary.apiSecret;
    this.uploadPreset = CONFIG.cloudinary.uploadPreset;

    if (!isConfigured.cloudinary) {
      console.warn(
        '⚠️  Cloudinary not configured. Check docs/ENV_MASTER_GUIDE.md for setup instructions.'
      );
    }

    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  async generateUploadCredentials(
    userId: string,
    options?: {
      folder?: string;
      maxDuration?: number;
      maxSize?: number;
      tags?: string[];
    }
  ): Promise<UploadCredentials> {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = options?.folder || `aurora/reels/${userId}`;

    // Build upload parameters
    const uploadParams: Record<string, any> = {
      timestamp,
      folder,
      resource_type: 'video',
      // Cloudinary upload preset configuration
      upload_preset: this.uploadPreset,
      // Video constraints
      ...(options?.maxDuration && {
        duration: `lte:${options.maxDuration}`,
      }),
      ...(options?.tags && { tags: options.tags.join(',') }),
    };

    // Generate signature for secure uploads
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      this.apiSecret
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
      signature,
      timestamp,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      expiresAt: timestamp + 3600, // 1 hour expiration
    };
  }

  getVideoUrl(
    externalId: string,
    transformations?: {
      quality?: 'auto' | 'low' | 'medium' | 'high';
      format?: 'mp4' | 'webm';
      width?: number;
      height?: number;
    }
  ): string {
    const transformation: any = {
      resource_type: 'video',
      quality: transformations?.quality || 'auto',
      fetch_format: transformations?.format || 'mp4',
    };

    if (transformations?.width) {
      transformation.width = transformations.width;
    }
    if (transformations?.height) {
      transformation.height = transformations.height;
      transformation.crop = 'limit'; // Maintain aspect ratio
    }

    return cloudinary.url(externalId, transformation);
  }

  getThumbnailUrl(
    externalId: string,
    options?: {
      width?: number;
      height?: number;
      time?: number;
    }
  ): string {
    const transformation: any = {
      resource_type: 'video',
      format: 'jpg',
      width: options?.width || 400,
      height: options?.height || 400,
      crop: 'fill',
      gravity: 'center',
    };

    // Extract frame at specific time
    if (options?.time !== undefined) {
      transformation.start_offset = `${options.time}s`;
    } else {
      // Default to middle of video
      transformation.start_offset = 'auto';
    }

    return cloudinary.url(externalId, transformation);
  }

  async deleteVideo(externalId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(externalId, {
        resource_type: 'video',
        invalidate: true, // Invalidate CDN cache
      });
    } catch (error) {
      console.error('Failed to delete video from Cloudinary:', error);
      throw new Error('Failed to delete video');
    }
  }

  async getMetadata(externalId: string): Promise<VideoMetadata> {
    try {
      const result = await cloudinary.api.resource(externalId, {
        resource_type: 'video',
      });

      return {
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
        sizeBytes: result.bytes,
        transformations: {
          bitRate: result.bit_rate,
          frameRate: result.frame_rate,
          videoCodec: result.video?.codec,
          audioCodec: result.audio?.codec,
        },
      };
    } catch (error) {
      console.error('Failed to fetch video metadata from Cloudinary:', error);
      throw new Error('Failed to fetch video metadata');
    }
  }
}

// Export singleton instance
export const cloudinaryProvider = new CloudinaryProvider();
