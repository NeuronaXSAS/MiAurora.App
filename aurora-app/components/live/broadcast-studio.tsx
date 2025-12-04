"use client";

import { useState, useEffect, useRef } from "react";
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
    setCamera,
    getDevices,
    playLocalVideo,
  } = useLivestream();

  // Available devices state
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");

  // Local preview stream (before going live)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  
  // State for broadcast status
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
  
  // State for live camera selection
  const [showCameraSelector, setShowCameraSelector] = useState(false);

  // Local ref for Agora video
  const localVideoRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Load devices when going live
  useEffect(() => {
    if (stage === 'live' && isStreaming) {
      getDevices().then(({ cameras: cams, microphones: mics }) => {
        setCameras(cams);
        setMicrophones(mics);
      });
    }
  }, [stage, isStreaming, getDevices]);

  // Duration timer
  useEffect(() => {
    if (stage === 'live') {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // Play local video when entering live stage - with retry logic
  useEffect(() => {
    if (stage === 'live' && localVideoRef.current && isStreaming) {
      let attempts = 0;
      const maxAttempts = 15;
      let timeoutId: NodeJS.Timeout | null = null;
      
      const tryPlayVideo = () => {
        attempts++;
        console.log(`Agora: Playing local video attempt ${attempts}/${maxAttempts}...`);
        
        if (localVideoRef.current) {
          // Ensure container has explicit dimensions before playing
          const container = localVideoRef.current;
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.minHeight = '400px';
          
          console.log('Agora: Container ready, dimensions:', container.offsetWidth, 'x', container.offsetHeight);
          playLocalVideo(container);
        }
        
        // Retry if video container is still empty after a delay
        if (attempts < maxAttempts) {
          timeoutId = setTimeout(() => {
            if (localVideoRef.current) {
              // Check if video element was added by Agora
              const hasVideo = localVideoRef.current.querySelector('video') !== null;
              const hasCanvas = localVideoRef.current.querySelector('canvas') !== null;
              
              if (!hasVideo && !hasCanvas) {
                console.log('Agora: No video/canvas element found, retrying...');
                tryPlayVideo();
              } else {
                console.log('Agora: Video element found, playback successful!');
              }
            }
          }, 500);
        }
      };
      
      // Initial delay to ensure Agora tracks are fully ready
      const initialTimer = setTimeout(tryPlayVideo, 300);
      
      return () => {
        clearTimeout(initialTimer);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [stage, isStreaming, playLocalVideo]);

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

  // Start camera preview without Agora
  const startCameraPreview = async (cameraId?: string) => {
    try {
      const videoConstraints: MediaTrackConstraints = cameraId 
        ? { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });
      setPreviewStream(stream);
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      
      // Get available devices after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');
      setCameras(videoDevices);
      setMicrophones(audioDevices);
      
      // Set current device as selected
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setSelectedCamera(settings.deviceId || '');
      }
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        setSelectedMicrophone(settings.deviceId || '');
      }
      
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      return false;
    }
  };

  // Switch preview camera
  const switchPreviewCamera = async (deviceId: string) => {
    if (!previewStream) return;
    
    // Stop current video track
    previewStream.getVideoTracks().forEach(track => track.stop());
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false, // Keep existing audio
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      const audioTrack = previewStream.getAudioTracks()[0];
      
      // Create combined stream
      const combinedStream = new MediaStream([newVideoTrack, audioTrack]);
      setPreviewStream(combinedStream);
      setSelectedCamera(deviceId);
      
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = combinedStream;
      }
    } catch (err) {
      console.error('Failed to switch camera:', err);
      // Restart with original camera
      startCameraPreview();
    }
  };

  // Stop camera preview
  const stopCameraPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
  };

  // Handle go live - just start camera preview first
  const handleGoLive = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your stream");
      return;
    }

    try {
      setPermissionError(null);

      // First, request camera/mic permissions and start preview
      const cameraOk = await startCameraPreview();
      if (!cameraOk) {
        setPermissionError('Camera/microphone permission denied. Please enable permissions in your browser settings.');
        return;
      }

      // Move to preview stage - don't create livestream yet
      setStage('preview');
    } catch (error) {
      console.error('Failed to start preview:', error);
      stopCameraPreview();
      const err = error as Error;
      if (err.message.includes('permission') || err.message.includes('NotAllowedError')) {
        setPermissionError('Camera/microphone permission denied. Please enable permissions and try again.');
      } else {
        setPermissionError('Failed to access camera. Please check your device settings.');
      }
    }
  };

  // Handle start broadcasting with Agora
  const handleStartBroadcast = async () => {
    if (isStartingBroadcast) return;
    
    setIsStartingBroadcast(true);
    setBroadcastError(null);
    let createdLivestreamId: Id<"livestreams"> | null = null;
    
    try {
      // Create livestream record in database
      const result = await createLivestream({
        hostId: userId,
        title: title.trim(),
        safetyMode: false,
        isEmergency,
      });

      if (!result.livestreamId) {
        throw new Error('Failed to create livestream');
      }

      createdLivestreamId = result.livestreamId;
      setLivestreamId(result.livestreamId);
      setChannelName(result.channelName);

      console.log('Livestream created:', result.channelName);

      // Stop preview stream FIRST before initializing Agora
      // This releases the camera so Agora can use it
      stopCameraPreview();
      
      // Small delay to ensure camera is released
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Initializing Agora...');

      // Initialize Agora - this returns the provider
      const agoraProvider = await initialize({
        channelName: result.channelName,
        userId: userId,
        role: 'host',
        onError: (err) => {
          console.error('Agora streaming error:', err);
          setBroadcastError(err.message);
        },
      });

      console.log('Agora initialized, provider ready:', !!agoraProvider);

      // Wait a bit for provider to be fully ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Starting Agora broadcast...');

      // Start Agora broadcast - use the returned provider directly
      // Add retry logic for robustness
      let broadcastStarted = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!broadcastStarted && retries < maxRetries) {
        try {
          if (agoraProvider) {
            await agoraProvider.startBroadcast({
              video: true,
              audio: true,
            });
            broadcastStarted = true;
          } else {
            throw new Error('Provider not available');
          }
        } catch (broadcastError) {
          retries++;
          console.warn(`Broadcast attempt ${retries} failed:`, broadcastError);
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            throw broadcastError;
          }
        }
      }

      console.log('Broadcast started successfully!');
      
      // Move to live stage so the video container is mounted
      setStage('live');
      
      // Play local video after a short delay to ensure DOM is ready
      // The useEffect will also try, but this is a backup
      setTimeout(() => {
        if (localVideoRef.current && agoraProvider) {
          console.log('Playing local video from handleStartBroadcast...');
          (agoraProvider as any).playLocalVideo(localVideoRef.current);
        }
      }, 800);
      
      setIsStartingBroadcast(false);
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      const errorMsg = (error as Error).message || 'Unknown error';
      setBroadcastError(errorMsg);
      
      // Clean up if livestream was created
      if (createdLivestreamId) {
        try {
          await endLivestream({
            livestreamId: createdLivestreamId,
            hostId: userId,
          });
        } catch (cleanupError) {
          console.error('Failed to cleanup livestream:', cleanupError);
        }
      }
      
      setIsStartingBroadcast(false);
      
      // Show specific error message
      if (errorMsg.includes('not configured') || errorMsg.includes('App ID')) {
        alert('Livestreaming service is not configured. Please contact support.');
      } else if (errorMsg.includes('permission') || errorMsg.includes('NotAllowedError')) {
        alert('Camera/microphone permission denied. Please enable permissions and try again.');
      } else {
        alert(`Failed to start livestream: ${errorMsg}`);
      }
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

  // Preview Stage - Uses native video element for camera preview
  if (stage === 'preview') {
    return (
      <div className="min-h-screen bg-[var(--color-aurora-violet)] flex flex-col">
        {/* Video Preview - Native video element */}
        <div className="flex-1 relative">
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover bg-[var(--color-aurora-violet)]"
            style={{ minHeight: '400px', transform: 'scaleX(-1)' }}
          />

          {!previewStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-aurora-violet)]">
              <div className="text-center text-white">
                <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Camera is loading...</p>
              </div>
            </div>
          )}

          {/* Preview Overlay */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4">
              <h2 className="text-white font-bold text-lg mb-1">{title}</h2>
              <p className="text-white/70 text-sm">Preview Mode - Not Live Yet</p>
              {previewStream && (
                <p className="text-[var(--color-aurora-mint)] text-xs mt-1">✓ Camera ready</p>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[var(--card)] border-t border-[var(--border)] p-4 space-y-4">
          {/* Camera Selection */}
          {cameras.length > 1 && (
            <div>
              <Label className="text-[var(--foreground)] text-sm mb-2 block">Camera</Label>
              <Select value={selectedCamera} onValueChange={switchPreviewCamera}>
                <SelectTrigger className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => {
                if (previewStream) {
                  const videoTrack = previewStream.getVideoTracks()[0];
                  if (videoTrack) {
                    videoTrack.enabled = !videoTrack.enabled;
                  }
                }
              }}
              variant="default"
              size="lg"
              className="rounded-full w-16 h-16 min-w-[64px] min-h-[64px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
            >
              <Camera className="w-6 h-6" />
            </Button>

            <Button
              onClick={() => {
                if (previewStream) {
                  const audioTrack = previewStream.getAudioTracks()[0];
                  if (audioTrack) {
                    audioTrack.enabled = !audioTrack.enabled;
                  }
                }
              }}
              variant="default"
              size="lg"
              className="rounded-full w-16 h-16 min-w-[64px] min-h-[64px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
            >
              <Mic className="w-6 h-6" />
            </Button>

            {cameras.length > 1 && (
              <Button
                onClick={() => {
                  // Cycle to next camera
                  const currentIndex = cameras.findIndex(c => c.deviceId === selectedCamera);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  switchPreviewCamera(cameras[nextIndex].deviceId);
                }}
                variant="outline"
                size="lg"
                className="rounded-full w-16 h-16 min-w-[64px] min-h-[64px] border-[var(--border)]"
              >
                <Repeat className="w-6 h-6" />
              </Button>
            )}
          </div>

          {broadcastError && (
            <div className="p-3 bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)]/30 rounded-xl">
              <p className="text-[var(--color-aurora-salmon)] text-sm text-center">{broadcastError}</p>
            </div>
          )}

          <Button
            onClick={handleStartBroadcast}
            className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:from-[var(--color-aurora-violet)] hover:to-[var(--color-aurora-purple)] text-white min-h-[48px]"
            size="lg"
            disabled={!previewStream || isStartingBroadcast}
          >
            {isStartingBroadcast ? 'Starting broadcast...' : previewStream ? 'Go Live Now' : 'Starting camera...'}
          </Button>

          <Button
            onClick={() => {
              stopCameraPreview();
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

  // Handle camera change while live
  const handleLiveCameraChange = async (deviceId: string) => {
    try {
      await setCamera(deviceId);
      setSelectedCamera(deviceId);
      setShowCameraSelector(false);
    } catch (err) {
      console.error('Failed to switch camera:', err);
    }
  };

  // Live Stage - Agora streaming
  return (
    <div className="min-h-screen bg-[var(--color-aurora-violet)] flex flex-col">
      {/* Video Stream - Agora */}
      <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
        {/* Video container - Agora will inject video/canvas here */}
        <div
          ref={localVideoRef}
          id="local-video-container"
          className="absolute inset-0"
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: '400px',
            backgroundColor: '#3d0d73',
            overflow: 'hidden',
          }}
        />

        {/* Loading/Connecting overlay - shows while video is initializing */}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#3d0d73]/90 z-5">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm">Connecting to stream...</p>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-red-500 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
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
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-xl p-3 text-white text-xs z-10">
            <p>Quality: {stats.resolution.width}x{stats.resolution.height}</p>
            <p>FPS: {stats.fps}</p>
            <p>Bitrate: {Math.round(stats.bitrate / 1000)}kbps</p>
          </div>
        )}

        {/* Camera Selector Overlay */}
        {showCameraSelector && cameras.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm rounded-xl p-4 z-20 min-w-[200px]">
            <p className="text-white text-sm font-medium mb-2">Select Camera</p>
            <div className="space-y-2">
              {cameras.map((camera, index) => (
                <Button
                  key={camera.deviceId}
                  onClick={() => handleLiveCameraChange(camera.deviceId)}
                  variant={selectedCamera === camera.deviceId ? "default" : "outline"}
                  size="sm"
                  className={`w-full justify-start text-left text-xs ${
                    selectedCamera === camera.deviceId 
                      ? 'bg-[var(--color-aurora-purple)]' 
                      : 'border-white/30 text-white hover:bg-white/10'
                  }`}
                >
                  {camera.label || `Camera ${index + 1}`}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => setShowCameraSelector(false)}
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-white/70 hover:text-white"
            >
              Close
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[var(--card)] border-t border-[var(--border)] p-4 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleCamera}
            variant="default"
            size="lg"
            className={`rounded-full w-16 h-16 min-w-[64px] min-h-[64px] ${
              isCameraEnabled 
                ? 'bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]' 
                : 'bg-[var(--color-aurora-salmon)]'
            }`}
          >
            {isCameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={toggleMicrophone}
            variant="default"
            size="lg"
            className={`rounded-full w-16 h-16 min-w-[64px] min-h-[64px] ${
              isMicrophoneEnabled 
                ? 'bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]' 
                : 'bg-[var(--color-aurora-salmon)]'
            }`}
          >
            {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {cameras.length > 1 ? (
            <Button
              onClick={() => setShowCameraSelector(!showCameraSelector)}
              variant="outline"
              size="lg"
              className={`rounded-full w-16 h-16 min-w-[64px] min-h-[64px] border-[var(--border)] ${
                showCameraSelector ? 'bg-[var(--color-aurora-purple)] text-white' : ''
              }`}
            >
              <Repeat className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              onClick={switchCamera}
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 min-w-[64px] min-h-[64px] border-[var(--border)]"
            >
              <Repeat className="w-6 h-6" />
            </Button>
          )}
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
