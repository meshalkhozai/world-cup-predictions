import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { getPointsColor } from '@/lib/utils'
import type { Match } from '@/types'

interface PredictionRow {
  predicted_home_score: number
  predicted_away_score: number
  points_awarded: number
  created_at: string
  match: Match
}

function getPointsLabelAr(points: number): string {
  if (points === 3) return 'دقيق'
  if (points === 1) return 'صحيح'
  return 'خاطئ'
}

export default async function ProfilePage({ params }: { params: Promise<{ nickname: string }> }) {
  const { nickname } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const decodedNickname = decodeURIComponent(nickname)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, total_points, exact_predictions, correct_predictions, wrong_predictions, created_at')
    .eq('nickname', decodedNickname)
    .single()

  if (!profile) notFound()

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, match:matches(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: true })

  const typedPredictions = ((predictions ?? []) as PredictionRow[])
    .filter(p => p.match?.status === 'finished')
  const totalPredictions = typedPredictions.length
  const isMe = profile.id === user.id

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Profile card */}
      <div className="glass rounded-2xl p-6 flex items-center gap-5">
        {profile.avatar_url ? (
          <Image src={profile.avatar_url} alt={profile.nickname} width={72} height={72} className="rounded-full ring-2 ring-brand-green/30" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-2xl font-bold">
            {profile.nickname[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.nickname}
            {isMe && <span className="me-2 text-sm text-brand-green font-normal">(أنت)</span>}
          </h1>
          <p className="text-sm text-gray-400">
            عضو منذ {new Date(profile.created_at).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="مجموع النقاط" value={profile.total_points} color="text-brand-gold" />
        <StatCard label="توقع دقيق" value={profile.exact_predictions} color="text-brand-gold" />
        <StatCard label="نتيجة صحيحة" value={profile.correct_predictions} color="text-brand-green" />
        <StatCard label="مجموع التوقعات" value={totalPredictions} color="text-white" />
      </div>

      {/* Recent predictions */}
      <section>
        <h2 className="font-semibold text-white mb-3">التوقعات</h2>
        {typedPredictions.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center text-gray-400 text-sm">
            لا توجد توقعات على مباريات منتهية بعد
          </div>
        ) : (
          <div className="space-y-2">
            {typedPredictions.map((p, i) => (
              <div key={i} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {p.match.home_team_flag} {p.match.home_team} ضد {p.match.away_team} {p.match.away_team_flag}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">
                      النتيجة: <span className="text-gray-300 font-medium">{p.match.home_score} – {p.match.away_score}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      التوقع: <span className="text-gray-300 font-medium">{p.predicted_home_score} – {p.predicted_away_score}</span>
                    </span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className={`text-lg font-bold ${getPointsColor(p.points_awarded)}`}>+{p.points_awarded}</p>
                  <p className={`text-xs ${getPointsColor(p.points_awarded)}`}>{getPointsLabelAr(p.points_awarded)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
