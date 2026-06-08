import { createClient } from '@/lib/supabase/server'
import { MatchAdminList } from '@/components/admin/MatchAdminList'
import { SyncButton } from '@/components/admin/SyncButton'
import type { Match } from '@/types'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  const all = (matches ?? []) as Match[]
  const finished = all.filter(m => m.status === 'finished').length
  const upcoming = all.filter(m => m.status === 'upcoming').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Matches</h1>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{upcoming} upcoming</span>
          <span>{finished} finished</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            daily auto-sync
          </span>
        </div>
      </div>

      <SyncButton />
      <MatchAdminList matches={all} />
    </div>
  )
}
