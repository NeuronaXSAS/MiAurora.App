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
      alert("Por favor ingresa un título para tu transmisión");
      return;
    }

    try {
      setPermissionError(null);

      // Create livestream record (without safety mode to avoid moderation issues)
      const result = await createLivestream({
        hostId: userId,
        title: title.trim(),
        safetyMode: false, // Disabled for now to ensure functionality
        isEmergency,
      });

      // Check if Agora is not configured
      if (!result.livestreamId) {
        setPermissionError('Aurora Live estará disponible pronto. Estamos trabajando en esta función. 🚀');
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
            setPermissionError('Permiso de cámara/micrófono denegado. Habilita los permisos en tu navegador.');
          } else if (err.message.includes('not_configured') || err.message.includes('coming soon')) {
            setPermissionError('Aurora Live estará disponible pronto. 🚀');
          }
        },
      });

      setStage('preview');
    } catch (error) {
      console.error('Failed to create livestream:', error);
      const err = error as Error;
      if (err.message.includes('permission') || err.message.includes('NotAllowedError')) {
        setPermissionError('Permiso de cámara/micrófono denegado. Habilita los permisos e intenta de nuevo.');
      } else if (err.message.includes('not_configured') || err.message.includes('AGORA')) {
        setPermissionError('Aurora Live estará disponible pronto. Estamos trabajando en esta función. 🚀');
      } else {
        setPermissionError('Aurora Live estará disponible pronto. 🚀');
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">Go Live</h1>
            <p className="text-[var(--muted-foreground)]">Share your experience with the community</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-[var(--foreground)]">Stream Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Evening Safety Walk in Downtown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="mt-1 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{title.length}/100</p>
            </div>

            <div>
              <Label htmlFor="category" className="text-[var(--foreground)]">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  <SelectItem value="safety-walk">🚶 Safety Walk</SelectItem>
                  <SelectItem value="commute">🚇 Commute</SelectItem>
                  <SelectItem value="qa">💬 Q&A</SelectItem>
                  <SelectItem value="just-chatting">🗣️ Just Chatting</SelectItem>
                  <SelectItem value="emergency">🚨 Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--color-aurora-lavender)]/20 rounded-xl border border-[var(--color-aurora-lavender)]/30">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                <div>
                  <p className="font-medium text-sm text-[var(--foreground)]">Safety Mode</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Enable emergency alerts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={safetyMode}
                onChange={(e) => setSafetyMode(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-aurora-purple)]"
              />
            </div>

            {permissionError && (
              <div className="p-4 bg-[var(--color-aurora-yellow)]/20 border border-[var(--color-aurora-yellow)]/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-yellow)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">Coming Soon</p>
                    <p className="text-[var(--muted-foreground)] text-xs mt-1">{permissionError}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGoLive}
              className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Continue to Preview
            </Button>

            <Button
              onClick={() => router.push('/live')}
              variant="outline"
              className="w-full border-[var(--border)]"
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
      <div className="min-h-screen bg-[var(--color-aurora-violet)] flex flex-col">
        {/* Video Preview */}
        <div className="flex-1 relative">
          <div
            ref={localVideoRef}
            className="w-full h-full bg-[var(--color-aurora-violet)]"
            style={{ minHeight: '400px' }}
          />

          {!isCameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-aurora-violet)]">
              <div className="text-center text-white">
                <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Camera is off</p>
              </div>
            </div>
          )}

          {/* Preview Overlay */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4">
              <h2 className="text-white font-bold text-lg mb-1">{title}</h2>
              <p className="text-white/70 text-sm">Preview Mode - Not Live Yet</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[var(--card)] border-t border-[var(--border)] p-6 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleCamera}
              variant={isCameraEnabled ? "default" : "destructive"}
              size="lg"
              className={`rounded-full w-16 h-16 ${isCameraEnabled ? 'bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]' : 'bg-[var(--color-aurora-salmon)]'}`}
            >
              {isCameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={toggleMicrophone}
              variant={isMicrophoneEnabled ? "default" : "destructive"}
              size="lg"
              className={`rounded-full w-16 h-16 ${isMicrophoneEnabled ? 'bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]' : 'bg-[var(--color-aurora-salmon)]'}`}
            >
              {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            <Button
              onClick={switchCamera}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 border-[var(--border)]"
            >
              <Repeat className="w-6 h-6" />
            </Button>
          </div>

          <Button
            onClick={handleStartBroadcast}
            className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:from-[var(--color-aurora-violet)] hover:to-[var(--color-aurora-purple)] text-white min-h-[48px]"
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
            className="w-full border-[var(--border)] min-h-[48px]"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Live Stage
  return (
    <div className="min-h-screen bg-[var(--color-aurora-violet)] flex flex-col">
      {/* Video Stream */}
      <div className="flex-1 relative">
        <div
          ref={localVideoRef}
          className="w-full h-full bg-[var(--color-aurora-violet)]"
          style={{ minHeight: '400px' }}
        />

        {/* Live Indicator */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--color-aurora-pink)] px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
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

        {/* Emergency Button - Uses Aurora Orange ONLY for emergency */}
        <div className="absolute top-20 right-4 z-10">
          <Button
            onClick={handleEmergency}
            className="bg-[var(--color-aurora-orange)] hover:bg-[var(--color-aurora-orange)]/90 rounded-full w-14 h-14 shadow-2xl animate-pulse min-w-[56px] min-h-[56px]"
            size="icon"
          >
            <Shield className="w-6 h-6 text-white" />
          </Button>
        </div>

        {/* Stats Overlay */}
        {stats && (
          <div className="absolute bottom-20 left-4 bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white text-xs">
            <p>Quality: {stats.resolution.width}x{stats.resolution.height}</p>
            <p>FPS: {stats.fps}</p>
            <p>Bitrate: {Math.round(stats.bitrate / 1000)}kbps</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[var(--card)] border-t border-[var(--border)] p-6 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleCamera}
            variant={isCameraEnabled ? "default" : "destructive"}
            size="lg"
            className={`rounded-full w-16 h-16 ${isCameraEnabled ? 'bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]' : 'bg-[var(--color-aurora-salmon)]'}`}
          >
            {isCameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={toggleMicrophone}
            variant={isMicrophoneEnabled ? "default" : "destructive"}
            size="lg"
            className={`rounded-full w-16 h-16 ${isMicrophoneEnabled ? 'bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]' : 'bg-[var(--color-aurora-salmon)]'}`}
          >
            {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={switchCamera}
            variant="outline"
            size="lg"
            className="rounded-full w-16 h-16 border-[var(--border)]"
          >
            <Repeat className="w-6 h-6" />
          </Button>
        </div>

        <Button
          onClick={handleEndStream}
          className="w-full bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90 text-white min-h-[48px]"
          size="lg"
        >
          <X className="w-5 h-5 mr-2" />
          End Stream
        </Button>
      </div>
    </div>
  );
}
