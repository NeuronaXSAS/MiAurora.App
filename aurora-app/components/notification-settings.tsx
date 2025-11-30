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
    color: 'text-[var(--color-aurora-orange)]',
    critical: true,
  },
  {
    key: 'checkInReminders',
    label: 'Check-in Reminders',
    description: 'Scheduled safety check-ins',
    icon: AlertTriangle,
    color: 'text-[var(--color-aurora-yellow)]',
    critical: true,
  },
  {
    key: 'emergencyAlerts',
    label: 'Emergency Alerts',
    description: 'When contacts need help',
    icon: Bell,
    color: 'text-[var(--color-aurora-orange)]',
    critical: true,
  },
  {
    key: 'credits',
    label: 'Credits & Rewards',
    description: 'When you earn credits',
    icon: Sparkles,
    color: 'text-[var(--color-aurora-yellow)]',
  },
  {
    key: 'circleActivity',
    label: 'Circle Activity',
    description: 'Updates from your circles',
    icon: Users,
    color: 'text-[var(--color-aurora-purple)]',
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'New direct messages',
    icon: MessageSquare,
    color: 'text-[var(--color-aurora-pink)]',
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
      <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
        <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
          <BellOff className="w-6 h-6" />
          <div>
            <p className="font-medium text-[var(--foreground)]">Notifications Not Supported</p>
            <p className="text-sm">Your browser doesn't support push notifications.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              permission === 'granted' 
                ? "bg-[var(--color-aurora-mint)]/20" 
                : "bg-[var(--color-aurora-salmon)]/20"
            )}>
              {permission === 'granted' ? (
                <Bell className="w-6 h-6 text-[var(--color-aurora-mint)]" />
              ) : (
                <BellOff className="w-6 h-6 text-[var(--color-aurora-salmon)]" />
              )}
            </div>
            <div>
              <h3 className="text-[var(--foreground)] font-semibold">Push Notifications</h3>
              <p className="text-[var(--muted-foreground)] text-sm">
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
              onClick={async () => {
                const granted = await requestPermission();
                if (granted) {
                  // Show success notification
                  await notify(AuroraNotifications.creditsEarned(0, 'enabling notifications'));
                }
              }}
              disabled={isLoading}
              className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] min-h-[44px]"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
          )}
          
          {permission === 'granted' && (
            <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)] border-[var(--color-aurora-mint)]/30">
              <Check className="w-3 h-3 mr-1" /> Enabled
            </Badge>
          )}
        </div>
      </Card>

      {/* Notification Types */}
      {permission === 'granted' && (
        <Card className="p-6 bg-[var(--card)] border-[var(--border)]">
          <h3 className="text-[var(--foreground)] font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              const isEnabled = preferences[type.key] !== false;
              
              return (
                <motion.div
                  key={type.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--background)]")}>
                      <Icon className={cn("w-5 h-5", type.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[var(--foreground)] font-medium">{type.label}</p>
                        {type.critical && (
                          <Badge variant="outline" className="text-xs border-[var(--color-aurora-orange)]/30 text-[var(--color-aurora-orange)]">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <p className="text-[var(--muted-foreground)] text-sm">{type.description}</p>
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
          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <Button
              variant="outline"
              onClick={handleTestNotification}
              className="w-full border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] min-h-[44px]"
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
