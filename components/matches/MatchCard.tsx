'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isMatchLocked, hoursUntilPredictionOpen, formatKickoffTime } from '@/lib/timezone'
import { Countdown } from './Countdown'
import type { Match, Prediction } from '@/types'

const KNOCKOUT_STAGES = new Set(['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'])

interface Props {
  match: Match
  prediction: Prediction | null
  userId: string
}

export function MatchCard({ match, prediction, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const locked = isMatchLocked(match.kickoff_time, match.status)
  const hoursLeft = locked && match.status === 'upcoming' ? hoursUntilPredictionOpen(match.kickoff_time) : 0
  const tooEarly = hoursLeft > 0
  const isKnockout = KNOCKOUT_STAGES.has(match.stage)

  const [home, setHome] = useState(prediction?.predicted_home_score?.toString() ?? '')
  const [away, setAway] = useState(prediction?.predicted_away_score?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Popup state for draw in knockout
  const [showDrawPopup, setShowDrawPopup] = useState(false)
  const [pendingH, setPendingH] = useState(0)
  const [pendingA, setPendingA] = useState(0)

  const isDraw = home !== '' && away !== '' && parseInt(home) === parseInt(away)

  async function savePrediction(h: number, a: number, winner?: 'home' | 'away') {
    setSaving(true)
    setError('')

    const payload = {
      predicted_home_score: h,
      predicted_away_score: a,
      predicted_winner: winner ?? null,
    }

    if (prediction) {
      const { error: err } = await supabase
        .from('predictions')
        .update(payload)
        .eq('id', prediction.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase
        .from('predictions')
        .insert({ user_id: userId, match_id: match.id, ...payload })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSaved(true)
    setSaving(false)
    setShowDrawPopup(false)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

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

    // Knockout + draw → show popup to pick winner
    if (isKnockout && h === a) {
      setPendingH(h)
      setPendingA(a)
      setShowDrawPopup(true)
      return
    }

    await savePrediction(h, a)
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      {/* Featured badge */}
      {match.is_featured && (
        <div className="flex items-center justify-center gap-1.5 bg-white/5 rounded-xl py-1.5">
          <span className="text-brand-gold text-xs font-bold tracking-wide">⭐ مباراة مميزة · التوقع الدقيق = نقاط مضاعفة</span>
        </div>
      )}

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
              <span className="text-sm font-bold text-gray-500">ضد</span>
              <span className="text-xs text-gray-400">{formatKickoffTime(match.kickoff_time)}</span>
              <span className="text-xs text-gray-500">بتوقيت مكة</span>
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
          {tooEarly ? (
            <p className="text-sm text-gray-400">
              يفتح التوقع بعد <span className="text-white font-semibold">{Math.ceil(hoursLeft)} ساعة</span>
            </p>
          ) : prediction ? (
            <div>
              <p className="text-sm text-gray-300">
                توقعك: <span className="text-white font-semibold">
                  {prediction.predicted_home_score} – {prediction.predicted_away_score}
                </span>
              </p>
              {prediction.predicted_winner && (
                <p className="text-xs text-gray-400 mt-0.5">
                  متأهل: <span className="text-gray-300 font-medium">
                    {prediction.predicted_winner === 'home' ? match.home_team : match.away_team}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">التوقعات مغلقة</p>
          )}
        </div>
      ) : (
        <>
          <form onSubmit={handleSave} className="space-y-3">
            <p className="text-xs text-gray-400 text-center">توقعك للمباراة</p>
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
              <span className="text-gray-400 text-xl font-bold">ضد</span>
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
            {isKnockout && isDraw && (
              <p className="text-xs text-brand-gold text-center">تعادل — ستُسأل عن المتأهل</p>
            )}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <button
              type="submit"
              disabled={saving || !home || !away}
              className="w-full py-2.5 rounded-xl bg-brand-green text-brand-dark text-sm font-semibold disabled:opacity-40 hover:bg-emerald-400 active:scale-[0.98] transition-all"
            >
              {saving ? 'جارٍ الحفظ…' : saved ? '✓ تم الحفظ!' : prediction ? 'تعديل التوقع' : 'إرسال التوقع'}
            </button>
          </form>

          {/* Draw winner popup */}
          {showDrawPopup && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="text-center space-y-1">
                  <p className="text-white font-bold text-lg">من يتأهل؟</p>
                  <p className="text-gray-400 text-sm">توقعت تعادل <span className="text-white font-semibold">{pendingH}–{pendingA}</span> · اختر الفريق المتأهل</p>
                </div>

                {/* Teams */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => savePrediction(pendingH, pendingA, 'home')}
                    disabled={saving}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-green/50 hover:bg-white/10 active:scale-95 transition-all duration-150 disabled:opacity-40"
                  >
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-150">{match.home_team_flag}</span>
                    <span className="text-sm font-semibold text-white text-center leading-tight">{match.home_team}</span>
                  </button>
                  <button
                    onClick={() => savePrediction(pendingH, pendingA, 'away')}
                    disabled={saving}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-green/50 hover:bg-white/10 active:scale-95 transition-all duration-150 disabled:opacity-40"
                  >
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-150">{match.away_team_flag}</span>
                    <span className="text-sm font-semibold text-white text-center leading-tight">{match.away_team}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowDrawPopup(false)}
                  className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Link
        href={`/matches/${match.id}`}
        className="block text-center text-xs text-gray-500 hover:text-brand-green transition-colors"
      >
        {locked ? 'عرض التوقعات والإحصائيات ←' : 'تفاصيل المباراة ←'}
      </Link>
    </div>
  )
}
