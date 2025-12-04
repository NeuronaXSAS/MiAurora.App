"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Crown, Shield, Heart, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface Gift {
  id: string;
  name: string;
  icon: React.ReactNode;
  cost: number;
  color: string;
}

const GIFTS: Gift[] = [
  { id: "rose", name: "Rose", icon: <Heart className="w-5 h-5" />, cost: 5, color: "from-pink-500 to-red-500" },
  { id: "star", name: "Star", icon: <Star className="w-5 h-5" />, cost: 10, color: "from-yellow-400 to-orange-500" },
  { id: "shield", name: "Shield", icon: <Shield className="w-5 h-5" />, cost: 25, color: "from-blue-500 to-cyan-500" },
  { id: "sparkle", name: "Sparkle", icon: <Sparkles className="w-5 h-5" />, cost: 50, color: "from-purple-500 to-pink-500" },
  { id: "crown", name: "Crown", icon: <Crown className="w-5 h-5" />, cost: 100, color: "from-yellow-600 to-amber-600" },
];

interface GiftSelectorProps {
  open: boolean;
  onClose: () => void;
  senderId: Id<"users">;
  recipientId: Id<"users">;
  livestreamId: Id<"livestreams">;
}

export function GiftSelector({ open, onClose, senderId }: GiftSelectorProps) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sender = useQuery(api.users.getUser, { userId: senderId });

  const sendGift = async (gift: Gift) => {
    if (!sender || sender.credits < gift.cost) {
      alert(`Need ${gift.cost} credits (you have ${sender?.credits || 0})`);
      return;
    }
    setIsSending(true);
    try {
      alert(`${gift.name} sent! 🎉`);
      onClose();
    } catch {
      alert('Failed to send gift');
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
          <h3 className="text-lg font-bold text-[var(--foreground)]">Send Gift</h3>
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

        {/* Compact Gift Grid - All visible without scroll */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {GIFTS.map((gift) => {
            const canAfford = !sender || sender.credits >= gift.cost;
            const isSelected = selectedGift?.id === gift.id;
            
            return (
              <button
                key={gift.id}
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
                  "w-10 h-10 rounded-full flex items-center justify-center mb-1",
                  "bg-gradient-to-br text-white",
                  gift.color
                )}>
                  {gift.icon}
                </div>
                <span className="text-[10px] font-medium text-[var(--foreground)] truncate w-full text-center">
                  {gift.name}
                </span>
                <span className="text-[10px] text-[var(--color-aurora-yellow)] font-bold">
                  {gift.cost}
                </span>
              </button>
            );
          })}
        </div>

        {/* Send Button */}
        <Button
          onClick={() => selectedGift && sendGift(selectedGift)}
          disabled={!selectedGift || isSending}
          className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white min-h-[48px] text-base font-semibold"
        >
          {isSending ? "Sending..." : selectedGift ? `Send ${selectedGift.name} (${selectedGift.cost})` : "Select a gift"}
        </Button>
      </div>
    </div>
  );
}
