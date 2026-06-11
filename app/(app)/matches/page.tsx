import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isMatchToday, matchDateInRiyadh, formatMatchDate, formatKickoffTime } from '@/lib/timezone'
import { MatchCard } from '@/components/matches/MatchCard'
import Link from 'next/link'
import type { Match, Prediction } from '@/types'

function groupByDate(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>()
  for (const m of matches) {
    const key = matchDateInRiyadh(m.kickoff_time)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
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
  const predictionMap = new Map(typedPredictions.map(p => [p.match_id, p]))

  const now = new Date()
  const todayMatches = typedMatches.filter(m => isMatchToday(m.kickoff_time))
  const upcomingMatches = typedMatches.filter(m => !isMatchToday(m.kickoff_time) && new Date(m.kickoff_time) > now && m.status !== 'finished')
  const pastMatches = typedMatches.filter(m => !isMatchToday(m.kickoff_time) && (m.status === 'finished' || new Date(m.kickoff_time) <= now))

  const upcomingByDate = groupByDate(upcomingMatches)
  const pastByDate = groupByDate(pastMatches).reverse()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 animate-fade-in">

      {/* Today */}
      <section>
        <h2 className="font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          مباريات اليوم
        </h2>
        {todayMatches.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center text-gray-400 text-sm">
            لا توجد مباريات اليوم
          </div>
        ) : (
          <div className="space-y-3">
            {todayMatches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predictionMap.get(m.id) ?? null}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Coming Soon */}
      {upcomingByDate.length > 0 && (
        <section className="space-y-5">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">قادمة</h2>
          {upcomingByDate.map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-brand-green uppercase tracking-wider">
                  {formatMatchDate(dayMatches[0].kickoff_time)}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-2">
                {dayMatches.map(m => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="block">
                    <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl">{m.home_team_flag}</span>
                        <span className="text-sm text-white truncate">{m.home_team}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0 px-1">
                        <span className="text-xs font-semibold text-gray-300 tabular-nums">
                          {formatKickoffTime(m.kickoff_time)}
                        </span>
                        <span className="text-[10px] text-gray-500">بتوقيت مكة</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm text-white truncate text-end">{m.away_team}</span>
                        <span className="text-xl">{m.away_team_flag}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Finished */}
      {pastByDate.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">منتهية</h2>
            <span className="text-xs text-gray-500">اضغط على أي مباراة لمشاهدة توقعات الجميع</span>
          </div>
          {pastByDate.map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {formatMatchDate(dayMatches[0].kickoff_time)}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-2">
                {dayMatches.map(m => (
                  <Link key={m.id} href={`/matches/${m.id}`} className="block group">
                    <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl">{m.home_team_flag}</span>
                        <span className="text-sm text-white truncate">{m.home_team}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0 px-2">
                        <span className="text-sm font-bold text-brand-gold">
                          {m.status === 'finished' ? `${m.home_score} – ${m.away_score}` : '–'}
                        </span>
                        <span className="text-[10px] text-brand-green group-hover:underline">التوقعات</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm text-white truncate text-end">{m.away_team}</span>
                        <span className="text-xl">{m.away_team_flag}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
