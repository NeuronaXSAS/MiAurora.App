"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  ArrowLeft,
  MapPin,
  Briefcase,
  Shield,
  Users,
  Calendar,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import { formatDistanceToNow } from "date-fns";
import { ProfileHeader } from "@/components/profile-header";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileUserId = params.userId as string;
  const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);

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

  const user = useQuery(
    api.users.getUser,
    profileUserId ? { userId: profileUserId as Id<"users"> } : "skip"
  );

  const stats = useQuery(
    api.users.getUserStats,
    profileUserId ? { userId: profileUserId as Id<"users"> } : "skip"
  );

  const isOwnProfile = currentUserId === profileUserId;

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="bg-black/20 hover:bg-black/30 text-white border border-white/20 backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <ProfileHeader
          user={user}
          stats={stats}
          isOwnProfile={isOwnProfile}
          actionButtons={
            !isOwnProfile ? (
              <Link href={`/messages/${profileUserId}`}>
                <Button
                  className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white hover:opacity-90 shadow-lg rounded-xl font-semibold"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
            ) : (
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="border-[var(--border)] hover:bg-[var(--accent)]"
                >
                  Edit Profile
                </Button>
              </Link>
            )
          }
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Detailed Bio (if long) - Optional, keeping redundant for now if bio is very long, but header handles it. 
              Actually, ProfileHeader truncates or shows simple bio. If bio is long, we might want it here. 
              But ProfileHeader renders the FULL bio in a paragraph. 
              Let's remove the Bio card to avoid duplication.
          */}

          {/* Member Since */}
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
                <Calendar className="w-5 h-5" />
                <span>
                  Member since {user._creationTime
                    ? formatDistanceToNow(user._creationTime, { addSuffix: true })
                    : "recently"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Connect CTA for non-own profiles */}
          {!isOwnProfile && (
            <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--color-aurora-purple)]/20">
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-[var(--color-aurora-purple)]" />
                <h3 className="font-semibold text-[var(--foreground)] mb-2">
                  Want to connect?
                </h3>
                <p className="text-[var(--muted-foreground)] mb-4 text-sm">
                  Send a message to start a conversation with {user.name}
                </p>
                <Link href={`/messages/${profileUserId}`}>
                  <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[48px] px-8 rounded-xl font-semibold">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Conversation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
