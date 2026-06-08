import { Skeleton } from '@/components/ui/Skeleton'

export default function MatchesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Today */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-2 flex-1">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex flex-col items-center gap-1 px-4">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-3 w-10" />
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="w-7 h-7 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
