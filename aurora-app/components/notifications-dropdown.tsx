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
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
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
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case "upvote":
        return <ThumbsUp className="w-4 h-4 text-purple-600" />;
      case "verification":
        return <Shield className="w-4 h-4 text-orange-600" />;
      case "route_completion":
        return <MapPin className="w-4 h-4 text-blue-600" />;
      case "opportunity_unlock":
        return <Briefcase className="w-4 h-4 text-pink-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {!notifications && (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading...
          </div>
        )}

        {notifications && notifications.length === 0 && (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        )}

        {notifications && notifications.length > 0 && (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`p-3 cursor-pointer ${
                  !notification.isRead ? "bg-purple-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => handleDelete(e, notification._id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {notification.fromUser && (
                        <span className="text-xs text-gray-500">
                          from {notification.fromUser.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
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
