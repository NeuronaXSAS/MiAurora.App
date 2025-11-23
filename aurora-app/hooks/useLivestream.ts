/**
 * useLivestream Hook
 * 
 * React hook that wraps the StreamingProvider abstraction.
 * Provides a clean API for livestreaming without exposing provider details.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AgoraProvider } from '@/lib/agora-provider';
import { StreamingProvider, StreamingEvent, StreamStats } from '@/lib/streaming-provider';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

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

export function useLivestream(options?: UseLivestreamOptions) {
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
  const initialize = useCallback(async (opts: UseLivestreamOptions) => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Get Agora token
      const tokenData = await generateToken({
        channelName: opts.channelName,
        userId: opts.userId,
        role: opts.role,
      });

      // Create provider instance
      const newProvider = new AgoraProvider();

      // Set up event listeners
      newProvider.on(StreamingEvent.CONNECTED, () => {
        setState(prev => ({ ...prev, isConnected: true }));
      });

      newProvider.on(StreamingEvent.DISCONNECTED, () => {
        setState(prev => ({ ...prev, isConnected: false, isStreaming: false }));
      });

      newProvider.on(StreamingEvent.STREAM_STARTED, () => {
        setState(prev => ({ ...prev, isStreaming: true }));
      });

      newProvider.on(StreamingEvent.STREAM_STOPPED, () => {
        setState(prev => ({ ...prev, isStreaming: false }));
      });

      newProvider.on(StreamingEvent.STREAM_ERROR, (error: Error) => {
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
          // Play remote video in container
          const container = document.getElementById(`remote-video-${user.uid}`);
          if (container) {
            (newProvider as AgoraProvider).playRemoteVideo(track, container);
          }
        }
      });

      // Initialize provider
      await newProvider.initialize({
        channelName: opts.channelName,
        token: tokenData.token,
        appId: tokenData.appId,
        uid: opts.userId,
      });

      setProvider(newProvider);
      return newProvider;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      opts.onError?.(err);
      throw error;
    }
  }, [generateToken]);

  // Start broadcasting (host)
  const startBroadcast = useCallback(async (options?: {
    video?: boolean;
    audio?: boolean;
  }) => {
    if (!provider) throw new Error('Provider not initialized');

    try {
      await provider.startBroadcast(options);

      // Play local video
      if (localVideoRef.current) {
        (provider as AgoraProvider).playLocalVideo(localVideoRef.current);
      }
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider]);

  // Stop broadcasting
  const stopBroadcast = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.stopBroadcast();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider]);

  // Join as viewer
  const joinAsViewer = useCallback(async () => {
    if (!provider) throw new Error('Provider not initialized');

    try {
      await provider.joinAsViewer();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider]);

  // Leave stream
  const leave = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.leave();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!provider) return;

    try {
      const newState = !state.isCameraEnabled;
      await provider.toggleCamera(newState);
      setState(prev => ({ ...prev, isCameraEnabled: newState }));
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider, state.isCameraEnabled]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!provider) return;

    try {
      const newState = !state.isMicrophoneEnabled;
      await provider.toggleMicrophone(newState);
      setState(prev => ({ ...prev, isMicrophoneEnabled: newState }));
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider, state.isMicrophoneEnabled]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.switchCamera();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, error: err.message }));
      throw error;
    }
  }, [provider]);

  // Get devices
  const getDevices = useCallback(async () => {
    if (!provider) return { cameras: [], microphones: [] };
    return await provider.getDevices();
  }, [provider]);

  // Get stats
  const getStats = useCallback(async () => {
    if (!provider) return null;
    const stats = await provider.getStats();
    setState(prev => ({ ...prev, stats }));
    return stats;
  }, [provider]);

  // Set video quality
  const setVideoQuality = useCallback(async (quality: 'low' | 'medium' | 'high') => {
    if (!provider) return;
    await provider.setVideoQuality(quality);
  }, [provider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (provider) {
        provider.destroy();
      }
    };
  }, [provider]);

  // Auto-initialize if options provided
  useEffect(() => {
    if (options && !provider) {
      initialize(options);
    }
  }, [options, provider, initialize]);

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
    getDevices,
    getStats,
    setVideoQuality,

    // Refs for video containers
    localVideoRef,
    remoteVideosRef,
  };
}
