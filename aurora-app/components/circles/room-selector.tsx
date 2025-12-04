"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  Mic,
  Video,
  FileText,
  Radio,
  Plus,
  Users,
  Lock,
  Globe,
  Crown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { ROOM_LIMITS } from "@/convex/premiumConfig";

type RoomType = "chat" | "audio" | "video" | "forum" | "broadcast";
type RoomVisibility = "public" | "members" | "tier";

const ROOM_TYPE_CONFIG: Record<RoomType, {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}> = {
  chat: {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Chat",
    description: "Text chat with threads, reactions, and polls",
    color: "bg-[var(--color-aurora-blue)]/10 text-[var(--color-aurora-blue)]",
  },
  audio: {
    icon: <Mic className="w-5 h-5" />,
    label: "Audio",
    description: "Voice conversations, drop in anytime",
    color: "bg-[var(--color-aurora-purple)]/10 text-[var(--color-aurora-purple)]",
  },
  video: {
    icon: <Video className="w-5 h-5" />,
    label: "Video",
    description: `Face-to-face meetings (max ${ROOM_LIMITS.VIDEO_MAX_PARTICIPANTS})`,
    color: "bg-[var(--color-aurora-pink)]/10 text-[var(--color-aurora-pink)]",
  },
  forum: {
    icon: <FileText className="w-5 h-5" />,
    label: "Forum",
    description: "Long-form discussions and announcements",
    color: "bg-[var(--color-aurora-mint)]/10 text-[var(--color-aurora-violet)]",
  },
  broadcast: {
    icon: <Radio className="w-5 h-5" />,
    label: "Broadcast",
    description: `Live streaming (max ${ROOM_LIMITS.BROADCAST_MAX_HOSTS} hosts)`,
    color: "bg-[var(--color-aurora-yellow)]/10 text-[var(--color-aurora-violet)]",
  },
};

const VISIBILITY_CONFIG: Record<RoomVisibility, {
  icon: React.ReactNode;
  label: string;
}> = {
  public: { icon: <Globe className="w-4 h-4" />, label: "Public" },
  members: { icon: <Users className="w-4 h-4" />, label: "Members Only" },
  tier: { icon: <Crown className="w-4 h-4" />, label: "Premium Tier" },
};

interface RoomSelectorProps {
  circleId: Id<"circles">;
  userId: Id<"users">;
  isAdmin: boolean;
  onRoomSelect?: (roomId: Id<"rooms">) => void;
}

export function RoomSelector({ circleId, userId, isAdmin, onRoomSelect }: RoomSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("chat");
  const [visibility, setVisibility] = useState<RoomVisibility>("members");
  const [requiredTier, setRequiredTier] = useState("");

  const rooms = useQuery(api.rooms.getCircleRooms, { circleId });
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const handleCreateRoom = async () => {
    if (!name) return;
    
    setIsCreating(true);
    try {
      await createRoom({
        circleId,
        name,
        description: description || undefined,
        type: roomType,
        visibility,
        requiredTier: visibility === "tier" ? requiredTier : undefined,
        createdBy: userId,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setRoomType("chat");
      setVisibility("members");
      setRequiredTier("");
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: Id<"rooms">) => {
    setIsJoining(roomId);
    try {
      const result = await joinRoom({
        roomId,
        userId,
      });
      
      if (result.success) {
        onRoomSelect?.(roomId);
      }
    } catch (error) {
      console.error("Failed to join room:", error);
    } finally {
      setIsJoining(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Rooms</h3>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[var(--color-aurora-blue)]">
                <Plus className="w-4 h-4 mr-1" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Room</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="General Chat"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this room for?"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Room Type Selection */}
                <div>
                  <Label>Room Type</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {(Object.keys(ROOM_TYPE_CONFIG) as RoomType[]).map((type) => {
                      const config = ROOM_TYPE_CONFIG[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setRoomType(type)}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-xl transition-all",
                            "border-2",
                            roomType === type
                              ? "border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/5"
                              : "border-transparent hover:bg-[var(--muted)]"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                            {config.icon}
                          </div>
                          <span className="text-xs mt-1 font-medium">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    {ROOM_TYPE_CONFIG[roomType].description}
                  </p>
                </div>

                {/* Visibility */}
                <div>
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as RoomVisibility)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public - Anyone can join
                        </div>
                      </SelectItem>
                      <SelectItem value="members">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Members Only
                        </div>
                      </SelectItem>
                      <SelectItem value="tier">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Premium Tier Required
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {visibility === "tier" && (
                  <div>
                    <Label>Required Tier</Label>
                    <Select value={requiredTier} onValueChange={setRequiredTier}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supporter">Supporter</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleCreateRoom}
                  disabled={isCreating || !name}
                  className="w-full bg-[var(--color-aurora-blue)]"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Room"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Rooms List */}
      {!rooms ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-aurora-purple)]" />
        </div>
      ) : rooms.length === 0 ? (
        <Card className="p-6 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No rooms yet</p>
          {isAdmin && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Create your first room to start conversations
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => {
            const config = ROOM_TYPE_CONFIG[room.type as RoomType];
            const visConfig = VISIBILITY_CONFIG[room.visibility as RoomVisibility];
            const isLive = room.type !== "chat" && room.type !== "forum" && room.participantCount > 0;
            
            return (
              <Card
                key={room._id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isLive && "ring-2 ring-[var(--color-aurora-purple)]"
                )}
                onClick={() => handleJoinRoom(room._id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Room Type Icon */}
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}>
                      {config.icon}
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[var(--foreground)] truncate">
                          {room.name}
                        </h4>
                        {room.visibility === "tier" && (
                          <Lock className="w-3 h-3 text-[var(--muted-foreground)]" />
                        )}
                        {isLive && (
                          <Badge className="bg-[var(--color-aurora-purple)] text-white text-xs">
                            Live
                          </Badge>
                        )}
                      </div>
                      
                      {room.description && (
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {room.description}
                        </p>
                      )}
                    </div>

                    {/* Participant Count */}
                    {(room.type === "audio" || room.type === "video" || room.type === "broadcast") && (
                      <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                        <Users className="w-4 h-4" />
                        <span>{room.participantCount || 0}</span>
                        {room.maxParticipants && (
                          <span className="text-xs">/{room.maxParticipants}</span>
                        )}
                      </div>
                    )}

                    {/* Join Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isJoining === room._id}
                      className="min-h-[36px]"
                    >
                      {isJoining === room._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Join"
                      )}
                    </Button>
                  </div>

                  {/* Broadcast hosts indicator */}
                  {room.type === "broadcast" && room.hostCount > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Radio className="w-3 h-3" />
                      {room.hostCount} host{room.hostCount > 1 ? "s" : ""} live
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Room Type Legend */}
      <div className="pt-4 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted-foreground)] mb-2">Room Types</p>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(ROOM_TYPE_CONFIG) as RoomType[]).map((type) => {
            const config = ROOM_TYPE_CONFIG[type];
            return (
              <div key={type} className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center", config.color)}>
                  {config.icon}
                </div>
                {config.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
