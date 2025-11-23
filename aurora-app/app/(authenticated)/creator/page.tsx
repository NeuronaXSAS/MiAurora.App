"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Video,
  Radio,
  FileText,
  DollarSign,
  Eye,
  Heart,
  Award,
} from "lucide-react";
import { MonetizationPanel } from "@/components/creator/monetization-panel";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function CreatorDashboard() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

  // Get user ID from cookie
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        router.push("/");
      }
    };
    getUserId();
  }, [router]);
  
  if (!userId) {
    return <div className="p-8">Loading...</div>;
  }

  const stats = useQuery(api.creator.getCreatorStats, { userId });
  const topReels = useQuery(api.creator.getTopContent, { 
    userId, 
    contentType: "reels",
    limit: 5 
  });
  const topLivestreams = useQuery(api.creator.getTopContent, { 
    userId, 
    contentType: "livestreams",
    limit: 5 
  });
  const topPosts = useQuery(api.creator.getTopContent, { 
    userId, 
    contentType: "posts",
    limit: 5 
  });

  if (!stats) {
    return <div className="p-8">Loading creator stats...</div>;
  }

  const totalContent = stats.reels.totalReels + stats.livestreams.totalStreams + stats.posts.totalPosts;
  const totalViews = stats.reels.totalViews + stats.livestreams.totalViews;
  const totalLikes = stats.reels.totalLikes + stats.livestreams.totalLikes;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="text-gray-600">Track your performance and grow your audience</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-lg">
          <Award className="w-5 h-5 text-purple-600" />
          <span className="font-medium">Creator Level: Rising Star</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-gray-600">Total Content</p>
          </div>
          <p className="text-2xl font-bold">{totalContent}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-600">Total Views</p>
          </div>
          <p className="text-2xl font-bold">{totalViews}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <p className="text-sm text-gray-600">Total Likes</p>
          </div>
          <p className="text-2xl font-bold">{totalLikes}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold">{stats.earnings.total}</p>
          <p className="text-xs text-gray-500">credits</p>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reels">Reels</TabsTrigger>
          <TabsTrigger value="livestreams">Livestreams</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Performance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Engagement Rate</span>
                  <span className="font-medium">
                    {totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Most Popular Content</span>
                  <span className="font-medium">Reels</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Routes Shared</span>
                  <span className="font-medium">{stats.routes.totalRoutes}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Growth Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Post consistently (3-5 times per week)</li>
                <li>• Engage with your community in comments</li>
                <li>• Use trending safety topics and hashtags</li>
                <li>• Go live regularly to build connection</li>
                <li>• Share authentic personal safety stories</li>
              </ul>
            </Card>
          </div>
        </TabsContent>

        {/* Reels Tab */}
        <TabsContent value="reels" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Reels Performance</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Total Reels</p>
                <p className="text-2xl font-bold">{stats.reels.totalReels}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{stats.reels.totalViews}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Views</p>
                <p className="text-2xl font-bold">{stats.reels.avgViews}</p>
              </div>
            </div>

            <h4 className="font-medium mb-3">Top Performing Reels</h4>
            <div className="space-y-2">
              {topReels && topReels.length > 0 ? (
                topReels.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {'views' in item && <p className="text-sm font-medium">{item.views} views</p>}
                      {'likes' in item && <p className="text-xs text-gray-500">{item.likes} likes</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No reels yet. Create your first reel!</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Livestreams Tab */}
        <TabsContent value="livestreams" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Livestream Performance</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Total Streams</p>
                <p className="text-2xl font-bold">{stats.livestreams.totalStreams}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{stats.livestreams.totalViews}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Peak Viewers</p>
                <p className="text-2xl font-bold">{stats.livestreams.peakViewers}</p>
              </div>
            </div>

            <h4 className="font-medium mb-3">Recent Livestreams</h4>
            <div className="space-y-2">
              {topLivestreams && topLivestreams.length > 0 ? (
                topLivestreams.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Radio className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {'views' in item && <p className="text-sm font-medium">{item.views} viewers</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No livestreams yet. Go live to connect with your audience!</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Posts Performance</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold">{stats.posts.totalPosts}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Upvotes</p>
                <p className="text-2xl font-bold">{stats.posts.totalUpvotes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Verifications</p>
                <p className="text-2xl font-bold">{stats.posts.totalVerifications}</p>
              </div>
            </div>

            <h4 className="font-medium mb-3">Top Performing Posts</h4>
            <div className="space-y-2">
              {topPosts && topPosts.length > 0 ? (
                topPosts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {'upvotes' in item && <p className="text-sm font-medium">{item.upvotes} upvotes</p>}
                      {'verifications' in item && <p className="text-xs text-gray-500">{item.verifications} verifications</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No posts yet. Share your safety experiences!</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <MonetizationPanel creatorId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
