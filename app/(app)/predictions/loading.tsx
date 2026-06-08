import { Skeleton } from '@/components/ui/Skeleton'

export default function PredictionsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <div className="space-y-1">
          <Skeleton className="h-7 w-10" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Pending */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1 text-end">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>

      {/* Finished */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-1 text-end">
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
