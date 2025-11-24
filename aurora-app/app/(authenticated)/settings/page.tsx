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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#1e1b4b] to-slate-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-16 lg:top-0 z-10">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Settings</h1>
              <p className="text-xs sm:text-sm text-gray-300">
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
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-gray-300">Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Name</label>
                <p className="text-white mt-1">{user.name && user.name !== 'null' ? user.name : 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Email</label>
                <p className="text-white mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Location</label>
                <p className="text-white mt-1">{user.location || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Industry</label>
                <p className="text-white mt-1">{user.industry || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Privacy & Data</CardTitle>
              <CardDescription className="text-gray-300">Control your privacy preferences and data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => router.push('/settings/privacy')}
                className="w-full sm:w-auto bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Manage Privacy Settings
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="backdrop-blur-xl bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-gray-300">Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-300 mb-1">Delete Account</h3>
                    <p className="text-sm text-gray-300">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
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
        <DialogContent className="backdrop-blur-xl bg-slate-900/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm text-red-300 font-medium mb-2">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Your profile and account information</li>
                <li>All posts and contributions</li>
                <li>All comments and votes</li>
                <li>All routes and activity data</li>
                <li>Credit balance and transaction history</li>
                <li>Unlocked opportunities</li>
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">
                Type <span className="font-bold text-red-400">DELETE</span> to confirm
              </label>
              <Input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="font-mono bg-white/5 border-white/20 text-white"
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
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmationText !== "DELETE" || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
