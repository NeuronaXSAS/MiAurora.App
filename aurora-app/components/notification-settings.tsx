"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { NotificationPreferences, AuroraNotifications } from '@/lib/push-notifications';
import { 
  Bell, BellOff, Shield, Heart, MessageSquare, 
  Trophy, Users, Sparkles, AlertTriangle, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationTypes = [
  {
    key: 'safetyAlerts',
    label: 'Safety Alerts',
    description: 'Critical safety notifications',
    icon: Shield,
    color: 'text-red-400',
    critical: true,
  },
  {
    key: 'checkInReminders',
    label: 'Check-in Reminders',
    description: 'Scheduled safety check-ins',
    icon: AlertTriangle,
    color: 'text-orange-400',
    critical: true,
  },
  {
    key: 'emergencyAlerts',
    label: 'Emergency Alerts',
    description: 'When contacts need help',
    icon: Bell,
    color: 'text-red-500',
    critical: true,
  },
  {
    key: 'credits',
    label: 'Credits & Rewards',
    description: 'When you earn credits',
    icon: Sparkles,
    color: 'text-[#FFC285]',
  },
  {
    key: 'circleActivity',
    label: 'Circle Activity',
    description: 'Updates from your circles',
    icon: Users,
    color: 'text-[#8B5CF6]',
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'New direct messages',
    icon: MessageSquare,
    color: 'text-[#FF6B7A]',
  },
];


export function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    isSubscribed, 
    isLoading,
    requestPermission,
    notify 
  } = usePushNotifications();
  
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPreferences(NotificationPreferences.getPreferences());
  }, []);

  const handleToggle = (key: string, value: boolean) => {
    NotificationPreferences.setPreference(key, value);
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleTestNotification = async () => {
    await notify(AuroraNotifications.creditsEarned(50, 'testing notifications'));
  };

  if (!isSupported) {
    return (
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center gap-3 text-white/60">
          <BellOff className="w-6 h-6" />
          <div>
            <p className="font-medium">Notifications Not Supported</p>
            <p className="text-sm">Your browser doesn't support push notifications.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card className="p-6 bg-gradient-to-br from-white/5 to-white/10 border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              permission === 'granted' 
                ? "bg-green-500/20" 
                : "bg-[#FF6B7A]/20"
            )}>
              {permission === 'granted' ? (
                <Bell className="w-6 h-6 text-green-400" />
              ) : (
                <BellOff className="w-6 h-6 text-[#FF6B7A]" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold">Push Notifications</h3>
              <p className="text-white/60 text-sm">
                {permission === 'granted' 
                  ? 'Notifications are enabled' 
                  : permission === 'denied'
                  ? 'Notifications are blocked'
                  : 'Enable notifications for safety alerts'}
              </p>
            </div>
          </div>
          
          {permission !== 'granted' && permission !== 'denied' && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#FF6B7A] to-[#E84D5F]"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
          )}
          
          {permission === 'granted' && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Check className="w-3 h-3 mr-1" /> Enabled
            </Badge>
          )}
        </div>
      </Card>

      {/* Notification Types */}
      {permission === 'granted' && (
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-white font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              const isEnabled = preferences[type.key] !== false;
              
              return (
                <motion.div
                  key={type.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-white/10")}>
                      <Icon className={cn("w-5 h-5", type.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{type.label}</p>
                        {type.critical && (
                          <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/50 text-sm">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(type.key, checked)}
                    disabled={type.critical}
                  />
                </motion.div>
              );
            })}
          </div>
          
          {/* Test Button */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleTestNotification}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
