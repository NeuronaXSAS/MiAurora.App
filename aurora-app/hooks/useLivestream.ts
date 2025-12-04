/**
 * useLivestream Hook
 * 
 * React hook that wraps the StreamingProvider abstraction.
 * Provides a clean API for livestreaming without exposing provider details.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgoraProvider } from '@/lib/agora-provider';
import { StreamingProvider, StreamingEvent, StreamStats } from '@/lib/streaming-provider';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface UseLivestreamOptions {
  channelName: string;
  userId: string;
  role: 'host' | 'audience';
  onError?: (error: Error) => void;
}

interface LivestreamState {
  isConnected: boolean;
  isStreaming: boolean;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  viewerCount: number;
  stats: StreamStats | null;
  error: string | null;
}

export function useLivestream(_options?: UseLivestreamOptions) {
  const [provider, setProvider] = useState<StreamingProvider | null>(null);
  const [state, setState] = useState<LivestreamState>({
    isConnected: false,
    isStreaming: false,
    isCameraEnabled: true,
    isMicrophoneEnabled: true,
    viewerCount: 0,
    stats: null,
    error: null,
  });

  const generateToken = useAction(api.actions.agora.generateAgoraToken);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize provider
  const initialize = useCallback(async (opts: UseLivestreamOptions): Promise<StreamingProvider> => {
    try {
      setState(prev => ({ ...prev, error: null }));

      console.log('Getting Agora token for channel:', opts.channelName);

      // Get Agora token
      const tokenData = await generateToken({
        channelName: opts.channelName,
        userId: opts.userId,
        role: opts.role,
      });

      // Validate token data
      if (!tokenData.success || !tokenData.appId) {
        const errorMsg = tokenData.message || 'Agora App ID not configured. Livestreaming is not available.';
        throw new Error(errorMsg);
      }

      console.log('Agora token received:', { 
        mode: tokenData.mode, 
        uid: tokenData.uid,
        hasToken: !!tokenData.token,
        appId: tokenData.appId?.substring(0, 8) + '...'
      });

      // Create provider instance
      const newProvider = new AgoraProvider();

      // Set up event listeners
      newProvider.on(StreamingEvent.CONNECTED, () => {
        console.log('Agora: Connected');
        setState(prev => ({ ...prev, isConnected: true }));
      });

      newProvider.on(StreamingEvent.DISCONNECTED, () => {
        console.log('Agora: Disconnected');
        setState(prev => ({ ...prev, isConnected: false, isStreaming: false }));
      });

      newProvider.on(StreamingEvent.STREAM_STARTED, () => {
        console.log('Agora: Stream started');
        setState(prev => ({ ...prev, isStreaming: true }));
      });

      newProvider.on(StreamingEvent.STREAM_STOPPED, () => {
        console.log('Agora: Stream stopped');
        setState(prev => ({ ...prev, isStreaming: false }));
      });

      newProvider.on(StreamingEvent.STREAM_ERROR, (error: Error) => {
        console.error('Agora: Stream error', error);
        setState(prev => ({ ...prev, error: error.message }));
        opts.onError?.(error);
      });

      newProvider.on(StreamingEvent.USER_JOINED, () => {
        setState(prev => ({ ...prev, viewerCount: prev.viewerCount + 1 }));
      });

      newProvider.on(StreamingEvent.USER_LEFT, () => {
        setState(prev => ({ ...prev, viewerCount: Math.max(0, prev.viewerCount - 1) }));
      });

      newProvider.on(StreamingEvent.USER_PUBLISHED, (user: any, mediaType: string, track: any) => {
        if (mediaType === 'video' && track) {
          console.log('Agora: Remote user published video, uid:', user.uid);
          // Try multiple container ID patterns
          const containerIds = [
            `remote-video-${user.uid}`,
            `remote-video-host`,
            'remote-video-container'
          ];
          
          let container: HTMLElement | null = null;
          for (const id of containerIds) {
            container = document.getElementById(id);
            if (container) {
              console.log('Agora: Found container with id:', id);
              break;
            }
          }
          
          if (container) {
            console.log('Agora: Playing remote video in container');
            (newProvider as AgoraProvider).playRemoteVideo(track, container);
          } else {
            console.warn('Agora: No container found for remote video. Tried:', containerIds);
          }
        }
      });

      console.log('Initializing Agora provider...');

      // Initialize provider with numeric UID from token generation
      await newProvider.initialize({
        channelName: opts.channelName,
        token: tokenData.token,
        appId: tokenData.appId!,
        uid: String(tokenData.uid), // Use the numeric UID generated by the server
      });

      console.log('Agora provider initialized successfully');

      // Update state and ref SYNCHRONOUSLY before returning
      // This ensures providerRef is available immediately for subsequent calls
      providerRef.current = newProvider;
      setProvider(newProvider);
      
      return newProvider;
    } catch (error) {
      const err = error as Error;
      console.error('Failed to initialize Agora:', err);
      setState(prev => ({ ...prev, error: err.message }));
      opts.onError?.(err);
      throw error;
    }
  }, [generateToken]);

  // Reference to provider for direct access (avoids React state timing issues)
  const providerRef = useRef<StreamingProvider | null>(null);

  // Start broadcasting (host)
  const startBroadcast = useCallback(async (options?: {
    video?: boolean;
    audio?: boolean;
  }) => {
    // Use providerRef for immediate access (avoids React state timing issues)
    const currentProvider = providerRef.current;
    if (!currentProvider) throw new Error('Provider not initialized');

    try {
      await currentProvider.startBroadcast(options);
      console.log('Broadcast started, local video track should be ready');
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Play local video in a container element
  const playLocalVideo = useCallback((container: HTMLElement) => {
    const currentProvider = providerRef.current;
    if (!currentProvider) {
      console.warn('useLivestream: Provider not initialized, cannot play local video');
      return;
    }
    
    try {
      const agoraProvider = currentProvider as AgoraProvider;
      
      // Check if local video track exists
      if (!agoraProvider.hasLocalVideoTrack()) {
        console.warn('useLivestream: Local video track not ready yet');
        return;
      }
      
      console.log('useLivestream: Playing local video in container');
      agoraProvider.playLocalVideo(container);
    } catch (error) {
      console.error('useLivestream: Error playing local video:', error);
    }
  }, []);

  // Get local video track directly for advanced use cases
  const getLocalVideoTrack = useCallback(() => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return null;
    
    const agoraProvider = currentProvider as AgoraProvider;
    return agoraProvider.getLocalVideoTrack?.() || null;
  }, []);

  // Stop broadcasting
  const stopBroadcast = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      await currentProvider.stopBroadcast();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Join as viewer
  const joinAsViewer = useCallback(async () => {
    // Use providerRef for immediate access (avoids React state timing issues)
    const currentProvider = providerRef.current;
    if (!currentProvider) throw new Error('Provider not initialized');

    try {
      await currentProvider.joinAsViewer();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Leave stream
  const leave = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      await currentProvider.leave();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      setState(prev => {
        const newState = !prev.isCameraEnabled;
        currentProvider.toggleCamera(newState);
        return { ...prev, isCameraEnabled: newState };
      });
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      setState(prev => {
        const newState = !prev.isMicrophoneEnabled;
        currentProvider.toggleMicrophone(newState);
        return { ...prev, isMicrophoneEnabled: newState };
      });
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Switch camera (cycle through available cameras)
  const switchCamera = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      await currentProvider.switchCamera();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Set specific camera by device ID
  const setCamera = useCallback(async (deviceId: string) => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      const agoraProvider = currentProvider as AgoraProvider;
      await agoraProvider.setCamera(deviceId);
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Set specific microphone by device ID
  const setMicrophone = useCallback(async (deviceId: string) => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;

    try {
      const agoraProvider = currentProvider as AgoraProvider;
      await agoraProvider.setMicrophone(deviceId);
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, []);

  // Get devices
  const getDevices = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return { cameras: [], microphones: [] };
    return await currentProvider.getDevices();
  }, []);

  // Get stats
  const getStats = useCallback(async () => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return null;
    const stats = await currentProvider.getStats();
    setState(prev => ({ ...prev, stats }));
    return stats;
  }, []);

  // Set video quality
  const setVideoQuality = useCallback(async (quality: 'low' | 'medium' | 'high') => {
    const currentProvider = providerRef.current;
    if (!currentProvider) return;
    await currentProvider.setVideoQuality(quality);
  }, []);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cleanup provider on unmount
      const currentProvider = providerRef.current;
      if (currentProvider) {
        console.log('useLivestream: Cleaning up provider on unmount');
        currentProvider.destroy().catch(err => {
          console.warn('useLivestream: Error during cleanup:', err);
        });
      }
    };
  }, []);

  // Separate effect for provider cleanup when provider changes
  useEffect(() => {
    return () => {
      // This runs when provider changes (not on unmount)
      // Don't destroy here as it might be intentional
    };
  }, [provider]);

  return {
    // State
    ...state,
    provider,

    // Actions
    initialize,
    startBroadcast,
    stopBroadcast,
    joinAsViewer,
    leave,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    setCamera,
    setMicrophone,
    getDevices,
    getStats,
    setVideoQuality,
    playLocalVideo,
    getLocalVideoTrack,

    // Refs for video containers
    localVideoRef,
    remoteVideosRef,
  };
}
