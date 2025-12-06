"use client";

/**
 * Guardian Discovery Card - Integrated in feed
 * 
 * Helps users discover and connect with potential guardians
 * naturally while scrolling the feed. Makes safety social!
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Heart, UserPlus, MapPin, 
  Sparkles, ChevronRight, X, Users,
  CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generateAvatarUrl } from "@/hooks/use-avatar";
import Link from "next/link";

interface GuardianDiscoveryCardProps {
  currentUserId: Id<"users">;
  variant?: "compact" | "full";
}

export function GuardianDiscoveryCard({ 
  currentUserId, 
  variant = "compact" 
}: GuardianDiscoveryCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Get suggested guardians (mutual connections, nearby users, etc.)
  const suggestedGuardians = useQuery(api.guardians.getSuggestedGuardians, {
    userId: currentUserId,
    limit: 3,
  });

  // Get current guardian count
  const myGuardians = useQuery(api.guardians.getMyGuardians, { userId: currentUserId });
  const guardianCount = myGuardians?.length || 0;

  const sendRequest = useMutation(api.guardians.sendGuardianRequest);

  const handleSendRequest = useCallback(async (guardianId: Id<"users">) => {
    try {
      await sendRequest({
        userId: currentUserId,
        guardianId,
        message: "Let's be safety buddies! 💜",
      });
      setSentRequests(prev => new Set(prev).add(guardianId));
    } catch (error) {
      console.error("Failed to send request:", error);
    }
  }, [currentUserId, sendRequest]);

  if (dismissed || !suggestedGuardians || suggestedGuardians.length === 0) {
    return null;
  }

  // Compact variant for feed integration
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[var(--color-aurora-mint)]/20 to-[var(--color-aurora-lavender)]/20 rounded-2xl p-4 border border-[var(--color-aurora-mint)]/30"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-aurora-mint)] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[var(--color-aurora-violet)]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--foreground)]">Build Your Safety Circle</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {guardianCount} guardian{guardianCount !== 1 ? "s" : ""} • Add more for better safety
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Users - Horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {suggestedGuardians.slice(0, 3).map((user) => {
            const isRequested = sentRequests.has(user._id);
            return (
              <div
                key={user._id}
                className="flex-shrink-0 w-[140px] bg-[var(--card)] rounded-xl p-3 border border-[var(--border)]"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] mb-2">
                    {user.avatarConfig ? (
                      <img
                        src={generateAvatarUrl(user.avatarConfig as any)}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm text-[var(--foreground)] truncate w-full">
                    {user.name}
                  </p>
                  {user.location && (
                    <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {user.location.split(",")[0]}
                    </p>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(user._id)}
                    disabled={isRequested}
                    className={`mt-2 w-full min-h-[32px] text-xs ${
                      isRequested 
                        ? "bg-[var(--accent)] text-[var(--muted-foreground)]" 
                        : "bg-[var(--color-aurora-purple)] text-white"
                    }`}
                  >
                    {isRequested ? (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Sent
                      </>
                    ) : (
                      <>
                        <Heart className="w-3 h-3 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Link href="/emergency" className="block mt-3">
          <Button variant="ghost" className="w-full text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10">
            See All Suggestions
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  // Full variant for dedicated section
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--foreground)]">Safety Circle</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect with sisters who care about your safety
              </p>
            </div>
          </div>
          <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-0">
            <Users className="w-3 h-3 mr-1" />
            {guardianCount} guardians
          </Badge>
        </div>
      </div>

      {/* Suggested Users */}
      <div className="p-4 space-y-3">
        {suggestedGuardians.map((user) => {
          const isRequested = sentRequests.has(user._id);
          return (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]/50 hover:bg-[var(--accent)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]">
                  {user.avatarConfig ? (
                    <img
                      src={generateAvatarUrl(user.avatarConfig as any)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {user.location.split(",")[0]}
                      </span>
                    )}
                    {user.mutualConnections && user.mutualConnections > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {user.mutualConnections} mutual
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleSendRequest(user._id)}
                disabled={isRequested}
                className={`min-h-[40px] ${
                  isRequested 
                    ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]" 
                    : "bg-[var(--color-aurora-purple)]"
                }`}
              >
                {isRequested ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Requested
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Guardian
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--accent)]/30">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Sparkles className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
          <span>Guardians receive alerts when you need help</span>
        </div>
      </div>
    </motion.div>
  );
}

// Mini version for sidebar or quick access
export function GuardianQuickAdd({ currentUserId }: { currentUserId: Id<"users"> }) {
  const myGuardians = useQuery(api.guardians.getMyGuardians, { userId: currentUserId });
  const guardianCount = myGuardians?.length || 0;

  return (
    <Link href="/emergency">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-aurora-mint)]/10 hover:bg-[var(--color-aurora-mint)]/20 transition-colors cursor-pointer border border-[var(--color-aurora-mint)]/30">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-aurora-mint)] flex items-center justify-center">
          <Shield className="w-5 h-5 text-[var(--color-aurora-violet)]" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-[var(--foreground)]">Safety Circle</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {guardianCount === 0 
              ? "Add your first guardian" 
              : `${guardianCount} guardian${guardianCount !== 1 ? "s" : ""} protecting you`
            }
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />
      </div>
    </Link>
  );
}
