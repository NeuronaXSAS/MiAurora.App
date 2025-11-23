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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold">Messages</h1>
                <p className="text-sm text-gray-600">
                  Connect with the community
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users to message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && (
                <Card className="mt-2">
                  <CardContent className="p-2">
                    {searchResults.map((user: any) => (
                      <button
                        key={user._id}
                        onClick={() => {
                          router.push(`/messages/${user._id}`);
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={user.profileImage} />
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            {user.location || "Aurora Community"}
                          </p>
                        </div>
                        <Badge variant="secondary">
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
          {!conversations && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          )}

          {conversations && conversations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">
                  Start a conversation with someone from the community
                </p>
                <Button onClick={() => setShowSearch(true)}>
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
                  className="hover-lift cursor-pointer"
                  onClick={() => router.push(`/messages/${conv.partnerId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.partner?.profileImage} />
                        <AvatarFallback>
                          {conv.partner?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">
                            {conv.partner?.name || "Unknown User"}
                          </p>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(conv.lastMessage.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {conv.lastMessage.isFromMe && "You: "}
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-purple-600 ml-2 flex-shrink-0">
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
