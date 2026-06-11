'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoaderIcon, TagIcon, TrophyIcon } from '@/components/icons'
import { TEAMS } from '@/lib/teams'

const EXAMPLES = ['يلو', 'Falcon', 'نخبتين', 'أبو التوقعات']
const NICKNAME_RE = /^[a-zA-Z0-9_\u0600-\u06FF ]{3,20}$/

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [nickname, setNickname] = useState('')
  const [champion, setChampion] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = search.trim()
    ? TEAMS.filter(t => t.name.includes(search.trim()))
    : TEAMS

  function validate(value: string) {
    if (!value.trim()) return 'الاسم المستعار مطلوب'
    if (!NICKNAME_RE.test(value.trim())) return '٣–٢٠ حرفًا (حروف، أرقام، مسافات، شرطة سفلية)'
    return ''
  }

  async function handleNickname(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = nickname.trim()
    const validationError = validate(trimmed)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('nickname', trimmed).neq('id', user.id).maybeSingle()

    if (existing) {
      setError('هذا الاسم المستعار مستخدم بالفعل. جرّب اسمًا آخر.')
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(2)
  }

  async function handleSubmit() {
    if (!champion) { setError('اختر منتخبًا للمضي قدمًا'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      nickname: nickname.trim(),
      avatar_url: user.user_metadata?.avatar_url ?? null,
      champion_pick: champion,
      onboarding_completed: true,
    })

    if (upsertError) {
      setError(`فشل الحفظ: ${upsertError.message}`)
      setLoading(false)
      return
    }

    router.push('/leaderboard')
  }

  // ── Step 1: Nickname ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green/10 border border-brand-green/30 mb-4">
              <TagIcon size={28} className="text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold text-white">اختر اسمك المستعار</h1>
            <p className="text-sm text-gray-400 mt-1">هذه هويتك في الدوري. اختر بحكمة!</p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-6">
            <form onSubmit={handleNickname} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="nickname" className="text-sm font-medium text-gray-300">الاسم المستعار</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={e => { setNickname(e.target.value); setError('') }}
                  placeholder="مثال: النمر"
                  maxLength={20}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/30 transition-colors text-right"
                />
                {error && <p className="text-red-400 text-xs text-right">{error}</p>}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400">أمثلة</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map(ex => (
                    <button key={ex} type="button" onClick={() => { setNickname(ex); setError('') }}
                      className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-brand-green/40 hover:text-brand-green transition-colors">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !nickname.trim()}
                className="w-full py-3 rounded-xl bg-brand-green text-brand-dark font-semibold hover:bg-emerald-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <LoaderIcon size={18} className="animate-spin" /> : null}
                {loading ? 'جارٍ التحقق…' : 'التالي →'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">الخطوة ١ من ٢</p>
        </div>
      </div>
    )
  }

  // ── Step 2: Champion Pick ─────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 mb-4">
            <TrophyIcon size={28} className="text-brand-gold" />
          </div>
          <h1 className="text-2xl font-bold text-white">من سيفوز بكأس العالم؟</h1>
          <p className="text-sm text-gray-400 mt-1">اختر المنتخب الذي تتوقع أنه سيحمل اللقب</p>
        </div>

        {/* 15 points callout */}
        <div className="glass rounded-xl px-4 py-3 mb-4 flex items-center gap-3 border border-brand-gold/20">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sm font-semibold text-brand-gold">١٥ نقطة إضافية</p>
            <p className="text-xs text-gray-400">إذا فاز المنتخب الذي اخترته بالبطولة</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن منتخب…"
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/30 transition-colors text-right mb-3"
        />

        {/* Teams grid */}
        <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pb-2">
          {filtered.map(team => (
            <button
              key={team.name}
              type="button"
              onClick={() => { setChampion(team.name); setError('') }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${
                champion === team.name
                  ? 'border-brand-gold bg-brand-gold/10 scale-[1.03]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className="text-3xl leading-none">{team.flag}</span>
              <span className={`text-xs font-medium leading-tight ${champion === team.name ? 'text-brand-gold' : 'text-gray-300'}`}>
                {team.name}
              </span>
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-xs text-right mt-2">{error}</p>}

        <div className="mt-4 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !champion}
            className="w-full py-3 rounded-xl bg-brand-green text-brand-dark font-semibold hover:bg-emerald-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <LoaderIcon size={18} className="animate-spin" /> : null}
            {loading ? 'جارٍ الحفظ…' : 'انضم إلى الدوري'}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← رجوع
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-3">الخطوة ٢ من ٢</p>
      </div>
    </div>
  )
}
