'use client';

/**
 * Single Reel Page
 * 
 * Shareable page for individual reels with full engagement features.
 * Supports deep linking and social sharing.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ReelPlayer } from '@/components/reels/reel-player';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle, Play } from 'lucide-react';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';

export default function ReelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.reelId as Id<'reels'>;
  const [userId, setUserId] = useState<Id<'users'> | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.userId) {
          setUserId(data.userId as Id<'users'>);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUserId();
  }, []);

  const reel = useQuery(api.reels.getReel, { reelId });
  const likeReel = useMutation(api.reels.likeReel);

  // Check if current user liked this reel
  const likeStatus = useQuery(
    api.reels.checkLikeStatus,
    userId ? { reelId, userId } : 'skip'
  );

  const handleLike = async () => {
    if (!userId) {
      router.push('/');
      return;
    }
    await likeReel({ reelId, userId });
  };

  if (reel === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (reel === null) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[var(--background)] p-8">
        <AlertCircle className="w-16 h-16 text-[var(--color-aurora-salmon)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Reel Not Found</h1>
        <p className="text-[var(--muted-foreground)] text-center mb-6">
          This reel may have been deleted or is no longer available.
        </p>
        <Link href="/reels">
          <Button className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white">
            Browse Reels
          </Button>
        </Link>
      </div>
    );
  }

  // If not authenticated, show a preview with CTA
  if (!userId) {
    return (
      <div className="h-screen w-full bg-black relative">
        {/* Video Preview (muted, no controls) */}
        <video
          src={reel.videoUrl}
          poster={reel.thumbnailUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 pb-12">
          {/* Author Info */}
          {reel.author && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] flex items-center justify-center text-white font-bold">
                {reel.author.profileImage ? (
                  <img
                    src={reel.author.profileImage}
                    alt={reel.author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  reel.author.name[0].toUpperCase()
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{reel.author.name}</p>
                <p className="text-white/60 text-sm">on Aurora App</p>
              </div>
            </div>
          )}

          {/* Caption */}
          {reel.caption && (
            <p className="text-white text-lg mb-6 line-clamp-3">{reel.caption}</p>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full h-14 bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white font-semibold text-lg rounded-xl">
                <Play className="w-5 h-5 mr-2" />
                Join Aurora App to Engage
              </Button>
            </Link>
            <p className="text-white/60 text-center text-sm">
              Sign up free to like, comment, and share safety reels
            </p>
          </div>
        </div>

        {/* Aurora Logo */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <img src="/Au_Logo_1.png" alt="Aurora App" className="w-10 h-10" />
          <span className="text-white font-bold text-lg">Aurora App</span>
        </div>
      </div>
    );
  }

  // Full reel experience for authenticated users
  const reelWithLikeStatus = {
    ...reel,
    isLiked: likeStatus?.isLiked || false,
  };

  return (
    <div className="h-screen w-full relative">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Reel Player */}
      <ReelPlayer
        reel={reelWithLikeStatus}
        isActive={isActive}
        currentUserId={userId}
        onLike={handleLike}
        onComment={() => {}}
        onShare={() => {}}
      />

      {/* More Reels CTA */}
      <Link
        href="/reels"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium hover:bg-white/30 transition-colors"
      >
        See More Reels
      </Link>
    </div>
  );
}
