"use client";

import { PrivacySettings } from '@/components/privacy-settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacySettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 lg:top-0 z-10">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Privacy & Data</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Manage your privacy settings and data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <PrivacySettings />
        </div>
      </div>
    </div>
  );
}
