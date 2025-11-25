"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

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
  const [newCircle, setNewCircle] = useState({
    name: "",
    description: "",
    category: "general" as any,
    isPrivate: false,
  });

  const categories = useQuery(api.circles.getCircleCategories);
  const myCircles = useQuery(api.circles.getMyCircles, { userId });
  const discoverCircles = useQuery(api.circles.getCircles, {
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    limit: 20,
  });

  const createCircle = useMutation(api.circles.createCircle);
  const joinCircle = useMutation(api.circles.joinCircle);

  const handleCreateCircle = async () => {
    if (!newCircle.name || !newCircle.description) return;
    
    await createCircle({
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
  };

  const handleJoinCircle = async (circleId: Id<"circles">) => {
    try {
      await joinCircle({ circleId, userId });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const isInCircle = (circleId: Id<"circles">) => {
    return myCircles?.some((c: any) => c._id === circleId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Circles</h1>
          <p className="text-gray-600">Connect with women who understand</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Plus className="w-4 h-4 mr-2" />
              Create Circle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Support Circle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Circle Name</label>
                <Input
                  placeholder="e.g., Working Moms Support"
                  value={newCircle.name}
                  onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="What is this circle about?"
                  value={newCircle.description}
                  onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select
                  value={newCircle.category}
                  onValueChange={(value) => setNewCircle({ ...newCircle, category: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Private
                </Button>
                <Button
                  variant={!newCircle.isPrivate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewCircle({ ...newCircle, isPrivate: false })}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Public
                </Button>
              </div>
              <Button 
                onClick={handleCreateCircle} 
                className="w-full"
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
          <h2 className="text-lg font-semibold mb-3">My Circles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCircles.map((circle: any) => {
              const Icon = CATEGORY_ICONS[circle.category] || Users;
              const gradient = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.general;
              
              return (
                <motion.div
                  key={circle._id}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                >
                  <Card className="overflow-hidden h-full">
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{circle.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {circle.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {circle.memberCount}
                            </Badge>
                            {circle.role === "admin" && (
                              <Badge className="text-xs bg-purple-100 text-purple-700">
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
        <h2 className="text-lg font-semibold mb-3">Discover Circles</h2>
        
        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search circles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
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
                className={isSelected ? `bg-gradient-to-r ${CATEGORY_COLORS[cat.id]}` : ""}
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
                <Card className="overflow-hidden h-full">
                  <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{circle.name}</h3>
                        <p className="text-xs text-gray-500">
                          by {circle.creator?.name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {circle.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {circle.memberCount} members
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {circle.postCount} posts
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      className={`w-full mt-3 ${isMember ? '' : `bg-gradient-to-r ${gradient}`}`}
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
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No circles found</h3>
              <p className="text-gray-500 text-sm mb-4">
                Be the first to create a circle in this category!
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Circle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
