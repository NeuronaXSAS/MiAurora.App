"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    MapPin,
    Calendar,
    Briefcase,
    Edit,
    Camera
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import { Id } from "@/convex/_generated/dataModel";

interface ProfileHeaderProps {
    user: any; // Using any for simplicity as Convex types might be complex to import directly without context
    stats?: any; // Optional stats
    isOwnProfile?: boolean;
    onEditProfile?: () => void;
    onEditAvatar?: () => void;
    actionButtons?: React.ReactNode;
    hideStats?: boolean;
}

export function ProfileHeader({
    user,
    stats,
    isOwnProfile = false,
    onEditProfile,
    onEditAvatar,
    actionButtons,
    hideStats = false,
}: ProfileHeaderProps) {
    const [coverTheme, setCoverTheme] = useState("aurora");

    const THEMES = {
        aurora: "bg-gradient-to-r from-[var(--color-aurora-purple)] via-[var(--color-aurora-violet)] to-[var(--color-aurora-pink)]",
        ocean: "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500",
        sunset: "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600",
        forest: "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600",
        midnight: "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900",
    };

    const cycleTheme = () => {
        const keys = Object.keys(THEMES);
        const currentIndex = keys.indexOf(coverTheme);
        const nextIndex = (currentIndex + 1) % keys.length;
        setCoverTheme(keys[nextIndex]);
    };

    // Calculate trust score stars (out of 5)
    const getTrustStars = (trustScore: number) => {
        if (trustScore >= 500) return 5;
        if (trustScore >= 200) return 4;
        if (trustScore >= 100) return 3;
        if (trustScore >= 50) return 2;
        return 1;
    };

    const trustStars = user ? getTrustStars(user.trustScore) : 0;

    return (
        <div className="relative mb-2">
            {/* Decorative Cover Background */}
            <div className={`h-48 sm:h-64 ${THEMES[coverTheme as keyof typeof THEMES]} relative overflow-hidden transition-all duration-700`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.1]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

                {isOwnProfile && (
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={cycleTheme}
                            className="bg-black/20 hover:bg-black/30 text-white border border-white/20 backdrop-blur-sm transition-all"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Change Aura
                        </Button>
                        <Button variant="ghost" size="sm" className="bg-black/20 hover:bg-black/30 text-white border border-white/20 backdrop-blur-sm transition-all">
                            <Camera className="w-4 h-4 mr-2" />
                            Upload
                        </Button>
                    </div>
                )}
            </div>

            {/* Profile Content Container */}
            <div className="container mx-auto px-4 sm:px-6 relative">
                <div className="-mt-16 sm:-mt-20 mb-6">
                    <div className="flex flex-col md:flex-row items-end md:items-start gap-4 sm:gap-6">

                        {/* Avatar */}
                        <div className="relative group shrink-0 mx-auto md:mx-0 z-10">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-[var(--background)] shadow-2xl overflow-hidden relative">
                                <Avatar className="w-full h-full border-2 border-white/10">
                                    <AvatarImage
                                        src={
                                            user.avatarConfig
                                                ? generateAvatarUrl(user.avatarConfig as AvatarConfig)
                                                : user.profileImage
                                        }
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-4xl bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white">
                                        {(user.name && user.name !== "null" ? user.name : "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            {isOwnProfile && onEditAvatar && (
                                <button
                                    onClick={onEditAvatar}
                                    className="absolute bottom-2 right-2 w-10 h-10 bg-[var(--color-aurora-purple)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-[var(--background)]"
                                    title="Edit Avatar"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Profile Info & Actions */}
                        <div className="flex-1 min-w-0 pt-2 sm:pt-24 md:pt-4 text-center md:text-left w-full">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-1">
                                        {user.name && user.name !== "null" ? user.name : "User"}
                                    </h1>
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-[var(--muted-foreground)] text-sm mb-3">
                                        {user.industry && (
                                            <div className="flex items-center gap-1.5 bg-[var(--accent)] px-2.5 py-1 rounded-full"><Briefcase className="w-3.5 h-3.5" /> {user.industry}</div>
                                        )}
                                        {user.location && (
                                            <div className="flex items-center gap-1.5 bg-[var(--accent)] px-2.5 py-1 rounded-full"><MapPin className="w-3.5 h-3.5" /> {user.location}</div>
                                        )}
                                        <div className="flex items-center gap-1.5 bg-[var(--accent)] px-2.5 py-1 rounded-full"><Calendar className="w-3.5 h-3.5" /> Joined {formatDistanceToNow(user._creationTime)} ago</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    {actionButtons}
                                </div>
                            </div>

                            {/* Bio & Interests */}
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
                                <div className="space-y-4">
                                    {user.bio && (
                                        <p className="text-[var(--foreground)]/80 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto md:mx-0">
                                            {user.bio}
                                        </p>
                                    )}

                                    {user.interests && user.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                            {user.interests.map((tag: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[var(--foreground)]/80 border-0 px-3 py-1 font-normal transition-all hover:scale-105 cursor-default">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats Card */}
                                {!hideStats && stats && (
                                    <div className="flex items-center justify-between gap-6 px-6 py-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm self-start mx-auto md:mx-0 w-full lg:w-auto min-w-[300px]">
                                        <div className="text-center flex-1">
                                            <p className="text-2xl font-bold text-[var(--color-aurora-purple)]">{user.credits}</p>
                                            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Credits</p>
                                        </div>
                                        <div className="w-px h-10 bg-[var(--border)]" />
                                        <div className="text-center flex-1">
                                            <div className="flex items-center justify-center gap-1">
                                                <p className="text-2xl font-bold text-[var(--foreground)]">{user.trustScore}</p>
                                            </div>
                                            <div className="flex justify-center -mt-1 mb-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span key={star} className={`text-[10px] ${star <= trustStars ? "text-[var(--color-aurora-yellow)]" : "text-[var(--border)]"}`}>★</span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Trust</p>
                                        </div>
                                        <div className="w-px h-10 bg-[var(--border)]" />
                                        <div className="text-center flex-1">
                                            <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalPosts}</p>
                                            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Posts</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
