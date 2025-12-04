"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Search, 
  Lock, 
  Globe,
  MessageCircle,
  Heart,
  Briefcase,
  Shield,
  DollarSign,
  Sun,
  Code,
  Rocket,
  Activity,
  Settings,
  UserPlus,
  LogOut,
  Trash2,
  Eye,
  ArrowLeft,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAvatarUrl } from "@/hooks/use-avatar";
import { formatDistanceToNow } from "date-fns";

interface CirclesHubProps {
  userId: Id<"users">;
}

const CATEGORY_ICONS: Record<string, any> = {
  career: Briefcase,
  motherhood: Heart,
  health: Activity,
  safety: Shield,
  relationships: Users,
  finance: DollarSign,
  wellness: Sun,
  tech: Code,
  entrepreneurship: Rocket,
  general: MessageCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  career: "from-blue-500 to-indigo-500",
  motherhood: "from-pink-500 to-rose-500",
  health: "from-green-500 to-emerald-500",
  safety: "from-red-500 to-orange-500",
  relationships: "from-purple-500 to-violet-500",
  finance: "from-yellow-500 to-amber-500",
  wellness: "from-orange-400 to-yellow-400",
  tech: "from-cyan-500 to-blue-500",
  entrepreneurship: "from-indigo-500 to-purple-500",
  general: "from-gray-500 to-slate-500",
};

