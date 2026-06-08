'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatMatchDate, formatKickoffTime } from '@/lib/timezone'
import type { Match } from '@/types'

export function MatchAdminList({ matches }: { matches: Match[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this match? All predictions for it will also be deleted.')) return
    setDeleting(id)
    await supabase.from('matches').delete().eq('id', id)
    router.refresh()
    setDeleting(null)
  }

  if (matches.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center text-white/40">
        No matches yet. Import a CSV above.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-white">All Matches ({matches.length})</h2>
      <div className="space-y-2">
        {matches.map(m => (
          <div key={m.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            {/* Status badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              m.status === 'finished' ? 'bg-white/10 text-white/40' :
              m.status === 'live' ? 'bg-green-500/20 text-green-400 animate-pulse' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              {m.status}
            </span>

            {/* Teams */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {m.home_team_flag} {m.home_team} vs {m.away_team} {m.away_team_flag}
              </p>
              <p className="text-xs text-white/40">
                {formatMatchDate(m.kickoff_time)} · {formatKickoffTime(m.kickoff_time)} (مكة)
                {m.venue && ` · ${m.venue}`}
              </p>
            </div>

            {/* Score */}
            {m.status === 'finished' && (
              <span className="text-sm font-bold text-brand-gold">
                {m.home_score} – {m.away_score}
              </span>
            )}

            {/* Stage */}
            <span className="text-xs text-white/30 hidden sm:block">{m.stage}</span>

            {/* Delete */}
            <button
              onClick={() => handleDelete(m.id)}
              disabled={deleting === m.id}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40 ml-2"
            >
              {deleting === m.id ? '…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
