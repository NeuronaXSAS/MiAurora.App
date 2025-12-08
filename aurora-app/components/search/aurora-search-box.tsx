"use client";

/**
 * Aurora Search Box - Unified AI-Powered Search Experience
 * 
 * Three modes:
 * 1. Aurora Judge (default) - "Who's Right?" argument analysis
 * 2. Web Search - Internet search with bias detection
 * 3. Community - Explore Aurora App content (preview without registration)
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, Globe, Users, ArrowUp, Mic, StopCircle, 
  X, Sparkles, Shield, Heart, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Types
type SearchMode = "judge" | "web" | "community";

interface AuroraSearchBoxProps {
  onSearch: (query: string, mode: SearchMode, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

// Tooltip components
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

// Voice Recorder Component
interface VoiceRecorderProps {
  isRecording: boolean;
  onStop: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ isRecording, onStop }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setTime(0);
      return;
    }
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

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
      className="flex flex-col items-center justify-center w-full py-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ec4c28] animate-pulse" />
        <span className="font-mono text-sm text-[var(--color-aurora-violet)]">
          {formatTime(time)}
        </span>
      </div>
      <div className="w-full h-8 flex items-center justify-center gap-0.5 px-4">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-[var(--color-aurora-purple)]"
            animate={{
              height: [8, Math.random() * 24 + 8, 8],
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.3,
              repeat: Infinity,
              delay: i * 0.05,
            }}
          />
        ))}
      </div>
      <button
        onClick={onStop}
        className="mt-3 px-4 py-2 rounded-full bg-[#ec4c28]/10 text-[#ec4c28] text-sm font-medium hover:bg-[#ec4c28]/20 transition-colors"
      >
        Stop Recording
      </button>
    </motion.div>
  );
};

// Custom Divider
const ModeDivider: React.FC = () => (
  <div className="relative h-6 w-[2px] mx-1">
    <div
      className="absolute inset-0 bg-gradient-to-t from-transparent via-[var(--color-aurora-purple)]/40 to-transparent rounded-full"
    />
  </div>
);

// Mode Button Component
interface ModeButtonProps {
  mode: SearchMode;
  currentMode: SearchMode;
  icon: React.ElementType;
  label: string;
  color: string;
  activeColor: string;
  onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({
  mode,
  currentMode,
  icon: Icon,
  label,
  color,
  activeColor,
  onClick,
}) => {
  const isActive = currentMode === mode;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "rounded-full transition-all flex items-center gap-1.5 px-3 py-1.5 border min-h-[36px]",
            isActive
              ? `bg-[${activeColor}]/15 border-[${activeColor}]`
              : "bg-transparent border-transparent hover:bg-[var(--color-aurora-lavender)]/30"
          )}
          style={{
            backgroundColor: isActive ? `${activeColor}15` : undefined,
            borderColor: isActive ? activeColor : "transparent",
          }}
        >
          <motion.div
            animate={{ 
              rotate: isActive ? 360 : 0, 
              scale: isActive ? 1.1 : 1 
            }}
            whileHover={{ 
              scale: 1.15,
              transition: { type: "spring", stiffness: 300, damping: 10 } 
            }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="w-5 h-5 flex items-center justify-center"
          >
            <Icon 
              className="w-4 h-4" 
              style={{ color: isActive ? activeColor : color }} 
            />
          </motion.div>
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-medium overflow-hidden whitespace-nowrap"
                style={{ color: activeColor }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

// Main Component
export const AuroraSearchBox = React.forwardRef<HTMLDivElement, AuroraSearchBoxProps>(
  ({ onSearch, isLoading = false, placeholder, className }, ref) => {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<SearchMode>("judge");
    const [isRecording, setIsRecording] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mode configurations
    const modes = {
      judge: {
        icon: Scale,
        label: "Aurora Judge",
        color: "var(--color-aurora-purple)",
        activeColor: "#5537a7",
        placeholder: "Describe your argument or upload screenshots...",
        description: "Who's right? AI-powered argument analysis",
      },
      web: {
        icon: Globe,
        label: "Web Search",
        color: "var(--color-aurora-blue)",
        activeColor: "#2e2ad6",
        placeholder: "Search the web with bias detection...",
        description: "Women-first search with truth analysis",
      },
      community: {
        icon: Users,
        label: "Community",
        color: "var(--color-aurora-pink)",
        activeColor: "#f29de5",
        placeholder: "Explore Aurora App community...",
        description: "Discover posts, circles & discussions",
      },
    };

    const currentMode = modes[mode];
    const hasContent = input.trim() !== "" || files.length > 0;

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }
    }, [input]);

    // Handle file processing
    const processFile = useCallback((file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 10 * 1024 * 1024) return;
      
      setFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({ ...prev, [file.name]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }, []);

    // Handle paste for images
    useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              break;
            }
          }
        }
      };
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [processFile]);

    const handleSubmit = () => {
      if (!hasContent || isLoading) return;
      onSearch(input, mode, files.length > 0 ? files : undefined);
      setInput("");
      setFiles([]);
      setFilePreviews({});
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const removeFile = (fileName: string) => {
      setFiles(prev => prev.filter(f => f.name !== fileName));
      setFilePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileName];
        return newPreviews;
      });
    };

    return (
      <TooltipProvider>
        <div
          ref={ref}
          className={cn(
            "w-full rounded-3xl border-2 bg-white dark:bg-[var(--color-aurora-violet)] p-3 shadow-xl transition-all duration-300",
            isFocused 
              ? "border-[var(--color-aurora-purple)] shadow-[var(--color-aurora-purple)]/20" 
              : "border-[var(--color-aurora-lavender)] hover:border-[var(--color-aurora-purple)]/50",
            isLoading && "opacity-80",
            className
          )}
        >
          {/* Mode indicator badge */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
            <span className="text-xs font-medium text-[var(--color-aurora-purple)]">
              {currentMode.description}
            </span>
            {mode === "judge" && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] font-semibold">
                NEW
              </span>
            )}
          </div>

          {/* File previews */}
          <AnimatePresence>
            {files.length > 0 && !isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-3"
              >
                {files.map((file) => (
                  <div key={file.name} className="relative group">
                    {filePreviews[file.name] && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--color-aurora-lavender)]">
                        <img
                          src={filePreviews[file.name]}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(file.name)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-aurora-violet)] text-white flex items-center justify-center shadow-md"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice recorder */}
          <AnimatePresence>
            {isRecording && (
              <VoiceRecorder 
                isRecording={isRecording} 
                onStop={() => setIsRecording(false)} 
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
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || currentMode.placeholder}
              disabled={isLoading}
              rows={1}
              className={cn(
                "w-full bg-transparent px-2 py-2 text-base resize-none",
                "text-[var(--color-aurora-violet)] dark:text-[var(--color-aurora-cream)]",
                "placeholder:text-[var(--color-aurora-purple)]/50",
                "focus:outline-none disabled:opacity-50",
                "min-h-[44px] max-h-[150px]"
              )}
            />
          )}

          {/* Actions bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-aurora-lavender)]/30 mt-2">
            {/* Left: Mode toggles */}
            <div className={cn(
              "flex items-center gap-0.5 transition-opacity",
              isRecording && "opacity-0 pointer-events-none"
            )}>
              {/* Upload button for Judge mode */}
              {mode === "judge" && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-aurora-lavender)]/30"
                      >
                        <Search className="w-4 h-4 text-[var(--color-aurora-purple)]/60" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              Array.from(e.target.files).forEach(processFile);
                            }
                            e.target.value = "";
                          }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Upload screenshots</TooltipContent>
                  </Tooltip>
                  <ModeDivider />
                </>
              )}

              {/* Mode buttons */}
              <ModeButton
                mode="judge"
                currentMode={mode}
                icon={Scale}
                label="Judge"
                color="var(--color-aurora-purple)"
                activeColor="#5537a7"
                onClick={() => setMode("judge")}
              />
              <ModeDivider />
              <ModeButton
                mode="web"
                currentMode={mode}
                icon={Globe}
                label="Web"
                color="var(--color-aurora-blue)"
                activeColor="#2e2ad6"
                onClick={() => setMode("web")}
              />
              <ModeDivider />
              <ModeButton
                mode="community"
                currentMode={mode}
                icon={Users}
                label="Community"
                color="var(--color-aurora-pink)"
                activeColor="#f29de5"
                onClick={() => setMode("community")}
              />
            </div>

            {/* Right: Submit/Voice button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (isRecording) {
                      setIsRecording(false);
                    } else if (hasContent) {
                      handleSubmit();
                    } else {
                      setIsRecording(true);
                    }
                  }}
                  disabled={isLoading && !hasContent}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200",
                    isRecording
                      ? "bg-[#ec4c28]/10 text-[#ec4c28] hover:bg-[#ec4c28]/20"
                      : hasContent
                        ? "bg-[var(--color-aurora-purple)] text-white hover:bg-[var(--color-aurora-violet)] shadow-lg"
                        : "bg-[var(--color-aurora-lavender)]/50 text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-lavender)]"
                  )}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : isRecording ? (
                    <StopCircle className="w-5 h-5" />
                  ) : hasContent ? (
                    <ArrowUp className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading ? "Processing..." : isRecording ? "Stop recording" : hasContent ? "Send" : "Voice input"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Trust indicators */}
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
        </div>
      </TooltipProvider>
    );
  }
);

AuroraSearchBox.displayName = "AuroraSearchBox";
