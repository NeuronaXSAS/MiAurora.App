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
  Bookmark,
  Crown,
  MessageSquare,
  Clock,
  Lightbulb,
  Zap,
  DollarSign,
  Users,
  Star,
  Settings,
  Camera,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { HydrationTracker } from "@/components/health/hydration-tracker";
import { EmotionalCheckin } from "@/components/health/emotional-checkin";
import { MeditationSection } from "@/components/health/meditation-section";
import { generateAvatarUrl, AvatarConfig } from "@/hooks/use-avatar";
import { SmartAd, useIsPremium } from "@/components/ads/smart-ad";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { AvatarCreator } from "@/components/avatar-creator";
import { BadgesShowcase } from "@/components/badges-showcase";
import { LifeCanvas } from "@/components/life-canvas";
import { HabitTracker } from "@/components/habit-tracker";
import { HabitDashboard } from "@/components/habit-dashboard";
import { DailyAffirmation } from "@/components/daily-affirmation";

export default function ProfilePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [workosId, setWorkosId] = useState<string>("");
  const isPremium = useIsPremium();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    industry: "",
    careerGoals: "",
  });
  const [isSaving, setIsSaving] = useState(false);
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

  // Mutation to update avatar
  const updateAvatar = useMutation(api.users.updateAvatar);

  const updateProfile = useMutation(api.users.completeOnboarding);

  // Push notifications
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    isLoading: pushLoading,
  } = usePushNotifications();

  // Fetch user data
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  // Fetch user stats
  const stats = useQuery(api.users.getUserStats, userId ? { userId } : "skip");

  // Fetch transaction history
  const transactions = useQuery(
    api.users.getTransactionHistory,
    userId ? { userId, limit: 10 } : "skip",
  );

  // Fetch recent posts
  const recentPosts = useQuery(
    api.posts.getUserRecent,
    userId ? { userId, limit: 5 } : "skip",
  );

  // Fetch saved posts
  const savedPosts = useQuery(
    api.savedPosts.getSavedPosts,
    userId ? { userId, limit: 10 } : "skip",
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
        name: user.name && user.name !== "null" ? user.name : "",
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
    if (stats.totalPosts >= 1)
      badges.push({ name: "First Contributor", icon: "🎉" });
    if (stats.totalPosts >= 10)
      badges.push({ name: "Active Contributor", icon: "⭐" });
    if (stats.totalVerifications >= 10)
      badges.push({ name: "Top Verifier", icon: "✅" });
    if (stats.womenHelped >= 50)
      badges.push({ name: "Community Helper", icon: "💝" });
    if (user && user.trustScore >= 100)
      badges.push({ name: "Trusted Member", icon: "🏆" });
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let completed = 0;
    const total = 7;

    if (user.name && user.name !== "null") completed++;
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
          <p className="text-[var(--muted-foreground)]">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Profile Header */}
      {/* Enhanced Profile Header */}
      <div className="relative mb-2">
        {/* Decorative Cover Background */}
        <div className="h-48 sm:h-64 bg-gradient-to-r from-[var(--color-aurora-purple)] via-[var(--color-aurora-violet)] to-[var(--color-aurora-pink)] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.05]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <Button variant="ghost" size="sm" className="bg-black/20 hover:bg-black/30 text-white border border-white/20 backdrop-blur-sm transition-all">
              <Camera className="w-4 h-4 mr-2" />
              Edit Cover
            </Button>
          </div>
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
                <button
                  onClick={() => setShowAvatarCreator(true)}
                  className="absolute bottom-2 right-2 w-10 h-10 bg-[var(--color-aurora-purple)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-[var(--background)]"
                  title="Edit Avatar"
                >
                  <Edit className="w-4 h-4" />
                </button>
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
                    {user.isPremium ? (
                      <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/10 to-[var(--color-aurora-orange)]/10 border border-[var(--color-aurora-yellow)]/20 rounded-xl px-4 py-2 flex items-center gap-2">
                        <div className="p-1 bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] rounded-full">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-bold text-[var(--color-aurora-orange)] text-sm">Premium</span>
                      </div>
                    ) : (
                      <Button className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] hover:opacity-90 text-white shadow-lg shadow-[var(--color-aurora-purple)]/20 rounded-xl h-10 px-6 font-semibold">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setShowEditDialog(true)}
                      className="border-[var(--border)] hover:bg-[var(--accent)] rounded-xl h-10 w-10 p-0"
                      title="Edit Profile"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
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
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reddit-style Tabs Navigation */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-0 h-12 p-0 gap-0 overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12"
              >
                <FileText className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="habits"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12"
              >
                <Target className="w-4 h-4 mr-2" />
                Habits
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Saved
              </TabsTrigger>
              <TabsTrigger
                value="wellness"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12"
              >
                <Heart className="w-4 h-4 mr-2" />
                Wellness
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12 hidden sm:flex"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-4 h-12 hidden sm:flex"
              >
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content - Tab-based layout */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
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
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Credits
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-[var(--foreground)]">
                        {user.credits}
                      </span>
                    </div>

                    {/* Other stats in compact rows */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                        <FileText className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                        <div>
                          <p className="text-lg font-bold text-[var(--foreground)]">
                            {stats.totalPosts}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Posts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                        <div>
                          <p className="text-lg font-bold text-[var(--foreground)]">
                            {stats.totalVerifications}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Verified
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                        <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" />
                        <div>
                          <p className="text-lg font-bold text-[var(--foreground)]">
                            {stats.womenHelped}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Helped
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-[var(--accent)] rounded-lg">
                        <TrendingUp className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        <div>
                          <p className="text-lg font-bold text-[var(--foreground)]">
                            {user.monthlyCreditsEarned || 0}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Monthly
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trust Score with stars */}
                    <div className="p-3 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            Trust Score
                          </span>
                        </div>
                        <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] border-0">
                          {getRankPercentile(user.trustScore)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[var(--foreground)]">
                          {user.trustScore}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${star <= trustStars
                                ? "text-[var(--color-aurora-yellow)]"
                                : "text-[var(--muted-foreground)]/30"
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
                    <CardTitle className="text-base text-[var(--foreground)]">
                      Recent Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentPosts && recentPosts.length > 0 ? (
                        recentPosts.slice(0, 3).map((post) => (
                          <div
                            key={post._id}
                            className="border-b border-[var(--border)] last:border-0 pb-2 last:pb-0"
                          >
                            <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                              >
                                {post.rating}/5 ⭐
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-[var(--muted-foreground)] py-2 text-sm">
                          No posts yet
                        </p>
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
                            <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">
                              {post.title}
                            </p>
                          </Link>
                        ))
                      ) : (
                        <p className="text-center text-[var(--muted-foreground)] py-2 text-sm">
                          No saved posts
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sidebar Ad - Desktop only */}
                <div className="hidden lg:block">
                  <SmartAd placement="sidebar" isPremium={isPremium} />
                </div>
              </div>

              {/* Center/Right Column - Wellness & Activity (Desktop: 8 cols) */}
              <div className="lg:col-span-8 space-y-4 lg:space-y-6 order-1 lg:order-2">
                {/* Daily Affirmation - Motivational start */}
                {userId && <DailyAffirmation userId={userId} />}

                {/* Life Canvas - GitHub-style life visualization */}
                {userId && <LifeCanvas userId={userId} />}

                {/* Habit Tracker - Build positive habits */}
                {userId && <HabitTracker userId={userId} />}

                {/* Wellness Section - Your Personal Evolution Journal */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                      <span className="hidden sm:inline">Daily Wellness</span>
                      <span className="sm:hidden">My Wellness</span>
                    </h2>
                    <Link href="/health">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--color-aurora-pink)] hover:bg-[var(--color-aurora-pink)]/10 min-h-[36px]"
                      >
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
                            <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                              {user.credits}
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
                              Credits
                            </p>
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
                            <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                              {user.monthlyCreditsEarned || 0}
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
                              This month
                            </p>
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
                            <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                              {user.trustScore}
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
                              {getRankPercentile(user.trustScore)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1 sm:mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm sm:text-lg ${star <= trustStars
                                ? "text-[var(--color-aurora-yellow)]"
                                : "text-[var(--muted-foreground)]/30"
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
                            <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                              {stats.totalPosts}
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
                              Posts
                            </p>
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
                            <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                              {stats.totalVerifications}
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
                              Verified
                            </p>
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
                            <p className="text-xl sm:text-3xl font-bold text-[var(--foreground)]">
                              {stats.womenHelped}
                            </p>
                            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] truncate">
                              Helped
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity - Mobile only */}
                  <Card className="bg-[var(--card)] border-[var(--border)]">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-base sm:text-lg text-[var(--foreground)]">
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-3">
                        {transactions && transactions.length > 0 ? (
                          transactions.slice(0, 5).map((tx, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-1.5 sm:py-2 border-b border-[var(--border)] last:border-0"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0
                                    ? "bg-[var(--color-aurora-mint)]/20"
                                    : "bg-[var(--color-aurora-salmon)]/20"
                                    }`}
                                >
                                  <span
                                    className={`text-xs sm:text-sm ${tx.amount > 0 ? "text-[var(--color-aurora-mint)]" : "text-[var(--color-aurora-salmon)]"}`}
                                  >
                                    {tx.amount > 0 ? "+" : "-"}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-xs sm:text-sm text-[var(--foreground)] truncate">
                                    {tx.type === "post_created" &&
                                      "Created a post"}
                                    {tx.type === "verification" &&
                                      "Verified a post"}
                                    {tx.type === "opportunity_unlock" &&
                                      "Unlocked opportunity"}
                                    {tx.type === "signup_bonus" &&
                                      "Signup bonus"}
                                    {tx.type === "meditation" &&
                                      "Meditation session"}
                                    {tx.type === "hydration" &&
                                      "Hydration goal"}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)]">
                                    {formatDistanceToNow(tx._creationTime, {
                                      addSuffix: true,
                                    })}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  tx.amount > 0 ? "default" : "secondary"
                                }
                                className={
                                  tx.amount > 0
                                    ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                                    : "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
                                }
                              >
                                {tx.amount > 0 ? "+" : ""}
                                {tx.amount} credits
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[var(--muted-foreground)] py-4">
                            No activity yet
                          </p>
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
                    <CardTitle className="text-[var(--foreground)]">
                      Recent Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentPosts && recentPosts.length > 0 ? (
                        recentPosts.map((post) => (
                          <div
                            key={post._id}
                            className="border-b border-[var(--border)] last:border-0 pb-3 last:pb-0"
                          >
                            <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                              >
                                {post.rating}/5 ⭐
                              </Badge>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                {post.verificationCount} verifications
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-[var(--muted-foreground)] py-4">
                          No posts yet
                        </p>
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
                            <p className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]"
                              >
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
                          <p className="text-[var(--muted-foreground)] text-sm">
                            No saved posts yet
                          </p>
                          <p className="text-[var(--muted-foreground)] text-xs mt-1">
                            Tap the bookmark icon on posts to save them
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Habits Tab - Dedicated habit tracking dashboard */}
          <TabsContent value="habits" className="mt-0">
            <div className="max-w-4xl mx-auto">
              {userId && <HabitDashboard userId={userId} />}
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-0">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Your Posts
                </h2>
                <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                  {stats.totalPosts} total
                </Badge>
              </div>
              {recentPosts && recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <Card
                    key={post._id}
                    className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[var(--foreground)] mb-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge
                              variant="secondary"
                              className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]"
                            >
                              {post.rating}/5 ⭐
                            </Badge>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {post.verificationCount} verifications
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {formatDistanceToNow(post._creationTime, {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-50" />
                    <p className="text-[var(--foreground)] font-medium mb-1">
                      No posts yet
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Share your experiences to help other women
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-0">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Saved Posts
                </h2>
                <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                  {savedPosts?.length || 0} saved
                </Badge>
              </div>
              {savedPosts && savedPosts.length > 0 ? (
                savedPosts.map((post: any) => (
                  <Link key={post._id} href={`/feed?post=${post._id}`}>
                    <Card className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[var(--foreground)] mb-1">
                              {post.title}
                            </h3>
                            <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                              {post.description}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <Badge
                                variant="secondary"
                                className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]"
                              >
                                {post.lifeDimension}
                              </Badge>
                              <span className="text-xs text-[var(--muted-foreground)]">
                                by {post.author?.name || "Anonymous"}
                              </span>
                            </div>
                          </div>
                          <Bookmark
                            className="w-5 h-5 text-[var(--color-aurora-purple)]"
                            fill="currentColor"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-8 text-center">
                    <Bookmark className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-50" />
                    <p className="text-[var(--foreground)] font-medium mb-1">
                      No saved posts
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Bookmark posts to find them easily later
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Wellness Tab */}
          <TabsContent value="wellness" className="mt-0">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                  Daily Wellness
                </h2>
                <Link href="/health">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--color-aurora-pink)] text-[var(--color-aurora-pink)]"
                  >
                    View Full Dashboard →
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userId && <HydrationTracker userId={userId} />}
                {userId && <EmotionalCheckin userId={userId} />}
              </div>
              {userId && <MeditationSection userId={userId} />}
            </div>
          </TabsContent>

          {/* Life Insights Tab - NEW */}
          <TabsContent value="insights" className="mt-0">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Life Insights Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  Life Insights & Power Skills
                </h2>
                <Link href="/finance">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--color-aurora-purple)] text-[var(--color-aurora-purple)]"
                  >
                    Financial Tools →
                  </Button>
                </Link>
              </div>

              {/* Decision Making Score */}
              <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 border-[var(--border)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-[var(--foreground)]">
                        Your Life Decision Score
                      </h3>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Based on community interactions & learning
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[var(--color-aurora-purple)]">
                        {Math.min(
                          100,
                          Math.round(
                            user.trustScore / 5 + stats.womenHelped * 2,
                          ),
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        out of 100
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-[var(--card)] rounded-xl">
                      <Zap className="w-5 h-5 text-[var(--color-aurora-yellow)] mx-auto mb-1" />
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {stats.totalPosts}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Shared Wisdom
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[var(--card)] rounded-xl">
                      <Users className="w-5 h-5 text-[var(--color-aurora-pink)] mx-auto mb-1" />
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {stats.womenHelped}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Women Helped
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[var(--card)] rounded-xl">
                      <Star className="w-5 h-5 text-[var(--color-aurora-purple)] mx-auto mb-1" />
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {user.trustScore}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Trust Score
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Power Skills Progress */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                    <Zap className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                    Power Skills Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: "Safety Awareness",
                      progress: 85,
                      color: "var(--color-aurora-mint)",
                    },
                    {
                      name: "Community Building",
                      progress: Math.min(100, stats.womenHelped * 2),
                      color: "var(--color-aurora-pink)",
                    },
                    {
                      name: "Career Growth",
                      progress: 45,
                      color: "var(--color-aurora-blue)",
                    },
                    {
                      name: "Financial Literacy",
                      progress: 30,
                      color: "var(--color-aurora-yellow)",
                    },
                    {
                      name: "Wellness & Self-Care",
                      progress: 60,
                      color: "var(--color-aurora-purple)",
                    },
                  ].map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {skill.name}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {skill.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${skill.progress}%`,
                            backgroundColor: skill.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Personalized Recommendations */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                    <Lightbulb className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/finance" className="block">
                    <div className="p-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-aurora-mint)]/20 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[var(--color-aurora-mint)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--foreground)]">
                            Boost Your Financial Wellness
                          </p>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            Complete the salary negotiation course
                          </p>
                        </div>
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                          +50 credits
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <Link href="/circles" className="block">
                    <div className="p-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-aurora-pink)]/20 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--foreground)]">
                            Join a Support Circle
                          </p>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            Connect with women in your industry
                          </p>
                        </div>
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                          +25 credits
                        </Badge>
                      </div>
                    </div>
                  </Link>
                  <Link href="/opportunities" className="block">
                    <div className="p-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-aurora-blue)]/20 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-[var(--color-aurora-blue)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--foreground)]">
                            Explore Career Opportunities
                          </p>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            3 new jobs match your profile
                          </p>
                        </div>
                        <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                          View
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Premium Upsell */}
              {!user.isPremium && (
                <Card className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] border-0 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Crown className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          Unlock Advanced Insights
                        </h3>
                        <p className="text-white/80 text-sm">
                          Get AI-powered career advice, financial planning &
                          personalized growth paths
                        </p>
                      </div>
                      <Link href="/premium">
                        <Button className="bg-white text-[var(--color-aurora-purple)] hover:bg-white/90">
                          Go Premium
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Credit History
                </h2>
                <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)]">
                  {user.credits} credits
                </Badge>
              </div>
              {transactions && transactions.length > 0 ? (
                transactions.map((tx, index) => (
                  <Card
                    key={index}
                    className="bg-[var(--card)] border-[var(--border)]"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0
                              ? "bg-[var(--color-aurora-mint)]/20"
                              : "bg-[var(--color-aurora-salmon)]/20"
                              }`}
                          >
                            <span
                              className={`text-lg font-bold ${tx.amount > 0 ? "text-[var(--color-aurora-mint)]" : "text-[var(--color-aurora-salmon)]"}`}
                            >
                              {tx.amount > 0 ? "+" : "-"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {tx.type === "post_created" && "Created a post"}
                              {tx.type === "verification" && "Verified a post"}
                              {tx.type === "opportunity_unlock" &&
                                "Unlocked opportunity"}
                              {tx.type === "signup_bonus" && "Signup bonus"}
                              {tx.type === "meditation" && "Meditation session"}
                              {tx.type === "hydration" && "Hydration goal"}
                              {tx.type === "route_shared" && "Shared a route"}
                              {tx.type === "tip_received" && "Received a tip"}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {formatDistanceToNow(tx._creationTime, {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            tx.amount > 0
                              ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                              : "bg-[var(--color-aurora-salmon)]/20 text-[var(--color-aurora-salmon)]"
                          }
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount} credits
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-50" />
                    <p className="text-[var(--foreground)] font-medium mb-1">
                      No activity yet
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Your credit history will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[var(--card)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Update your profile information. This helps others connect with
              you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry / Role</Label>
              <Input
                id="industry"
                placeholder="e.g., Software Engineer, Student"
                value={editForm.industry}
                onChange={(e) =>
                  setEditForm({ ...editForm, industry: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="careerGoals">Career Goals</Label>
              <Textarea
                id="careerGoals"
                placeholder="What are your career aspirations?"
                value={editForm.careerGoals}
                onChange={(e) =>
                  setEditForm({ ...editForm, careerGoals: e.target.value })
                }
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
