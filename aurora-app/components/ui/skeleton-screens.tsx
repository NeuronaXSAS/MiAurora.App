"use client";

import { cn } from "@/lib/utils";

// Base Skeleton component with Aurora shimmer effect
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[var(--color-aurora-lavender)]/20",
        className
      )}
      {...props}
    />
  );
}

// Feed Post Skeleton
export function FeedPostSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Image placeholder */}
      <Skeleton className="h-48 w-full rounded-xl" />
      {/* Actions */}
      <div className="flex gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

// Profile Card Skeleton
export function ProfileCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-4 pt-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}


// Route Card Skeleton
export function RouteCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

// Message List Skeleton
export function MessageListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3"
        >
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Opportunity Card Skeleton
export function OpportunityCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

// Circle Card Skeleton
export function CircleCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Resource Card Skeleton
export function ResourceCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-2"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// Full Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeedPostSkeleton />
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </div>
    </div>
  );
}
