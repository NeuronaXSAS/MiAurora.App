"use client";

/**
 * Aurora Search Box - Unified AI-Powered Search Experience
 * 
 * IMPROVED VERSION with:
 * - Streamlined Judge mode (removed redundant context - uses main textarea)
 * - Voice recording for live argument transcription
 * - Integrated results that flow FROM the search box
 * - Community sharing option for verdicts
 * 
 * Three integrated modes:
 * 1. Aurora Judge - "Who's Right?" argument analysis
 * 2. Web Search - Internet search with bias detection
 * 3. Community - Explore Aurora App content
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, Globe, Users, ArrowUp, Mic, StopCircle,
  X, Sparkles, Shield, Heart, Upload, Plus,
  User, Loader2, Gavel, Share2, FileText, RefreshCw,
  Crown, Flag, AlertTriangle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ShareCaseModal } from "./share-case-modal";

// Types
export type SearchMode = "judge" | "web" | "community";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface AuroraSearchBoxProps {
  onSearch: (query: string, mode: SearchMode, data?: SearchData) => void;
  isLoading?: boolean;
  className?: string;
}

export interface SearchData {
  files?: File[];
  person1Label?: string;
  person2Label?: string;
  context?: string;
  isAudioTranscription?: boolean;
  audioBlob?: Blob;
}

export interface JudgeResult {
  winner: "person1" | "person2" | "tie" | "both_wrong";
  winnerLabel: string;
  loserLabel: string;
  toxicityScore: number;
  toxicityLevel: string;
  argumentType: string;
  redFlags: { type: string; emoji: string; severity: "low" | "medium" | "high" }[];
  receipts: { number: number; text: string; type: "negative" | "neutral" | "positive" }[];
  healthyTip: string;
  communicationScore: number;
  caseNumber: string;
  ruling: string;
  suggestion: string;
  shareableId?: string;
}

// Tooltip component
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-xl border border-[var(--color-aurora-purple)]/20 bg-[var(--color-aurora-violet)] px-3 py-1.5 text-sm text-white shadow-lg",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

// Voice Recorder Component with actual recording and transcription
const VoiceRecorder: React.FC<{
  isRecording: boolean;
  onStop: (audioBlob: Blob | null) => void;
  onTranscript?: (text: string) => void;
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
}> = ({ isRecording, onStop, onTranscript, mediaRecorderRef }) => {
  const [time, setTime] = useState(0);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isRecording) {
      setTime(0);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    // Initialize Speech Recognition if available
    const initSpeechRecognition = () => {
      const { webkitSpeechRecognition, SpeechRecognition } = window as any;
      const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

      if (SpeechRecognitionConstructor && onTranscript) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // Default to English, could be made dynamic

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript || interimTranscript) {
            // Pass the latest chunk of text
            onTranscript(finalTranscript + interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error", event.error);
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.error("Failed to start speech recognition", e);
        }
      }
    };

    // Start recording audio
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          onStop(audioBlob);
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        };

        mediaRecorder.start();
        initSpeechRecognition(); // Start transcription in parallel
      } catch (err) {
        console.error("Error accessing microphone:", err);
        onStop(null);
      }
    };

    startRecording();

    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => {
      clearInterval(timer);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isRecording, onStop, mediaRecorderRef, onTranscript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col items-center justify-center w-full py-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 rounded-full bg-[#ec4c28] animate-pulse" />
        <span className="font-mono text-sm text-[var(--color-aurora-violet)] font-bold">{formatTime(time)}</span>
        <span className="text-xs text-[var(--muted-foreground)]">Recording & Transcribing...</span>
      </div>
      <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
        {[...Array(32)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]"
            animate={{ height: [8, Math.random() * 32 + 8, 8] }}
            transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.03 }}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        🎤 Speak clearly - text will appear below
      </p>
    </motion.div>
  );
};

// Mode Divider
const ModeDivider: React.FC = () => (
  <div className="relative h-6 w-[2px] mx-1">
    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[var(--color-aurora-purple)]/40 to-transparent rounded-full" />
  </div>
);

// Mode Button Component
interface ModeButtonProps {
  mode: SearchMode;
  currentMode: SearchMode;
  icon: React.ElementType;
  label: string;
  activeColor: string;
  onClick: () => void;
  isNew?: boolean;
}

const ModeButton: React.FC<ModeButtonProps> = ({ mode, currentMode, icon: Icon, label, activeColor, onClick, isNew }) => {
  const isActive = currentMode === mode;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "rounded-full transition-all flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 border min-h-[32px] sm:min-h-[36px] flex-shrink-0",
            isActive ? "border-current" : "bg-transparent border-transparent hover:bg-[var(--color-aurora-lavender)]/30"
          )}
          style={{
            backgroundColor: isActive ? `${activeColor}15` : undefined,
            borderColor: isActive ? activeColor : "transparent",
            color: isActive ? activeColor : "var(--color-aurora-purple)"
          }}
        >
          <motion.div
            animate={{ rotate: isActive ? 360 : 0, scale: isActive ? 1.1 : 1 }}
            whileHover={{ scale: 1.15, transition: { type: "spring", stiffness: 300, damping: 10 } }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center"
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.div>
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] sm:text-xs font-medium overflow-hidden whitespace-nowrap hidden sm:inline"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {isNew && !isActive && (
            <span className="text-[7px] sm:text-[8px] px-0.5 sm:px-1 py-0.5 rounded bg-[var(--color-aurora-pink)] text-white font-bold">
              NEW
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
};

// Compact Judge Setup (Person labels + Upload only - no redundant context)
interface JudgeSetupProps {
  person1: string;
  setPerson1: (v: string) => void;
  person2: string;
  setPerson2: (v: string) => void;
  images: UploadedImage[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
}

const JudgeCompactSetup: React.FC<JudgeSetupProps> = ({
  person1, setPerson1, person2, setPerson2, images, onAddImages, onRemoveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")).slice(0, 5 - images.length);
    if (files.length > 0) onAddImages(files);
  }, [images.length, onAddImages]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-[var(--color-aurora-lavender)]/30 pt-3 mt-2 space-y-3"
    >
      {/* Person Labels - Compact inline */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-aurora-lavender)]/20 border border-[var(--color-aurora-lavender)]">
          <User className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
          <input
            type="text"
            value={person1}
            onChange={(e) => setPerson1(e.target.value || "You")}
            placeholder="You"
            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-aurora-lavender)]/20 border border-[var(--color-aurora-lavender)]">
          <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={person2}
            onChange={(e) => setPerson2(e.target.value || "Other Person")}
            placeholder="Other"
            className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
          />
        </div>
      </div>

      {/* Upload Area - Compact */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--color-aurora-purple)]/30 hover:border-[var(--color-aurora-purple)] rounded-xl p-3 text-center cursor-pointer transition-all bg-[var(--color-aurora-purple)]/5"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) onAddImages(Array.from(e.target.files)); e.target.value = ""; }}
        />
        <div className="flex items-center justify-center gap-3">
          <Upload className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--foreground)]">Upload Screenshots</p>
            <p className="text-xs text-[var(--muted-foreground)]">Drop or click (max 5)</p>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img) => (
            <div key={img.id} className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 border-[var(--color-aurora-purple)]/20">
              <img src={img.preview} alt="Evidence" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveImage(img.id); }}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[var(--color-aurora-salmon)] flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 flex-shrink-0 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center hover:border-[var(--color-aurora-purple)]/50"
            >
              <Plus className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ==================== INTEGRATED RESULT VIEW ====================
