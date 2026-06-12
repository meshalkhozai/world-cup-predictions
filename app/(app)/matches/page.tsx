import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isMatchToday, matchDateInRiyadh } from '@/lib/timezone'
import { MatchesTabs } from '@/components/matches/MatchesTabs'
import type { Match, Prediction } from '@/types'

function groupByDate(matches: Match[]) {
  const map = new Map<string, Match[]>()
  for (const m of matches) {
    const key = matchDateInRiyadh(m.kickoff_time)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, matches]) => ({ dateKey, matches }))
}

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', user.id),
  ])

  const typedMatches = (matches ?? []) as Match[]
  const typedPredictions = (predictions ?? []) as Prediction[]
  const predictionMap = Object.fromEntries(typedPredictions.map(p => [p.match_id, p]))

  const now = new Date()
  const todayMatches = typedMatches.filter(m => isMatchToday(m.kickoff_time) && m.status !== 'finished')
  const upcomingMatches = typedMatches.filter(m => !isMatchToday(m.kickoff_time) && new Date(m.kickoff_time) > now && m.status !== 'finished')
  const pastMatches = typedMatches.filter(m => m.status === 'finished' || (!isMatchToday(m.kickoff_time) && new Date(m.kickoff_time) <= now))

  const upcomingByDate = groupByDate(upcomingMatches)
  const pastByDate = groupByDate(pastMatches).reverse()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">المباريات</h1>
      <MatchesTabs
        todayMatches={todayMatches}
        upcomingByDate={upcomingByDate}
        pastByDate={pastByDate}
        predictionMap={predictionMap}
        userId={user.id}
        finishedCount={pastMatches.length}
      />
    </div>
  )
}
