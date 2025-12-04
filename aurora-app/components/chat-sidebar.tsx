"use client";

/**
 * Chat Sidebar Component
 * 
 * A floating/dockable chat panel similar to Reddit's chat feature.
 * Allows quick access to conversations without leaving the current page.
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, X, Minimize2, Maximize2, Search, Plus, ExternalLink
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  userId: Id<"users"> | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ userId, isOpen, onToggle }: ChatSidebarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"threads" | "requests">("threads");
  const router = useRouter();

  const conversations = useQuery(
    api.directMessages.getConversations,
    userId ? { userId } : "skip"
  );

  const searchResults = useQuery(
    api.directMessages.searchUsers,
    userId && searchQuery.length >= 2
      ? { query: searchQuery, currentUserId: userId }
      : "skip"
  );

  // Calculate total unread
  const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) || 0;

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-[var(--color-aurora-purple)] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Open chats"
      >
        <MessageSquare className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-aurora-pink)] rounded-full text-xs flex items-center justify-center font-bold">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-[var(--card)] border border-[var(--border)] shadow-2xl transition-all duration-300",
        isMinimized
          ? "bottom-4 right-4 w-72 h-14 rounded-2xl"
          : "bottom-4 right-4 w-80 sm:w-96 h-[500px] rounded-2xl overflow-hidden flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--color-aurora-purple)]" />
          <span className="font-semibold text-[var(--foreground)]">Chats</span>
          {totalUnread > 0 && (
            <Badge className="bg-[var(--color-aurora-pink)] text-white text-xs px-1.5 py-0">
              {totalUnread}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/messages")}
            className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
            title="Open full messages"
          >
            <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-[var(--muted-foreground)]" />
            ) : (
              <Minimize2 className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Search */}
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-[var(--background)] border-[var(--border)] rounded-xl"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab("threads")}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                activeTab === "threads"
                  ? "text-[var(--color-aurora-purple)] border-b-2 border-[var(--color-aurora-purple)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Threads
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "flex-1 py-2 text-sm font-medium transition-colors",
                activeTab === "requests"
                  ? "text-[var(--color-aurora-purple)] border-b-2 border-[var(--color-aurora-purple)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Requests
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {/* Search Results */}
            {searchQuery.length >= 2 && searchResults && (
              <div className="p-2">
                <p className="text-xs text-[var(--muted-foreground)] px-2 mb-2">Search Results</p>
                {searchResults.map((user: any) => (
                  <button
                    key={user._id}
                    onClick={() => {
                      router.push(`/messages/${user._id}`);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--accent)] transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm text-[var(--foreground)]">{user.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Start conversation</p>
                    </div>
                    <Plus className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  </button>
                ))}
              </div>
            )}

            {/* Conversations */}
            {!searchQuery && conversations && conversations.length > 0 && (
              <div className="p-2 space-y-1">
                {conversations.map((conv: any) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => router.push(`/messages/${conv.partnerId}`)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--accent)] transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv.partner?.profileImage} />
                        <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                          {conv.partner?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-aurora-pink)] rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "font-medium text-sm truncate",
                          conv.unreadCount > 0 ? "text-[var(--foreground)]" : "text-[var(--foreground)]/80"
                        )}>
                          {conv.partner?.name || "Unknown"}
                        </p>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {formatDistanceToNow(conv.lastMessage.timestamp, { addSuffix: false })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        conv.unreadCount > 0 ? "text-[var(--foreground)]/80 font-medium" : "text-[var(--muted-foreground)]"
                      )}>
                        {conv.lastMessage.isFromMe && "You: "}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && conversations && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-aurora-lavender)]/30 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-[var(--color-aurora-purple)]" />
                </div>
                <p className="font-medium text-[var(--foreground)] mb-1">Welcome to chat!</p>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Start a conversation with other women in the community
                </p>
                <Button
                  onClick={() => router.push("/messages")}
                  className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start new chat
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