export function CirclesHub({ userId }: CirclesHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<Id<"circles"> | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newCircle, setNewCircle] = useState({
    name: "",
    description: "",
    category: "general" as any,
    isPrivate: false,
  });

  // Safe queries with null coalescing for error handling
  const categories = useQuery(api.circles.getCircleCategories, {}) ?? [];
  const myCircles = useQuery(api.circles.getMyCircles, { userId }) ?? [];
  const discoverCircles = useQuery(api.circles.getCircles, {
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 20,
  }) ?? [];

  // Circle detail queries
  const circleDetails = useQuery(
    api.circles.getCircleDetails,
    selectedCircle ? { circleId: selectedCircle, userId } : "skip"
  );
  const circleMembers = useQuery(
    api.circles.getCircleMembers,
    selectedCircle ? { circleId: selectedCircle } : "skip"
  ) ?? [];
  const circlePosts = useQuery(
    api.circles.getCirclePosts,
    selectedCircle ? { circleId: selectedCircle, limit: 20 } : "skip"
  ) ?? [];
  const inviteSearchResults = useQuery(
    api.circles.searchUsersToInvite,
    inviteSearch.length >= 2 && selectedCircle ? { circleId: selectedCircle, searchTerm: inviteSearch } : "skip"
  ) ?? [];

  const createCircle = useMutation(api.circles.createCircle);
  const joinCircle = useMutation(api.circles.joinCircle);
  const leaveCircle = useMutation(api.circles.leaveCircle);
  const inviteToCircle = useMutation(api.circles.inviteToCircle);
  const createPost = useMutation(api.circles.createCirclePost);

  const handleCreateCircle = async () => {
    if (!newCircle.name || !newCircle.description) return;
    
    const result = await createCircle({
      creatorId: userId,
      ...newCircle,
    });
    
    setShowCreateDialog(false);
    setNewCircle({
      name: "",
      description: "",
      category: "general",
      isPrivate: false,
    });
    
    // Open the newly created circle
    if (result) {
      setSelectedCircle(result);
    }
  };

  const handleJoinCircle = async (circleId: Id<"circles">) => {
    try {
      await joinCircle({ circleId, userId });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLeaveCircle = async () => {
    if (!selectedCircle) return;
    if (confirm("Are you sure you want to leave this circle?")) {
      await leaveCircle({ circleId: selectedCircle, userId });
      setSelectedCircle(null);
    }
  };

  const handleInvite = async (inviteeId: Id<"users">) => {
    if (!selectedCircle) return;
    try {
      await inviteToCircle({ circleId: selectedCircle, inviterId: userId, inviteeId });
      setInviteSearch("");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePostMessage = async () => {
    if (!selectedCircle || !newMessage.trim()) return;
    await createPost({ circleId: selectedCircle, userId, content: newMessage });
    setNewMessage("");
  };

  const isInCircle = (circleId: Id<"circles">) => {
    return myCircles?.some((c: any) => c._id === circleId);
  };

  // If a circle is selected, show the detail view
  if (selectedCircle && circleDetails) {
    const Icon = CATEGORY_ICONS[circleDetails.category] || Users;
    const gradient = CATEGORY_COLORS[circleDetails.category] || CATEGORY_COLORS.general;
    const isAdmin = circleDetails.role === "admin";

    return (
      <div className="space-y-6">
        {/* Circle Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCircle(null)}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="bg-[var(--card)] border-[var(--border)] overflow-hidden">
          <div className={`h-24 bg-gradient-to-r ${gradient}`} />
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg border-4 border-[var(--card)]`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">{circleDetails.name}</h2>
                  {circleDetails.isPrivate && <Lock className="w-4 h-4 text-[var(--muted-foreground)]" />}
                </div>
                <p className="text-[var(--muted-foreground)] mb-3">{circleDetails.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-[var(--accent)]">
                    <Users className="w-3 h-3 mr-1" />
                    {circleMembers.length} members
                  </Badge>
                  <Badge variant="secondary" className="bg-[var(--accent)]">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {circlePosts.length} posts
                  </Badge>
                  {isAdmin && (
                    <Badge className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="min-h-[44px]">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[var(--card)] border-[var(--border)]">
                      <DialogHeader>
                        <DialogTitle className="text-[var(--foreground)]">Invite Members</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                          <Input
                            placeholder="Search by name or email..."
                            value={inviteSearch}
                            onChange={(e) => setInviteSearch(e.target.value)}
                            className="pl-10 min-h-[44px] bg-[var(--background)] border-[var(--border)]"
                          />
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {inviteSearchResults.map((user: any) => (
                            <div
                              key={user._id}
                              className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--accent)]/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold">
                                  {user.avatarConfig ? (
                                    <img
                                      src={generateAvatarUrl(user.avatarConfig)}
                                      alt={user.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    user.name.charAt(0)
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                                  <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleInvite(user._id)}
                                className="min-h-[36px] bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/80 text-[var(--color-aurora-violet)]"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Invite
                              </Button>
                            </div>
                          ))}
                          {inviteSearch.length >= 2 && inviteSearchResults.length === 0 && (
                            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                              No users found
                            </p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  variant="outline"
                  onClick={handleLeaveCircle}
                  className="min-h-[44px] text-[var(--color-aurora-salmon)] hover:text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({circleMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {circleMembers.map((member: any) => (
                <div key={member._id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--accent)]/30">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white text-sm font-bold">
                    {member.user?.avatarConfig ? (
                      <img
                        src={generateAvatarUrl(member.user.avatarConfig)}
                        alt={member.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.user?.name?.charAt(0) || "?"
                    )}
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{member.user?.name}</span>
                  {member.role === "admin" && (
                    <Badge className="text-xs bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                      Admin
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Posts / Discussion */}
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)] flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Discussion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Post Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Share something with the circle..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostMessage()}
                className="flex-1 min-h-[44px] bg-[var(--background)] border-[var(--border)]"
              />
              <Button
                onClick={handlePostMessage}
                disabled={!newMessage.trim()}
                className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {circlePosts.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
                  <p className="text-[var(--muted-foreground)]">No posts yet. Start the conversation!</p>
                </div>
              )}
              <AnimatePresence>
                {circlePosts.map((post: any) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--accent)]/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {post.author?.avatarConfig ? (
                          <img
                            src={generateAvatarUrl(post.author.avatarConfig)}
                            alt={post.author.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.author?.name?.charAt(0) || "?"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[var(--foreground)]">{post.author?.name}</span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDistanceToNow(post._creationTime, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[var(--foreground)]">{post.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Support Circles</h1>
          <p className="text-[var(--muted-foreground)]">Connect with women who understand</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Create Circle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--card)] border-[var(--border)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--foreground)]">Create a Support Circle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">Circle Name</label>
                <Input
                  placeholder="e.g., Working Moms Support"
                  value={newCircle.name}
                  onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                  className="bg-[var(--background)] border-[var(--border)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">Description</label>
                <Textarea
                  placeholder="What is this circle about?"
                  value={newCircle.description}
                  onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                  rows={3}
                  className="bg-[var(--background)] border-[var(--border)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-[var(--foreground)]">Category</label>
                <Select
                  value={newCircle.category}
                  onValueChange={(value) => setNewCircle({ ...newCircle, category: value as any })}
                >
                  <SelectTrigger className="bg-[var(--background)] border-[var(--border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card)] border-[var(--border)]">
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={newCircle.isPrivate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewCircle({ ...newCircle, isPrivate: true })}
                  className={`min-h-[44px] ${newCircle.isPrivate ? "bg-[var(--color-aurora-purple)]" : "border-[var(--border)]"}`}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Private
                </Button>
                <Button
                  variant={!newCircle.isPrivate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewCircle({ ...newCircle, isPrivate: false })}
                  className={`min-h-[44px] ${!newCircle.isPrivate ? "bg-[var(--color-aurora-purple)]" : "border-[var(--border)]"}`}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Public
                </Button>
              </div>
              <Button 
                onClick={handleCreateCircle} 
                className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]"
                disabled={!newCircle.name || !newCircle.description}
              >
                Create Circle (+20 credits)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Circles */}
      {myCircles && myCircles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-[var(--foreground)]">My Circles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCircles.map((circle: any) => {
              const Icon = CATEGORY_ICONS[circle.category] || Users;
              const gradient = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.general;
              
              return (
                <motion.div
                  key={circle._id}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedCircle(circle._id)}
                >
                  <Card className="overflow-hidden h-full bg-[var(--card)] border-[var(--border)] hover:shadow-lg transition-shadow">
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate text-[var(--foreground)]">{circle.name}</h3>
                          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                            {circle.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs bg-[var(--accent)]">
                              <Users className="w-3 h-3 mr-1" />
                              {circle.memberCount}
                            </Badge>
                            {circle.role === "admin" && (
                              <Badge className="text-xs bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)]">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Discover */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-[var(--foreground)]">Discover Circles</h2>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search circles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[var(--background)] border-[var(--border)] min-h-[44px]"
            />
          </div>
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-[var(--background)] border-[var(--border)] min-h-[44px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--border)]">
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories?.map((cat: any) => {
            const Icon = CATEGORY_ICONS[cat.id] || Users;
            const isSelected = selectedCategory === cat.id;
            
            return (
              <Button
                key={cat.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`min-h-[44px] ${isSelected ? `bg-gradient-to-r ${CATEGORY_COLORS[cat.id]}` : ""}`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {cat.name}
              </Button>
            );
          })}
        </div>

        {/* Circles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discoverCircles?.map((circle: any) => {
            const Icon = CATEGORY_ICONS[circle.category] || Users;
            const gradient = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.general;
            const isMember = isInCircle(circle._id);
            
            return (
              <motion.div
                key={circle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden h-full bg-[var(--card)] border-[var(--border)]">
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)]">{circle.name}</h3>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          by {circle.creator?.name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-3">
                      {circle.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-[var(--accent)]">
                          <Users className="w-3 h-3 mr-1" />
                          {circle.memberCount} members
                        </Badge>
                        <Badge variant="outline" className="text-xs border-[var(--border)]">
                          {circle.postCount} posts
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      className={`w-full mt-3 min-h-[44px] ${isMember ? 'border-[var(--border)]' : `bg-gradient-to-r ${gradient}`}`}
                      variant={isMember ? "outline" : "default"}
                      disabled={isMember}
                      onClick={() => handleJoinCircle(circle._id)}
                    >
                      {isMember ? "Joined" : "Join Circle"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {discoverCircles?.length === 0 && (
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-[var(--color-aurora-lavender)]" />
              <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No circles found</h3>
              <p className="text-[var(--muted-foreground)] text-sm mb-4">
                Be the first to create a circle in this category!
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
                <Plus className="w-4 h-4 mr-2" />
                Create Circle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Discover Members Section */}
      <DiscoverMembers userId={userId} />
    </div>
  );
}

// New component to discover other women
function DiscoverMembers({ userId }: { userId: Id<"users"> }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const suggestedMembers = useQuery(api.circles.getSuggestedMembers, { userId, limit: 6 }) ?? [];
  const searchResults = useQuery(
    api.circles.searchMembers,
    searchTerm.length >= 2 ? { userId, searchTerm } : "skip"
  ) ?? [];

  const displayMembers = searchTerm.length >= 2 ? searchResults : suggestedMembers;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Connect with Women</h2>
      </div>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search by name, industry, or interests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-[var(--background)] border-[var(--border)] min-h-[44px]"
        />
      </div>

      {displayMembers.length === 0 ? (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]" />
            <p className="text-[var(--muted-foreground)]">
              {searchTerm ? "No members found" : "Join circles to discover more women!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMembers.map((member: any) => (
            <Card key={member._id} className="bg-[var(--card)] border-[var(--border)] hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Link href={`/user/${member._id}`} className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-[var(--color-aurora-purple)] transition-all">
                      {member.avatarConfig ? (
                        <img
                          src={generateAvatarUrl(member.avatarConfig)}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.name?.charAt(0) || "?"
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/user/${member._id}`} className="hover:underline">
                      <h3 className="font-semibold text-[var(--foreground)] truncate">{member.name}</h3>
                    </Link>
                    {member.industry && (
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{member.industry}</p>
                    )}
                    {member.location && (
                      <p className="text-xs text-[var(--muted-foreground)] truncate">📍 {member.location}</p>
                    )}
                    {member.sharedCircles > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-[var(--color-aurora-lavender)]/20">
                        {member.sharedCircles} shared circle{member.sharedCircles > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                {member.bio && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-2 line-clamp-2">{member.bio}</p>
                )}
                {member.interests && member.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.interests.slice(0, 3).map((interest: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs border-[var(--border)]">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Message Button */}
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <Link href={`/messages/${member._id}`}>
                    <Button 
                      size="sm" 
                      className="w-full bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white rounded-xl min-h-[44px]"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
