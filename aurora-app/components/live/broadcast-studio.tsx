"use client";

import { useState, useEffect, useRef } from "react";
import { useLivestream } from "@/hooks/useLivestream";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CameraOff, Mic, MicOff, Video, Users, Clock, Repeat, X, Shield, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

interface BroadcastStudioProps {
  userId: Id<"users">;
}

type BroadcastStage = 'setup' | 'preview' | 'live' | 'ended';

export function BroadcastStudio({ userId }: BroadcastStudioProps) {
  const router = useRouter();
  
  // All state declarations at the top
  const [stage, setStage] = useState<BroadcastStage>('setup');
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("safety-walk");
  const [livestreamId, setLivestreamId] = useState<Id<"livestreams"> | null>(null);
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [earnedCredits, setEarnedCredits] = useState(0);

  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Mutations
  const createLivestream = useMutation(api.livestreams.createLivestream);
  const endLivestream = useMutation(api.livestreams.endLivestream);
  const triggerEmergency = useMutation(api.emergency.triggerEmergencyAlert);

  // Livestream hook
  const {
    isStreaming, isCameraEnabled, isMicrophoneEnabled, viewerCount, stats,
    initialize, stopBroadcast, leave, toggleCamera, toggleMicrophone, switchCamera,
    setCamera, getDevices, playLocalVideo,
  } = useLivestream();

  // Load devices when going live
  useEffect(() => {
    if (stage === 'live' && isStreaming) {
      getDevices().then(({ cameras: cams }) => setCameras(cams));
    }
  }, [stage, isStreaming, getDevices]);

  // Duration timer
  useEffect(() => {
    if (stage === 'live') {
      const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // Play local video with retry for older devices
  useEffect(() => {
    if (stage === 'live' && localVideoRef.current && isStreaming) {
      let attempts = 0;
      const maxAttempts = 20;
      
      const tryPlayVideo = () => {
        attempts++;
        if (localVideoRef.current) {
          const container = localVideoRef.current;
          // Force dimensions for older devices
          container.style.cssText = 'width:100%;height:100%;min-height:200px;position:absolute;inset:0;';
          playLocalVideo(container);
        }
        
        if (attempts < maxAttempts) {
          setTimeout(() => {
            if (localVideoRef.current && !localVideoRef.current.querySelector('video,canvas')) {
              tryPlayVideo();
            }
          }, 300);
        }
      };
      
      setTimeout(tryPlayVideo, 200);
    }
  }, [stage, isStreaming, playLocalVideo]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // Camera preview functions
  const startCameraPreview = async (cameraId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'user' },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = stream;
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) setSelectedCamera(videoTrack.getSettings().deviceId || '');
      return true;
    } catch {
      return false;
    }
  };

  const switchPreviewCamera = async (deviceId: string) => {
    if (!previewStream) return;
    previewStream.getVideoTracks().forEach(t => t.stop());
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false });
      const combined = new MediaStream([newStream.getVideoTracks()[0], previewStream.getAudioTracks()[0]]);
      setPreviewStream(combined);
      setSelectedCamera(deviceId);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = combined;
    } catch {
      startCameraPreview();
    }
  };

  const stopCameraPreview = () => {
    previewStream?.getTracks().forEach(t => t.stop());
    setPreviewStream(null);
  };

  // Handlers
  const handleGoLive = async () => {
    if (!title.trim()) { alert("Enter a title"); return; }
    setPermissionError(null);
    const ok = await startCameraPreview();
    if (!ok) { setPermissionError('Camera permission denied'); return; }
    setStage('preview');
  };

  const handleStartBroadcast = async () => {
    if (isStartingBroadcast) return;
    setIsStartingBroadcast(true);
    setBroadcastError(null);
    let createdId: Id<"livestreams"> | null = null;
    
    try {
      const result = await createLivestream({ hostId: userId, title: title.trim(), safetyMode: false, isEmergency: false });
      if (!result.livestreamId) throw new Error('Failed to create');
      createdId = result.livestreamId;
      setLivestreamId(result.livestreamId);
      
      stopCameraPreview();
      await new Promise(r => setTimeout(r, 400));
      
      const provider = await initialize({ channelName: result.channelName, userId, role: 'host', onError: (e) => setBroadcastError(e.message) });
      await new Promise(r => setTimeout(r, 200));
      
      if (provider) await provider.startBroadcast({ video: true, audio: true });
      setStage('live');
    } catch (e) {
      setBroadcastError((e as Error).message);
      if (createdId) await endLivestream({ livestreamId: createdId, hostId: userId }).catch(() => {});
    } finally {
      setIsStartingBroadcast(false);
    }
  };

  const handleEndStream = async () => {
    if (!confirm('End this livestream?')) return;
    try {
      await stopBroadcast();
      await leave();
      if (livestreamId) await endLivestream({ livestreamId, hostId: userId });
      // Calculate credits based on duration and viewers
      const credits = Math.max(10, Math.floor(duration / 60) * 5 + viewerCount * 2);
      setEarnedCredits(credits);
      setStage('ended');
    } catch (e) {
      alert('Error: ' + (e as Error).message);
    }
  };

  const handleEmergency = async () => {
    if (!confirm('Trigger emergency alert?')) return;
    try {
      const loc = await new Promise<{lat:number,lng:number}>((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve({ lat: 0, lng: 0 }),
            { timeout: 5000 }
          );
        } else {
          resolve({ lat: 0, lng: 0 });
        }
      });
      await triggerEmergency({ location: { ...loc, accuracy: 0 }, alertType: 'manual', message: `Emergency: ${title}` });
      alert('Emergency alert sent to all Aurora App users!');
    } catch {
      alert('Failed to send alert');
    }
  };

  const handleLiveCameraChange = async (deviceId: string) => {
    try {
      await setCamera(deviceId);
      setSelectedCamera(deviceId);
      setShowCameraSelector(false);
    } catch {}
  };

  // SETUP STAGE
  if (stage === 'setup') {
    return (
      <div className="h-[calc(100dvh-60px)] flex items-center justify-center p-4 bg-[var(--background)]">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm">
          <div className="text-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Video className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Go Live</h1>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Evening Safety Walk" className="mt-1" />
            </div>

            <div>
              <Label className="text-sm">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety-walk">🚶 Safety Walk</SelectItem>
                  <SelectItem value="commute">🚇 Commute</SelectItem>
                  <SelectItem value="qa">💬 Q&A</SelectItem>
                  <SelectItem value="just-chatting">🗣️ Chatting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {permissionError && (
              <p className="text-sm text-[var(--color-aurora-salmon)] text-center">{permissionError}</p>
            )}

            <Button onClick={handleGoLive} className="w-full bg-[var(--color-aurora-purple)] min-h-[48px]">
              <Camera className="w-5 h-5 mr-2" /> Continue
            </Button>
            <Button onClick={() => router.push('/live')} variant="outline" className="w-full">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW STAGE - Fixed to fit screen
  if (stage === 'preview') {
    return (
      <div className="h-[calc(100dvh-60px)] flex flex-col bg-[var(--color-aurora-violet)]">
        {/* Video - Takes remaining space */}
        <div className="flex-1 relative min-h-0">
          <video ref={previewVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          {!previewStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <CameraOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Loading camera...</p>
              </div>
            </div>
          )}
          {/* Title overlay */}
          <div className="absolute top-2 left-2 right-2">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white font-semibold text-sm truncate">{title}</p>
              <p className="text-white/60 text-xs">Preview Mode</p>
            </div>
          </div>
        </div>

        {/* Controls - Fixed height, always visible */}
        <div className="bg-[var(--card)] p-3 space-y-3 safe-area-inset-bottom">
          {/* Camera selector */}
          {cameras.length > 1 && (
            <Select value={selectedCamera} onValueChange={switchPreviewCamera}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Camera" /></SelectTrigger>
              <SelectContent>
                {cameras.map((c, i) => <SelectItem key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${i+1}`}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Control buttons */}
          <div className="flex justify-center gap-3">
            <Button onClick={() => previewStream?.getVideoTracks()[0] && (previewStream.getVideoTracks()[0].enabled = !previewStream.getVideoTracks()[0].enabled)} className="rounded-full w-14 h-14 bg-[var(--color-aurora-purple)]">
              <Camera className="w-6 h-6" />
            </Button>
            <Button onClick={() => previewStream?.getAudioTracks()[0] && (previewStream.getAudioTracks()[0].enabled = !previewStream.getAudioTracks()[0].enabled)} className="rounded-full w-14 h-14 bg-[var(--color-aurora-purple)]">
              <Mic className="w-6 h-6" />
            </Button>
            {cameras.length > 1 && (
              <Button onClick={() => { const i = cameras.findIndex(c => c.deviceId === selectedCamera); switchPreviewCamera(cameras[(i+1)%cameras.length].deviceId); }} variant="outline" className="rounded-full w-14 h-14">
                <Repeat className="w-6 h-6" />
              </Button>
            )}
          </div>

          {broadcastError && <p className="text-sm text-[var(--color-aurora-salmon)] text-center">{broadcastError}</p>}

          <Button onClick={handleStartBroadcast} disabled={!previewStream || isStartingBroadcast} className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] min-h-[48px] text-base font-semibold">
            {isStartingBroadcast ? 'Starting...' : '🔴 Go Live Now'}
          </Button>
          <Button onClick={() => { stopCameraPreview(); router.push('/live'); }} variant="ghost" className="w-full">Cancel</Button>
        </div>
      </div>
    );
  }

  // ENDED STAGE - Show credits earned
  if (stage === 'ended') {
    return (
      <div className="h-[calc(100dvh-60px)] flex items-center justify-center p-4 bg-[var(--background)]">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Stream Ended!</h2>
          <p className="text-[var(--muted-foreground)] mb-4">Great job streaming for {formatDuration(duration)}</p>
          
          <div className="bg-[var(--color-aurora-yellow)]/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-[var(--muted-foreground)]">Credits Earned</p>
            <p className="text-3xl font-bold text-[var(--color-aurora-yellow)]">+{earnedCredits}</p>
          </div>

          <div className="text-sm text-[var(--muted-foreground)] mb-4">
            <p>👥 {viewerCount} viewers</p>
            <p>⏱️ {formatDuration(duration)} streamed</p>
          </div>

          <Button onClick={() => router.push('/live')} className="w-full bg-[var(--color-aurora-purple)] min-h-[48px]">
            Back to Live
          </Button>
        </div>
      </div>
    );
  }

  // LIVE STAGE
  return (
    <div className="h-[calc(100dvh-60px)] flex flex-col bg-black">
      {/* Video area */}
      <div className="flex-1 relative min-h-0">
        <div ref={localVideoRef} className="absolute inset-0" style={{ backgroundColor: '#3d0d73' }} />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Top overlay */}
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-red-500 px-2 py-1 rounded text-white text-xs font-bold animate-pulse">LIVE</span>
            <span className="bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />{viewerCount}
            </span>
            <span className="bg-black/60 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatDuration(duration)}
            </span>
          </div>
          <Button onClick={handleEmergency} className="bg-[var(--color-aurora-orange)] rounded-full w-12 h-12 min-w-[48px] animate-pulse">
            <Shield className="w-5 h-5 text-white" />
          </Button>
        </div>

        {/* Stats */}
        {stats && stats.resolution.width > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1 text-white text-[10px] z-20">
            {stats.resolution.width}x{stats.resolution.height} • {stats.fps}fps
          </div>
        )}

        {/* Camera selector */}
        {showCameraSelector && cameras.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/90 rounded-xl p-3 z-30 min-w-[160px]">
            <p className="text-white text-xs font-medium mb-2">Camera</p>
            {cameras.map((c, i) => (
              <Button key={c.deviceId} onClick={() => handleLiveCameraChange(c.deviceId)} variant={selectedCamera === c.deviceId ? "default" : "ghost"} size="sm" className="w-full justify-start text-xs mb-1">
                {c.label || `Camera ${i+1}`}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-[var(--card)] p-3 safe-area-inset-bottom">
        <div className="flex justify-center gap-3 mb-3">
          <Button onClick={toggleCamera} className={`rounded-full w-14 h-14 ${isCameraEnabled ? 'bg-[var(--color-aurora-purple)]' : 'bg-[var(--color-aurora-salmon)]'}`}>
            {isCameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>
          <Button onClick={toggleMicrophone} className={`rounded-full w-14 h-14 ${isMicrophoneEnabled ? 'bg-[var(--color-aurora-purple)]' : 'bg-[var(--color-aurora-salmon)]'}`}>
            {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          <Button onClick={() => cameras.length > 1 ? setShowCameraSelector(!showCameraSelector) : switchCamera()} variant="outline" className="rounded-full w-14 h-14">
            <Repeat className="w-6 h-6" />
          </Button>
        </div>
        <Button onClick={handleEndStream} className="w-full bg-[var(--color-aurora-salmon)] min-h-[48px]">
          <X className="w-5 h-5 mr-2" /> End Stream
        </Button>
      </div>
    </div>
  );
}
