"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Shield, MapPin, Clock, Users, Send, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SisterAccompanimentProps {
  userId: Id<"users">;
}

export function SisterAccompaniment({ userId }: SisterAccompanimentProps) {
  const [destination, setDestination] = useState("");
  const [selectedCompanions, setSelectedCompanions] = useState<Id<"users">[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [checkInMessage, setCheckInMessage] = useState("");

  // Safe queries with error handling - use null coalescing for safety
  const activeSession = useQuery(api.accompaniment.getActiveSession, { userId }) ?? null;
  const companionSessions = useQuery(api.accompaniment.getCompanionSessions, { userId }) ?? [];
  const createSession = useMutation(api.accompaniment.createSession);
  const updateLocation = useMutation(api.accompaniment.updateLocation);
  const endSession = useMutation(api.accompaniment.endSession);
  const sendCheckIn = useMutation(api.accompaniment.sendCheckIn);

  // Update location every 30 seconds when session is active
  useEffect(() => {
    if (!activeSession) return;

    const updateLocationInterval = setInterval(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation({
              sessionId: activeSession._id,
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
            });
          },
          (error) => console.error("Location error:", error)
        );
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(updateLocationInterval);
  }, [activeSession, updateLocation]);

  const handleStartSession = async () => {
    if (!destination || selectedCompanions.length === 0) return;

    try {
      await createSession({
        userId,
        destination,
        estimatedArrival: Date.now() + estimatedMinutes * 60 * 1000,
        companions: selectedCompanions,
      });
      setDestination("");
      setSelectedCompanions([]);
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleEndSession = async (status: "completed" | "cancelled" | "emergency") => {
    if (!activeSession) return;
    await endSession({ sessionId: activeSession._id, status });
  };

  const handleSendCheckIn = async () => {
    if (!activeSession || !checkInMessage.trim()) return;
    await sendCheckIn({
      sessionId: activeSession._id,
      message: checkInMessage,
    });
    setCheckInMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Active Session */}
      {activeSession && (
        <Card className="border-aurora-violet/30 bg-gradient-to-br from-aurora-lavender/10 to-aurora-pink/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-aurora-violet" />
              Active Journey Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-aurora-violet" />
              <div>
                <p className="text-sm text-gray-600">Destination</p>
                <p className="font-semibold">{activeSession.destination}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-aurora-blue" />
              <div>
                <p className="text-sm text-gray-600">Estimated Arrival</p>
                <p className="font-semibold">
                  {formatDistanceToNow(activeSession.estimatedArrival, { addSuffix: true })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Companions Tracking You</p>
              <div className="flex flex-wrap gap-2">
                {activeSession.companionDetails?.map((companion: any) => (
                  <div key={companion._id} className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={companion.profileImage} />
                      <AvatarFallback>{companion.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{companion.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Check-in */}
            <div className="space-y-2">
              <Label>Send Check-in Message</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="I'm doing fine..."
                  value={checkInMessage}
                  onChange={(e) => setCheckInMessage(e.target.value)}
                />
                <Button onClick={handleSendCheckIn} disabled={!checkInMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleEndSession("completed")}
              >
                I Arrived Safely
              </Button>
              <Button
                variant="outline"
                onClick={() => handleEndSession("cancelled")}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleEndSession("emergency")}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start New Session */}
      {!activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-aurora-violet" />
              Start Sister Accompaniment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Where are you going?</Label>
              <Input
                placeholder="e.g., Home, Office, Friend's place"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated time (minutes)</Label>
              <Input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                min={5}
                max={180}
              />
            </div>

            <div className="space-y-2">
              <Label>Select companions to track you</Label>
              <p className="text-xs text-gray-600">
                Choose trusted friends who will receive your real-time location
              </p>
              {/* TODO: Add friend selector component */}
              <p className="text-sm text-gray-500 italic">
                Friend selector coming soon - connect with friends first
              </p>
            </div>

            <Button
              className="w-full bg-aurora-violet hover:bg-aurora-violet/90"
              onClick={handleStartSession}
              disabled={!destination || selectedCompanions.length === 0}
            >
              Start Protected Journey
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessions You're Tracking */}
      {companionSessions && companionSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-aurora-blue" />
              Tracking Sisters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {companionSessions.map((session: any) => (
              <div
                key={session._id}
                className="p-4 bg-aurora-blue/5 rounded-lg border border-aurora-blue/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarImage src={session.userDetails?.profileImage} />
                    <AvatarFallback>
                      {session.userDetails?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{session.userDetails?.name}</p>
                    <p className="text-sm text-gray-600">→ {session.destination}</p>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Last update: {formatDistanceToNow(session.lastUpdate, { addSuffix: true })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
