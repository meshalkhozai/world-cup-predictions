'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoaderIcon, TagIcon } from '@/components/icons'

const EXAMPLES = ['النمر', 'صقر الصحراء', 'المتنبئ', 'أبو التوقعات']
const NICKNAME_RE = /^[a-zA-Z0-9_\u0600-\u06FF ]{3,20}$/

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(value: string) {
    if (!value.trim()) return 'الاسم المستعار مطلوب'
    if (!NICKNAME_RE.test(value.trim())) return '٣–٢٠ حرفًا (حروف، أرقام، مسافات، شرطة سفلية)'
    return ''
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
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

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      nickname: trimmed,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      onboarding_completed: true,
    })

    if (upsertError) {
      setError(`فشل حفظ الاسم: ${upsertError.message}`)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

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
          <p className="text-sm text-white/50 mt-1">هذه هويتك في الدوري. اختر بحكمة!</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="text-sm font-medium text-white/70">الاسم المستعار</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={e => { setNickname(e.target.value); setError('') }}
                placeholder="مثال: النمر"
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/30 transition-colors text-right"
              />
              {error && <p className="text-red-400 text-xs text-right">{error}</p>}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/40">أمثلة</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(ex => (
                  <button key={ex} type="button" onClick={() => { setNickname(ex); setError('') }}
                    className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/60 hover:border-brand-green/40 hover:text-brand-green transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || !nickname.trim()}
              className="w-full py-3 rounded-xl bg-brand-green text-brand-dark font-semibold hover:bg-emerald-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <LoaderIcon size={18} className="animate-spin" /> : null}
              {loading ? 'جارٍ الحفظ…' : 'انضم إلى الدوري'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
