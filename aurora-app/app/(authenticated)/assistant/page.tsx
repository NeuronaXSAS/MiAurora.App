"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AIShareDialog } from "@/components/ai-share-dialog";
import { AIVoiceAssistant } from "@/components/ai-voice-assistant";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Share2, Mic, MessageSquare, Heart, Brain, BarChart3, Search } from "lucide-react";
import { AIInteractionsDashboard } from "@/components/ai-interactions-dashboard";
import { AIAnswers } from "@/components/ai-answers";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import { useAuthSession } from "@/hooks/use-auth-session";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authToken, userId } = useAuthSession();

  // Fetch chat history
  const messages = useQuery(
    api.ai.getHistory,
    userId && authToken ? { authToken, userId, limit: 50 } : "skip"
  );
  const wellnessProfile = useQuery(
    api.ai.getWellnessProfile,
    userId && authToken ? { authToken, userId } : "skip"
  );

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Get user's avatar URL using their saved avatar config
  const getUserAvatarUrl = () => {
    if (user?.avatarConfig) {
      return generateAvatarUrl(user.avatarConfig as AvatarConfig);
    }
    return null;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !userId || !authToken || isLoading) return;

    const userMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: (messages || []).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok && response.status !== 429) {
        throw new Error("Failed to send message");
      }
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
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                {getUserAvatarUrl() ? (
                  <img src={getUserAvatarUrl()!} alt="Your Aurora" className="w-full h-full" />
                ) : (
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Aurora AI</h1>
                <p className="text-xs sm:text-sm text-[var(--color-aurora-pink)] truncate flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Always here for you
                </p>
              </div>
            </div>
            {messages && messages.length >= 2 && activeTab === "chat" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="flex-shrink-0 border-[var(--border)]"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-[var(--color-aurora-lavender)]/10 border border-[var(--color-aurora-lavender)]/30">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="voice" 
                className="data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white"
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice
              </TabsTrigger>
              <TabsTrigger 
                value="answers" 
                className="data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Answers
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {activeTab === "answers" ? (
          <div className="max-w-4xl mx-auto">
            <AIAnswers userId={userId || undefined} />
          </div>
        ) : activeTab === "stats" && userId ? (
          <div className="max-w-4xl mx-auto">
            <AIInteractionsDashboard authToken={authToken} userId={userId} />
          </div>
        ) : activeTab === "voice" ? (
          <div className="max-w-4xl mx-auto">
            <AIVoiceAssistant 
              userId={userId || undefined}
              userCredits={user?.credits || 0}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {wellnessProfile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Wellbeing",
                  value: wellnessProfile.wellbeingScore,
                  className: "bg-[var(--color-aurora-pink)]/15 text-[var(--color-aurora-pink)]",
                },
                {
                  label: "Clarity",
                  value: wellnessProfile.clarityScore,
                  className: "bg-[var(--color-aurora-lavender)]/20 text-[var(--color-aurora-violet)]",
                },
                {
                  label: "Support",
                  value: wellnessProfile.supportScore,
                  className: "bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-violet)]",
                },
                {
                  label: "Resilience",
                  value: wellnessProfile.resilienceScore,
                  className: "bg-[var(--color-aurora-yellow)]/25 text-[var(--color-aurora-violet)]",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border border-[var(--border)] p-4 shadow-sm ${stat.className}`}
                >
                  <p className="text-xs uppercase tracking-[0.18em] opacity-70">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Welcome Message */}
          {(!messages || messages.length === 0) && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                  {getUserAvatarUrl() ? (
                    <img src={getUserAvatarUrl()!} alt="Your Aurora" className="w-full h-full" />
                  ) : (
                    <Heart className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-[var(--foreground)]">
                    Welcome to your safe space, {user?.name && user.name !== 'null' ? user.name.split(" ")[0] : "friend"} 💜
                  </h3>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    I&apos;m here to support your mental and emotional wellbeing. This is a judgment-free zone where you can:
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-pink)]" />
                      Share your thoughts and feelings openly
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-purple)]" />
                      Get career guidance and professional advice
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-blue)]" />
                      Discuss workplace challenges and safety concerns
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-aurora-lavender)]" />
                      Receive emotional support and encouragement
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-[var(--color-aurora-pink)]/10 border border-[var(--color-aurora-pink)]/20 rounded-xl">
                    <p className="text-sm text-[var(--muted-foreground)] italic">
                      Aurora can help you reflect, plan, and name red flags. If you are in immediate danger or crisis, use SOS or contact local emergency support right away.
                    </p>
                  </div>
                  <p className="text-[var(--foreground)] mt-4 font-medium">
                    What&apos;s on your mind today?
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                  {getUserAvatarUrl() ? (
                    <img src={getUserAvatarUrl()!} alt="Your Aurora" className="w-full h-full" />
                  ) : (
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
              ) : (
                <Avatar className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 border-2 border-[var(--color-aurora-purple)]">
                  <AvatarFallback className="text-xs sm:text-sm bg-[var(--color-aurora-purple)] text-white">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-2xl p-3 sm:p-4 max-w-[85%] sm:max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-[var(--color-aurora-purple)] text-white shadow-md"
                    : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] shadow-md"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-aurora-lavender)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                {getUserAvatarUrl() ? (
                  <img src={getUserAvatarUrl()!} alt="Your Aurora" className="w-full h-full animate-pulse" />
                ) : (
                  <Heart className="w-5 h-5 text-white animate-pulse" />
                )}
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
                  <span className="text-[var(--muted-foreground)]">Thinking...</span>
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
        <div className="bg-[var(--card)] border-t border-[var(--border)] p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share what's on your mind... I'm here to listen 💜"
                className="flex-1 min-h-[60px] max-h-[200px] bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--color-aurora-purple)] rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                size="lg"
                className="px-6 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-xl min-h-[60px]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-2 flex items-center gap-2">
              <Brain className="w-3 h-3" />
              This is a safe, confidential space • Press Enter to send
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
