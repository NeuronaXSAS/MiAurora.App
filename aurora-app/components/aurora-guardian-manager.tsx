"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { generateAvatarUrl } from "@/hooks/use-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Shield, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  MapPin,
  Bell,
  Clock,
  Trash2,
  Heart,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface AuroraGuardianManagerProps {
  userId: Id<"users">;
}

export function AuroraGuardianManager({ userId }: AuroraGuardianManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  // Queries
  const myGuardians = useQuery(api.guardians.getMyGuardians, { userId }) ?? [];
  const pendingRequests = useQuery(api.guardians.getPendingRequests, { userId }) ?? [];
  const sentPendingRequests = useQuery(api.guardians.getSentPendingRequests, { userId }) ?? [];
  const searchResults = useQuery(
    api.guardians.searchUsers,
    searchTerm.length >= 2 ? { userId, searchTerm } : "skip"
  ) ?? [];

  // Mutations
  const sendRequest = useMutation(api.guardians.sendGuardianRequest);
  const respondToRequest = useMutation(api.guardians.respondToRequest);
  const removeGuardian = useMutation(api.guardians.removeGuardian);
  const updatePermissions = useMutation(api.guardians.updatePermissions);

  // Check if request already sent
  const isRequestPending = (guardianId: string) => {
    return sentRequests.has(guardianId) || sentPendingRequests.some((r: any) => r.guardianId === guardianId);
  };

  const handleSendRequest = async (guardianId: Id<"users">) => {
    setSendingTo(guardianId);
    try {
      await sendRequest({
        userId,
        guardianId,
        message: requestMessage || "I'd like you to be my Aurora Guardian 💜",
      });
      setSentRequests(prev => new Set(prev).add(guardianId));
    } catch (error: any) {
      // Request might already exist
      if (error.message?.includes("pending") || error.message?.includes("Already")) {
        setSentRequests(prev => new Set(prev).add(guardianId));
      }
    } finally {
      setSendingTo(null);
      setSearchTerm("");
      setRequestMessage("");
    }
  };

  const handleRespond = async (requestId: Id<"auroraGuardians">, accept: boolean) => {
    await respondToRequest({ requestId, accept });
  };

  const handleRemove = async (guardianId: Id<"users">) => {
    if (confirm("Are you sure you want to remove this guardian?")) {
      await removeGuardian({ userId, guardianId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Aurora Guardians</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your trusted safety network
            </p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Guardian
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Aurora Guardian</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>

              {searchTerm.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                  No users found. They need to be on Aurora App.
                </p>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => {
                  const isPending = isRequestPending(user._id);
                  const isSending = sendingTo === user._id;
                  
                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold">
                          {user.avatarConfig ? (
                            <img
                              src={generateAvatarUrl(user.avatarConfig as any)}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                        </div>
                      </div>
                      {isPending ? (
                        <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-[var(--color-aurora-yellow)]/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user._id)}
                          disabled={isSending}
                          className="min-h-[36px] bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/80 text-[var(--color-aurora-violet)]"
                        >
                          {isSending ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Heart className="w-4 h-4 mr-1" />
                              Request
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {searchResults.length > 0 && (
                <Input
                  placeholder="Add a personal message (optional)"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="min-h-[44px]"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-[var(--color-aurora-yellow)]/50 bg-[var(--color-aurora-yellow)]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Bell className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
              Guardian Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {pendingRequests.filter((r): r is NonNullable<typeof r> => r !== null).map((request) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold">
                      {request.user.avatarConfig ? (
                        <img
                          src={generateAvatarUrl(request.user.avatarConfig as any)}
                          alt={request.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        request.user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{request.user.name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {request.message || "Wants to be your guardian"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatDistanceToNow(request.requestedAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(request._id, true)}
                      className="min-h-[44px] bg-[var(--color-aurora-mint)] hover:bg-[var(--color-aurora-mint)]/80 text-[var(--color-aurora-violet)]"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(request._id, false)}
                      className="min-h-[44px]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* My Guardians */}
      <Card className="bg-[var(--card)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Users className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            My Guardians ({myGuardians.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myGuardians.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <h3 className="font-semibold text-[var(--foreground)] mb-2">No Guardians Yet</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Add trusted friends or family as your Aurora Guardians.
                They'll receive alerts if you miss a check-in or activate the panic button.
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="min-h-[44px] bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Guardian
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myGuardians.map((guardian) => (
                <GuardianCard
                  key={guardian?.connectionId}
                  guardian={guardian}
                  onRemove={() => guardian?.user._id && handleRemove(guardian.user._id)}
                  onUpdatePermissions={async (perms) => {
                    if (guardian?.connectionId) {
                      await updatePermissions({
                        connectionId: guardian.connectionId,
                        ...perms,
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[var(--color-aurora-lavender)]/20 border-[var(--color-aurora-lavender)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[var(--color-aurora-purple)] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[var(--foreground)] mb-1">How Aurora Guardians Work</p>
              <ul className="text-[var(--muted-foreground)] space-y-1">
                <li>• Guardians receive alerts when you miss a check-in</li>
                <li>• They're notified immediately if you use the panic button</li>
                <li>• You can share your real-time location with them</li>
                <li>• All connections are mutual - you protect each other</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Guardian Card Component
function GuardianCard({
  guardian,
  onRemove,
  onUpdatePermissions,
}: {
  guardian: any;
  onRemove: () => void;
  onUpdatePermissions: (perms: {
    canSeeLocation?: boolean;
    canReceiveAlerts?: boolean;
    canReceiveCheckins?: boolean;
  }) => Promise<void>;
}) {
  if (!guardian) return null;

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--accent)]/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold">
            {guardian.user.avatarConfig ? (
              <img
                src={generateAvatarUrl(guardian.user.avatarConfig as any)}
                alt={guardian.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              guardian.user.name.charAt(0)
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">{guardian.user.name}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{guardian.user.email}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              Trust: {guardian.user.trustScore || 0}
            </Badge>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="text-[var(--color-aurora-salmon)] hover:text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Permissions */}
      <div className="space-y-3 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[var(--muted-foreground)]" />
            <Label className="text-sm text-[var(--foreground)]">Can see my location</Label>
          </div>
          <Switch
            checked={guardian.permissions.canSeeLocation}
            onCheckedChange={(checked) => onUpdatePermissions({ canSeeLocation: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--muted-foreground)]" />
            <Label className="text-sm text-[var(--foreground)]">Receives emergency alerts</Label>
          </div>
          <Switch
            checked={guardian.permissions.canReceiveAlerts}
            onCheckedChange={(checked) => onUpdatePermissions({ canReceiveAlerts: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
            <Label className="text-sm text-[var(--foreground)]">Receives check-in alerts</Label>
          </div>
          <Switch
            checked={guardian.permissions.canReceiveCheckins}
            onCheckedChange={(checked) => onUpdatePermissions({ canReceiveCheckins: checked })}
          />
        </div>
      </div>
    </div>
  );
}
