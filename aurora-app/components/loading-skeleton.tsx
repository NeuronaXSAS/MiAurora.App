export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded w-20" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-48" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-28" />
      </div>
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
