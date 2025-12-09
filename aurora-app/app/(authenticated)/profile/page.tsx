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


import { ProfileHeader } from "@/components/profile-header";

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
      <ProfileHeader
        user={user}
        stats={stats}
        isOwnProfile={true}
        onEditProfile={() => setShowEditDialog(true)}
        onEditAvatar={() => setShowAvatarCreator(true)}
        actionButtons={
          <>
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
          </>
        }
      />

      {/* Social-Style Tabs Navigation */}
      <div className="mt-8 border-b border-[var(--border)] sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-0 h-14 p-0 gap-6 w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-2 h-14 text-base font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                My World
              </TabsTrigger>
              <TabsTrigger
                value="sanctuary"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-2 h-14 text-base font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Heart className="w-4 h-4 mr-2" />
                Sanctuary
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-2 h-14 text-base font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-aurora-purple)] data-[state=active]:text-[var(--color-aurora-purple)] rounded-none px-2 h-14 text-base font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Bookmark className="w-4 h-4 mr-2" />
                Saved
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content - Tab-based layout */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 sm:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>

          {/* My World Tab (Public Preview) */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Pinned / Badges Section */}
            {userId && <BadgesShowcase userId={userId} />}

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recent Posts Column */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--foreground)]" />
                  Recent Activity
                </h3>
                {recentPosts && recentPosts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentPosts.map((post) => (
                      <Link key={post._id} href={`/feed?post=${post._id}`} className="block h-full">
                        <Card className="h-full hover:border-[var(--color-aurora-purple)] transition-colors cursor-pointer group overflow-hidden border-[var(--border)] bg-[var(--card)]">
                          <div className="aspect-video bg-[var(--accent)] relative overflow-hidden">
                            {post.image ? (
                              <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                                <FileText className="w-8 h-8 opacity-20" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                              {post.category || "Post"}
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h4 className="font-semibold line-clamp-1 group-hover:text-[var(--color-aurora-purple)] transition-colors text-[var(--foreground)]">{post.title}</h4>
                            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
                              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments || 0}</span>
                              <span className="ml-auto">{formatDistanceToNow(post._creationTime)} ago</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
                    <p className="text-[var(--muted-foreground)]">No posts shared yet</p>
                  </div>
                )}
              </div>

              {/* Sidebar Widgets (Ad, Suggestions) */}
              <div className="space-y-4">
                <SmartAd placement="sidebar" isPremium={isPremium} />

                {/* Suggested Connections Placeholder */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[var(--foreground)]">Grow Your Circle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-[var(--muted-foreground)]">Connect with other women in {user.industry || "your industry"}.</p>
                      <Button variant="outline" className="w-full border-[var(--color-aurora-purple)] text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10">Find Connections</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Sanctuary Tab (Private Health & Habits) */}
          <TabsContent value="sanctuary" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                {/* Daily Affirmation */}
                {userId && <DailyAffirmation userId={userId} />}

                {/* Combined Habit & Life Dashboard */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Habit Tracker */}
                  {userId && <HabitTracker userId={userId} />}

                  {/* Life Canvas */}
                  {userId && <LifeCanvas userId={userId} />}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                {/* Wellness Widgets */}
                <div className="space-y-4">
                  {userId && <HydrationTracker userId={userId} />}
                  {userId && <EmotionalCheckin userId={userId} />}
                  {userId && <MeditationSection userId={userId} />}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Insights Tab (Stats & History) */}
          <TabsContent value="insights" className="mt-0 space-y-6">
            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[var(--color-aurora-yellow)]/10 border-0">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-6 h-6 text-[var(--color-aurora-yellow)] mb-2" />
                  <div className="text-2xl font-bold text-[var(--foreground)]">{user.credits}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Total Credits</div>
                </CardContent>
              </Card>
              <Card className="bg-[var(--color-aurora-mint)]/10 border-0">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Award className="w-6 h-6 text-[var(--color-aurora-mint)] mb-2" />
                  <div className="text-2xl font-bold text-[var(--foreground)]">{user.trustScore}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Trust Score</div>
                </CardContent>
              </Card>
              <Card className="bg-[var(--color-aurora-blue)]/10 border-0">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <FileText className="w-6 h-6 text-[var(--color-aurora-blue)] mb-2" />
                  <div className="text-2xl font-bold text-[var(--foreground)]">{stats.totalPosts}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Posts Created</div>
                </CardContent>
              </Card>
              <Card className="bg-[var(--color-aurora-pink)]/10 border-0">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <Heart className="w-6 h-6 text-[var(--color-aurora-pink)] mb-2" />
                  <div className="text-2xl font-bold text-[var(--foreground)]">{stats.womenHelped}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Women Helped</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Impact & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Trust Score Analysis */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[var(--foreground)]">Trust Score Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--foreground)]">Community Trust</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= trustStars ? "fill-[var(--color-aurora-yellow)] text-[var(--color-aurora-yellow)]" : "text-[var(--border)]"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Your trust score is calculated based on verified interactions, positive feedback from connections, and safe behavior within the ecosystem. High trust scores unlock exclusive opportunities and circles.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[var(--foreground)]">Credit History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions && transactions.length > 0 ? (
                        transactions.slice(0, 10).map((tx, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium text-[var(--foreground)]">
                                {tx.type === "post_created" && "Shared Wisdom"}
                                {tx.type === "verification" && "Community Verification"}
                                {tx.type === "signup_bonus" && "Welcome Bonus"}
                                {tx.type || "Activity"}
                              </span>
                              <span className="text-xs text-[var(--muted-foreground)]">{formatDistanceToNow(tx._creationTime)} ago</span>
                            </div>
                            <Badge variant={tx.amount > 0 ? "default" : "secondary"} className={tx.amount > 0 ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]" : ""}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[var(--muted-foreground)]">No history yet</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Power Skills */}
              <div className="space-y-6">
                <Card className="bg-[var(--card)] border-[var(--border)]">
                  <CardHeader>
                    <CardTitle className="text-lg text-[var(--foreground)]">Power Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "Safety Awareness", val: 85, color: "bg-[var(--color-aurora-mint)]" },
                      { name: "Community", val: Math.min(100, stats.womenHelped * 5), color: "bg-[var(--color-aurora-pink)]" },
                      { name: "Wellness", val: 60, color: "bg-[var(--color-aurora-purple)]" }
                    ].map(skill => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1 text-[var(--foreground)]">
                          <span>{skill.name}</span>
                          <span>{skill.val}%</span>
                        </div>
                        <div className="h-2 bg-[var(--accent)] rounded-full overflow-hidden">
                          <div className={`h-full ${skill.color} transition-all duration-1000`} style={{ width: `${skill.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPosts && savedPosts.length > 0 ? (
                savedPosts.map((post: any) => (
                  <Link key={post._id} href={`/feed?post=${post._id}`} className="block h-full">
                    <Card className="bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] hover:border-[var(--color-aurora-purple)] transition-all h-full">
                      <h4 className="font-semibold text-[var(--foreground)]">{post.title}</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{post.category || "Saved"}</Badge>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-[var(--muted-foreground)] border-2 border-dashed border-[var(--border)] rounded-2xl">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No saved posts yet
                </div>
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
