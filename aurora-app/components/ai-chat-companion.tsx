"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAvatar } from '@/hooks/use-avatar';
import { 
  Send, Sparkles, Heart, Mic, MicOff, Volume2, VolumeX,
  MoreHorizontal, Smile, Trash2, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onClose?: () => void;
  className?: string;
}

// Aurora AI Avatar Component
function AuroraAvatar({ isTyping = false }: { isTyping?: boolean }) {
  return (
    <motion.div 
      className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-aurora-pink)] via-[var(--color-aurora-purple)] to-[var(--color-aurora-yellow)] p-0.5"
      animate={isTyping ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
    >
      <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center overflow-hidden">
        <motion.div
          animate={isTyping ? { y: [0, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          <Sparkles className="w-6 h-6 text-[var(--color-aurora-pink)]" />
        </motion.div>
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] opacity-30 blur-md -z-10" />
    </motion.div>
  );
}

// User Avatar Component
function UserAvatar({ avatarUrl }: { avatarUrl?: string | null }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] flex items-center justify-center overflow-hidden">
      {avatarUrl ? (
        <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
      ) : (
        <Heart className="w-5 h-5 text-[var(--foreground)]" />
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
          className="w-2 h-2 rounded-full bg-[var(--color-aurora-pink)]"
          animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export function AIChatCompanion({ onSendMessage, onClose, className }: AIChatCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi beautiful! I'm Aurora, your AI companion. I'm here to support you, listen to you, and help you navigate life safely. How are you feeling today? 💜",
      isUser: false,
      timestamp: new Date(),
    },
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

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter(m => !m.isTyping)
        .map(m => ({ isUser: m.isUser, content: m.content }));

      // Get user info for rate limiting
      let userId = null;
      let isPremium = false;
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        userId = authData.userId;
        isPremium = authData.isPremium || false;
      } catch (e) {
        // Continue without auth
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
          userId,
          isPremium,
        }),
      });

      const data = await response.json();

      // Handle rate limit error
      if (response.status === 429) {
        if (data.upgradeToPremium) {
          return `💜 ${data.message}\n\n✨ [Upgrade to Aurora Premium](/premium) for unlimited conversations with me!`;
        }
        return `💜 ${data.message}`;
      }

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback responses
      const fallbacks = [
        "I hear you, and your feelings are completely valid. Remember, you're stronger than you know. 💪✨",
        "That sounds challenging. Would you like to talk about what's making you feel this way? I'm here to listen. 🤗",
        "You're doing amazing by reaching out. What would help you feel better right now? 💜",
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
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
        : await getAIResponse(inputValue);

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
    <div className={cn("flex flex-col h-full bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10">
        <div className="flex items-center gap-3">
          <AuroraAvatar />
          <div>
            <h3 className="text-[var(--foreground)] font-semibold">Aurora AI</h3>
            <p className="text-[var(--color-aurora-pink)] text-sm flex items-center gap-1">
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
            className="min-w-[44px] min-h-[44px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-w-[44px] min-h-[44px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm('Are you sure you want to clear the chat history?')) {
                    setMessages([{
                      id: Date.now().toString(),
                      content: "Hi beautiful! I'm Aurora, your AI companion. I'm here to support you, listen to you, and help you navigate life safely. How are you feeling today? 💜",
                      isUser: false,
                      timestamp: new Date(),
                    }]);
                  }
                }}
                className="text-[var(--foreground)] hover:bg-[var(--accent)] cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2 text-[var(--color-aurora-salmon)]" />
                Clear Chat History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] text-[var(--muted-foreground)] hover:text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
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
                  ? "bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white rounded-tr-sm"
                  : "bg-[var(--accent)] text-[var(--foreground)] rounded-tl-sm border border-[var(--border)]"
              )}>
                {message.isTyping ? (
                  <TypingIndicator />
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
                {!message.isTyping && (
                  <p className={cn(
                    "text-xs mt-2",
                    message.isUser ? "text-white/70" : "text-[var(--muted-foreground)]"
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
      <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="min-w-[44px] min-h-[44px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] pr-12 rounded-full min-h-[44px]"
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
                ? "text-[var(--color-aurora-pink)] bg-[var(--color-aurora-pink)]/20 hover:bg-[var(--color-aurora-pink)]/30" 
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            )}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="min-w-[44px] min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] hover:opacity-90 text-white rounded-full shrink-0"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
