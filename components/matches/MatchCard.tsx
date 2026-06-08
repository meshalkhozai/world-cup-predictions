'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isMatchLocked, formatKickoffTime } from '@/lib/timezone'
import { Countdown } from './Countdown'
import type { Match, Prediction } from '@/types'

interface Props {
  match: Match
  prediction: Prediction | null
  userId: string
}

export function MatchCard({ match, prediction, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const locked = isMatchLocked(match.kickoff_time, match.status)

  const [home, setHome] = useState(prediction?.predicted_home_score?.toString() ?? '')
  const [away, setAway] = useState(prediction?.predicted_away_score?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const h = parseInt(home)
    const a = parseInt(away)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('أدخل نتيجة صحيحة')
      return
    }

    if (isMatchLocked(match.kickoff_time, match.status)) {
      setError('التوقعات مغلقة — المباراة بدأت')
      return
    }

    setSaving(true)
    setError('')

    if (prediction) {
      const { error: err } = await supabase
        .from('predictions')
        .update({ predicted_home_score: h, predicted_away_score: a })
        .eq('id', prediction.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase
        .from('predictions')
        .insert({
          user_id: userId,
          match_id: match.id,
          predicted_home_score: h,
          predicted_away_score: a,
        })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Teams row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-4xl">{match.home_team_flag}</span>
          <span className="text-sm font-semibold text-white text-center leading-tight">{match.home_team}</span>
        </div>

        <div className="flex flex-col items-center gap-1 px-4">
          {match.status === 'finished' ? (
            <span className="text-2xl font-bold text-brand-gold">
              {match.home_score} – {match.away_score}
            </span>
          ) : (
            <>
              <span className="text-xs text-white/50">{formatKickoffTime(match.kickoff_time)}</span>
              <span className="text-xs text-white/30">بتوقيت مكة</span>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-4xl">{match.away_team_flag}</span>
          <span className="text-sm font-semibold text-white text-center leading-tight">{match.away_team}</span>
        </div>
      </div>

      {/* Countdown */}
      {!locked && <Countdown kickoffTime={match.kickoff_time} />}

      {/* Prediction form */}
      {locked ? (
        <div className="rounded-xl bg-white/5 p-3 text-center">
          {prediction ? (
            <p className="text-sm text-white/60">
              توقعك: <span className="text-white font-semibold">
                {prediction.predicted_home_score} – {prediction.predicted_away_score}
              </span>
              {/* {match.status === 'finished' && (
                <span className={`me-2 text-xs font-semibold ${
                  prediction.points_awarded === 3 ? 'text-brand-gold' :
                  prediction.points_awarded === 1 ? 'text-brand-green' : 'text-white'
                }`}>
                  {prediction.points_awarded === 3 ? '+3 توقع دقيق!' :
                   prediction.points_awarded === 1 ? '+1 نتيجة صحيحة' : '+0'}
                </span>
              )} */}
            </p>
          ) : (
            <p className="text-sm text-white/40">التوقعات مغلقة</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <p className="text-xs text-white/50 text-center">توقعك للمباراة</p>
          <div className="flex items-center justify-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={home}
              onChange={e => { setHome(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="0"
              className="w-16 text-center text-xl font-bold px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-green/50 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-white/40 text-xl font-bold">–</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={away}
              onChange={e => { setAway(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="0"
              className="w-16 text-center text-xl font-bold px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-green/50 focus:bg-white/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            disabled={saving || !home || !away}
            className="w-full py-2.5 rounded-xl bg-brand-green text-brand-dark text-sm font-semibold disabled:opacity-40 hover:bg-emerald-400 active:scale-[0.98] transition-all"
          >
            {saving ? 'جارٍ الحفظ…' : saved ? '✓ تم الحفظ!' : prediction ? 'تعديل التوقع' : 'إرسال التوقع'}
          </button>
        </form>
      )}

      <Link
        href={`/matches/${match.id}`}
        className="block text-center text-xs text-white/30 hover:text-brand-green transition-colors"
      >
        {locked ? 'عرض التوقعات والإحصائيات ←' : 'تفاصيل المباراة ←'}
      </Link>
    </div>
  )
}
