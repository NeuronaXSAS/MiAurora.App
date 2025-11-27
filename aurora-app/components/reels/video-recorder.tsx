'use client';

/**
 * VideoRecorder Component
 * 
 * Mobile-first video recording interface inspired by TikTok/Instagram Stories.
 * Full-screen camera view with floating controls.
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void;
  onCancel: () => void;
  maxDuration?: number; // seconds
}

type RecordingState = 'idle' | 'recording' | 'preview';

export function VideoRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 60,
}: VideoRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(e => console.warn('Video play failed:', e));
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to access camera:', err);
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.');
      } else {
        setError(err.message || 'Failed to access camera. Please check permissions.');
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);

        // Show preview
        if (previewRef.current) {
          previewRef.current.src = URL.createObjectURL(blob);
        }

        setState('preview');
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      stopCamera();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const retake = () => {
    setRecordedBlob(null);
    setState('idle');
    setRecordingTime(0);
    startCamera();
  };

  const acceptRecording = () => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob);
    }
  };

  const flipCamera = async () => {
    try {
      // Stop current camera
      stopCamera();
      
      // Toggle facing mode
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);
      
      // Restart camera with new facing mode will happen via useEffect
      // Show a brief loading state
      setError(null);
    } catch (err) {
      console.error('Failed to flip camera:', err);
      setError('Failed to switch camera');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View */}
      {state !== 'preview' && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />
      )}

      {/* Preview View */}
      {state === 'preview' && (
        <video
          ref={previewRef}
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-0 right-0 mx-4 p-4 bg-red-500/90 text-white rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>

          {state === 'recording' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-semibold">
                {formatTime(recordingTime)} / {formatTime(maxDuration)}
              </span>
            </div>
          )}

          {state === 'idle' && (
            <div className="flex items-center gap-2">
              {/* Camera Mode Indicator */}
              <div className="px-3 py-1 bg-black/50 rounded-full text-white text-xs font-medium">
                {facingMode === 'user' ? '🤳 Front' : '📷 Back'}
              </div>
              
              {/* Flip Camera Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={flipCamera}
                className="text-white hover:bg-white/20 transition-transform hover:rotate-180 duration-300"
                title="Flip Camera"
              >
                <RotateCw className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
        {state === 'idle' && (
          <div className="flex justify-center">
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-red-500 border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
          </div>
        )}

        {state === 'recording' && (
          <div className="flex justify-center">
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-lg bg-red-500 border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95"
            />
          </div>
        )}

        {state === 'preview' && (
          <div className="flex justify-center gap-8">
            <button
              onClick={retake}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
            >
              <Trash2 className="h-6 w-6 text-white" />
            </button>

            <button
              onClick={acceptRecording}
              className="w-20 h-20 rounded-full bg-[var(--color-aurora-purple)] border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
            >
              <Check className="h-8 w-8 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Recording Progress Bar */}
      {state === 'recording' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
