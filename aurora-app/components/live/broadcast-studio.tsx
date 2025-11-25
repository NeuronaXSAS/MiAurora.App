"use client";

import { useState, useEffect } from "react";
import { useLivestream } from "@/hooks/useLivestream";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertTriangle,
  Users,
  Clock,
  Repeat,
  X,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

interface BroadcastStudioProps {
  userId: Id<"users">;
}

type BroadcastStage = 'setup' | 'preview' | 'live';

export function BroadcastStudio({ userId }: BroadcastStudioProps) {
  const router = useRouter();
  const [stage, setStage] = useState<BroadcastStage>('setup');
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("safety-walk");
  const [safetyMode, setSafetyMode] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [livestreamId, setLivestreamId] = useState<Id<"livestreams"> | null>(null);
  const [channelName, setChannelName] = useState("");
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const createLivestream = useMutation(api.livestreams.createLivestream);
  const endLivestream = useMutation(api.livestreams.endLivestream);
  const triggerEmergency = useMutation(api.emergency.triggerEmergencyAlert);

  const {
    isConnected,
    isStreaming,
    isCameraEnabled,
    isMicrophoneEnabled,
    viewerCount,
    stats,
    error,
    initialize,
    startBroadcast,
    stopBroadcast,
    leave,
    toggleCamera,
    toggleMicrophone,
    switchCamera,
    localVideoRef,
  } = useLivestream();

  // Duration timer
  useEffect(() => {
    if (stage === 'live') {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle go live
  const handleGoLive = async () => {
    if (!title.trim()) {
      alert("Please enter a stream title");
      return;
    }

    try {
      setPermissionError(null);

      // Create livestream record
      const result = await createLivestream({
        hostId: userId,
        title: title.trim(),
        safetyMode,
        isEmergency,
      });

      // Check if Agora is not configured
      if (!result.livestreamId) {
        setPermissionError('Aurora Live is coming soon! Livestreaming will be available in a future update. 🚀');
        return;
      }

      setLivestreamId(result.livestreamId);
      setChannelName(result.channelName);

      // Initialize streaming provider
      await initialize({
        channelName: result.channelName,
        userId: userId,
        role: 'host',
        onError: (err) => {
          console.error('Streaming error:', err);
          if (err.message.includes('permission')) {
            setPermissionError('Camera/microphone access denied. Please enable permissions in your browser settings.');
          } else if (err.message.includes('not_configured') || err.message.includes('coming soon')) {
            setPermissionError('Aurora Live is coming soon! Livestreaming will be available in a future update. 🚀');
          }
        },
      });

      setStage('preview');
    } catch (error) {
      console.error('Failed to create livestream:', error);
      const err = error as Error;
      if (err.message.includes('permission') || err.message.includes('NotAllowedError')) {
        setPermissionError('Camera/microphone access denied. Please enable permissions and try again.');
      } else if (err.message.includes('not_configured') || err.message.includes('AGORA')) {
        setPermissionError('Aurora Live is coming soon! Livestreaming will be available in a future update. 🚀');
      } else {
        setPermissionError('Aurora Live is coming soon! We\'re working on bringing you this feature. 🚀');
      }
    }
  };

  // Handle start broadcasting
  const handleStartBroadcast = async () => {
    try {
      await startBroadcast({
        video: isCameraEnabled,
        audio: isMicrophoneEnabled,
      });
      setStage('live');
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      alert('Failed to start broadcast: ' + (error as Error).message);
    }
  };

  // Handle end stream
  const handleEndStream = async () => {
    if (!confirm('Are you sure you want to end this livestream?')) return;

    try {
      await stopBroadcast();
      await leave();

      if (livestreamId) {
        await endLivestream({
          livestreamId,
          hostId: userId,
        });
      }

      router.push('/live');
    } catch (error) {
      console.error('Failed to end stream:', error);
      alert('Failed to end stream: ' + (error as Error).message);
    }
  };

  // Handle emergency
  const handleEmergency = async () => {
    if (!confirm('This will trigger an emergency alert to your contacts and nearby users. Continue?')) return;

    try {
      // Attempt to get user location with fallback
      const getLocation = (): Promise<{ lat: number; lng: number; accuracy?: number }> => {
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                });
              },
              (error) => {
                console.warn('Geolocation failed:', error);
                // Fallback to unknown location
                resolve({ lat: 0, lng: 0, accuracy: 0 });
              },
              { timeout: 5000, maximumAge: 0 }
            );
          } else {
            // Geolocation not supported - use fallback
            resolve({ lat: 0, lng: 0, accuracy: 0 });
          }
        });
      };

      const location = await getLocation();

      await triggerEmergency({
        location: {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          address: location.lat === 0 ? 'Location unavailable' : undefined,
        },
        alertType: 'manual',
        message: `Emergency during livestream: ${title}`,
      });

      alert('Emergency alert sent! Help is on the way.');
    } catch (error) {
      console.error('Failed to trigger emergency:', error);
      alert('Failed to send emergency alert. Please try again.');
    }
  };

  // Setup Stage
  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Go Live</h1>
            <p className="text-gray-600">Share your experience with the community</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Stream Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Evening Safety Walk in Downtown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety-walk">🚶 Safety Walk</SelectItem>
                  <SelectItem value="commute">🚇 Commute</SelectItem>
                  <SelectItem value="qa">💬 Q&A</SelectItem>
                  <SelectItem value="just-chatting">🗣️ Just Chatting</SelectItem>
                  <SelectItem value="emergency">🚨 Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">Safety Mode</p>
                  <p className="text-xs text-gray-600">AI content moderation</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={safetyMode}
                onChange={(e) => setSafetyMode(e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            {permissionError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 text-sm">Permission Required</p>
                    <p className="text-red-700 text-xs mt-1">{permissionError}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGoLive}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Continue to Preview
            </Button>

            <Button
              onClick={() => router.push('/live')}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Preview Stage
  if (stage === 'preview') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Video Preview */}
        <div className="flex-1 relative">
          <div
            ref={localVideoRef}
            className="w-full h-full bg-gray-900"
            style={{ minHeight: '400px' }}
          />

          {!isCameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Camera is off</p>
              </div>
            </div>
          )}

          {/* Preview Overlay */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
              <h2 className="text-white font-bold text-lg mb-1">{title}</h2>
              <p className="text-white/70 text-sm">Preview Mode - Not Live Yet</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 p-6 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleCamera}
              variant={isCameraEnabled ? "default" : "destructive"}
              size="lg"
              className="rounded-full w-16 h-16"
            >
              {isCameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={toggleMicrophone}
              variant={isMicrophoneEnabled ? "default" : "destructive"}
              size="lg"
              className="rounded-full w-16 h-16"
            >
              {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={switchCamera}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16"
            >
              <Repeat className="w-6 h-6" />
            </Button>
          </div>

          <Button
            onClick={handleStartBroadcast}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
            disabled={!isConnected}
          >
            {isConnected ? 'Go Live Now' : 'Connecting...'}
          </Button>

          <Button
            onClick={() => {
              leave();
              router.push('/live');
            }}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Live Stage
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Video Stream */}
      <div className="flex-1 relative">
        <div
          ref={localVideoRef}
          className="w-full h-full bg-gray-900"
          style={{ minHeight: '400px' }}
        />

        {/* Live Indicator */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                <div className="w-3 h-3 bg-white rounded-full" />
                <span className="text-white font-bold text-sm">LIVE</span>
              </div>
              <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">{viewerCount}</span>
              </div>
              <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Button */}
        <div className="absolute top-20 right-4 z-10">
          <Button
            onClick={handleEmergency}
            className="bg-red-600 hover:bg-red-700 rounded-full w-14 h-14 shadow-2xl animate-pulse"
            size="icon"
          >
            <Shield className="w-6 h-6" />
          </Button>
        </div>

        {/* Stats Overlay */}
        {stats && (
          <div className="absolute bottom-20 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
            <p>Quality: {stats.resolution.width}x{stats.resolution.height}</p>
            <p>FPS: {stats.fps}</p>
            <p>Bitrate: {Math.round(stats.bitrate / 1000)}kbps</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleCamera}
            variant={isCameraEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-16 h-16"
          >
            {isCameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={toggleMicrophone}
            variant={isMicrophoneEnabled ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-16 h-16"
          >
            {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={switchCamera}
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16"
          >
            <Repeat className="w-6 h-6" />
          </Button>
        </div>

        <Button
          onClick={handleEndStream}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          <X className="w-5 h-5 mr-2" />
          End Stream
        </Button>
      </div>
    </div>
  );
}
