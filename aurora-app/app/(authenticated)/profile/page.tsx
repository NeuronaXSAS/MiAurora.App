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
  User,
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
  Palette,
  HelpCircle,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { HydrationTracker } from "@/components/health/hydration-tracker";
import { EmotionalCheckin } from "@/components/health/emotional-checkin";
import { MeditationSection } from "@/components/health/meditation-section";
import { AvatarCreator, AvatarConfig, generateAvatarUrl } from "@/components/avatar-creator";

export default function ProfilePage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [workosId, setWorkosId] = useState<string>("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    industry: "",
    careerGoals: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const updateProfile = useMutation(api.users.completeOnboarding);

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
            <div className="relative">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 border-4 border-white/50">
                <AvatarImage src={customAvatar || user.profileImage} />
                <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] text-white">
                  {(user.name && user.name !== 'null' ? user.name : 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                onClick={() => setShowAvatarCreator(true)}
                size="icon"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[var(--color-aurora-purple)] shadow-lg min-h-[32px] min-w-[32px]"
                title="Create Custom Avatar"
              >
                <Palette className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {user.name && user.name !== 'null' ? user.name : 'User'}
                </h1>
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

          {/* Profile Completion Bar */}
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 max-w-2xl">
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
                  Complete your profile to increase your Trust Score and unlock more features
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Wellness Widgets */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Wellness Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                Daily Wellness
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Hydration Tracker */}
                {userId && <HydrationTracker userId={userId} />}
                
                {/* Emotional Check-in */}
                {userId && <EmotionalCheckin userId={userId} />}
              </div>

              {/* Meditation Section - Full Width */}
              {userId && <MeditationSection userId={userId} />}
            </div>

            {/* Stats Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--color-aurora-blue)]" />
                Your Progress
              </h2>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-aurora-yellow)]/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[var(--foreground)]">{user.credits}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Available to spend</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Monthly Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-aurora-mint)]/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-[var(--color-aurora-mint)]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[var(--foreground)]">{user.monthlyCreditsEarned || 0}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">This month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-[var(--color-aurora-purple)]/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[var(--foreground)]">{user.trustScore}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{getRankPercentile(user.trustScore)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg ${
                          star <= trustStars ? 'text-[var(--color-aurora-yellow)]' : 'text-[var(--muted-foreground)]'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Posts Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-aurora-blue)]/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[var(--color-aurora-blue)]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[var(--foreground)]">{stats.totalPosts}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Contributions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-aurora-pink)]/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-[var(--color-aurora-pink)]" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[var(--foreground)]">{stats.totalVerifications}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Posts verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>

              {/* Impact */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl font-bold text-white">{stats.womenHelped}</span>
                  </div>
                  <p className="text-2xl font-bold mb-2 text-[var(--color-aurora-purple)]">Women Helped</p>
                  <p className="text-[var(--muted-foreground)]">
                    Your contributions have been verified {stats.womenHelped} times, helping other women make informed decisions
                  </p>
                </div>
              </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-[var(--color-aurora-mint)]/20' : 'bg-[var(--color-aurora-salmon)]/20'
                          }`}>
                            <span className={tx.amount > 0 ? 'text-[var(--color-aurora-mint)]' : 'text-[var(--color-aurora-salmon)]'}>
                              {tx.amount > 0 ? '+' : ''}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--foreground)]">
                              {tx.type === 'post_created' && 'Created a post'}
                              {tx.type === 'verification' && 'Verified a post'}
                              {tx.type === 'opportunity_unlock' && 'Unlocked opportunity'}
                              {tx.type === 'signup_bonus' && 'Signup bonus'}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
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
          </div>

          {/* Right Column - Badges & Recent Posts */}
          <div className="space-y-6">
            {/* Badges */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                  <Award className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {badges.map((badge, index) => (
                      <div
                        key={index}
                        className="bg-[var(--color-aurora-lavender)]/20 border border-[var(--color-aurora-lavender)]/30 rounded-xl p-3 text-center"
                      >
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <p className="text-xs font-medium text-[var(--foreground)]">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[var(--muted-foreground)] py-4">
                    Earn badges by contributing!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
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

      {/* Avatar Creator Modal */}
      <AvatarCreator
        open={showAvatarCreator}
        onComplete={(avatarConfig: AvatarConfig) => {
          const avatarUrl = generateAvatarUrl(avatarConfig);
          setCustomAvatar(avatarUrl);
          setShowAvatarCreator(false);
          // TODO: Save avatar to user profile in Convex
        }}
        onSkip={() => setShowAvatarCreator(false)}
      />
    </div>
  );
}
