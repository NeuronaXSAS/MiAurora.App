"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, MapPin, Briefcase } from "lucide-react";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import Link from "next/link";

interface UserProfile {
    _id: string;
    name?: string;
    profileImage?: string;
    avatarConfig?: AvatarConfig;
    bio?: string;
    industry?: string;
    location?: string;
    trustScore: number;
    interests?: string[];
}

interface UserCardProps {
    user: UserProfile;
    action?: React.ReactNode;
    showBio?: boolean;
}

export function UserCard({ user, action, showBio = true }: UserCardProps) {
    const avatarUrl = user.avatarConfig
        ? generateAvatarUrl(user.avatarConfig)
        : user.profileImage;

    return (
        <Card className="p-4 bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 hover:shadow-lg transition-all overflow-hidden group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <Link href={`/user/${user._id}`} className="shrink-0">
                    <div className="relative">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-[var(--accent)] group-hover:border-[var(--color-aurora-purple)] transition-colors">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-[var(--accent)] text-[var(--color-aurora-purple)] font-bold">
                                {user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        {user.trustScore >= 100 && (
                            <div className="absolute -bottom-1 -right-1 bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] rounded-full p-0.5 border-2 border-[var(--card)]" title="Trusted Member">
                                <Shield className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <div>
                            <Link href={`/user/${user._id}`} className="block">
                                <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--color-aurora-purple)] transition-colors">
                                    {user.name || "Aurora Member"}
                                </h3>
                            </Link>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                                {user.industry && (
                                    <span className="flex items-center gap-1 bg-[var(--accent)] px-1.5 py-0.5 rounded-md">
                                        <Briefcase className="w-3 h-3" />
                                        {user.industry}
                                    </span>
                                )}
                                {user.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {user.location}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Slot */}
                        {action && (
                            <div className="shrink-0">
                                {action}
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    {showBio && user.bio && (
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-2 leading-relaxed">
                            {user.bio}
                        </p>
                    )}

                    {/* Interests Preview - Optional, show top 2-3 */}
                    {user.interests && user.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {user.interests.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-[var(--accent)]/50 text-[var(--muted-foreground)] rounded-full border border-[var(--border)]">
                                    {tag}
                                </span>
                            ))}
                            {user.interests.length > 3 && (
                                <span className="text-[10px] px-1 text-[var(--muted-foreground)]">+{user.interests.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
