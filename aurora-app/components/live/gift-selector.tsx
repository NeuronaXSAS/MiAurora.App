"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Crown, Shield, Heart, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface Gift {
  id: string;
  name: string;
  icon: React.ReactNode;
  cost: number;
  color: string;
  description: string;
}

const GIFTS: Gift[] = [
  {
    id: "rose",
    name: "Rose",
    icon: <Heart className="w-6 h-6" />,
    cost: 5,
    color: "from-pink-500 to-red-500",
    description: "Show appreciation",
  },
  {
    id: "star",
    name: "Star",
    icon: <Star className="w-6 h-6" />,
    cost: 10,
    color: "from-yellow-400 to-orange-500",
    description: "You're a star!",
  },
  {
    id: "shield",
    name: "Safety Shield",
    icon: <Shield className="w-6 h-6" />,
    cost: 25,
    color: "from-blue-500 to-cyan-500",
    description: "Support safety",
  },
  {
    id: "sparkle",
    name: "Sparkle",
    icon: <Sparkles className="w-6 h-6" />,
    cost: 50,
    color: "from-purple-500 to-pink-500",
    description: "Amazing content!",
  },
  {
    id: "crown",
    name: "Crown",
    icon: <Crown className="w-6 h-6" />,
    cost: 100,
    color: "from-yellow-600 to-amber-600",
    description: "You're royalty!",
  },
];

interface GiftSelectorProps {
  open: boolean;
  onClose: () => void;
  senderId: Id<"users">;
  recipientId: Id<"users">;
  livestreamId: Id<"livestreams">;
}

export function GiftSelector({
  open,
  onClose,
  senderId,
  recipientId,
  livestreamId,
}: GiftSelectorProps) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sender = useQuery(api.users.getUser, { userId: senderId });

  // Send gift
  const sendGift = async (gift: Gift) => {
    if (!sender) return;

    if (sender.credits < gift.cost) {
      alert(`Insufficient credits. You need ${gift.cost} credits but only have ${sender.credits}.`);
      return;
    }

    setIsSending(true);

    try {
      // TODO: Implement proper credit transfer via Convex mutation
      // For now, show success message
      alert(`${gift.name} sent successfully! 🎉`);
      onClose();
    } catch (error) {
      console.error('Failed to send gift:', error);
      alert('Failed to send gift. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="bg-[var(--card)] border-t border-[var(--border)] max-h-[80vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <DrawerTitle className="text-[var(--foreground)]">Send a Gift</DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px]"
            >
              <X className="w-5 h-5" />
            </Button>
          </DrawerHeader>

          <div className="p-4 space-y-4 overflow-y-auto">
            {/* User Credits */}
            {sender && (
              <div className="flex items-center justify-between p-3 bg-[var(--color-aurora-purple)]/10 rounded-xl">
                <span className="text-sm font-medium text-[var(--foreground)]">Your Credits</span>
                <Badge className="bg-[var(--color-aurora-purple)] text-white px-3 py-1">
                  <Coins className="w-4 h-4 mr-1" />
                  {sender.credits}
                </Badge>
              </div>
            )}

            {/* Gift Grid - 2x3 on mobile, scrollable */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GIFTS.map((gift) => {
                const canAfford = !sender || sender.credits >= gift.cost;
                const isSelected = selectedGift?.id === gift.id;
                
                return (
                  <button
                    key={gift.id}
                    onClick={() => canAfford && setSelectedGift(gift)}
                    disabled={isSending || !canAfford}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all min-h-[120px]",
                      "flex flex-col items-center justify-center gap-2",
                      "active:scale-95",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      isSelected
                        ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/10"
                        : "border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br text-white",
                        gift.color
                      )}
                    >
                      {gift.icon}
                    </div>
                    <p className="font-semibold text-sm text-[var(--foreground)]">{gift.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] text-center line-clamp-1">
                      {gift.description}
                    </p>
                    <div className="flex items-center gap-1 text-[var(--color-aurora-yellow)] font-bold text-sm">
                      <Coins className="w-3 h-3" />
                      <span>{gift.cost}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Send Button */}
            <Button
              onClick={() => selectedGift && sendGift(selectedGift)}
              disabled={!selectedGift || isSending || (!!sender && !!selectedGift && sender.credits < selectedGift.cost)}
              className="w-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:from-[var(--color-aurora-violet)] hover:to-[var(--color-aurora-purple)] text-white min-h-[48px]"
              size="lg"
            >
              {isSending ? (
                "Sending..."
              ) : selectedGift ? (
                <>Send {selectedGift.name} for {selectedGift.cost} Credits</>
              ) : (
                "Select a gift"
              )}
            </Button>

            <p className="text-xs text-center text-[var(--muted-foreground)] pb-2">
              Credits will be transferred to the streamer
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
