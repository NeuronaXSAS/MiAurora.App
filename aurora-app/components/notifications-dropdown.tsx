"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, MessageSquare, ThumbsUp, Shield, MapPin, Briefcase, X, Flame, Gift, Heart, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NotificationsDropdown() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [streak, setStreak] = useState(0);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Load streak data
    if (userId) {
      const savedStreak = localStorage.getItem(`aurora-streak-${userId}`);
      const lastVisit = localStorage.getItem(`aurora-last-visit-${userId}`);
      const today = new Date().toDateString();
      
      if (lastVisit === today) {
        setStreak(parseInt(savedStreak || "0"));
        setDailyRewardClaimed(localStorage.getItem(`aurora-daily-claimed-${userId}-${today}`) === "true");
      } else {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastVisit === yesterday) {
          const newStreak = parseInt(savedStreak || "0") + 1;
          setStreak(newStreak);
          localStorage.setItem(`aurora-streak-${userId}`, newStreak.toString());
        } else {
          setStreak(1);
          localStorage.setItem(`aurora-streak-${userId}`, "1");
        }
        localStorage.setItem(`aurora-last-visit-${userId}`, today);
      }
    }
  }, [userId]);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<"users">);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      }
    };
    getUserId();
  }, []);

  const notifications = useQuery(
    api.notifications.getUserNotifications,
    userId ? { userId, limit: 10 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    userId ? { userId } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    
    // Navigate to the appropriate section based on notification type
    let targetUrl = notification.actionUrl;
    
    if (!targetUrl) {
      // Generate URL based on notification type and relatedId
      switch (notification.type) {
        case "message":
          targetUrl = notification.relatedId ? `/messages/${notification.relatedId}` : "/messages";
          break;
        case "comment":
        case "upvote":
        case "verification":
          targetUrl = notification.relatedId ? `/feed?post=${notification.relatedId}` : "/feed";
          break;
        case "route_completion":
          targetUrl = notification.relatedId ? `/routes/${notification.relatedId}` : "/routes";
          break;
        case "opportunity_unlock":
          targetUrl = notification.relatedId ? `/opportunities?id=${notification.relatedId}` : "/opportunities";
          break;
        case "mention":
          targetUrl = notification.relatedId ? `/feed?post=${notification.relatedId}` : "/feed";
          break;
        case "tip":
        case "credit_earned":
          targetUrl = "/credits";
          break;
        case "accompaniment_request":
        case "accompaniment_update":
        case "location_share":
          targetUrl = "/circles?tab=accompaniment";
          break;
        case "guardian_request":
        case "guardian_accepted":
        case "guardian_alert":
          targetUrl = "/circles?tab=guardians";
          break;
        case "circle_invite":
        case "circle_message":
        case "circle_join":
          targetUrl = notification.relatedId ? `/circles/${notification.relatedId}` : "/circles";
          break;
        case "emergency":
        case "panic_alert":
          targetUrl = "/map";
          break;
        case "checkin_reminder":
        case "checkin_missed":
          targetUrl = "/health?tab=checkin";
          break;
        case "hydration_reminder":
          targetUrl = "/health?tab=hydration";
          break;
        case "cycle_reminder":
          targetUrl = "/health?tab=cycle";
          break;
        case "workplace_report":
          targetUrl = "/intelligence?tab=workplace";
          break;
        case "reel_like":
        case "reel_comment":
          targetUrl = notification.relatedId ? `/reels?id=${notification.relatedId}` : "/reels";
          break;
        case "live_started":
          targetUrl = notification.relatedId ? `/live/${notification.relatedId}` : "/live";
          break;
        case "poll_vote":
          targetUrl = notification.relatedId ? `/feed?post=${notification.relatedId}` : "/feed";
          break;
        default:
          targetUrl = "/feed";
      }
    }
    
    if (targetUrl) {
      router.push(targetUrl);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await markAllAsRead({ userId });
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: Id<"notifications">) => {
    e.stopPropagation();
    await deleteNotification({ notificationId });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-[var(--color-aurora-blue)]" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-[var(--color-aurora-mint)]" />;
      case "upvote":
        return <ThumbsUp className="w-4 h-4 text-[var(--color-aurora-purple)]" />;
      case "verification":
        return <Shield className="w-4 h-4 text-[var(--color-aurora-orange)]" />;
      case "route_completion":
        return <MapPin className="w-4 h-4 text-[var(--color-aurora-blue)]" />;
      case "opportunity_unlock":
        return <Briefcase className="w-4 h-4 text-[var(--color-aurora-pink)]" />;
      default:
        return <Bell className="w-4 h-4 text-[var(--muted-foreground)]" />;
    }
  };

  // Prevent hydration mismatch by only rendering on client
  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative min-w-[44px] min-h-[44px]" suppressHydrationWarning>
        <Bell className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative min-w-[44px] min-h-[44px] hover:bg-[var(--accent)] rounded-lg" 
          suppressHydrationWarning
        >
          <Bell className="w-5 h-5 text-[var(--muted-foreground)]" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--color-aurora-pink)] text-white text-xs rounded-full flex items-center justify-center font-medium shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[550px] overflow-hidden bg-[var(--card)] border-[var(--border)] p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-[var(--border)] px-2 pt-2">
            <TabsList className="w-full bg-[var(--accent)]/50 h-9">
              <TabsTrigger value="notifications" className="flex-1 text-xs data-[state=active]:bg-[var(--card)]">
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                Updates
                {unreadCount && unreadCount > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-[var(--color-aurora-pink)] text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex-1 text-xs data-[state=active]:bg-[var(--card)]">
                <Flame className="w-3.5 h-3.5 mr-1.5" />
                Challenges
                {!dailyRewardClaimed && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-[var(--color-aurora-yellow)] text-[var(--color-aurora-violet)]">
                    !
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="m-0 max-h-[450px] overflow-y-auto">
            {unreadCount && unreadCount > 0 && (
              <div className="flex justify-end p-2 border-b border-[var(--border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10 h-7"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              </div>
            )}

            {!notifications && (
              <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                Loading...
              </div>
            )}

            {notifications && notifications.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-aurora-purple)]/10 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">All caught up!</p>
                <p className="text-xs text-[var(--muted-foreground)]/70 mt-1">We'll notify you when something happens</p>
              </div>
            )}

            {notifications && notifications.length > 0 && (
              <>
                {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`p-3 cursor-pointer hover:bg-[var(--accent)] ${
                  !notification.isRead ? "bg-[var(--color-aurora-purple)]/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--foreground)]">{notification.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 hover:bg-[var(--accent)]"
                        onClick={(e) => handleDelete(e, notification._id)}
                      >
                        <X className="w-3 h-3 text-[var(--muted-foreground)]" />
                      </Button>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {notification.fromUser && (
                        <span className="text-xs text-[var(--color-aurora-purple)]">
                          from {notification.fromUser.name}
                        </span>
                      )}
                      <span className="text-xs text-[var(--muted-foreground)]/70">
                        {formatDistanceToNow(notification._creationTime, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
              </>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="m-0 max-h-[450px] overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Streak Card */}
              <div className="bg-gradient-to-r from-[var(--color-aurora-yellow)]/20 to-[var(--color-aurora-pink)]/20 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-aurora-yellow)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--foreground)]">{streak} Day Streak! 🔥</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {streak >= 7 ? "Amazing! Keep going!" : `${7 - streak} more for bonus`}
                      </p>
                    </div>
                  </div>
                  {!dailyRewardClaimed ? (
                    <Button
                      size="sm"
                      className="bg-[var(--color-aurora-yellow)] hover:bg-[var(--color-aurora-yellow)]/90 text-[var(--color-aurora-violet)] font-bold h-8 px-3 text-xs"
                      onClick={() => {
                        setDailyRewardClaimed(true);
                        const today = new Date().toDateString();
                        localStorage.setItem(`aurora-daily-claimed-${userId}-${today}`, "true");
                      }}
                    >
                      <Gift className="w-3.5 h-3.5 mr-1" />
                      +{5 + streak}
                    </Button>
                  ) : (
                    <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] text-xs">
                      ✓ Claimed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Daily Challenges */}
              <div>
                <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 px-1">TODAY'S CHALLENGES</p>
                <div className="space-y-2">
                  {[
                    { icon: MapPin, title: "Safety Scout", desc: "Rate a location", reward: 25, href: "/map" },
                    { icon: MessageSquare, title: "Community Voice", desc: "Comment on 3 posts", reward: 15, href: "/feed" },
                    { icon: Heart, title: "Sister Support", desc: "Send encouragement", reward: 20, href: "/messages" },
                  ].map((challenge) => (
                    <div
                      key={challenge.title}
                      onClick={() => {
                        router.push(challenge.href);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--accent)]/50 hover:bg-[var(--accent)] cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-aurora-purple)]/20 flex items-center justify-center">
                        <challenge.icon className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[var(--foreground)]">{challenge.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{challenge.desc}</p>
                      </div>
                      <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] text-xs">
                        +{challenge.reward}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bonus Tip */}
              <div className="p-2.5 bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl">
                <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[var(--color-aurora-purple)]" />
                  Complete all for a <span className="font-bold text-[var(--color-aurora-purple)]">mystery bonus!</span>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
