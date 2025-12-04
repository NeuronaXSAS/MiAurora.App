"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  TrendingUp,
  FileText,
  CheckCircle2,
  Briefcase,
  Award,
  Calendar,
  MapPin,
  Target,
  Edit,
  Heart,
  Bell,
  BellOff,
  Bookmark,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { HydrationTracker } from "@/components/health/hydration-tracker";
import { EmotionalCheckin } from "@/components/health/emotional-checkin";
import { MeditationSection } from "@/components/health/meditation-section";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { AvatarCreator } from "@/components/avatar-creator";
import { BadgesShowcase } from "@/components/badges-showcase";

export default function ProfilePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [workosId, setWorkosId] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    industry: "",
    careerGoals: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Mutation to update avatar
  const updateAvatar = useMutation(api.users.updateAvatar);

  const updateProfile = useMutation(api.users.completeOnboarding);
  
  // Push notifications
  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed, 
    subscribe: subscribePush, 
    unsubscribe: unsubscribePush,
    isLoading: pushLoading 
  } = usePushNotifications();

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Fetch user stats
  const stats = useQuery(
    api.users.getUserStats,
    userId ? { userId } : "skip"
  );

  // Fetch transaction history
  const transactions = useQuery(
    api.users.getTransactionHistory,
    userId ? { userId, limit: 10 } : "skip"
  );

  // Fetch recent posts
  const recentPosts = useQuery(
    api.posts.getUserRecent,
    userId ? { userId, limit: 5 } : "skip"
  );

  // Fetch saved posts
  const savedPosts = useQuery(
    api.savedPosts.getSavedPosts,
    userId ? { userId, limit: 10 } : "skip"
  );

  // Get user ID and WorkOS ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
        if (data.workosUserId) {
          setWorkosId(data.workosUserId);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  // Populate edit form when user data loads
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name && user.name !== 'null' ? user.name : "",
        bio: user.bio || "",
        location: user.location || "",
        industry: user.industry || "",
        careerGoals: user.careerGoals || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!workosId) return;
    
    setIsSaving(true);
    try {
      await updateProfile({
        workosId,
        bio: editForm.bio || undefined,
        location: editForm.location || undefined,
        industry: editForm.industry || undefined,
        careerGoals: editForm.careerGoals || undefined,
      });
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate badges
  const badges = [];
  if (stats) {
    if (stats.totalPosts >= 1) badges.push({ name: "First Contributor", icon: "🎉" });
    if (stats.totalPosts >= 10) badges.push({ name: "Active Contributor", icon: "⭐" });
    if (stats.totalVerifications >= 10) badges.push({ name: "Top Verifier", icon: "✅" });
    if (stats.womenHelped >= 50) badges.push({ name: "Community Helper", icon: "💝" });
    if (user && user.trustScore >= 100) badges.push({ name: "Trusted Member", icon: "🏆" });
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let completed = 0;
    const total = 7;
    
    if (user.name && user.name !== 'null') completed++;
    if (user.bio) completed++;
    if (user.location) completed++;
    if (user.industry) completed++;
    if (user.careerGoals) completed++;
    if (user.profileImage) completed++;
    if (user.interests && user.interests.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // Calculate rank percentile (simplified)
  const getRankPercentile = (trustScore: number) => {
    if (trustScore >= 500) return "Top 1%";
    if (trustScore >= 200) return "Top 5%";
    if (trustScore >= 100) return "Top 10%";
    if (trustScore >= 50) return "Top 25%";
    return "Top 50%";
  };

  // Calculate trust score stars (out of 5)
  const getTrustStars = (trustScore: number) => {
    if (trustScore >= 500) return 5;
    if (trustScore >= 200) return 4;
    if (trustScore >= 100) return 3;
    if (trustScore >= 50) return 2;
    return 1;
  };

  const profileCompletion = calculateProfileCompletion();
  const trustStars = user ? getTrustStars(user.trustScore) : 0;

  if (!user || !stats) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar with Edit Button */}
            <div className="relative group">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border-4 border-white/50">
                <AvatarImage src={user.avatarConfig ? generateAvatarUrl(user.avatarConfig as AvatarConfig) : user.profileImage} />
                <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white">
                  {(user.name && user.name !== 'null' ? user.name : 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setShowAvatarCreator(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                title="Edit Avatar"
              >
                <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {user.name && user.name !== 'null' ? user.name : 'User'}
                </h1>
                {/* Premium Badge */}
                {user.isPremium ? (
                  <Badge className="bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] text-slate-900 border-0 font-semibold">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                ) : (
                  <Link href="/premium">
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer">
                      <Crown className="w-3 h-3 mr-1" />
                      Upgrade
                    </Badge>
                  </Link>
                )}
                <Button
                  onClick={() => setShowEditDialog(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/40 text-white hover:bg-white/30 min-h-[44px]"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                {user.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.industry}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Joined {formatDistanceToNow(user._creationTime, { addSuffix: true })}</span>
                  <span className="sm:hidden">Member</span>
                </div>
              </div>
              {user.bio && (
                <div className="bg-white/10 rounded-xl p-2 sm:p-3 mb-2">
                  <p className="text-xs sm:text-sm">{user.bio}</p>
                </div>
              )}
              {user.careerGoals && (
                <div className="flex items-start gap-2 bg-white/10 rounded-xl p-2 sm:p-3">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">{user.careerGoals}</p>
                </div>
              )}
              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.interests.map((interest: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion & Notifications */}
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Profile Completion */}
              <div className="flex-1 bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/80">Profile Completion</span>
                  <span className="text-sm font-bold text-white">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-mint)] rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="text-xs text-white/70 mt-2">
                    Complete your profile to increase your Trust Score
                  </p>
                )}
              </div>
              
              {/* Push Notifications */}
              {pushSupported && (
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pushSubscribed ? 'bg-[var(--color-aurora-mint)]/30' : 'bg-white/20'}`}>
                    {pushSubscribed ? (
                      <Bell className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                    ) : (
                      <BellOff className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {pushSubscribed ? "Notifications On" : "Enable Notifications"}
                    </p>
                    <p className="text-xs text-white/70">
                      {pushSubscribed ? "You'll receive reminders" : "Get hydration & check-in reminders"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={pushSubscribed ? "outline" : "default"}
                    onClick={async () => {
                      if (pushSubscribed) {
                        await unsubscribePush();
                      } else {
                        // Request permission first
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                          // Then subscribe with VAPID key
                          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
                          if (vapidKey) {
                            await subscribePush(vapidKey);
                          } else {
                            // Show local notification as fallback
                            new Notification('Aurora App', {
                              body: 'Notifications enabled! You\'ll receive safety reminders.',
                              icon: '/icon.png'
                            });
                          }
                        }
                      }
                    }}
                    disabled={pushLoading}
                    className={`min-h-[40px] ${pushSubscribed ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' : 'bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] hover:bg-[var(--color-aurora-mint)]/90'}`}
                  >
                    {pushLoading ? "..." : pushSubscribed ? "Disable" : "Enable"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Mobile-first responsive layout */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* Desktop: Better organized 12-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          {/* Left Column - Stats Overview (Desktop: 4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-6 order-2 lg:order-1">
            {/* Stats Section - Vertical stack on desktop for better scanning */}
            <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 pb-3">
                <CardTitle className="text-base lg:text-lg text-[var(--foreground)] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Credits - Highlighted */}
                <div className="flex items-center justify-between p-3 bg-[var(--color-aurora-yellow)]/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--color-aurora-yellow)]/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">Credits</span>
                  </div>
                  <span className="text-2xl font-bold text-[var(--foreground)]">{user.credits}</span>
                </div>
                
                {/* Other stats in compact rows */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                    <FileText className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                    <div>
                      <p className="text-lg font-bold text-[var(--foreground)]">{stats.totalPosts}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                    <div>
                      <p className="text-lg font-bold text-[var(--foreground)]">{stats.totalVerifications}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                    <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                    <div>
                      <p className="text-lg font-bold text-[var(--foreground)]">{stats.womenHelped}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Helped</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                    <TrendingUp className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                    <div>
                      <p className="text-lg font-bold text-[var(--foreground)]">{user.monthlyCreditsEarned || 0}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Monthly</p>
                    </div>
                  </div>
                </div>

                {/* Trust Score with stars */}
                <div className="p-3 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                      <span className="text-sm font-medium text-[var(--foreground)]">Trust Score</span>
                    </div>
                    <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0">
                      {getRankPercentile(user.trustScore)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[var(--foreground)]">{user.trustScore}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= trustStars ? 'text-[var(--color-aurora-yellow)]' : 'text-[var(--muted-foreground)]/30'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Showcase - Desktop left column */}
            <div className="hidden lg:block">
              {userId && <BadgesShowcase userId={userId} />}
            </div>

            {/* Recent Posts - Desktop left column */}
            <Card className="bg-[var(--card)] border-[var(--border)] hidden lg:block">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[var(--foreground)]">Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentPosts && recentPosts.length > 0 ? (
                    recentPosts.slice(0, 3).map((post) => (
                      <div key={post._id} className="border-b border-[var(--border)] last:border-0 pb-2 last:pb-0">
                        <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">{post.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                            {post.rating}/5 ⭐
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[var(--muted-foreground)] py-2 text-sm">No posts yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saved Posts - Desktop left column */}
            <Card className="bg-[var(--card)] border-[var(--border)] hidden lg:block">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                  <Bookmark className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  Saved Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedPosts && savedPosts.length > 0 ? (
                    savedPosts.slice(0, 3).map((post: any) => (
                      <Link 
                        key={post._id} 
                        href={`/feed?post=${post._id}`}
                        className="block border-b border-[var(--border)] last:border-0 pb-2 last:pb-0 hover:bg-[var(--accent)] -mx-2 px-2 py-1 rounded-lg transition-colors"
                      >
                        <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">{post.title}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-center text-[var(--muted-foreground)] py-2 text-sm">No saved posts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center/Right Column - Wellness & Activity (Desktop: 8 cols) */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-6 order-1 lg:order-2">
            {/* Wellness Section - Your Personal Evolution Journal */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                  <span className="hidden sm:inline">Daily Wellness</span>
                  <span className="sm:hidden">My Wellness</span>
                </h2>
                <Link href="/health">
                  <Button variant="ghost" size="sm" className="text-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/10 min-h-[36px]">
                    View All →
                  </Button>
                </Link>
              </div>
              
              {/* Desktop: 2 columns side by side, Mobile: Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                {/* Hydration Tracker */}
                {userId && <HydrationTracker userId={userId} />}
                
                {/* Emotional Check-in */}
                {userId && <EmotionalCheckin userId={userId} />}
              </div>

              {/* Meditation Section - Full Width */}
              {userId && <MeditationSection userId={userId} />}
            </div>

            {/* Mobile-only Stats Grid */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--color-aurora-blue)]" />
                Your Progress
              </h2>
              {/* Stats Cards - Compact grid on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {/* Credits - Compact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-aurora-yellow)]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-aurora-yellow)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">{user.credits}</p>
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">Credits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Earnings - Compact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-aurora-mint)]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-aurora-mint)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">{user.monthlyCreditsEarned || 0}</p>
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Score - Compact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-aurora-purple)]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-aurora-purple)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">{user.trustScore}</p>
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">{getRankPercentile(user.trustScore)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1 sm:mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm sm:text-lg ${
                          star <= trustStars ? 'text-[var(--color-aurora-yellow)]' : 'text-[var(--muted-foreground)]/30'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Posts - Compact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-aurora-blue)]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-aurora-blue)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">{stats.totalPosts}</p>
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verifications - Compact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--color-aurora-pink)]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-aurora-pink)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">{stats.totalVerifications}</p>
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Women Helped - Compact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">{stats.womenHelped}</p>
                      <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">Helped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>

              {/* Recent Activity - Mobile only */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-[var(--foreground)]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 5).map((tx, index) => (
                      <div key={index} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            tx.amount > 0 ? 'bg-[var(--color-aurora-mint)]/20' : 'bg-[var(--color-aurora-salmon)]/20'
                          }`}>
                            <span className={`text-xs sm:text-sm ${tx.amount > 0 ? 'text-[var(--color-aurora-mint)]' : 'text-[var(--color-aurora-salmon)]'}`}>
                              {tx.amount > 0 ? '+' : '-'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm text-[var(--foreground)] truncate">
                              {tx.type === 'post_created' && 'Created a post'}
                              {tx.type === 'verification' && 'Verified a post'}
                              {tx.type === 'opportunity_unlock' && 'Unlocked opportunity'}
                              {tx.type === 'signup_bonus' && 'Signup bonus'}
                              {tx.type === 'meditation' && 'Meditation session'}
                              {tx.type === 'hydration' && 'Hydration goal'}
                            </p>
                            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                              {formatDistanceToNow(tx._creationTime, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={tx.amount > 0 ? "default" : "secondary"} className={tx.amount > 0 ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]" : "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[var(--muted-foreground)] py-4">No activity yet</p>
                  )}
                </div>
              </CardContent>
              </Card>
            </div>

            {/* Mobile-only Badges */}
            <div className="lg:hidden">
              {userId && <BadgesShowcase userId={userId} />}
            </div>

            {/* Mobile-only Recent Posts */}
            <Card className="bg-[var(--card)] border-[var(--border)] lg:hidden">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPosts && recentPosts.length > 0 ? (
                    recentPosts.map((post) => (
                      <div key={post._id} className="border-b border-[var(--border)] last:border-0 pb-3 last:pb-0">
                        <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">{post.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                            {post.rating}/5 ⭐
                          </Badge>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {post.verificationCount} verifications
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[var(--muted-foreground)] py-4">No posts yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile-only Saved Posts */}
            <Card className="bg-[var(--card)] border-[var(--border)] lg:hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                  <Bookmark className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                  Saved Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedPosts && savedPosts.length > 0 ? (
                    savedPosts.map((post: any) => (
                      <Link 
                        key={post._id} 
                        href={`/feed?post=${post._id}`}
                        className="block border-b border-[var(--border)] last:border-0 pb-3 last:pb-0 hover:bg-[var(--accent)] -mx-2 px-2 py-1 rounded-lg transition-colors"
                      >
                        <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">{post.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                            {post.lifeDimension}
                          </Badge>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            by {post.author?.name || "Anonymous"}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Bookmark className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
                      <p className="text-[var(--muted-foreground)] text-sm">No saved posts yet</p>
                      <p className="text-[var(--muted-foreground)] text-xs mt-1">Tap the bookmark icon on posts to save them</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">Edit Profile</DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Update your profile information. This helps others connect with you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry / Role</Label>
              <Input
                id="industry"
                placeholder="e.g., Software Engineer, Student"
                value={editForm.industry}
                onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="careerGoals">Career Goals</Label>
              <Textarea
                id="careerGoals"
                placeholder="What are your career aspirations?"
                value={editForm.careerGoals}
                onChange={(e) => setEditForm({ ...editForm, careerGoals: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
              className="border-[var(--border)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Creator Dialog */}
      {userId && (
        <AvatarCreator
          open={showAvatarCreator}
          onComplete={async (avatarConfig) => {
            try {
              await updateAvatar({ userId, avatarConfig });
              setShowAvatarCreator(false);
            } catch (error) {
              console.error("Error updating avatar:", error);
            }
          }}
          onSkip={() => setShowAvatarCreator(false)}
        />
      )}
    </div>
  );
}
