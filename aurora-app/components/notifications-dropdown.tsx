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
import { Bell, Check, MessageSquare, ThumbsUp, Shield, MapPin, Briefcase, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export function NotificationsDropdown() {
  const router = useRouter();
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto bg-[var(--card)] border-[var(--border)]">
        <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Notifications</h3>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/10"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {!notifications && (
          <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
            Loading...
          </div>
        )}

        {notifications && notifications.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-aurora-purple)]/10 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-[var(--color-aurora-purple)]" />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">No notifications yet</p>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
