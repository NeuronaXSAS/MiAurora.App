"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Film, 
  Radio, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Coins,
  Heart,
  Eye,
  MessageSquare,
  Gift,
  ChevronRight,
  Play,
  Zap,
  Star,
  Target
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreatorStudioProps {
  userId: Id<"users">;
}

export function CreatorStudio({ userId }: CreatorStudioProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const user = useQuery(api.users.getUser, { userId });
  const giftEarnings = useQuery(api.gifts.getCreatorGiftEarnings, { creatorId: userId });

  const quickActions = [
    {
      id: "go-live",
      title: "Go Live",
      description: "Start streaming now",
      icon: Radio,
      color: "from-red-500 to-pink-500",
      href: "/live/broadcast",
      badge: "🔴 Live",
    },
    {
      id: "create-reel",
      title: "Create Reel",
      description: "Share a 15-90s video",
      icon: Film,
      color: "from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)]",
      href: "/reels/create",
      badge: "+15 credits",
    },
    {
      id: "safety-walk",
      title: "Safety Walk",
      description: "Stream your commute",
      icon: Video,
      color: "from-[var(--color-aurora-blue)] to-[var(--color-aurora-mint)]",
      href: "/live/broadcast?category=safety-walk",
      badge: "🛡️ Safety",
    },
  ];

  const creatorTips = [
    { tip: "Go live during peak hours (6-9 PM) for 3x more viewers", icon: "⏰" },
    { tip: "Safety walks earn 2x credits and help your community", icon: "🚶‍♀️" },
    { tip: "Respond to comments to boost engagement by 40%", icon: "💬" },
    { tip: "Use trending hashtags to reach new audiences", icon: "#️⃣" },
  ];

  return (
    <div className="space-y-6">
      {/* Creator Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Creator Studio</h1>
            <p className="text-white/80 text-sm">Create, share, and earn with Aurora App</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/70">Total Earnings</p>
            <p className="text-3xl font-bold">{giftEarnings?.totalEarnings || 0}</p>
            <p className="text-xs text-white/60">credits</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Gifts", value: giftEarnings?.totalGifts || 0, icon: Gift },
            { label: "Views", value: "0", icon: Eye },
            { label: "Followers", value: "0", icon: Users },
            { label: "Likes", value: "0", icon: Heart },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <stat.icon className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={action.href}>
              <Card className="bg-[var(--card)] border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 transition-all cursor-pointer group overflow-hidden">
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-r ${action.color} p-4`}>
                    <div className="flex items-center justify-between">
                      <action.icon className="w-8 h-8 text-white" />
                      <Badge className="bg-white/20 text-white border-0 text-xs">
                        {action.badge}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Creator Tips */}
      <Card className="bg-[var(--color-aurora-yellow)]/10 border-[var(--color-aurora-yellow)]/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
            Creator Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {creatorTips.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[var(--card)] rounded-xl">
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm text-[var(--foreground)]">{item.tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earning Opportunities */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
            Ways to Earn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { action: "Complete a livestream", credits: 25, icon: Radio, color: "text-red-500" },
            { action: "Create a reel", credits: 15, icon: Film, color: "text-[var(--color-aurora-purple)]" },
            { action: "Share a safe route", credits: 20, icon: Target, color: "text-[var(--color-aurora-blue)]" },
            { action: "Get verified on a post", credits: 25, icon: Star, color: "text-[var(--color-aurora-mint)]" },
            { action: "Receive a gift", credits: "85%", icon: Gift, color: "text-[var(--color-aurora-pink)]" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-[var(--accent)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-[var(--card)] flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-[var(--foreground)]">{item.action}</span>
              </div>
              <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0">
                +{item.credits} {typeof item.credits === 'number' ? 'credits' : ''}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
