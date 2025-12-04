"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Coins,
  Plus,
  Loader2,
  Star,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface EventManagerProps {
  circleId: Id<"circles">;
  userId: Id<"users">;
  isAdmin: boolean;
}

export function EventManager({ circleId, userId, isAdmin }: EventManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<"virtual" | "in-person" | "hybrid">("virtual");
  const [pricing, setPricing] = useState<"free" | "paid" | "tier-exclusive">("free");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");

  const events = useQuery(api.events.getCircleEvents, { circleId, limit: 20 });
  const createEvent = useMutation(api.events.createEvent);
  const rsvpToEvent = useMutation(api.events.rsvpToEvent);

  const handleCreateEvent = async () => {
    if (!title || !description || !startDate || !startTime || !endTime) return;
    
    setIsCreating(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
      const endDateTime = new Date(`${startDate}T${endTime}`).getTime();
      
      await createEvent({
        circleId,
        hostId: userId,
        title,
        description,
        type: eventType,
        pricing,
        price: pricing === "paid" ? parseInt(price) : undefined,
        priceType: pricing === "paid" ? "credits" : undefined,
        capacity: parseInt(capacity),
        waitlistEnabled,
        startTime: startDateTime,
        endTime: endDateTime,
        location: locationName ? { name: locationName } : undefined,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setEventType("virtual");
      setPricing("free");
      setPrice("");
      setCapacity("50");
      setStartDate("");
      setStartTime("");
      setEndTime("");
      setLocationName("");
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRsvp = async (eventId: Id<"events">) => {
    try {
      await rsvpToEvent({
        eventId,
        userId,
        status: "going",
      });
    } catch (error) {
      console.error("Failed to RSVP:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Events</h3>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[var(--color-aurora-blue)]">
                <Plus className="w-4 h-4 mr-1" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Weekly Networking Meetup"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this event about?"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Event Type</Label>
                    <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Pricing</Label>
                    <Select value={pricing} onValueChange={(v) => setPricing(v as typeof pricing)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid (Credits)</SelectItem>
                        <SelectItem value="tier-exclusive">Tier Exclusive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {pricing === "paid" && (
                  <div>
                    <Label htmlFor="price">Price (Credits)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="50"
                      className="mt-1"
                    />
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      You receive 80% of ticket sales
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <Label htmlFor="waitlist">Enable Waitlist</Label>
                    <Switch
                      id="waitlist"
                      checked={waitlistEnabled}
                      onCheckedChange={setWaitlistEnabled}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {(eventType === "in-person" || eventType === "hybrid") && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Venue name or address"
                      className="mt-1"
                    />
                  </div>
                )}

                <Button
                  onClick={handleCreateEvent}
                  disabled={isCreating || !title || !description || !startDate}
                  className="w-full bg-[var(--color-aurora-blue)]"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Events List */}
      {!events ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-aurora-purple)]" />
        </div>
      ) : events.length === 0 ? (
        <Card className="p-6 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-[var(--muted-foreground)]" />
          <p className="text-[var(--muted-foreground)]">No upcoming events</p>
          {isAdmin && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Create your first event to engage your community
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event._id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[var(--color-aurora-purple)]/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-[var(--color-aurora-purple)]">
                      {new Date(event.startTime).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold text-[var(--color-aurora-purple)]">
                      {new Date(event.startTime).getDate()}
                    </span>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-[var(--foreground)] truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-[var(--muted-foreground)]">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.startTime)}
                          {event.type === "virtual" && (
                            <>
                              <Video className="w-3 h-3 ml-2" />
                              Virtual
                            </>
                          )}
                          {event.type === "in-person" && event.location && (
                            <>
                              <MapPin className="w-3 h-3 ml-2" />
                              {event.location.name}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pricing Badge */}
                      {event.pricing === "paid" && event.price && (
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-violet)]">
                          <Coins className="w-3 h-3 mr-1" />
                          {event.price}
                        </Badge>
                      )}
                      {event.pricing === "free" && (
                        <Badge variant="outline" className="text-[var(--color-aurora-mint)] border-[var(--color-aurora-mint)]">
                          Free
                        </Badge>
                      )}
                    </div>

                    {/* Attendees & RSVP */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                        <Users className="w-3 h-3" />
                        {event.rsvpCount || 0} / {event.capacity}
                        {event.waitlistCount > 0 && (
                          <span className="text-xs">
                            (+{event.waitlistCount} waitlist)
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRsvp(event._id)}
                        className="min-h-[36px]"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        RSVP
                      </Button>
                    </div>

                    {/* Rating (for past events) */}
                    {event.status === "ended" && event.averageRating && (
                      <div className="flex items-center gap-1 mt-2 text-sm">
                        <Star className="w-3 h-3 text-[var(--color-aurora-yellow)] fill-[var(--color-aurora-yellow)]" />
                        <span className="text-[var(--foreground)]">
                          {event.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
