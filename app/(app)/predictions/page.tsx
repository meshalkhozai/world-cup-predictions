import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPointsColor } from '@/lib/utils'
import Link from 'next/link'
import type { Prediction, Match } from '@/types'

interface PredictionWithMatch extends Prediction {
  match: Match
}

function getPointsLabelAr(points: number): string {
  if (points === 3) return 'توقع دقيق'
  if (points === 1) return 'نتيجة صحيحة'
  return 'خاطئ'
}

export default async function PredictionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('predictions')
    .select('*, match:matches(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const predictions = (data ?? []) as PredictionWithMatch[]
  const finished = predictions.filter(p => p.match?.status === 'finished')
  const pending = predictions.filter(p => p.match?.status !== 'finished')
  const totalPoints = finished.reduce((sum, p) => sum + p.points_awarded, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">توقعاتي</h1>
        <div className="text-start">
          <p className="text-2xl font-bold text-gradient">{totalPoints}</p>
          <p className="text-xs text-gray-400">مجموع النقاط</p>
        </div>
      </div>

      {predictions.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-gray-400">
          لا توجد توقعات بعد. اذهب إلى المباريات وسجّل توقعك الأول.
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">في انتظار النتيجة</h2>
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {p.match.home_team_flag} {p.match.home_team} ضد {p.match.away_team} {p.match.away_team_flag}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.match.status === 'live' ? '🟢 مباشر الآن' : 'قادمة'}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-bold text-gray-300">
                    {p.predicted_home_score} – {p.predicted_away_score}
                  </p>
                  <p className="text-xs text-gray-500">توقعك</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">النتائج</h2>
          <div className="space-y-2">
            {finished.map(p => (
              <Link key={p.id} href={`/matches/${p.match.id}`} className="block">
                <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {p.match.home_team_flag} {p.match.home_team} ضد {p.match.away_team} {p.match.away_team_flag}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">
                        النتيجة: <span className="text-gray-300 font-medium">{p.match.home_score} – {p.match.away_score}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        توقعك: <span className="text-gray-300 font-medium">{p.predicted_home_score} – {p.predicted_away_score}</span>
                      </span>
                    </div>
                    <p className="text-xs text-brand-green mt-0.5">اضغط لمشاهدة توقعات الجميع ←</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`text-lg font-bold ${getPointsColor(p.points_awarded)}`}>+{p.points_awarded}</p>
                    <p className={`text-xs ${getPointsColor(p.points_awarded)}`}>{getPointsLabelAr(p.points_awarded)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
