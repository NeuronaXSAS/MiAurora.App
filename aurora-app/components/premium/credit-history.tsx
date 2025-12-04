"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Calendar,
  Sparkles,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface CreditHistoryProps {
  userId: Id<"users">;
  limit?: number;
}

const TRANSACTION_ICONS: Record<string, React.ReactNode> = {
  credit_purchase: <Coins className="w-4 h-4" />,
  subscription_credits: <Sparkles className="w-4 h-4" />,
  gift_sent: <Gift className="w-4 h-4" />,
  gift_received: <Gift className="w-4 h-4" />,
  super_chat_sent: <MessageSquare className="w-4 h-4" />,
  super_chat_received: <MessageSquare className="w-4 h-4" />,
  event_ticket: <Calendar className="w-4 h-4" />,
  event_earnings: <Calendar className="w-4 h-4" />,
  referral_bonus: <Users className="w-4 h-4" />,
  referral_welcome: <Users className="w-4 h-4" />,
  engagement_daily_login: <Sparkles className="w-4 h-4" />,
  engagement_post_created: <Sparkles className="w-4 h-4" />,
};

const TRANSACTION_LABELS: Record<string, string> = {
  credit_purchase: "Credit Purchase",
  subscription_credits: "Monthly Credits",
  gift_sent: "Gift Sent",
  gift_received: "Gift Received",
  super_chat_sent: "Super Chat",
  super_chat_received: "Super Chat Received",
  event_ticket: "Event Ticket",
  event_earnings: "Event Earnings",
  referral_bonus: "Referral Bonus",
  referral_welcome: "Welcome Bonus",
  engagement_daily_login: "Daily Login",
  engagement_post_created: "Post Created",
  engagement_safety_verification: "Safety Verification",
  engagement_checkin_completed: "Check-in Completed",
  engagement_route_shared: "Route Shared",
  engagement_reel_created: "Reel Created",
  engagement_livestream_completed: "Livestream Completed",
};

export function CreditHistory({ userId, limit = 20 }: CreditHistoryProps) {
  const transactions = useQuery(api.credits.getCreditHistory, { userId, limit });
  const balance = useQuery(api.credits.getCreditBalance, { userId });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getTransactionLabel = (type: string) => {
    return TRANSACTION_LABELS[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTransactionIcon = (type: string) => {
    return TRANSACTION_ICONS[type] || <Coins className="w-4 h-4" />;
  };

  if (!transactions) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-aurora-purple)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Credit History</CardTitle>
          {balance !== undefined && (
            <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-violet)]">
              <Coins className="w-3 h-3 mr-1" />
              {balance} credits
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-6">
            <Coins className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">No transactions yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Earn credits by engaging with the community
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              
              return (
                <div
                  key={tx._id}
                  className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0"
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isPositive
                      ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-violet)]"
                      : "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
                  )}>
                    {getTransactionIcon(tx.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--foreground)] text-sm">
                      {getTransactionLabel(tx.type)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(tx._creationTime)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className={cn(
                    "flex items-center gap-1 font-semibold",
                    isPositive ? "text-[var(--color-aurora-violet)]" : "text-[var(--color-aurora-salmon)]"
                  )}>
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {isPositive ? "+" : ""}{tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
