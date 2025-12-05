"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Send, MoreVertical, Edit2, Trash2, Copy, 
  Forward, Reply, Smile, Check, CheckCheck, X, Heart, Lock
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Reaction emoji options
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🙏", "💜"];

export default function ConversationPage() {
  const params = useParams();
  const otherUserId = params.userId as Id<"users">;
  const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
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

  // Check if users are matched (can chat)
  const connectionStatus = useQuery(
    api.connections.getConnectionStatus,
    currentUserId && otherUserId 
      ? { userId: currentUserId, otherUserId: otherUserId } 
      : "skip"
  );

  const likeUser = useMutation(api.connections.likeUser);
  const sendMessage = useMutation(api.directMessages.send);
  const editMessage = useMutation(api.directMessages.editMessage);
  const deleteMessage = useMutation(api.directMessages.deleteMessage);
  const addReaction = useMutation(api.directMessages.addReaction);
  const markAsRead = useMutation(api.directMessages.markAsRead);


  // Mark messages as read when viewing
  useEffect(() => {
    if (currentUserId && otherUserId) {
      markAsRead({ userId: currentUserId, otherUserId });
    }
  }, [currentUserId, otherUserId, messages, markAsRead]);

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
        replyToId: replyingTo?._id,
      });
      setMessageText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async () => {
    if (!currentUserId || !editingMessage || !editText.trim()) return;

    try {
      await editMessage({
        messageId: editingMessage as Id<"directMessages">,
        userId: currentUserId,
        newContent: editText.trim(),
      });
      setEditingMessage(null);
      setEditText("");
    } catch (error: any) {
      alert(error.message || "Failed to edit message");
    }
  };

  const handleDelete = async (deleteType: "for_me" | "for_everyone") => {
    if (!currentUserId || !deleteMessageId) return;

    try {
      await deleteMessage({
        messageId: deleteMessageId as Id<"directMessages">,
        userId: currentUserId,
        deleteType,
      });
      setShowDeleteDialog(false);
      setDeleteMessageId(null);
    } catch (error: any) {
      alert(error.message || "Failed to delete message");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    try {
      await addReaction({
        messageId: messageId as Id<"directMessages">,
        userId: currentUserId,
        emoji,
      });
      setShowReactions(null);
    } catch (error) {
      console.error("Reaction error:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleEdit();
      } else {
        handleSend();
      }
    }
  };

  // Check if message can be edited (within 15 minutes)
  const canEdit = (creationTime: number) => {
    const fifteenMinutes = 15 * 60 * 1000;
    return Date.now() - creationTime < fifteenMinutes;
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/messages")}
              className="min-w-[44px] min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser?.avatarConfig ? generateAvatarUrl(otherUser.avatarConfig as AvatarConfig) : otherUser?.profileImage} />
              <AvatarFallback className="bg-[var(--color-aurora-lavender)] text-[var(--color-aurora-violet)]">
                {otherUser?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-[var(--foreground)]">{otherUser?.name || "Loading..."}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Trust Score: {otherUser?.trustScore || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {!messages && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">Loading messages...</p>
            </div>
          )}

          {messages && messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}

          {messages &&
            messages.map((msg: any) => {
              const isFromMe = msg.senderId === currentUserId;
              const isDeleted = msg.isDeleted;
              
              return (
                <div
                  key={msg._id}
                  className={cn("flex group", isFromMe ? "justify-end" : "justify-start")}
                >
                  {/* Message Actions (left side for received) */}
                  {!isFromMe && !isDeleted && (
                    <div className="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShowReactions(msg._id)}
                        className="p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Smile className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Reply className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                    </div>
                  )}

                  <div className={cn("max-w-[70%] relative", isFromMe && "order-1")}>
                    {/* Reply Preview */}
                    {msg.replyTo && (
                      <div className={cn(
                        "text-xs px-3 py-1.5 rounded-t-xl border-l-2 mb-1",
                        isFromMe 
                          ? "bg-[var(--color-aurora-purple)]/20 border-[var(--color-aurora-purple)] text-[var(--foreground)]" 
                          : "bg-[var(--accent)] border-[var(--color-aurora-pink)] text-[var(--muted-foreground)]"
                      )}>
                        <span className="font-medium">{msg.replyToSenderName}</span>
                        <p className="truncate">{msg.replyTo.content}</p>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 shadow-sm",
                        isFromMe
                          ? "bg-[var(--color-aurora-purple)] text-white"
                          : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]",
                        isDeleted && "opacity-60 italic"
                      )}
                    >
                      {msg.isForwarded && (
                        <p className={cn("text-xs mb-1 flex items-center gap-1", isFromMe ? "text-white/70" : "text-[var(--muted-foreground)]")}>
                          <Forward className="w-3 h-3" /> Forwarded
                        </p>
                      )}
                      
                      <p className="whitespace-pre-wrap break-words">
                        {msg.displayContent || msg.content}
                      </p>
                      
                      <div className={cn("flex items-center gap-2 mt-1", isFromMe ? "justify-end" : "justify-start")}>
                        <span className={cn("text-xs", isFromMe ? "text-white/70" : "text-[var(--muted-foreground)]")}>
                          {formatDistanceToNow(msg._creationTime, { addSuffix: true })}
                        </span>
                        {msg.isEdited && (
                          <span className={cn("text-xs", isFromMe ? "text-white/70" : "text-[var(--muted-foreground)]")}>
                            (edited)
                          </span>
                        )}
                        {isFromMe && (
                          <span className={cn("text-xs", msg.isRead ? "text-[var(--color-aurora-mint)]" : "text-white/70")}>
                            {msg.isRead ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reactions Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={cn("flex flex-wrap gap-1 mt-1", isFromMe ? "justify-end" : "justify-start")}>
                        {msg.reactions.map((r: any, idx: number) => (
                          <span 
                            key={idx} 
                            className="text-sm bg-[var(--accent)] rounded-full px-2 py-0.5 cursor-pointer hover:scale-110 transition-transform"
                            title={r.userName}
                          >
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Reaction Picker */}
                    {showReactions === msg._id && (
                      <div className={cn(
                        "absolute bottom-full mb-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-lg p-2 flex gap-1 z-10",
                        isFromMe ? "right-0" : "left-0"
                      )}>
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg._id, emoji)}
                            className="text-xl hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setShowReactions(null)}
                          className="p-1 hover:bg-[var(--accent)] rounded-full"
                        >
                          <X className="w-4 h-4 text-[var(--muted-foreground)]" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Actions (right side for sent) */}
                  {isFromMe && !isDeleted && (
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity order-2">
                      <button
                        onClick={() => setShowReactions(msg._id)}
                        className="p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors"
                      >
                        <Smile className="w-4 h-4 text-[var(--muted-foreground)]" />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-full hover:bg-[var(--accent)] transition-colors">
                            <MoreVertical className="w-4 h-4 text-[var(--muted-foreground)]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
                          <DropdownMenuItem 
                            onClick={() => setReplyingTo(msg)}
                            className="text-[var(--foreground)]"
                          >
                            <Reply className="w-4 h-4 mr-2" /> Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => copyToClipboard(msg.content)}
                            className="text-[var(--foreground)]"
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </DropdownMenuItem>
                          {canEdit(msg._creationTime) && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingMessage(msg._id);
                                setEditText(msg.content);
                              }}
                              className="text-[var(--foreground)]"
                            >
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setDeleteMessageId(msg._id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-[var(--color-aurora-salmon)]"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>
      </div>


      {/* Not Matched - Show Like Prompt */}
      {connectionStatus && !connectionStatus.canChat && (
        <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-t border-[var(--color-aurora-purple)]/20 px-4 py-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-[var(--color-aurora-lavender)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[var(--color-aurora-purple)]" />
            </div>
            <h3 className="font-semibold text-lg text-[var(--foreground)] mb-2">
              {connectionStatus.status === "liked" 
                ? "Waiting for them to like you back 💜" 
                : connectionStatus.status === "liked_you"
                ? `${otherUser?.name?.split(" ")[0] || "This user"} likes you!`
                : "Match to start chatting"}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {connectionStatus.status === "liked"
                ? "You've liked this person. Once they like you back, you can start chatting!"
                : connectionStatus.status === "liked_you"
                ? "Like them back to match and start a conversation!"
                : "Both users need to like each other to unlock messaging."}
            </p>
            {connectionStatus.status === "liked_you" && currentUserId && (
              <Button
                onClick={async () => {
                  try {
                    await likeUser({ userId: currentUserId, likedUserId: otherUserId });
                  } catch (error) {
                    console.error("Error liking user:", error);
                  }
                }}
                className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 min-h-[48px] px-8"
              >
                <Heart className="w-5 h-5 mr-2" />
                Like Back & Match
              </Button>
            )}
            {connectionStatus.status === "none" && (
              <Link href="/feed">
                <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[48px] px-8">
                  <Heart className="w-5 h-5 mr-2" />
                  Find in Sister Spotlight
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Reply Preview Bar */}
      {replyingTo && connectionStatus?.canChat && (
        <div className="bg-[var(--accent)] border-t border-[var(--border)] px-4 py-2 flex items-center gap-3">
          <div className="flex-1 border-l-2 border-[var(--color-aurora-purple)] pl-3">
            <p className="text-xs font-medium text-[var(--color-aurora-purple)]">
              Replying to {replyingTo.sender?.name || "message"}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] truncate">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-2 hover:bg-[var(--card)] rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      )}

      {/* Edit Mode Bar */}
      {editingMessage && connectionStatus?.canChat && (
        <div className="bg-[var(--color-aurora-yellow)]/20 border-t border-[var(--color-aurora-yellow)]/50 px-4 py-2 flex items-center gap-3">
          <Edit2 className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">Editing message</span>
          <button
            onClick={() => {
              setEditingMessage(null);
              setEditText("");
            }}
            className="ml-auto p-2 hover:bg-[var(--card)] rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      )}

      {/* Input - Only show if matched */}
      {connectionStatus?.canChat && (
        <div className="bg-[var(--card)] border-t border-[var(--border)] flex-shrink-0">
          <div className="container mx-auto px-4 py-3">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Textarea
                placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
                value={editingMessage ? editText : messageText}
                onChange={(e) => editingMessage ? setEditText(e.target.value) : setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[52px] max-h-[120px] resize-none bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                disabled={sending}
              />
              <Button
                onClick={editingMessage ? handleEdit : handleSend}
                disabled={editingMessage ? !editText.trim() : (!messageText.trim() || sending)}
                className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] h-[52px] px-6 min-w-[52px]"
              >
                {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">Delete Message</DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              How would you like to delete this message?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleDelete("for_me")}
              className="w-full sm:w-auto border-[var(--border)] text-[var(--foreground)]"
            >
              Delete for me
            </Button>
            <Button
              onClick={() => handleDelete("for_everyone")}
              className="w-full sm:w-auto bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90"
            >
              Delete for everyone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
