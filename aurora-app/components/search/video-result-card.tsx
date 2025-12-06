"use client";

/**
 * Video Result Card - Aurora App Search
 * Displays video search results with women-focused indicators
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Play, Clock, Eye, Heart, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface VideoResult {
  id: string;
  title: string;
  url: string;
  description: string;
  domain: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
  creator?: string;
  age?: string;
  isWomenFocused: boolean;
}

interface VideoResultCardProps {
  video: VideoResult;
  index: number;
}

export function VideoResultCard({ video, index }: VideoResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="block group">
        <Card className="overflow-hidden border-[var(--border)] hover:border-[var(--color-aurora-purple)]/30 hover:shadow-lg transition-all bg-[var(--card)]">
          <div className="flex gap-3 p-3">
            {/* Thumbnail */}
            <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--accent)]">
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-[var(--muted-foreground)]" />
                </div>
              )}
              {/* Duration overlay */}
              {video.duration && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-medium">
                  {video.duration}
                </div>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-[var(--color-aurora-purple)] ml-0.5" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-[var(--foreground)] group-hover:text-[var(--color-aurora-purple)] transition-colors line-clamp-2 mb-1">
                {video.title}
              </h4>
              
              <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)] mb-2 flex-wrap">
                <span className="text-[var(--color-aurora-purple)]">{video.domain}</span>
                {video.creator && (
                  <>
                    <span>•</span>
                    <span>{video.creator}</span>
                  </>
                )}
                {video.views && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> {video.views}
                    </span>
                  </>
                )}
                {video.age && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {video.age}
                    </span>
                  </>
                )}
              </div>

              {video.description && (
                <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                  {video.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-1.5 mt-2">
                {video.isWomenFocused && (
                  <Badge className="text-[8px] bg-[var(--color-aurora-pink)]/20 text-[var(--color-aurora-pink)] border-0 h-4">
                    <Heart className="w-2.5 h-2.5 mr-0.5" /> Women-Focused
                  </Badge>
                )}
                <Badge className="text-[8px] bg-[var(--accent)] text-[var(--muted-foreground)] border-0 h-4">
                  <ExternalLink className="w-2.5 h-2.5 mr-0.5" /> Video
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </a>
    </motion.div>
  );
}

export default VideoResultCard;
