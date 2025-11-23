"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings, Trash2, AlertTriangle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Get user ID
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

  // Fetch user data
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  const deleteAccount = useMutation(api.users.deleteAccount);

  const handleDeleteAccount = async () => {
    if (!userId || confirmationText !== "DELETE") {
      return;
    }

    setLoading(true);
    try {
      await deleteAccount({ userId });
      
      // Logout and redirect
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      alert("Failed to delete account: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 lg:top-0 z-10">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Manage your account preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 mt-1">{user.name && user.name !== 'null' ? user.name : 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900 mt-1">{user.location || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Industry</label>
                <p className="text-gray-900 mt-1">{user.industry || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Control your privacy preferences and data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => router.push('/settings/privacy')}
                className="w-full sm:w-auto"
              >
                Manage Privacy Settings
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Delete Account</h3>
                    <p className="text-sm text-red-700">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900 font-medium mb-2">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>Your profile and account information</li>
                <li>All posts and contributions</li>
                <li>All comments and votes</li>
                <li>All routes and activity data</li>
                <li>Credit balance and transaction history</li>
                <li>Unlocked opportunities</li>
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setConfirmationText("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmationText !== "DELETE" || loading}
            >
              {loading ? "Deleting..." : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
