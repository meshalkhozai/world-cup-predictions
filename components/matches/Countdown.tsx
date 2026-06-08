'use client'

import { useEffect, useState } from 'react'
import { LockIcon } from '@/components/icons'
import { getSecondsUntilKickoff } from '@/lib/timezone'

export function Countdown({ kickoffTime }: { kickoffTime: string }) {
  const [seconds, setSeconds] = useState(getSecondsUntilKickoff(kickoffTime))

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setInterval(() => {
      const s = getSecondsUntilKickoff(kickoffTime)
      setSeconds(s)
      if (s <= 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [kickoffTime, seconds])

  if (seconds <= 0) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-medium">
        <LockIcon size={12} />
        التوقعات مغلقة
      </div>
    )
  }

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return (
    <div className="flex items-center justify-center gap-2 text-center">
      {h > 0 && (
        <>
          <TimeUnit value={h} label="س" />
          <span className="text-white/30 text-sm mb-3">:</span>
        </>
      )}
      <TimeUnit value={m} label="د" />
      <span className="text-white/30 text-sm mb-3">:</span>
      <TimeUnit value={s} label="ث" />
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold text-brand-green tabular-nums w-8 text-center">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-xs text-white/30">{label}</span>
    </div>
  )
}
