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

  const isOwnProfile = currentUserId === profileUserId;

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
      </div>
    );
  }

  const avatarUrl = user.avatarConfig 
    ? generateAvatarUrl(user.avatarConfig as AvatarConfig)
    : user.profileImage;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-white">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-white text-[var(--color-aurora-purple)] text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold mb-1">
                {user.name || "Aurora App Member"}
              </h1>
              {user.location && (
                <p className="flex items-center justify-center sm:justify-start gap-1 text-white/80 mb-2">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </p>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {user.trustScore > 0 && (
                  <Badge className="bg-white/20 text-white border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Trust: {user.trustScore}
                  </Badge>
                )}
                {user.industry && (
                  <Badge className="bg-white/20 text-white border-0">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {user.industry}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-3">
                <Link href={`/messages/${profileUserId}`}>
                  <Button 
                    size="lg"
                    className="bg-white text-[var(--color-aurora-purple)] hover:bg-white/90 min-h-[48px] px-6 rounded-xl font-semibold shadow-lg"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </Link>
              </div>
            )}
            
            {isOwnProfile && (
              <Link href="/profile">
                <Button 
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 min-h-[44px]"
                >
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Bio */}
          {user.bio && (
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[var(--foreground)] mb-2">About</h2>
                <p className="text-[var(--muted-foreground)]">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardContent className="p-6">
                <h2 className="font-semibold text-[var(--foreground)] mb-3">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: string, i: number) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="bg-[var(--color-aurora-lavender)]/20 text-[var(--foreground)]"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  Send a message to start a conversation
                </p>
                <Link href={`/messages/${profileUserId}`}>
                  <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[48px] px-8 rounded-xl">
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