// Results now flow FROM the search box itself

interface IntegratedJudgeResultProps {
  result: JudgeResult;
  person1Label: string;
  person2Label: string;
  onReset: () => void;
  onShare: () => void;
  onShareToCommunity: () => void;
}

const IntegratedJudgeResult: React.FC<IntegratedJudgeResultProps> = ({
  result, person1Label, person2Label, onReset, onShare, onShareToCommunity
}) => {
  const isWinner = result.winner === "person1";
  const isTie = result.winner === "tie" || result.winner === "both_wrong";
  const winnerName = isWinner ? person1Label : isTie ? "Nobody" : person2Label;
  const loserName = isWinner ? person2Label : isTie ? "" : person1Label;

  const getToxicityColor = (score: number) => {
    if (score <= 25) return "#22c55e";
    if (score <= 40) return "#84cc16";
    if (score <= 55) return "#eab308";
    if (score <= 70) return "#f97316";
    return "#ef4444";
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-[var(--color-aurora-lavender)]/30 pt-4 mt-2"
    >
      {/* Winner Banner */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-mint)] to-[var(--color-aurora-lavender)] rounded-xl p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">👑</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--color-aurora-violet)]">
              {isTie ? "It's a Draw" : `${winnerName} won`}
            </h3>
            {!isTie && (
              <p className="text-xs text-[var(--color-aurora-violet)]/70">{loserName} lost this one</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--muted-foreground)]">Case #</span>
            <span className="text-sm font-mono font-bold text-[var(--foreground)]">{result.caseNumber}</span>
          </div>
        </div>
      </div>

      {/* Toxicity + Argument Type Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Toxicity */}
        <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            Toxicity
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 h-2 bg-[var(--accent)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.toxicityScore}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: getToxicityColor(result.toxicityScore) }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: getToxicityColor(result.toxicityScore) }}>
              {result.toxicityScore}
            </span>
          </div>
          <p className="text-[10px] mt-1" style={{ color: getToxicityColor(result.toxicityScore) }}>
            {result.toxicityLevel}
          </p>
        </div>

        {/* Argument Type */}
        <div className="p-3 rounded-xl bg-[var(--color-aurora-purple)] text-white">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Type</span>
          </div>
          <p className="text-sm font-bold leading-tight">{result.argumentType}</p>
        </div>
      </div>

      {/* Red Flags */}
      {result.redFlags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <Flag className="w-3 h-3 text-[var(--color-aurora-salmon)]" />
            <span className="text-[10px] font-bold text-[var(--color-aurora-salmon)] uppercase tracking-wider">
              Red Flags
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.redFlags.map((flag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)] text-xs"
              >
                <span>{flag.emoji}</span>
                <span className="font-medium">{flag.type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Receipts */}
      {result.receipts.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <FileText className="w-3 h-3 text-[var(--color-aurora-purple)]" />
            <span className="text-[10px] font-bold text-[var(--color-aurora-purple)] uppercase tracking-wider">
              The Receipts
            </span>
          </div>
          <div className="space-y-1.5">
            {result.receipts.slice(0, 3).map((receipt) => (
              <div
                key={receipt.number}
                className="flex items-start gap-2 p-2 rounded-lg bg-[var(--accent)]"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: receipt.type === "negative" ? "var(--color-aurora-salmon)" :
                      receipt.type === "positive" ? "var(--color-aurora-mint)" :
                        "var(--color-aurora-blue)"
                  }}
                >
                  {receipt.number}
                </div>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">{receipt.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      {result.suggestion && (
        <div className="p-3 rounded-xl bg-[var(--color-aurora-mint)]/20 border border-[var(--color-aurora-mint)]/30 mb-3">
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 text-[var(--color-aurora-pink)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-[var(--color-aurora-violet)] uppercase">Suggestion</p>
              <p className="text-xs text-[var(--foreground)] mt-0.5">{result.suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onShare}
          className="flex-1 h-9 px-3 rounded-lg bg-[var(--color-aurora-violet)] text-white text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[var(--color-aurora-purple)] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
        <button
          onClick={onShareToCommunity}
          className="flex-1 h-9 px-3 rounded-lg border border-[var(--color-aurora-purple)] text-[var(--color-aurora-purple)] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[var(--color-aurora-purple)]/10 transition-colors"
        >
          <Users className="w-3.5 h-3.5" /> Community Vote
        </button>
        <button
          onClick={onReset}
          className="h-9 w-9 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-[var(--muted-foreground)]" />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mt-3 text-[10px] text-[var(--muted-foreground)]">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <p>Entertainment purposes only. For serious concerns, consult a professional.</p>
      </div>
    </motion.div>
  );
};

// ==================== MAIN COMPONENT ====================

export const AuroraSearchBox = React.forwardRef<HTMLDivElement, AuroraSearchBoxProps>(
  ({ onSearch, isLoading = false, className }, ref) => {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<SearchMode>("judge");
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Judge mode state
    const [judgeImages, setJudgeImages] = useState<UploadedImage[]>([]);
    const [person1, setPerson1] = useState("You");
    const [person2, setPerson2] = useState("Other Person");

    // Integrated result state
    const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const initialInputRef = useRef<string>("");

    // Mode configurations
    const modes = {
      judge: {
        icon: Scale,
        label: "Judge",
        activeColor: "#5537a7",
        placeholder: "Describe your argument or just upload screenshots...",
        description: "Your Pocket Judge - AI argument analysis"
      },
      web: {
        icon: Globe,
        label: "Web",
        activeColor: "#2e2ad6",
        placeholder: "Search the web with bias detection...",
        description: "Women-first search with truth analysis"
      },
      community: {
        icon: Users,
        label: "Community",
        activeColor: "#f29de5",
        placeholder: "Search Aurora App community...",
        description: "Discover posts, circles & discussions"
      },
    };

    const currentMode = modes[mode];
    const hasContent = input.trim() !== "" || judgeImages.length > 0 || recordedAudio !== null;

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, [input]);

    // Expand form when in judge mode and focused
    useEffect(() => {
      if (mode === "judge" && isFocused) setIsExpanded(true);
    }, [mode, isFocused]);

    // Handle image processing
    const handleAddImages = useCallback((files: File[]) => {
      const validFiles = files.filter(f => f.type.startsWith("image/")).slice(0, 5 - judgeImages.length);
      const newImages: UploadedImage[] = validFiles.map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
      }));
      setJudgeImages(prev => [...prev, ...newImages].slice(0, 5));
      setIsExpanded(true);
    }, [judgeImages.length]);

    const handleRemoveImage = useCallback((id: string) => {
      setJudgeImages(prev => {
        const img = prev.find(i => i.id === id);
        if (img) URL.revokeObjectURL(img.preview);
        return prev.filter(i => i.id !== id);
      });
    }, []);

    // Handle paste for images
    useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        if (mode !== "judge") return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              handleAddImages([file]);
              break;
            }
          }
        }
      };
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [mode, handleAddImages]);

    // Handle recording stop
    const handleRecordingStop = useCallback((audioBlob: Blob | null) => {
      setIsRecording(false);
      if (audioBlob) {
        setRecordedAudio(audioBlob);
      }
    }, []);

    // Handle submit
    const handleSubmit = async () => {
      if (!hasContent || isLoading || isAnalyzing) return;

      if (mode === "judge") {
        setIsAnalyzing(true);
        try {
          const formData = new FormData();
          judgeImages.forEach((img, i) => formData.append(`image${i}`, img.file));
          formData.append("person1Label", person1);
          formData.append("person2Label", person2);
          formData.append("context", input); // Main textarea IS the context

          if (recordedAudio) {
            formData.append("audio", recordedAudio);
            formData.append("isAudioTranscription", "true");
          }

          const response = await fetch("/api/analyze/argument", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Analysis failed");
          const result = await response.json();
          setJudgeResult(result);
        } catch (err) {
          console.error("Analysis failed:", err);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        const searchData: SearchData = {
          context: input,
        };
        onSearch(input, mode, searchData);
        setInput("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleModeChange = (newMode: SearchMode) => {
      setMode(newMode);
      setIsExpanded(newMode === "judge");
      setJudgeResult(null);
      // Clear judge data when switching away
      if (newMode !== "judge") {
        judgeImages.forEach(img => URL.revokeObjectURL(img.preview));
        setJudgeImages([]);
        setPerson1("You");
        setPerson2("Other Person");
        setRecordedAudio(null);
      }
    };

    const handleReset = () => {
      judgeImages.forEach(img => URL.revokeObjectURL(img.preview));
      setJudgeImages([]);
      setJudgeResult(null);
      setInput("");
      setRecordedAudio(null);
      setPerson1("You");
      setPerson2("Other Person");
    };

    const handleShare = async () => {
      if (!judgeResult) return;
      const text = `⚖️ Aurora App Verdict\n\n👑 ${judgeResult.winnerLabel} won this one\n\n"${judgeResult.ruling}"\n\nCase #${judgeResult.caseNumber}\n\nAnalyze YOUR conversations at Aurora App! 💜`;
      if (navigator.share) {
        try { await navigator.share({ title: "Who's Right - Verdict", text }); } catch { /* cancelled */ }
      } else {
        navigator.clipboard.writeText(text);
      }
    };

    const handleShareToCommunity = () => {
      setShowShareModal(true);
    };

    const handleToggleRecording = () => {
      if (isRecording) {
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } else {
        // Start recording
        initialInputRef.current = input; // Save current input state
        setIsRecording(true);
        setIsExpanded(true);
      }
    };

    return (
      <TooltipProvider>
        <div
          ref={ref}
          className={cn(
            "w-full rounded-3xl border-2 bg-white dark:bg-[var(--color-aurora-violet)]/90 p-3 shadow-xl transition-all duration-300",
            isFocused ? "border-[var(--color-aurora-purple)] shadow-[var(--color-aurora-purple)]/20" : "border-[var(--color-aurora-lavender)] hover:border-[var(--color-aurora-purple)]/50",
            (isLoading || isAnalyzing) && "opacity-80",
            className
          )}
        >
          {/* Mode indicator */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
            <span className="text-xs font-medium text-[var(--color-aurora-purple)]">{currentMode.description}</span>
            {mode === "judge" && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] font-semibold">
                NEW
              </span>
            )}
          </div>

          {/* Voice recorder */}
          <AnimatePresence>
            {isRecording && (
              <VoiceRecorder
                isRecording={isRecording}
                onStop={handleRecordingStop}
                mediaRecorderRef={mediaRecorderRef}
                onTranscript={(text) => {
                  const separator = initialInputRef.current && !initialInputRef.current.trim().endsWith(".") && !initialInputRef.current.endsWith(" ") ? " " : "";
                  setInput(initialInputRef.current + separator + text);
                }}
              />
            )}
          </AnimatePresence>

          {/* Textarea */}
          {!isRecording && (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={currentMode.placeholder}
              disabled={isLoading || isAnalyzing}
              rows={1}
              className={cn(
                "w-full bg-transparent px-2 py-2 text-base resize-none",
                "text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)]",
                "placeholder:text-[var(--color-aurora-purple)]/50 focus:outline-none disabled:opacity-50 min-h-[44px] max-h-[120px]"
              )}
            />
          )}

          {/* Judge Setup - No redundant context field */}
          <AnimatePresence>
            {mode === "judge" && isExpanded && !isRecording && !judgeResult && (
              <JudgeCompactSetup
                person1={person1}
                setPerson1={setPerson1}
                person2={person2}
                setPerson2={setPerson2}
                images={judgeImages}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
              />
            )}
          </AnimatePresence>

          {/* Integrated Judge Result - Flows from within the search box! */}
          <AnimatePresence>
            {mode === "judge" && judgeResult && (
              <IntegratedJudgeResult
                result={judgeResult}
                person1Label={person1}
                person2Label={person2}
                onReset={handleReset}
                onShare={handleShare}
                onShareToCommunity={handleShareToCommunity}
              />
            )}
          </AnimatePresence>

          {/* Loading state for analysis */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[var(--color-aurora-lavender)]/30 pt-4 mt-2"
              >
                <div className="flex items-center justify-center gap-3 py-8">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center animate-pulse">
                      <Scale className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--color-aurora-purple)] border-t-transparent animate-spin" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--foreground)]">Analyzing argument...</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Extracting text, detecting patterns</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions bar - Hide when showing result */}
          {!judgeResult && (
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2 border-t border-[var(--color-aurora-lavender)]/30 mt-2">
              {/* Mode buttons with horizontal scroll on mobile */}
              <div className={cn(
                "flex items-center gap-0.5 overflow-x-auto no-scrollbar transition-opacity flex-1 min-w-0",
                isRecording && "opacity-0 pointer-events-none"
              )}>
                <ModeButton mode="judge" currentMode={mode} icon={Scale} label="Judge" activeColor="#5537a7" onClick={() => handleModeChange("judge")} isNew />
                <ModeDivider />
                <ModeButton mode="web" currentMode={mode} icon={Globe} label="Web" activeColor="#2e2ad6" onClick={() => handleModeChange("web")} />
                <ModeDivider />
                <ModeButton mode="community" currentMode={mode} icon={Users} label="Community" activeColor="#f29de5" onClick={() => handleModeChange("community")} />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Record button for live arguments */}
                {mode === "judge" && !isRecording && !judgeResult && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleToggleRecording}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center bg-[var(--color-aurora-salmon)]/10 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/20 transition-all"
                      >
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Record live argument</TooltipContent>
                  </Tooltip>
                )}

                {/* Main action button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (isRecording) handleToggleRecording();
                        else if (hasContent) handleSubmit();
                        else if (mode === "judge") handleToggleRecording();
                      }}
                      disabled={(isLoading || isAnalyzing) && !hasContent}
                      className={cn(
                        "h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center transition-all duration-200",
                        isRecording ? "bg-[#ec4c28]/10 text-[#ec4c28] hover:bg-[#ec4c28]/20"
                          : hasContent ? "bg-[var(--color-aurora-purple)] text-white hover:bg-[var(--color-aurora-violet)] shadow-lg"
                            : "bg-[var(--color-aurora-lavender)]/50 text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-lavender)]"
                      )}
                    >
                      {(isLoading || isAnalyzing) ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        : isRecording ? <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          : hasContent ? (mode === "judge" ? <Gavel className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />)
                            : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {(isLoading || isAnalyzing) ? "Processing..." : isRecording ? "Stop" : hasContent ? (mode === "judge" ? "Get Verdict" : "Search") : "Voice"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {/* Trust indicators - Only show when not showing result */}
          {!judgeResult && (
            <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-[var(--color-aurora-lavender)]/20">
              <span className="flex items-center gap-1 text-[10px] text-[var(--color-aurora-purple)]/60">
                <Shield className="w-3 h-3" /> Private & Secure
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--color-aurora-purple)]/60">
                <Heart className="w-3 h-3" /> Women-First
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--color-aurora-purple)]/60">
                <Sparkles className="w-3 h-3" /> AI-Powered
              </span>
            </div>
          )}
        </div>

        {/* Share Case Modal */}
        {judgeResult && (
          <ShareCaseModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            result={judgeResult}
            person1Label={person1}
            person2Label={person2}
            context={input}
          />
        )}
      </TooltipProvider>
    );
  }
);

AuroraSearchBox.displayName = "AuroraSearchBox";
