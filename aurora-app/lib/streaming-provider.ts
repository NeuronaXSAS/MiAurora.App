/**
 * Streaming Provider Abstraction
 * 
 * Provider-agnostic interface for livestreaming services.
 * Allows easy migration between Agora, Twilio, AWS IVS, etc.
 */

export interface StreamConfig {
  channelName: string;
  token: string | null;
  appId: string;
  uid: string;
}

export interface StreamStats {
  bitrate: number;
  fps: number;
  resolution: { width: number; height: number };
  latency: number;
}

export interface StreamingProvider {
  /**
   * Initialize the streaming client
   */
  initialize(config: StreamConfig): Promise<void>;

  /**
   * Start broadcasting as a host
   */
  startBroadcast(options?: {
    video?: boolean;
    audio?: boolean;
    cameraId?: string;
    microphoneId?: string;
  }): Promise<void>;

  /**
   * Stop broadcasting
   */
  stopBroadcast(): Promise<void>;

  /**
   * Join as a viewer
   */
  joinAsViewer(): Promise<void>;

  /**
   * Leave the stream
   */
  leave(): Promise<void>;

  /**
   * Toggle camera on/off
   */
  toggleCamera(enabled: boolean): Promise<void>;

  /**
   * Toggle microphone on/off
   */
  toggleMicrophone(enabled: boolean): Promise<void>;

  /**
   * Switch camera (front/back on mobile)
   */
  switchCamera(): Promise<void>;

  /**
   * Get available devices
   */
  getDevices(): Promise<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
  }>;

  /**
   * Get current stream statistics
   */
  getStats(): Promise<StreamStats>;

  /**
   * Set video quality
   */
  setVideoQuality(quality: 'low' | 'medium' | 'high'): Promise<void>;

  /**
   * Get the local video element
   */
  getLocalVideoElement(): HTMLElement | null;

  /**
   * Get remote video elements
   */
  getRemoteVideoElements(): HTMLElement[];

  /**
   * Subscribe to events
   */
  on(event: string, callback: (...args: any[]) => void): void;

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (...args: any[]) => void): void;

  /**
   * Cleanup and destroy
   */
  destroy(): Promise<void>;
}

/**
 * Streaming Events
 */
export enum StreamingEvent {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  CONNECTION_FAILED = 'connection-failed',

  // User events
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  USER_PUBLISHED = 'user-published',
  USER_UNPUBLISHED = 'user-unpublished',

  // Stream events
  STREAM_STARTED = 'stream-started',
  STREAM_STOPPED = 'stream-stopped',
  STREAM_ERROR = 'stream-error',

  // Media events
  CAMERA_CHANGED = 'camera-changed',
  MICROPHONE_CHANGED = 'microphone-changed',
  VOLUME_INDICATOR = 'volume-indicator',

  // Network events
  NETWORK_QUALITY = 'network-quality',
  BANDWIDTH_LOW = 'bandwidth-low',
}

/**
 * Video Quality Presets
 */
export const VideoQualityPresets = {
  low: {
    width: 320,
    height: 240,
    frameRate: 15,
    bitrate: 200,
  },
  medium: {
    width: 640,
    height: 480,
    frameRate: 24,
    bitrate: 500,
  },
  high: {
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 1000,
  },
  hd: {
    width: 1920,
    height: 1080,
    frameRate: 30,
    bitrate: 2000,
  },
};
