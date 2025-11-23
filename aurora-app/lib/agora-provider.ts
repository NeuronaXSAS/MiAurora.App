/**
 * Agora Streaming Provider
 * 
 * Implementation of StreamingProvider using Agora RTC SDK.
 * Wraps the vanilla JS SDK for use in React applications.
 */

import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng';

import {
  StreamingProvider,
  StreamConfig,
  StreamStats,
  StreamingEvent,
  VideoQualityPresets,
} from './streaming-provider';

import { CONFIG } from './config';

export class AgoraProvider implements StreamingProvider {
  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private config: StreamConfig | null = null;
  private isHost: boolean = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor() {
    // Enable Agora SDK logging in development
    if (CONFIG.nodeEnv === 'development') {
      AgoraRTC.setLogLevel(1); // INFO level
    }
  }

  async initialize(config: StreamConfig): Promise<void> {
    this.config = config;

    // Create Agora client
    this.client = AgoraRTC.createClient({
      mode: 'live', // Live streaming mode
      codec: 'vp8', // VP8 codec for better compatibility
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    // User joined
    this.client.on('user-joined', (user) => {
      this.emit(StreamingEvent.USER_JOINED, user);
    });

    // User left
    this.client.on('user-left', (user, reason) => {
      this.emit(StreamingEvent.USER_LEFT, user, reason);
    });

    // User published
    this.client.on('user-published', async (user, mediaType) => {
      await this.client!.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack;
        this.emit(StreamingEvent.USER_PUBLISHED, user, mediaType, remoteVideoTrack);
      }
      
      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        remoteAudioTrack?.play();
      }
    });

    // User unpublished
    this.client.on('user-unpublished', (user, mediaType) => {
      this.emit(StreamingEvent.USER_UNPUBLISHED, user, mediaType);
    });

    // Connection state changed
    this.client.on('connection-state-change', (curState, prevState, reason) => {
      if (curState === 'CONNECTED') {
        this.emit(StreamingEvent.CONNECTED);
      } else if (curState === 'DISCONNECTED') {
        this.emit(StreamingEvent.DISCONNECTED, reason);
      } else if (curState === 'RECONNECTING') {
        this.emit(StreamingEvent.RECONNECTING);
      }
    });

    // Network quality
    this.client.on('network-quality', (stats) => {
      this.emit(StreamingEvent.NETWORK_QUALITY, stats);
    });

    // Exception
    this.client.on('exception', (event) => {
      console.error('Agora exception:', event);
      this.emit(StreamingEvent.STREAM_ERROR, event);
    });
  }

  async startBroadcast(options?: {
    video?: boolean;
    audio?: boolean;
    cameraId?: string;
    microphoneId?: string;
  }): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Client not initialized');
    }

    this.isHost = true;

    // Set client role to host
    await this.client.setClientRole('host');

    // Join the channel
    await this.client.join(
      this.config.appId,
      this.config.channelName,
      this.config.token,
      this.config.uid
    );

    // Create local tracks
    if (options?.video !== false) {
      this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: options?.cameraId,
        encoderConfig: VideoQualityPresets.high,
      });
    }

    if (options?.audio !== false) {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: options?.microphoneId,
        encoderConfig: 'high_quality_stereo',
      });
    }

    // Publish tracks
    const tracks = [];
    if (this.localVideoTrack) tracks.push(this.localVideoTrack);
    if (this.localAudioTrack) tracks.push(this.localAudioTrack);

    if (tracks.length > 0) {
      await this.client.publish(tracks);
    }

    this.emit(StreamingEvent.STREAM_STARTED);
  }

  async stopBroadcast(): Promise<void> {
    if (!this.client) return;

    // Unpublish tracks
    if (this.localVideoTrack || this.localAudioTrack) {
      await this.client.unpublish();
    }

    // Close tracks
    this.localVideoTrack?.close();
    this.localAudioTrack?.close();

    this.localVideoTrack = null;
    this.localAudioTrack = null;

    this.emit(StreamingEvent.STREAM_STOPPED);
  }

  async joinAsViewer(): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Client not initialized');
    }

    this.isHost = false;

    // Set client role to audience
    await this.client.setClientRole('audience');

    // Join the channel
    await this.client.join(
      this.config.appId,
      this.config.channelName,
      this.config.token,
      this.config.uid
    );

    this.emit(StreamingEvent.CONNECTED);
  }

  async leave(): Promise<void> {
    if (!this.client) return;

    // Stop broadcast if host
    if (this.isHost) {
      await this.stopBroadcast();
    }

    // Leave channel
    await this.client.leave();

    this.emit(StreamingEvent.DISCONNECTED);
  }

  async toggleCamera(enabled: boolean): Promise<void> {
    if (!this.localVideoTrack) return;

    await this.localVideoTrack.setEnabled(enabled);
    this.emit(StreamingEvent.CAMERA_CHANGED, enabled);
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    if (!this.localAudioTrack) return;

    await this.localAudioTrack.setEnabled(enabled);
    this.emit(StreamingEvent.MICROPHONE_CHANGED, enabled);
  }

  async switchCamera(): Promise<void> {
    if (!this.localVideoTrack) return;

    const devices = await AgoraRTC.getCameras();
    if (devices.length <= 1) return;

    const currentDevice = this.localVideoTrack.getTrackLabel();
    const nextDevice = devices.find((d) => d.label !== currentDevice);

    if (nextDevice) {
      await this.localVideoTrack.setDevice(nextDevice.deviceId);
      this.emit(StreamingEvent.CAMERA_CHANGED, nextDevice);
    }
  }

  async getDevices(): Promise<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
  }> {
    const cameras = await AgoraRTC.getCameras();
    const microphones = await AgoraRTC.getMicrophones();

    return { cameras, microphones };
  }

  async getStats(): Promise<StreamStats> {
    if (!this.client || !this.localVideoTrack) {
      return {
        bitrate: 0,
        fps: 0,
        resolution: { width: 0, height: 0 },
        latency: 0,
      };
    }

    const stats = this.client.getRTCStats();
    const videoStats = this.localVideoTrack.getStats();

    return {
      bitrate: stats.SendBitrate || 0,
      fps: videoStats.sendFrameRate || 0,
      resolution: {
        width: videoStats.sendResolutionWidth || 0,
        height: videoStats.sendResolutionHeight || 0,
      },
      latency: stats.RTT || 0,
    };
  }

  async setVideoQuality(quality: 'low' | 'medium' | 'high'): Promise<void> {
    if (!this.localVideoTrack) return;

    const preset = VideoQualityPresets[quality];
    await this.localVideoTrack.setEncoderConfiguration(preset);
  }

  getLocalVideoElement(): HTMLElement | null {
    return this.localVideoTrack?.getMediaStreamTrack().enabled
      ? document.getElementById('local-video')
      : null;
  }

  getRemoteVideoElements(): HTMLElement[] {
    // Remote video elements are managed by the UI component
    return [];
  }

  /**
   * Play local video in a container
   */
  playLocalVideo(container: HTMLElement | string): void {
    if (!this.localVideoTrack) return;
    this.localVideoTrack.play(container);
  }

  /**
   * Play remote video in a container
   */
  playRemoteVideo(track: IRemoteVideoTrack, container: HTMLElement | string): void {
    track.play(container);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }

  async destroy(): Promise<void> {
    await this.leave();

    this.localVideoTrack?.close();
    this.localAudioTrack?.close();

    this.localVideoTrack = null;
    this.localAudioTrack = null;
    this.client = null;
    this.config = null;
    this.eventHandlers.clear();
  }
}
