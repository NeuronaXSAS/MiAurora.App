"use client";

import { useState, useEffect, useRef } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading and blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Use Intersection Observer for lazy loading (unless priority)
    if (!priority && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute("data-src");
              }
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: "50px", // Start loading 50px before entering viewport
        }
      );

      observer.observe(imgRef.current);

      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    } else if (priority && imgRef.current) {
      // Load immediately for priority images
      imgRef.current.src = src;
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`bg-[var(--accent)] flex items-center justify-center rounded-xl ${className}`}
        style={{ width, height }}
      >
        <span className="text-[var(--muted-foreground)] text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {/* Blur placeholder with Aurora gradient */}
      {!isLoaded && (
        <div
          className="absolute inset-0 skeleton-shimmer rounded-xl bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10"
          style={{ width: "100%", height: "100%" }}
        />
      )}
      <img
        ref={imgRef}
        data-src={priority ? undefined : src}
        src={priority ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}

/**
 * Get optimized image URL (for CDN or image optimization service)
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
  }
): string {
  // If using Convex storage, it handles optimization
  if (url.includes("convex")) {
    return url;
  }

  // Add query parameters for image optimization
  // This is a placeholder - adjust based on your CDN/service
  const params = new URLSearchParams();
  if (options?.width) params.append("w", options.width.toString());
  if (options?.height) params.append("h", options.height.toString());
  if (options?.quality) params.append("q", options.quality.toString());
  if (options?.format) params.append("f", options.format);

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}
