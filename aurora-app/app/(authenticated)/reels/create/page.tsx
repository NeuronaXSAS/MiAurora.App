'use client';

/**
 * Create Reel Page
 * 
 * Full-screen mobile-first video recording and upload experience.
 * Flow: Record → Preview → Add Details → Upload
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoRecorder } from '@/components/reels/video-recorder';
import { UploadForm } from '@/components/reels/upload-form';
import { ErrorBoundary } from '@/components/error-boundary';

type FlowState = 'recording' | 'form' | 'success';

function CreateReelContent() {
  const router = useRouter();
  const [flowState, setFlowState] = useState<FlowState>('recording');
  const [recordedVideo, setRecordedVideo] = useState<{
    blob: Blob;
    previewUrl: string;
  } | null>(null);

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
      {flowState === 'recording' && (
        <VideoRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={handleCancel}
          maxDuration={60}
        />
      )}

      {flowState === 'form' && recordedVideo && (
        <UploadForm
          videoBlob={recordedVideo.blob}
          videoPreviewUrl={recordedVideo.previewUrl}
          onSuccess={handleUploadSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {flowState === 'success' && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
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
            <h2 className="text-2xl font-bold text-white">Reel Posted!</h2>
            <p className="text-gray-400">You earned 20 credits 🎉</p>
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
