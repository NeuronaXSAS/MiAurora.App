"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAvatar } from '@/hooks/use-avatar';
import { 
  Send, Sparkles, Heart, Mic, MicOff, Volume2, VolumeX,
  MoreHorizontal, Smile
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface AIChatCompanionProps {
  onSendMessage?: (message: string) => Promise<string>;
  className?: string;
}

// Aurora AI Avatar Component
function AuroraAvatar({ isTyping = false }: { isTyping?: boolean }) {
  return (
    <motion.div 
      className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B7A] via-[#8B5CF6] to-[#FFC285] p-0.5"
      animate={isTyping ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <div className="w-full h-full rounded-full bg-[#150F22] flex items-center justify-center overflow-hidden">
        <motion.div
          animate={isTyping ? { y: [0, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <Sparkles className="w-6 h-6 text-[#FF6B7A]" />
        </motion.div>
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF6B7A] to-[#8B5CF6] opacity-30 blur-md -z-10" />
    </motion.div>
  );
}

// User Avatar Component
function UserAvatar({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFE8E8] to-[#FFC285] flex items-center justify-center overflow-hidden">
      {avatarUrl ? (
        <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
      ) : (
        <Heart className="w-5 h-5 text-[#150F22]" />
      )}
    </div>
  );
}

// Typing Indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#FF6B7A]"
          animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export function AIChatCompanion({ onSendMessage, className }: AIChatCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi beautiful! I'm Aurora, your AI companion. I'm here to support you, listen to you, and help you navigate life safely. How are you feeling today? 💜",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { avatarUrl } = useAvatar();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      return "I hear you, and your feelings are completely valid. It's okay to not be okay sometimes. Would you like to talk about what's weighing on your heart? I'm here to listen without judgment. 💜";
    }
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
      return "Anxiety can feel overwhelming, but you're not alone in this. Let's take a deep breath together. Would you like me to guide you through a quick calming exercise? 🌸";
    }
    if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
      return "That's wonderful to hear! Your joy is contagious ✨ What's bringing you happiness today? I'd love to celebrate with you!";
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('emergency') || lowerMessage.includes('danger')) {
      return "I'm here for you. If you're in immediate danger, please use the SOS button or call emergency services. If you need to talk, I'm listening. Your safety is my priority. 🛡️";
    }
    
    const responses = [
      "I hear you, and your feelings are completely valid. Remember, you're stronger than you know. 💪✨",
      "That sounds challenging. Would you like to talk about what's making you feel this way? I'm here to listen. 🤗",
      "You're doing amazing by reaching out. Taking care of your mental health is so important. What would help you feel better right now? 💜",
      "I'm proud of you for sharing that with me. Your feelings matter, and so do you. 🌸",
      "Thank you for trusting me with this. Together, we can work through anything. What's on your mind? ✨",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const typingMessage: Message = {
      id: 'typing',
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = onSendMessage 
        ? await onSendMessage(inputValue)
        : await simulateAIResponse(inputValue);

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [...filtered, {
          id: Date.now().toString(),
          content: response,
          isUser: false,
          timestamp: new Date(),
        }];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-[#150F22] to-[#1E1535] rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <AuroraAvatar />
          <div>
            <h3 className="text-white font-semibold">Aurora AI</h3>
            <p className="text-[#FF6B7A] text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Always here for you
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="min-w-[44px] min-h-[44px] text-white/60 hover:text-white hover:bg-white/10"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="min-w-[44px] min-h-[44px] text-white/60 hover:text-white hover:bg-white/10"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex gap-3",
                message.isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {message.isUser ? (
                <UserAvatar avatarUrl={avatarUrl} />
              ) : (
                <AuroraAvatar isTyping={message.isTyping} />
              )}
              
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3",
                message.isUser 
                  ? "bg-gradient-to-r from-[#FF6B7A] to-[#E84D5F] text-white rounded-tr-sm"
                  : "bg-white/10 text-white rounded-tl-sm border border-white/10"
              )}>
                {message.isTyping ? (
                  <TypingIndicator />
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
                {!message.isTyping && (
                  <p className={cn(
                    "text-xs mt-2",
                    message.isUser ? "text-white/70" : "text-white/40"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="min-w-[44px] min-h-[44px] text-white/60 hover:text-white hover:bg-white/10 shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-12 rounded-full min-h-[44px]"
              disabled={isLoading}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRecording(!isRecording)}
            className={cn(
              "shrink-0 transition-colors min-w-[44px] min-h-[44px]",
              isRecording 
                ? "text-[#FF6B7A] bg-[#FF6B7A]/20 hover:bg-[#FF6B7A]/30" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="min-w-[44px] min-h-[44px] bg-gradient-to-r from-[#FF6B7A] to-[#E84D5F] hover:from-[#E84D5F] hover:to-[#C73A4D] text-white rounded-full shrink-0"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
