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
import { Send, Sparkles, Loader2, Share2, Mic, MessageSquare } from "lucide-react";
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AI Companion</h1>
                <p className="text-xs sm:text-sm text-gray-300 truncate">
                  Chat or talk with Aurora
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
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
                <MessageSquare className="w-4 h-4 mr-2" />
                Text Chat
              </TabsTrigger>
              <TabsTrigger value="voice" className="data-[state=active]:bg-purple-600">
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
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-white">
                    Hi {user?.name && user.name !== 'null' ? user.name.split(" ")[0] : "there"}! 👋
                  </h3>
                  <p className="text-gray-300 mb-4">
                    I'm Aurora, your AI assistant. I'm here to help you with:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Career advice and job search strategies</li>
                    <li>• Safety recommendations for workplaces and locations</li>
                    <li>• Navigating opportunities on the platform</li>
                    <li>• Tips on earning more credits</li>
                    <li>• Any questions about your career journey</li>
                  </ul>
                  <p className="text-gray-300 mt-4">
                    What would you like to know?
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              ) : (
                <Avatar className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                    : "backdrop-blur-xl bg-white/10 border border-white/20 text-white shadow-lg"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-gray-300">Aurora is thinking...</span>
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
                placeholder="Ask me anything about your career, safety, or opportunities..."
                className="flex-1 min-h-[60px] max-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                size="lg"
                className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Press Enter to send, Shift+Enter for new line
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
