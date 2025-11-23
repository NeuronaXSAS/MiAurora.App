"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Image as ImageIcon } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function ConversationPage() {
  const params = useParams();
  const otherUserId = params.userId as Id<"users">;
  const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setCurrentUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  const messages = useQuery(
    api.directMessages.getConversation,
    currentUserId ? { userId: currentUserId, otherUserId } : "skip"
  );

  const otherUser = useQuery(
    api.users.getUser,
    otherUserId ? { userId: otherUserId } : "skip"
  );

  const sendMessage = useMutation(api.directMessages.send);
  const markAsRead = useMutation(api.directMessages.markAsRead);

  // Mark messages as read when viewing
  useEffect(() => {
    if (currentUserId && otherUserId) {
      markAsRead({ userId: currentUserId, otherUserId });
    }
  }, [currentUserId, otherUserId, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!currentUserId || !messageText.trim()) return;

    setSending(true);
    try {
      await sendMessage({
        senderId: currentUserId,
        receiverId: otherUserId,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/messages")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src={otherUser?.profileImage} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{otherUser?.name || "Loading..."}</p>
              <p className="text-xs text-gray-500">
                Trust Score: {otherUser?.trustScore || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {!messages && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading messages...</p>
            </div>
          )}

          {messages && messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}

          {messages &&
            messages.map((msg: any) => {
              const isFromMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      isFromMe
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-900"
                    } rounded-2xl px-4 py-2 shadow-sm`}
                  >
                    {!isFromMe && (
                      <p className="text-xs font-semibold mb-1">
                        {msg.sender?.name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isFromMe ? "text-purple-200" : "text-gray-500"
                      }`}
                    >
                      {formatDistanceToNow(msg._creationTime, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="bg-purple-600 hover:bg-purple-700 h-[60px] px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
