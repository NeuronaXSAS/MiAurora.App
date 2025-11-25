"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationSettings } from "@/components/notification-settings";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useTheme } from "@/lib/theme-context";
import {
  Settings, Bell, Palette, Shield, Download, Trash2,
  Globe, Lock, Eye, EyeOff, Smartphone, Wifi, WifiOff,
  RefreshCw, HardDrive, User, Heart
} from "lucide-react";

export default function SettingsPage() {
  const { isOnline, isRegistered, updateAvailable, skipWaiting } = useServiceWorker();
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState("appearance");

  const sections = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "offline", label: "Offline & Data", icon: HardDrive },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B7A] to-[#8B5CF6] flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-white/60">Customize your Aurora experience</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="p-4 mb-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-400" />
              )}
              <span className="text-white">
                {isOnline ? "Connected" : "Offline Mode"}
              </span>
            </div>
            {updateAvailable && (
              <Button
                size="sm"
                onClick={skipWaiting}
                className="bg-[#FF6B7A] hover:bg-[#E84D5F]"
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
                className={activeSection === section.id 
                  ? "bg-[#FF6B7A] text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
                }
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
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#FF6B7A]" />
                Theme
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Color Mode</p>
                  <p className="text-white/50 text-sm">
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
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#8B5CF6]" />
                Privacy Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white">Anonymous Posting</p>
                    <p className="text-white/50 text-sm">Hide your identity in community posts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white">Location Sharing</p>
                    <p className="text-white/50 text-sm">Share location with emergency contacts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white">Profile Visibility</p>
                    <p className="text-white/50 text-sm">Who can see your profile</p>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white">
                    Circles Only
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-red-500/10 border-red-500/20">
              <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
                <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
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
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#FFC285]" />
                Offline Capabilities
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white">Service Worker</p>
                    <p className="text-white/50 text-sm">Enables offline functionality</p>
                  </div>
                  <Badge className={isRegistered ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}>
                    {isRegistered ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white">Emergency Features Offline</p>
                    <p className="text-white/50 text-sm">Panic button works without internet</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-[#FF6B7A]" /> for women everywhere
          </p>
          <p className="text-white/30 text-xs mt-1">Aurora v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
