"use client";

import { useState, useRef, useEffect } from "react";
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

interface AIVoiceAssistantProps {
  userId?: string;
  userCredits?: number;
  onCreditsUpdate?: (newCredits: number) => void;
}

export function AIVoiceAssistant({ userId, userCredits = 0, onCreditsUpdate }: AIVoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [dailyMinutesUsed, setDailyMinutesUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const FREE_DAILY_MINUTES = 30;
  const PREMIUM_PRICE = 9.99;

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Default, will be dynamic

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (!isPremium && dailyMinutesUsed >= FREE_DAILY_MINUTES) {
      alert(`You've reached your daily limit of ${FREE_DAILY_MINUTES} minutes. Upgrade to Premium for unlimited access!`);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      
      // Start session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => {
          if (prev % 60 === 0 && prev > 0) {
            setDailyMinutesUsed(m => m + 1);
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      
      // Process with Gemini
      processWithGemini(transcript);
    }
  };

  const processWithGemini = async (text: string) => {
    if (!text.trim()) return;

    setIsSpeaking(true);
    
    try {
      // Call Gemini API (you'll need to implement this endpoint)
      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userId,
          context: 'women_support',
        }),
      });

      const data = await response.json();
      setResponse(data.response);
      
      // Speak the response
      speakResponse(data.response);
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      setResponse("I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsSpeaking(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingMinutes = isPremium ? '∞' : Math.max(0, FREE_DAILY_MINUTES - dailyMinutesUsed);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Aurora Voice Companion</h2>
              <p className="text-sm text-gray-300 font-normal">Your AI companion for support, learning & growth</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Session</p>
              <p className="text-lg font-bold text-white">{formatTime(sessionTime)}</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-3 text-center">
              <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Daily Remaining</p>
              <p className="text-lg font-bold text-white">{remainingMinutes} min</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-3 text-center">
              <Globe className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Languages</p>
              <p className="text-lg font-bold text-white">50+</p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-3 text-center">
              <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-gray-300">Status</p>
              <Badge className={isPremium ? "bg-gradient-to-r from-yellow-600 to-orange-600" : "bg-gray-600"}>
                {isPremium ? "Premium" : "Free"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Voice Interface */}
      <Card className="backdrop-blur-xl bg-white/10 border-white/20">
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
                className={`w-32 h-32 rounded-full shadow-2xl ${
                  isListening
                    ? 'bg-gradient-to-br from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                    : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
                disabled={isSpeaking}
              >
                {isListening ? (
                  <MicOff className="w-16 h-16 text-white" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}
              </Button>
            </motion.div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-lg font-semibold text-white mb-2">
                {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to start talking"}
              </p>
              <p className="text-sm text-gray-400">
                {isListening ? "Speak naturally, I'm here to help" : "Press and hold to speak"}
              </p>
            </div>

            {/* Transcript Display */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full backdrop-blur-xl bg-white/5 border border-white/20 rounded-lg p-4"
                >
                  <p className="text-sm text-gray-400 mb-1">You said:</p>
                  <p className="text-white">{transcript}</p>
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
                  className="w-full backdrop-blur-xl bg-purple-500/20 border border-purple-500/30 rounded-lg p-4"
                >
                  <p className="text-sm text-purple-300 mb-1">Aurora says:</p>
                  <p className="text-white">{response}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/50">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Mental Health Support</h3>
              <p className="text-sm text-gray-300">
                Guided sessions for stress, anxiety, and emotional wellbeing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/50">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Language Learning</h3>
              <p className="text-sm text-gray-300">
                Practice conversations in 50+ languages with cultural context
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/10 border-white/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/50">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Career Coaching</h3>
              <p className="text-sm text-gray-300">
                Interview practice, resume tips, and career guidance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Upgrade CTA */}
      {!isPremium && (
        <Card className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h3>
              <p className="text-gray-300 mb-4">
                Unlimited conversations • Advanced features • Priority support
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-white">${PREMIUM_PRICE}</span>
                <span className="text-gray-300">/month</span>
              </div>
              <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
