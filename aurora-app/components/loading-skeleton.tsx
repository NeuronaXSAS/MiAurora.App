/**
 * Optimized Loading Skeletons
 * 
 * Fast, smooth loading states that maintain layout stability
 * and provide visual feedback during content loading.
 */

export function PostCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 skeleton-shimmer">
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent)] rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-[var(--accent)] rounded-lg w-28 sm:w-32 mb-2" />
          <div className="h-3 bg-[var(--accent)] rounded-lg w-20 sm:w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-[var(--accent)] rounded-lg w-full" />
        <div className="h-4 bg-[var(--accent)] rounded-lg w-5/6" />
        <div className="h-4 bg-[var(--accent)] rounded-lg w-4/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 bg-[var(--accent)] rounded-xl w-20" />
        <div className="h-9 bg-[var(--accent)] rounded-xl w-20" />
        <div className="h-9 bg-[var(--accent)] rounded-xl w-16 ml-auto" />
      </div>
    </div>
  );
}

// Compact skeleton for faster perceived loading
export function CompactPostSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 skeleton-shimmer">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3 bg-[var(--accent)] rounded w-3/4 mb-1.5" />
          <div className="h-2.5 bg-[var(--accent)] rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Feed loading with value proposition - optimized for fast perceived loading
export function FeedLoadingSkeleton() {
  return (
    <div className="space-y-3 page-transition-enter">
      {/* Value hint while loading - shows Aurora App purpose immediately */}
      <div className="bg-gradient-to-r from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10 rounded-xl p-4 text-center stagger-item">
        <div className="w-10 h-10 bg-[var(--color-aurora-purple)]/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
          <div className="w-5 h-5 bg-[var(--color-aurora-purple)]/40 rounded-full animate-pulse" />
        </div>
        <p className="text-sm text-[var(--foreground)] font-medium">Loading your personalized feed...</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">Safety • Community • Opportunities</p>
      </div>
      <div className="stagger-item"><PostCardSkeleton /></div>
      <div className="stagger-item"><CompactPostSkeleton /></div>
      <div className="stagger-item"><CompactPostSkeleton /></div>
    </div>
  );
}

// Quick loading indicator for instant feedback
export function QuickLoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] rounded-full">
        <div className="w-4 h-4 border-2 border-[var(--color-aurora-purple)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--muted-foreground)]">Loading...</span>
      </div>
    </div>
  );
}

// Inline skeleton for small content areas
export function InlineSkeleton({ width = "w-20", height = "h-4" }: { width?: string; height?: string }) {
  return (
    <div className={`${width} ${height} bg-[var(--accent)] rounded skeleton-shimmer`} />
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-5 sm:h-6 bg-[var(--accent)] rounded-lg w-40 sm:w-48" />
        <div className="h-6 bg-[var(--accent)] rounded-full w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-[var(--accent)] rounded-lg w-full" />
        <div className="h-4 bg-[var(--accent)] rounded-lg w-4/5" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[var(--accent)] rounded-lg w-24" />
        <div className="h-11 bg-[var(--accent)] rounded-xl w-28" />
      </div>
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent)] rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-6 sm:h-8 bg-[var(--accent)] rounded-lg w-12 sm:w-16 mb-2" />
              <div className="h-3 bg-[var(--accent)] rounded-lg w-20 sm:w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReelSkeleton() {
  return (
    <div className="w-full h-full bg-[var(--color-aurora-violet)] animate-pulse flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-white/10" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-[var(--accent)] rounded-lg w-32 mb-2" />
          <div className="h-3 bg-[var(--accent)] rounded-lg w-48" />
        </div>
        <div className="h-3 bg-[var(--accent)] rounded-lg w-12" />
      </div>
    </div>
  );
}

export function CircleSkeleton() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--accent)] rounded-2xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-[var(--accent)] rounded-lg w-32 mb-2" />
          <div className="h-3 bg-[var(--accent)] rounded-lg w-24" />
        </div>
      </div>
      <div className="h-4 bg-[var(--accent)] rounded-lg w-full mb-2" />
      <div className="h-4 bg-[var(--accent)] rounded-lg w-3/4" />
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-[var(--accent)] rounded-full w-20" />
        <div className="h-8 bg-[var(--accent)] rounded-full w-24" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-[var(--accent)] animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-[var(--color-aurora-purple)]/20 rounded-full mx-auto mb-3 flex items-center justify-center">
          <div className="w-6 h-6 bg-[var(--color-aurora-purple)]/40 rounded-full" />
        </div>
        <div className="h-4 bg-[var(--color-aurora-purple)]/20 rounded-lg w-32 mx-auto" />
      </div>
    </div>
  );
}
