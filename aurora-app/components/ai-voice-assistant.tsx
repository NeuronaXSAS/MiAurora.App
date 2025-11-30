"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Globe,
  Brain,
  Briefcase,
  Shield,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface AIVoiceAssistantProps {
  userId?: string;
  userCredits?: number;
  onCreditsUpdate?: (newCredits: number) => void;
}

// Voice context options for different conversation modes
type VoiceContext = 'women_support' | 'mental_health' | 'career' | 'language_learning';

export function AIVoiceAssistant({ userId, userCredits = 0, onCreditsUpdate }: AIVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [dailyMinutesUsed, setDailyMinutesUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [voiceContext, setVoiceContext] = useState<VoiceContext>('women_support');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Free tier: 30 min/day voice, uses Gemini 2.0 Flash-Lite (30 RPM, 200 RPD)
  const FREE_DAILY_MINUTES = 30;
  const PREMIUM_PRICE = 9.99;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
        recognition.continuous = false; // Single utterance mode
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          
          setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onend = () => {
          // Will be updated in separate useEffect
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setError(`Voice error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update recognition end handler when transcript changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
        if (transcript.trim()) {
          processWithGemini(transcript);
        }
      };
    }
  }, [transcript]);

  const startListening = useCallback(() => {
    if (!isPremium && dailyMinutesUsed >= FREE_DAILY_MINUTES) {
      setError(`Daily limit reached (${FREE_DAILY_MINUTES} min). Upgrade to Premium for unlimited access!`);
      return;
    }

    setError(null);
    setTranscript('');
    setResponse('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        
        // Start session timer
        sessionTimerRef.current = setInterval(() => {
          setSessionTime(prev => {
            const newTime = prev + 1;
            if (newTime % 60 === 0 && newTime > 0) {
              setDailyMinutesUsed(m => m + 1);
            }
            return newTime;
          });
        }, 1000);
      } catch (err) {
        console.error('Failed to start recognition:', err);
        setError('Failed to start voice recognition');
      }
    }
  }, [isPremium, dailyMinutesUsed]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    setIsListening(false);
  }, []);

  const processWithGemini = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userId,
          context: voiceContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();
      setResponse(data.response);
      
      // Speak the response if not muted
      if (!isMuted) {
        speakResponse(data.response);
      }
    } catch (err) {
      console.error('Error processing with Gemini:', err);
      setError("Couldn't process your message. Please try again.");
      setResponse("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      
      // Try to find a female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('karen')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingMinutes = isPremium ? '∞' : Math.max(0, FREE_DAILY_MINUTES - dailyMinutesUsed);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--color-aurora-purple)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-purple)]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-[var(--foreground)]">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--color-aurora-purple)]/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Aurora Voice Companion</h2>
              <p className="text-sm text-[var(--muted-foreground)] font-normal">Your AI companion for support, learning & growth</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="backdrop-blur-xl bg-[var(--card)]/50 border border-[var(--border)] rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-[var(--color-aurora-purple)] mx-auto mb-1" />
              <p className="text-xs text-[var(--muted-foreground)]">Session</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{formatTime(sessionTime)}</p>
            </div>
            <div className="backdrop-blur-xl bg-[var(--card)]/50 border border-[var(--border)] rounded-lg p-3 text-center">
              <Heart className="w-5 h-5 text-[var(--color-aurora-pink)] mx-auto mb-1" />
              <p className="text-xs text-[var(--muted-foreground)]">Daily Remaining</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{remainingMinutes} min</p>
            </div>
            <div className="backdrop-blur-xl bg-[var(--card)]/50 border border-[var(--border)] rounded-lg p-3 text-center">
              <Globe className="w-5 h-5 text-[var(--color-aurora-blue)] mx-auto mb-1" />
              <p className="text-xs text-[var(--muted-foreground)]">Languages</p>
              <p className="text-lg font-bold text-[var(--foreground)]">24</p>
            </div>
            <div className="backdrop-blur-xl bg-[var(--card)]/50 border border-[var(--border)] rounded-lg p-3 text-center">
              <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)] mx-auto mb-1" />
              <p className="text-xs text-[var(--muted-foreground)]">Status</p>
              <Badge className={isPremium ? "bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)]" : "bg-[var(--muted)]"}>
                {isPremium ? "Premium" : "Free"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Selector */}
      <Card className="backdrop-blur-xl bg-[var(--card)]/50 border-[var(--border)]">
        <CardContent className="pt-4">
          <p className="text-sm text-[var(--muted-foreground)] mb-3">Conversation Mode:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'women_support', label: 'Support', icon: Heart },
              { id: 'mental_health', label: 'Wellness', icon: Brain },
              { id: 'career', label: 'Career', icon: Briefcase },
              { id: 'language_learning', label: 'Languages', icon: Globe },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={voiceContext === id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVoiceContext(id as VoiceContext)}
                className={`min-h-[44px] ${voiceContext === id ? 'bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white' : ''}`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--color-aurora-salmon)]/20 border border-[var(--color-aurora-salmon)]/30 rounded-lg p-3 text-center"
          >
            <p className="text-[var(--color-aurora-salmon)] text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Voice Interface */}
      <Card className="backdrop-blur-xl bg-[var(--card)]/50 border-[var(--border)]">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Voice Button */}
            <motion.div
              animate={{
                scale: isListening ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: isListening ? Infinity : 0,
              }}
            >
              <Button
                onClick={isListening ? stopListening : startListening}
                className={`w-32 h-32 rounded-full shadow-2xl min-w-[128px] min-h-[128px] ${
                  isListening
                    ? 'bg-gradient-to-br from-[var(--color-aurora-salmon)] to-[var(--color-aurora-pink)] hover:opacity-90'
                    : isProcessing
                    ? 'bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)] hover:opacity-90'
                    : 'bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90'
                }`}
                disabled={isSpeaking || isProcessing}
              >
                {isListening ? (
                  <MicOff className="w-16 h-16 text-white" />
                ) : isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-16 h-16 text-white" />
                  </motion.div>
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </Button>
            </motion.div>

            {/* Mute/Unmute Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setIsMuted(!isMuted);
              }}
              className="min-h-[44px] text-[var(--muted-foreground)]"
            >
              {isMuted ? <VolumeX className="w-5 h-5 mr-2" /> : <Volume2 className="w-5 h-5 mr-2" />}
              {isMuted ? 'Unmute Aurora' : 'Mute Aurora'}
            </Button>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--foreground)] mb-2">
                {isListening ? "Listening..." : isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : "Tap to start talking"}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {isListening ? "Speak naturally, I'm here to help" : "Tap the button and speak"}
              </p>
            </div>

            {/* Transcript Display */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full backdrop-blur-xl bg-[var(--accent)]/50 border border-[var(--border)] rounded-lg p-4"
                >
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">You said:</p>
                  <p className="text-[var(--foreground)]">{transcript}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response Display */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full backdrop-blur-xl bg-[var(--color-aurora-purple)]/20 border border-[var(--color-aurora-purple)]/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-[var(--color-aurora-pink)]">Aurora says:</p>
                    {!isMuted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakResponse(response)}
                        className="min-h-[36px] min-w-[36px] p-1"
                        disabled={isSpeaking}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-[var(--foreground)]">{response}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-[var(--card)]/50 border-[var(--border)]">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-salmon)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[var(--color-aurora-pink)]/50">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Mental Health Support</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Guided sessions for stress, anxiety, and emotional wellbeing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-[var(--card)]/50 border-[var(--border)]">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-blue)] to-[var(--color-aurora-purple)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[var(--color-aurora-blue)]/50">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Language Learning</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Practice conversations in 24 languages with cultural context
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-[var(--card)]/50 border-[var(--border)]">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-violet)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[var(--color-aurora-purple)]/50">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Career Coaching</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Interview practice, resume tips, and career guidance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Upgrade CTA */}
      {!isPremium && (
        <Card className="backdrop-blur-xl bg-gradient-to-br from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-pink)]/20 border-[var(--color-aurora-yellow)]/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-[var(--color-aurora-yellow)] mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">Upgrade to Premium</h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                Unlimited conversations • Advanced features • Priority support
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-[var(--foreground)]">${PREMIUM_PRICE}</span>
                <span className="text-[var(--muted-foreground)]">/month</span>
              </div>
              <Button className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 text-white shadow-lg min-h-[44px]">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
