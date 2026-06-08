import { Skeleton } from '@/components/ui/Skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Skeleton className="h-7 w-28" />

      {/* Podium */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-end justify-center gap-3 h-36">
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="w-full h-20 rounded-t-lg" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="w-full h-28 rounded-t-lg" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="w-full h-16 rounded-t-lg" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <Skeleton className="w-8 h-5" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="space-y-1 text-end">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
