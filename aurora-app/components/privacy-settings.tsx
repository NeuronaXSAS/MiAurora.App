"use client";

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, Shield, Eye, MessageSquare, Activity } from 'lucide-react';

export function PrivacySettings() {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const privacySettings = useQuery(api.privacy.getPrivacySettings);
  const updateSettings = useMutation(api.privacy.updatePrivacySettings);
  const requestExport = useMutation(api.privacy.requestDataExport);
  const requestDeletion = useMutation(api.privacy.requestAccountDeletion);

  const handleSettingChange = async (setting: string, value: any) => {
    try {
      await updateSettings({ [setting]: value });
      toast({
        title: 'Settings updated',
        description: 'Your privacy settings have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      const data = await requestExport();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aurora-data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast({
        title: 'Invalid confirmation',
        description: 'Please type "DELETE MY ACCOUNT" to confirm.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await requestDeletion({
        confirmation: deleteConfirmation,
        reason: deletionReason || undefined,
      });

      toast({
        title: 'Account deletion requested',
        description: 'Your account will be permanently deleted within 30 days.',
      });

      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: 'Deletion failed',
        description: 'Failed to process deletion request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!privacySettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Privacy Impact Info */}
      <Card className="bg-gradient-to-br from-aurora-lavender/20 to-aurora-pink/20 border-aurora-lavender">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-aurora-violet" />
            Privacy & Trust
          </CardTitle>
          <CardDescription>
            Your privacy choices affect your Trust Score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-aurora-lavender/30 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-aurora-violet" />
              </div>
              <div>
                <p className="font-semibold text-aurora-violet">Security Center</p>
                <p className="text-sm text-gray-600">Manage your data and privacy</p>
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-3 border border-aurora-lavender">
              <p className="text-xs text-gray-700 leading-relaxed">
                💡 <strong>Tip:</strong> Sharing anonymous data helps the community stay safe and increases your Trust Score. You're always in control of what you share.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Sharing
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base font-semibold">Analytics Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Help us improve Aurora by sharing anonymous usage data
              </p>
              {privacySettings.analyticsTracking && (
                <p className="text-xs text-green-600 font-medium mt-1">+5 credits earned</p>
              )}
            </div>
            <Switch
              checked={privacySettings.analyticsTracking}
              onCheckedChange={(checked) => handleSettingChange('analyticsTracking', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base font-semibold">Personalized Ads</Label>
              <p className="text-sm text-muted-foreground">
                Show ads based on your interests (coming soon)
              </p>
            </div>
            <Switch
              checked={privacySettings.personalizedAds}
              onCheckedChange={(checked) => handleSettingChange('personalizedAds', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base font-semibold">Location Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Share your location for safety features and route recommendations
              </p>
              {privacySettings.locationSharing && (
                <p className="text-xs text-green-600 font-medium mt-1">+10 credits earned</p>
              )}
            </div>
            <Switch
              checked={privacySettings.locationSharing}
              onCheckedChange={(checked) => handleSettingChange('locationSharing', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Profile Visibility</Label>
            <Select
              value={privacySettings.profileVisibility}
              onValueChange={(value) => handleSettingChange('profileVisibility', value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <span>🌍</span>
                    <div>
                      <p className="font-medium">Public</p>
                      <p className="text-xs text-gray-500">Anyone can see</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="anonymous">
                  <div className="flex items-center gap-2">
                    <span>🎭</span>
                    <div>
                      <p className="font-medium">Anonymous</p>
                      <p className="text-xs text-gray-500">Hide your identity</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <div>
                      <p className="font-medium">Private</p>
                      <p className="text-xs text-gray-500">Only you</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div className="space-y-0.5 flex-1">
              <Label className="text-base font-semibold">Activity Status</Label>
              <p className="text-sm text-muted-foreground">
                Show when you're online
              </p>
            </div>
            <Switch
              checked={privacySettings.activityStatus}
              onCheckedChange={(checked) => handleSettingChange('activityStatus', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Privacy
          </CardTitle>
          <CardDescription>
            Control who can send you messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Who can message you</Label>
            <Select
              value={privacySettings.messagePrivacy}
              onValueChange={(value) => handleSettingChange('messagePrivacy', value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>Everyone</span>
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center gap-2">
                    <span>👭</span>
                    <span>Friends Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <span>🚫</span>
                    <span>No One</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your data (GDPR/CCPA rights)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              onClick={handleDataExport}
              disabled={isExporting}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Download My Data'}
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Export all your data in JSON format
            </p>
          </div>

          <div>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your account and all data will be permanently deleted within 30 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Type "DELETE MY ACCOUNT" to confirm</Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Reason for leaving (optional)</Label>
              <Textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Help us improve by telling us why you're leaving..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleAccountDeletion}
              disabled={deleteConfirmation !== 'DELETE MY ACCOUNT'}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
