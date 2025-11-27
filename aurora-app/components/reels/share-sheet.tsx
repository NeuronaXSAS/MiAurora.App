'use client';

/**
 * ShareSheet Component
 * 
 * Bottom sheet for sharing reels via Web Share API or social links.
 * Includes copy link, WhatsApp, Twitter, and native share.
 */

import { useState } from 'react';
import { X, Link2, Check, MessageCircle, Twitter, Facebook, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface ShareSheetProps {
  reelId: Id<'reels'>;
  caption?: string;
  authorName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareSheet({ reelId, caption, authorName, isOpen, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const incrementShares = useMutation(api.reels.incrementShares);

  if (!isOpen) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/reels/${reelId}`;
  const shareText = caption 
    ? `${caption.slice(0, 100)}${caption.length > 100 ? '...' : ''} - Aurora App`
    : `Check out this safety reel on Aurora App!`;
  const shareTitle = authorName ? `Reel by ${authorName}` : 'Safety Reel';

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        await incrementShares({ reelId });
        onClose();
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      await incrementShares({ reelId });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank');
    incrementShares({ reelId });
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    incrementShares({ reelId });
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    incrementShares({ reelId });
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    incrementShares({ reelId });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] rounded-t-3xl p-6 pb-8 safe-area-inset-bottom animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-[var(--muted)] rounded-full mx-auto mb-6" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--foreground)]">Share Reel</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Share Options Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-[var(--foreground)]">WhatsApp</span>
          </button>

          {/* Twitter/X */}
          <button
            onClick={handleTwitterShare}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
              <Twitter className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-[var(--foreground)]">X</span>
          </button>

          {/* Facebook */}
          <button
            onClick={handleFacebookShare}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center">
              <Facebook className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-[var(--foreground)]">Facebook</span>
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegramShare}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--muted)] transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center">
              <Send className="w-7 h-7 text-white" />
            </div>
            <span className="text-xs text-[var(--foreground)]">Telegram</span>
          </button>
        </div>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-4 p-4 bg-[var(--muted)] rounded-xl mb-4 hover:bg-[var(--accent)] transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--color-aurora-purple)] flex items-center justify-center">
            {copied ? (
              <Check className="w-6 h-6 text-white" />
            ) : (
              <Link2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-[var(--foreground)]">
              {copied ? 'Link Copied!' : 'Copy Link'}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] truncate">
              {shareUrl}
            </p>
          </div>
        </button>

        {/* Native Share (if supported) */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <Button
            onClick={handleNativeShare}
            className="w-full h-14 bg-[var(--color-aurora-blue)] hover:bg-[var(--color-aurora-purple)] text-white font-semibold rounded-xl"
          >
            More Options
          </Button>
        )}
      </div>
    </>
  );
}
