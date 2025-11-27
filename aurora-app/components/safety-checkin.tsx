"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Plus,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format, addMinutes, addHours } from "date-fns";

interface SafetyCheckinProps {
  userId: Id<"users">;
}

const QUICK_TIMES = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
];

export function SafetyCheckin({ userId }: SafetyCheckinProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [note, setNote] = useState("");
  const [isCheckinIn, setIsCheckinIn] = useState(false);
  const [lastCheckinTime, setLastCheckinTime] = useState<number | null>(null);

  // Safe queries with null coalescing for error handling
  const pendingCheckins = useQuery(api.safetyCheckins.getPendingCheckins, { userId }) ?? [];
  const checkinHistory = useQuery(api.safetyCheckins.getCheckinHistory, { userId, limit: 5 }) ?? [];
  const myGuardians = useQuery(api.guardians.getMyGuardians, { userId }) ?? [];
  
  const scheduleCheckin = useMutation(api.safetyCheckins.scheduleCheckin);
  const confirmCheckin = useMutation(api.safetyCheckins.confirmCheckin);
  const cancelCheckin = useMutation(api.safetyCheckins.cancelCheckin);
  const quickCheckin = useMutation(api.safetyCheckins.quickCheckin);

  const hasGuardians = myGuardians.length > 0;

  const handleQuickCheckin = async () => {
    setIsCheckinIn(true);
    
    // Get location if available
    let location: { lat: number; lng: number } | undefined;
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        // Location not available, continue without it
      }
    }

    await quickCheckin({ userId, location });
    setLastCheckinTime(Date.now());
    setIsCheckinIn(false);
  };

  const handleSchedule = async (minutes: number) => {
    const scheduledTime = Date.now() + minutes * 60 * 1000;
    await scheduleCheckin({
      userId,
      scheduledTime,
      note: note || undefined,
    });
    setShowScheduler(false);
    setNote("");
    setCustomMinutes("");
  };

  const handleConfirm = async (checkinId: Id<"safetyCheckins">) => {
    let location: { lat: number; lng: number } | undefined;
    if ("geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        // Continue without location
      }
    }
    await confirmCheckin({ checkinId, userId, location });
  };

  const handleCancel = async (checkinId: Id<"safetyCheckins">) => {
    await cancelCheckin({ checkinId, userId });
  };

  return (
    <div className="space-y-6">
      {/* Guardian Status Alert */}
      {!hasGuardians && (
        <Card className="border-[var(--color-aurora-yellow)]/50 bg-[var(--color-aurora-yellow)]/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--color-aurora-yellow)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[var(--foreground)]">No Aurora Guardians</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Add Aurora Guardians in the "Guardians" tab to receive alerts when you miss a check-in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Check-in Button */}
      <Card className="bg-[var(--color-aurora-mint)]/30 border-[var(--color-aurora-mint)]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-aurora-mint)] to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-[var(--color-aurora-violet)]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--foreground)]">Quick Check-in</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {hasGuardians 
                    ? `Notify your ${myGuardians.length} guardian${myGuardians.length > 1 ? 's' : ''} you're safe`
                    : "Confirm you're safe right now"
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={handleQuickCheckin}
                  disabled={isCheckinIn}
                  className="min-h-[44px] bg-gradient-to-r from-[var(--color-aurora-mint)] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-[var(--color-aurora-violet)] shadow-lg font-semibold"
                >
                  {isCheckinIn ? (
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      I'm OK
                    </>
                  )}
                </Button>
              </motion.div>
              {lastCheckinTime && (
                <p className="text-xs text-[var(--color-aurora-mint)]">
                  ✓ Checked in {formatDistanceToNow(lastCheckinTime, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Check-ins */}
      {pendingCheckins && pendingCheckins.length > 0 && (
        <Card className="border-[var(--color-aurora-yellow)]/50 bg-[var(--color-aurora-yellow)]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Clock className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
              Scheduled Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {pendingCheckins.map((checkin) => {
                const isOverdue = Date.now() > checkin.scheduledTime;
                
                return (
                  <motion.div
                    key={checkin._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-4 rounded-xl border ${
                      isOverdue 
                        ? "bg-[var(--color-aurora-salmon)]/20 border-[var(--color-aurora-salmon)]/50" 
                        : "bg-[var(--card)] border-[var(--border)]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isOverdue ? (
                            <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                          ) : (
                            <Clock className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                          )}
                          <span className={`font-semibold ${isOverdue ? "text-[var(--color-aurora-salmon)]" : "text-[var(--foreground)]"}`}>
                            {isOverdue ? "Overdue!" : "Due"} {formatDistanceToNow(checkin.scheduledTime, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {format(checkin.scheduledTime, "h:mm a")}
                          {checkin.note && ` • ${checkin.note}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(checkin._id)}
                          className="min-h-[44px] bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/80 text-[var(--color-aurora-violet)]"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          I'm Safe
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(checkin._id)}
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Schedule New Check-in */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[var(--foreground)]">
            <span className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Schedule Check-in
            </span>
            {!showScheduler && (
              <Button size="sm" onClick={() => setShowScheduler(true)} className="min-h-[44px]">
                Schedule
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {showScheduler && (
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Set a reminder to check in. If you don't confirm by the scheduled time, your Aurora App emergency contacts will be notified automatically.
            </p>
            
            {/* Quick Time Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_TIMES.map((time) => (
                <Button
                  key={time.minutes}
                  variant="outline"
                  onClick={() => handleSchedule(time.minutes)}
                  className="flex flex-col h-auto py-3 min-h-[60px]"
                >
                  <span className="font-bold">{time.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {format(addMinutes(new Date(), time.minutes), "h:mm a")}
                  </span>
                </Button>
              ))}
            </div>

            {/* Custom Time */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Custom minutes"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="flex-1 min-h-[44px]"
              />
              <Button
                onClick={() => handleSchedule(parseInt(customMinutes) || 60)}
                disabled={!customMinutes}
                className="min-h-[44px]"
              >
                Set
              </Button>
            </div>

            {/* Note */}
            <Input
              placeholder="Add a note (optional) - e.g., 'Walking home'"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[44px]"
            />

            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => setShowScheduler(false)}
            >
              Cancel
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Recent History */}
      {checkinHistory && checkinHistory.length > 0 && (
        <Card className="bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-sm text-[var(--muted-foreground)]">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checkinHistory.map((checkin) => (
                <div
                  key={checkin._id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {checkin.status === "confirmed" ? (
                      <CheckCircle className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                    ) : checkin.status === "missed" ? (
                      <AlertTriangle className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                    ) : (
                      <Clock className="w-4 h-4 text-[var(--color-aurora-yellow)]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {checkin.note || "Check-in"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {format(checkin.scheduledTime, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      checkin.status === "confirmed" ? "default" :
                      checkin.status === "missed" ? "destructive" : "secondary"
                    }
                    className={checkin.status === "confirmed" ? "bg-[var(--color-aurora-mint)]/30 text-[var(--color-aurora-violet)]" : ""}
                  >
                    {checkin.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
