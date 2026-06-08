import { Skeleton } from '@/components/ui/Skeleton'

export default function AdminMatchesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
