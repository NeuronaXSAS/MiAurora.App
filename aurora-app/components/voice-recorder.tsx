"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Upload } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingDelete: () => void;
  maxDuration?: number; // in seconds
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  onRecordingDelete,
  maxDuration = 180 // 3 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    onRecordingDelete();
  };

  const uploadRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {!audioUrl && !isRecording && (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          className="w-full min-h-[48px] border-[var(--border)] hover:bg-[var(--color-aurora-pink)]/10 hover:border-[var(--color-aurora-pink)]"
        >
          <Mic className="w-4 h-4 mr-2 text-[var(--color-aurora-pink)]" />
          Record Voice Note
        </Button>
      )}

      {isRecording && (
        <div className="bg-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-pink)]/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[var(--color-aurora-pink)] rounded-full animate-pulse" />
              <span className="font-medium text-[var(--foreground)]">
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>
            <span className="text-sm font-mono text-[var(--foreground)]">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
          <div className="flex gap-2">
            {!isPaused ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pauseRecording}
                className="flex-1 min-h-[44px] border-[var(--color-aurora-yellow)]/50 text-[var(--color-aurora-yellow)] hover:bg-[var(--color-aurora-yellow)]/10"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resumeRecording}
                className="flex-1 min-h-[44px] border-[var(--color-aurora-mint)]/50 text-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/10"
              >
                <Mic className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={stopRecording}
              className="flex-1 min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      )}

      {audioUrl && (
        <div className="bg-[var(--color-aurora-lavender)]/20 border border-[var(--color-aurora-lavender)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-[var(--foreground)]">Voice Note</span>
            <span className="text-sm font-mono text-[var(--muted-foreground)]">
              {formatTime(recordingTime)}
            </span>
          </div>
          
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          
          <div className="flex gap-2">
            {!isPlaying ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={playAudio}
                className="flex-1 min-h-[44px] border-[var(--border)]"
              >
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={pauseAudio}
                className="flex-1 min-h-[44px] border-[var(--border)]"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deleteRecording}
              className="min-h-[44px] min-w-[44px] border-[var(--color-aurora-salmon)]/50 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={uploadRecording}
              className="flex-1 min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Use This
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
