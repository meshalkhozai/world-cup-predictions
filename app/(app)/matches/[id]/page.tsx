import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { isMatchLocked, formatMatchDate, formatKickoffTime } from '@/lib/timezone'
import { getPointsColor } from '@/lib/utils'
import { ArrowRightIcon } from '@/components/icons'
import type { Match, Prediction } from '@/types'

interface PublicPrediction {
  nickname: string
  avatar_url: string | null
  predicted_home_score: number
  predicted_away_score: number
  points_awarded: number
}

interface InsightRow {
  total_predictions: number
  home_win_pct: number
  draw_pct: number
  away_win_pct: number
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: match } = await supabase.from('matches').select('*').eq('id', id).single()
  if (!match) notFound()

  const typedMatch = match as Match
  const locked = isMatchLocked(typedMatch.kickoff_time, typedMatch.status)

  const { data: myPrediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  let publicPredictions: PublicPrediction[] = []
  let insights: InsightRow | null = null

  if (locked) {
    const [{ data: preds }, { data: ins }] = await Promise.all([
      supabase
        .from('predictions')
        .select('predicted_home_score, predicted_away_score, points_awarded, profiles(nickname, avatar_url)')
        .eq('match_id', id)
        .order('created_at', { ascending: true }),
      supabase.rpc('get_match_insights', { p_match_id: id }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publicPredictions = ((preds ?? []) as any[]).map((p: any) => ({
      nickname: (Array.isArray(p.profiles) ? p.profiles[0]?.nickname : p.profiles?.nickname) ?? 'مجهول',
      avatar_url: (Array.isArray(p.profiles) ? p.profiles[0]?.avatar_url : p.profiles?.avatar_url) ?? null,
      predicted_home_score: p.predicted_home_score,
      predicted_away_score: p.predicted_away_score,
      points_awarded: p.points_awarded,
    }))

    insights = ((ins ?? []) as InsightRow[])[0] ?? null
  }

  const typedMyPrediction = myPrediction as Prediction | null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <Link href="/matches" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
        <ArrowRightIcon size={15} />
        العودة للمباريات
      </Link>

      {/* Match header */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{formatMatchDate(typedMatch.kickoff_time)}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            typedMatch.status === 'finished' ? 'bg-white/10 text-white/40' :
            typedMatch.status === 'live' ? 'bg-green-500/20 text-green-400' :
            'bg-blue-500/10 text-blue-400'
          }`}>
            {typedMatch.status === 'finished' ? 'منتهية' : typedMatch.status === 'live' ? 'مباشر' : 'قادمة'}
          </span>
          <span>{formatKickoffTime(typedMatch.kickoff_time)} (بتوقيت مكة)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-5xl">{typedMatch.home_team_flag}</span>
            <span className="text-sm font-bold text-white text-center">{typedMatch.home_team}</span>
          </div>

          <div className="flex flex-col items-center px-4">
            {typedMatch.status === 'finished' ? (
              <span className="text-3xl font-bold text-brand-gold">
                {typedMatch.home_score} – {typedMatch.away_score}
              </span>
            ) : (
              <span className="text-xl font-bold text-white/30">ضد</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-5xl">{typedMatch.away_team_flag}</span>
            <span className="text-sm font-bold text-white text-center">{typedMatch.away_team}</span>
          </div>
        </div>

        {typedMyPrediction && (
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-xs text-white/50 mb-1">توقعك</p>
            <p className="text-lg font-bold text-white">
              {typedMyPrediction.predicted_home_score} – {typedMyPrediction.predicted_away_score}
            </p>
            {typedMatch.status === 'finished' && (
              <p className={`text-sm font-semibold mt-1 ${getPointsColor(typedMyPrediction.points_awarded)}`}>
                {typedMyPrediction.points_awarded === 3 ? '🎯 توقع دقيق! +3 نقاط' :
                 typedMyPrediction.points_awarded === 1 ? '✓ نتيجة صحيحة +1 نقطة' : '✗ توقع خاطئ +0'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lock message */}
      {!locked && (
        <div className="glass rounded-xl p-4 text-center text-sm text-white/50">
          🔒 توقعات المستخدمين ستظهر بعد انطلاق المباراة
        </div>
      )}

      {/* Community insights */}
      {locked && insights && insights.total_predictions > 0 && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">توقعات المجتمع</h2>
            <span className="text-xs text-white/40">{insights.total_predictions} توقع</span>
          </div>
          <div className="space-y-2">
            <PctBar label={typedMatch.home_team} flag={typedMatch.home_team_flag ?? ''} pct={insights.home_win_pct} color="bg-blue-500" />
            <PctBar label="تعادل" flag="🤝" pct={insights.draw_pct} color="bg-yellow-500" />
            <PctBar label={typedMatch.away_team} flag={typedMatch.away_team_flag ?? ''} pct={insights.away_win_pct} color="bg-purple-500" />
          </div>
        </div>
      )}

      {/* Public predictions */}
      {locked && publicPredictions.length > 0 && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-white">جميع التوقعات</h2>
          <div className="space-y-2">
            {publicPredictions.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt={p.nickname} width={28} height={28} className="rounded-full ring-1 ring-white/10 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold shrink-0">
                    {p.nickname[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-white flex-1 truncate">{p.nickname}</span>
                <span className="text-sm font-bold text-white/70">
                  {p.predicted_home_score} – {p.predicted_away_score}
                </span>
                {typedMatch.status === 'finished' && (
                  <span className={`text-xs font-semibold w-14 text-end ${getPointsColor(p.points_awarded)}`}>
                    +{p.points_awarded} نقطة
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {locked && publicPredictions.length === 0 && (
        <div className="glass rounded-xl p-6 text-center text-white/40 text-sm">
          لم يتم تسجيل أي توقعات لهذه المباراة
        </div>
      )}
    </div>
  )
}

function PctBar({ label, flag, pct, color }: { label: string; flag: string; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{flag} {label}</span>
        <span className="font-semibold text-white">{pct}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
