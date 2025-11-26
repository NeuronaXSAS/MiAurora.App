"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Phone,
  User,
  Shield,
  TestTube,
  Clock,
  Users as UsersIcon,
} from "lucide-react";

import { SafetyCheckin } from "@/components/safety-checkin";
import { SisterAccompaniment } from "@/components/sister-accompaniment";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function EmergencyPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const router = useRouter();

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

  const contacts = useQuery(api.emergency.getEmergencyContacts);
  const alerts = useQuery(api.emergency.getMyEmergencyAlerts);
  const saveContact = useMutation(api.emergency.saveEmergencyContact);
  const deleteContact = useMutation(api.emergency.deleteEmergencyContact);

  const [isAdding, setIsAdding] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [activeTab, setActiveTab] = useState("panic");
  const [newContact, setNewContact] = useState({
    name: "",
    phoneNumber: "",
    relationship: "",
    priority: 1,
  });

  const handleSaveContact = async () => {
    if (!newContact.name || !newContact.phoneNumber) {
      alert("Please fill in name and phone number");
      return;
    }

    try {
      await saveContact(newContact);
      setNewContact({ name: "", phoneNumber: "", relationship: "", priority: 1 });
      setIsAdding(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteContact = async (contactId: Id<"emergencyContacts">) => {
    if (confirm("Are you sure you want to remove this emergency contact?")) {
      await deleteContact({ contactId });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-orange)] to-[var(--color-aurora-pink)] text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Aurora Guardian</h1>
              <p className="text-sm sm:text-base text-white/80">
                Emergency Safety System
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        {/* Tabs for different safety features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3 mb-6 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
            <TabsTrigger value="panic" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-orange)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Panic</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-purple)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="accompany" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-[var(--color-aurora-pink)] data-[state=active]:text-white rounded-lg py-2 sm:py-2.5">
              <UsersIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Accompany</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="panic">
            {/* Test Mode Toggle */}
            <Card className="mb-6 border-[var(--color-aurora-yellow)]/50 bg-[var(--color-aurora-yellow)]/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--color-aurora-yellow)]/20 rounded-xl flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">Test Mode</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Practice without sending real alerts
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={testMode ? "default" : "outline"}
                    onClick={() => setTestMode(!testMode)}
                    className={testMode ? "bg-[var(--color-aurora-yellow)] hover:bg-[var(--color-aurora-yellow)]/90 text-[var(--color-aurora-violet)]" : "border-[var(--border)]"}
                  >
                    {testMode ? "ON" : "OFF"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
        <Card className="mb-6 bg-[var(--card)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[var(--foreground)]">
              <span>Emergency Contacts</span>
              {contacts && contacts.length < 5 && (
                <Button
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  disabled={isAdding}
                  className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Add up to 5 emergency contacts who will be notified when you trigger an alert.
              They will receive WhatsApp messages with your location.
            </p>

            {isAdding && (
              <div className="bg-[var(--accent)] p-4 rounded-xl mb-4 space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newContact.phoneNumber}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phoneNumber: e.target.value })
                    }
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    value={newContact.relationship}
                    onChange={(e) =>
                      setNewContact({ ...newContact, relationship: e.target.value })
                    }
                    placeholder="Friend, Family, Partner, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-5)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="5"
                    value={newContact.priority}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Lower numbers are notified first
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveContact} className="flex-1 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)]">
                    Save Contact
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[var(--border)]"
                    onClick={() => {
                      setIsAdding(false);
                      setNewContact({
                        name: "",
                        phoneNumber: "",
                        relationship: "",
                        priority: 1,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {contacts && contacts.length === 0 && !isAdding && (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <User className="w-12 h-12 mx-auto mb-3 text-[var(--color-aurora-lavender)]" />
                <p className="text-[var(--foreground)]">No emergency contacts added yet</p>
                <p className="text-sm">Add contacts to enable emergency alerts</p>
              </div>
            )}

            <div className="space-y-3">
              {contacts?.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--color-aurora-orange)]/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--color-aurora-orange)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{contact.name}</p>
                      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                        <Phone className="w-3 h-3" />
                        <span>{contact.phoneNumber}</span>
                        {contact.relationship && (
                          <>
                            <span>•</span>
                            <span>{contact.relationship}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Priority: {contact.priority}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact._id)}
                    className="hover:bg-[var(--color-aurora-salmon)]/10"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--color-aurora-salmon)]" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

            {/* Alert History */}
            <Card className="bg-[var(--card)] border-[var(--border)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Alert History</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.length === 0 && (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-[var(--color-aurora-lavender)]" />
                    <p className="text-[var(--foreground)]">No emergency alerts triggered</p>
                  </div>
                )}

                <div className="space-y-3">
                  {alerts?.map((alert) => (
                    <div
                      key={alert._id}
                      className="p-4 border border-[var(--border)] rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span
                            className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${
                              alert.status === "active"
                                ? "bg-[var(--color-aurora-orange)]/20 text-[var(--color-aurora-orange)]"
                                : alert.status === "resolved"
                                ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]"
                                : "bg-[var(--accent)] text-[var(--muted-foreground)]"
                            }`}
                          >
                            {alert.status.toUpperCase()}
                          </span>
                          <span className="ml-2 text-sm text-[var(--muted-foreground)]">
                            {alert.alertType}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {new Date(alert._creationTime).toLocaleString()}
                        </span>
                      </div>
                      {alert.location.address && (
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">
                          📍 {alert.location.address}
                        </p>
                      )}
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {alert.notifiedContacts.length} contacts notified •{" "}
                        {alert.nearbyUsersNotified} nearby users alerted
                      </p>
                      {alert.notes && (
                        <p className="text-sm text-[var(--muted-foreground)] mt-2 italic">
                          {alert.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin">
            {userId && <SafetyCheckin userId={userId} />}
          </TabsContent>

          <TabsContent value="accompany">
            {userId && <SisterAccompaniment userId={userId} />}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
