"use client";

/**
 * Financial Wellness Page - Aurora App AI Financial Advisor
 * 
 * Chat-first financial planning where:
 * - Users talk to Aurora App AI for financial advice
 * - Metrics update in real-time based on conversation
 * - Financial planning is centralized in the chat
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  TrendingUp,
  Target,
  PiggyBank,
  Send,
  Sparkles,
  DollarSign,
  Shield,
  BarChart3,
  Wallet,
  ArrowUp,
  ArrowDown,
  Bot,
  User,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

// Quick action suggestions for the chat
const quickActions = [
  { text: "Help me create a budget", icon: "📊" },
  { text: "I want to save for an emergency fund", icon: "🛡️" },
  { text: "How can I reduce my expenses?", icon: "💡" },
  { text: "I have $500 debt, what should I do?", icon: "💳" },
  { text: "Tips for negotiating my salary", icon: "💼" },
  { text: "How much should I save monthly?", icon: "🎯" },
];

export default function FinancePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) setUserId(data.userId as Id<"users">);
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Queries
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const chatHistory = useQuery(
    api.financialChat.getChatHistory,
    userId ? { userId, limit: 100 } : "skip"
  );
  const financialProfile = useQuery(
    api.financialChat.getFinancialProfile,
    userId ? { userId } : "skip"
  );
  const financialGoals = useQuery(
    api.financialChat.getFinancialGoals,
    userId ? { userId } : "skip"
  );

  // Mutations
  const sendFinancialMessage = useMutation(api.financialChat.sendFinancialMessage);
  const clearChatHistory = useMutation(api.financialChat.clearChatHistory);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !userId || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    setIsLoading(true);

    try {
      // Call AI API for financial advice
      const response = await fetch("/api/ai/financial-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, userId }),
      });

      const data = await response.json();

      // Save to Convex
      await sendFinancialMessage({
        userId,
        message: userMessage,
        aiResponse: data.response || "I'm here to help with your financial planning. Could you tell me more?",
        extractedData: data.extractedData,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Save error response
      await sendFinancialMessage({
        userId,
        message: userMessage,
        aiResponse: "I apologize, I'm having trouble processing that right now. Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [message, userId, isLoading, sendFinancialMessage]);

  // Handle quick action click
  const handleQuickAction = (text: string) => {
    setMessage(text);
    textareaRef.current?.focus();
  };

  // Handle clear chat
  const handleClearChat = async () => {
    if (!userId) return;
    if (confirm("Are you sure you want to clear your chat history? Your financial profile will be kept.")) {
      await clearChatHistory({ userId });
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-mint)]/20 border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">Financial Wellness</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Chat with Aurora App AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className="text-[var(--muted-foreground)]"
              >
                {showMetrics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Metrics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-[var(--muted-foreground)]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Metrics Panel */}
      <AnimatePresence>
        {showMetrics && financialProfile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border)] overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Wellness Score */}
                <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">Wellness</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{financialProfile.wellnessScore}</p>
                    <Progress value={financialProfile.wellnessScore} className="h-1 mt-1" />
                  </CardContent>
                </Card>

                {/* Savings Rate */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <PiggyBank className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">Savings Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{financialProfile.savingsRate}%</p>
                    <p className="text-xs text-[var(--color-aurora-mint)]">
                      {financialProfile.savingsRate >= 20 ? "Excellent!" : financialProfile.savingsRate >= 10 ? "Good" : "Needs work"}
                    </p>
                  </CardContent>
                </Card>

                {/* Monthly Income */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-[var(--muted-foreground)]">Income</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">${financialProfile.monthlyIncome}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">monthly</p>
                  </CardContent>
                </Card>

                {/* Monthly Expenses */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDown className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">Expenses</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">${financialProfile.monthlyExpenses}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">monthly</p>
                  </CardContent>
                </Card>

                {/* Emergency Fund */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">Emergency</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{financialProfile.emergencyFundMonths}mo</p>
                    <p className="text-xs text-[var(--muted-foreground)]">of expenses</p>
                  </CardContent>
                </Card>

                {/* Debt Ratio */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                      <span className="text-xs text-[var(--muted-foreground)]">Debt Ratio</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{financialProfile.debtToIncomeRatio}%</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {financialProfile.debtToIncomeRatio === 0 ? "Debt free!" : financialProfile.debtToIncomeRatio < 20 ? "Healthy" : "High"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Goals Progress */}
              {financialGoals && financialGoals.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {financialGoals.map((goal) => (
                    <div
                      key={goal._id}
                      className="flex-shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 min-w-[180px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">{goal.title}</span>
                        <Target className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      </div>
                      <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-1.5 mb-1" />
                      <p className="text-xs text-[var(--muted-foreground)]">
                        ${goal.currentAmount} / ${goal.targetAmount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          {/* Welcome Message if no chat history */}
          {(!chatHistory || chatHistory.length === 0) && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Image src="/Au_Logo_1.png" alt="Aurora App" width={48} height={48} className="rounded-xl" />
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Hi! I'm your Aurora App Financial Advisor 💰
              </h2>
              <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                I'm here to help you plan your finances, set goals, and make smarter money decisions. 
                Just chat with me and I'll update your financial metrics in real-time!
              </p>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-lg mx-auto">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.text)}
                    className="flex items-center gap-2 p-3 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:border-[var(--color-aurora-purple)]/50 transition-colors text-left"
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span className="text-sm text-[var(--foreground)]">{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="space-y-4">
            {chatHistory?.map((chat, idx) => (
              <div key={chat._id || idx} className="space-y-3">
                {/* User Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[80%] bg-[var(--color-aurora-purple)] text-white rounded-2xl rounded-br-md px-4 py-3">
                    <p className="text-sm">{chat.userMessage}</p>
                  </div>
                </motion.div>

                {/* AI Response */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[80%]">
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-tl-md px-4 py-3">
                      <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{chat.aiResponse}</p>
                    </div>
                    {/* Show extracted data badge if any */}
                    {chat.extractedData && Object.keys(chat.extractedData).some(k => chat.extractedData?.[k as keyof typeof chat.extractedData] !== undefined) && (
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0 text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Metrics updated
                        </Badge>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
                    <span className="text-sm text-[var(--muted-foreground)]">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about budgeting, savings, investments, debt..."
              className="min-h-[48px] max-h-[120px] resize-none rounded-xl border-[var(--border)] focus:border-[var(--color-aurora-purple)]"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/90 text-white rounded-xl min-w-[48px] h-[48px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-2 text-center">
            🔒 Your financial data is private and secure. Aurora App never shares your information.
          </p>
        </div>
      </div>
    </div>
  );
}
