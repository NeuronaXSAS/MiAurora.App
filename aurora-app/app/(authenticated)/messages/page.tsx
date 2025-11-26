"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[var(--color-aurora-purple)]" />
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">Messages</h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Connect with the community
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSearch(!showSearch)}
              className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search users to message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 min-h-[44px] bg-[var(--background)] border-[var(--border)]"
                />
              </div>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && (
                <Card className="mt-2 bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-2">
                    {searchResults.map((user: any) => (
                      <button
                        key={user._id}
                        onClick={() => {
                          router.push(`/messages/${user._id}`);
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-3 p-3 min-h-[56px] hover:bg-[var(--accent)] rounded-lg transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={user.profileImage} />
                          <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-[var(--foreground)]">{user.name}</p>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {user.location || "Aurora App Community"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                          Trust: {user.trustScore}
                        </Badge>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Onboarding Info Card - Show when no conversations */}
          {conversations && conversations.length === 0 && (
            <div className="bg-[var(--color-aurora-lavender)]/10 border border-[var(--color-aurora-lavender)]/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1">Private & Secure Messaging</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Connect directly with other Aurora App members. All messages are encrypted and private. 
                    Use the search above to find community members by name or location.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] px-2 py-1 rounded-full">🔒 End-to-end encrypted</span>
                    <span className="text-xs bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] px-2 py-1 rounded-full">👥 Community connections</span>
                    <span className="text-xs bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] px-2 py-1 rounded-full">💜 Support network</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!conversations && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">Loading conversations...</p>
            </div>
          )}

          {conversations && conversations.length === 0 && (
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-16 h-16 text-[var(--color-aurora-lavender)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No messages yet</h3>
                <p className="text-[var(--muted-foreground)] mb-4">
                  Start a conversation with someone from the community
                </p>
                <Button onClick={() => setShowSearch(true)} className="min-h-[44px] bg-[var(--color-aurora-purple)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Messaging
                </Button>
              </CardContent>
            </Card>
          )}

          {conversations && conversations.length > 0 && (
            <div className="space-y-2">
              {conversations.map((conv: any) => (
                <Card
                  key={conv.partnerId}
                  className="hover:shadow-lg cursor-pointer bg-[var(--card)] border-[var(--border)] transition-shadow"
                  onClick={() => router.push(`/messages/${conv.partnerId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.partner?.profileImage} />
                        <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                          {conv.partner?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate text-[var(--foreground)]">
                            {conv.partner?.name || "Unknown User"}
                          </p>
                          <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0 ml-2">
                            {formatDistanceToNow(conv.lastMessage.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[var(--muted-foreground)] truncate">
                            {conv.lastMessage.isFromMe && "You: "}
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-[var(--color-aurora-purple)] ml-2 flex-shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
