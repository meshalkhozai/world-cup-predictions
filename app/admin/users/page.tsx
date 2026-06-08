import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, nickname, email, avatar_url, total_points, exact_predictions, correct_predictions, wrong_predictions, is_admin, onboarding_completed, created_at')
    .order('created_at', { ascending: false })

  const all = (users ?? []) as {
    id: string
    nickname: string
    email: string
    avatar_url: string | null
    total_points: number
    exact_predictions: number
    correct_predictions: number
    wrong_predictions: number
    is_admin: boolean
    onboarding_completed: boolean
    created_at: string
  }[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">المستخدمون</h1>
        <span className="text-sm text-white/40">{all.length} مستخدم</span>
      </div>

      <div className="space-y-2">
        {all.map(u => (
          <div key={u.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            {u.avatar_url ? (
              <Image src={u.avatar_url} alt={u.nickname} width={36} height={36} className="rounded-full ring-1 ring-white/10 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-sm font-bold shrink-0">
                {u.nickname?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate">{u.nickname || '(بدون اسم)'}</p>
                {u.is_admin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold font-medium">مدير</span>}
                {!u.onboarding_completed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">لم يكمل التسجيل</span>}
              </div>
              <p className="text-xs text-white/40 truncate">{u.email}</p>
            </div>

            <div className="text-end shrink-0 space-y-0.5">
              <p className="text-sm font-bold text-brand-gold">{u.total_points} نقطة</p>
              <p className="text-xs text-white/40">
                {u.exact_predictions}🎯 {u.correct_predictions}✓ {u.wrong_predictions}✗
              </p>
            </div>

            <div className="text-xs text-white/30 shrink-0 hidden sm:block">
              {new Date(u.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
