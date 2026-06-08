import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* User card */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-1 text-end">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 space-y-2 flex flex-col items-center">
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Today matches */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-12" />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="w-7 h-7 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 flex flex-col items-center gap-2">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
