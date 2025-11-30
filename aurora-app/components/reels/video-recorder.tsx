'use client';

/**
 * VideoRecorder Component
 * 
 * Mobile-first video recording interface inspired by TikTok/Instagram Stories.
 * Full-screen camera view with floating controls.
 * Supports both recording and uploading from gallery.
 */

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, Check, Trash2, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void;
  onCancel: () => void;
  maxDuration?: number; // seconds - no minimum, users can record any length
}

type RecordingState = 'idle' | 'recording' | 'preview';

export function VideoRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 180, // 3 minutes max, no minimum
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

      // Stop any existing stream first
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Request camera with specific constraints for better compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1080, max: 1920 },
          height: { ideal: 1920, max: 1920 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Video play failed:', e));
        };
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to access camera:', err);
      
      // Provide specific error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No se encontró cámara en este dispositivo.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('La cámara está siendo usada por otra aplicación.');
      } else if (err.name === 'OverconstrainedError') {
        // Try again with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: true,
          });
          mediaStreamRef.current = simpleStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            videoRef.current.play().catch(e => console.warn('Video play failed:', e));
          }
          setError(null);
          return;
        } catch {
          setError('No se pudo acceder a la cámara.');
        }
      } else {
        setError(err.message || 'No se pudo acceder a la cámara. Verifica los permisos.');
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
      {state === 'preview' && recordedBlob && (
        <video
          ref={previewRef}
          src={URL.createObjectURL(recordedBlob)}
          autoPlay
          loop
          playsInline
          muted={false}
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
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent safe-area-inset-bottom">
        {state === 'idle' && (
          <div className="flex justify-center items-center gap-8">
            {/* Upload from Gallery */}
            <label className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center cursor-pointer">
              <ImageIcon className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const blob = new Blob([file], { type: file.type });
                    setRecordedBlob(blob);
                    if (previewRef.current) {
                      previewRef.current.src = URL.createObjectURL(blob);
                    }
                    stopCamera();
                    setState('preview');
                  }
                }}
              />
            </label>

            {/* Record Button */}
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-red-500 border-4 border-white shadow-lg hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>

            {/* Spacer for balance */}
            <div className="w-14 h-14" />
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
