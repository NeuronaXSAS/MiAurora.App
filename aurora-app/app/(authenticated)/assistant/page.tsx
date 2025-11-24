"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AIShareDialog } from "@/components/ai-share-dialog";
import { AIVoiceAssistant } from "@/components/ai-voice-assistant";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Sparkles, Loader2, Share2, Mic, MessageSquare, Heart, Brain } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AssistantPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = useAction(api.ai.chat);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Fetch chat history
  const messages = useQuery(
    api.ai.getHistory,
    userId ? { userId, limit: 50 } : "skip"
  );

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !userId || isLoading) return;

    const userMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      await chat({
        userId,
        message: userMessage,
      });
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950/30 to-pink-950/20">
      {/* Sanctuary Header */}
      <div className="backdrop-blur-xl bg-gradient-to-r from-aurora-lavender/20 to-aurora-pink/20 border-b border-aurora-lavender/20">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-aurora-lavender to-aurora-pink rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-aurora-lavender/50">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-aurora-lavender to-aurora-pink">Your Digital Therapist</h1>
                <p className="text-xs sm:text-sm text-gray-300 truncate">
                  A safe space for your thoughts and feelings
                </p>
              </div>
            </div>
            {messages && messages.length >= 2 && activeTab === "chat" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="flex-shrink-0 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-aurora-lavender/10 border border-aurora-lavender/30">
              <TabsTrigger value="chat" className="data-[state=active]:bg-aurora-lavender data-[state=active]:text-slate-900">
                <MessageSquare className="w-4 h-4 mr-2" />
                Text Chat
              </TabsTrigger>
              <TabsTrigger value="voice" className="data-[state=active]:bg-aurora-lavender data-[state=active]:text-slate-900">
                <Mic className="w-4 h-4 mr-2" />
                Voice Companion
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {activeTab === "voice" ? (
          <div className="max-w-4xl mx-auto">
            <AIVoiceAssistant 
              userId={userId || undefined}
              userCredits={user?.credits || 0}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Welcome Message */}
          {(!messages || messages.length === 0) && (
            <div className="backdrop-blur-xl bg-aurora-lavender/10 border border-aurora-lavender/30 rounded-lg p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-aurora-lavender to-aurora-pink rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-aurora-lavender/50">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-white">
                    Welcome to your safe space, {user?.name && user.name !== 'null' ? user.name.split(" ")[0] : "friend"} 💜
                  </h3>
                  <p className="text-gray-300 mb-4">
                    I'm here to support your mental and emotional wellbeing. This is a judgment-free zone where you can:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Share your thoughts and feelings openly</li>
                    <li>• Get career guidance and professional advice</li>
                    <li>• Discuss workplace challenges and safety concerns</li>
                    <li>• Explore opportunities for growth and development</li>
                    <li>• Receive emotional support and encouragement</li>
                    <li>• Practice self-reflection and mindfulness</li>
                  </ul>
                  <div className="mt-4 p-3 bg-aurora-pink/10 border border-aurora-pink/20 rounded-lg">
                    <p className="text-sm text-gray-200 italic">
                      💡 Remember: While I'm here to support you, I'm an AI assistant. For serious mental health concerns, please reach out to a licensed professional.
                    </p>
                  </div>
                  <p className="text-gray-300 mt-4">
                    What's on your mind today?
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages?.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 sm:gap-4 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-aurora-lavender to-aurora-pink rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-aurora-lavender/30">
                  <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              ) : (
                <Avatar className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[80%] transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-aurora-pink/80 to-aurora-pink text-white shadow-lg shadow-aurora-pink/30"
                    : "backdrop-blur-xl bg-aurora-lavender/10 border border-aurora-lavender/30 text-white shadow-lg"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-4 animate-in fade-in duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-aurora-lavender to-aurora-pink rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-aurora-lavender/50">
                <Heart className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="backdrop-blur-xl bg-aurora-lavender/10 border border-aurora-lavender/30 rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-aurora-lavender" />
                  <span className="text-gray-300">Listening and reflecting...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - Only show for chat tab */}
      {activeTab === "chat" && (
        <div className="backdrop-blur-xl bg-white/5 border-t border-white/10 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind... I'm here to listen 💜"
                className="flex-1 min-h-[60px] max-h-[200px] bg-aurora-lavender/5 border-aurora-lavender/30 text-white placeholder:text-gray-400 focus:border-aurora-lavender/50 transition-colors"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                size="lg"
                className="px-6 bg-gradient-to-r from-aurora-lavender to-aurora-pink hover:from-aurora-lavender/90 hover:to-aurora-pink/90 text-white shadow-lg shadow-aurora-lavender/30"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
              <Brain className="w-3 h-3" />
              This is a safe, confidential space • Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {userId && (
        <AIShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          userId={userId}
        />
      )}
    </div>
  );
}
