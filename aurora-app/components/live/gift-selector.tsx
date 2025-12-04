"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Sparkles, Crown, Heart, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { GIFT_CATALOG, ROOM_LIMITS } from "@/convex/premiumConfig";

type GiftCategory = "hearts" | "sparkles" | "crowns" | "aurora_special";

const CATEGORY_ICONS: Record<GiftCategory, React.ReactNode> = {
  hearts: <Heart className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
  crowns: <Crown className="w-4 h-4" />,
  aurora_special: <Sparkles className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<GiftCategory, string> = {
  hearts: "from-pink-500 to-red-500",
  sparkles: "from-purple-500 to-pink-500",
  crowns: "from-yellow-600 to-amber-600",
  aurora_special: "from-violet-600 to-purple-600",
};

interface GiftSelectorProps {
  open: boolean;
  onClose: () => void;
  senderId: Id<"users">;
  recipientId: Id<"users">;
  livestreamId: Id<"livestreams">;
  onGiftSent?: (giftName: string, animationUrl: string) => void;
}

export function GiftSelector({ 
  open, 
  onClose, 
  senderId, 
  recipientId, 
  livestreamId,
  onGiftSent 
}: GiftSelectorProps) {
  const [selectedGift, setSelectedGift] = useState<typeof GIFT_CATALOG[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState<GiftCategory>("hearts");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuperChat, setShowSuperChat] = useState(false);
  const [superChatCredits, setSuperChatCredits] = useState(ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS);
  
  const sender = useQuery(api.users.getUser, { userId: senderId });
  const sendGiftMutation = useMutation(api.gifts.sendGift);
  const sendSuperChatMutation = useMutation(api.gifts.sendSuperChat);

  const filteredGifts = GIFT_CATALOG.filter(g => g.category === activeCategory);

  const handleSendGift = async () => {
    if (!selectedGift || !sender) return;
    
    if (sender.credits < selectedGift.credits) {
      return;
    }
    
    setIsSending(true);
    try {
      const result = await sendGiftMutation({
        fromUserId: senderId,
        toUserId: recipientId,
        giftId: selectedGift.giftId,
        livestreamId,
        message: message || undefined,
      });
      
      if (result.success) {
        onGiftSent?.(result.giftName, result.animationUrl);
        setSelectedGift(null);
        setMessage("");
        onClose();
      }
    } catch (error) {
      console.error("Failed to send gift:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSuperChat = async () => {
    if (!sender || superChatCredits < ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS || !message.trim()) return;
    
    if (sender.credits < superChatCredits) {
      return;
    }
    
    setIsSending(true);
    try {
      const result = await sendSuperChatMutation({
        userId: senderId,
        livestreamId,
        message: message.trim(),
        credits: superChatCredits,
      });
      
      if (result.success) {
        setMessage("");
        setSuperChatCredits(ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS);
        setShowSuperChat(false);
        onClose();
      }
    } catch (error) {
      console.error("Failed to send super chat:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[var(--card)] rounded-t-2xl p-4 pb-6 safe-area-inset-bottom animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[var(--foreground)]">
            {showSuperChat ? "Super Chat" : "Send Gift"}
          </h3>
          <div className="flex items-center gap-3">
            {sender && (
              <span className="flex items-center gap-1 text-sm font-medium text-[var(--color-aurora-yellow)]">
                <Coins className="w-4 h-4" />
                {sender.credits}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Toggle between Gifts and Super Chat */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={showSuperChat ? "outline" : "default"}
            size="sm"
            onClick={() => setShowSuperChat(false)}
            className="flex-1"
          >
            <Heart className="w-4 h-4 mr-1" />
            Gifts
          </Button>
          <Button
            variant={showSuperChat ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSuperChat(true)}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Super Chat
          </Button>
        </div>

        {showSuperChat ? (
          /* Super Chat UI */
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-2 block">
                Your message (pinned for 60 seconds)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your highlighted message..."
                className="w-full h-20 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] resize-none"
                maxLength={200}
              />
            </div>
            
            <div>
              <label className="text-sm text-[var(--muted-foreground)] mb-2 block">
                Credits (min {ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS})
              </label>
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSuperChatCredits(amount)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      superChatCredits === amount
                        ? "bg-[var(--color-aurora-purple)] text-white"
                        : "bg-[var(--muted)] text-[var(--foreground)]"
                    )}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSendSuperChat}
              disabled={!message.trim() || superChatCredits < ROOM_LIMITS.SUPER_CHAT_MIN_CREDITS || isSending || !sender || sender.credits < superChatCredits}
              className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white min-h-[48px] text-base font-semibold"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Send Super Chat (${superChatCredits} credits)`
              )}
            </Button>
          </div>
        ) : (
          /* Gift Selection UI */
          <>
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as GiftCategory)} className="mb-4">
              <TabsList className="grid grid-cols-4 w-full">
                {(["hearts", "sparkles", "crowns", "aurora_special"] as GiftCategory[]).map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs px-2">
                    {CATEGORY_ICONS[cat]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Gift Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4 max-h-[200px] overflow-y-auto">
              {filteredGifts.map((gift) => {
                const canAfford = sender && sender.credits >= gift.credits;
                const isSelected = selectedGift?.giftId === gift.giftId;
                
                return (
                  <button
                    key={gift.giftId}
                    onClick={() => canAfford && setSelectedGift(gift)}
                    disabled={isSending || !canAfford}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-xl transition-all",
                      "active:scale-95 disabled:opacity-40",
                      isSelected
                        ? "bg-[var(--color-aurora-purple)]/20 ring-2 ring-[var(--color-aurora-purple)]"
                        : "hover:bg-[var(--muted)]/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                      "bg-gradient-to-br text-white",
                      CATEGORY_COLORS[gift.category]
                    )}>
                      {CATEGORY_ICONS[gift.category]}
                    </div>
                    <span className="text-[10px] font-medium text-[var(--foreground)] truncate w-full text-center">
                      {gift.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-aurora-yellow)] font-bold">
                      {gift.credits}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional Message */}
            {selectedGift && (
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message (optional)"
                className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] mb-4"
                maxLength={100}
              />
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendGift}
              disabled={!selectedGift || isSending || !sender || sender.credits < (selectedGift?.credits || 0)}
              className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white min-h-[48px] text-base font-semibold"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : selectedGift ? (
                `Send ${selectedGift.name} (${selectedGift.credits} credits)`
              ) : (
                "Select a gift"
              )}
            </Button>
          </>
        )}

        {/* Creator earnings info */}
        <p className="text-xs text-center text-[var(--muted-foreground)] mt-3">
          85% goes directly to the creator 💜
        </p>
      </div>
    </div>
  );
}
