import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { TrophyIcon, ClipboardIcon, ZapIcon } from '@/components/icons'
import { isMatchToday, isMatchLocked, formatKickoffTime } from '@/lib/timezone'
import type { Match, Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  const { data: leaderboard } = await supabase.rpc('get_leaderboard')
  const { data: allMatches } = await supabase.from('matches').select('*').order('kickoff_time', { ascending: true })

  const typedProfile = profile as Profile
  const myRank = (leaderboard as { id: string; rank: number }[] | null)?.find(e => e.id === user.id)?.rank ?? '—'
  const todayMatches = ((allMatches ?? []) as Match[]).filter(m => isMatchToday(m.kickoff_time))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* User card */}
      <div className="glass rounded-2xl p-5 flex items-center gap-4">
        {typedProfile.avatar_url ? (
          <Image src={typedProfile.avatar_url} alt={typedProfile.nickname} width={56} height={56} className="rounded-full ring-2 ring-brand-green/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-xl font-bold">
            {typedProfile.nickname[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wider">أهلاً بعودتك</p>
          <h2 className="text-xl font-bold text-white truncate">{typedProfile.nickname}</h2>
        </div>
        <div className="text-start">
          <p className="text-2xl font-bold text-gradient">{typedProfile.total_points}</p>
          <p className="text-xs text-gray-400">نقطة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="الترتيب" value={myRank === '—' ? '—' : `#${myRank}`} color="text-brand-gold" />
        <StatCard label="توقع دقيق" value={typedProfile.exact_predictions} color="text-brand-green" />
        <StatCard label="نتيجة صحيحة" value={typedProfile.correct_predictions} color="text-blue-400" />
      </div>

      {/* Today's matches */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ZapIcon size={16} className="text-brand-green" />
            مباريات اليوم
          </h3>
          <Link href="/matches" className="text-xs text-brand-green hover:underline">عرض الكل ←</Link>
        </div>

        {todayMatches.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center text-gray-400 text-sm">
            لا توجد مباريات مجدولة اليوم
          </div>
        ) : (
          <div className="space-y-2">
            {todayMatches.map((match) => (
              <Link key={match.id} href="/matches">
                <div className="glass glass-hover rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{match.home_team_flag}</span>
                    <span className="text-sm font-medium text-white truncate">{match.home_team}</span>
                  </div>
                  <div className="text-center px-3">
                    {isMatchLocked(match.kickoff_time, match.status) ? (
                      <span className="text-xs font-bold text-gray-300">
                        {match.status === 'finished' ? `${match.home_score} - ${match.away_score}` : 'مباشر'}
                      </span>
                    ) : (
                      <span className="text-xs text-brand-green font-medium">{formatKickoffTime(match.kickoff_time)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-sm font-medium text-white truncate text-end">{match.away_team}</span>
                    <span className="text-lg">{match.away_team_flag}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/leaderboard" className="glass glass-hover rounded-xl p-4 flex flex-col items-center gap-2">
          <TrophyIcon size={24} className="text-brand-gold" />
          <p className="text-sm font-medium text-white">الترتيب</p>
        </Link>
        <Link href="/predictions" className="glass glass-hover rounded-xl p-4 flex flex-col items-center gap-2">
          <ClipboardIcon size={24} className="text-brand-green" />
          <p className="text-sm font-medium text-white">توقعاتي</p>
        </Link>
      </section>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
