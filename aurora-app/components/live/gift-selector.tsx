"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Crown, Shield, Heart, Star } from "lucide-react";
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
    icon: <Heart className="w-8 h-8" />,
    cost: 5,
    color: "from-pink-500 to-red-500",
    description: "Show appreciation",
  },
  {
    id: "star",
    name: "Star",
    icon: <Star className="w-8 h-8" />,
    cost: 10,
    color: "from-yellow-400 to-orange-500",
    description: "You're a star!",
  },
  {
    id: "shield",
    name: "Safety Shield",
    icon: <Shield className="w-8 h-8" />,
    cost: 25,
    color: "from-blue-500 to-cyan-500",
    description: "Support safety",
  },
  {
    id: "sparkle",
    name: "Sparkle",
    icon: <Sparkles className="w-8 h-8" />,
    cost: 50,
    color: "from-purple-500 to-pink-500",
    description: "Amazing content!",
  },
  {
    id: "crown",
    name: "Crown",
    icon: <Crown className="w-8 h-8" />,
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

  // Send gift mutation (transfers credits)
  const sendGift = async (gift: Gift) => {
    if (!sender) return;

    if (sender.credits < gift.cost) {
      alert(`Insufficient credits. You need ${gift.cost} credits but only have ${sender.credits}.`);
      return;
    }

    if (!confirm(`Send ${gift.name} for ${gift.cost} credits?`)) return;

    setIsSending(true);

    try {
      // Deduct credits from sender
      await fetch('/api/credits/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          recipientId,
          amount: gift.cost,
          type: 'gift',
          giftId: gift.id,
          livestreamId,
        }),
      });

      // TODO: Show gift animation in stream
      // TODO: Send notification to recipient

      alert(`${gift.name} sent successfully!`);
      onClose();
    } catch (error) {
      console.error('Failed to send gift:', error);
      alert('Failed to send gift. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send a Gift</DialogTitle>
          <DialogDescription>
            Support the streamer with virtual gifts
          </DialogDescription>
        </DialogHeader>

        {/* User Credits */}
        {sender && (
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg mb-4">
            <span className="text-sm font-medium">Your Credits</span>
            <Badge className="bg-purple-600 text-lg px-3 py-1">
              <Coins className="w-4 h-4 mr-1" />
              {sender.credits}
            </Badge>
          </div>
        )}

        {/* Gift Grid */}
        <div className="grid grid-cols-2 gap-4">
          {GIFTS.map((gift) => (
            <button
              key={gift.id}
              onClick={() => setSelectedGift(gift)}
              disabled={isSending || (!!sender && sender.credits < gift.cost)}
              className={cn(
                "relative p-6 rounded-xl border-2 transition-all",
                "hover:scale-105 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selectedGift?.id === gift.id
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                  "bg-gradient-to-br text-white",
                  gift.color
                )}
              >
                {gift.icon}
              </div>
              <p className="font-semibold text-center mb-1">{gift.name}</p>
              <p className="text-xs text-gray-600 text-center mb-2">
                {gift.description}
              </p>
              <div className="flex items-center justify-center gap-1 text-purple-600 font-bold">
                <Coins className="w-4 h-4" />
                <span>{gift.cost}</span>
              </div>

              {sender && sender.credits < gift.cost && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    Insufficient Credits
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Send Button */}
        {selectedGift && (
          <Button
            onClick={() => sendGift(selectedGift)}
            disabled={isSending || (!!sender && sender.credits < selectedGift.cost)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {isSending ? (
              "Sending..."
            ) : (
              <>
                Send {selectedGift.name} for {selectedGift.cost} Credits
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-center text-gray-500">
          Credits will be transferred to the streamer's account
        </p>
      </DialogContent>
    </Dialog>
  );
}
