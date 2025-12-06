"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Upload, 
  X, 
  Sparkles, 
  MapPin, 
  Hash,
  Play,
  Pause,
  RotateCcw,
  Check,
  Coins,
  Camera,
  Film,
  Zap,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

interface ReelCreatorProps {
  userId: Id<"users">;
  onClose?: () => void;
}

type CreatorStep = "select" | "record" | "upload" | "edit" | "publish";

const REEL_CATEGORIES = [
  { id: "safety-tip", label: "Safety Tip", emoji: "🛡️", credits: 20 },
  { id: "commute", label: "My Commute", emoji: "🚶‍♀️", credits: 25 },
  { id: "review", label: "Place Review", emoji: "⭐", credits: 15 },
  { id: "story", label: "My Story", emoji: "💜", credits: 15 },
  { id: "advice", label: "Career Advice", emoji: "💼", credits: 20 },
  { id: "wellness", label: "Wellness", emoji: "🧘‍♀️", credits: 15 },
];

const SUGGESTED_HASHTAGS = [
  "SafetyFirst", "WomenSupport", "AuroraApp", "SafeCommute", 
  "WomenInTech", "SelfCare", "CommunityPower", "StaySafe"
];

export function ReelCreator({ userId, onClose }: ReelCreatorProps) {
  const router = useRouter();
  const [step, setStep] = useState<CreatorStep>("select");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        alert('Video must be under 100MB');
        return;
      }
      
      setVideoFile(file);
      // Create blob URL for preview - will play inline in browser
      const blobUrl = URL.createObjectURL(file);
      setVideoPreview(blobUrl);
      setStep("edit");
      
      // Auto-play after a short delay to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    }
  }, []);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addHashtag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '').trim();
    if (cleanTag && !hashtags.includes(cleanTag) && hashtags.length < 10) {
      setHashtags([...hashtags, cleanTag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handlePublish = async () => {
    if (!videoFile || !category) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // TODO: Implement actual upload to Cloudinary/storage
      // For now, simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Show success and redirect
      setTimeout(() => {
        router.push('/feed');
      }, 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCategory = REEL_CATEGORIES.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose || (() => router.back())}>
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-[var(--foreground)]">Create Reel</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Share your experience</p>
          </div>
        </div>
        {step === "edit" && (
          <Button 
            onClick={() => setStep("publish")}
            disabled={!caption.trim()}
            className="bg-[var(--color-aurora-purple)] min-h-[40px]"
          >
            Next <Sparkles className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      <div className="max-w-lg mx-auto p-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Type */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Film className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">What's your reel about?</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Choose a category to help others find your content</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {REEL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      category === cat.id
                        ? "bg-[var(--color-aurora-purple)]/20 border-2 border-[var(--color-aurora-purple)]"
                        : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50"
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{cat.emoji}</span>
                    <p className="font-medium text-[var(--foreground)]">{cat.label}</p>
                    <Badge className="mt-2 bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-yellow)] border-0 text-xs">
                      +{cat.credits} credits
                    </Badge>
                  </button>
                ))}
              </div>

              {category && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[56px] bg-[var(--color-aurora-purple)]"
                  >
                    <Upload className="w-5 h-5 mr-2" /> Upload Video
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-center text-[var(--muted-foreground)]">
                    15-90 seconds • MP4, MOV • Max 100MB
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Edit */}
          {step === "edit" && videoPreview && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Video Preview - Custom in-browser player, prevents native player */}
              <div className="relative aspect-[9/16] max-h-[400px] bg-black rounded-2xl overflow-hidden touch-none">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover pointer-events-none"
                  loop
                  playsInline
                  muted={false}
                  autoPlay
                  disablePictureInPicture
                  disableRemotePlayback
                  controlsList="nodownload nofullscreen noremoteplayback"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
                />
                {/* Custom play/pause overlay - prevents native controls */}
                <button
                  onClick={togglePlayback}
                  className="absolute inset-0 flex items-center justify-center z-10"
                  type="button"
                >
                  {!isPlaying && (
                    <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setVideoFile(null); setVideoPreview(null); setStep("select"); }}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                >
                  <RotateCcw className="w-4 h-4 mr-1" /> Change
                </Button>
                {selectedCategory && (
                  <Badge className="absolute top-2 left-2 bg-black/50 text-white border-0">
                    {selectedCategory.emoji} {selectedCategory.label}
                  </Badge>
                )}
              </div>

              {/* Caption */}
              <div>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 500))}
                  placeholder="Write a caption... Share your experience, tips, or story"
                  className="min-h-[100px] bg-[var(--card)] border-[var(--border)] rounded-xl resize-none"
                />
                <p className="text-xs text-[var(--muted-foreground)] text-right mt-1">
                  {caption.length}/500
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Hashtags</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {hashtags.map((tag) => (
                    <Badge 
                      key={tag} 
                      className="bg-[var(--color-aurora-purple)]/20 text-[var(--color-aurora-purple)] cursor-pointer"
                      onClick={() => removeHashtag(tag)}
                    >
                      #{tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addHashtag(hashtagInput)}
                    placeholder="Add hashtag"
                    className="flex-1 h-10 rounded-xl"
                  />
                  <Button 
                    onClick={() => addHashtag(hashtagInput)}
                    disabled={!hashtagInput.trim()}
                    size="sm"
                    className="h-10"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {SUGGESTED_HASHTAGS.filter(t => !hashtags.includes(t)).slice(0, 4).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addHashtag(tag)}
                      className="text-xs px-2 py-1 bg-[var(--accent)] rounded-full text-[var(--muted-foreground)] hover:text-[var(--color-aurora-purple)]"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[var(--color-aurora-blue)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Location (optional)</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location"
                    className="h-11 rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                              const response = await fetch(
                                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
                              );
                              const data = await response.json();
                              if (data.features && data.features.length > 0) {
                                setLocation(data.features[0].place_name);
                              }
                            } catch (err) {
                              console.error("Reverse geocoding error:", err);
                            }
                          },
                          (err) => console.error("Geolocation error:", err)
                        );
                      }
                    }}
                    title="Use my current location"
                    className="min-w-[44px] min-h-[44px] rounded-xl"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-3 bg-[var(--accent)] rounded-xl">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-aurora-purple)]" />
                  <span className="text-sm text-[var(--foreground)]">Post anonymously</span>
                </div>
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isAnonymous ? "bg-[var(--color-aurora-purple)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isAnonymous ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Publish */}
          {step === "publish" && (
            <motion.div
              key="publish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Ready to share?</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Your reel will help other women stay safe</p>
              </div>

              {/* Preview Card */}
              <Card className="bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {videoPreview && (
                      <div className="w-20 h-28 bg-black rounded-lg overflow-hidden flex-shrink-0">
                        <video src={videoPreview} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)] line-clamp-2 mb-2">{caption || "No caption"}</p>
                      {hashtags.length > 0 && (
                        <p className="text-xs text-[var(--color-aurora-purple)] truncate">
                          {hashtags.map(t => `#${t}`).join(' ')}
                        </p>
                      )}
                      {location && (
                        <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {location}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Preview */}
              {selectedCategory && (
                <Card className="bg-[var(--color-aurora-yellow)]/10 border-[var(--color-aurora-yellow)]/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                        <span className="text-sm text-[var(--foreground)]">You'll earn</span>
                      </div>
                      <span className="text-xl font-bold text-[var(--color-aurora-yellow)]">
                        +{selectedCategory.credits} credits
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center text-[var(--muted-foreground)]">
                    {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handlePublish}
                  disabled={isUploading}
                  className="w-full min-h-[56px] bg-gradient-to-r from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] text-lg font-semibold"
                >
                  {isUploading ? (
                    "Publishing..."
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" /> Publish Reel
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("edit")}
                  disabled={isUploading}
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
