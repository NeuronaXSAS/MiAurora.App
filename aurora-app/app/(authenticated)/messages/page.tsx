"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Plus, Heart, Sparkles, Users } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// Generate DiceBear Lorelei avatar URL
function getAvatarUrl(user: { 
  avatarConfig?: { 
    seed: string; 
    backgroundColor: string;
    hairStyle: string;
    hairColor: string;
    skinColor: string;
  } | null;
  name?: string;
  _id: string;
}): string {
  if (user.avatarConfig) {
    const { seed, backgroundColor, hairStyle, hairColor, skinColor } = user.avatarConfig;
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor.replace('#', '')}&hair=${hairStyle}&hairColor=${hairColor.replace('#', '')}&skinColor=${skinColor.replace('#', '')}`;
  }
  const seedVal = user.name || user._id;
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seedVal)}&backgroundColor=c9cef4`;
}

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

  // Get matches for the user
  const matches = useQuery(
    api.connections.getMatches,
    userId ? { userId } : "skip"
  );

  // Get pending likes (people who liked you)
  const pendingLikes = useQuery(
    api.connections.getPendingLikes,
    userId ? { userId } : "skip"
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
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Pending Likes Section - People who liked you */}
          {pendingLikes && pendingLikes.length > 0 && (
            <Card className="bg-gradient-to-r from-[var(--color-aurora-pink)]/10 to-[var(--color-aurora-purple)]/10 border-[var(--color-aurora-pink)]/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {pendingLikes.length} {pendingLikes.length === 1 ? "sister" : "sisters"} liked you!
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Like them back to match and start chatting 💜
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {pendingLikes.map((user: any) => (
                    <Link 
                      key={user._id} 
                      href={`/user/${user._id}`}
                      className="flex-shrink-0 flex flex-col items-center gap-1 group"
                    >
                      <div className="w-16 h-16 rounded-full border-3 border-[var(--color-aurora-pink)] group-hover:border-[var(--color-aurora-purple)] transition-colors overflow-hidden bg-[var(--color-aurora-lavender)] relative">
                        <img 
                          src={getAvatarUrl(user)}
                          alt={user.name || "User"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[var(--color-aurora-pink)]/20 flex items-center justify-center">
                          <Heart className="w-6 h-6 text-[var(--color-aurora-pink)] fill-current" />
                        </div>
                      </div>
                      <span className="text-xs text-[var(--foreground)] font-medium truncate max-w-[64px]">
                        {user.name?.split(" ")[0]}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matches Section */}
          {matches && matches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Your Matches</h3>
                <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0">
                  {matches.length}
                </Badge>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {matches.map((user: any) => (
                  <Link 
                    key={user._id} 
                    href={`/messages/${user._id}`}
                    className="flex-shrink-0 flex flex-col items-center gap-1 group"
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-[var(--color-aurora-mint)] group-hover:border-[var(--color-aurora-purple)] transition-colors overflow-hidden bg-[var(--color-aurora-lavender)]">
                      <img 
                        src={getAvatarUrl(user)}
                        alt={user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-[var(--foreground)] font-medium truncate max-w-[64px]">
                      {user.name?.split(" ")[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {!conversations && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">Loading conversations...</p>
            </div>
          )}

          {/* Empty State */}
          {conversations && conversations.length === 0 && (!matches || matches.length === 0) && (
            <div className="space-y-6">
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="py-8 text-center">
                  <Users className="w-12 h-12 text-[var(--color-aurora-lavender)] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No matches yet</h3>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    Find sisters in the feed and like each other to match!
                  </p>
                  <Link href="/feed">
                    <Button className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
                      <Heart className="w-4 h-4 mr-2" />
                      Find Sisters to Match
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              {/* Quick Tips */}
              <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
                <CardContent className="py-4">
                  <h4 className="font-semibold text-[var(--foreground)] mb-2">💜 How matching works</h4>
                  <ul className="text-sm text-[var(--muted-foreground)] space-y-1">
                    <li>• Swipe right or tap the heart on Sister Spotlight cards</li>
                    <li>• When both of you like each other, it's a match!</li>
                    <li>• Only matched sisters can send messages</li>
                    <li>• You both earn +5 credits when you match 🎉</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Conversations List */}
          {conversations && conversations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                <h3 className="font-semibold text-[var(--foreground)]">Conversations</h3>
              </div>
              <div className="space-y-2">
                {conversations.map((conv: any) => (
                  <Card
                    key={conv.partnerId}
                    className="hover:shadow-lg cursor-pointer bg-[var(--card)] border-[var(--border)] transition-all active:scale-[0.99]"
                    onClick={() => router.push(`/messages/${conv.partnerId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/messages/${conv.partnerId}`)}
                    aria-label={`Chat with ${conv.partner?.name || "Unknown User"}${conv.unreadCount > 0 ? `, ${conv.unreadCount} unread messages` : ''}`}
                  >
                    <CardContent className="p-4 min-h-[72px]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden bg-[var(--color-aurora-lavender)]">
                          <img 
                            src={conv.partner?.avatarConfig 
                              ? getAvatarUrl({ ...conv.partner, _id: conv.partnerId })
                              : conv.partner?.profileImage || `https://api.dicebear.com/7.x/lorelei/svg?seed=${conv.partnerId}&backgroundColor=c9cef4`
                            }
                            alt={conv.partner?.name || "User"}
                            className="w-full h-full object-cover"
                          />
                        </div>
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
                              <Badge className="bg-[var(--color-aurora-purple)] ml-2 flex-shrink-0 min-w-[24px] h-6 flex items-center justify-center">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
