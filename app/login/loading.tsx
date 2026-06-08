import { Skeleton } from '@/components/ui/Skeleton'

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-2xl" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="glass rounded-2xl p-6 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
      </div>
    </div>
  )
}
