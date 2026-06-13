'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatMatchDate, formatKickoffTime, isMatchLocked } from '@/lib/timezone'
import { MatchCard } from './MatchCard'
import type { Match, Prediction } from '@/types'

interface DateGroup {
  dateKey: string
  matches: Match[]
}

interface Props {
  todayMatches: Match[]
  upcomingByDate: DateGroup[]
  pastByDate: DateGroup[]
  predictionMap: Record<string, Prediction>
  userId: string
  finishedCount: number
}

export function MatchesTabs({ todayMatches, upcomingByDate, pastByDate, predictionMap, userId, finishedCount }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'finished'>('upcoming')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 glass rounded-xl p-1">
        <button
          onClick={() => setTab('upcoming')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
            tab === 'upcoming' ? 'bg-brand-green text-brand-dark' : 'text-gray-400 hover:text-white'
          )}
        >
          قادمة
        </button>
        <button
          onClick={() => setTab('finished')}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
            tab === 'finished' ? 'bg-brand-green text-brand-dark' : 'text-gray-400 hover:text-white'
          )}
        >
          منتهية {finishedCount > 0 && <span className="text-xs opacity-70">({finishedCount})</span>}
        </button>
      </div>

      {tab === 'upcoming' ? (
        <div className="space-y-8">
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
                    prediction={predictionMap[m.id] ?? null}
                    userId={userId}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming */}
          {upcomingByDate.length > 0 && (
            <section className="space-y-5">
              <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">قادمة</h2>
              {upcomingByDate.map(({ dateKey, matches }) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-brand-green uppercase tracking-wider">
                      {formatMatchDate(matches[0].kickoff_time)}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    {matches.map(m => !isMatchLocked(m.kickoff_time, m.status) ? (
                      <MatchCard
                        key={m.id}
                        match={m}
                        prediction={predictionMap[m.id] ?? null}
                        userId={userId}
                      />
                    ) : (
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
        </div>
      ) : (
        <div className="space-y-5">
          {pastByDate.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center text-gray-400 text-sm">
              لا توجد مباريات منتهية بعد
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 text-center">اضغط على أي مباراة لمشاهدة توقعات الجميع</p>
              {pastByDate.map(({ dateKey, matches }) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {formatMatchDate(matches[0].kickoff_time)}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    {matches.map(m => (
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
                            <span className="text-[10px] text-brand-green">التوقعات ←</span>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
