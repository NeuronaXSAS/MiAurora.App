'use client';

/**
 * Create Reel Page
 * 
 * Full-screen mobile-first video recording and upload experience.
 * Flow: Record → Preview → Add Details → Upload
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoRecorder } from '@/components/reels/video-recorder';
import { UploadForm } from '@/components/reels/upload-form';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';

type FlowState = 'loading' | 'rate_limited' | 'recording' | 'form' | 'success';

function CreateReelContent() {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [userId, setUserId] = useState<Id<'users'> | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number } | null>(null);
  const [recordedVideo, setRecordedVideo] = useState<{
    blob: Blob;
    previewUrl: string;
  } | null>(null);

  // Get current user ID and check rate limit
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<'users'>);
          setIsPremium(data.isPremium || false);
          
          // Check rate limit for reels
          const limit = data.isPremium ? 20 : 3;
          const stored = localStorage.getItem('aurora_usage');
          let used = 0;
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const today = new Date().toDateString();
              if (parsed.date === today) {
                used = parsed.usage?.reels || 0;
              }
            } catch (e) {}
          }
          
          setRateLimitInfo({ remaining: Math.max(0, limit - used), limit });
          
          if (used >= limit) {
            setFlowState('rate_limited');
          } else {
            setFlowState('recording');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error getting user:', error);
        router.push('/');
      }
    };
    getUserId();
  }, [router]);

  const handleRecordingComplete = (videoBlob: Blob) => {
    const previewUrl = URL.createObjectURL(videoBlob);
    setRecordedVideo({ blob: videoBlob, previewUrl });
    setFlowState('form');
  };

  const handleUploadSuccess = () => {
    setFlowState('success');
    
    // Show success message and redirect
    setTimeout(() => {
      router.push('/reels');
    }, 2000);
  };

  const handleCancel = () => {
    // Clean up preview URL
    if (recordedVideo?.previewUrl) {
      URL.revokeObjectURL(recordedVideo.previewUrl);
    }
    
    router.back();
  };

  const handleFormCancel = () => {
    // Go back to recording
    if (recordedVideo?.previewUrl) {
      URL.revokeObjectURL(recordedVideo.previewUrl);
    }
    setRecordedVideo(null);
    setFlowState('recording');
  };

  return (
    <>
      {flowState === 'loading' && (
        <div className="fixed inset-0 z-50 bg-[var(--background)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
        </div>
      )}

      {flowState === 'rate_limited' && (
        <div className="fixed inset-0 z-50 bg-[var(--background)] flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-aurora-orange)]/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-[var(--color-aurora-orange)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Daily Limit Reached</h2>
              <p className="text-[var(--muted-foreground)]">
                {isPremium 
                  ? "You've reached your daily limit of 20 reels. Come back tomorrow!"
                  : "You've used your 3 free reels today. Upgrade to Premium for 20 reels per day!"}
              </p>
            </div>
            {!isPremium && (
              <Link href="/premium">
                <Button className="bg-gradient-to-r from-[var(--color-aurora-yellow)] to-[var(--color-aurora-orange)] text-slate-900 hover:opacity-90 min-h-[44px]">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium - $5/month
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => router.push('/reels')} className="min-h-[44px]">
              Back to Reels
            </Button>
          </div>
        </div>
      )}

      {flowState === 'recording' && (
        <VideoRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleCancel}
          maxDuration={60}
        />
      )}

      {flowState === 'form' && recordedVideo && userId && (
        <UploadForm
          videoBlob={recordedVideo.blob}
          videoPreviewUrl={recordedVideo.previewUrl}
          userId={userId}
          onSuccess={handleUploadSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {flowState === 'success' && (
        <div className="fixed inset-0 z-50 bg-[var(--background)] flex items-center justify-center">
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Reel Posted!</h2>
            <p className="text-[var(--color-aurora-yellow)]">You earned 20 credits 🎉</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function CreateReelPage() {
  return (
    <ErrorBoundary>
      <CreateReelContent />
    </ErrorBoundary>
  );
}
