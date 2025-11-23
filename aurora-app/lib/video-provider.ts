/**
 * Provider-agnostic video infrastructure
 * 
 * This abstraction layer allows easy migration between video providers
 * (Cloudinary, AWS MediaConvert, etc.) without refactoring the entire app.
 */

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  format: string;
  sizeBytes: number;
  transformations?: Record<string, any>;
}

export interface UploadCredentials {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName?: string;
  expiresAt: number;
}

export interface VideoUploadResult {
  externalId: string; // Provider-specific ID (e.g., Cloudinary public_id)
  videoUrl: string;
  thumbnailUrl: string;
  metadata: VideoMetadata;
}

/**
 * VideoProvider interface
 * 
 * Any video provider implementation must fulfill this contract.
 * This ensures we can swap providers without changing application code.
 */
export interface VideoProvider {
  /**
   * Generate secure upload credentials for client-side uploads
   * @param userId - User ID for tracking and organization
   * @param options - Optional upload configuration
   * @returns Upload credentials including signature and URL
   */
  generateUploadCredentials(
    userId: string,
    options?: {
      folder?: string;
      maxDuration?: number; // seconds
      maxSize?: number; // bytes
      tags?: string[];
    }
  ): Promise<UploadCredentials>;

  /**
   * Get the playback URL for a video
   * @param externalId - Provider-specific video ID
   * @param transformations - Optional video transformations
   * @returns Optimized video URL
   */
  getVideoUrl(
    externalId: string,
    transformations?: {
      quality?: 'auto' | 'low' | 'medium' | 'high';
      format?: 'mp4' | 'webm';
      width?: number;
      height?: number;
    }
  ): string;

  /**
   * Get thumbnail URL for a video
   * @param externalId - Provider-specific video ID
   * @param options - Thumbnail options
   * @returns Thumbnail image URL
   */
  getThumbnailUrl(
    externalId: string,
    options?: {
      width?: number;
      height?: number;
      time?: number; // seconds into video
    }
  ): string;

  /**
   * Delete a video from the provider
   * @param externalId - Provider-specific video ID
   */
  deleteVideo(externalId: string): Promise<void>;

  /**
   * Get video metadata
   * @param externalId - Provider-specific video ID
   * @returns Video metadata including dimensions, duration, size
   */
  getMetadata(externalId: string): Promise<VideoMetadata>;
}
