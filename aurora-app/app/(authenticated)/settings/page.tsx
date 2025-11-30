"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationSettings } from "@/components/notification-settings";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useTheme } from "@/lib/theme-context";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Settings, Bell, Palette, Shield, Download, Trash2,
  Globe, Lock, Eye, EyeOff, Smartphone, Wifi, WifiOff,
  RefreshCw, HardDrive, User, Heart, Loader2, AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { isOnline, isRegistered, updateAvailable, skipWaiting } = useServiceWorker();
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState("appearance");
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteAccount = useMutation(api.users.deleteAccount);

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

  const handleDeleteAccount = async () => {
    if (!userId || deleteConfirmText !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      await deleteAccount({ userId });
      // Logout and redirect
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/?deleted=true";
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error al eliminar la cuenta. Por favor intenta de nuevo.");
      setIsDeleting(false);
    }
  };

  const sections = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "offline", label: "Offline & Data", icon: HardDrive },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-[var(--background)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-aurora-pink)] to-[var(--color-aurora-purple)] flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
              <p className="text-[var(--muted-foreground)]">Customize your Aurora App experience</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="p-4 mb-6 bg-[var(--card)] border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-[var(--color-aurora-mint)]" />
              ) : (
                <WifiOff className="w-5 h-5 text-[var(--color-aurora-orange)]" />
              )}
              <span className="text-[var(--foreground)]">
                {isOnline ? "Connected" : "Offline Mode"}
              </span>
            </div>
            {updateAvailable && (
              <Button
                size="sm"
                onClick={skipWaiting}
                className="min-h-[44px] bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-purple)]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Available
              </Button>
            )}
          </div>
        </Card>

        {/* Section Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                onClick={() => setActiveSection(section.id)}
                className={`min-h-[44px] ${activeSection === section.id 
                  ? "bg-[var(--color-aurora-purple)] text-white" 
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {section.label}
              </Button>
            );
          })}
        </div>

        {/* Appearance Section */}
        {activeSection === "appearance" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
              <h3 className="text-[var(--foreground)] font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--color-aurora-pink)]" />
                Theme
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--foreground)]">Color Mode</p>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    Current: {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
                  </p>
                </div>
                <ThemeToggle variant="pill" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <NotificationSettings />
          </motion.div>
        )}

        {/* Privacy Section */}
        {activeSection === "privacy" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
              <h3 className="text-[var(--foreground)] font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                Privacy Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]">
                  <div>
                    <p className="text-[var(--foreground)]">Anonymous Posting</p>
                    <p className="text-[var(--muted-foreground)] text-sm">Hide your identity in community posts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]">
                  <div>
                    <p className="text-[var(--foreground)]">Location Sharing</p>
                    <p className="text-[var(--muted-foreground)] text-sm">Share location with emergency contacts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]">
                  <div>
                    <p className="text-[var(--foreground)]">Profile Visibility</p>
                    <p className="text-[var(--muted-foreground)] text-sm">Who can see your profile</p>
                  </div>
                  <Badge variant="outline" className="border-[var(--border)] text-[var(--foreground)]">
                    Circles Only
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-[var(--color-aurora-salmon)]/10 border-[var(--color-aurora-salmon)]/20">
              <h3 className="text-[var(--color-aurora-salmon)] font-semibold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full min-h-[44px] border-[var(--color-aurora-salmon)]/30 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px] border-[var(--color-aurora-salmon)]/30 text-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Offline Section */}
        {activeSection === "offline" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
              <h3 className="text-[var(--foreground)] font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                Offline Capabilities
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]">
                  <div>
                    <p className="text-[var(--foreground)]">Service Worker</p>
                    <p className="text-[var(--muted-foreground)] text-sm">Enables offline functionality</p>
                  </div>
                  <Badge className={isRegistered ? "bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]" : "bg-[var(--color-aurora-orange)]/20 text-[var(--color-aurora-orange)]"}>
                    {isRegistered ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)]">
                  <div>
                    <p className="text-[var(--foreground)]">Emergency Features Offline</p>
                    <p className="text-[var(--muted-foreground)] text-sm">Panic button works without internet</p>
                  </div>
                  <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">Enabled</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[var(--muted-foreground)] text-sm flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-[var(--color-aurora-pink)]" /> for women everywhere
          </p>
          <p className="text-[var(--muted-foreground)] opacity-60 text-xs mt-1">Aurora App v1.0.0</p>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[var(--card)] border-[var(--border)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-aurora-salmon)] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Cuenta
            </DialogTitle>
            <DialogDescription className="text-[var(--muted-foreground)]">
              Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos tus datos:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Posts y comentarios</li>
                <li>Rutas compartidas</li>
                <li>Créditos acumulados</li>
                <li>Historial de actividad</li>
                <li>Configuración de perfil</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="text-sm text-[var(--foreground)] font-medium">
              Escribe <span className="text-[var(--color-aurora-salmon)] font-bold">DELETE</span> para confirmar:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-aurora-salmon)]/50"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              className="min-h-[44px] border-[var(--border)]"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
              className="min-h-[44px] bg-[var(--color-aurora-salmon)] hover:bg-[var(--color-aurora-salmon)]/90 text-white disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Cuenta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
