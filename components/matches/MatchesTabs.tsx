'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  upcomingContent: React.ReactNode
  finishedContent: React.ReactNode
  finishedCount: number
}

export function MatchesTabs({ upcomingContent, finishedContent, finishedCount }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get('tab') === 'finished' ? 'finished' : 'upcoming'

  return (
    <div className="space-y-4">
      <div className="flex gap-2 glass rounded-xl p-1">
        <button
          onClick={() => router.push('?tab=upcoming')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
            tab === 'upcoming' ? 'bg-brand-green text-brand-dark' : 'text-gray-400 hover:text-white'
          )}
        >
          قادمة
        </button>
        <button
          onClick={() => router.push('?tab=finished')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
            tab === 'finished' ? 'bg-brand-green text-brand-dark' : 'text-gray-400 hover:text-white'
          )}
        >
          منتهية {finishedCount > 0 && <span className="text-xs opacity-70">({finishedCount})</span>}
        </button>
      </div>

      {tab === 'upcoming' ? upcomingContent : finishedContent}
    </div>
  )
}
